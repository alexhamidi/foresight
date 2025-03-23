# import requests
# from bs4 import BeautifulSoup
# from datetime import datetime
# from typing import List, Dict
# import os
# from dotenv import load_dotenv
# from utils.supabase import insert_reddit_posts
# from utils.embedding import get_embedding
# import time
# import random
# import praw

# load_dotenv()

# def init_reddit():
#     return praw.Reddit(
#         client_id=os.getenv('REDDIT_CLIENT_ID'),
#         client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
#         user_agent=os.getenv('REDDIT_USER_AGENT')
#     )

# def scrape_subreddit(subreddit_name: str, limit: int = 100) -> List[Dict]:
#     """
#     Scrape posts from a subreddit using BeautifulSoup
#     """
#     headers = {
#         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
#     }

#     posts = []
#     url = f'https://old.reddit.com/r/{subreddit_name}'

#     while len(posts) < limit:
#         response = requests.get(url, headers=headers)
#         soup = BeautifulSoup(response.text, 'html.parser')

#         for post in soup.find_all('div', class_='thing'):
#             if len(posts) >= limit:
#                 break

#             # Extract post data
#             title = post.find('a', class_='title').text.strip()
#             permalink = post.get('data-permalink', '')
#             author = post.get('data-author', '[deleted]')
#             score = int(post.get('data-score', 0))

#             # Get post content
#             content = ''
#             if 'self' in post.get('data-domain', ''):
#                 content_url = f'https://old.reddit.com{permalink}'
#                 try:
#                     post_response = requests.get(content_url, headers=headers)
#                     post_soup = BeautifulSoup(post_response.text, 'html.parser')
#                     content_div = post_soup.find('div', class_='usertext-body')
#                     if content_div:
#                         content = content_div.text.strip()
#                 except:
#                     pass

#                 # Add small delay to avoid rate limiting
#                 time.sleep(random.uniform(1, 2))

#             # Create embedding for the post content
#             full_content = f"{title}\n{content}"
#             embedding = get_embedding(full_content)

#             post_data = {
#                 'title': title,
#                 'content': content,
#                 'url': f"https://reddit.com{permalink}",
#                 'author': author,
#                 'score': score,
#                 'created_at': datetime.now().isoformat(),
#                 'subreddit': subreddit_name,
#                 'embedding': embedding
#             }
#             posts.append(post_data)

#         # Find next page button
#         next_button = soup.find('span', class_='next-button')
#         if not next_button:
#             break

#         next_link = next_button.find('a')
#         if not next_link:
#             break

#         url = next_link['href']
#         time.sleep(random.uniform(2, 3))  # Be nice to Reddit's servers

#     return posts

# def store_reddit_posts(subreddit_name: str, limit: int = 100):
#     """
#     Scrape and store Reddit posts in the database
#     """
#     posts = scrape_subreddit(subreddit_name, limit)
#     insert_reddit_posts(posts)
#     return len(posts)

import asyncpraw
from typing import List, Dict
import os
from dotenv import load_dotenv
import asyncio
from datetime import datetime
load_dotenv()

REDDIT_IMAGE_URL = "https://static-00.iconduck.com/assets.00/reddit-icon-512x512-mp8wosd1.png"

async def get_reddit_posts(subreddit: str, limit: int = 200) -> List[Dict]:
    """
    Fetch the 200 most recent posts from r/sideproject subreddit
    """
    reddit = asyncpraw.Reddit(
        client_id=os.getenv('REDDIT_CLIENT_ID'),
        client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
        user_agent="SideProjectScraper/1.0"
    )

    subreddit = await reddit.subreddit(subreddit)
    posts = []

    async for submission in subreddit.new(limit=limit):
        post = {
            'title': submission.title,
            'description': submission.selftext,
            'link': f'https://reddit.com{submission.permalink}',
            'source_link': f'https://reddit.com/r/{subreddit}',
            'source': 'reddit',
            'image_url': REDDIT_IMAGE_URL,
            'author_name': submission.author.name,
            'author_profile_url': f"https://reddit.com/u/{submission.author.name}",
            'created_at': datetime.fromtimestamp(submission.created_utc).isoformat(),
            'categories': 'r/' + subreddit
        }
        posts.append(post)

    await reddit.close()
    return posts

# Helper function for non-async contexts
def get_reddit_posts_sync() -> List[Dict]:
    """
    Synchronous wrapper for get_reddit_posts
    """
    return asyncio.run(get_reddit_posts())
