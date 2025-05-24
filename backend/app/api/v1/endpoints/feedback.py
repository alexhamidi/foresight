from fastapi import APIRouter, HTTPException
from app.database.feedback import post_feedback
from app.lib.logger import logger

router = APIRouter()

# =======================================================================#
# Feedback Endpoints
# =======================================================================#
@router.post("/feedback")
async def post_feedback(feedback_info: dict):
    try:
        name = feedback_info.get("name", "")
        email = feedback_info.get("email", "")
        message = feedback_info.get("message", "")

        if not message:
            raise HTTPException(status_code=400, detail="Message is required")

        await post_feedback(message=message, name=name, email=email)
        return {"status": "success", "message": "Feedback received"}
    except Exception as e:
        logger.error(f"Error posting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
