from typing import Tuple, List
import json
from utils.logger import setup_logger
from utils.ai.openai import get_chat_response

logger = setup_logger("chat")

async def get_normal_chat(chat_context: str, name: str, idea_content: str, prompt: str, editing_active: bool) -> Tuple[str, List[dict] | None]:
    """Get a chat response about an idea, with optional editing capabilities.

    Args:
        chat_context: Previous chat context
        name: The name of the idea/project
        idea_content: The content of the idea document
        prompt: The user's current query
        editing_active: Whether editing mode is active

    Returns:
        Tuple containing (response text, list of edits if editing is active)
    """
    try:
        if editing_active:
            base_prompt = """You will analyze the existing idea document of the user and update the document based on your insights and the prompt. You may replace a line with the empty string to delete it. You will respond in the following json format:
            {
                "user_response": "this is the response that will be sent to the user, update them on the changes you made and provide a brief justification",
                "edits": [
                    {
                        "start_line": 1,
                        "end_line": 1,
                        "updated_text": "new text"
                    }
                ]
            }"""
        else:
            base_prompt = """You will be given some information about the idea and a user prompt. You will provide a response to the user's prompt based on the idea."""

        message = f"""
        # CHAT CONTEXT:
        {chat_context}

        # IDEA NAME:
        {name}

        # IDEA CONTENT:
        {idea_content}

        # USER PROMPT:
        {prompt}
        """

        content = get_chat_response(base_prompt, message)

        if editing_active:
            parsed_content = json.loads(content)
            return parsed_content["user_response"], parsed_content["edits"]
        else:
            return content, None

    except Exception as e:
        error_msg = f"Failed to get chat response: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return f"I apologize, but I encountered an error: {error_msg}", None
