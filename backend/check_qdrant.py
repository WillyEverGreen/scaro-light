import sys
from qdrant_client import QdrantClient
import qdrant_client

# print(f"Qdrant Client Version: {qdrant_client.__version__}")

try:
    client = QdrantClient("localhost", port=6333)
    print("Client created.")
    print(f"Has 'search': {hasattr(client, 'search')}")
    print(f"Has 'query': {hasattr(client, 'query')}")
    print(f"Has 'query_points': {hasattr(client, 'query_points')}")
    
    print("\nDir(client):")
    print([x for x in dir(client) if not x.startswith("_")])
except Exception as e:
    print(f"Error: {e}")
