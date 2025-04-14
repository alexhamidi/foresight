#========================================
# Imports and Initialization
#========================================
import os
from openai import OpenAI
from typing import List
import json
from utils.logger import setup_logger
from utils.search.simple import search_wrapper

# Initialize OpenAI client and logger
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = setup_logger("ai")


# also tavily and db




#========================================
# Chat Functions
#========================================


def get_chat_response(base_prompt: str, user_prompt: str) -> str:
    system_prompt = f"""
    You are a tactful and highly intelligent startup product advisor and technologist who thinks out of the box. You are writing in the perspective of someone jotting down ideas for an idea or startup at 3am, so dont be too verbose or attempt to be compelling, just be clear, extremely concise, and address the user directly. Do not render markdown and keep responses to 50 words or less. Use the most simplest language capable of conveying the message.
    """
    print(f"full prompt: {system_prompt}\n\n{base_prompt}\n\n{user_prompt}")
    try:
        messages = [
            {"role": "system", "content": system_prompt + base_prompt},
            {"role": "user", "content": user_prompt},
        ]

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )

        content = response.choices[0].message.content

        return content
    except Exception as e:
        error_msg = f"Failed to get idea chat response: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return f"I apologize, but I encountered an error: {error_msg}"


