Usage Scenarios & Retrieval Mechanisms

  Category 1: Product Discovery & Exploration

  1.1 Browse by Category/Feature

  User Query: "Show me all ergonomic chairs" / "What chairs have lumbar support?"
  - Retrieval Method: SQL with filters on product_features table
  - Why: Deterministic, fast, structured attributes
  - Tool: search_products_by_features(feature_category, feature_names[])
  - Speed: Very fast (<100ms)

  1.2 Budget-Constrained Search

  User Query: "What's your best chair under $1000?" / "Chairs between $800-1200"
  - Retrieval Method: SQL range query on product_variants.base_price
  - Why: Exact price filtering, no ambiguity
  - Tool: search_products_by_price(min_price, max_price)
  - Speed: Very fast (<100ms)

  1.3 Semantic Product Search

  User Query: "I need something modern and comfortable" / "Chair for long coding sessions"
  - Retrieval Method: Hybrid search (embedding similarity + feature filters)
  - Why: Natural language requires semantic understanding
  - Tool: semantic_product_search(query, optional_filters)
  - Speed: Medium (200-400ms due to embedding generation + vector search)

  ---
  Category 2: Comparison & Decision Support

  2.1 Direct Product Comparison

  User Query: "Compare Aeron vs Cosm" / "What's the difference between Lino and Aeron?"
  - Retrieval Method:
    a. Exact match on comparison_frameworks.products_compared[]
    b. Fetch full comparison JSONB
  - Context: If user context on their occupation or needs was mentioned in prior conversation synthesize comparison from table and rephrase for their needs
  - Why: Pre-computed expert comparisons exist
  - Tool: get_product_comparison(product_ids[])
  - Speed: Very fast (<50ms, single table lookup)

  2.2 Scenario-Based Recommendation

  User Query: "I work from home and have back pain" / "Setting up an executive office"
  - Retrieval Method:
    a. Semantic search on use_case_scenarios.embedding (user query → scenario)
    b. Fetch recommended_products[] from matched scenario
    c. Enrich with product details
  - Why: Maps user situation to expert sales playbook
  - Tool: find_use_case_scenario(user_query) → get_products_by_ids()
  - Speed: Medium (300-500ms due to embedding + joins)

  2.3 Feature-by-Feature Comparison

  User Query: "Which chair has better lumbar support?" / "Compare materials"
  - Retrieval Method:
    a. SQL fetch specific products
    b. Join with product_features, product_materials, product_dimensions
    c. LLM synthesizes comparison from structured data
  - Why: Not in pre-computed comparisons, need dynamic assembly
  - Tool: compare_product_features(product_ids[], feature_categories[])
  - Speed: Fast (100-200ms, SQL joins)

  ---
  Category 3: Configuration & Pricing

  3.1 Build Custom Configuration

  User Query: "I want an Aeron Size B with adjustable arms and forward tilt"
  - Retrieval Method:
    a. SQL lookup variant by name
    b. SQL lookup addons by category and name
    c. Calculate total price (variant.base_price + sum(addons.addon_price))
  - Why: Transactional, needs exact pricing
  - Tool: build_configuration(product_id, variant_id, addon_ids[])
  - Speed: Very fast (<100ms)

  3.2 Pre-Built Configuration Recommendations

  User Query: "What's a good Aeron setup for developers?" / "Most popular Cosm configuration"
  - Retrieval Method:
    a. Semantic search on product_configurations.embedding
    b. Filter by popularity_rank
    c. Fetch full configuration with addons
  - Why: Pre-configured bundles with expert curation
  - Tool: search_configurations(query, product_id_filter, popularity_threshold)
  - Speed: Medium (200-300ms)

  ---
  Category 4: Dimensional & Physical Fit

  4.1 Size/Fit Recommendations

  User Query: "I'm 5'9" and 180 lbs, which size Aeron?" / "Will this fit in my small apartment?"
  - Retrieval Method:
    a. SQL query product_dimensions with variant filter
    b. Rule-based logic (height/weight → recommended size)
    c. Return dimensions for space planning
  - Why: Objective physical constraints
  - Tool: get_size_recommendation(product_id, user_height, user_weight) + get_dimensions(product_id, variant_id)
  - Speed: Very fast (<100ms)

  ---
  Category 5: Material, Color & Aesthetics

  5.1 Color/Finish Options

  User Query: "What colors does the Cosm come in?" / "Show me sustainable materials"
  - Retrieval Method: SQL query on product_colors and product_materials with filters
  - Why: Structured attributes, exact matches
  - Tool: get_product_colors(product_id) + get_product_materials(product_id, sustainable_only)
  - Speed: Very fast (<50ms)

  ---
  Category 6: Edge Cases & Support

  6.1 Out-of-Catalog Queries

  User Query: "Do you sell standing desks?" / "What about massage chairs?"
  - Retrieval Method:
    a. Semantic search across all products
    b. If no matches, return empty set
    c. LLM responds with "We specialize in Herman Miller chairs..."
  - Why: Graceful degradation
  - Tool: semantic_product_search(query) with confidence threshold
  - Speed: Medium (200-400ms)

  6.2 Warranty & Support

  User Query: "What's the warranty?" / "Can I return this?"
  - Retrieval Method:
    a. Check if query relates to specific product (NER/parsing)
    b. SQL fetch product details if applicable
    c. Return static policy info
  - Why: Policy-based, not product-specific (mostly)
  - Tool: get_product_details(product_id) + static knowledge
  - Speed: Fast (100-200ms)

  6.3 Competitive Comparison

  User Query: "How does Aeron compare to Steelcase Leap?" / "Is this better than a Secret Lab chair?"
  - Retrieval Method:
    a. Detect non-catalog product (Steelcase, Secret Lab)
    b. Fetch Herman Miller product
    c. Use comparison_frameworks if exists (e.g., gaming chair comparison in objection handlers)
    d. LLM synthesizes from general knowledge + our product strengths
  - Why: Competitors not in our database, need hybrid approach
  - Tool: get_product_by_name() + LLM reasoning with context
  - Speed: Medium (300-500ms)

  ---
  Retrieval Strategy Matrix

  | Scenario Type      | Primary Method    | Fallback         | Speed Priority | Accuracy Priority |
  |--------------------|-------------------|------------------|----------------|-------------------|
  | Browse/Filter      | SQL               | Semantic Search  | ★★★★★          | ★★★★☆             |
  | Price Search       | SQL               | None             | ★★★★★          | ★★★★★             |
  | Semantic Discovery | Vector Search     | SQL Filters      | ★★★☆☆          | ★★★★★             |
  | Direct Comparison  | Table Lookup      | Dynamic Assembly | ★★★★★          | ★★★★★             |
  | Scenario Match     | Vector Search     | SQL Browse       | ★★★☆☆          | ★★★★★             |
  | Configuration      | SQL + Calculation | Pre-built Search | ★★★★★          | ★★★★★             |
  | Fit/Dimensions     | SQL + Rules       | None             | ★★★★★          | ★★★★★             |
  | Color/Material     | SQL               | None             | ★★★★★          | ★★★★☆             |
  | Out-of-Catalog     | Vector Search     | Empty Set        | ★★★☆☆          | ★★★☆☆             |
  | Competitive        | Hybrid            | LLM Reasoning    | ★★★☆☆          | ★★★★☆             |

  ---
  Recommended Tool Architecture

  Tier 1: Fast Structured Queries (Target: <100ms)

  - search_products_by_price(min, max, optional_filters)
  - get_product_by_id(product_id)
  - get_product_variants(product_id)
  - get_product_addons(product_id, category_filter)
  - get_product_colors(product_id)
  - get_product_materials(product_id, sustainable_only)
  - get_product_dimensions(product_id, variant_id)
  - calculate_configuration_price(variant_id, addon_ids[])

  Tier 2: Semantic/Vector Queries (Target: 200-400ms)

  - semantic_product_search(query, max_results, optional_filters)
  - find_matching_use_case(user_query, max_results)
  - search_product_configurations(query, product_filter)
  - find_comparison_framework(product_ids[])

  Tier 3: Complex Multi-Step (Target: 400-800ms)

  - recommend_based_on_scenario(user_query)
    → find_matching_use_case() → get_products_by_ids() → enrich_with_details()

  - compare_products_detailed(product_ids[])
    → check_comparison_framework() OR dynamic_compare()

  - find_best_configuration(user_requirements{})
    → filter_products() → filter_variants() → suggest_addons()

  ---
  Context Engineering Strategies

  Strategy 1: Progressive Disclosure

  Start narrow, expand if needed:
  1. Try exact match (SQL)
  2. If no results → semantic search
  3. If still no results → widen filters
  4. If empty → suggest alternatives

  Strategy 2: Parallel Retrieval

  For rich responses, fetch in parallel:
  async def get_product_full_context(product_id):
      results = await asyncio.gather(
          get_product_details(product_id),
          get_product_features(product_id),
          get_product_variants(product_id),
          get_product_colors(product_id),
          find_use_cases_for_product(product_id)
      )
      return assemble_context(results)

  Strategy 3: Caching Layer

  - Cache comparison frameworks (rarely change)
  - Cache product details (change infrequently)
  - Fresh queries for pricing/availability

  Strategy 4: Confidence Thresholds

  if vector_search_confidence < 0.7:
      # Ask clarifying question
      return "Are you looking for X or Y?"
  elif 0.7 <= confidence < 0.85:
      # Return results + caveat
      return results + "Did you mean...?"
  else:
      # High confidence, return directly
      return results