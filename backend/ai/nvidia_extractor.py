"""
NVIDIA-Powered Entity Extractor

Uses NVIDIA NIM API to extract supply chain entities, score risks,
and generate graph nodes from scraped articles.
"""

import os
import json
import re
import logging
from typing import Optional
from dataclasses import dataclass

from openai import AsyncOpenAI
from config import settings

logger = logging.getLogger(__name__)


@dataclass
class ExtractedEntities:
    """Structured entities extracted from an article."""
    companies: list[dict]
    countries: list[dict]
    commodities: list[dict]
    events: list[dict]
    relationships: list[dict]
    raw_text: str = ""


@dataclass
class RiskAssessment:
    """Risk and overconfidence assessment."""
    risk_score: float
    overconfidence_score: float
    risk_factors: list[str]
    affected_supply_chains: list[str]
    time_horizon: str
    confidence: float
    summary: str


# Optimized prompts for supply chain intelligence
ENTITY_EXTRACTION_PROMPT = """You are an expert supply chain intelligence analyst specializing in the PC and electronics retail sector.

Analyze this article and extract ALL supply chain entities. Be thorough and precise.

ARTICLE:
{article_text}

Extract and return ONLY valid JSON (no markdown, no explanation):
{{
  "companies": [
    {{"name": "company name", "type": "manufacturer|supplier|retailer|logistics", "country": "ISO country code or name"}}
  ],
  "countries": [
    {{"name": "country name", "iso_code": "XX", "role": "producer|consumer|transit|manufacturing_hub"}}
  ],
  "commodities": [
    {{"name": "specific product", "category": "semiconductor|storage|memory|display|battery|gpu|cpu|motherboard|other"}}
  ],
  "events": [
    {{"type": "shortage|export_ban|price_change|factory_closure|logistics_delay|natural_disaster|geopolitical|acquisition|expansion", "description": "brief description", "severity": "critical|high|medium|low"}}
  ],
  "relationships": [
    {{"from": "entity name", "to": "entity name", "type": "supplies|manufactures|located_in|affects|depends_on|competes_with"}}
  ]
}}

IMPORTANT:
- Extract REAL entities mentioned in the article, not generic examples
- For commodities, be specific: "NAND flash", "DDR5 RAM", "RTX 4090 GPU", not just "chips"
- Include all severity levels of events
- If no entities in a category, use empty array []
"""

RISK_SCORING_PROMPT = """You are a supply chain risk analyst for PC/electronics retailers.

Analyze this article and extracted entities to assess supply chain risk.

ARTICLE:
{article_text}

EXTRACTED ENTITIES:
{entities_json}

Provide risk assessment as ONLY valid JSON (no markdown, no explanation):
{{
  "risk_score": 0.0 to 1.0 (0=no risk, 1=critical disruption),
  "overconfidence_score": 0.0 to 1.0 (0=realistic assessment, 1=article overstates/understates reality),
  "risk_factors": ["factor 1", "factor 2", ...],
  "affected_supply_chains": ["SSDs", "GPUs", "RAM", etc.],
  "time_horizon": "immediate|short_term|medium_term|long_term",
  "confidence": 0.0 to 1.0 (your confidence in this assessment),
  "summary": "2-3 sentence impact summary for PC retailers"
}}

SCORING GUIDE:
- risk_score 0.8-1.0: Immediate supply disruption, price spikes imminent
- risk_score 0.6-0.8: Significant impact likely within weeks
- risk_score 0.4-0.6: Moderate concern, monitor closely
- risk_score 0.2-0.4: Minor impact, limited scope
- risk_score 0.0-0.2: No significant impact expected

- overconfidence_score high: Article uses sensational language, lacks sources, makes extreme claims
- overconfidence_score low: Article is measured, cites data, acknowledges uncertainty
"""


