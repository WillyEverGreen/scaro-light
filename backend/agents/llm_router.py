import logging
import os
from typing import Optional
from agents.base import BaseAgent
from agents.state import Task

logger = logging.getLogger(__name__)


class LLMRouter(BaseAgent):
    """
    Smart router for Large Language Model tasks.
    
    Strategy:
    - NVIDIA (default): Used for all analysis, extraction, risk scoring, and RAG chat.
    """

    def __init__(self):
        super().__init__(name="LLMRouter", agent_type="llm_router")
        self._setup_nvidia()
    
    def _setup_nvidia(self):
        """Initialize NVIDIA API."""
        try:
            from ai.nvidia_client import nvidia_client
            self.nvidia_client = nvidia_client
            self.has_nvidia = True
            self.logger.info("NVIDIA API initialized (for all tasks)")
        except Exception as e:
            self.logger.warning(f"NVIDIA API setup failed: {e}")
            self.has_nvidia = False
            self.nvidia_client = None

    async def process(self, task: Task, context: Optional[dict] = None) -> str:
        """
        Route the prompt to the appropriate model.
        
        Context options:
        - 'use_rag': True → Use NVIDIA with injected context for chat
        - 'rag_context': str → Context from vector DB to inject
        - Otherwise → Use NVIDIA (default)
        """
        prompt = task.description
        use_rag = context.get('use_rag', False) if context else False
        rag_context = context.get('rag_context', '') if context else ''
        
        if not self.has_nvidia:
            raise RuntimeError("No LLM available. Configure NVIDIA_API_KEY.")
        
        if use_rag:
            # Use NVIDIA with RAG context
            return await self._call_nvidia_rag(prompt, rag_context)
        else:
            return await self._call_nvidia(prompt)

    async def _call_nvidia(self, prompt: str) -> str:
        """Call NVIDIA API."""
        self.logger.info("→ NVIDIA API")
        try:
            response = await self.nvidia_client.generate(prompt)
            return response
        except Exception as e:
            self.logger.error(f"NVIDIA API failed: {e}")
            raise

    async def _call_nvidia_rag(self, query: str, context: str) -> str:
        """
        Call NVIDIA with RAG context injection for chat.
        
        Args:
            query: User's question
            context: Retrieved context from Qdrant
        """
        self.logger.info("→ NVIDIA (RAG chat)")
        
        rag_prompt = f"""You are Edgecase, a supply chain intelligence assistant.
Use the following context to answer the user's question.

CONTEXT:
{context}

QUESTION:
{query}

INSTRUCTIONS:
1. Answer ONLY using the provided context.
2. If the context has the answer, be detailed and specific.
3. If the context does NOT have the answer, state: "I don't have enough data to answer that based on the current knowledge base."
4. Do not make up information.
5. <think>Analyze the context first to identify relevant facts before constructing the answer.</think>
"""
        try:
            response = await self.nvidia_client.generate(rag_prompt)
            return response
        except Exception as e:
            self.logger.error(f"NVIDIA API RAG failed: {e}")
            raise


# Convenience functions for direct use
_router = None

def get_router() -> LLMRouter:
    global _router
    if _router is None:
        _router = LLMRouter()
    return _router

async def analyze_with_nvidia(prompt: str) -> str:
    """Quick access to NVIDIA for analysis."""
    router = get_router()
    task = Task(id="adhoc", description=prompt, agent_type="llm")
    return await router.process(task)

async def chat_with_rag(query: str, context: str) -> str:
    """Quick access to NVIDIA RAG chat."""
    router = get_router()
    task = Task(id="chat", description=query, agent_type="llm")
    return await router.process(task, {'use_rag': True, 'rag_context': context})

