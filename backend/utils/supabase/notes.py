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
# Note Management Functions
#========================================
async def get_user_notes(user_id: str) -> List[dict[str, Any]]:
    """Get all notes and their associated chats for a specific user.

    Args:
        user_id: The ID of the user whose notes to retrieve

    Returns:
        List of notes with their associated chat messages
    """
    try:
        response = await (
            asupabase.from_('notes')
            .select('id, name, content, created_at, user_id, chats(id, role, content)')
            .eq('user_id', user_id)
        ).execute()
        return response.data
    except Exception as e:
        logging.error(f"Error fetching notes for user {user_id}: {str(e)}")
        raise

async def create_note(user_id: str, name: str, content: str) -> dict[str, Any]:
    """Create a new note for a user.

    Args:
        user_id: The ID of the user creating the note
        name: The title/name of the note
        content: The content of the note

    Returns:
        The created note object
    """
    try:
        note_data = {
            'user_id': user_id,
            'name': name,
            'content': content,
            'created_at': datetime.now().isoformat()
        }
        response = await asupabase.table('notes').insert(note_data).execute()
        return response.data[0]
    except Exception as e:
        logging.error(f"Error creating note for user {user_id}: {str(e)}")
        raise

async def update_note(note_id: str, user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    """Update a note if it belongs to the user.

    Args:
        note_id: The ID of the note to update
        user_id: The ID of the user who owns the note
        updates: Dictionary of fields to update

    Returns:
        The updated note object

    Raises:
        ValueError: If the note doesn't exist or user is not authorized
    """
    try:
        # First verify the note belongs to the user
        note = await asupabase.table('notes').select('*').eq('id', note_id).eq('user_id', user_id).execute()
        if not note.data:
            raise ValueError("Note not found or unauthorized")

        # Update the note
        response = await asupabase.table('notes').update(updates).eq('id', note_id).eq('user_id', user_id).execute()
        return response.data[0]
    except Exception as e:
        logging.error(f"Error updating note {note_id} for user {user_id}: {str(e)}")
        raise

async def delete_note(note_id: str, user_id: str) -> bool:
    """Delete a note if it belongs to the user.

    Args:
        note_id: The ID of the note to delete
        user_id: The ID of the user who owns the note

    Returns:
        True if deletion was successful

    Raises:
        ValueError: If the note doesn't exist or user is not authorized
    """
    try:
        # First verify the note belongs to the user
        note = await asupabase.table('notes').select('*').eq('id', note_id).eq('user_id', user_id).execute()
        if not note.data:
            raise ValueError("Note not found or unauthorized")

        # Delete the note
        await asupabase.table('notes').delete().eq('id', note_id).eq('user_id', user_id).execute()
        return True
    except Exception as e:
        logging.error(f"Error deleting note {note_id} for user {user_id}: {str(e)}")
        raise

async def update_messages(user_id: str, note_id: str, prompt: str, ai_response: str) -> None:
    """Create new chat messages for a note.

    Args:
        user_id: The ID of the user
        note_id: The ID of the note to add messages to
        prompt: The user's message
        ai_response: The AI's response message
    """
    try:
        # Add user message
        await asupabase.table('chats').insert({
            'note_id': note_id,
            'role': 'user',
            'content': prompt,
        }).execute()

        # Add AI response
        await asupabase.table('chats').insert({
            'note_id': note_id,
            'role': 'assistant',
            'content': ai_response,
        }).execute()
    except Exception as e:
        logging.error(f"Error creating chat messages for note {note_id}: {str(e)}")
        raise


