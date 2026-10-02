import logging
from typing import List, Dict, Any
from agents.base import BaseAgent
from agents.state import Task, UserContext
import io
import csv

class ContextManager(BaseAgent):
    """
    Ingests user context files (CSV, Text) to extract
    Suppliers, Parts, and Focus Topics.
    """

    def __init__(self):
        super().__init__(name="ContextManager", agent_type="context_manager")

    async def process(self, task: Task, context: Any = None) -> UserContext:
        """
        Task result should be the parsed UserContext.
        Task description might contain the raw file content or path.
        For this MVP, we assume the task.result payload *is* the file content 
        passed from the API, or we simulate parsing.
        """
        # In a real scenario, task would contain file bytes or path.
        # Here we mock parsing based on task input for demonstration
        # or implement basic CSV parsing if content provided.
        
        raw_data = context.get('file_content') if context else None
        filename = context.get('filename') if context else "unknown"

        user_context = UserContext()

        if not raw_data:
            self.logger.warning("No file content provided to ContextManager.")
            return user_context

        if filename.endswith(".csv"):
            self._parse_csv(raw_data, user_context)
        elif filename.endswith(".txt"):
            self._parse_text(raw_data, user_context)
        else:
             self.logger.warning(f"Unsupported file type: {filename}")

        self.logger.info(f"Extracted context: {len(user_context.suppliers)} suppliers, {len(user_context.parts)} parts.")
        return user_context

    def _parse_csv(self, content: str, user_context: UserContext):
        try:
            # Assuming simple CSV with headers like 'Supplier', 'Part', 'Route'
            reader = csv.DictReader(io.StringIO(content))
            for row in reader:
                # Normalize keys to lower case for flexible matching
                row_lower = {k.lower(): v for k, v in row.items()}
                
                if 'supplier' in row_lower and row_lower['supplier']:
                    user_context.suppliers.append(row_lower['supplier'])
                if 'part' in row_lower and row_lower['part']:
                    user_context.parts.append(row_lower['part'])
                if 'route' in row_lower and row_lower['route']:
                    user_context.routes.append(row_lower['route'])
        except Exception as e:
            self.logger.error(f"CSV Parsing extraction error: {e}")

    def _parse_text(self, content: str, user_context: UserContext):
        # Basic heuristic parsing
        lines = content.split('\n')
        for line in lines:
            if "Supplier:" in line:
                user_context.suppliers.append(line.split("Supplier:")[1].strip())
            elif "Part:" in line:
                user_context.parts.append(line.split("Part:")[1].strip())
