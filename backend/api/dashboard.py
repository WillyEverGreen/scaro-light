"""
Dashboard API Endpoints

Dashboard summary data with live database integration.
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


@router.get("/summary")
async def get_dashboard_summary():
    """Get dashboard summary statistics."""
    from data.scheduler import scheduler
    
    items = scheduler.data_store.items
    
    # Get stats for return value
    stats = scheduler.stats.to_dict()
    data_stats = scheduler.data_store.get_stats()
    
    # Calculate statistics
    total_events = len(items)
    high_risk_count = sum(1 for item in items if item.severity in ["high", "critical"])
    
    # Count unique affected countries
    affected_countries = set()
    for item in items:
        if item.countries:
            for country in item.countries:
                if isinstance(country, dict):
                    code = country.get('code')
                    if code:
                        affected_countries.add(code)
                elif isinstance(country, str):
                    affected_countries.add(country)
    
    # Calculate overconfidence alerts (items with high severity but low attention)
    overconfidence_alerts = sum(
        1 for item in items 
        if item.severity in ["high", "critical"] and item.category in ["logistics", "commodity"]
    )
    
    # Get recent events (last 5)
    recent_events = sorted(items, key=lambda x: x.scraped_at or datetime.min, reverse=True)[:5]
    
    # Calculate risk score (0-1 scale)
    if total_events > 0:
        risk_score = min(1.0, (high_risk_count / total_events) * 1.5)
    else:
        risk_score = 0.0
    
    return {
        "risk": {
            "overall_risk_score": round(risk_score, 2),
            "overconfidence_alerts": overconfidence_alerts,
            "high_risk_vendors": high_risk_count,
            "affected_countries": len(affected_countries),
            "active_events": total_events,
        },
        "recent_events": recent_events,
        "scraping_status": {
            "status": "running" if stats.get("is_running") else "idle",
            "jobs_pending": 0,
        },
        "data_stats": data_stats,
    }




def clean_html_content(text: str) -> str:
    """Remove HTML tags from text content."""
    if not text:
        return ""
    
    import re
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    return text


@router.get("/events")
async def get_all_events(limit: Optional[int] = None):
    """Get all events, optionally limited."""
    from data.scheduler import scheduler
    
    items = scheduler.data_store.items
    
    # Sort by scraped_at date (newest first)
    sorted_items = sorted(
        items,
        key=lambda x: x.scraped_at if x.scraped_at else datetime.min,
        reverse=True
    )
    
    # Apply limit if specified
    if limit:
        sorted_items = sorted_items[:limit]
    
    events = []
    for item in sorted_items:
        # Ensure country is a string, not an object
        country_str = None
        if item.countries:
            first_country = item.countries[0]
            # Handle if country is an object with 'code' or 'name' field
            if isinstance(first_country, dict):
                country_str = first_country.get('code') or first_country.get('name')
            else:
                country_str = str(first_country)
        
        # Clean HTML from content
        clean_content = clean_html_content(item.content) if item.content else None
        
        events.append({
            "id": item.id,
            "title": item.title,
            "category": item.category or "other",
            "severity": item.severity or "medium",
            "country": country_str,
            "created_at": item.scraped_at.isoformat() if item.scraped_at else datetime.utcnow().isoformat(),
            "content": clean_content[:200] + "..." if clean_content and len(clean_content) > 200 else clean_content,
            "full_content": clean_content,  # Include full content for modal
            "url": item.url if hasattr(item, 'url') else None,
        })
    
    return {
        "events": events,
        "total": len(items),
        "returned": len(events),
    }



@router.get("/timeline")
async def get_risk_timeline(days: int = 30):
    """Get risk timeline data."""
    from data.scheduler import scheduler
    
    items = scheduler.data_store.items
    
    # Group by day
    timeline = []
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=days - i - 1)
        day_items = [
            item for item in items
            if item.scraped_at and item.scraped_at.date() == date.date()
        ]
        
        if day_items:
            avg_risk = sum(i.risk_score for i in day_items) / len(day_items)
        else:
            avg_risk = 0.3 + (i / days) * 0.2  # Slight upward trend for mock
        
        timeline.append({
            "date": date.strftime("%Y-%m-%d"),
            "risk_score": avg_risk,
            "event_count": len(day_items),
        })
    
    return {"timeline": timeline}


@router.get("/geographic")
async def get_geographic_heatmap():
    """Get geographic risk distribution."""
    from data.scheduler import scheduler
    
    country_risks = {}
    for item in scheduler.data_store.items:
        for country in item.countries:
            if country not in country_risks:
                country_risks[country] = {"count": 0, "total_risk": 0}
            country_risks[country]["count"] += 1
            country_risks[country]["total_risk"] += item.risk_score
    
    # Calculate averages
    result = []
    for code, data in country_risks.items():
        result.append({
            "country_code": code,
            "event_count": data["count"],
            "avg_risk_score": data["total_risk"] / data["count"] if data["count"] > 0 else 0,
        })
    
    return {"countries": sorted(result, key=lambda x: x["avg_risk_score"], reverse=True)}


@router.get("/vendors")
async def get_vendor_risk():
    """Get vendor risk distribution."""
    # TODO: Extract vendor data from scraped content
    return {
        "vendors": [
            {"name": "TSMC", "country": "TWN", "risk_score": 0.3, "dependency": 0.85},
            {"name": "Samsung", "country": "KOR", "risk_score": 0.4, "dependency": 0.65},
            {"name": "Intel", "country": "USA", "risk_score": 0.25, "dependency": 0.55},
            {"name": "ASML", "country": "NLD", "risk_score": 0.35, "dependency": 0.75},
        ]
    }


@router.get("/commodities")
async def get_commodity_status():
    """Get commodity status from scraped data."""
    from data.scheduler import scheduler
    
    commodity_counts = {}
    for item in scheduler.data_store.items:
        for commodity in item.commodities:
            if commodity not in commodity_counts:
                commodity_counts[commodity] = {"count": 0, "total_risk": 0}
            commodity_counts[commodity]["count"] += 1
            commodity_counts[commodity]["total_risk"] += item.risk_score
    
    result = []
    for name, data in commodity_counts.items():
        result.append({
            "name": name,
            "mention_count": data["count"],
            "avg_risk": data["total_risk"] / data["count"] if data["count"] > 0 else 0.3,
        })
    
    # Add defaults if empty
    if not result:
        result = [
            {"name": "semiconductor", "mention_count": 0, "avg_risk": 0.6},
            {"name": "chip", "mention_count": 0, "avg_risk": 0.55},
            {"name": "battery", "mention_count": 0, "avg_risk": 0.4},
        ]
    
    return {"commodities": sorted(result, key=lambda x: x["avg_risk"], reverse=True)}
@router.get("/weather")
async def get_weather_status():
    """Get weather status for all major ports."""
    from data.weather_monitor import weather_monitor
    
    # Get raw data for all ports
    raw_data = await weather_monitor.check_all_ports()
    
    formatted_ports = []
    for item in raw_data:
        weather = item["weather"].get("current", {})
        
        # Analyze impact for status/alert
        alert_obj = weather_monitor.analyze_weather_impact(item["weather"])
        
        status = "normal"
        alert_text = None
        if alert_obj:
            status = "critical" if alert_obj.severity in ["high", "extreme"] else "warning"
            alert_text = alert_obj.description

        # Map WMO codes to text (simplified)
        wmo_code = weather.get("weather_code", 0)
        condition = "Clear"
        if wmo_code > 90: condition = "Thunderstorm"
        elif wmo_code > 60: condition = "Rain"
        elif wmo_code > 50: condition = "Drizzle"
        elif wmo_code > 40: condition = "Fog"
        elif wmo_code > 1: condition = "Cloudy"

        formatted_ports.append({
            "port": item["port"],
            "country": item["country"],
            "condition": condition,
            "temp": weather.get("temperature_2m", 0),
            "wind": weather.get("wind_speed_10m", 0),
            "status": status,
            "alert": alert_text
        })

    return {"ports": formatted_ports}


# Major ports and hubs coordinates
MAJOR_LOCATIONS = {
    "india_ports": [
        {"name": "Mumbai Port", "lat": 18.9388, "lng": 72.8354, "type": "port"},
        {"name": "Chennai Port", "lat": 13.0827, "lng": 80.2707, "type": "port"},
        {"name": "Kolkata Port", "lat": 22.5726, "lng": 88.3639, "type": "port"},
        {"name": "Visakhapatnam Port", "lat": 17.6868, "lng": 83.2185, "type": "port"},
        {"name": "Kandla Port", "lat": 23.0333, "lng": 70.2167, "type": "port"},
        {"name": "Cochin Port", "lat": 9.9674, "lng": 76.2376, "type": "port"},
    ],
    "india_hubs": [
        {"name": "Bangalore", "lat": 12.9716, "lng": 77.5946, "type": "manufacturing"},
        {"name": "Pune", "lat": 18.5204, "lng": 73.8567, "type": "manufacturing"},
        {"name": "Ahmedabad", "lat": 23.0225, "lng": 72.5714, "type": "manufacturing"},
        {"name": "Delhi NCR", "lat": 28.7041, "lng": 77.1025, "type": "manufacturing"},
        {"name": "Hyderabad", "lat": 17.3850, "lng": 78.4867, "type": "tech"},
    ],
    "global_ports": [
        {"name": "Shanghai", "lat": 31.2304, "lng": 121.4737, "type": "port", "country": "China"},
        {"name": "Singapore", "lat": 1.3521, "lng": 103.8198, "type": "port", "country": "Singapore"},
        {"name": "Rotterdam", "lat": 51.9244, "lng": 4.4777, "type": "port", "country": "Netherlands"},
        {"name": "Los Angeles", "lat": 33.7405, "lng": -118.2668, "type": "port", "country": "USA"},
        {"name": "Dubai", "lat": 25.2048, "lng": 55.2708, "type": "port", "country": "UAE"},
    ]
}

# Country to coordinates mapping
COUNTRY_COORDS = {
    "IND": {"lat": 20.5937, "lng": 78.9629, "name": "India"},
    "CHN": {"lat": 35.8617, "lng": 104.1954, "name": "China"},
    "USA": {"lat": 37.0902, "lng": -95.7129, "name": "United States"},
    "TWN": {"lat": 23.6978, "lng": 120.9605, "name": "Taiwan"},
    "JPN": {"lat": 36.2048, "lng": 138.2529, "name": "Japan"},
    "KOR": {"lat": 35.9078, "lng": 127.7669, "name": "South Korea"},
    "SGP": {"lat": 1.3521, "lng": 103.8198, "name": "Singapore"},
    "DEU": {"lat": 51.1657, "lng": 10.4515, "name": "Germany"},
    "GBR": {"lat": 55.3781, "lng": -3.4360, "name": "United Kingdom"},
    "FRA": {"lat": 46.2276, "lng": 2.2137, "name": "France"},
}


@router.get("/map-data")
async def get_map_data(domestic: bool = False):
    """Get geographic data for map visualization."""
    from data.scheduler import scheduler
    
    items = scheduler.data_store.items
    
    # Filter for India if domestic mode
    if domestic:
        filtered_items = []
        for item in items:
            # Check if India is in countries
            is_india = False
            if item.countries:
                for country in item.countries:
                    if isinstance(country, dict):
                        if country.get('code') == 'IND' or country.get('name') == 'India':
                            is_india = True
                            break
                    elif isinstance(country, str):
                        if country == 'IND' or country == 'India':
                            is_india = True
                            break
            
            # Also check content
            if is_india or (item.content and 'India' in str(item.content)):
                filtered_items.append(item)
        
        items = filtered_items
    
    # Map events to coordinates
    disruptions = []
    for item in items:
        # Get coordinates from country
        coords = None
        if item.countries and len(item.countries) > 0:
            first_country = item.countries[0]
            country_code = None
            
            if isinstance(first_country, dict):
                country_code = first_country.get('code')
            elif isinstance(first_country, str):
                country_code = first_country
            
            if country_code:
                coords = COUNTRY_COORDS.get(country_code)
        
        if coords:
            # Clean HTML from content
            clean_content = clean_html_content(item.content) if item.content else ""
            
            disruptions.append({
                "id": item.id,
                "title": item.title,
                "lat": coords["lat"],
                "lng": coords["lng"],
                "severity": item.severity or "medium",
                "category": item.category or "other",
                "content": clean_content[:150] + "..." if len(clean_content) > 150 else clean_content,
                "created_at": item.scraped_at.isoformat() if item.scraped_at else datetime.utcnow().isoformat(),
            })
    
    # Get relevant locations
    locations = []
    if domestic:
        locations = MAJOR_LOCATIONS["india_ports"] + MAJOR_LOCATIONS["india_hubs"]
    else:
        locations = MAJOR_LOCATIONS["global_ports"]
    
    # Calculate statistics
    total_disruptions = len(disruptions)
    critical_count = sum(1 for d in disruptions if d["severity"] == "critical")
    high_count = sum(1 for d in disruptions if d["severity"] == "high")
    
    return {
        "disruptions": disruptions,
        "locations": locations,
        "stats": {
            "total": total_disruptions,
            "critical": critical_count,
            "high": high_count,
            "medium": total_disruptions - critical_count - high_count,
        },
        "mode": "domestic" if domestic else "global",
    }


@router.get("/reminders")
async def get_smart_reminders():
    """Get smart reminders with intelligent forecasting."""
    from data.scheduler import scheduler
    from data.weather_monitor import weather_monitor
    from data.impact_analyzer import impact_analyzer
    
    reminders = []
    
    # 1. Weather Forecast Alerts (using impact analyzer)
    try:
        weather_data = await weather_monitor.check_all_ports()
        
        for item in weather_data:
            # Run impact analysis on weather forecast
            weather_alerts = await impact_analyzer.analyze_weather_impact(item["weather"])
            
            for alert in weather_alerts:
                # Prioritize India-related alerts
                priority = "high" if "India" in alert.affected_regions or item["country"] == "IND" else alert.severity
                
                reminders.append({
                    "id": alert.alert_id,
                    "type": "weather",
                    "priority": priority if priority in ["high", "medium", "low"] else alert.severity,
                    "title": f"{alert.title}: {item['port']}",
                    "message": f"{alert.description} ({alert.timeframe})",
                    "action": alert.recommendations[0] if alert.recommendations else "Monitor situation",
                    "link": "/dashboard/weather"
                })
    except Exception as e:
        print(f"Weather forecast error: {e}")
        pass
    
    # 2. Geopolitical Risk Detection (from scraped news)
    try:
        items = scheduler.data_store.items
        
        # Filter for recent geopolitical news
        recent_items = [
            item for item in items
            if item.scraped_at and (datetime.utcnow() - item.scraped_at).days < 3
        ]
        
        # Run geopolitical analysis
        geo_alerts = await impact_analyzer.analyze_geopolitical_risk(
            [{"id": i.id, "title": i.title, "content": i.content or "", "severity": i.severity, 
              "category": i.category, "countries": i.countries} for i in recent_items]
        )
        
        for alert in geo_alerts:
            # Prioritize India-related alerts
            is_india_related = "IND" in alert.affected_regions or "India" in str(alert.affected_regions)
            priority = "high" if is_india_related else alert.severity
            
            reminders.append({
                "id": alert.alert_id,
                "type": "geopolitical",
                "priority": priority if priority in ["high", "medium", "low"] else alert.severity,
                "title": alert.title,
                "message": alert.description,
                "action": alert.recommendations[0] if alert.recommendations else "Review impact",
                "link": "/dashboard/debug"
            })
    except Exception as e:
        print(f"Geopolitical analysis error: {e}")
        pass
    
    # 3. Trade Route Health Analysis
    try:
        weather_data = await weather_monitor.check_all_ports()
        items = scheduler.data_store.items
        
        # Get all weather and geo alerts
        all_weather_alerts = []
        for item in weather_data:
            alerts = await impact_analyzer.analyze_weather_impact(item["weather"])
            all_weather_alerts.extend(alerts)
        
        recent_items = [
            item for item in items
            if item.scraped_at and (datetime.utcnow() - item.scraped_at).days < 3
        ]
        all_geo_alerts = await impact_analyzer.analyze_geopolitical_risk(
            [{"id": i.id, "title": i.title, "content": i.content or "", "severity": i.severity,
              "category": i.category, "countries": i.countries} for i in recent_items]
        )
        
        # Analyze combined route health
        route_alerts = await impact_analyzer.analyze_trade_route_health(
            all_weather_alerts,
            all_geo_alerts,
            weather_data
        )
        
        for alert in route_alerts:
            # Prioritize India routes
            is_india_route = "India" in alert.affected_regions
            priority = "high" if is_india_route else alert.severity
            
            reminders.append({
                "id": alert.alert_id,
                "type": "route",
                "priority": priority if priority in ["high", "medium", "low"] else alert.severity,
                "title": alert.title,
                "message": alert.description,
                "action": alert.recommendations[0] if alert.recommendations else "Review routes",
                "link": "/dashboard/graph"
            })
    except Exception as e:
        print(f"Route analysis error: {e}")
        pass
    
    # 4. High-severity news items (fallback for items not caught by geo analysis)
    try:
        items = scheduler.data_store.items
        recent_high_risk = [
            item for item in items
            if item.severity in ["critical", "high"] and 
            item.scraped_at and 
            (datetime.utcnow() - item.scraped_at).days < 1
        ]
        
        # Only add if not already covered by geo analysis
        existing_ids = {r["id"] for r in reminders}
        for item in recent_high_risk[:2]:
            if f"geo-trade-{item.id}" not in existing_ids and f"geo-conflict-{item.id}" not in existing_ids:
                # Prioritize India-related news
                is_india_related = "IND" in item.countries or "India" in item.title
                priority = "high" if is_india_related else "medium"
                
                reminders.append({
                    "id": f"risk-{item.id}",
                    "type": "risk",
                    "priority": priority,
                    "title": f"Supply Chain Alert: {item.category or 'General'}",
                    "message": item.title[:120] + "..." if len(item.title) > 120 else item.title,
                    "action": "Review details",
                    "link": "/dashboard/debug"
                })
    except Exception as e:
        print(f"High-risk news error: {e}")
        pass
    
    # 5. System health reminders
    try:
        stats = scheduler.stats.to_dict()
        last_run = stats.get("last_run")
        
        if last_run:
            last_run_dt = datetime.fromisoformat(last_run.replace("Z", "+00:00"))
            hours_since = (datetime.utcnow() - last_run_dt.replace(tzinfo=None)).total_seconds() / 3600
            
            if hours_since > 24:
                reminders.append({
                    "id": "scraper-idle",
                    "type": "system",
                    "priority": "low",
                    "title": "Scraper Idle",
                    "message": f"No scraping activity for {int(hours_since)} hours. Run a new session to update intelligence.",
                    "action": "Start scraping",
                    "link": "/dashboard/scraping"
                })
    except Exception as e:
        print(f"System health error: {e}")
        pass
    
    # Sort by priority (high first, then India-related)
    priority_order = {"high": 0, "medium": 1, "low": 2}
    reminders.sort(key=lambda x: priority_order.get(x["priority"], 3))
    
    return {
        "reminders": reminders[:8],  # Max 8 reminders (increased from 6)
        "count": len(reminders)
    }


# Simple in-memory storage for report history (replace with DB in production)
REPORT_HISTORY = []


@router.get("/reports/history")
async def get_report_history():
    """Get history of generated executive reports."""
    # Return last 20 reports sorted by date
    sorted_history = sorted(REPORT_HISTORY, key=lambda x: x["created_at"], reverse=True)
    return {"reports": sorted_history[:20]}


@router.post("/report-data")
async def get_executive_report_data(
    save_report: bool = False
):
    """
    Generate aggregated data for the Executive Briefing Report.
    Includes top video risks and strategic recommendations.
    """
    from data.scheduler import scheduler
    items = scheduler.data_store.items
    
    # 1. Executive Summary Stats
    total_events = len(items)
    critical_events = [i for i in items if i.severity == "critical"]
    high_events = [i for i in items if i.severity == "high"]
    
    # Prepare context for AI
    import json
    from agents.llm_router import analyze_with_nvidia
    
    # Gather top risks for context - Prioritize by Recency
    
    # Sort by date descending
    critical_events = sorted(critical_events, key=lambda x: x.scraped_at if x.scraped_at else datetime.min, reverse=True)
    high_events = sorted(high_events, key=lambda x: x.scraped_at if x.scraped_at else datetime.min, reverse=True)
    
    risk_descriptions = []
    # Take top 8 most recent critical/high events for context
    combined_risks = (critical_events + high_events)[:8]
    
    for item in combined_risks:
        # Clean and truncate content for context
        content_preview = clean_html_content(item.content)[:350] + "..." if item.content else "No details available."
        
        desc = f"""
        - [{item.severity.upper()}] {item.title}
          Region: {item.countries} | Category: {item.category}
          Summary: {content_preview}
        """
        risk_descriptions.append(desc.strip())
    
    threats_context = "\n".join(risk_descriptions) if risk_descriptions else "No specific high-severity threats active."
    
    # Prompt for AI Report Generation
    prompt = f"""
    You are a Chief Supply Chain Officer generating a confidential Executive Briefing.
    
    CONTEXT:
    - Active Critical Threats: {len(critical_events)}
    - Active High Threats: {len(high_events)}
    - Key Intelligence:
    {threats_context}
    
    TASK:
    Generate a JSON object for the executive report.
    1. 'summary_text': A professional 2-sentence executive summary of the current risk landscape.
    2. 'top_threats': Select the top 3-5 most critical threats from context. Format nicely.
    3. 'recommendations': 4 specific, actionable strategic recommendations based on the intelligence.
    
    OUTPUT JSON FORMAT:
    {{
        "summary_text": "...",
        "top_threats": [
             {{"title": "...", "category": "...", "country": "...", "impact": "..."}}
        ],
        "recommendations": ["...", "...", "...", "..."],
        "risk_level": "CRITICAL" or "HIGH" or "MODERATE" or "LOW"
    }}
    """
    
    try:
        response_text = await analyze_with_nvidia(prompt)
        
        # Clean JSON
        import re
        json_match = re.search(r"(\{.*\})", response_text, re.DOTALL)
        if json_match:
            ai_data = json.loads(json_match.group(1))
        else:
            raise ValueError("No JSON found in AI response")
            
        # Merge AI data with system stats
        # Merge AI data with system stats
        report_data = {
            "generated_at": datetime.utcnow().isoformat(),
            "summary": {
                "risk_level": ai_data.get("risk_level", "HIGH"),
                "risk_score": min(len(critical_events) * 10 + len(high_events) * 5, 95),
                "total_active_threats": len(critical_events) + len(high_events),
                "text": ai_data.get("summary_text", "Risk levels elevated due to detected supply chain disruptions.")
            },
            "top_threats": ai_data.get("top_threats", []),
            "recommendations": ai_data.get("recommendations", []),
            "system_status": {
                "sources_monitored": 15,
                "last_scan": datetime.utcnow().isoformat()
            }
        }
        
        # Save to history if requested
        if save_report:
            REPORT_HISTORY.append({
                "id": f"rpt-{int(datetime.utcnow().timestamp())}",
                "title": f"Executive Briefing ({report_data['summary']['risk_level']})",
                "created_at": report_data["generated_at"],
                "data": report_data
            })
            
        return report_data
    except Exception as e:
        print(f"AI Report generation failed: {e}")
        # Fallback to static if AI fails
        return {
            "generated_at": datetime.utcnow().isoformat(),
            "summary": {
                "risk_level": "MODERATE",
                "risk_score": 65,
                "total_active_threats": len(critical_events) + len(high_events),
                "text": "Automated analysis indicates moderate supply chain pressure. AI generation temporarily unavailable."
            },
            "top_threats": [],
            "recommendations": ["Monitor key suppliers", "Review inventory levels"],
            "system_status": {
                "sources_monitored": 15,
                "last_scan": datetime.utcnow().isoformat()
            }
        }
