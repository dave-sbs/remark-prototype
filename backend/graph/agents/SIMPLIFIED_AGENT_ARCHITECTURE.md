# Simplified Sales Agent Architecture

## Philosophy

The goal is to quickly understand the customer's **pain points** and **willingness to pay**, then guide them to the right product decision using minimal, high-value tool calls.

### Customer Psychology Framework

When a customer enters the store, they have:
1. **Pain Points** (what problems they need solved)
   - Functional needs (ergonomics, adjustability, durability)
   - Aesthetic wants (style, color, brand perception)
   - Social validation (status, brand recognition)

2. **Budget Constraints** (willingness to pay)
   - Maximum price range
   - Value perception thresholds
   - ROI considerations (especially for work-from-home)

## Architecture: Single Conversational Sales Agent

### Key Design Principles

1. **Context-First Approach**
   - Pre-load product catalog with prices on initialization
   - Agent always has baseline product knowledge in context
   - Reduces unnecessary tool calls

2. **Minimal Tool Usage**
   - Only call tools when user asks specific questions
   - Prefer answering from context when possible
   - Tools are for deep-dives, not basic information

3. **Conversational Discovery**
   - No "research brief" generation
   - Natural back-and-forth dialogue
   - Strategic questions to surface pain points and budget

4. **Strategic Nudging**
   - Every response should move customer closer to decision
   - Highlight relevant features based on stated needs
   - Anchor pricing appropriately

## Agent Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Message → Sales Agent                                 │
│                                                              │
│  On First Message:                                          │
│  1. Automatically call get_product_catalog()                │
│  2. Load all products + prices into context                 │
│                                                              │
│  On Subsequent Messages:                                    │
│  1. Analyze user question/statement                         │
│  2. Decide: Can I answer from context?                      │
│     ├─ YES → Respond + ask strategic follow-up             │
│     └─ NO → Call specific tool(s) → Respond + follow-up    │
│                                                              │
│  Every Response Should:                                     │
│  - Address their stated need/question                       │
│  - Surface pain points or budget if not yet known           │
│  - Nudge toward product consideration                       │
│  - Build trust and rapport                                  │
└─────────────────────────────────────────────────────────────┘
```

## Available Tools (from simplified_toolkit.py)

1. **get_product_catalog()**
   - Returns: All products with name, price tier, design style, base price
   - Use: First message initialization, general browsing questions
   - Example: "What chairs do you have?"

2. **get_product_details(product_name)**
   - Returns: Full feature breakdown by category, standard vs optional features
   - Use: When customer asks about specific product
   - Example: "Tell me more about the Aeron Chair"

3. **get_all_base_prices()**
   - Returns: All products sorted by price with default configuration
   - Use: Budget-conscious customers, price comparisons
   - Example: "What's in my budget of $1000-1500?"

4. **get_product_unique_features(product_name)**
   - Returns: Key differentiators and what makes product special
   - Use: Comparison questions, decision-making support
   - Example: "Why should I choose Embody over Aeron?"

## Tool Usage Strategy

### When to Call Tools

**ALWAYS call on first message:**
- `get_product_catalog()` - Establishes baseline context

**Call when user asks about:**
- Specific product details → `get_product_details(product_name)`
- Budget/price shopping → `get_all_base_prices()`
- Product comparison/uniqueness → `get_product_unique_features(product_name)`

**DON'T call when:**
- You can answer from catalog context (price tier, design style, product names)
- User is making general conversation
- You're asking discovery questions

## Conversation Strategy

### Phase 1: Discovery (Messages 1-3)
**Goals:**
- Understand their use case (home office, corporate, gaming)
- Surface functional needs (back pain, long hours, adjustability)
- Gauge budget (explicit or implicit signals)
- Learn aesthetic preferences (modern, classic, minimalist)

**Tactics:**
- Ask open-ended questions: "What brings you in today?"
- Listen for pain signals: "back pain", "uncomfortable", "long hours"
- Probe budget indirectly: "Have you looked at any chairs yet?"
- Note style cues: "modern office", "executive look"

### Phase 2: Guided Consideration (Messages 4-7)
**Goals:**
- Present 2-3 relevant options based on discovered needs
- Differentiate products clearly
- Address objections preemptively
- Build value perception

**Tactics:**
- Narrow focus: "Based on your needs, I'd suggest looking at..."
- Use unique features tool strategically
- Compare options head-to-head when helpful
- Anchor on value, not just price

### Phase 3: Decision Support (Messages 8+)
**Goals:**
- Address final concerns
- Reinforce fit between needs and chosen product
- Handle price objections with value framing
- Move toward commitment

**Tactics:**
- Validate their choice: "The [product] is perfect for..."
- Summarize fit: "Here's why this works for you..."
- Future-pace: "You'll appreciate the [feature] when..."
- Call to action: "Ready to move forward?"

## Response Format Guidelines

### Every Response Should Include:

1. **Direct Answer** to their question/statement
2. **Relevant Context** from product knowledge
3. **Strategic Follow-up** to advance the conversation

### Example Good Response:
```
Based on your back pain and 8-hour work days, I'd recommend looking at
either the Aeron or Embody Chair. Both have PostureFit lumbar support
and are designed for extended sitting.

