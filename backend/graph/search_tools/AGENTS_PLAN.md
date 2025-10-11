Proposed Agent Architecture: "Sales Floor Model"

  Core Philosophy

  Like a retail sales floor: one expert salesperson (orchestrator) who knows when to grab product info, check
  inventory, or call in a specialist. Not a committee of agents deliberating.

  ---
  Architecture: 3-Agent System

  User Query
      ↓
  ┌─────────────────────────────────────┐
  │   ROUTER AGENT (50-100ms)          │ ← Classifies intent, selects strategy
  │   "What type of help does user need?"│
  └─────────────────────────────────────┘
      ↓
  ┌─────────────────────────────────────┐
  │   RETRIEVAL AGENT (200-500ms)      │ ← Executes tools in parallel
  │   "Get all relevant context"        │
  └─────────────────────────────────────┘
      ↓
  ┌─────────────────────────────────────┐
  │   SYNTHESIS AGENT (300-600ms)      │ ← Crafts response from context
  │   "Answer using sales frameworks"   │
  └─────────────────────────────────────┘
      ↓
  Response (Total: 550-1200ms)

  ---
  Agent 1: Router Agent

  Role: Intent classification & retrieval strategy selection
  Speed: 50-100ms (lightweight LLM or pattern
  matching)
  Input: User query + conversation context
  Output: Query intent + tool selection strategy

  Intent Categories:

  class QueryIntent(Enum):
      BROWSE = "browse"              # "Show me chairs under $1000"
      COMPARE = "compare"            # "Aeron vs Cosm"
      SCENARIO = "scenario"          # "I have back pain from coding"
      CONFIGURE = "configure"        # "I want Size B with arms"
      SPEC_LOOKUP = "spec_lookup"    # "What colors does Cosm come in?"
      CLARIFICATION = "clarification" # Ambiguous, needs more info

  Router Logic:

  def route_query(user_query: str, context: dict) -> RoutingDecision:
      """
      Fast classification using keyword patterns + lightweight LLM
      """

      # Pattern matching (fastest)
      if matches_price_pattern(user_query):
          return RoutingDecision(
              intent="browse",
              tools=["search_products_by_price"],
              strategy="sql_direct"
          )

      if matches_comparison_pattern(user_query):  # "vs", "compare", "difference"
          return RoutingDecision(
              intent="compare",
              tools=["find_comparison_framework", "get_product_details"],
              strategy="comparison_lookup"
          )

      # LLM classification (if patterns don't match)
      intent = classify_with_llm(user_query, context)

      # Map intent → retrieval strategy
      return build_routing_decision(intent, user_query, context)

  Key Design Choice: Use pattern matching first (instant), fall back to LLM only if needed. This keeps 80% of
  queries <50ms.

  ---
  Agent 2: Retrieval Agent

  Role: Execute tools in parallel, gather all relevant context
  Speed: 200-500ms (depends on tool tier)
  Input: Routing decision + user query
  Output: Structured context bundle

  Retrieval Strategies:

  Strategy A: SQL Direct (Browse/Filter queries)

  async def sql_direct_strategy(query_params):
      """Single fast SQL query"""
      results = await search_products_by_price(
          min_price=query_params.min,
          max_price=query_params.max
      )
      return {"products": results}

  Strategy B: Comparison Lookup (Compare queries)

  async def comparison_strategy(product_ids):
      """Parallel: framework + product details"""
      framework, product_a, product_b = await asyncio.gather(
          find_comparison_framework(product_ids),
          get_product_full_details(product_ids[0]),
          get_product_full_details(product_ids[1])
      )
      return {
          "comparison_framework": framework,
          "products": [product_a, product_b]
      }

  Strategy C: Scenario Match (Situational queries)

  async def scenario_strategy(user_query):
      """Semantic search → enrich with product data"""
      # Step 1: Find matching scenario (300ms)
      scenario = await find_matching_use_case(user_query)

      # Step 2: Parallel fetch product details (200ms)
      products = await asyncio.gather(*[
          get_product_full_details(pid)
          for pid in scenario.recommended_products
      ])

      return {
          "scenario": scenario,
          "products": products,
          "talking_points": scenario.talking_points,
          "objection_handlers": scenario.objection_handlers
      }

  Strategy D: Rich Context (Configuration/deep queries)

  async def rich_context_strategy(product_id):
      """Parallel fetch everything about a product"""
      context = await asyncio.gather(
          get_product_details(product_id),
          get_product_variants(product_id),
          get_product_addons(product_id),
          get_product_colors(product_id),
          get_product_materials(product_id),
          find_use_cases_for_product(product_id)
      )
      return assemble_product_context(context)

  Key Design Choice: Parallel execution wherever possible. Don't wait for one query to finish before starting the
  next.

  ---
  Agent 3: Synthesis Agent

  Role: Craft expert sales response from context
  Speed: 300-600ms (LLM generation)
  Input: Context bundle + user query + conversation history
  Output: Natural language response

  Response Modes:

  Mode 1: Direct Answer (Simple queries)

  User: "What colors does Cosm come in?"

  Context: {colors: ["Canyon", "Glacier", "Nightfall", "Carbon"...]}

  Response Template: "The Cosm Chair comes in [X] colors: [list].
  The [popular_color] is particularly popular for [reason]."

  Mode 2: Sales Narrative (Scenario queries)

  User: "I work from home and have back pain"

  Context: {
    scenario: "Remote Worker with Back Pain",
    recommended_products: [Aeron, Lino],
    talking_points: "...",
    objection_handlers: {...}
  }

  Response: Uses talking_points from scenario, anticipates price objection,
  explains cost-per-hour value, suggests Size B Aeron or Lino alternative

  Mode 3: Comparison Synthesis (Comparison queries)

  User: "Aeron vs Cosm for my home office?"

  Context: {
    comparison_framework: {...},
    user_context: {use_case: "home office", single_user: true}
  }

  Response: Extracts relevant differentiators from framework,
  emphasizes "single user" angle (Aeron advantage),
  uses decision_criteria to guide recommendation

  Synthesis Prompt Structure:

  synthesis_prompt = f"""
  You are an expert Herman Miller sales consultant. 

  User's Question: {user_query}

  Context Retrieved:
  {context_bundle}

  Conversation History:
  {conversation_summary}

  Instructions:
  1. Answer the user's question directly and completely
  2. Use the talking_points and objection_handlers if available
  3. If recommending products, explain WHY based on their situation
  4. Keep response conversational, not robotic
  5. If context is insufficient, ask ONE clarifying question

  Response:
  """

  Key Design Choice: Single LLM call with rich context. Don't do multiple back-and-forth synthesis iterations—that
  adds latency.

  ---
  Simplified Alternative: 2-Agent System

  If we want even faster, combine Router + Retrieval:

  User Query
      ↓
  ┌─────────────────────────────────────┐
  │   SMART RETRIEVAL AGENT (200-400ms)│ ← Routes + retrieves in one step
  │   "Classify intent, fetch context"  │
  └─────────────────────────────────────┘
      ↓
  ┌─────────────────────────────────────┐
  │   SYNTHESIS AGENT (300-600ms)      │ ← Same as above
  │   "Craft expert response"           │
  └─────────────────────────────────────┘
      ↓
  Response (Total: 500-1000ms)

  Trade-off: Slightly less separation of concerns, but saves 50-100ms by eliminating handoff.

  ---
  When to Add Complexity?

  Keep Simple (Start Here):

  - ✅ 3-agent system above
  - ✅ Pattern-based routing for common queries
  - ✅ Parallel retrieval strategies
  - ✅ Single synthesis pass

  Add Later (Only If Needed):

  - ❌ Multi-turn refinement loops (adds 500ms+ per iteration)
  - ❌ Separate "quality checker" agent (synthesis can self-validate)
  - ❌ Specialist agents per product (retrieval strategies handle this)
  - ⚠️ Confidence-based follow-up agent (only if >20% queries need clarification)

  ---
  Error Handling & Edge Cases

  Scenario: Ambiguous Query

  User: "I need a chair"

  Router → CLARIFICATION intent

  Retrieval → Fetch all products (for options)

  Synthesis → "I'd love to help! To recommend the best chair,
  could you tell me:
  1. What will you use it for? (work, gaming, executive office)
  2. What's your budget range?
  3. Any specific concerns? (back pain, space constraints, etc.)"

  Scenario: Out-of-Catalog

  User: "Do you sell standing desks?"

  Router → BROWSE intent (tries semantic search)

  Retrieval → semantic_product_search("standing desks") → empty results

  Synthesis → "We specialize in Herman Miller office chairs.
  However, if you're looking for ergonomic workspace solutions,
  our chairs pair beautifully with standing desks. Can I help you
  find the perfect chair?"

  Scenario: Tool Failure

  If vector search times out:
    → Fallback to SQL browse
  If SQL fails:
    → Return cached product list
  If LLM synthesis fails:
    → Template-based response with context

  ---
  Performance Budget

  | Agent     | Target | Max    | Fallback              |
  |-----------|--------|--------|-----------------------|
  | Router    | 50ms   | 100ms  | Pattern matching only |
  | Retrieval | 250ms  | 500ms  | Cache hit / SQL only  |
  | Synthesis | 400ms  | 600ms  | Template response     |
  | Total     | 700ms  | 1200ms | <1500ms hard limit    |

  User Experience Threshold: <1 second feels instant, 1-2 seconds acceptable, >2 seconds feels slow.

  ---
  Implementation Phases

  Phase 1: MVP (Week 1)

  - Router with pattern matching + simple LLM classification
  - Retrieval agent with Strategies A & B (SQL + Comparison)
  - Synthesis agent with basic prompt template
  - Test with 10 common query types

  Phase 2: Semantic Layer (Week 2)

  - Add Strategy C (Scenario matching)
  - Implement vector search tools
  - Add parallel retrieval optimization
  - Test with 25 query types

  Phase 3: Optimization (Week 3)

  - Add caching layer
  - Optimize LLM prompts for speed
  - Add confidence thresholds
  - Load testing & latency profiling

  ---
  Why This Design?

  1. Speed: Single path through system, parallel where possible, pattern matching shortcuts
  2. Simplicity: 3 clear roles, no circular dependencies, linear flow
  3. Extensibility: Easy to add new retrieval strategies without touching routing or synthesis
  4. Debuggability: Can inspect routing decision, context bundle, and synthesis separately
  5. Failure Modes: Each layer has fallbacks, degrades gracefully

  Bottom Line: This is like a solo expert salesperson with a really good database at their fingertips. Not a
  committee, not over-engineered. Fast, focused, effective.