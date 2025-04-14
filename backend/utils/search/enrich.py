#========================================
# Imports and Initialization
#========================================
import os
from ..ai import gemini
from utils.logger import setup_logger
from pydantic import BaseModel
from typing import List, Dict

logger = setup_logger("ai")

#========================================
# Data Models
#========================================
class AnalysisResponse(BaseModel):
    """Schema for AI analysis response.

    Attributes:
        problem_statement: Core problem being solved
        target_users: Target audience description
        terms: Key terms extracted from query
    """
    problem_statement: str
    target_users: str
    terms: List[str]

#========================================
# Query Analysis Functions
#========================================
def analyze_query(query: str) -> Dict[str, str]:
    """Analyze a product/project idea query using Gemini AI.

    Uses Gemini to extract key information about the problem statement,
    target users, and important terms from the query.

    Args:
        query: The product/project idea query text

    Returns:
        Dictionary containing problem statement, target users and key terms

    Raises:
        Exception: If there is an error analyzing the query
    """
    system_prompt = """You are a product analyst who helps identify core information from product ideas.
    Extract the vital information from the prompt. Your response should be extremely concise, around 8-12 words. Focus only the specific/unique aspects and terms of the idea - for example, given a prompt like \"AI music composition tool\", focus more on the music aspects than the \"tool\" aspects."""

    user_prompt = f"""
    Please analyze this product/project idea.
    {query}
    """

    try:
        logger.debug(f"Analyzing query: {query}")

        # Initialize Gemini client


        # Get the parsed response
        json_content = gemini.get_chat_response(system_prompt, user_prompt, AnalysisResponse)

        # Ensure terms is a list
        if isinstance(json_content.get('terms'), str):
            json_content['terms'] = [term.strip() for term in json_content['terms'].split(',')]
        elif not isinstance(json_content.get('terms'), list):
            json_content['terms'] = []

        logger.debug(f"AI analysis results: {json_content}")
        return json_content

    except Exception as e:
        error_msg = f"Failed to analyze query: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            "error": error_msg,
            "original_query": query,
            "terms": []
        }
