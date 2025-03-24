# =======================================================================#
# IMPORTS
# =======================================================================#
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
from utils.logger import setup_logger
import logging
from utils import embedding as emb, supabase as sup, arxiv, ai
import time
from fastapi.responses import StreamingResponse
import json
import asyncio
import sentry_sdk

# =======================================================================#
# CONFIGURE THE APP AND LOGGING
# =======================================================================#

load_dotenv()


sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    # Add data like request headers and IP for users,
    # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
    send_default_pii=True,
)


logger = setup_logger("app")

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
    logger.info(f"Initialized DB size: {CURR_DB_SIZE}")
    logger.info(f"Allowed origins: {ALLOWED_ORIGINS}")

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

@app.get("/sentry-debug")
async def trigger_error():
    division_by_zero = 1 / 0

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "message": "API is running", "status_code": 200}

@app.get("/api/frontend-url")
def get_frontend_url():
    return {"frontend_urls": FRONTEND_URL}


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


@app.get("/api/search")
async def search(
    query: str = Query(...),
    valid_sources: str = Query(...),
    recency: int = Query(...),
    num_results: int = Query(...),
    arxiv_categories: str | None = Query(None),
    reddit_categories: str | None = Query(None),
    product_hunt_categories: str | None = Query(None),
    ycombinator_categories: str | None = Query(None)
):
    logger.info(f"Search request - Query: {query}, Sources: {valid_sources}, Recency: {recency}, Results: {num_results}")
    logger.debug(f"Current DB size: {CURR_DB_SIZE}")

    arxiv_category_list = arxiv_categories.split(',') if arxiv_categories else []
    reddit_category_list = reddit_categories.split(',') if reddit_categories else []
    product_hunt_category_list = product_hunt_categories.split(',') if product_hunt_categories else []
    y_combinator_category_list = ycombinator_categories.split(',') if ycombinator_categories else []

    # Log category filters if present
    if any([arxiv_category_list, reddit_category_list, product_hunt_category_list, y_combinator_category_list]):
        logger.info("Category filters applied - " +
                   (f"arXiv: {arxiv_category_list}, " if arxiv_category_list else "") +
                   (f"Reddit: {reddit_category_list}, " if reddit_category_list else "") +
                   (f"Product Hunt: {product_hunt_category_list}, " if product_hunt_category_list else "") +
                   (f"Y Combinator: {y_combinator_category_list}" if y_combinator_category_list else ""))

    async def event_generator():
        try:
            yield ysm("status", "Analyzing your search query...")

            ai_analysis = ai.analyze_query(query)
            logger.debug(f"AI Analysis results - Problem Statement: {ai_analysis.get('problem_statement')}, Target Users: {ai_analysis.get('target_users')}")

            yield ysm("status", f"Problem Statement: {str(ai_analysis.get('problem_statement', ''))}")
            yield ysm("status", f"Target Users: {str(ai_analysis.get('target_users', ''))}")

            enriched_query = f"Project: {query} Problem Statement: {ai_analysis.get('problem_statement', '')} Target Users: {ai_analysis.get('target_users', '')},"

            if ai_analysis.get('terms'):
                yield ysm("status", f"Applying Filters: {', '.join(str(t) for t in ai_analysis['terms'])}")

            sources = valid_sources.split(",")
            query_embedding = await emb.create_embedding(enriched_query)
            items = []

            yield ysm("status", f"Searching in a database of {CURR_DB_SIZE} items")
            logger.info(f"Starting search across sources: {sources}")

            if set(sources) - {"arxiv"}:
                items = sup.get_items(sources, query_embedding, num_results, recency,
                                reddit_category_list, product_hunt_category_list, y_combinator_category_list)
                logger.debug(f"Retrieved {len(items)} items from Supabase sources")

            if "arxiv" in sources:
                arxiv_items = await arxiv.get_arxiv_items(query, query_embedding,
                                                        arxiv_category_list, num_results, recency)
                items.extend(arxiv_items)
                logger.debug(f"Retrieved {len(arxiv_items)} items from arXiv")

            yield ysm("status", f"Found {len(items)} matching results")
            logger.info(f"Search completed - Found {len(items)} total results")

            items.sort(key=lambda x: x['similarity'], reverse=True)
            results = items[:num_results]

            cleaned_results = []
            for item in results:
                cleaned_item = {}
                for k, v in item.items():
                    if isinstance(v, (int, float, bool, list, dict)):
                        cleaned_item[k] = v
                    else:
                        cleaned_item[k] = str(v)
                cleaned_results.append(cleaned_item)

            yield ysm("results", cleaned_results)
            logger.info(f"Successfully sent {len(cleaned_results)} results to client")

        except Exception as e:
            error_msg = f"Search error: {str(e)}"
            logger.error(error_msg, exc_info=True)
            yield ysm("error", str(e))

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

# Update the DB size after adding items
def update_db_size():
    global CURR_DB_SIZE
    CURR_DB_SIZE = sup.get_db_size()
    logger.info(f"Updated DB size: {CURR_DB_SIZE}")

# =======================================================================#
# RUN THE APPLICATION
# =======================================================================#
# Get port from environment variable with fallback
port = int(os.getenv("PORT", 8080))
logger.info(f"Starting Foresight backend server on port {port}")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)





        # response = [
        #     {"link": "https://www.naoma.ai/", "title": "Naoma", "description": "Meet Naoma - AI-powered sales conversation analytics that reveal what makes top reps succeed and help scale it. Naoma connects to your CRM, analyzes sales conversations, highlights key moments, and provides actionable recommendations for each sales rep.", "source": "Product Hunt", "source_link": "https://www.producthunt.com/posts/naoma"},
        #     {"link": "https://apps.apple.com/us/app/the-habit-tracker-habit-radar/id6480372571", "title": "Habit Radar", "description": "The ultimate habit tracker app designed to help you build positive routines and stay on track with your goals. With Habit Radar, you can effortlessly track your habits, stay motivated with streaks, and visualize your progress over time.", "source": "Reddit", "source_link": "https://www.reddit.com/r/SideProject/comments/1jclzdy/habit_radar_is_lifetime_free_for_the_next_24_hours/"},
        #     {"link": "https://usefeedlyst.com/", "title": "Feedlyst", "description": "Let me introduce Feedlyst: a customer feedback tool where you can create boards, let customers submit & upvote feedback, and turn ideas into action.", "source": "Hacker News", "source_link": "https://news.ycombinator.com/item?id=43379395"}
        # ]
