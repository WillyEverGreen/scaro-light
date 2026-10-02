"""
Weather API Endpoints

Fetches real-time weather data for major supply chain hubs using Open-Meteo API.
"""

import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class WeatherInfo(BaseModel):
    port: str
    country: str
    condition: str
    temp: float
    wind: float
    status: str  # "normal", "warning", "critical"
    alert: Optional[str] = None

class WeatherResponse(BaseModel):
    ports: List[WeatherInfo]

# Major ports coordinates
PORTS = [
    {"name": "Shanghai", "country": "CHN", "lat": 31.23, "lon": 121.47},
    {"name": "Singapore", "country": "SGP", "lat": 1.35, "lon": 103.82},
    {"name": "Rotterdam", "country": "NLD", "lat": 51.92, "lon": 4.48},
    {"name": "Los Angeles", "country": "USA", "lat": 34.05, "lon": -118.24},
    {"name": "Busan", "country": "KOR", "lat": 35.18, "lon": 129.07},
    {"name": "Dubai", "country": "ARE", "lat": 25.20, "lon": 55.27},
    {"name": "Mumbai", "country": "IND", "lat": 18.96, "lon": 72.82},
    {"name": "Hamburg", "country": "DEU", "lat": 53.55, "lon": 9.99}
]

def interpret_weather_code(code: int) -> str:
    """Map WMO weather code to text description."""
    if code == 0: return "Clear Sky"
    if code in [1, 2, 3]: return "Partly Cloudy"
    if code in [45, 48]: return "Foggy"
    if code in [51, 53, 55]: return "Drizzle"
    if code in [61, 63, 65]: return "Rain"
    if code in [71, 73, 75]: return "Snow"
    if code in [80, 81, 82]: return "Heavy Rain"
    if code in [95, 96, 99]: return "Thunderstorm"
    return "Unknown"

@router.get("/weather", response_model=WeatherResponse)
async def get_port_weather():
    """Get real-time weather for major ports."""
    results = []
    
    async with httpx.AsyncClient() as client:
        for port in PORTS:
            try:
                # Open-Meteo Free API
                url = f"https://api.open-meteo.com/v1/forecast?latitude={port['lat']}&longitude={port['lon']}&current_weather=true"
                response = await client.get(url, timeout=5.0)
                data = response.json()
                
                current = data.get("current_weather", {})
                temp = current.get("temperature", 0)
                wind = current.get("windspeed", 0)
                code = current.get("weathercode", 0)
                
                condition = interpret_weather_code(code)
                
                # Determine status
                status = "normal"
                alert = None
                
                if wind > 60:
                    status = "critical"
                    alert = "Port operations suspended: High Winds"
                elif wind > 40:
                    status = "warning"
                    alert = "Crane operations limited: High Winds"
                elif "Thunderstorm" in condition:
                    status = "warning" 
                    alert = "Lightning risk: Operations paused"
                elif "Heavy Rain" in condition:
                    status = "warning"
                    alert = "Visibility reduced: Slow operations"
                
                results.append(WeatherInfo(
                    port=port["name"],
                    country=port["country"],
                    condition=condition,
                    temp=temp,
                    wind=wind,
                    status=status,
                    alert=alert
                ))
                
            except Exception as e:
                # Fallback purely for this port on error
                results.append(WeatherInfo(
                    port=port["name"],
                    country=port["country"],
                    condition="Unknown",
                    temp=0,
                    wind=0,
                    status="normal",
                    alert=None
                ))

    return WeatherResponse(ports=results)
