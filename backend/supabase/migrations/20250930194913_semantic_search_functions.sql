-- ============================================================================
-- Semantic Search Functions
-- Purpose: Vector similarity search across existing embedding tables
-- No separate product_embeddings table - agents query domain-specific tables
-- ============================================================================

-- ============================================================================
-- RPC FUNCTION 1: semantic_search_product_features
-- Searches product_features table for semantic feature matching
-- ============================================================================

CREATE OR REPLACE FUNCTION semantic_search_product_features(
    query_embedding VECTOR(1536),
    match_count INT DEFAULT 10,
    min_similarity FLOAT DEFAULT 0.7,
    filter_price_tier TEXT DEFAULT NULL,
    filter_design_style TEXT DEFAULT NULL
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    feature_name TEXT,
    feature_description TEXT,
    feature_category TEXT,
    similarity FLOAT,
    price_tier TEXT,
    design_style TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS product_id,
        p.name AS product_name,
        pf.feature_name,
        pf.description AS feature_description,
        pf.feature_category,
        1 - (pf.embedding <=> query_embedding) AS similarity,
        p.price_tier,
        p.design_style
    FROM product_features pf
    JOIN products p ON pf.product_id = p.id
    WHERE 
        pf.embedding IS NOT NULL
        AND (1 - (pf.embedding <=> query_embedding)) >= min_similarity
        AND (filter_price_tier IS NULL OR p.price_tier = filter_price_tier)
        AND (filter_design_style IS NULL OR p.design_style = filter_design_style)
    ORDER BY pf.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION semantic_search_product_features(VECTOR(1536), INT, FLOAT, TEXT, TEXT) TO anon, authenticated;

COMMENT ON FUNCTION semantic_search_product_features IS 
'Semantic search across product features using vector similarity. 
Returns features that match the query with product context.';

-- ============================================================================
-- RPC FUNCTION 2: search_use_case_scenarios
-- Searches use_case_scenarios table for situation matching
-- ============================================================================

CREATE OR REPLACE FUNCTION search_use_case_scenarios(
    query_embedding VECTOR(1536),
    match_count INT DEFAULT 5,
    min_similarity FLOAT DEFAULT 0.75
)
RETURNS TABLE (
    scenario_id UUID,
    scenario_name TEXT,
    description TEXT,
    similarity FLOAT,
    recommended_products UUID[],
    reasoning TEXT,
    pain_points TEXT[],
    budget_range JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ucs.id AS scenario_id,
        ucs.scenario_name,
        ucs.talking_points AS description,
        1 - (ucs.embedding <=> query_embedding) AS similarity,
        ucs.recommended_products,
        COALESCE(
            ucs.objection_handlers::jsonb->>'price_concern',
            'See scenario details for full reasoning'
        ) AS reasoning,
        ucs.pain_points,
        ucs.budget_range
    FROM use_case_scenarios ucs
    WHERE 
        ucs.embedding IS NOT NULL
        AND (1 - (ucs.embedding <=> query_embedding)) >= min_similarity
    ORDER BY ucs.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION search_use_case_scenarios(VECTOR(1536), INT, FLOAT) TO anon, authenticated;

COMMENT ON FUNCTION search_use_case_scenarios IS 
'Match user situations to expert sales scenarios using vector similarity. 
Returns scenario recommendations with talking points and product suggestions.';

-- ============================================================================
-- RPC FUNCTION 3: search_product_configurations
-- Searches product_configurations table for pre-built setups
-- ============================================================================

CREATE OR REPLACE FUNCTION search_product_configurations(
    query_embedding VECTOR(1536),
    match_count INT DEFAULT 10,
    filter_product_id UUID DEFAULT NULL,
    min_popularity_rank INT DEFAULT NULL
)
RETURNS TABLE (
    config_id UUID,
    product_id UUID,
    product_name TEXT,
    variant_name TEXT,
    addons TEXT[],
    total_price DECIMAL(10, 2),
    similarity FLOAT,
    popularity_rank INT,
    configuration_name TEXT,
    description TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id AS config_id,
        p.id AS product_id,
        p.name AS product_name,
        pv.variant_name,
        -- Convert addon_ids to addon names
        ARRAY(
            SELECT pa.addon_name 
            FROM product_addons pa 
            WHERE pa.id = ANY(pc.addon_ids)
        ) AS addons,
        pc.total_price,
        1 - (pc.embedding <=> query_embedding) AS similarity,
        pc.popularity_rank,
        pc.configuration_name,
        pc.description
    FROM product_configurations pc
    JOIN products p ON pc.product_id = p.id
    JOIN product_variants pv ON pc.variant_id = pv.id
    WHERE 
        pc.embedding IS NOT NULL
        AND (filter_product_id IS NULL OR pc.product_id = filter_product_id)
        AND (min_popularity_rank IS NULL OR pc.popularity_rank >= min_popularity_rank)
    ORDER BY pc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION search_product_configurations(VECTOR(1536), INT, UUID, INT) TO anon, authenticated;

COMMENT ON FUNCTION search_product_configurations IS 
'Find pre-built product configurations using semantic search. 
Returns complete configurations with variants, addons, and pricing.';

-- ============================================================================
-- RPC FUNCTION 4: search_comparison_frameworks
-- Searches comparison_frameworks table for product comparisons
-- ============================================================================

CREATE OR REPLACE FUNCTION search_comparison_frameworks(
    query_embedding VECTOR(1536),
    match_count INT DEFAULT 5,
    min_similarity FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    framework_id UUID,
    products_compared UUID[],
    comparison_context TEXT,
    key_differentiators JSONB,
    decision_criteria TEXT[],
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cf.id AS framework_id,
        cf.products_compared,
        cf.comparison_context,
        cf.key_differentiators,
        cf.decision_criteria,
        1 - (cf.embedding <=> query_embedding) AS similarity
    FROM comparison_frameworks cf
    WHERE 
        cf.embedding IS NOT NULL
        AND (1 - (cf.embedding <=> query_embedding)) >= min_similarity
    ORDER BY cf.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION search_comparison_frameworks(VECTOR(1536), INT, FLOAT) TO anon, authenticated;

COMMENT ON FUNCTION search_comparison_frameworks IS 
'Search for expert product comparison frameworks using semantic similarity. 
Returns pre-built comparisons with decision criteria and differentiators.';

-- ============================================================================
-- RPC FUNCTION 5: search_product_addons (Bonus)
-- Searches product_addons table for addon matching
-- ============================================================================

CREATE OR REPLACE FUNCTION search_product_addons(
    query_embedding VECTOR(1536),
    match_count INT DEFAULT 10,
    filter_product_id UUID DEFAULT NULL,
    min_similarity FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    addon_id UUID,
    product_id UUID,
    product_name TEXT,
    addon_category TEXT,
    addon_name TEXT,
    addon_price DECIMAL(10, 2),
    similarity FLOAT,
    is_default BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pa.id AS addon_id,
        p.id AS product_id,
        p.name AS product_name,
        pa.addon_category,
        pa.addon_name,
        pa.addon_price,
        1 - (pa.embedding <=> query_embedding) AS similarity,
        pa.is_default
    FROM product_addons pa
    JOIN products p ON pa.product_id = p.id
    WHERE 
        pa.embedding IS NOT NULL
        AND (1 - (pa.embedding <=> query_embedding)) >= min_similarity
        AND (filter_product_id IS NULL OR pa.product_id = filter_product_id)
    ORDER BY pa.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION search_product_addons(VECTOR(1536), INT, UUID, FLOAT) TO anon, authenticated;

COMMENT ON FUNCTION search_product_addons IS 
'Search product addons using semantic similarity. 
Useful for recommending accessories and upgrades based on user needs.';
