from fastapi import HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi import Body
from app.auth.main import get_current_user
from app.utils.chat import normal as normal_chat
from app.utils.search import main as search_main
from app.database.ideas import update_messages
from app.database.ideas import delete_chats
from fastapi import APIRouter
from app.lib.logger import logger

router = APIRouter()

# =======================================================================#
# Chat Endpoints
# =======================================================================#
@router.post("")
async def chat_endpoint(request: dict = Body(...), user_id: str = Depends(get_current_user)):
    try:
        print(request)

        idea_id = request.get("idea_id")
        prompt = request.get("prompt")
        idea_content = request.get("idea_content")
        selected_section = request.get("selected_section")
        idea_name = request.get("idea_name")
        chat_context = request.get("chat_context")
        chat_mode = request.get("chat_mode")
        editing_active = request.get("editing_active")
        section_content = request.get("section_content")

        if not prompt:
            raise HTTPException(status_code=400, detail="message content is required")

        comp_str = f"NAME: {idea_name}\nCONTENT: {idea_content}"

        if chat_mode in ["ai search", "agent", "normal"]:
            functions = {
                "normal": normal_chat.get_normal_chat,
                "agent": normal_chat.get_normal_chat,
            }

            ai_response, updated_content = await functions[chat_mode](chat_context, idea_name, idea_content, prompt, editing_active, selected_section, section_content)

            print("ai_response", ai_response)
            print("updated_content", updated_content)

            await update_messages(user_id, idea_id, prompt, ai_response)

            return {"message": ai_response, "updated_content": updated_content}
        else:

            sources = request.get("valid_sources")
            print("sources", sources)
            recency = request.get("recency")
            num_results = request.get("num_results")
            # sources = valid_sources.split(",")

            items = await search_main.get_search_results(
                sources,
                prompt,
                prompt,
                num_results,
                recency,
            )
            return {"message": "Search completed", "items": items[:3]}

    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{idea_id}")
async def delete_chats_endpoint (idea_id: str, user_id: str = Depends(get_current_user)):
    """Delete all chats for a specific idea"""
    try:
        await delete_chats(user_id, idea_id)
        return {"status": "success", "message": "Chat deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
