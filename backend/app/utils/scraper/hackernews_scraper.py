import requests
from typing import List, Dict, Any
import html
import re
from datetime import datetime

HACKER_NEWS_IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Y_Combinator_logo.svg/1200px-Y_Combinator_logo.svg.png"

def clean_html_text(text: str) -> str:
    if not text:
        return ""
    # Decode HTML entities
    text = html.unescape(text)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()

def get_hacker_news_posts(limit: int = 200) -> List[Dict[str, Any]]:

    base_url = "https://hn.algolia.com/api/v1"

    try:
        # Query for "Show HN" posts using search_by_date endpoint
        query_params = {
            'query': '"Show HN"',
            'tags': 'story',
            'numericFilters': 'points>=0',  # Include all posts regardless of points
            'hitsPerPage': limit
        }

        response = requests.get(
            f"{base_url}/search_by_date",  # Changed endpoint to search_by_date
            params=query_params
        )
        response.raise_for_status()

        data = response.json()
        posts = data.get('hits', [])

        processed_posts = []
        for post in posts:
            # Skip posts without titles or URLs
            if not post.get('title') or not post.get('url'):
                continue

            title = post['title']
            # Remove "Show HN:" from the title
            clean_title = title.replace('Show HN:', '').replace('Show HN -', '').strip()

            description = post.get('story_text', '')
            clean_description = clean_html_text(description)

            # Convert Unix timestamp to ISO8601
            created_at = datetime.fromtimestamp(post['created_at_i']).isoformat()

            processed_post = {
                'title': clean_title,
                'description': clean_description,  # Use cleaned description if available, otherwise use title
                'link': post['url'],
                'source': 'hacker_news',
                'source_link': f'https://news.ycombinator.com/item?id={post["objectID"]}',
                'image_url': HACKER_NEWS_IMAGE_URL,
                'author_name': post.get('author', ''),
                'author_profile_url': f"https://news.ycombinator.com/user?id={post['author']}",
                'created_at': created_at,  # Add created_at field
            }
            processed_posts.append(processed_post)

        return processed_posts

    except requests.RequestException as e:
        raise Exception(f"Failed to fetch HackerNews posts: {str(e)}")
    except (KeyError, ValueError) as e:
        raise Exception(f"Failed to process HackerNews posts: {str(e)}")
