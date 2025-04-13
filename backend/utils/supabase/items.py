from supabase import acreate_client, create_client
import os
from typing import List, Any
import logging
from dotenv import load_dotenv
import asyncio
import numpy as np
from .init import asupabase



#========================================
# Get the total number of items in the DB
#========================================
async def get_num_items() -> int:
    """Get the total count of items in the database.
    Returns:
        int: Total number of items
    """
    try:
        # Initialize Supabase client if not already initialized
        response = await asupabase.rpc('get_total_item_count').execute()
        return response.data
    except Exception as e:
        logging.error(f"Failed to get database size: {e}")
        raise




#========================================
# Item Insertions
#========================================
async def add_items(items: List[dict[str, Any]], embeddings: np.ndarray, table: str) -> None:
    """Add or update items in the specified table with their embeddings.

    Args:
        items: List of item dictionaries containing metadata
        embeddings: Numpy array of embeddings corresponding to items
        table: Name of the table to insert into
    """
    try:
        if len(items) != len(embeddings):
            raise ValueError("Number of items must match number of embeddings")

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

    except Exception as e:
        logging.error(f"Error adding items to Supabase: {str(e)}")
        raise



#========================================
# Item Fetching from a single source - for parallelism
#========================================
async def fetch_items_from_source(source: str, embedding: np.ndarray, num_results: int, recency: int, category_list: List[str]) -> List[dict[str, Any]]:
    """Fetch items from a specific source matching the embedding and criteria.

    Args:
        source: Source identifier
        embedding: Query embedding vector
        num_results: Maximum number of results to return
        recency: Time window for recent items
        category_list: List of categories to filter by

    Returns:
        List of matching items
    """
    try:
        payload = {
            'source_param': source,
            'embedding_param': embedding.tolist(),
            'category_list': category_list,
            'num_results': num_results,
            'recency': recency
        }
        response = await asupabase.rpc('get_items_by_source', payload).execute()
        return response.data
    except Exception as e:
        logging.error(f"Error fetching from {source}: {str(e)}")
        return []


#========================================
# Primary function for fetching items
#========================================
async def get_items(
    sources: List[str],
    embedding: np.ndarray,
    num_results: int,
    recency: int,
    reddit_category_list: List[str],
    product_hunt_category_list: List[str],
    y_combinator_category_list: List[str]
) -> List[dict[str, Any]]:
    """Get items from multiple sources based on embedding similarity and filters.

    Args:
        sources: List of source identifiers to query
        embedding: Query embedding vector
        num_results: Maximum total results to return
        recency: Time window for recent items
        reddit_category_list: Categories to filter Reddit items
        product_hunt_category_list: Categories to filter Product Hunt items
        y_combinator_category_list: Categories to filter Y Combinator items

    Returns:
        Combined list of matching items across all sources
    """
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

        return combined_results[:num_results]

    except Exception as e:
        logging.error(f"Error performing vector search: {str(e)}")
        raise

