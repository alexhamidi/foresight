from openai import AsyncOpenAI
from typing import List, Dict, Any
import numpy as np
from dotenv import load_dotenv
import asyncio
load_dotenv()

client = AsyncOpenAI()

async def create_embedding(text: str) -> np.ndarray:
    try:
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return np.array(response.data[0].embedding)
    except Exception as e:
        raise Exception(f"Error creating embedding: {str(e)}")

async def get_item_embeddings(items: List[Dict[str, Any]]) -> np.ndarray:
    tasks = []
    for item in items:
        text = f"{item['title']} {item['description']} {', '.join(item.get('categories', []))}"
        tasks.append(create_embedding(text))

    embeddings = await asyncio.gather(*tasks)
    return np.array(embeddings)

def compute_cosine_similarity(query_embedding: np.ndarray, item_embeddings: np.ndarray) -> np.ndarray:
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
