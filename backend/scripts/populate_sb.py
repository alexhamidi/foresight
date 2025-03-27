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

    ph_items = await product_hunt_scraper.scrape_product_hunt_monthly(2024, 12, num_scrolls=10)
    embeddings = await embedding.get_item_embeddings(ph_items)
    await supabase.add_items(ph_items, embeddings, "ph_items")
    logger.info(f"Added {len(ph_items)} items ")

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

    # items = p_items

    # a_items = await arxiv_scraper.search_papers(["agents"])
    # print(a_items)

if __name__ == "__main__":
    asyncio.run(main())