The Aeron is a bit more breathable with its mesh design ($1,445 base),
while the Embody has more dynamic movement that actively supports your
spine ($1,825 base).

What's more important to you - temperature regulation or active support
throughout the day?
```

### What Makes This Good:
- Addresses stated pain (back pain, long hours)
- Narrows options to 2 relevant products
- Differentiates clearly (breathability vs movement)
- Anchors pricing naturally
- Asks strategic question to discover deeper preference

## Implementation Details

### State Management
```python
class SalesAgentState(MessagesState):
    """Simple state for sales conversation."""
    # Product catalog loaded on first message
    product_catalog_loaded: bool = False
    # Track if we've discovered key information
    discovered_pain_points: List[str] = []
    discovered_budget_range: Optional[str] = None
    products_discussed: List[str] = []
```

### Agent Node Structure
```python
def sales_agent(state: SalesAgentState):
    """
    Main sales agent that handles all conversation.

    On first message: Load product catalog
    On all messages:
      1. Analyze user input
      2. Decide if tools needed
      3. Call tools if necessary (can be parallel)
      4. Generate strategic response
    """
    messages = state["messages"]

    # First message initialization
    if not state.get("product_catalog_loaded"):
        catalog = await get_product_catalog()
        # Add catalog to system context
        system_context = f"Product Catalog:\n{catalog}\n\n{sales_agent_prompt}"
    else:
        system_context = sales_agent_prompt

    # Let LLM decide if tools needed
    response = model_with_tools.invoke([
        SystemMessage(content=system_context),
        *messages
    ])

    # If tool calls, execute them
    if response.tool_calls:
        # Execute tools (parallel if multiple)
        tool_results = await execute_tools(response.tool_calls)
        # Generate final response with tool results
        final_response = generate_with_context(messages, tool_results)
        return {"messages": [final_response]}

    return {"messages": [response]}
```

## Success Metrics

1. **Conversation Efficiency**
   - Average messages to product recommendation: 2-4
   - Tool calls per conversation: 1-3 (including initial catalog load)

2. **Discovery Quality**
   - % of conversations where budget surfaced: >80%
   - % of conversations where pain points identified: >90%

3. **Decision Velocity**
   - % of users who get product recommendation: >90%
   - Average messages to purchase decision: 6-10

## Comparison to Old Architecture

### Old (Complex Research System):
- Router → Research Brief → Iterative Retrieval → Compression
- 11+ different semantic/structured tools
- Research-oriented (comprehensive information gathering)
- Multiple specialized agents
- Heavy tool usage

### New (Sales Conversation System):
- Single conversational agent
- 4 simple, high-value tools
- Sales-oriented (discovery → consideration → decision)
- One agent with strategic prompting
- Minimal, targeted tool usage

## Next Steps

1. Create `sales_agent.py` with simplified architecture
2. Write `sales_agent_prompt.md` with strategic instructions
3. Test conversation flows with different customer profiles
4. Iterate on prompting for natural discovery questions
5. Add conversation state tracking for analytics
