"""
Pipeline Verification Script

Tests the full data processing pipeline.
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()


async def verify_pipeline():
    print("=" * 60)
    print("Edgecase Pipeline Verification")
    print("=" * 60)
    
    results = {}
    
    # 1. Check NVIDIA API
    print("\n1. Checking NVIDIA API...")
    try:
        from ai.nvidia_client import nvidia_client
        if nvidia_client.client:
            print("   ✓ NVIDIA API client initialized")
            results["nvidia"] = True
        else:
            print("   ✗ NVIDIA API client NOT initialized")
            results["nvidia"] = False
        
        from agents.llm_router import LLMRouter
        router = LLMRouter()
        print(f"   - LLM Router initialized: {router.has_nvidia}")
    except Exception as e:
        print(f"   ✗ NVIDIA error: {e}")
        results["nvidia"] = False
    
    # 3. Check Neo4j connection
    print("\n3. Checking Neo4j...")
    try:
        from db.neo4j_client import neo4j_client
        # Run a simple query
        async with neo4j_client.driver.session() as session:
            result = await session.run("MATCH (n) RETURN count(n) as count")
            record = await result.single()
            count = record["count"] if record else 0
        print(f"   ✓ Neo4j connected - {count} total nodes in database")
        results["neo4j"] = True
    except Exception as e:
        print(f"   ✗ Neo4j error: {e}")
        results["neo4j"] = False
    
    # 4. Check Qdrant
    print("\n4. Checking Qdrant...")
    try:
        from db.qdrant_client import qdrant_client
        # Simple health check
        print("   ✓ Qdrant client initialized")
        results["qdrant"] = True
    except Exception as e:
        print(f"   ✗ Qdrant error: {e}")
        results["qdrant"] = False
    
    # 5. Check Feed Manager
    print("\n5. Checking Feed Manager...")
    try:
        from feeds.feed_manager import feed_manager
        stats = feed_manager.get_stats()
        print(f"   ✓ {stats['feeds_count']} feeds configured")
        print(f"   - Is running: {stats['is_running']}")
        print(f"   - Total articles: {stats['total_articles']}")
        results["feed_manager"] = True
    except Exception as e:
        print(f"   ✗ Feed Manager error: {e}")
        results["feed_manager"] = False
    
    # 6. Check Scheduler Data Store
    print("\n6. Checking Scheduler Data Store...")
    try:
        from data.scheduler import scheduler
        store_stats = scheduler.data_store.get_stats()
        print(f"   ✓ Data store active - {store_stats.get('total', 0)} items")
        results["scheduler"] = True
    except Exception as e:
        print(f"   ✗ Scheduler error: {e}")
        results["scheduler"] = False
    
    # 7. Test Data Processor
    print("\n7. Testing Data Processor with NVIDIA extraction...")
    try:
        from data.processor import data_processor
        
        test_item = await data_processor.process_item(
            title="Test: Semiconductor shortage affects Taiwan manufacturing",
            content="TSMC reported significant chip demand amid global semiconductor shortages. Taiwan-based company expanding production for Apple and Nvidia orders. Supply chain disruptions affecting automotive electronics industries worldwide.",
            url="https://test.example.com/verify-" + str(asyncio.get_event_loop().time()),
            source="test_verification",
            source_name="Pipeline Test",
            use_ai=True,
        )
        
        print(f"   ✓ Article processed successfully")
        print(f"   - Countries: {test_item.countries}")
        print(f"   - Commodities: {test_item.commodities}")
        print(f"   - Category: {test_item.category}")
        print(f"   - Risk Score: {test_item.risk_score:.2f}")
        results["processor"] = True
        
        # 8. Store to Neo4j
        print("\n8. Storing test item to Neo4j...")
        try:
            await data_processor.store_to_neo4j(test_item)
            print("   ✓ Stored to Neo4j successfully")
            results["neo4j_store"] = True
        except Exception as e:
            print(f"   ✗ Neo4j store failed: {e}")
            results["neo4j_store"] = False
        
        # 9. Store to Qdrant
        print("\n9. Storing test item to Qdrant...")
        try:
            await data_processor.store_to_qdrant(test_item)
            print("   ✓ Stored to Qdrant successfully")
            results["qdrant_store"] = True
        except Exception as e:
            print(f"   ✗ Qdrant store failed: {e}")
            results["qdrant_store"] = False
            
    except Exception as e:
        print(f"   ✗ Data Processor error: {e}")
        import traceback
        traceback.print_exc()
        results["processor"] = False
        results["neo4j_store"] = False
        results["qdrant_store"] = False
    
    # 10. Check Graph has data
    print("\n10. Checking Neo4j graph data...")
    try:
        from db.neo4j_client import neo4j_client
        async with neo4j_client.driver.session() as session:
            # Count different node types
            result = await session.run("""
                MATCH (v:Vendor) RETURN count(v) as vendors
            """)
            record = await result.single()
            vendors = record["vendors"] if record else 0
            
            result = await session.run("""
                MATCH (c:Country) RETURN count(c) as countries
            """)
            record = await result.single()
            countries = record["countries"] if record else 0
            
            result = await session.run("""
                MATCH (e:Event) RETURN count(e) as events
            """)
            record = await result.single()
            events = record["events"] if record else 0
        
        print(f"   - Vendors: {vendors}")
        print(f"   - Countries: {countries}")
        print(f"   - Events: {events}")
        results["graph_data"] = (vendors + countries + events) > 0
        
    except Exception as e:
        print(f"   ✗ Graph check error: {e}")
        results["graph_data"] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, status in results.items():
        icon = "✓" if status else "✗"
        print(f"  {icon} {name}")
    
    print(f"\n  Result: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n  🎉 All systems operational!")
    elif passed >= total - 2:
        print("\n  ✓ Core systems working - minor issues to address")
    else:
        print("\n  ⚠️  Some systems need attention")
    
    return results


if __name__ == "__main__":
    asyncio.run(verify_pipeline())
