"""
Qdrant Vector Database Client

Connection and operations for Qdrant vector storage (RAG).
"""

from typing import Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, Distance, PointStruct,
    Filter, FieldCondition, MatchValue
)

from config import settings


class QdrantVectorClient:
    """Qdrant client for vector storage and retrieval."""
    
    _client: Optional[QdrantClient] = None
    COLLECTION_NAME = "edgecase_embeddings"
    VECTOR_SIZE = 768  # nomic-embed-text size
    
    @classmethod
    def get_client(cls) -> QdrantClient:
        """Get or create Qdrant client."""
        if cls._client is None:
            cls._client = QdrantClient(
                url=settings.qdrant_url,
                api_key=settings.qdrant_api_key,
            )
        return cls._client
    
    @classmethod
    def ensure_collection(cls):
        """Ensure the collection exists."""
        client = cls.get_client()
        collections = client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        if cls.COLLECTION_NAME not in collection_names:
            client.create_collection(
                collection_name=cls.COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=cls.VECTOR_SIZE,
                    distance=Distance.COSINE,
                ),
            )
            print(f"✅ Created Qdrant collection: {cls.COLLECTION_NAME}")
    
    @classmethod
    def upsert_vectors(
        cls,
        ids: list[str],
        vectors: list[list[float]],
        payloads: list[dict],
    ):
        """Upsert vectors with payloads."""
        import uuid
        
        client = cls.get_client()
        
        # Convert string IDs to UUIDs (Qdrant requires UUID or int)
        def to_uuid(s: str) -> str:
            """Convert any string to a valid UUID using namespace."""
            return str(uuid.uuid5(uuid.NAMESPACE_DNS, s))
        
        points = [
            PointStruct(id=to_uuid(i), vector=v, payload={**p, "original_id": i})
            for i, v, p in zip(ids, vectors, payloads)
        ]
        client.upsert(
            collection_name=cls.COLLECTION_NAME,
            points=points,
        )
    
    @classmethod
    def search(
        cls,
        query_vector: list[float],
        limit: int = 5,
        filter_conditions: Optional[dict] = None,
    ) -> list[dict]:
        """Search for similar vectors."""
        client = cls.get_client()
        
        query_filter = None
        if filter_conditions:
            query_filter = Filter(
                must=[
                    FieldCondition(key=k, match=MatchValue(value=v))
                    for k, v in filter_conditions.items()
                ]
            )
        
        # Use query_points instead of deprecated/missing search
        response = client.query_points(
            collection_name=cls.COLLECTION_NAME,
            query=query_vector,
            limit=limit,
            query_filter=query_filter,
        )
        
        # response.points contains the list of ScoredPoint
        results = response.points
        
        return [
            {
                "id": hit.id,
                "score": hit.score,
                "payload": hit.payload,
            }
            for hit in results
        ]
    
    @classmethod
    def delete_vectors(cls, ids: list[str]):
        """Delete vectors by IDs."""
        client = cls.get_client()
        client.delete(
            collection_name=cls.COLLECTION_NAME,
            points_selector=ids,
        )


qdrant_client = QdrantVectorClient()
