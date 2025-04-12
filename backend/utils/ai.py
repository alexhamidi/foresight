import os
from openai import OpenAI
from typing import Dict, List
import json
from utils.logger import setup_logger
from utils.embedding import create_embedding
from utils.supabase import get_items
from pydantic import BaseModel
from google import genai



# Initialize OpenAI client and logger
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = setup_logger("ai")

class AnalysisResponse(BaseModel):
    problem_statement: str
    target_users: str
    terms: List[str]

def analyze_query(query: str) -> Dict[str, str]:
    system_prompt = """You are a product analyst who helps identify core information from product ideas.
    Extract the vital information from the prompt. Your response should be extremely concise, around 8-12 words. Focus only the specific/unique aspects and terms of the idea - for example, given a prompt like \"AI music composition tool\", focus more on the music aspects than the \"tool\" aspects."""

    user_prompt = f"""
    Please analyze this product/project idea.
    {query}
    """

    try:
        logger.debug(f"Analyzing query: {query}")

        prompt = f"""
SYSTEM PROMPT:
{system_prompt}

USER PROMPT:
{user_prompt}
"""
        # Initialize Gemini client
        gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

        # Generate content with JSON schema
        response = gemini_client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': AnalysisResponse,
            }
        )

        # Get the parsed response
        json_content = response.parsed.model_dump()

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

def get_chat_response(message: str, items: List[dict] = None) -> dict:
    system_prompt = """You are a helpful AI assistant that provides clear and very concise responses to user queries about software products and projects. You can use the provided sources to answer the user's query, citing them with [num], where num is the index+1 of the source in the list. Use your own knowledge of products and projects to provide additional projects not mentioned in the sources. If the user's query is not related to software products and projects, start your response with [NO_SOURCES]. """
    try:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ]

        if items:
            messages.insert(1, {"role": "user", "content": json.dumps(items)})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )

        content = response.choices[0].message.content
        print(content)
        needs_sources = not content.startswith("[NO_SOURCES]")

        # Remove the [NO_SOURCES] prefix if present
        if not needs_sources:
            content = content[len("[NO_SOURCES]"):].strip()

        return {
            "content": content,
            "needs_sources": needs_sources
        }

    except Exception as e:
        error_msg = f"Failed to get chat response: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            "content": f"I apologize, but I encountered an error: {error_msg}",
            "needs_sources": False
        }


def main():
    pass



if __name__ == "__main__":

    main()
