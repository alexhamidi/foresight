from utils.ai.openai import get_chat_response
from utils.search.simple import search_wrapper
from utils.logger import setup_logger
import json

logger = setup_logger("ai")

async def get_ai_search_chat(chat_context, name, idea_content, prompt, editing_active):
    """Run an AI agent that can search and reason about ideas.

    Args:
        chat_context: Previous chat context
        name: Name of the idea/project
        idea_content: The idea/project content being discussed
        prompt: The user's current query
        editing_active: Whether editing mode is active

    Returns:
        Tuple of (response string, None)
    """
    system_prompt = """You are an AI Agent that creates insights from a user's query based on step by step reasoning and tool calls. You will be given information about the user's idea and a user prompt. You will provide a response to the user's prompt based on the idea.

Keep your thoughts concise and focused. When searching, be specific with your queries. Provide clear and actionable insights."""

    message = f"""
    # CHAT CONTEXT:
    {chat_context}

    # IDEA NAME:
    {name}

    # IDEA INFORMATION:
    {idea_content}

    # USER PROMPT:
    {prompt}

    # EDITING MODE:
    {"Active" if editing_active else "Inactive"}
    """

    try:
        # First get search results to inform the response
        search_results = await search_wrapper(prompt)

        # Add search results to the message
        message += f"\n\n# RELEVANT SEARCH RESULTS:\n{json.dumps(search_results, indent=2)}"

        # Get final response using the chat API
        final_response = get_chat_response(system_prompt, message)

        return final_response, None

    except Exception as e:
        error_msg = f"Error in AI search chat: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return f"I apologize, but I encountered an error: {error_msg}", None

