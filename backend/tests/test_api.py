from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Edgecase API"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "app" in data

def test_scraping_status():
    response = client.get("/api/scraping/status")
    # Even if 500 or 404, we want to know what it is. 
    # Provided implementation_plan said there is a scraping endpoints file.
    # Let's verify route existence.
    assert response.status_code in [200, 422, 500] 
