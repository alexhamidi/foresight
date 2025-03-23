from typing import List, Dict, Any
import spacy
from utils import embedding as emb
from utils.scraper import arxiv_scraper

# Load English language model
nlp = spacy.load("en_core_web_sm")

async def get_arxiv_items(query: str, query_embedding: List[float], arxiv_category_list: List[str], num_results: int, recency: int) -> List[Dict[str, Any]]:
    nouns = [token.text.lower() for token in nlp(query)
             if token.pos_ in ['NOUN', 'PROPN']]

    arxiv_items = await arxiv_scraper.search_papers(nouns, arxiv_category_list, num_results, recency)
    if (len(arxiv_items) == 0):
        return []


    embeddings = await emb.get_item_embeddings(arxiv_items)
    try:
        similarities = emb.compute_cosine_similarity(query_embedding, embeddings)
    except Exception as e:
        return []

    for item, similarity in zip(arxiv_items, similarities):
        item['similarity'] = float(similarity)

    return arxiv_items
