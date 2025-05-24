# =======================================================================#
# IMPORTS
# =======================================================================#
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
import asyncio
import sentry_sdk
from contextlib import asynccontextmanager
import schedule
from scripts.daily_update import update_task
from app.lib.constants import FRONTEND_URL
from app.lib.logger import logger
from app.utils.init import lifespan
from app.api.v1.endpoints import chat, ideas, search, feedback, health
from app.database.items import get_num_items

# =======================================================================#
# CONFIGURE THE APP AND LOGGING
# =======================================================================#

load_dotenv()

if not FRONTEND_URL:
    raise ValueError("FRONTEND_URL not configured in environment variables")

# Global variables
CURR_DB_SIZE = 0
SIMILARITY_THRESHOLD = 0.3

# Create the FastAPI app instance
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URL,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(ideas.router, prefix="/api/v1/ideas", tags=["ideas"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
app.include_router(feedback.router, prefix="/api/v1/feedback", tags=["feedback"])
app.include_router(health.router, prefix="/api/v1/health", tags=["health"])

# =======================================================================#
# RUN THE APPLICATION
# =======================================================================#

if __name__ == "__main__":
    uvicorn.run("run:app", host="0.0.0.0", port=8080, reload=True)
