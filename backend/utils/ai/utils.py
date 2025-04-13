import utils.supabase.notes as sup
import utils.embedding as emb

async def search_wrapper(query: str):
    print("getting embeddings")
    query_embedding = await emb.create_embedding(query)
    print("getting items")
    items = await sup.get_items(["product_hunt", "reddit", "y_combinator", "arxiv"], query_embedding, 10, 20000, [], [], [])
    print(f"returning items: {items}")
    return items
