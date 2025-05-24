from fastapi import HTTPException, Cookie
from typing import Optional
from app.utils.init import asupabase

async def get_current_user(jwt: Optional[str] = Cookie(None, alias="sb-access-token")) -> str:

    """Validate JWT and return user_id"""
    if not jwt:
        print("No JWT provided")
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        print(f"Attempting to verify JWT token: {jwt}\n\n")  # Only print first 20 chars for security
        # Verify JWT with Supabase
        user = await asupabase.auth.get_user(jwt)
        print(f"Successfully verified user: {user.user.id}")
        return user.user.id
    except Exception as e:
        print(f"Error verifying JWT: {str(e)}")
        print(f"Error type: {type(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

