import sys
from pathlib import Path
import json

from utils.supabase import ideas

# Add the project root directory to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

# Now import after adding to path
from utils import embedding
from utils.scraper import hackernews_scraper, reddit_scraper, product_hunt_scraper, arxiv_scraper, ycombinator_scraper
import asyncio
from lib.logger import setup_logger


# Initialize logger
logger = setup_logger("populate_sb")

async def main():

    # limit = 10000
    # y_items = await ycombinator_scraper.scrape_yc_companies(limit, num_scrolls=50)
    # print("number of yc items: ", len(yc_items))
    # logger.debug(f"Number of Y Combinator items: {len(yc_items)}")
    # embeddings = await embedding.get_item_embeddings(yc_items)
    # await supabase.add_items(y_items, embeddings, "yc_items")


    # limit = 1000
    # hn_items = hackernews_scraper.get_hacker_news_posts(limit=limit)
    # print("number of hn items: ", len(hn_items))
    # logger.debug(f"Number of Hacker News items: {len(hn_items)}")
    # embeddings = await embedding.get_item_embeddings(hn_items)
    # await supabase.add_items(hn_items, embeddings, "hn_items")

    # subreddits = ["indiehackers", "sideproject", "microsaas"]
    # limit = 400
    # re_items = []
    # for subreddit in subreddits:
    #     re_items.extend(await reddit_scraper.get_reddit_posts(subreddit=subreddit, limit=limit))
    # print("number of reddit items: ", len(re_items))
    # embeddings = await embedding.get_item_embeddings(re_items)
    # await supabase.add_items(re_items, embeddings, "re_items")

    # ph_items = await product_hunt_scraper.scrape_product_hunt_monthly(2025, 1, num_scrolls=1)
    # print(json.dumps(ph_items, indent=2))
    # embeddings = await embedding.get_item_embeddings(ph_items)
    # await supabase.add_items(ph_items, embeddings, "ph_items")
    # logger.info(f"Added {len(ph_items)} items ")


    # years = [2024, 2025]
    # months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    # ph_items = []
    # for year in years:
    #     if year == 2025:
    #         months = [1, 2, 3]
    #     for month in months:
    #         new_items = await product_hunt_scraper.scrape_product_hunt_monthly(year, month, num_scrolls=10)
    #         embeddings = await embedding.get_item_embeddings(ph_items)
    #         await supabase.add_items(ph_items, embeddings, "ph_items")
    #         logger.info(f"Added {len(new_items)} items for month {month} of year {year}")
    # logger.info(f"Number of Product Hunt items: {len(ph_items)}")
    # Loop through each day in 2025 up to current date


    year = 2025
    months = [3]  # Assuming we're in early 2025
    days_in_month = {1: 31, 2: 28, 3: 26}  # Days in each month (2025 is not a leap year)

    for month in months:
        for day in range(1, days_in_month[month] + 1):
            try:
                daily_items = await product_hunt_scraper.scrape_product_hunt_daily(year, month, day, num_scrolls=5)
                if daily_items:
                    embeddings = await embedding.get_item_embeddings(daily_items)
                    await ideas.add_items(daily_items, embeddings, "ph_items")
                    logger.info(f"Added {len(daily_items)} items for {year}-{month:02d}-{day:02d}")
                else:
                    logger.warning(f"No items found for {year}-{month:02d}-{day:02d}")

                # Add a small delay to avoid overwhelming the server
                await asyncio.sleep(30)
            except Exception as e:
                logger.error(f"Error processing {year}-{month:02d}-{day:02d}: {e}")
                continue



    # items = p_items

    # a_items = await arxiv_scraper.search_papers(["agents"])
    # print(a_items)

if __name__ == "__main__":
    asyncio.run(main())
