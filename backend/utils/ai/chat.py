#========================================
# Imports and Initialization
#========================================
import os
from openai import OpenAI
from typing import List
import json
from utils.logger import setup_logger
from utils.ai.utils import search_wrapper

# Initialize OpenAI client and logger
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = setup_logger("ai")

#========================================
# Chat Functions
#========================================
async def run_idea_chat_basic_agent(chat_context, idea: str, prompt: str) -> str:
    """Run a basic agent that can search and reason about ideas.

    Args:
        chat_context: Previous chat context
        idea: The idea/project being discussed
        prompt: The user's current query

    Returns:
        The agent's response after reasoning and searching
    """
    available_actions = {
        "functions": [{"search_items": {"params": ["query: string"]}}],
        "complete": {"final_response": "string"},
        "continue_reasoning": None
    }

    system_prompt = """You are an AI Agent that creates insights from a user's query based on step by step reasoning and tool calls. You will be given some information about the user's idea and a user prompt. You will provide a response to the user's prompt based on the idea.

Your response MUST be a valid JSON object with EXACTLY this structure:
{
    "action": "string (one of: 'search_items', 'complete', 'continue_reasoning')",
    "thoughts": "string (your reasoning)"
}

Keep your thoughts concise and focused. If using search_items, include a specific query. When complete, provide your final response."""

    message = f"""
    # CHAT CONTEXT:
    {chat_context}

    # IDEA INFORMATION:
    {idea}

    # USER PROMPT:
    {prompt}

    # PAST REASONING CHAIN:
    """

    complete = False
    final_content = ""

    while complete is False:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ]
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            response_format={ "type": "json_object" }
        )
        content = response.choices[0].message.content
        print(f"content: {content}\n\n")

        try:
            parsed_content = json.loads(content)
            action = parsed_content.get("action", "")
            thoughts = parsed_content.get("thoughts", "")

            message += f"\n\nAssistant: {thoughts}\n"

            if "complete" in action:
                complete = True
                final_content = thoughts
            elif "search_items" in action:
                print("searching items")
                items = await search_wrapper(prompt)
                message += f"\n\nObservation (search results): {json.dumps(items)}\n"
            elif "continue_reasoning" in action:
                continue
            else:
                logger.warning(f"Unknown action received: {action}")
                complete = True
                final_content = "I apologize, but I encountered an error in processing the request."

        except json.JSONDecodeError as je:
            logger.error(f"JSON decode error: {str(je)}")
            complete = True
            final_content = "I apologize, but I encountered an error in processing the response format."
        except KeyboardInterrupt as e:
             print("ended reasoning")
             raise e

    return final_content

def get_idea_chat_response(chat_context, idea: str, prompt: str) -> str:
    """Get a simple chat response about an idea without agent capabilities.

    Args:
        chat_context: Previous chat context
        idea: The idea/project being discussed
        prompt: The user's current query

    Returns:
        The AI's response to the query
    """
    system_prompt = """You are a helpful AI assistant that provides clear and very concise responses to user queries about software products and projects. You will be given some information about the idea and a user prompt. You will provide a response to the user's prompt based on the idea. """

    message = f"""
    # CHAT CONTEXT:
    {chat_context}

    # IDEA INFORMATION:
    {idea}

    # USER PROMPT:
    {prompt}
    """

    try:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ]

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )

        content = response.choices[0].message.content
        print(content)
        return content
    except Exception as e:
        error_msg = f"Failed to get idea chat response: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return f"I apologize, but I encountered an error: {error_msg}"

def get_chat_response(message: str, items: List[dict] = None) -> dict:
    """Get a chat response that can reference provided source items.

    Args:
        message: The user's query
        items: Optional list of source items to reference

    Returns:
        Dictionary containing response content and whether sources were used
    """
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
