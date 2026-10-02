"""
Impact Analyzer

Analyzes combined data sources to generate actionable supply chain alerts.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional


@dataclass
class ImpactAlert:
    """Supply chain impact alert."""
    alert_id: str
    alert_type: str  # weather, geopolitical, route, vendor
    severity: str  # low, medium, high, extreme
    title: str
    description: str
    affected_regions: List[str]
    affected_routes: List[str]
    timeframe: str  # "next 24h", "48-72h", "3-7 days"
    probability: float  # 0.0 to 1.0
    recommendations: List[str]
    created_at: datetime


class ImpactAnalyzer:
    """Analyzes weather, geopolitical, and supply chain data for impact forecasting."""
    
    def __init__(self):
        pass
    
    async def analyze_weather_impact(self, weather_data: dict) -> List[ImpactAlert]:
        """
        Analyze weather forecasts for trade route impacts.
        
        Args:
            weather_data: Weather forecast data from Open-Meteo
            
        Returns:
            List of impact alerts
        """
        alerts = []
        
        # Analyze hourly forecasts for severe weather patterns
        if "hourly" in weather_data:
            hourly = weather_data["hourly"]
            
            # Check for high wind patterns (affects shipping)
            if "wind_speed_10m" in hourly:
                wind_speeds = hourly["wind_speed_10m"]
                high_wind_hours = sum(1 for speed in wind_speeds if speed > 40)  # km/h
                
                if high_wind_hours > 12:  # More than 12 hours of high winds
                    alerts.append(ImpactAlert(
                        alert_id=f"weather-wind-{datetime.utcnow().timestamp()}",
                        alert_type="weather",
                        severity="high" if high_wind_hours > 24 else "medium",
                        title="High Wind Forecast",
                        description=f"Sustained high winds expected for {high_wind_hours} hours. Port operations may be suspended.",
                        affected_regions=["Asia Pacific"],
                        affected_routes=["Trans-Pacific", "Intra-Asia"],
                        timeframe="next 48h",
                        probability=0.75,
                        recommendations=[
                            "Expedite critical shipments before weather arrives",
                            "Prepare for 1-2 day port delays",
                            "Consider alternative routing if possible"
                        ],
                        created_at=datetime.utcnow()
                    ))
            
            # Check for precipitation patterns (affects logistics)
            if "precipitation_probability" in hourly:
                precip_prob = hourly["precipitation_probability"]
                high_precip_hours = sum(1 for prob in precip_prob if prob > 70)
                
                if high_precip_hours > 18:
                    alerts.append(ImpactAlert(
                        alert_id=f"weather-precip-{datetime.utcnow().timestamp()}",
                        alert_type="weather",
                        severity="medium",
                        title="Heavy Precipitation Forecast",
                        description=f"Extended period of heavy rain expected. Ground transportation delays likely.",
                        affected_regions=["Regional"],
                        affected_routes=["Ground Transport"],
                        timeframe="48-72h",
                        probability=0.65,
                        recommendations=[
                            "Allow extra time for ground shipments",
                            "Monitor flood warnings in affected areas"
                        ],
                        created_at=datetime.utcnow()
                    ))
        
        return alerts
    
    async def analyze_geopolitical_risk(self, news_items: List[dict]) -> List[ImpactAlert]:
        """
        Analyze scraped news for geopolitical risks.
        
        Args:
            news_items: List of scraped news items
            
        Returns:
            List of geopolitical risk alerts
        """
        alerts = []
        
        # Keywords indicating geopolitical risks
        risk_keywords = {
            "trade_restriction": ["tariff", "sanction", "embargo", "export control", "trade war"],
            "conflict": ["conflict", "war", "military", "invasion", "blockade"],
            "regulation": ["regulation", "ban", "restriction", "compliance"],
        }
        
        for item in news_items:
            title_lower = item.get("title", "").lower()
            content_lower = item.get("content", "").lower()
            
            # Check for trade restrictions
            for keyword in risk_keywords["trade_restriction"]:
                if keyword in title_lower or keyword in content_lower:
                    alerts.append(ImpactAlert(
                        alert_id=f"geo-trade-{item.get('id', 'unknown')}",
                        alert_type="geopolitical",
                        severity=item.get("severity", "medium"),
                        title=f"Trade Restriction Alert: {item.get('category', 'General')}",
                        description=item.get("title", "")[:200],
                        affected_regions=item.get("countries", []),
                        affected_routes=["Multiple"],
                        timeframe="immediate",
                        probability=0.9,
                        recommendations=[
                            "Review affected suppliers and vendors",
                            "Assess alternative sourcing options",
                            "Consult legal team on compliance"
                        ],
                        created_at=datetime.utcnow()
                    ))
                    break
            
            # Check for conflicts
            for keyword in risk_keywords["conflict"]:
                if keyword in title_lower:
                    alerts.append(ImpactAlert(
                        alert_id=f"geo-conflict-{item.get('id', 'unknown')}",
                        alert_type="geopolitical",
                        severity="high",
                        title=f"Geopolitical Conflict Alert",
                        description=item.get("title", "")[:200],
                        affected_regions=item.get("countries", []),
                        affected_routes=["Regional"],
                        timeframe="immediate",
                        probability=0.85,
                        recommendations=[
                            "Diversify supply chain immediately",
                            "Secure alternative logistics routes",
                            "Monitor situation closely"
                        ],
                        created_at=datetime.utcnow()
                    ))
                    break
        
        return alerts
    
    async def analyze_trade_route_health(
        self,
        weather_alerts: List[ImpactAlert],
        geo_alerts: List[ImpactAlert],
        port_data: List[dict]
    ) -> List[ImpactAlert]:
        """
        Combine weather and geopolitical data to assess trade route health.
        
        Args:
            weather_alerts: Weather impact alerts
            geo_alerts: Geopolitical alerts
            port_data: Current port status data
            
        Returns:
            List of trade route health alerts
        """
        alerts = []
        
        # Aggregate impacts by region
        region_impacts = {}
        
        for alert in weather_alerts + geo_alerts:
            for region in alert.affected_regions:
                if region not in region_impacts:
                    region_impacts[region] = []
                region_impacts[region].append(alert)
        
        # Generate combined route health alerts
        for region, impacts in region_impacts.items():
            if len(impacts) >= 2:  # Multiple impacts on same region
                severity_scores = {"low": 1, "medium": 2, "high": 3, "extreme": 4}
                avg_severity = sum(severity_scores.get(a.severity, 2) for a in impacts) / len(impacts)
                
                if avg_severity >= 2.5:
                    alerts.append(ImpactAlert(
                        alert_id=f"route-health-{region}-{datetime.utcnow().timestamp()}",
                        alert_type="route",
                        severity="high" if avg_severity >= 3 else "medium",
                        title=f"Trade Route Alert: {region}",
                        description=f"Multiple risk factors detected in {region}. {len(impacts)} active alerts affecting this region.",
                        affected_regions=[region],
                        affected_routes=["Multiple"],
                        timeframe="next 72h",
                        probability=0.8,
                        recommendations=[
                            f"Review all shipments through {region}",
                            "Consider alternative routes if available",
                            "Increase buffer inventory for critical items"
                        ],
                        created_at=datetime.utcnow()
                    ))
        
        return alerts


# Global instance
impact_analyzer = ImpactAnalyzer()
