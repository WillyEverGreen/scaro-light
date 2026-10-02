from typing import Any, Optional
from agents.base import BaseAgent
from agents.state import Task, ScrapedEvidence, UserContext
from agents.llm_router import LLMRouter
import json
import re

class AnalystAgent(BaseAgent):
    """
    Analyst Agent.
    Extracts structured risk data from scraped evidence.
    Uses LLMRouter for intelligence.
    """

    def __init__(self):
        super().__init__(name="Analyst", agent_type="analyst")
        self.llm_router = LLMRouter()

    async def process(self, task: Task, context: Optional[Any] = None) -> dict:
        """
        Analyze the ScrapedEvidence (passed in context).
        Returns structured analysis JSON.
        """
        evidence: ScrapedEvidence = context.get('evidence')
        user_context: UserContext = context.get('user_context')

        if not evidence:
            raise ValueError("No evidence provided for analysis")

        # Construct Prompt
        prompt = self._construct_prompt(evidence, user_context)

        # Determine Complexity
        # If user context is heavily involved or content is long, treat as complex
        complexity = 'complex' if (user_context or len(evidence.content) > 2000) else 'simple'
        
        # Route to LLM
        router_task = Task(id=f"route_{task.id}", description=prompt, agent_type="llm_router")
        llm_response = await self.llm_router.process(router_task, context={'complexity': complexity})
        
        # Parse Result
        cleaned_json = self._extract_json(llm_response)
        return cleaned_json

    def _construct_prompt(self, evidence: ScrapedEvidence, user_context: UserContext) -> str:
        suppliers_str = ", ".join(user_context.suppliers) if user_context else "None defined"
        
        return f"""
        Analyze the following article for supply chain risks, specifically for the PC/electronics retail sector.
        
        User's Priority Suppliers: {suppliers_str}
        
        Article Title: {evidence.title}
        Content:
        {evidence.content[:3000]}... [truncated]
        
        Extract the following strictly as JSON:
        {{
            "risk_score": float (0.0 - 1.0, where 1.0 is critical disruption),
            "severity": "Critical" | "High" | "Medium" | "Low",
            "summary": "Short 2-sentence summary of the supply chain impact",
            "impact_on_user": "Analysis of impact on priority suppliers (if any)",
            "entities": ["list of company names mentioned"],
            "locations": ["list of countries/cities mentioned"],
            "commodities": ["list of specific products affected, e.g. SSD, RAM, GPU, NAND, DRAM, HDD, CPU, Motherboard, Display, Battery"],
            "supply_chain_node_type": "vendor" | "manufacturer" | "logistics" | "raw_material" | "retailer" | "unknown",
            "affected_region": "global" | "asia_pacific" | "north_america" | "europe" | "china" | "taiwan" | "korea" | "other",
            "disruption_type": "shortage" | "price_increase" | "export_ban" | "factory_closure" | "logistics_delay" | "natural_disaster" | "geopolitical" | "other"
        }}
        """

    def _extract_json(self, text: str) -> dict:
        """Robust JSON extraction from LLM text."""
        try:
            # Try finding a code block first
            match = re.search(r'```json\s*(\{.*?\})\s*```', text, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            
            # Try finding raw braces
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            
            return {"error": "Failed to parse JSON", "raw_text": text}
        except Exception:
             return {"error": "JSON Decode Error", "raw_text": text}
