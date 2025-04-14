from typing import List, Dict, Any
import logging
from utils import embedding as emb, arxiv
from utils.supabase import items

logger = logging.getLogger(__name__)

SIMILARITY_THRESHOLD = 0.3

async def get_search_results(
    sources: List[str],
    query: str,
    enriched_query: str,
    num_results: int,
    recency: int,
    reddit_categories: List[str] = None,
    product_hunt_categories: List[str] = None,
    ycombinator_categories: List[str] = None,
    arxiv_categories: List[str] = None
) -> List[Dict[str, Any]]:
    """
    Retrieve search results from specified sources using embedding-based search.

    Args:
        sources: List of source names to search
        query: Original search query
        enriched_query: Query enriched with AI analysis
        num_results: Number of results to return
        recency: How recent the results should be
        reddit_categories: List of Reddit categories to filter by
        product_hunt_categories: List of Product Hunt categories to filter by
        ycombinator_categories: List of Y Combinator categories to filter by
        arxiv_categories: List of arXiv categories to filter by

    Returns:
        List of search results from all sources
    """
    search_results = []
    query_embedding = await emb.create_embedding(enriched_query)

    # Search non-arXiv sources
    if set(sources) - {"arxiv"}:
        db_items = await items.embedding_search(
            sources,
            query_embedding,
            num_results,
            recency,
            reddit_categories,
            product_hunt_categories,
            ycombinator_categories
        )
        search_results.extend(db_items)
        logger.debug(f"Retrieved {len(db_items)} items from Supabase sources")

    # Search arXiv if requested
    if "arxiv" in sources:
        arxiv_items = await arxiv.get_arxiv_items(
            query,
            query_embedding,
            arxiv_categories,
            num_results,
            recency
        )
        search_results.extend(arxiv_items)
        logger.debug(f"Retrieved {len(arxiv_items)} items from arXiv")

    return search_results

def filter_results(search_results: List[Dict[str, Any]], num_results: int) -> List[Dict[str, Any]]:
    """
    Filter and clean search results based on similarity threshold.

    Args:
        search_results: List of raw search results
        num_results: Maximum number of results to return

    Returns:
        List of filtered and cleaned search results
    """
    # Filter by similarity threshold and sort
    filtered_results = [item for item in search_results if item['similarity'] >= SIMILARITY_THRESHOLD]
    filtered_results.sort(key=lambda x: x['similarity'], reverse=True)
    filtered_results = filtered_results[:num_results]

    # Clean results to ensure serializable values
    cleaned_results = []
    for item in filtered_results:
        cleaned_item = {}
        for k, v in item.items():
            if isinstance(v, (int, float, bool, list, dict)):
                cleaned_item[k] = v
            else:
                cleaned_item[k] = str(v)
        cleaned_results.append(cleaned_item)

    return cleaned_results
