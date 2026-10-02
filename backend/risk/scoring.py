"""
Risk Scoring Engine

Compute composite risk scores from all indicators.
"""

from typing import Optional
from dataclasses import dataclass
from datetime import datetime

from risk.stability import StabilityMetrics, stability_analyzer
from risk.fragility import FragilityMetrics, fragility_analyzer
from risk.overconfidence import OverconfidenceAlert, overconfidence_detector


@dataclass
class CompositeRiskScore:
    """Complete risk assessment."""
    overall_score: float  # 0-1 (higher = riskier)
    fragility_index: float
    stability_index: float
    event_impact_score: float
    confidence_gap: float
    overconfidence_alert: Optional[OverconfidenceAlert]
    trend: str
    risk_level: str  # "low", "medium", "high", "critical"
    calculated_at: datetime
    
    def to_dict(self) -> dict:
        return {
            "overall_score": self.overall_score,
            "fragility_index": self.fragility_index,
            "stability_index": self.stability_index,
            "event_impact_score": self.event_impact_score,
            "confidence_gap": self.confidence_gap,
            "overconfidence_alert": self.overconfidence_alert.to_dict() if self.overconfidence_alert else None,
            "trend": self.trend,
            "risk_level": self.risk_level,
            "calculated_at": self.calculated_at.isoformat(),
        }


class RiskScoringEngine:
    """
    Composite risk scoring engine.
    
    Combines stability, fragility, events, and overconfidence into
    a unified risk score.
    
    Risk Score Formula:
        Overall = (Fragility × 0.4) + (EventImpact × 0.3) + ((1 - Stability) × 0.3)
    """
    
    # Weights for composite score
    WEIGHTS = {
        "fragility": 0.40,
        "event_impact": 0.30,
        "instability": 0.30,  # 1 - stability
    }
    
    # Risk level thresholds
    RISK_LEVELS = {
        "critical": 0.8,
        "high": 0.6,
        "medium": 0.4,
        "low": 0.0,
    }
    
    def compute_event_impact(
        self,
        events: list[dict],  # {"severity": float, "recency_days": int}
    ) -> float:
        """
        Compute event impact score.
        
        Recent, severe events have higher impact.
        
        Args:
            events: List of recent events with severity and recency
            
        Returns:
            Event impact score 0-1
        """
        if not events:
            return 0.0
        
        total_impact = 0.0
        
        for event in events:
            severity = event.get("severity", 0.5)
            recency_days = event.get("recency_days", 30)
            
            # Recency weight - recent events have more impact
            # Decay over 90 days
            recency_weight = max(0, 1 - (recency_days / 90))
            
            impact = severity * recency_weight
            total_impact += impact
        
        # Normalize (cap at 1.0)
        return min(1.0, total_impact)
    
    def determine_risk_level(self, score: float) -> str:
        """Convert score to risk level."""
        for level, threshold in self.RISK_LEVELS.items():
            if score >= threshold:
                return level
        return "low"
    
    async def calculate(
        self,
        stability: Optional[StabilityMetrics] = None,
        fragility: Optional[FragilityMetrics] = None,
        events: Optional[list[dict]] = None,
        check_overconfidence: bool = True,
    ) -> CompositeRiskScore:
        """
        Calculate composite risk score.
        
        Args:
            stability: Stability metrics (computed if not provided)
            fragility: Fragility metrics (computed if not provided)
            events: Recent events for impact calculation
            check_overconfidence: Whether to check for overconfidence
            
        Returns:
            CompositeRiskScore
        """
        # Use provided metrics or defaults
        stability = stability or StabilityMetrics(
            lead_time_variance=0,
            lead_time_cv=0,
            reliability_score=0.5,
            delivery_consistency=0.5,
            trend="stable",
            stability_score=0.5,
            days_since_incident=30,
        )
        
        fragility = fragility or FragilityMetrics(
            hhi_index=0.5,
            entropy=1.0,
            normalized_entropy=0.5,
            geographic_clustering=0.5,
            single_points_of_failure=0,
            fragility_score=0.5,
        )
        
        # Compute event impact
        event_impact = self.compute_event_impact(events or [])
        
        # Calculate composite score
        instability = 1 - stability.stability_score
        
        overall_score = (
            fragility.fragility_score * self.WEIGHTS["fragility"] +
            event_impact * self.WEIGHTS["event_impact"] +
            instability * self.WEIGHTS["instability"]
        )
        
        # Compute confidence gap
        confidence_gap = stability.stability_score - (1 - fragility.fragility_score)
        
        # Check for overconfidence
        overconfidence_alert = None
        if check_overconfidence:
            overconfidence_alert = await overconfidence_detector.detect(
                stability,
                fragility,
            )
            
            # Boost risk score if overconfident
            if overconfidence_alert.is_overconfident:
                overall_score = min(1.0, overall_score * 1.15)
        
        # Determine risk level
        risk_level = self.determine_risk_level(overall_score)
        
        return CompositeRiskScore(
            overall_score=overall_score,
            fragility_index=fragility.fragility_score,
            stability_index=stability.stability_score,
            event_impact_score=event_impact,
            confidence_gap=confidence_gap,
            overconfidence_alert=overconfidence_alert,
            trend=stability.trend,
            risk_level=risk_level,
            calculated_at=datetime.utcnow(),
        )
    
    async def calculate_for_vendor(
        self,
        vendor_shares: list[float],
        country_shares: dict[str, float],
        lead_times: list[float],
        deliveries: list[dict],
        recent_events: list[dict],
    ) -> CompositeRiskScore:
        """
        Calculate risk score for a specific vendor/supply chain.
        
        Convenience method that computes all metrics.
        """
        # Compute fragility
        fragility = fragility_analyzer.analyze(
            vendor_shares=vendor_shares,
            country_shares=country_shares,
        )
        
        # Compute stability
        stability = stability_analyzer.analyze(
            lead_times=lead_times,
            deliveries=deliveries,
        )
        
        return await self.calculate(
            stability=stability,
            fragility=fragility,
            events=recent_events,
        )


# Global instance
risk_engine = RiskScoringEngine()
