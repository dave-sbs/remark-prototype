-- ============================================================================
-- Product Schema V1
-- Purpose: Core product data, specifications, and features
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Core products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price_tier TEXT CHECK (price_tier IN ('budget', 'mid-range', 'premium', 'luxury')),
    design_style TEXT,
    brand_line TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product dimensions
CREATE TABLE product_dimensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name TEXT,
    height_min DECIMAL(5,2),
    height_max DECIMAL(5,2),
    width_min DECIMAL(5,2),
    width_max DECIMAL(5,2),
    depth_min DECIMAL(5,2),
    depth_max DECIMAL(5,2),
    seat_height_min DECIMAL(5,2),
    seat_height_max DECIMAL(5,2),
    seat_depth DECIMAL(5,2),
    arm_height_min DECIMAL(5,2),
    arm_height_max DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product materials
CREATE TABLE product_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    component TEXT NOT NULL,
    material TEXT NOT NULL,
    is_sustainable BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product colors
CREATE TABLE product_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_name TEXT NOT NULL,
    color_code TEXT,
    applies_to TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product features with semantic search
CREATE TABLE product_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    feature_category TEXT,
    description TEXT,
    is_standard BOOLEAN DEFAULT TRUE,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Foreign key indexes
CREATE INDEX idx_product_dimensions_product ON product_dimensions(product_id);
CREATE INDEX idx_product_materials_product ON product_materials(product_id);
CREATE INDEX idx_product_colors_product ON product_colors(product_id);
CREATE INDEX idx_product_features_product ON product_features(product_id);

-- Filtering indexes
CREATE INDEX idx_products_price_tier ON products(price_tier);
CREATE INDEX idx_products_brand_line ON products(brand_line);
CREATE INDEX idx_product_materials_component ON product_materials(product_id, component);
CREATE INDEX idx_product_features_category ON product_features(product_id, feature_category);

-- Vector similarity search
CREATE INDEX idx_product_features_embedding ON product_features
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;

-- Public read access (for chatbot queries)
CREATE POLICY "Public read access for products"
    ON products FOR SELECT
    USING (true);

CREATE POLICY "Public read access for product_dimensions"
    ON product_dimensions FOR SELECT
    USING (true);

CREATE POLICY "Public read access for product_materials"
    ON product_materials FOR SELECT
    USING (true);

CREATE POLICY "Public read access for product_colors"
    ON product_colors FOR SELECT
    USING (true);

CREATE POLICY "Public read access for product_features"
    ON product_features FOR SELECT
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

-- Trigger for products table
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();