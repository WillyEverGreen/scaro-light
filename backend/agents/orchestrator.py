from typing import List, Optional
from agents.base import BaseAgent
from agents.state import Mission, Task, AgentStatus, AnalysisType
from agents.context_manager import ContextManager
from agents.researcher import ResearchAgent
from agents.scraper import ScraperAgent
from agents.analyst import AnalystAgent
from data.weather_monitor import weather_monitor
import uuid

class Orchestrator(BaseAgent):
    """
    The Boss.
    Coordinates the entire agentic workflow:
    Context -> Research -> Scrape -> Analyze
    """

    def __init__(self):
        super().__init__(name="Orchestrator", agent_type="orchestrator")
        # Instantiate sub-agents
        self.context_manager = ContextManager()
        self.researcher = ResearchAgent()
        self.scraper = ScraperAgent()
        self.analyst = AnalystAgent()

    async def process(self, task: Task, context: Optional[dict] = None) -> Mission:
        """
        Standard process method.
        If the task is 'start_mission', delegates to start_mission.
        """
        # Assume task description is the goal
        return await self.start_mission(goal=task.description, file_context=context)

    async def start_mission(self, goal: str, file_context: Optional[dict] = None) -> Mission:
        """
        Entry point for a new mission.
        file_context: dict with 'filename' and 'file_content' (if user uploaded file)
        """
        mission_id = str(uuid.uuid4())
        
        # 1. Determine Analysis Type
        analysis_type = AnalysisType.GLOBAL_MONITORING
        if file_context:
            analysis_type = AnalysisType.TARGETED_SURVEILLANCE
        
        mission = Mission(
            id=mission_id,
            goal=goal,
            analysis_type=analysis_type
        )
        self.logger.info(f"Starting Mission {mission_id}: {goal} [{analysis_type}]")

        # 2. Ingest Context (if applicable)
        if file_context:
            context_task = Task(id=f"ctx_{mission_id}", description="Ingest user file", agent_type="context_manager")
            mission.context = await self.context_manager.process(context_task, context=file_context)
            self.logger.info(f"Context loaded: {mission.context.suppliers}")

        # 2b. Ingest Weather Data
        try:
            weather_alerts = await weather_monitor.get_active_alerts()
            if weather_alerts:
                self.logger.info(f"Found {len(weather_alerts)} weather alerts.")
                for alert in weather_alerts:
                    alert_str = f"WEATHER ALERT: {alert.alert_type.upper()} in {alert.region} ({alert.description})"
                    mission.context.focus_topics.append(alert_str)
                    # If high severity, prioritize region research
                    if alert.impact_score > 0.6:
                         mission.context.focus_topics.append(f"Investigate weather impact in {alert.region}")
        except Exception as e:
            self.logger.warning(f"Weather ingest failed: {e}")

        # 3. Research Phase
        research_task = Task(id=f"res_{mission_id}", description=goal, agent_type="researcher")
        urls = await self.researcher.process(research_task, context=mission.context)
        
        if not urls:
            self.logger.warning("No URLs found. specialized research failed.")
            mission.status = AgentStatus.FAILED
            return mission

        # 4. Execution Loop (Scrape -> Analyze)
        results = []
        for i, url in enumerate(urls[:5]): # Limit to top 5 for demo speed
            try:
                # Scrape
                scrape_task = Task(id=f"scr_{mission_id}_{i}", description=url, agent_type="scraper")
                evidence = await self.scraper.process(scrape_task)
                
                # Analyze
                analyze_task = Task(id=f"ana_{mission_id}_{i}", description="Analyze Risk", agent_type="analyst")
                analysis = await self.analyst.process(analyze_task, context={'evidence': evidence, 'user_context': mission.context})
                
                results.append({
                    "url": url,
                    "analysis": analysis
                })
                self.logger.info(f"Analyzed {url}: Risk Score {analysis.get('risk_score', 'N/A')}")
            
            except Exception as e:
                self.logger.error(f"Pipeline failed for {url}: {e}")

        mission.status = AgentStatus.COMPLETED
        # In a real app, we would store 'results' in the mission object or database
        # For now we attach it effectively as the return value
        return {"mission": mission, "results": results}

# Global entry point
orchestrator = Orchestrator()
