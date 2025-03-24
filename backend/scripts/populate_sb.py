import sys
from pathlib import Path

# Add the project root directory to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

# Now import after adding to path
from utils import supabase, embedding
from utils.scraper import hackernews_scraper, reddit_scraper, product_hunt_scraper, arxiv_scraper, ycombinator_scraper
import asyncio
from utils.logger import setup_logger

# Initialize logger
logger = setup_logger("populate_sb")

async def main():
    items = []

    # limit = 1000
    # y_items = await ycombinator_scraper.scrape_yc_companies(limit, num_scrolls=30)
    # print("number of yc items: ", len(y_items))
    # logger.debug(f"Number of Y Combinator items: {len(y_items)}")

    # limit = 800
    # h_items = hackernews_scraper.get_hacker_news_posts(limit=limit)
    # print("number of hn items: ", len(h_items))
    # logger.debug(f"Number of Hacker News items: {len(h_items)}")

    # subreddits = ["indiehackers", "sideproject", "microsaas"]
    # limit = 200
    # r_items = []
    # for subreddit in subreddits:
    #     r_items.extend(await reddit_scraper.get_reddit_posts(subreddit=subreddit, limit=limit))
    # print("number of reddit items: ", len(r_items))

    years = [2024, 2025]
    months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    p_items = []
    for year in years:
        if year == 2025:
            months = [1, 2, 3]
        for month in months:
            p_items.extend(await product_hunt_scraper.scrape_product_hunt_monthly(year, month, 5))
            logger.info(f"Added items for month {month} of year {year}")
    logger.debug(f"Number of Product Hunt items: {len(p_items)}")

    items = p_items

    embeddings = await embedding.get_item_embeddings(items)
    await supabase.add_items(items, embeddings)

    # a_items = await arxiv_scraper.search_papers(["agents"])
    # print(a_items)

if __name__ == "__main__":
    asyncio.run(main())