class NvidiaExtractor:
    """
    NVIDIA-powered entity and risk extractor for supply chain intelligence.
    """
    
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.nvidia_api_key,
            base_url=settings.nvidia_base_url,
        )
        self.model_name = settings.nvidia_model
    
    def _parse_json_response(self, text: str) -> Optional[dict]:
        """Robustly parse JSON from response."""
        try:
            # Try direct parse first
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Try extracting from code block
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
        
        # Try finding JSON object
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        
        logger.warning(f"Failed to parse JSON from response: {text[:200]}...")
        return None
    
    async def extract_entities(self, article_text: str, title: str = "") -> Optional[ExtractedEntities]:
        """
        Extract supply chain entities from article text.
        """
        if not settings.nvidia_api_key:
            logger.error("NVIDIA_API_KEY not configured")
            return None
        
        # Prepare text (limit to avoid token limits)
        full_text = f"Title: {title}\n\n{article_text}" if title else article_text
        truncated_text = full_text[:8000]
        
        prompt = ENTITY_EXTRACTION_PROMPT.format(article_text=truncated_text)
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
            )
            
            data = self._parse_json_response(response.choices[0].message.content)
            if not data:
                return None
            
            return ExtractedEntities(
                companies=data.get("companies", []),
                countries=data.get("countries", []),
                commodities=data.get("commodities", []),
                events=data.get("events", []),
                relationships=data.get("relationships", []),
                raw_text=truncated_text,
            )
            
        except Exception as e:
            logger.error(f"Entity extraction failed: {e}")
            return None
    
    async def score_risk(self, article_text: str, entities: ExtractedEntities) -> Optional[RiskAssessment]:
        """
        Score risk and detect overconfidence in article.
        """
        if not settings.nvidia_api_key:
            logger.error("NVIDIA_API_KEY not configured")
            return None
        
        # Convert entities to JSON for prompt
        entities_json = json.dumps({
            "companies": entities.companies,
            "countries": entities.countries,
            "commodities": entities.commodities,
            "events": entities.events,
        }, indent=2)
        
        truncated_text = article_text[:6000]
        prompt = RISK_SCORING_PROMPT.format(
            article_text=truncated_text,
            entities_json=entities_json
        )
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
            )
            
            data = self._parse_json_response(response.choices[0].message.content)
            if not data:
                return None
            
            return RiskAssessment(
                risk_score=float(data.get("risk_score", 0.5)),
                overconfidence_score=float(data.get("overconfidence_score", 0.5)),
                risk_factors=data.get("risk_factors", []),
                affected_supply_chains=data.get("affected_supply_chains", []),
                time_horizon=data.get("time_horizon", "unknown"),
                confidence=float(data.get("confidence", 0.5)),
                summary=data.get("summary", ""),
            )
            
        except Exception as e:
            logger.error(f"Risk scoring failed: {e}")
            return None
    
    async def generate_graph_nodes(self, entities: ExtractedEntities, source_url: str = "") -> list[dict]:
        """
        Generate Neo4j-ready node definitions from extracted entities.
        """
        nodes = []
        
        # Company/Vendor nodes
        for company in entities.companies:
            nodes.append({
                "id": f"vendor-{company['name'].lower().replace(' ', '_')}",
                "label": company["name"],
                "type": "vendor",
                "properties": {
                    "company_type": company.get("type", "unknown"),
                    "country": company.get("country", "unknown"),
                    "source": source_url,
                },
                "risk_score": 0.3,
            })
        
        # Country nodes
        for country in entities.countries:
            nodes.append({
                "id": f"country-{country.get('iso_code', country['name'][:3]).lower()}",
                "label": country["name"],
                "type": "country",
                "properties": {
                    "iso_code": country.get("iso_code", ""),
                    "role": country.get("role", "unknown"),
                    "source": source_url,
                },
                "risk_score": 0.3,
            })
        
        # Product/Commodity nodes
        for commodity in entities.commodities:
            nodes.append({
                "id": f"product-{commodity['name'].lower().replace(' ', '_')}",
                "label": commodity["name"],
                "type": "product",
                "properties": {
                    "category": commodity.get("category", "other"),
                    "source": source_url,
                },
                "risk_score": 0.3,
            })
        
        # Event nodes
        for i, event in enumerate(entities.events):
            severity_scores = {"critical": 0.9, "high": 0.7, "medium": 0.5, "low": 0.3}
            nodes.append({
                "id": f"event-{hash(event['description'])%10000}",
                "label": event.get("description", "Event")[:50],
                "type": "event",
                "properties": {
                    "event_type": event.get("type", "unknown"),
                    "severity": event.get("severity", "medium"),
                    "full_description": event.get("description", ""),
                    "source": source_url,
                },
                "risk_score": severity_scores.get(event.get("severity", "medium"), 0.5),
            })
        
        return nodes
    
    def generate_graph_links(self, entities: ExtractedEntities, nodes: list[dict]) -> list[dict]:
        """
        Generate Neo4j-ready relationship definitions.
        """
        links = []
        node_ids = {n["label"].lower(): n["id"] for n in nodes}
        
        for rel in entities.relationships:
            from_label = rel.get("from", "").lower()
            to_label = rel.get("to", "").lower()
            
            if from_label in node_ids and to_label in node_ids:
                links.append({
                    "source": node_ids[from_label],
                    "target": node_ids[to_label],
                    "type": rel.get("type", "related_to"),
                })
        
        return links


# Global instance
nvidia_extractor = NvidiaExtractor()
