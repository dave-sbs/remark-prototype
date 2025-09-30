-- ============================================================================
-- Prices Schema V1
-- Purpose: Product pricing, variants, add-ons, and configurations
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- Product variants (base pricing by size/model)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_type TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
    is_default BOOLEAN DEFAULT FALSE,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, variant_type, variant_name)
);

-- Product add-ons (arms, tilt, finish, etc.)
CREATE TABLE product_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    addon_category TEXT NOT NULL,
    addon_name TEXT NOT NULL,
    addon_price DECIMAL(10, 2) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    requires_variant_type TEXT,
    incompatible_addons UUID[],
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, addon_category, addon_name)
);

-- Pre-configured product bundles
CREATE TABLE product_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    configuration_name TEXT NOT NULL,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    addon_ids UUID[],
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    popularity_rank INT,
    description TEXT,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price comparison insights (learned messaging)
CREATE TABLE price_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_type TEXT NOT NULL,
    products_compared UUID[],
    price_range_min DECIMAL(10, 2),
    price_range_max DECIMAL(10, 2),
    key_message TEXT,
    supporting_data JSONB,
    effectiveness_score FLOAT CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price sensitivity patterns (learned from conversations)
CREATE TABLE price_behavior_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_segment TEXT NOT NULL,
    price_threshold DECIMAL(10, 2),
    sensitivity_indicators TEXT[],
    effective_responses TEXT[],
    alternative_products UUID[],
    conversion_rate FLOAT CHECK (conversion_rate >= 0 AND conversion_rate <= 1),
    sample_size INT DEFAULT 0,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Foreign key indexes
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_addons_product ON product_addons(product_id);
CREATE INDEX idx_product_configurations_product ON product_configurations(product_id);
CREATE INDEX idx_product_configurations_variant ON product_configurations(variant_id);

-- Filtering and sorting indexes
CREATE INDEX idx_product_variants_default ON product_variants(product_id, is_default);
CREATE INDEX idx_product_addons_category ON product_addons(product_id, addon_category);
CREATE INDEX idx_product_configurations_popularity ON product_configurations(product_id, popularity_rank);
CREATE INDEX idx_price_behavior_patterns_segment ON price_behavior_patterns(user_segment);

-- Price range indexes
CREATE INDEX idx_product_variants_price ON product_variants(base_price);
CREATE INDEX idx_product_configurations_price ON product_configurations(total_price);
CREATE INDEX idx_price_insights_range ON price_insights(price_range_min, price_range_max);

-- Vector similarity search indexes
CREATE INDEX idx_product_addons_embedding ON product_addons
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_product_configurations_embedding ON product_configurations
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_price_insights_embedding ON price_insights
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_price_behavior_patterns_embedding ON price_behavior_patterns
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_behavior_patterns ENABLE ROW LEVEL SECURITY;

-- Public read access (for chatbot queries)
CREATE POLICY "Public read access for product_variants"
    ON product_variants FOR SELECT
    USING (true);

CREATE POLICY "Public read access for product_addons"
    ON product_addons FOR SELECT
    USING (true);

CREATE POLICY "Public read access for product_configurations"
    ON product_configurations FOR SELECT
    USING (true);

CREATE POLICY "Public read access for price_insights"
    ON price_insights FOR SELECT
    USING (true);

CREATE POLICY "Public read access for price_behavior_patterns"
    ON price_behavior_patterns FOR SELECT
    USING (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for all tables with updated_at
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_addons_updated_at
    BEFORE UPDATE ON product_addons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_configurations_updated_at
    BEFORE UPDATE ON product_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_insights_updated_at
    BEFORE UPDATE ON price_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_behavior_patterns_updated_at
    BEFORE UPDATE ON price_behavior_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();