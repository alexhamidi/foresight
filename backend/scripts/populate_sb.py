import sys
from pathlib import Path

# Add the project root directory to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

# Now import after adding to path
from utils import supabase, embedding
from utils.scraper import hackernews_scraper, reddit_scraper, product_hunt_scraper, arxiv_scraper
import asyncio

async def main():

    # limit = 200
    # h_items = hackernews_scraper.get_hacker_news_posts(limit=limit)


    # subreddit = 'sideproject'
    # limit = 200
    # r_items = await reddit_scraper.get_reddit_posts(subreddit=subreddit, limit=limit)


    a_items = await arxiv_scraper.search_papers(["agents"])
    print(a_items)


    # year = 2024
    # month = 12
    # p_items = await product_hunt_scraper.scrape_product_hunt_monthly(year, month, 5)

    # items = p_items

    # embeddings = await embedding.get_item_embeddings(items)
    # await supabase.add_items(items, embeddings)

if __name__ == "__main__":
    asyncio.run(main())
