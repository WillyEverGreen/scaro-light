"""
Browser Manager

Provides headless browser instances using undetected-chromedriver to bypass anti-bot measures.
"""

import os
import time
import logging
import threading
import undetected_chromedriver as uc
from selenium.webdriver.chrome.options import Options
from typing import Optional

logger = logging.getLogger(__name__)

class BrowserManager:
    """
    Manages a pool of browser instances or a single shared instance.
    Currently implements a single shared instance with thread safety.
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __init__(self):
        self.driver: Optional[uc.Chrome] = None
        self._init_lock = threading.Lock()
    
    @classmethod
    def get_instance(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance
    
    def _start_driver(self):
        """Start a new undetected-chromedriver instance."""
        try:
            options = uc.ChromeOptions()
            options.add_argument("--headless=new")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--disable-extensions")
            options.add_argument("--disable-notifications")
            options.add_argument("--disable-popup-blocking")
            options.add_argument("--blink-settings=imagesEnabled=false")
            
            # Start driver, explicit path to Google Chrome 144 to avoid conflict with Chromium 143
            self.driver = uc.Chrome(options=options, browser_executable_path="/usr/bin/google-chrome")
            logger.info("Headless browser started successfully.")
        except Exception as e:
            logger.error(f"Failed to start browser: {e}")
            self.driver = None
    
    def get_page(self, url: str, wait_selector: Optional[str] = None, wait_time: float = 2.0) -> str:
        """
        Get page source for a given URL, optionally waiting for a CSS selector.
        
        Args:
            url: The URL to fetch
            wait_selector: CSS selector to wait for (presence)
            wait_time: Additional fixed time to wait
            
        Returns:
            Page source HTML
        """
        with self._init_lock:
            if self.driver is None:
                self._start_driver()
            
            if self.driver is None:
                return ""
            
            try:
                self.driver.get(url)
                
                # Intelligent wait if selector provided
                if wait_selector:
                    try:
                        from selenium.webdriver.common.by import By
                        from selenium.webdriver.support.ui import WebDriverWait
                        from selenium.webdriver.support import expected_conditions as EC
                        
                        WebDriverWait(self.driver, 10).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, wait_selector))
                        )
                        logger.info(f"Successfully waited for selector: {wait_selector}")
                    except Exception as we:
                        logger.warning(f"Timeout waiting for selector {wait_selector} on {url}: {we}")
                
                # Additional buffer time for dynamic content
                time.sleep(wait_time)
                return self.driver.page_source
            except Exception as e:
                logger.error(f"Error fetching URL {url}: {e}")
                # Try restarting driver if it crashed
                self.close()
                return ""
    
    def close(self):
        """Close the browser instance."""
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            self.driver = None

# Global instance
browser_manager = BrowserManager.get_instance()
