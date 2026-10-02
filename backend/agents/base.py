from abc import ABC, abstractmethod
import logging
from typing import Optional, Any
from agents.state import AgentState, Task, AgentStatus

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """
    Abstract base class for all Edgecase agents.
    Enforces a standard lifecycle: Plan -> Execute -> Observe (optional).
    """

    def __init__(self, name: str, agent_type: str):
        self.state = AgentState(
            agent_id=f"{agent_type}_{name.lower()}",
            agent_name=name
        )
        self.type = agent_type
        self.logger = logging.getLogger(f"agents.{agent_type}")

    @abstractmethod
    async def process(self, task: Task, context: Optional[Any] = None) -> Any:
        """
        Process a specific task.
        Must return the result of the task.
        """
        pass

    async def run_task(self, task: Task, context: Optional[Any] = None) -> Task:
        """
        Standard wrapper to run a task with status updates.
        """
        self.state.status = AgentStatus.EXECUTING
        self.state.current_mission_id = task.id
        task.status = AgentStatus.EXECUTING
        
        self.logger.info(f"[{self.state.agent_name}] Starting task: {task.description}")

        try:
            result = await self.process(task, context)
            task.result = result
            task.status = AgentStatus.COMPLETED
            self.logger.info(f"[{self.state.agent_name}] Completed task successfully.")
        except Exception as e:
            self.logger.error(f"[{self.state.agent_name}] Task failed: {e}")
            task.error = str(e)
            task.status = AgentStatus.FAILED
        finally:
            self.state.status = AgentStatus.IDLE
            self.state.current_mission_id = None
        
        return task
