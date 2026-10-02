"""
RAG Query System

Retrieval-Augmented Generation for natural language queries.
"""

import time
from typing import Optional, AsyncGenerator
from dataclasses import dataclass

from ai.nvidia_client import nvidia_client
from ai.embeddings import embeddings_service


@dataclass
class RAGResponse:
    """RAG query response."""
    query: str
    answer: str
    sources: list[dict]
    confidence: float
    processing_time_ms: int


class RAGService:
    """
    RAG service for natural language queries about supply chain data.
    
    Combines vector search with LLM generation.
    """
    
    def __init__(self):
        self.embeddings = embeddings_service
        self.llm = nvidia_client
    
    async def query(
        self,
        query: str,
        context_limit: int = 5,
        include_sources: bool = True,
    ) -> RAGResponse:
        """
        Answer a query using RAG.
        
        Args:
            query: User query
            context_limit: Maximum context chunks to retrieve
            include_sources: Whether to return source citations
            
        Returns:
            RAGResponse with answer and sources
        """
        start_time = time.time()
        
        # Search for relevant context
        search_results = await self.embeddings.search_similar(
            query,
            limit=context_limit,
        )
        
        # Build context from results
        context_parts = []
        sources = []
        
        for result in search_results:
            payload = result.get("payload", {})
            context_parts.append(payload.get("text", ""))
            
            if include_sources:
                sources.append({
                    "id": result.get("id", ""),
                    "title": payload.get("title", "Unknown"),
                    "url": payload.get("url", ""),
                    "type": payload.get("type", "document"),
                    "relevance_score": result.get("score", 0),
                    "snippet": payload.get("text", "")[:200] + "...",
                })
        
        context = "\n\n".join(context_parts)
        
        # Generate answer with context
        if context:
            prompt = f"""Based on the following context, answer the user's question about supply chain risks.

Context:
{context}

Question: {query}

Provide a clear, informative answer based on the context. If the context doesn't contain relevant information, say so and provide general guidance."""
        else:
            prompt = f"""Answer the following question about supply chain risks.

Question: {query}

Note: No specific data has been indexed yet. Provide general guidance based on your knowledge of supply chain management."""
        
        answer = await self.llm.generate(prompt, temperature=0.5)
        
        # Calculate confidence based on search results
        confidence = 0.0
        if search_results:
            avg_score = sum(r.get("score", 0) for r in search_results) / len(search_results)
            confidence = min(avg_score, 1.0)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return RAGResponse(
            query=query,
            answer=answer,
            sources=sources,
            confidence=confidence,
            processing_time_ms=processing_time,
        )
    
    async def query_stream(
        self,
        query: str,
        context_limit: int = 5,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a RAG response.
        
        Yields:
            Text chunks
        """
        # Search for context
        search_results = await self.embeddings.search_similar(
            query,
            limit=context_limit,
        )
        
        context_parts = [r.get("payload", {}).get("text", "") for r in search_results]
        context = "\n\n".join(context_parts)
        
        if context:
            prompt = f"""Based on the following context, answer the user's question.

Context:
{context}

Question: {query}"""
        else:
            prompt = f"Answer this supply chain question: {query}"
        
        async for chunk in self.llm.generate_stream(prompt):
            yield chunk
    
    async def explain_risk(self, risk_id: str) -> str:
        """Get AI explanation for a specific risk."""
        # TODO: Fetch risk details from database
        prompt = f"""Explain the supply chain risk with ID {risk_id}.
Describe the risk factors, potential impacts, and recommended mitigation strategies."""
        
        return await self.llm.generate(prompt)
    
    def get_suggested_queries(self) -> list[str]:
        """Get suggested queries for users."""
        return [
            "What semiconductor shortages are currently affecting supply chains?",
            "Which vendors have the highest concentration risk?",
            "What weather events are impacting shipping routes this week?",
            "Are there any new trade restrictions affecting China?",
            "What is the current risk level for automotive supply chains?",
            "Explain the ripple effect of Taiwan semiconductor disruptions",
            "Which countries have the highest supply chain fragility?",
            "What overconfidence risks should we be aware of?",
        ]


# Global instance
rag_service = RAGService()
