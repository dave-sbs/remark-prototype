-- ============================================================================
-- Knowledge Hub Schema V1
-- Purpose: Conversational patterns, use cases, insights, and learning
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- Use case scenarios and sales playbooks
CREATE TABLE use_case_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_name TEXT NOT NULL,
    user_profile JSONB,
    pain_points TEXT[],
    recommended_products UUID[],
    talking_points TEXT,
    objection_handlers JSONB,
    success_metrics TEXT[],
    budget_range JSONB,
    recommended_configurations UUID[],
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuration-use case relationships
CREATE TABLE configuration_use_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configuration_id UUID NOT NULL REFERENCES product_configurations(id) ON DELETE CASCADE,
    use_case_id UUID NOT NULL REFERENCES use_case_scenarios(id) ON DELETE CASCADE,
    relevance_score FLOAT DEFAULT 1.0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(configuration_id, use_case_id)
);

-- Comparison frameworks for competitive analysis
CREATE TABLE comparison_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    products_compared UUID[],
    comparison_context TEXT,
    key_differentiators JSONB,
    decision_criteria TEXT[],
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learned conversation patterns
CREATE TABLE conversation_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type TEXT NOT NULL,
    user_intent TEXT NOT NULL,
    successful_responses TEXT[],
    product_matches UUID[],
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    usage_count INT DEFAULT 0,
    price_mentioned BOOLEAN DEFAULT FALSE,
    budget_range JSONB,
    configuration_discussed UUID[],
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interaction history
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    context_used JSONB,
    products_discussed UUID[],
    interaction_outcome TEXT,
    user_satisfaction INT CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learned insights from interactions
CREATE TABLE learned_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type TEXT NOT NULL,
    related_products UUID[],
    insight_content TEXT NOT NULL,
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    validated_count INT DEFAULT 0,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_validated TIMESTAMPTZ
);

-- Feature importance by user segment
CREATE TABLE feature_importance_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    user_segment TEXT NOT NULL,
    importance_score FLOAT CHECK (importance_score >= 0 AND importance_score <= 1),
    sample_size INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semantic knowledge graph
CREATE TABLE knowledge_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type_a TEXT NOT NULL,
    entity_id_a UUID NOT NULL,
    relationship_type TEXT NOT NULL,
    entity_type_b TEXT NOT NULL,
    entity_id_b UUID NOT NULL,
    strength FLOAT DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
    evidence_count INT DEFAULT 1,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation feedback loop
CREATE TABLE conversation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID NOT NULL REFERENCES user_interactions(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL,
    specific_feedback TEXT,
    suggested_improvement TEXT,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Foreign key indexes
CREATE INDEX idx_configuration_use_cases_config ON configuration_use_cases(configuration_id);
CREATE INDEX idx_configuration_use_cases_usecase ON configuration_use_cases(use_case_id);
CREATE INDEX idx_feature_importance_scores_product ON feature_importance_scores(product_id);
CREATE INDEX idx_conversation_feedback_interaction ON conversation_feedback(interaction_id);

-- Query optimization indexes
CREATE INDEX idx_use_case_scenarios_budget ON use_case_scenarios USING gin(budget_range);
CREATE INDEX idx_conversation_patterns_type ON conversation_patterns(pattern_type);
CREATE INDEX idx_conversation_patterns_usage ON conversation_patterns(usage_count DESC);
CREATE INDEX idx_user_interactions_session ON user_interactions(session_id);
CREATE INDEX idx_user_interactions_outcome ON user_interactions(interaction_outcome);
CREATE INDEX idx_learned_insights_type ON learned_insights(insight_type);
CREATE INDEX idx_learned_insights_validated ON learned_insights(validated_count DESC);
CREATE INDEX idx_feature_importance_scores_segment ON feature_importance_scores(user_segment);
CREATE INDEX idx_knowledge_relationships_entity_a ON knowledge_relationships(entity_type_a, entity_id_a);
CREATE INDEX idx_knowledge_relationships_entity_b ON knowledge_relationships(entity_type_b, entity_id_b);
CREATE INDEX idx_knowledge_relationships_type ON knowledge_relationships(relationship_type);
CREATE INDEX idx_conversation_feedback_processed ON conversation_feedback(processed);

-- Time-based indexes
CREATE INDEX idx_user_interactions_created ON user_interactions(created_at DESC);
CREATE INDEX idx_learned_insights_validated_time ON learned_insights(last_validated DESC);

-- Vector similarity search indexes
CREATE INDEX idx_use_case_scenarios_embedding ON use_case_scenarios
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_comparison_frameworks_embedding ON comparison_frameworks
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_conversation_patterns_embedding ON conversation_patterns
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_user_interactions_embedding ON user_interactions
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_learned_insights_embedding ON learned_insights
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_knowledge_relationships_embedding ON knowledge_relationships
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE use_case_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_importance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_feedback ENABLE ROW LEVEL SECURITY;

-- Public read access for use_case_scenarios and comparison_frameworks
CREATE POLICY "Public read access for use_case_scenarios"
    ON use_case_scenarios FOR SELECT
    USING (true);

CREATE POLICY "Public read access for configuration_use_cases"
    ON configuration_use_cases FOR SELECT
    USING (true);

CREATE POLICY "Public read access for comparison_frameworks"
    ON comparison_frameworks FOR SELECT
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
CREATE TRIGGER update_use_case_scenarios_updated_at
    BEFORE UPDATE ON use_case_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comparison_frameworks_updated_at
    BEFORE UPDATE ON comparison_frameworks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_patterns_updated_at
    BEFORE UPDATE ON conversation_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learned_insights_updated_at
    BEFORE UPDATE ON learned_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_importance_scores_updated_at
    BEFORE UPDATE ON feature_importance_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_relationships_updated_at
    BEFORE UPDATE ON knowledge_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();