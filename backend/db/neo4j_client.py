"""
Neo4j Graph Database Client

Connection and operations for Neo4j.
"""

from typing import Optional, Any
from neo4j import AsyncGraphDatabase, AsyncDriver

from config import settings


class Neo4jClient:
    """Async Neo4j client for graph operations."""
    
    _driver: Optional[AsyncDriver] = None
    
    @classmethod
    async def get_driver(cls) -> AsyncDriver:
        """Get or create Neo4j driver."""
        if cls._driver is None:
            cls._driver = AsyncGraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password),
            )
        return cls._driver
    
    @classmethod
    async def close(cls):
        """Close the driver."""
        if cls._driver:
            await cls._driver.close()
            cls._driver = None
    
    @classmethod
    async def execute_query(
        cls,
        query: str,
        parameters: Optional[dict] = None,
        database: str = "neo4j",
    ) -> list[dict]:
        """Execute a Cypher query and return results."""
        driver = await cls.get_driver()
        async with driver.session(database=database) as session:
            result = await session.run(query, parameters or {})
            records = await result.data()
            return records
    
    @classmethod
    async def create_vendor_node(cls, vendor: dict) -> dict:
        """Create a vendor node in the graph."""
        query = """
        MERGE (v:Vendor {id: $id})
        SET v.name = $name,
            v.country = $country,
            v.industry = $industry,
            v.tier = $tier,
            v.risk_score = $risk_score,
            v.updated_at = datetime()
        RETURN v
        """
        result = await cls.execute_query(query, vendor)
        return result[0] if result else {}
    
    @classmethod
    async def create_country_node(cls, country: dict) -> dict:
        """Create a country node in the graph."""
        query = """
        MERGE (c:Country {code: $code})
        SET c.name = $name,
            c.region = $region,
            c.risk_score = $risk_score,
            c.is_sanctioned = $is_sanctioned,
            c.updated_at = datetime()
        RETURN c
        """
        result = await cls.execute_query(query, country)
        return result[0] if result else {}
    
    @classmethod
    async def create_event_node(cls, event: dict) -> dict:
        """Create an event node in the graph."""
        query = """
        MERGE (e:Event {id: $id})
        SET e.title = $title,
            e.category = $category,
            e.severity = $severity,
            e.impact_score = $impact_score,
            e.country = $country,
            e.created_at = datetime()
        RETURN e
        """
        result = await cls.execute_query(query, event)
        return result[0] if result else {}
    
    @classmethod
    async def create_relationship(
        cls,
        from_type: str,
        from_id: str,
        to_type: str,
        to_id: str,
        rel_type: str,
        properties: Optional[dict] = None,
    ) -> dict:
        """Create a relationship between two nodes."""
        query = f"""
        MATCH (a:{from_type} {{id: $from_id}})
        MATCH (b:{to_type} {{id: $to_id}})
        MERGE (a)-[r:{rel_type}]->(b)
        SET r += $properties
        RETURN type(r) as relationship
        """
        result = await cls.execute_query(query, {
            "from_id": from_id,
            "to_id": to_id,
            "properties": properties or {},
        })
        return result[0] if result else {}
    
    @classmethod
    async def get_supply_chain_graph(cls, limit: int = 500) -> dict:
        """Get the full supply chain graph for visualization."""
        query = """
        MATCH (n)
        WITH n LIMIT $limit
        OPTIONAL MATCH (n)-[r]->(m)
        RETURN collect(DISTINCT n) as nodes, collect(DISTINCT r) as relationships
        """
        result = await cls.execute_query(query, {"limit": limit})
        return result[0] if result else {"nodes": [], "relationships": []}
    
    @classmethod
    async def get_risk_propagation(cls, event_id: str, depth: int = 3) -> dict:
        """Get risk propagation from an event."""
        query = """
        MATCH path = (e:Event {id: $event_id})-[*1..$depth]-(n)
        RETURN nodes(path) as nodes, relationships(path) as relationships
        """
        result = await cls.execute_query(query, {"event_id": event_id, "depth": depth})
        return result
    
    @classmethod
    async def find_shortest_path(cls, from_id: str, to_id: str) -> list:
        """Find shortest path between two nodes."""
        query = """
        MATCH path = shortestPath((a {id: $from_id})-[*]-(b {id: $to_id}))
        RETURN nodes(path) as nodes, relationships(path) as relationships
        """
        result = await cls.execute_query(query, {"from_id": from_id, "to_id": to_id})
        return result

    @classmethod
    async def create_product_node(cls, product: dict) -> dict:
        """Create a product/commodity node (SSD, RAM, GPU, etc.)."""
        query = """
        MERGE (p:Product {id: $id})
        SET p.name = $name,
            p.category = $category,
            p.risk_score = $risk_score,
            p.updated_at = datetime()
        RETURN p
        """
        result = await cls.execute_query(query, product)
        return result[0] if result else {}

    @classmethod
    async def update_node_risk(cls, node_id: str, risk_score: float, reason: str = "") -> dict:
        """Update risk score for any node type."""
        query = """
        MATCH (n {id: $node_id})
        SET n.risk_score = $risk_score,
            n.risk_reason = $reason,
            n.risk_updated_at = datetime()
        RETURN n
        """
        result = await cls.execute_query(query, {
            "node_id": node_id,
            "risk_score": risk_score,
            "reason": reason,
        })
        return result[0] if result else {}

    @classmethod
    async def get_affected_nodes(cls, event_id: str, max_depth: int = 3) -> list[str]:
        """Get IDs of all nodes affected by an event (for graph animation)."""
        query = """
        MATCH path = (e:Event {id: $event_id})-[*1..$depth]-(n)
        RETURN DISTINCT n.id as node_id
        """
        result = await cls.execute_query(query, {"event_id": event_id, "depth": max_depth})
        return [r["node_id"] for r in result if r.get("node_id")]

    @classmethod
    async def link_event_to_commodity(cls, event_id: str, commodity_id: str) -> dict:
        """Link an event to an affected commodity/product."""
        return await cls.create_relationship(
            from_type="Event",
            from_id=event_id,
            to_type="Product",
            to_id=commodity_id,
            rel_type="AFFECTS",
            properties={"created_at": "datetime()"},
        )


neo4j_client = Neo4jClient()

