import os
from openai import OpenAI
from typing import Dict
import json
from utils.logger import setup_logger

# Initialize OpenAI client and logger
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = setup_logger("ai")

def analyze_query(query: str) -> Dict[str, str]:
    system_prompt = """You are a product analyst who helps identify core information from product ideas.
    Extract the vital information from the prompt. Your response should be extremely concise, around 8-12 words. Focus only the specific/unique aspects and terms of the idea - for example, given a prompt like \"AI music composition tool\", focus more on the music aspects than the \"tool\" aspects."""

    user_prompt = f"""
    Please analyze this product/project idea.
    {query}
    Respond in this JSON format:
    {{
        "problem_statement": "The core problem being solved",
        "target_users": "Who experiences this problem",
        "terms": ["term1", "term2", "term3"]
    }}
    Note: terms must be a list of strings, not a single string.
    """

    try:
        logger.debug(f"Analyzing query: {query}")
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={ "type": "json_object" }
        )

        content = response.choices[0].message.content
        json_content = json.loads(content)

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
