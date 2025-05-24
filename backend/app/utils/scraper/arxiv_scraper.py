import arxiv
from typing import List, Dict
import asyncio
from functools import lru_cache
from datetime import datetime, timedelta
from lib.logger import setup_logger

logger = setup_logger("arxiv_scraper")
ARXIV_IMAGE_URL = "https://library.stlawu.edu/sites/default/files/2020-07/arxiv-logo.png"

@lru_cache(maxsize=1)
def get_arxiv_client():
    logger.debug("Creating new arXiv client")
    return arxiv.Client(
        page_size=100,
        delay_seconds=3,
        num_retries=3
    )

async def search_papers(nouns: List[str],  arxiv_category_list: List[str],num_results: int, recency: int) -> List[Dict[str, str]]:
    """
    Search for papers on arXiv that contain all the given nouns in their abstract
    Returns a list of papers with title, description (abstract), and link
    """
    try:
        # Optimize query construction
        noun_query = ' AND '.join(f'abs:"{noun.lower()}"' for noun in nouns if len(noun) > 2)
        if not noun_query:
            logger.debug("No valid nouns provided for arXiv search")
            return []

        search_query = f'cat:cs.* AND ({noun_query})'

        if arxiv_category_list:
            search_query = f'cat:cs.* AND ({noun_query}) AND cat:{" OR ".join(arxiv_category_list)}'
            logger.debug(f"Searching arXiv with categories: {arxiv_category_list}")

        logger.info(f"Executing arXiv search with query: {search_query}")
        client = get_arxiv_client()
        search = arxiv.Search(
            query=search_query,
            max_results=num_results,
            sort_by=arxiv.SortCriterion.SubmittedDate,
            sort_order=arxiv.SortOrder.Descending
        )

        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(None, lambda: list(client.results(search)))
        logger.debug(f"Retrieved {len(results)} initial results from arXiv")

        # Filter results by recency - convert to naive datetime for comparison
        cutoff_date = datetime.now() - timedelta(days=recency)
        results = [paper for paper in results if paper.published.replace(tzinfo=None) >= cutoff_date]
        logger.debug(f"Filtered to {len(results)} results within {recency} days")

        papers = [
            {
                'title': paper.title,
                'description': paper.summary,
                'link': paper.pdf_url,
                'source': 'arxiv',
                'source_link': paper.entry_id,
                'image_url': ARXIV_IMAGE_URL,
                'author_name': paper.authors[0].name,
                'author_profile_url': f"https://arxiv.org/search/cs?searchtype=author&query={paper.authors[0].name.split(' ')[1]},+{paper.authors[0].name.split(' ')[0][0]}",
                'created_at': paper.published.isoformat()
            }
            for paper in results
        ]

        logger.info(f"Successfully processed {len(papers)} arXiv papers")
        return papers

    except Exception as e:
        logger.error(f"Error searching arXiv: {str(e)}", exc_info=True)
        return []
