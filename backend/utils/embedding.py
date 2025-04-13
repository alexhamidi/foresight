#========================================
# Imports and Initialization
#========================================
from openai import AsyncOpenAI
from typing import List, Dict, Any
import numpy as np
from dotenv import load_dotenv
import asyncio
load_dotenv()

client = AsyncOpenAI()

#========================================
# Embedding Generation Functions
#========================================
async def create_embedding(text: str) -> np.ndarray:
    """Create an embedding vector for the given text using OpenAI's API.

    Args:
        text: The text to create an embedding for

    Returns:
        Numpy array containing the embedding vector

    Raises:
        Exception: If there is an error creating the embedding
    """
    try:
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return np.array(response.data[0].embedding)
    except Exception as e:
        raise Exception(f"Error creating embedding: {str(e)}")

async def get_item_embeddings(items: List[Dict[str, Any]]) -> np.ndarray:
    """Create embeddings for a list of items by combining their metadata.

    Args:
        items: List of item dictionaries containing title, description and categories

    Returns:
        Numpy array containing embedding vectors for all items
    """
    tasks = []
    for item in items:
        text = f"{item['title']} {item['description']} {', '.join(item.get('categories', []))}"
        tasks.append(create_embedding(text))

    embeddings = await asyncio.gather(*tasks)
    return np.array(embeddings)

#========================================
# Similarity Computation
#========================================
def compute_cosine_similarity(query_embedding: np.ndarray, item_embeddings: np.ndarray) -> np.ndarray:
    """Compute cosine similarity between a query embedding and a set of item embeddings.

    Args:
        query_embedding: The query embedding vector
        item_embeddings: Matrix of item embedding vectors

    Returns:
        Array of cosine similarity scores between query and each item
    """
    query_norm = np.linalg.norm(query_embedding)
    item_norms = np.linalg.norm(item_embeddings, axis=1)

    similarities = np.dot(item_embeddings, query_embedding) / (item_norms * query_norm)

    return similarities

# def respond_top_k(embedding: np.ndarray, items: List[Item], k: int = 10) -> List[int]:
#     print("getting top k indices...")
#     similarities = compute_cosine_similarity(embedding, items)
#     top_k_indices = np.argsort(similarities)[-k:][::-1]
#     results = [items[idx] for idx in top_k_indices]
#     return results
