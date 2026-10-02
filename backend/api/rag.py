"""
RAG API Endpoints

Retrieval-Augmented Generation for natural language queries.
Uses Qdrant for context retrieval and NVIDIA NIM for response generation.
"""

import logging
import time
from datetime import datetime
from typing import Optional, AsyncGenerator
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class QueryRequest(BaseModel):
    """RAG query request."""
    query: str
    context_limit: int = 5
    include_sources: bool = True


class Source(BaseModel):
    """Source citation."""
    id: str
    title: str
    url: Optional[str]
    type: str
    relevance_score: float
    snippet: str


class QueryResponse(BaseModel):
    """RAG query response."""
    query: str
    answer: str
    sources: list[Source]
    confidence: float
    processing_time_ms: int


class QueryHistory(BaseModel):
    """Query history item."""
    id: str
    query: str
    answer_preview: str
    created_at: datetime


async def _get_qdrant_context(query: str, limit: int = 5) -> tuple[str, list[Source]]:
    """
    Search Qdrant for relevant context based on query.
    
    Returns:
        Tuple of (context_text, sources)
    """
    try:
        from ai.embeddings import embeddings_service
        
        # Use embeddings service to search (handles embedding generation + retrieval)
        results = await embeddings_service.search_similar(
            query=query,
            limit=limit
        )
        
        if not results:
            logger.info("No results from Qdrant search")
            return "", []
        
        # Build context and sources
        context_parts = []
        sources = []
        
        for i, result in enumerate(results):
            payload = result.get("payload", {})
            title = payload.get("title", "Untitled")
            content = payload.get("text", "") or payload.get("content", "") # Handle text or content field
            # If content is empty/header, skip formatting
            if not content:
                continue
                
            content_snippet = content[:500] 
            url = payload.get("url", "") or payload.get("doc_id", "")
            score = result.get("score", 0.0)
            
            context_parts.append(f"[Document {i+1}] {title}\n{content_snippet}\n")
            
            sources.append(Source(
                id=str(result.get("id", f"doc-{i}")),
                title=title,
                url=url,
                type=payload.get("source", "knowledge_base"),
                relevance_score=score,
                snippet=content_snippet[:200] + "..." if len(content_snippet) > 200 else content_snippet,
            ))
        
        context = "\n---\n".join(context_parts)
        logger.info(f"Retrieved {len(sources)} documents from Qdrant")
        return context, sources
        
    except Exception as e:
        logger.warning(f"Qdrant search failed: {e}")
        import traceback
        traceback.print_exc()
        return "", []


async def _generate_rag_response(query: str, context: str) -> str:
    """Generate response using NVIDIA NIM with RAG context."""
    try:
        from agents.llm_router import chat_with_rag
        
        if context:
            response = await chat_with_rag(query, context)
        else:
            # No context available
            response = "I don't have enough relevant data to answer this question. Please run the scraping system to gather supply chain intelligence, or try rephrasing your question."
        
        return response
        
    except Exception as e:
        logger.error(f"RAG generation failed: {e}")
        return f"I encountered an error while processing your question: {str(e)}"




