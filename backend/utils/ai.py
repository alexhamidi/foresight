import os
from openai import OpenAI
from typing import Dict
import json
# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_query(query: str) -> Dict[str, str]:


    system_prompt = """You are a product analyst who helps identify core problems from product ideas.
    Extract the fundamental problem or pain point that the product/idea is trying to solve.
    Focus on the underlying user need rather than the solution. Your response should be extremely concise, around 8-12 words."""

    user_prompt = f"""
    Please analyze this product/project idea and extract the core problem statement:
    {query}

    Respond in this JSON format:
    {{
        "problem_statement": "The core problem being solved",
        "target_users": "Who experiences this problem",
        "terms": "list of relevant terms to the problem"
    }}
    """

    try:
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
        print("json_content: ", json_content)
        return json_content

    except Exception as e:
        return {
            "error": f"Failed to analyze query: {str(e)}",
            "original_query": query
        }
