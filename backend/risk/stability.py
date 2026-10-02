"""
Stability Indicators

Compute stability metrics from historical supply chain performance.
"""

import statistics
from typing import Optional
from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass
class StabilityMetrics:
    """Stability analysis results."""
    lead_time_variance: float  # Variance in delivery lead times
    lead_time_cv: float  # Coefficient of variation
    reliability_score: float  # 0-1, based on on-time delivery
    delivery_consistency: float  # 0-1, based on variance
    trend: str  # "improving", "stable", "declining"
    stability_score: float  # Composite score 0-1 (higher = more stable)
    days_since_incident: int
    
    def to_dict(self) -> dict:
        return {
            "lead_time_variance": self.lead_time_variance,
            "lead_time_cv": self.lead_time_cv,
            "reliability_score": self.reliability_score,
            "delivery_consistency": self.delivery_consistency,
            "trend": self.trend,
            "stability_score": self.stability_score,
            "days_since_incident": self.days_since_incident,
        }


class StabilityAnalyzer:
    """
    Analyze supply chain stability.
    
    Computes performance metrics and trends.
    """
    
    def compute_lead_time_stats(
        self,
        lead_times: list[float],
    ) -> tuple[float, float]:
        """
        Compute lead time statistics.
        
        Args:
            lead_times: List of lead times in days
            
        Returns:
            (variance, coefficient_of_variation)
        """
        if not lead_times or len(lead_times) < 2:
            return 0.0, 0.0
        
        mean = statistics.mean(lead_times)
        variance = statistics.variance(lead_times)
        
        # Coefficient of variation
        cv = (statistics.stdev(lead_times) / mean) if mean > 0 else 0.0
        
        return variance, cv
    
    def compute_reliability(
        self,
        deliveries: list[dict],  # {"on_time": bool, "date": datetime}
    ) -> float:
        """
        Compute reliability score based on on-time deliveries.
        
        Args:
            deliveries: List of delivery records
            
        Returns:
            Reliability score 0-1
        """
        if not deliveries:
            return 0.5  # Unknown
        
        on_time_count = sum(1 for d in deliveries if d.get("on_time", False))
        return on_time_count / len(deliveries)
    
    def compute_trend(
        self,
        historical_scores: list[float],
    ) -> str:
        """
        Determine trend from historical scores.
        
        Args:
            historical_scores: Chronological list of stability scores
            
        Returns:
            "improving", "stable", or "declining"
        """
        if not historical_scores or len(historical_scores) < 3:
            return "stable"
        
        # Simple linear regression slope
        n = len(historical_scores)
        x_mean = (n - 1) / 2
        y_mean = statistics.mean(historical_scores)
        
        numerator = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(historical_scores))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            return "stable"
        
        slope = numerator / denominator
        
        # Threshold for trend detection
        if slope > 0.02:
            return "improving"
        elif slope < -0.02:
            return "declining"
        else:
            return "stable"
    
    def days_since_last_incident(
        self,
        incidents: list[datetime],
        reference_date: Optional[datetime] = None,
    ) -> int:
        """
        Calculate days since last incident.
        
        Args:
            incidents: List of incident dates
            reference_date: Reference date (default: now)
            
        Returns:
            Days since last incident (999 if none)
        """
        if not incidents:
            return 999  # No recorded incidents
        
        ref = reference_date or datetime.utcnow()
        
        # Find most recent incident
        most_recent = max(incidents)
        delta = ref - most_recent
        
        return max(0, delta.days)
    
    def analyze(
        self,
        lead_times: Optional[list[float]] = None,
        deliveries: Optional[list[dict]] = None,
        historical_scores: Optional[list[float]] = None,
        incidents: Optional[list[datetime]] = None,
    ) -> StabilityMetrics:
        """
        Perform complete stability analysis.
        
        Args:
            lead_times: Historical lead times
            deliveries: Delivery records
            historical_scores: Past stability scores
            incidents: Past incident dates
            
        Returns:
            StabilityMetrics
        """
        # Compute individual metrics
        variance, cv = self.compute_lead_time_stats(lead_times or [])
        reliability = self.compute_reliability(deliveries or [])
        trend = self.compute_trend(historical_scores or [])
        days_since = self.days_since_last_incident(incidents or [])
        
        # Delivery consistency (inverse of CV, normalized)
        # Lower CV = higher consistency
        consistency = max(0, 1 - min(cv, 1))
        
        # Compute composite stability score
        # Higher reliability = higher stability
        # Lower variance = higher stability
        # No recent incidents = higher stability
        
        incident_factor = min(days_since / 365, 1.0)  # Normalize to 1 year
        
        stability_score = (
            reliability * 0.40 +
            consistency * 0.30 +
            incident_factor * 0.30
        )
        
        # Apply trend adjustment
        if trend == "improving":
            stability_score = min(1.0, stability_score * 1.05)
        elif trend == "declining":
            stability_score = max(0.0, stability_score * 0.95)
        
        return StabilityMetrics(
            lead_time_variance=variance,
            lead_time_cv=cv,
            reliability_score=reliability,
            delivery_consistency=consistency,
            trend=trend,
            stability_score=stability_score,
            days_since_incident=days_since,
        )


# Global instance
stability_analyzer = StabilityAnalyzer()
