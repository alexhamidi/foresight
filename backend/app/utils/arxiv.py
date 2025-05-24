#========================================
# Imports and Initialization
#========================================
from typing import List, Dict, Any
import spacy
from utils import embedding as emb
from utils.scraper import arxiv_scraper

# Load English language model
nlp = spacy.load("en_core_web_sm")

#========================================
# arXiv Search Functions
#========================================
async def get_arxiv_items(query: str, query_embedding: List[float], arxiv_category_list: List[str], num_results: int, recency: int) -> List[Dict[str, Any]]:
    """Search for relevant arXiv papers based on query and filters.

    Args:
        query: The search query text
        query_embedding: The embedding vector for the query
        arxiv_category_list: List of arXiv categories to filter by
        num_results: Maximum number of results to return
        recency: Time window for recent papers

    Returns:
        List of matching arXiv papers with similarity scores
    """
    # Extract nouns from query for keyword search
    nouns = [token.text.lower() for token in nlp(query)
             if token.pos_ in ['NOUN', 'PROPN']]

    # Search arXiv using extracted keywords
    arxiv_items = await arxiv_scraper.search_papers(nouns, arxiv_category_list, num_results, recency)
    if (len(arxiv_items) == 0):
        return []

    # Calculate similarity scores
    embeddings = await emb.get_item_embeddings(arxiv_items)
    try:
        similarities = emb.compute_cosine_similarity(query_embedding, embeddings)
    except Exception:
        return []

    # Add similarity scores to items
    for item, similarity in zip(arxiv_items, similarities):
        item['similarity'] = float(similarity)

    return arxiv_items
