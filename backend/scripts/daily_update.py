import sys
from pathlib import Path
import json
from datetime import datetime
import schedule
import time

from utils.supabase import notes

# Add the project root directory to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

# Now import after adding to path
from utils import embedding
from utils.scraper import hackernews_scraper, reddit_scraper, product_hunt_scraper, ycombinator_scraper
import asyncio
from utils.logger import setup_logger


# Initialize logger
logger = setup_logger("daily_update")

def filter_today(year, month, day, items):
    today_str = f"{year}-{month:02d}-{day:02d}"
    return [item for item in items if item['created_at'].startswith(today_str)]

async def update_task():
    logger.info("Starting daily update task...")
    try:
        current_date = datetime.now()
        year = current_date.year
        month = current_date.month
        day = current_date.day

        # Get new YC events from current day
        limit = 100
        yc_items = await ycombinator_scraper.scrape_yc_companies(limit, num_scrolls=5, url="https://www.ycombinator.com/companies?batch=X25")
        logger.info(f"Number of Y Combinator items: {len(yc_items)}")
        embeddings = await embedding.get_item_embeddings(yc_items)
        await notes.add_items(yc_items, embeddings, "yc_items")
        logger.info(f"Added {len(yc_items)} Y Combinator items")

        # Get HN items from current day
        limit = 100
        hn_items = filter_today(year, month, day, hackernews_scraper.get_hacker_news_posts(limit=limit))
        logger.info(f"Number of Hacker News items: {len(hn_items)}")
        embeddings = await embedding.get_item_embeddings(hn_items)
        await notes.add_items(hn_items, embeddings, "hn_items")
        logger.info(f"Added {len(hn_items)} Hacker News items")

        # Get reddit events from current day
        subreddits = ["indiehackers", "sideproject", "microsaas"]
        limit = 200
        re_items = []
        for subreddit in subreddits:
            re_items.extend(await reddit_scraper.get_reddit_posts(subreddit=subreddit, limit=limit))

        re_items = filter_today(year, month, day, re_items)
        logger.info(f"Number of Reddit items: {len(re_items)}")
        embeddings = await embedding.get_item_embeddings(re_items)
        await notes.add_items(re_items, embeddings, "re_items")
        logger.info(f"Added {len(re_items)} Reddit items")


        # Get product hunt events from current day
        try:
            daily_items = await product_hunt_scraper.scrape_product_hunt_daily(year, month, day, num_scrolls=5)
            if daily_items:
                embeddings = await embedding.get_item_embeddings(daily_items)
                await notes.add_items(daily_items, embeddings, "ph_items")
                logger.info(f"Added {len(daily_items)} items for {year}-{month:02d}-{day:02d}")
            else:
                logger.warning(f"No items found for {year}-{month:02d}-{day:02d}")
        except Exception as e:
            logger.error(f"Error processing {year}-{month:02d}-{day:02d}: {e}")

        logger.info("Daily update task completed successfully")
    except Exception as e:
        logger.error(f"Error in daily update task: {e}")

def run_scheduler():
    # Schedule the task to run daily at 23:50
    schedule.every().day.at("23:50").do(lambda: asyncio.run(update_task()))
    logger.info("Scheduler started. Will run daily at 23:50.")


    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    try:
        run_scheduler()
    except KeyboardInterrupt:
        logger.info("Scheduler stopped by user")
    except Exception as e:
        logger.error(f"Scheduler crashed: {e}")
