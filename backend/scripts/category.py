import sys
from pathlib import Path
import json
import asyncio
from utils import product_hunt_scraper as scraper, supabase
import logging
from utils import hackernews_scraper

# Add the project root directory to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))


async def main():
    query = "What are the best products to help developers write code?"

    relevant_categories = await supabase.vector_search(query, n=5)


    # Create tasks for scraping each category concurrently
    scraping_tasks = [
        scraper.scrape_product_categorypage(category['link'])
        for category in relevant_categories
    ]

    # Execute all scraping tasks in parallel
    products_by_category = await asyncio.gather(*scraping_tasks)

    # Flatten the list of products from all categories
    all_products = [
        product
        for category_products in products_by_category
        for product in category_products
    ]

    print(json.dumps(all_products, indent=4))

def scrape_hackernews():
    posts = hackernews_scraper.fetch_show_hn_posts()
    print(f"Fetched {len(posts)} Show HN posts")
    return posts

if __name__ == "__main__":
    # Example usage
    hn_posts = scrape_hackernews()
    # Process posts as needed
    for post in hn_posts[:5]:  # Print first 5 posts as example
        print(f"\nTitle: {post['title']}")
        print(f"URL: {post['url']}")
        print(f"Created: {post['created_at']}")
        print(f"Points: {post['points']}")
