"""
Graph API Endpoints

Neo4j graph data for 3D visualization with real-time WebSocket updates.
"""

import asyncio
import json
import logging
from typing import Optional
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class GraphNode(BaseModel):
    """Node in the supply chain graph."""
    id: str
    label: str
    type: str  # "vendor", "country", "product", "event"
    properties: dict = {}
    risk_score: Optional[float] = None
    color: Optional[str] = None


class GraphLink(BaseModel):
    """Link/edge in the supply chain graph."""
    source: str
    target: str
    type: str  # "supplies_to", "located_in", "affected_by", "depends_on"
    properties: dict = {}
    weight: float = 1.0


class GraphData(BaseModel):
    """Complete graph data for visualization."""
    nodes: list[GraphNode]
    links: list[GraphLink]


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients."""
        if not self.active_connections:
            return
        
        data = json.dumps(message)
        for connection in self.active_connections[:]:
            try:
                await connection.send_text(data)
            except Exception:
                self.disconnect(connection)


# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time graph updates."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, wait for client messages
            data = await websocket.receive_text()
            # Echo or handle commands if needed
            await websocket.send_text(json.dumps({"type": "ack", "data": data}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        manager.disconnect(websocket)


async def broadcast_risk_change(affected_nodes: list[str], risk_scores: dict[str, float]):
    """Broadcast risk change to all connected graph clients."""
    await manager.broadcast({
        "type": "risk_change",
        "payload": {
            "affectedNodes": affected_nodes,
            "riskScores": risk_scores,
        }
    })


async def broadcast_new_event(event_node: dict, affected_nodes: list[str]):
    """Broadcast new event detection to graph clients."""
    await manager.broadcast({
        "type": "new_event",
        "payload": {
            "newNode": event_node,
            "affectedNodes": affected_nodes,
        }
    })


@router.get("/full", response_model=GraphData)
async def get_full_graph(
    max_nodes: int = Query(default=2000, ge=10, le=10000),
):
    """Get full supply chain graph for 3D visualization from Neo4j."""
    from db.neo4j_client import neo4j_client
    
    nodes = []
    links = []
    
    try:
        # Query all nodes from Neo4j
        node_query = """
        MATCH (n)
        WHERE n:Vendor OR n:Country OR n:Product OR n:Event
        RETURN n, labels(n) as labels
        LIMIT $limit
        """
        node_results = await neo4j_client.execute_query(node_query, {"limit": max_nodes})
        
        for record in node_results:
            node_data = record.get("n", {})
            labels = record.get("labels", [])
            
            # Determine node type from label
            node_type = "vendor"
            if "Country" in labels:
                node_type = "country"
            elif "Product" in labels:
                node_type = "product"
            elif "Event" in labels:
                node_type = "event"
            
            # Get risk score and calculate color
            risk_score = node_data.get("risk_score", 0.3)
            if isinstance(risk_score, str):
                try:
                    risk_score = float(risk_score)
                except:
                    risk_score = 0.3
            
            # Color based on risk
            if risk_score >= 0.7:
                color = "#ef4444"  # red
            elif risk_score >= 0.5:
                color = "#f97316"  # orange
            elif risk_score >= 0.3:
                color = "#eab308"  # yellow
            else:
                color = "#22c55e"  # green
            
            # Blue for products
            if node_type == "product":
                color = "#3b82f6"
            
            # Helper to safely serialize Neo4j types
            def serialize_props(props):
                safe_props = {}
                for k, v in props.items():
                    if k in ["id", "name", "title", "risk_score"]:
                        continue
                    if hasattr(v, 'isoformat'):
                        safe_props[k] = v.isoformat()
                    elif hasattr(v, 'to_native'): # Some neo4j types
                        safe_props[k] = str(v.to_native())
                    elif type(v).__name__ == "DateTime": # Fallback check
                        safe_props[k] = str(v)
                    else:
                        safe_props[k] = v
                return safe_props

            node_id = node_data.get("id", str(hash(str(node_data)))[:8])
            nodes.append(GraphNode(
                id=node_id,
                label=node_data.get("name", node_data.get("title", "Unknown")),
                type=node_type,
                properties=serialize_props(node_data),
                risk_score=risk_score,
                color=color,
            ))
        
        # Query all relationships
        rel_query = """
        MATCH (a)-[r]->(b)
        WHERE (a:Vendor OR a:Country OR a:Product OR a:Event)
          AND (b:Vendor OR b:Country OR b:Product OR b:Event)
        RETURN a.id as source, b.id as target, type(r) as rel_type
        LIMIT $limit
        """
        rel_results = await neo4j_client.execute_query(rel_query, {"limit": max_nodes * 2})
        
        for record in rel_results:
            source = record.get("source")
            target = record.get("target")
            if source and target:
                links.append(GraphLink(
                    source=source,
                    target=target,
                    type=record.get("rel_type", "related_to"),
                ))
        
        logger.info(f"Graph API: Returning {len(nodes)} nodes and {len(links)} links from Neo4j")
        
    except Exception as e:
        logger.warning(f"Failed to fetch from Neo4j: {e}. Returning empty graph.")
    
    return GraphData(nodes=nodes, links=links)


@router.get("/affected")
async def get_affected_nodes(
    hours: int = Query(default=24, ge=1, le=168),
):
    """Get nodes affected by recent events."""
    # TODO: Query Neo4j for nodes affected by events in last N hours
    return {
        "affected_nodes": [],
        "events": [],
        "hours": hours,
    }


@router.get("/subgraph/{node_id}")
async def get_subgraph(
    node_id: str,
    depth: int = Query(default=2, ge=1, le=5),
):
    """Get subgraph centered on a specific node."""
    # TODO: Fetch from Neo4j
    return GraphData(nodes=[], links=[])


@router.get("/vendors")
async def get_vendor_graph():
    """Get vendor relationship graph."""
    # TODO: Fetch from Neo4j
    return GraphData(nodes=[], links=[])


@router.get("/countries")
async def get_country_graph():
    """Get country trade relationship graph."""
    # TODO: Fetch from Neo4j
    return GraphData(nodes=[], links=[])


@router.get("/path")
async def find_path(
    source_id: str,
    target_id: str,
):
    """Find shortest path between two nodes."""
    # TODO: Implement with Neo4j path finding
    return {"path": [], "length": 0}


@router.get("/risk-propagation/{event_id}")
async def get_risk_propagation(event_id: str):
    """Get risk propagation graph from an event."""
    # TODO: Implement with Neo4j
    return GraphData(nodes=[], links=[])


@router.get("/clusters")
async def get_clusters():
    """Get detected clusters in the supply chain."""
    # TODO: Implement clustering algorithm
    return {"clusters": []}


@router.post("/search")
async def search_graph(
    query: str,
    node_types: Optional[list[str]] = None,
):
    """Search for nodes in the graph."""
    # TODO: Implement search
    return {"results": []}
