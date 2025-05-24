import logging
from app.utils.init import asupabase

async def post_feedback(message: str, name: str = "", email: str = "") -> None:
    """Store user feedback in the feedback table.

    Args:
        message: Feedback message content
        name: Optional name of the user
        email: Optional email of the user
    """
    try:
        await asupabase.table('feedback').insert({
            'message': message,
            'name': name,
            'email': email,
        }).execute()
        logging.info(f"Successfully stored feedback from {name if name else 'anonymous'}")
    except Exception as e:
        logging.error(f"Error storing feedback: {str(e)}")
        raise

