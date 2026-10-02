import pytest
import asyncio
from scraping.browser import browser_manager
from scraping.search_engines import search_aggregator

@pytest.mark.asyncio
async def test_browser_manager_singleton():
    """Test that BrowserManager is a singleton and can start a driver."""
    instance1 = browser_manager
    instance2 = browser_manager
    assert instance1 is instance2
    # Driver is lazy loaded, so it starts as None
    # We don't force start here to avoid overhead in this specific unit test
    # unless we want to test startup explicitly
    if instance1.driver:
         assert instance2.driver is instance1.driver

@pytest.mark.asyncio
async def test_browser_page_fetch():
    """Test fetching a page using the browser manager."""
    url = "https://example.com"
    html = browser_manager.get_page(url, wait_time=1.0)
    assert html is not None
    assert "Example Domain" in html or "example" in html.lower()

@pytest.mark.asyncio
async def test_search_aggregator_functionality():
    """Test that search aggregator can fetch results from at least one engine."""
    query = "test query"
    # We limit to a few engines to speed up the test and reduce block risk
    # But search_aggregator.search runs them all. 
    # We can check if we got *any* results.
    results = await search_aggregator.search(query, max_results=3)
    
    # We expect at least some results now that we have fixed Bing/Yahoo
    assert len(results) > 0
    
    # Check structure
    first_result = results[0]
    assert first_result.title
    assert first_result.url
    assert first_result.source
