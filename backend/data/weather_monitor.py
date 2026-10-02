"""
Weather Monitor

Fetch weather data from Open-Meteo API for supply chain impact analysis.
"""

import asyncio
from typing import Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

import httpx

from config import settings


@dataclass
class WeatherAlert:
    """Weather alert affecting supply chains."""
    alert_type: str  # hurricane, flood, drought, storm, extreme_temp
    severity: str  # low, medium, high, extreme
    country_code: str
    region: str
    latitude: float
    longitude: float
    description: str
    start_time: datetime
    end_time: Optional[datetime]
    affected_ports: list
    affected_routes: list
    impact_score: float
    
    def to_dict(self) -> dict:
        return {
            "alert_type": self.alert_type,
            "severity": self.severity,
            "country_code": self.country_code,
            "region": self.region,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "description": self.description,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "affected_ports": self.affected_ports,
            "affected_routes": self.affected_routes,
            "impact_score": self.impact_score,
        }


# Major shipping ports with coordinates
MAJOR_PORTS = [
    {"name": "Shanghai", "country": "CHN", "lat": 31.23, "lon": 121.47, "region": "Asia Pacific"},
    {"name": "Singapore", "country": "SGP", "lat": 1.29, "lon": 103.85, "region": "Asia Pacific"},
    {"name": "Shenzhen", "country": "CHN", "lat": 22.54, "lon": 114.06, "region": "Asia Pacific"},
    {"name": "Ningbo-Zhoushan", "country": "CHN", "lat": 29.86, "lon": 121.54, "region": "Asia Pacific"},
    {"name": "Busan", "country": "KOR", "lat": 35.18, "lon": 129.08, "region": "Asia Pacific"},
    {"name": "Hong Kong", "country": "HKG", "lat": 22.32, "lon": 114.17, "region": "Asia Pacific"},
    # Indian Ports - Enhanced Coverage
    {"name": "Mumbai/Nhava Sheva", "country": "IND", "lat": 18.95, "lon": 72.95, "region": "India"},
    {"name": "Chennai", "country": "IND", "lat": 13.08, "lon": 80.27, "region": "India"},
    {"name": "Kolkata", "country": "IND", "lat": 22.57, "lon": 88.36, "region": "India"},
    {"name": "Visakhapatnam", "country": "IND", "lat": 17.68, "lon": 83.29, "region": "India"},
    # Other Major Ports
    {"name": "Rotterdam", "country": "NLD", "lat": 51.92, "lon": 4.48, "region": "Europe"},
    {"name": "Antwerp", "country": "BEL", "lat": 51.26, "lon": 4.40, "region": "Europe"},
    {"name": "Hamburg", "country": "DEU", "lat": 53.55, "lon": 9.99, "region": "Europe"},
    {"name": "Los Angeles", "country": "USA", "lat": 33.74, "lon": -118.26, "region": "North America"},
    {"name": "Long Beach", "country": "USA", "lat": 33.77, "lon": -118.19, "region": "North America"},
    {"name": "New York", "country": "USA", "lat": 40.67, "lon": -74.04, "region": "North America"},
    {"name": "Dubai/Jebel Ali", "country": "ARE", "lat": 25.00, "lon": 55.06, "region": "Middle East"},
]


class WeatherMonitor:
    """
    Weather monitoring service using Open-Meteo API.
    
    Tracks severe weather affecting major shipping routes and ports.
    """
    
    def __init__(self):
        self.base_url = settings.open_meteo_base_url
    
    async def get_port_weather(
        self,
        latitude: float,
        longitude: float,
    ) -> dict:
        """
        Get current weather for a location.
        
        Args:
            latitude: Port latitude
            longitude: Port longitude
            
        Returns:
            Weather data dict
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/forecast",
                    params={
                        "latitude": latitude,
                        "longitude": longitude,
                        "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m",
                        "hourly": "precipitation_probability,wind_speed_10m",
                        "forecast_days": 3,
                    },
                    timeout=30,
                )
                
                if response.status_code == 200:
                    return response.json()
            except Exception as e:
                print(f"Weather API error: {e}")
        
        return {}
    
    async def check_all_ports(self) -> list[dict]:
        """Check weather at all major ports."""
        results = []
        
        for port in MAJOR_PORTS:
            weather = await self.get_port_weather(port["lat"], port["lon"])
            results.append({
                "port": port["name"],
                "country": port["country"],
                "region": port["region"],
                "weather": weather,
            })
            
            # Rate limiting
            await asyncio.sleep(0.2)
        
        return results
    
    def analyze_weather_impact(self, weather_data: dict) -> Optional[WeatherAlert]:
        """
        Analyze weather data for supply chain impact.
        
        Returns WeatherAlert if conditions are severe.
        """
        if not weather_data or "current" not in weather_data:
            return None
        
        current = weather_data.get("current", {})
        
        # Weather codes that indicate severe conditions
        # 95-99: Thunderstorm, 80-82: Rain showers, 71-77: Snow
        weather_code = current.get("weather_code", 0)
        wind_speed = current.get("wind_speed_10m", 0)
        wind_gusts = current.get("wind_gusts_10m", 0)
        precipitation = current.get("precipitation", 0)
        
        # Determine severity
        severity = None
        alert_type = None
        description = ""
        
        # High winds
        if wind_gusts > 100 or wind_speed > 80:
            severity = "extreme"
            alert_type = "storm"
            description = f"Extreme winds: {wind_speed} km/h sustained, {wind_gusts} km/h gusts"
        elif wind_gusts > 70 or wind_speed > 50:
            severity = "high"
            alert_type = "storm"
            description = f"High winds: {wind_speed} km/h sustained, {wind_gusts} km/h gusts"
        
        # Thunderstorms
        if weather_code >= 95:
            severity = "high"
            alert_type = "thunderstorm"
            description = "Active thunderstorm conditions"
        
        # Heavy precipitation
        if precipitation > 50:
            severity = "high"
            alert_type = "flood"
            description = f"Heavy precipitation: {precipitation}mm"
        elif precipitation > 20:
            severity = "medium"
            alert_type = "rain"
            description = f"Significant precipitation: {precipitation}mm"
        
        if not severity:
            return None
        
        # Calculate impact score
        impact_score = 0.0
        if severity == "extreme":
            impact_score = 0.9
        elif severity == "high":
            impact_score = 0.7
        elif severity == "medium":
            impact_score = 0.4
        else:
            impact_score = 0.2
        
        return WeatherAlert(
            alert_type=alert_type,
            severity=severity,
            country_code="",  # To be filled by caller
            region="",
            latitude=weather_data.get("latitude", 0),
            longitude=weather_data.get("longitude", 0),
            description=description,
            start_time=datetime.utcnow(),
            end_time=None,
            affected_ports=[],
            affected_routes=[],
            impact_score=impact_score,
        )
    
    async def get_active_alerts(self) -> list[WeatherAlert]:
        """Get all active weather alerts for major ports."""
        alerts = []
        port_weather = await self.check_all_ports()
        
        for pw in port_weather:
            if pw["weather"]:
                alert = self.analyze_weather_impact(pw["weather"])
                if alert:
                    alert.country_code = pw["country"]
                    alert.region = pw["region"]
                    alert.affected_ports = [pw["port"]]
                    alerts.append(alert)
        
        return alerts


# Global instance
weather_monitor = WeatherMonitor()
