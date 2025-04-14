from supabase import acreate_client, create_client
import os
from typing import List, Any
import logging
from dotenv import load_dotenv
import asyncio
from datetime import datetime
from .init import init_supabase, asupabase


#========================================
# Environment Setup
#========================================
load_dotenv()


supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")


#========================================
# Idea Management Functions
#========================================


async def get_user_idea(idea_id: str, user_id: str) -> dict[str, Any]:
    """Get a specific idea for a user."""
    try:
        response = await (
            asupabase.from_('ideas')
            .select('id, name, content, created_at, user_id, customers, competitors, chats(id, role, content)')
            .eq('user_id', user_id)
            .eq('id', idea_id)
        ).execute()
        return response.data[0]
    except Exception as e:
        logging.error(f"Error fetching idea {idea_id} for user {user_id}: {str(e)}")
        raise


async def get_user_ideas(user_id: str) -> List[dict[str, Any]]:
    """Get all ideas and their associated chats for a specific user.

    Args:
        user_id: The ID of the user whose ideas to retrieve

    Returns:
        List of ideas with their associated chat messages
    """
    try:
        response = await (
            asupabase.from_('ideas')
            .select('id, name, content, created_at, user_id, customers, competitors, chats(id, role, content)')
            .eq('user_id', user_id)
        ).execute()
        return response.data
    except Exception as e:
        logging.error(f"Error fetching ideas for user {user_id}: {str(e)}")
        raise

async def create_idea(user_id: str, name: str, content: str) -> dict[str, Any]:
    """Create a new idea for a user.

    Args:
        user_id: The ID of the user creating the idea
        name: The title/name of the idea
        content: The content of the idea

    Returns:
        The created idea object
    """
    try:
        idea_data = {
            'user_id': user_id,
            'name': name,
            'content': content,
            'created_at': datetime.now().isoformat()
        }
        response = await asupabase.table('ideas').insert(idea_data).execute()
        return response.data[0]
    except Exception as e:
        logging.error(f"Error creating idea for user {user_id}: {str(e)}")
        raise

async def update_idea(idea_id: str, user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    """Update a idea if it belongs to the user.

    Args:
        idea_id: The ID of the idea to update
        user_id: The ID of the user who owns the idea
        updates: Dictionary of fields to update

    Returns:
        The updated idea object

    Raises:
        ValueError: If the idea doesn't exist or user is not authorized
    """
    try:
        # First verify the idea belongs to the user
        idea = await asupabase.table('ideas').select('*').eq('id', idea_id).eq('user_id', user_id).execute()
        if not idea.data:
            raise ValueError("Idea not found or unauthorized")

        # Update the idea
        response = await asupabase.table('ideas').update(updates).eq('id', idea_id).eq('user_id', user_id).execute()
        return response.data[0]
    except Exception as e:
        logging.error(f"Error updating idea {idea_id} for user {user_id}: {str(e)}")
        raise

async def delete_idea(idea_id: str, user_id: str) -> bool:
    """Delete a idea if it belongs to the user.

    Args:
        idea_id: The ID of the idea to delete
        user_id: The ID of the user who owns the idea

    Returns:
        True if deletion was successful

    Raises:
        ValueError: If the idea doesn't exist or user is not authorized
    """
    try:
        # First verify the idea belongs to the user
        idea = await asupabase.table('ideas').select('*').eq('id', idea_id).eq('user_id', user_id).execute()
        if not idea.data:
            raise ValueError("Idea not found or unauthorized")

        # Delete the idea
        await asupabase.table('ideas').delete().eq('id', idea_id).eq('user_id', user_id).execute()
        return True
    except Exception as e:
        logging.error(f"Error deleting idea {idea_id} for user {user_id}: {str(e)}")
        raise

async def update_messages(user_id: str, idea_id: str, prompt: str, ai_response: str) -> None:
    """Create new chat messages for a idea.

    Args:
        user_id: The ID of the user
        idea_id: The ID of the idea to add messages to
        prompt: The user's message
        ai_response: The AI's response message
    """
    try:
        # Add user message
        await asupabase.table('chats').insert({
            'idea_id': idea_id,
            'role': 'user',
            'content': prompt,
        }).execute()

        # Add AI response
        await asupabase.table('chats').insert({
            'idea_id': idea_id,
            'role': 'assistant',
            'content': ai_response,
        }).execute()
    except Exception as e:
        logging.error(f"Error creating chat messages for idea {idea_id}: {str(e)}")
        raise

async def delete_chats(user_id: str, idea_id: str) -> None:
    """Delete all chats for a specific idea"""
    try:
        await asupabase.table('chats').delete().eq('idea_id', idea_id).execute()
    except Exception as e:
        logging.error(f"Error deleting chats for idea {idea_id} for user {user_id}: {str(e)}")
        raise