class ChatMessage(BaseModel):
    """Single chat message."""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Chat request with conversation history."""
    messages: list[ChatMessage]
    context_limit: int = 5
    include_sources: bool = True


class ChatResponse(BaseModel):
    """Chat response."""
    message: ChatMessage
    sources: list[Source]
    confidence: float
    processing_time_ms: int


@router.post("/chat", response_model=ChatResponse)
async def chat_with_context(request: ChatRequest):
    """Chat with conversation history for context-aware responses."""
    start = time.time()
    
    # Get the latest user message
    if not request.messages or request.messages[-1].role != "user":
        raise ValueError("Last message must be from user")
    
    current_query = request.messages[-1].content
    
    # Build conversation context from history
    conversation_context = ""
    if len(request.messages) > 1:
        conversation_context = "Previous conversation:\n"
        for msg in request.messages[:-1]:  # Exclude current query
            role_label = "User" if msg.role == "user" else "Assistant"
            conversation_context += f"{role_label}: {msg.content}\n"
        conversation_context += "\n"
    
    # Step 1: Retrieve context from Qdrant
    qdrant_context, sources = await _get_qdrant_context(current_query, request.context_limit)
    
    # Step 2: Combine conversation history with RAG context
    full_context = conversation_context + qdrant_context if qdrant_context else conversation_context
    
    # Step 3: Generate response with full context
    if full_context:
        from agents.llm_router import chat_with_rag
        answer = await chat_with_rag(current_query, full_context)
    else:
        answer = "I don't have enough relevant data to answer this question. Please run the scraping system to gather supply chain intelligence, or try rephrasing your question."
    
    # Calculate confidence
    confidence = 0.0
    if sources:
        avg_relevance = sum(s.relevance_score for s in sources) / len(sources)
        confidence = min(avg_relevance, 1.0)
    
    processing_time = int((time.time() - start) * 1000)
    
    return ChatResponse(
        message=ChatMessage(role="assistant", content=answer),
        sources=sources if request.include_sources else [],
        confidence=confidence,
        processing_time_ms=processing_time,
    )


@router.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """Query the RAG system with natural language using Qdrant + NVIDIA NIM."""
    start = time.time()
    
    # Step 1: Retrieve context from Qdrant
    context, sources = await _get_qdrant_context(request.query, request.context_limit)
    
    # Step 2: Generate response with Ollama
    answer = await _generate_rag_response(request.query, context)
    
    # Calculate confidence based on source relevance
    confidence = 0.0
    if sources:
        avg_relevance = sum(s.relevance_score for s in sources) / len(sources)
        confidence = min(avg_relevance, 1.0)
    
    processing_time = int((time.time() - start) * 1000)
    
    return QueryResponse(
        query=request.query,
        answer=answer,
        sources=sources if request.include_sources else [],
        confidence=confidence,
        processing_time_ms=processing_time,
    )


@router.post("/query/stream")
async def query_rag_stream(request: QueryRequest):
    """Stream RAG response for real-time display."""
    
    async def generate() -> AsyncGenerator[str, None]:
        # Get context first
        context, _ = await _get_qdrant_context(request.query, request.context_limit)
        
        # For now, generate full response and stream word by word
        # TODO: Implement true streaming with Ollama
        response = await _generate_rag_response(request.query, context)
        
        for word in response.split():
            yield f"data: {word} \n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/history")
async def get_query_history(
    limit: int = 20,
):
    """Get recent query history."""
    # TODO: Implement history storage in PostgreSQL
    return {"queries": []}


@router.delete("/history/{query_id}")
async def delete_query(query_id: str):
    """Delete a query from history."""
    return {"deleted": query_id}


@router.get("/suggestions")
async def get_query_suggestions():
    """Get suggested queries based on current data."""
    return {
        "suggestions": [
            "What semiconductor shortages are currently affecting Taiwan?",
            "Which vendors have the highest concentration risk?",
            "What weather events are impacting shipping routes?",
            "Are there any new trade restrictions affecting China?",
            "What is the current risk level for SSDs and storage devices?",
            "Which countries have the highest supply chain risk?",
        ]
    }


@router.post("/explain-risk/{risk_id}")
async def explain_risk(risk_id: str):
    """Get AI explanation for a specific risk using RAG."""
    # Search for context about this risk
    context, sources = await _get_qdrant_context(f"risk {risk_id}", limit=3)
    
    if context:
        from agents.llm_router import chat_with_rag
        explanation = await chat_with_rag(
            f"Explain the supply chain risk with ID {risk_id} and provide recommendations.",
            context
        )
        recommendations = ["Monitor the situation closely", "Diversify suppliers", "Build inventory buffers"]
    else:
        explanation = "No detailed information available for this risk."
        recommendations = []
    
    return {
        "risk_id": risk_id,
        "explanation": explanation,
        "recommendations": recommendations,
        "sources": [{"title": s.title, "url": s.url} for s in sources],
    }

