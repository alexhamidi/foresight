from supabase import acreate_client, create_client
import os
from typing import Tuple, Any
import logging
from dotenv import load_dotenv
import asyncio

#========================================
# Initializations
#========================================
load_dotenv()

# Initialize module-level variables
asupabase = None
supabase = None

# Get configuration
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

async def init_supabase() -> Tuple[Any, Any]:
    """Initialize both async and sync Supabase clients.
    Returns:
        Tuple[Any, Any]: A tuple of (async_client, sync_client)
    """
    global asupabase, supabase

    if asupabase is None:
        try:
            asupabase = await acreate_client(supabase_url, supabase_key)
            supabase = create_client(supabase_url, supabase_key)
        except Exception as e:
            logging.error(f"Failed to initialize Supabase clients: {e}")
            raise

    return asupabase, supabase

asyncio.run(init_supabase())
