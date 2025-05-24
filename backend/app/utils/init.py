# =======================================================================#
# IMPORTS
# =======================================================================#
from supabase import acreate_client, create_client
import os
from typing import Tuple, Any
import logging
from dotenv import load_dotenv
import asyncio
from fastapi import FastAPI
import schedule
from app.lib.logger import logger
from scripts.daily_update import update_task
from app.database.items import get_num_items

#========================================
# Initializations
#========================================
load_dotenv()

# Initialize module-level variables
asupabase = None
supabase = None
CURR_DB_SIZE = 0
scheduler_task = None

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


async def lifespan(app: FastAPI):
    """FastAPI lifespan event handler for initialization and cleanup."""
    global CURR_DB_SIZE, scheduler_task
    await init_supabase()
    CURR_DB_SIZE = await get_num_items()
    logger.info(f"Initialized DB size: {CURR_DB_SIZE}")

    # Start the scheduler in a background task
    async def run_scheduler():
        while True:
            schedule.run_pending()
            await asyncio.sleep(60)

    schedule.every().day.at("23:50").do(lambda: asyncio.create_task(update_task()))
    scheduler_task = asyncio.create_task(run_scheduler())
    logger.info("Started daily update scheduler")

    yield

    # Cleanup
    if scheduler_task:
        scheduler_task.cancel()
        try:
            await scheduler_task
        except asyncio.CancelledError:
            pass
    logger.info("Stopped daily update scheduler")

# Initialize Supabase on module load
asyncio.create_task(init_supabase())
