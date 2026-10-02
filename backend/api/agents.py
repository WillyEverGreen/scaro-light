from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from typing import Optional
from agents.orchestrator import orchestrator
from agents.state import Mission, AnalysisType

router = APIRouter()

@router.post("/mission/start")
async def start_mission(
    goal: str,
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None)
):
    """
    Start a new Agentic Mission.
    Accepts an optional file (CSV/TXT) for context context.
    """
    file_context = None
    if file:
        content = await file.read()
        file_context = {
            "filename": file.filename,
            "file_content": content.decode("utf-8") # Simple text decoding for MVP
        }
    
    # We run the orchestrator in the background because it can take time
    # In a real system, we'd use Celery/Redis queue
    # For now, we launch it and return the mission ID immediately
    
    # Since orchestrator.start_mission is async and returns a result, we need to wrap it properly
    # or just return 'accepted' and let it run.
    # Given the Architecture, let's run it and return the ID.
    
    # Note: FastAPIs background_tasks expects a sync function or async function.
    # But we want to return the mission ID *before* it finishes.
    # Orchestrator doesn't have a 'submit' method yet that returns ID immediately.
    # Let's Modify the orchestrator call slightly or just await it if we want immediate results for this demo
    # OR wrap it.
    
    # For this redesign, let's make it interactive-ish or return a mission ID to poll.
    # I'll simply await it for the demo to show immediate results in the response, 
    # unless it's too slow. Real agents are slow. 
    # Let's run it in background and simple return "Mission Started".
    
    background_tasks.add_task(orchestrator.start_mission, goal, file_context)
    
    return {
        "status": "started",
        "message": "Agentic mission started in background.",
        "goal": goal,
        "context_file": file.filename if file else None
    }

@router.get("/status")
async def get_agent_status():
    """Check status of agents."""
    return {
        "orchestrator": orchestrator.state,
        "active_mission": orchestrator.state.current_mission_id
    }
