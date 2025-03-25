from supabase import acreate_client, create_client
import os
from typing import List, Any
import logging
from dotenv import load_dotenv
import asyncio
import numpy as np

load_dotenv()


supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

# Initialize as None first
asupabase = None
supabase = None

async def init_supabase():
    global asupabase, supabase
    if asupabase is None:
        asupabase = await acreate_client(supabase_url, supabase_key)
        supabase = create_client(supabase_url, supabase_key)  # This one is not async
    return asupabase, supabase


def get_db_size():
    response = supabase.rpc('get_db_size').execute()
    return response.data


async def add_items(items: List[dict[str, Any]], embeddings: np.ndarray) -> None:
    try:
        # Create list of coroutines for parallel execution
        tasks = [
            asupabase.table('items').upsert({
                'title': item['title'],
                'description': item['description'],
                'link': item['link'],
                'source': item['source'],
                'source_link': item['source_link'],
                'embedding': embeddings[i].tolist(),
                'image_url': item['image_url'],
                'created_at': item['created_at'],
                'author_name': item.get('author_name', ''),
                'author_profile_url': item.get('author_profile_url', ''),
                'categories': item.get('categories', []),
            },
            on_conflict='title',  # Specify the column that has the unique constraint
            count='exact'  # This will return the number of affected rows
            ).execute()
            for i, item in enumerate(items)
        ]

        # Execute all inserts in parallel
        results = await asyncio.gather(*tasks)

        # Check results
        for result in results:
            if hasattr(result, 'error') and result.error:
                raise Exception(f"Error inserting item: {result.error}")

        # After successful insertion, update the DB size in the app
        from app import update_db_size
        update_db_size()

    except Exception as e:
        logging.error(f"Error adding items to Supabase: {str(e)}")
        raise




def get_items(sources: List[str], embedding: np.ndarray, num_results: int, recency: int, reddit_category_list: List[str], product_hunt_category_list: List[str], y_combinator_category_list: List[str]) -> List[dict[str, Any]]:
    try:
        # Verify embedding is not null and has correct dimensions
        if embedding is None or len(embedding) == 0:
            raise ValueError("Empty embedding vector")

        payload =  {
            'embedding_param': embedding.tolist(),
            'sources': sources,
            'reddit_category_list': reddit_category_list,
            'product_hunt_category_list': product_hunt_category_list,
            'y_combinator_category_list': y_combinator_category_list,
            'num_results': num_results,
            'recency': recency
        }

        # print("payload: ", payload)

        response = supabase.rpc('get_items', payload).execute()
        return response.data

    except Exception as e:
        logging.error(f"Error performing vector search: {str(e)}")
        raise





