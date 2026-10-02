"""
Overconfidence Detector

Detect overconfidence risk when stability is high but fragility is also high.
"""

from typing import Optional
from dataclasses import dataclass
from datetime import datetime

from risk.stability import StabilityMetrics
from risk.fragility import FragilityMetrics
from ai.nvidia_client import nvidia_client


@dataclass
class OverconfidenceAlert:
    """Overconfidence detection result."""
    is_overconfident: bool
    confidence_gap: float  # Stability - (1 - Fragility)
    stability_score: float
    fragility_score: float
    alert_level: str  # "none", "low", "medium", "high", "critical"
    message: str
    recommendations: list[str]
    detected_at: datetime
    
    def to_dict(self) -> dict:
        return {
            "is_overconfident": self.is_overconfident,
            "confidence_gap": self.confidence_gap,
            "stability_score": self.stability_score,
            "fragility_score": self.fragility_score,
            "alert_level": self.alert_level,
            "message": self.message,
            "recommendations": self.recommendations,
            "detected_at": self.detected_at.isoformat(),
        }


class OverconfidenceDetector:
    """
    Detect overconfidence in supply chains.
    
    Overconfidence occurs when:
    - Recent performance (stability) is high
    - But structural risk (fragility) is also high
    
    This is dangerous because organizations underestimate risk
    when supply chains perform well for extended periods.
    """
    
    # Thresholds for detection
    STABILITY_THRESHOLD = 0.7  # High stability
    FRAGILITY_THRESHOLD = 0.6  # High fragility
    
    # Alert level thresholds (based on confidence gap)
    ALERT_THRESHOLDS = {
        "critical": 0.5,
        "high": 0.35,
        "medium": 0.2,
        "low": 0.1,
    }
    
    def compute_confidence_gap(
        self,
        stability_score: float,
        fragility_score: float,
    ) -> float:
        """
        Compute the confidence gap.
        
        Confidence Gap = Stability - (1 - Fragility)
        
        Positive gap = overconfidence risk.
        """
        actual_risk = fragility_score
        perceived_security = stability_score
        
        # Gap = how much more secure you feel vs actual security
        gap = perceived_security - (1 - actual_risk)
        
        return gap
    
    def determine_alert_level(self, confidence_gap: float) -> str:
        """Determine alert level from confidence gap."""
        for level, threshold in self.ALERT_THRESHOLDS.items():
            if confidence_gap >= threshold:
                return level
        return "none"
    
    def generate_message(
        self,
        stability: float,
        fragility: float,
        gap: float,
        days_stable: int,
    ) -> str:
        """Generate alert message."""
        if gap < 0.1:
            return "Supply chain risk is appropriately assessed."
        
        messages = []
        
        if stability > 0.8:
            messages.append(f"Supply chain has been highly stable (score: {stability:.2f}).")
        
        if fragility > 0.7:
            messages.append(f"However, structural fragility is HIGH ({fragility:.2f}).")
        elif fragility > 0.5:
            messages.append(f"Structural fragility is moderate ({fragility:.2f}).")
        
        if days_stable > 365:
            messages.append(
                f"No incidents in {days_stable} days may lead to complacency."
            )
        
        messages.append(
            f"Confidence gap of {gap:.2f} indicates potential overconfidence."
        )
        
        return " ".join(messages)
    
    def generate_recommendations(
        self,
        fragility: FragilityMetrics,
        stability: StabilityMetrics,
    ) -> list[str]:
        """Generate recommendations based on metrics."""
        recommendations = []
        
        if fragility.hhi_index > 0.5:
            recommendations.append(
                "Diversify supplier base to reduce concentration risk (HHI is high)."
            )
        
        if fragility.geographic_clustering > 0.6:
            recommendations.append(
                "Develop suppliers in different geographic regions."
            )
        
        if fragility.single_points_of_failure > 0:
            recommendations.append(
                f"Address {fragility.single_points_of_failure} single points of failure."
            )
        
        if stability.days_since_incident > 365:
            recommendations.append(
                "Conduct stress testing - extended stability may mask vulnerabilities."
            )
        
        if stability.trend == "declining":
            recommendations.append(
                "Investigate declining stability trend before it becomes critical."
            )
        
        if not recommendations:
            recommendations.append(
                "Continue monitoring but maintain awareness of structural risks."
            )
        
        return recommendations
    
    async def detect(
        self,
        stability: StabilityMetrics,
        fragility: FragilityMetrics,
        vendor_id: Optional[str] = None,
        use_ai: bool = False,
    ) -> OverconfidenceAlert:
        """
        Detect overconfidence risk.
        
        Args:
            stability: Stability metrics
            fragility: Fragility metrics
            vendor_id: Optional vendor identifier
            use_ai: Whether to use AI for enhanced analysis
            
        Returns:
            OverconfidenceAlert
        """
        # Compute confidence gap
        gap = self.compute_confidence_gap(
            stability.stability_score,
            fragility.fragility_score,
        )
        
        # Determine if overconfident
        is_overconfident = (
            stability.stability_score >= self.STABILITY_THRESHOLD and
            fragility.fragility_score >= self.FRAGILITY_THRESHOLD and
            gap > 0.1
        )
        
        # Determine alert level
        alert_level = self.determine_alert_level(gap) if is_overconfident else "none"
        
        # Generate message
        message = self.generate_message(
            stability.stability_score,
            fragility.fragility_score,
            gap,
            stability.days_since_incident,
        )
        
        # Generate recommendations
        recommendations = self.generate_recommendations(fragility, stability)
        
        # Optional AI enhancement
        if use_ai and is_overconfident:
            try:
                ai_result = await nvidia_client.detect_overconfidence(
                    stability.stability_score,
                    fragility.fragility_score,
                    stability.days_since_incident,
                )
                if ai_result.get("analysis"):
                    message += f"\n\nAI Analysis: {ai_result['analysis']}"
            except Exception:
                pass  # AI enhancement is optional
        
        return OverconfidenceAlert(
            is_overconfident=is_overconfident,
            confidence_gap=gap,
            stability_score=stability.stability_score,
            fragility_score=fragility.fragility_score,
            alert_level=alert_level,
            message=message,
            recommendations=recommendations,
            detected_at=datetime.utcnow(),
        )


# Global instance
overconfidence_detector = OverconfidenceDetector()
