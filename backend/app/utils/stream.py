

# =======================================================================#
# Helper functions
# =======================================================================#
def ysm(type: str, message: str | dict) -> str:
    """Helper function to yield SSE messages in the correct format"""
    try:
        if type == "results":
            # For results, use a specific format with items array
            message_data = {"type": type, "items": message}
        else:
            # For status and error messages, use message field
            message_str = str(message) if isinstance(message, (str, int, float)) else json.dumps(message)
            message_data = {"type": type, "message": message_str}

        # Use json.dumps with ensure_ascii=False to properly handle Unicode
        json_str = json.dumps(message_data, ensure_ascii=False, default=str)
        return f"data: {json_str}\n\n"
    except Exception as e:
        logger.error(f"Error in ysm: {str(e)}")
        # Return a safe fallback message
        return f"data: {json.dumps({'type': 'error', 'message': 'Error formatting message'})}\n\n"
