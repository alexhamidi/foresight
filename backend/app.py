# =======================================================================#
# IMPORTS
# =======================================================================#
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
import logging
from utils import embedding as emb, supabase as sup, arxiv, ai
import time
from fastapi.responses import StreamingResponse
import json
import asyncio
# =======================================================================#
# CONFIGURE THE APP AND CORS
# =======================================================================#

load_dotenv()

# Define allowed origins
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://foresight-flax.vercel.app").split(",")
ALLOWED_ORIGINS = [
    "https://foresight-flax.vercel.app",
    "http://localhost:3002",  # For local development
]
CURR_DB_SIZE = 0

if not FRONTEND_URL:
    raise ValueError("FRONTEND_URL not configured in environment variables")

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    global CURR_DB_SIZE
    CURR_DB_SIZE = sup.get_db_size()
    logging.info(f"Initialized DB size: {CURR_DB_SIZE}")
    logging.info(f"Allowed origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# =======================================================================#
# API ENDPOINTS
# =======================================================================#
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "message": "API is running", "status_code": 200}

@app.get("/api/frontend-url")
def get_frontend_url():
    return {"frontend_urls": FRONTEND_URL}

import json

def ysm(type: str, message: str | dict) -> str:
    """Helper function to yield SSE messages in the correct format"""
    if type == "status":
        print("message: ", message)

    # Ensure proper JSON encoding of the message
    if isinstance(message, str):
        message_data = {"type": type, "message": message}
    else:
        message_data = {"type": type, "items" if type == "results" else "message": message}

    # Use json.dumps to properly escape special characters
    return f"data: {json.dumps(message_data)}\n\n"


@app.get("/api/search")
async def search(
    query: str = Query(...),
    valid_sources: str = Query(...),
    recency: int = Query(...),
    num_results: int = Query(...),
    arxiv_categories: str | None = Query(None),
    reddit_categories: str | None = Query(None),
    product_hunt_categories: str | None = Query(None)
):
    print("query: ", query)
    print("valid_sources: ", valid_sources)
    print("recency: ", recency)
    print("num_results: ", num_results)
    print("db size: ", CURR_DB_SIZE)

    arxiv_category_list = arxiv_categories.split(',') if arxiv_categories else []
    reddit_category_list = reddit_categories.split(',') if reddit_categories else []
    product_hunt_category_list = product_hunt_categories.split(',') if product_hunt_categories else []

    # Debug logging for categories
    if arxiv_category_list:
        print("arxiv categories: ", arxiv_category_list)
    if reddit_category_list:
        print("reddit categories: ", reddit_category_list)
    if product_hunt_category_list:
        print("product hunt categories: ", product_hunt_category_list)

    async def event_generator():
        try:




            yield ysm("status", "Analyzing your search query...")

            ai_analysis = ai.analyze_query(query)

            yield ysm("status", f"Extracting Problem Statement: {ai_analysis['problem_statement']}")

            yield ysm("status", f"Extracting Target Users: {ai_analysis['target_users']}")

            yield ysm("status", f"Applying Metadata Filters: {', '.join(ai_analysis['terms'])}")


            sources = valid_sources.split(",")
            query_embedding = await emb.create_embedding(query)
            items = sup.get_items(sources, query_embedding, num_results, recency, reddit_category_list, product_hunt_category_list) if "arxiv" not in sources else []
            print(items)
            if "arxiv" in sources:
                arxiv_items = await arxiv.get_arxiv_items(query, query_embedding, arxiv_category_list, num_results, recency)
                items.extend(arxiv_items)

            yield ysm("status", f"Found {len(items)} matching results in initial search")

            # Sort by similarity score
            items.sort(key=lambda x: x['similarity'], reverse=True)
            results = items[:num_results]

            yield ysm("status", f"Filtered to {len(results)} results")



            yield ysm("results", results)





        except Exception as e:
            logging.error(f"Search error: {str(e)}")
            yield ysm("error", f"Search error: {str(e)}")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

# Update the DB size after adding items
def update_db_size():
    global CURR_DB_SIZE
    CURR_DB_SIZE = sup.get_db_size()
    logging.info(f"Updated DB size: {CURR_DB_SIZE}")

# =======================================================================#
# RUN THE APPLICATION
# =======================================================================#
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8002, reload=True)





        # response = [
        #     {"link": "https://www.naoma.ai/", "title": "Naoma", "description": "Meet Naoma - AI-powered sales conversation analytics that reveal what makes top reps succeed and help scale it. Naoma connects to your CRM, analyzes sales conversations, highlights key moments, and provides actionable recommendations for each sales rep.", "source": "Product Hunt", "source_link": "https://www.producthunt.com/posts/naoma"},
        #     {"link": "https://apps.apple.com/us/app/the-habit-tracker-habit-radar/id6480372571", "title": "Habit Radar", "description": "The ultimate habit tracker app designed to help you build positive routines and stay on track with your goals. With Habit Radar, you can effortlessly track your habits, stay motivated with streaks, and visualize your progress over time.", "source": "Reddit", "source_link": "https://www.reddit.com/r/SideProject/comments/1jclzdy/habit_radar_is_lifetime_free_for_the_next_24_hours/"},
        #     {"link": "https://usefeedlyst.com/", "title": "Feedlyst", "description": "Let me introduce Feedlyst: a customer feedback tool where you can create boards, let customers submit & upvote feedback, and turn ideas into action.", "source": "Hacker News", "source_link": "https://news.ycombinator.com/item?id=43379395"}
        # ]
