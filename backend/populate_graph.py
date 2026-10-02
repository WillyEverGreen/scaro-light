"""
Check Neo4j and populate test data if empty.
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()


async def check_and_populate():
    from db.neo4j_client import neo4j_client
    
    print("Checking Neo4j...")
    
    # Count nodes
    try:
        result = await neo4j_client.execute_query("MATCH (n) RETURN count(n) as count")
        count = result[0]["count"] if result else 0
        print(f"Total nodes in Neo4j: {count}")
        
        # Count by type
        for label in ["Vendor", "Country", "Product", "Event"]:
            result = await neo4j_client.execute_query(f"MATCH (n:{label}) RETURN count(n) as count")
            node_count = result[0]["count"] if result else 0
            print(f"  - {label}: {node_count}")
        
        if count < 5:
            print("\n📝 Database is empty. Adding sample supply chain data...")
            
            # Add some sample vendors
            vendors = [
                {"id": "vendor-tsmc", "name": "TSMC", "country": "Taiwan", "industry": "Semiconductor", "tier": 1, "risk_score": 0.7},
                {"id": "vendor-samsung", "name": "Samsung", "country": "South Korea", "industry": "Electronics", "tier": 1, "risk_score": 0.5},
                {"id": "vendor-intel", "name": "Intel", "country": "USA", "industry": "Semiconductor", "tier": 1, "risk_score": 0.4},
                {"id": "vendor-nvidia", "name": "NVIDIA", "country": "USA", "industry": "GPU", "tier": 1, "risk_score": 0.6},
                {"id": "vendor-foxconn", "name": "Foxconn", "country": "Taiwan", "industry": "Manufacturing", "tier": 2, "risk_score": 0.5},
            ]
            
            for v in vendors:
                await neo4j_client.create_vendor_node(v)
                print(f"  ✓ Created vendor: {v['name']}")
            
            # Add some countries
            countries = [
                {"code": "TWN", "name": "Taiwan", "region": "Asia", "risk_score": 0.7, "is_sanctioned": False},
                {"code": "CHN", "name": "China", "region": "Asia", "risk_score": 0.6, "is_sanctioned": False},
                {"code": "USA", "name": "United States", "region": "North America", "risk_score": 0.2, "is_sanctioned": False},
                {"code": "KOR", "name": "South Korea", "region": "Asia", "risk_score": 0.3, "is_sanctioned": False},
                {"code": "JPN", "name": "Japan", "region": "Asia", "risk_score": 0.3, "is_sanctioned": False},
            ]
            
            for c in countries:
                await neo4j_client.create_country_node(c)
                print(f"  ✓ Created country: {c['name']}")
            
            # Add products
            products = [
                {"id": "product-gpu", "name": "GPU", "category": "semiconductor", "risk_score": 0.7},
                {"id": "product-dram", "name": "DRAM", "category": "memory", "risk_score": 0.5},
                {"id": "product-nand", "name": "NAND Flash", "category": "storage", "risk_score": 0.4},
                {"id": "product-cpu", "name": "CPU", "category": "semiconductor", "risk_score": 0.5},
            ]
            
            for p in products:
                await neo4j_client.create_product_node(p)
                print(f"  ✓ Created product: {p['name']}")
            
            # Add events
            events = [
                {"id": "event-shortage-1", "title": "Semiconductor shortage", "category": "shortage", "severity": "high", "impact_score": 0.8, "country": "Taiwan"},
                {"id": "event-tariff-1", "title": "US-China tariffs", "category": "trade", "severity": "medium", "impact_score": 0.6, "country": "China"},
            ]
            
            for e in events:
                await neo4j_client.create_event_node(e)
                print(f"  ✓ Created event: {e['title']}")
            
            # Add relationships
            relationships = [
                ("Vendor", "vendor-tsmc", "Country", "TWN", "LOCATED_IN"),
                ("Vendor", "vendor-samsung", "Country", "KOR", "LOCATED_IN"),
                ("Vendor", "vendor-intel", "Country", "USA", "LOCATED_IN"),
                ("Vendor", "vendor-nvidia", "Country", "USA", "LOCATED_IN"),
                ("Vendor", "vendor-tsmc", "Product", "product-gpu", "MANUFACTURES"),
                ("Vendor", "vendor-samsung", "Product", "product-dram", "MANUFACTURES"),
                ("Event", "event-shortage-1", "Country", "TWN", "AFFECTS"),
                ("Event", "event-shortage-1", "Product", "product-gpu", "IMPACTS"),
            ]
            
            for r in relationships:
                await neo4j_client.create_relationship(r[0], r[1], r[2], r[3], r[4])
                print(f"  ✓ Created relationship: {r[1]} -{r[4]}-> {r[3]}")
            
            print("\n✅ Sample data populated!")
        else:
            print("\n✓ Database has data")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(check_and_populate())
