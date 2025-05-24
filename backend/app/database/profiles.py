from .init import asupabase
import logging
from datetime import datetime

async def update_user_subscription(user_id: str, plan: str) -> None:
    """Update a user's subscription plan.

    Args:
        user_id: The ID of the user
        plan: The subscription plan ('FREE' or 'PRO')
    """
    try:
        await asupabase.table('profiles').update({
            'payment_plan': plan,
            'updated_at': datetime.now().isoformat()
        }).eq('user_id', user_id).execute()
        logging.info(f"Successfully updated subscription for user {user_id} to {plan}")
    except Exception as e:
        logging.error(f"Error updating subscription for user {user_id}: {str(e)}")
        raise

async def get_user_profile(user_id: str) -> dict:
    """Get a user's profile information.

    Args:
        user_id: The ID of the user

    Returns:
        dict: The user's profile information
    """
    try:
        response = await asupabase.table('profiles').select('*').eq('user_id', user_id).execute()
        if not response.data:
            raise ValueError(f"No profile found for user {user_id}")
        return response.data[0]
    except Exception as e:
        logging.error(f"Error fetching profile for user {user_id}: {str(e)}")
        raise

async def get_plan_info(user_id: str) -> dict:
    """Get the user's current plan and info"""
    try:
        response = await asupabase.table('profiles').select('payment_plan, used_searches, used_normal_chats, used_agent_chats').eq('user_id', user_id).execute()
        if not response.data:
            raise ValueError(f"No profile found for user {user_id}")
        return response.data[0]
    except Exception as e:
        logging.error(f"Error fetching plan info for user {user_id}: {str(e)}")
        raise
