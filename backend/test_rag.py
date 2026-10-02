import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

async def test_rag():
    try:
        from db.qdrant_client import qdrant_client
        from ai.embeddings import embeddings_service
        
        print("Testing RAG pipeline...")
        
        # 1. Test embedding generation
        query = "semiconductor"
        print(f"Generating embedding for: '{query}'")
        emb = embeddings_service.generate_embedding(query)
        print(f"Embedding generated: length={len(emb)}")
        
        if not emb:
            print("❌ Embedding generation failed")
            return
            
        # 2. Test search using QdrantVectorClient wrapper
        print("Searching Qdrant...")
        results = qdrant_client.search(query_vector=emb, limit=3)
        print(f"Search results: {len(results)}")
        
        for r in results:
            print(f" - {r.get('payload', {}).get('title', 'Unknown')} (score: {r.get('score'):.4f})")
            
        print("✅ RAG pipeline test passed")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_rag())
