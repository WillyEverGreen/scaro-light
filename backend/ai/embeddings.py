"""
Vector Embeddings

Generate and store embeddings for RAG using NVIDIA API.
"""

from typing import Optional
import hashlib

from openai import OpenAI
from qdrant_client.models import PointStruct

from config import settings
from db.qdrant_client import qdrant_client


class EmbeddingsService:
    """
    Embeddings service for RAG.
    
    Uses NVIDIA API for embedding generation and Qdrant for storage.
    """
    
    CHUNK_SIZE = 500  # Characters per chunk
    CHUNK_OVERLAP = 50
    
    def __init__(self):
        self.model = settings.nvidia_embedding_model
        self.client = OpenAI(
            api_key=settings.nvidia_api_key,
            base_url=settings.nvidia_base_url,
        )
    
    def generate_embedding(self, text: str) -> list[float]:
        """
        Generate embedding for text using NVIDIA API.
        
        Args:
            text: Input text
            
        Returns:
            Embedding vector
        """
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=text,
                encoding_format="float"
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Embedding error: {e}")
            return []
    
    def chunk_text(self, text: str) -> list[str]:
        """
        Split text into overlapping chunks.
        
        Args:
            text: Input text
            
        Returns:
            List of text chunks
        """
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.CHUNK_SIZE
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                if last_period > self.CHUNK_SIZE // 2:
                    chunk = chunk[:last_period + 1]
                    end = start + last_period + 1
            
            chunks.append(chunk.strip())
            start = end - self.CHUNK_OVERLAP
        
        return [c for c in chunks if c]
    
    def generate_id(self, text: str) -> str:
        """Generate unique ID for text chunk."""
        return hashlib.md5(text.encode()).hexdigest()
    
    async def index_document(
        self,
        doc_id: str,
        title: str,
        content: str,
        metadata: Optional[dict] = None,
    ) -> int:
        """
        Index a document by chunking and storing embeddings.
        
        Args:
            doc_id: Document identifier
            title: Document title
            content: Document text
            metadata: Additional metadata
            
        Returns:
            Number of chunks indexed
        """
        # Chunk the content
        chunks = self.chunk_text(content)
        
        # Generate embeddings and store
        ids = []
        vectors = []
        payloads = []
        
        for i, chunk in enumerate(chunks):
            chunk_id = f"{doc_id}_{i}"
            embedding = self.generate_embedding(chunk)
            
            if embedding:
                ids.append(chunk_id)
                vectors.append(embedding)
                payloads.append({
                    "doc_id": doc_id,
                    "title": title,
                    "chunk_index": i,
                    "text": chunk,
                    **(metadata or {}),
                })
        
        # Store in Qdrant
        if ids:
            qdrant_client.ensure_collection()
            qdrant_client.upsert_vectors(ids, vectors, payloads)
        
        return len(ids)
    
    async def search_similar(
        self,
        query: str,
        limit: int = 5,
        filter_conditions: Optional[dict] = None,
    ) -> list[dict]:
        """
        Search for similar content.
        
        Args:
            query: Search query
            limit: Maximum results
            filter_conditions: Optional filters
            
        Returns:
            List of matching chunks with scores
        """
        # Generate query embedding
        query_embedding = self.generate_embedding(query)
        
        if not query_embedding:
            return []
        
        # Search Qdrant
        results = qdrant_client.search(
            query_embedding,
            limit=limit,
            filter_conditions=filter_conditions,
        )
        
        return results
    
    async def delete_document(self, doc_id: str):
        """Delete all chunks for a document."""
        # Note: Would need to implement filtered deletion in qdrant_client
        pass


# Global instance
embeddings_service = EmbeddingsService()
