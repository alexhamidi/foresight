from supabase import acreate_client, create_client
import os
from typing import List, Any
import logging
from dotenv import load_dotenv
import asyncio
import numpy as np
from datetime import datetime

load_dotenv()


supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

async def init_supabase():
    global asupabase, supabase
    asupabase = await acreate_client(supabase_url, supabase_key)
    supabase = create_client(supabase_url, supabase_key)  # This one is not async

asyncio.run(init_supabase())

async def init_supabase():
    global asupabase, supabase
    if asupabase is None:
        asupabase = await acreate_client(supabase_url, supabase_key)
        supabase = create_client(supabase_url, supabase_key)  # This one is not async
    return asupabase, supabase




async def add_items(items: List[dict[str, Any]], embeddings: np.ndarray, table) -> None:
    try:
        tasks = [
            asupabase.table(table).upsert({
                'title': item['title'],
                'description': item['description'],
                'link': item['link'],
                'source_link': item['source_link'],
                'embedding': embeddings[i].tolist(),
                'image_url': item['image_url'],
                'created_at': item['created_at'],
                'author_name': item.get('author_name', ''),
                'author_profile_url': item.get('author_profile_url', ''),
                'categories': item.get('categories', []),
            },
            on_conflict='title',
            count='exact'
            ).execute()
            for i, item in enumerate(items)
        ]

        results = await asyncio.gather(*tasks)

        # Check results
        for result in results:
            if hasattr(result, 'error') and result.error:
                raise Exception(f"Error inserting item: {result.error}")

        # After successful insertion, update the DB size in the app


    except Exception as e:
        logging.error(f"Error adding items to Supabase: {str(e)}")
        raise



async def fetch_items_from_source(source: str, embedding: np.ndarray, num_results: int, recency: int, category_list: List[str]) -> List[dict[str, Any]]:
    try:
        payload = {
            'source_param': source,
            'embedding_param': embedding.tolist(),
            'category_list': category_list,
            'num_results': num_results,
            'recency': recency
        }
        # Async RPC call using asupabase
        response = await asupabase.rpc('get_items_by_source', payload).execute()
        return response.data
    except Exception as e:
        logging.error(f"Error fetching from {source}: {str(e)}")
        return []

async def get_items(sources: List[str], embedding: np.ndarray, num_results: int, recency: int, reddit_category_list: List[str], product_hunt_category_list: List[str], y_combinator_category_list: List[str]) -> List[dict[str, Any]]:
    try:
        if embedding is None or len(embedding) == 0:
            raise ValueError("Empty embedding vector")

        # Map sources to their category lists
        category_map = {
            'y_combinator': y_combinator_category_list,
            'hacker_news': None,  # No category filter for HN
            'reddit': reddit_category_list,
            'product_hunt': product_hunt_category_list
        }

        # Create a list of async tasks for each source
        tasks = [
            fetch_items_from_source(
                source=source,
                embedding=embedding,
                num_results=num_results,
                recency=recency,
                category_list=category_map.get(source)
            )
            for source in sources if source in category_map
        ]

        # Run all tasks concurrently and gather results
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Flatten the results into a single list
        combined_results = []
        for result in results:
            if isinstance(result, list):  # Check if result is valid data
                combined_results.extend(result)
            else:
                logging.warning(f"Task returned an error: {result}")

        return combined_results

    except Exception as e:
        logging.error(f"Error performing vector search: {str(e)}")
        raise


async def post_feedback(message: str, name: str = "", email: str = "") -> None:
    """Store user feedback in the feedback table"""
    try:
        await asupabase.table('feedback').insert({
            'message': message,
            'name': name,
            'email': email,
        }).execute()
        logging.info(f"Successfully stored feedback from {name if name else 'anonymous'}")
    except Exception as e:
        logging.error(f"Error storing feedback: {str(e)}")
        raise





