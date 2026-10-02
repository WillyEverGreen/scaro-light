import asyncio
import logging
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from agents.orchestrator import orchestrator
from agents.state import Mission, AgentStatus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_agents")

async def main():
    logger.info("Starting Edgecase Agent Verification")
    
    # 1. Test Context Ingestion (Mock File)
    mock_context = {
        "filename": "suppliers.csv",
        "file_content": "Supplier,Part\nTSMC,Semiconductors\nFoxconn,Assembly"
    }
    
    goal = "Investigate production delays for key suppliers"
    
    logger.info(f"Goal: {goal}")
    logger.info("Starting Mission...")
    
    result = await orchestrator.start_mission(goal, file_context=mock_context)
    
    mission = result.get("mission")
    results = result.get("results", [])
    
    logger.info("------------------------------------------------")
    logger.info(f"Mission ID: {mission.id}")
    logger.info(f"Status: {mission.status}")
    
    if mission.context:
        logger.info(f"Context Extracted: {len(mission.context.suppliers)} suppliers found ({mission.context.suppliers})")
    
    logger.info(f"Analysed Results: {len(results)}")
    
    for res in results:
        logger.info(f"URL: {res['url']}")
        logger.info(f"Risk Score: {res['analysis'].get('risk_score')}")
        logger.info(f"Summary: {res['analysis'].get('summary')}")
        logger.info("---")

    logger.info("Verification Complete")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
    except Exception as e:
        logger.error(f"Verification Failed: {e}")
