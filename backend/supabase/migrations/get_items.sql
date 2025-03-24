CREATE OR REPLACE FUNCTION get_items(
    embedding_param vector,
    sources text[],
    reddit_category_list text[] DEFAULT NULL,
    product_hunt_category_list text[] DEFAULT NULL,
    num_results integer DEFAULT 25,
    recency integer DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    created_at timestamptz,
    author_name text,
    author_profile_url text,
    title text,
    description text,
    link text,
    source text,
    source_link text,
    similarity float,
    image_url text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        i.created_at,
        i.author_name,
        i.author_profile_url,
        i.title,
        i.description,
        i.link,
        i.source,
        i.source_link,
        1 - (i.embedding <=> embedding_param) AS similarity,
        i.image_url
    FROM items i
    WHERE
        -- Source filtering
        i.source = ANY(sources)
        -- Reddit category filtering (only applies if source includes reddit and categories provided)
        AND (reddit_category_list IS NULL
             OR i.source != 'reddit'
             OR EXISTS (
                SELECT 1
                FROM unnest(i.categories) cat
                WHERE LOWER(cat) = ANY(SELECT LOWER(c) FROM unnest(reddit_category_list) c)
             ))
        -- Product Hunt category filtering (only applies if source includes product_hunt and categories provided)
        AND (product_hunt_category_list IS NULL
             OR i.source != 'product_hunt'
             OR EXISTS (
                SELECT 1
                FROM unnest(i.categories) cat
                WHERE LOWER(cat) = ANY(SELECT LOWER(c) FROM unnest(product_hunt_category_list) c)
             ))
        -- Recency filtering (only applies if recency is specified)
        AND (recency IS NULL
             OR i.created_at >= NOW() - INTERVAL '1 day' * recency)
    ORDER BY
        i.embedding <=> embedding_param  -- Vector similarity ordering
    LIMIT num_results;
END;
$$ LANGUAGE plpgsql;
