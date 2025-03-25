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
    Extract the vital information from the prompt. Your response should be extremely concise, around 8-12 words."""

    user_prompt = f"""
    Please analyze this product/project idea and extract the core problem statement.:
    {query}

    Respond in this JSON format:
    {{
        "problem_statement": "The core problem being solved",
        "target_users": "Who experiences this problem",
        "terms": "list of relevant terms to the problem. Focus on the niche aspects/specific aspects - for example, given a prompt like \"AI music composition tool\", focus more on the music aspects than the \"tool\" aspects.
    }}
    """

    try:
        logger.debug(f"Analyzing query: {query}")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={ "type": "json_object" }
        )

        content = response.choices[0].message.content
        json_content = json.loads(content)
        logger.debug(f"AI analysis results: {json_content}")
        return json_content

    except Exception as e:
        error_msg = f"Failed to analyze query: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            "error": error_msg,
            "original_query": query
        }
