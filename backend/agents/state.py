from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class AnalysisType(str, Enum):
    GLOBAL_MONITORING = "global_monitoring"
    TARGETED_SURVEILLANCE = "targeted_surveillance"

class AgentStatus(str, Enum):
    IDLE = "idle"
    PLANNING = "planning"
    EXECUTING = "executing"
    WAITING = "waiting"
    COMPLETED = "completed"
    FAILED = "failed"

class ScrapedEvidence(BaseModel):
    """Evidence collected by scrapers."""
    url: str
    title: str
    content: str
    source_type: str = "web"
    relevance_score: float = 0.0
    extracted_at: datetime = Field(default_factory=datetime.utcnow)

class UserContext(BaseModel):
    """Context derived from user uploads."""
    suppliers: List[str] = Field(default_factory=list)
    parts: List[str] = Field(default_factory=list)
    routes: List[str] = Field(default_factory=list)
    focus_topics: List[str] = Field(default_factory=list)

class Task(BaseModel):
    """Atomic task for an agent."""
    id: str
    description: str
    agent_type: str  # "researcher", "scraper", "analyst"
    status: AgentStatus = AgentStatus.IDLE
    result: Optional[Any] = None
    error: Optional[str] = None

class Mission(BaseModel):
    """High-level mission (e.g., 'Monitor Global Risks')."""
    id: str
    goal: str
    analysis_type: AnalysisType
    context: UserContext = Field(default_factory=UserContext)
    tasks: List[Task] = Field(default_factory=list)
    status: AgentStatus = AgentStatus.IDLE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class AgentState(BaseModel):
    """Runtime state of an agent."""
    agent_id: str
    agent_name: str
    current_mission_id: Optional[str] = None
    status: AgentStatus = AgentStatus.IDLE
    memory: Dict[str, Any] = Field(default_factory=dict)
