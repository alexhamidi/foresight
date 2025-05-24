from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from app.lib.logger import logger
from app.utils.search import main as search_main
from app.utils.search import enrich
from app.database.items import get_num_items
from app.utils.stream import ysm

router = APIRouter()

# Initialize database size


@router.get("")
async def conduct_full_search(
    query: str = Query(..., description="Search query string"),
    valid_sources: str = Query(..., description="Comma-separated list of valid sources to search"),
    recency: int = Query(..., description="Time window for recent items"),
    num_results: int = Query(..., description="Maximum number of results to return"),
    arxiv_categories: str | None = Query(None, description="Comma-separated list of arXiv categories"),
    reddit_categories: str | None = Query(None, description="Comma-separated list of Reddit categories"),
    product_hunt_categories: str | None = Query(None, description="Comma-separated list of Product Hunt categories"),
    ycombinator_categories: str | None = Query(None, description="Comma-separated list of Y Combinator categories")
):
    """
    Conduct a full search across specified sources with AI-enhanced query analysis.

    Returns a streaming response with search progress and results.
    """
    logger.info(f"Search request - Query: {query}, Sources: {valid_sources}, Recency: {recency}, Results: {num_results}")
    logger.debug(f"Current DB size: {CURR_DB_SIZE}")

    arxiv_category_list = arxiv_categories.split(',') if arxiv_categories else []
    reddit_category_list = reddit_categories.split(',') if reddit_categories else []
    product_hunt_category_list = product_hunt_categories.split(',') if product_hunt_categories else []
    y_combinator_category_list = ycombinator_categories.split(',') if ycombinator_categories else []

    async def event_generator():
        try:
            yield ysm("status", "Analyzing your search query...")

            # Get AI analysis of query
            ai_analysis = enrich.analyze_query(query)
            logger.debug(f"AI Analysis results - Problem Statement: {ai_analysis.get('problem_statement')}, Target Users: {ai_analysis.get('target_users')}")

            yield ysm("status", f"Problem Statement: {str(ai_analysis.get('problem_statement', ''))}")
            yield ysm("status", f"Target Users: {str(ai_analysis.get('target_users', ''))}")

            if ai_analysis.get('terms'):
                yield ysm("status", f"Applying Filters: {', '.join(str(t) for t in ai_analysis['terms'])}")

            sources = valid_sources.split(",")

            # Enrich query with AI analysis
            enriched_query = f"{query} {ai_analysis.get('problem_statement', '')} {ai_analysis.get('target_users', '')} {', '.join(str(t) for t in ai_analysis.get('terms', []))}"

            if "arxiv" in sources and len(sources) == 1:
                yield ysm("status", "Searching in a database of 100000+ arXiv articles")
            else:
                yield ysm("status", f"Searching in a database of {CURR_DB_SIZE} items{' and 100000+ arXiv articles' if 'arxiv' in sources else ''}")

            # Get search results using the helper function
            search_results = await search_main.get_search_results(
                sources,
                query,
                enriched_query,
                num_results,
                recency,
                reddit_category_list,
                product_hunt_category_list,
                y_combinator_category_list,
                arxiv_category_list
            )

            yield ysm("status", f"Found {len(search_results)} matching results")
            logger.info(f"Search completed - Found {len(search_results)} total results")

            # Filter and clean results using the helper function
            cleaned_results = search_main.filter_results(search_results, num_results)

            yield ysm("status", f"Filtered to {len(cleaned_results)} best results")
            yield ysm("results", cleaned_results)

            logger.info(f"Successfully processed {len(cleaned_results)} results")

        except Exception as e:
            error_msg = f"Search error: {str(e)}"
            logger.error(error_msg, exc_info=True)
            yield ysm("error", str(e))

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
