CREATE OR REPLACE FUNCTION get_items(
    embedding_param vector,
    sources text[],
    reddit_category_list text[] DEFAULT NULL,
    product_hunt_category_list text[] DEFAULT NULL,
    num_results integer DEFAULT 25,
    recency integer DEFAULT 365
) RETURNS TABLE (
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
    WITH filtered_items AS (
        SELECT 
            id,
            created_at,
            author_name,
            author_profile_url,
            title,
            description,
            link,
            source,
            source_link,
            1 - (embedding <=> embedding_param) AS similarity,
            image_url,
            categories
        FROM items
        WHERE 
            source = ANY(sources)
            AND created_at >= CURRENT_DATE - recency * INTERVAL '1 day'
            AND (
                -- Handle Reddit categories
                (source != 'reddit' OR reddit_category_list IS NULL OR 
                 categories && reddit_category_list)
                AND
                -- Handle Product Hunt categories
                (source != 'product_hunt' OR product_hunt_category_list IS NULL OR 
                 categories && product_hunt_category_list)
            )
    )
    SELECT 
        id,
        created_at,
        author_name,
        author_profile_url,
        title,
        description,
        link,
        source,
        source_link,
        similarity,
        image_url
    FROM filtered_items
    ORDER BY similarity DESC
    LIMIT num_results;
END;
$$ LANGUAGE plpgsql; 