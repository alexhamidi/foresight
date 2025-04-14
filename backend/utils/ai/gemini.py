#========================================
# Imports and Initialization
#========================================
import os
from google import genai
from utils.logger import setup_logger
from pydantic import BaseModel
from typing import List, Dict

logger = setup_logger("ai")
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

#========================================
# Query Analysis Functions
#========================================
def get_chat_response(system_prompt: str, user_prompt: str, response_schema: BaseModel | None = None) -> str | Dict[str, str]:
    prompt = f"""
        SYSTEM PROMPT:
        {system_prompt}

        USER PROMPT:
        {user_prompt}
        """

    try:

        # Initialize Gemini client

        # Generate content with JSON schema
        response = gemini_client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
            config = {
                'response_mime_type': 'application/json',
                **({'response_schema': response_schema} if response_schema else {})
            }
        )

        return response.parsed.model_dump() if response_schema else response.text

    except Exception as e:
        error_msg = f"Failed to analyze query: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            "error": error_msg,
            "original_query": prompt,
            "terms": []
        }
