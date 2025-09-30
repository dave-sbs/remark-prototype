# Knowledge Hub Dataset Guide

## Overview
This guide explains the expert sales knowledge captured in `use_case_scenarios.json` and `comparison_frameworks.json`. These datasets represent the mental models and playbooks an expert Herman Miller salesperson would use.

## Core Customer Touchpoints Identified

### 1. Individual Remote Worker (Health-Focused)
**Trigger Signals:**
- Mentions back pain, discomfort, or posture
- Works from home 8+ hours daily
- First-time premium chair buyer
- Health-conscious but price-sensitive

**Expert Approach:**
- Lead with health ROI (cost per hour of use)
- Emphasize lumbar support specifics (PostureFit SL)
- Address "is it worth it?" objection proactively
- Recommend trial periods to reduce risk
- Compare to medical costs (physical therapy)

### 2. Corporate Facilities Manager (Bulk Purchase)
**Trigger Signals:**
- Mentions "office," "employees," "team"
- Budget discussions involve multiple stakeholders
- Asks about warranty, durability, maintenance
- Concerned with aesthetics and company culture

**Expert Approach:**
- Frame as dual investment (wellbeing + brand)
- Offer phased rollout to manage budget
- Highlight auto-adjust features for diverse workforce
- Provide ROI data (retention, sick days)
- Suggest mixed configurations for different use cases

## Comparison Framework Philosophy

### Aeron vs Cosm Comparison
**Decision Tree:**
1. **Single user or shared?** → Single = Aeron bias, Shared = Cosm bias
2. **Adjustment preference?** → Control freak = Aeron, Simplicity = Cosm
3. **Aesthetic priority?** → Tech/industrial = Aeron, Modern/sculptural = Cosm
4. **Budget?** → Unlimited = Aeron, Value-conscious = Cosm

**Key Insight:** Don't position as "better vs worse" - position as different philosophies (manual precision vs automatic intelligence)

### Aeron vs Lino Comparison
**Decision Tree:**
1. **Budget?** → <$1000 = Lino, >$1500 = Aeron, $1000-1500 = deeper discovery
2. **Space?** → Compact = Lino, Generous = Either
3. **Experience level?** → First timer = Lino, Ergonomics enthusiast = Aeron
4. **Body type?** → Very small/large = Aeron sizing, Average = Lino works

**Key Insight:** Lino is not a "budget compromise" - it's Herman Miller quality made accessible. Don't apologize for recommending it.

## Objection Handling Patterns

### Price Objections
**Techniques:**
1. **Cost-per-use calculation** - "$1,700 ÷ 12 years ÷ 2,000 hours = $0.07/hour"
2. **Comparison to alternatives** - Physical therapy, multiple cheap chairs over time
3. **Health ROI** - Reduced pain, better focus, fewer sick days
4. **Resale value** - Aeron holds $400-800 value after 10 years

### "Need to Try First" Objection
**Techniques:**
1. **Validate the concern** - "That's smart, this is a significant investment"
2. **Offer trial period** - 30-day returns through dealers
3. **Provide size guidance** - 95% of people fit Size B
4. **Set expectations** - "Your body needs 3-5 days to adjust to proper support"

### Comparison to Gaming Chairs
**Techniques:**
1. **Purpose distinction** - Gaming = aesthetics, Office = health
2. **Material science** - Suspension vs compressing foam
3. **Longevity data** - Gaming chairs 2-3 years, Herman Miller 12-20 years
4. **Target problem** - Gaming chairs don't address postural root causes

## Success Metrics for Each Scenario

### Remote Worker Success
- Pain reduction within 2-4 weeks
- Increased work session length without discomfort
- Better posture awareness
- Reports improved productivity/focus

### Corporate Purchase Success
- Reduced employee complaints within 30 days
- Positive satisfaction survey results
- Fewer maintenance requests
- Successful aesthetic integration
- On-time, on-budget delivery

## Data Structure Notes

### use_case_scenarios.json
- `recommended_products` - Array of product UUIDs (currently using hardcoded IDs)
- `user_profile` - JSONB allows flexible attribute storage
- `objection_handlers` - JSONB maps objection type to response script
- `budget_range` - JSONB includes min/max/flexibility/notes
- `embedding` - Will be generated for semantic search

### comparison_frameworks.json
- `products_compared` - Array of 2-3 product UUIDs being compared
- `key_differentiators` - JSONB with nested structure for rich comparison data
- `decision_criteria` - Array of strings representing decision factors
- `embedding` - Will be generated for semantic search

## Future Scenarios to Add

**Additional Customer Touchpoints:**
1. **Creative Professional** (Design studio, aesthetics-first)
2. **Medical Condition User** (Specific orthopedic needs, doctor recommendation)
3. **Budget-Constrained Student** (Wants HM quality, limited budget)
4. **Hybrid Worker** (Splitting time between office and home)
5. **Executive Purchase** (Signaling status, no price sensitivity)

**Additional Comparisons:**
1. **Cosm vs Lino** (Auto-adjust vs manual at similar price points)
2. **Aeron vs Eames Aluminum** (Ergonomic vs executive aesthetic)
3. **All Four Chairs** (Complete decision matrix)
4. **Herman Miller vs Generic Ergonomic** (Why pay premium?)

## Integration with Agent System

**How the agent should use this data:**

1. **Intent Classification** → Match user query to scenario via embedding similarity
2. **Product Recommendation** → Use `recommended_products` as starting suggestions
3. **Conversation Flow** → Follow `talking_points` structure for natural progression
4. **Objection Detection** → Monitor for objection patterns, deploy `objection_handlers`
5. **Comparison Requests** → Fetch relevant comparison_framework, present key differentiators
6. **Success Tracking** → Log interactions against `success_metrics` for learning

**Example Agent Flow:**
```
User: "I've been having back pain working from home"
→ Semantic search finds "Remote Worker with Back Pain" scenario
→ Agent identifies: first-time buyer, health concern, price-sensitive likely
→ Agent uses talking_points to explain Aeron PostureFit SL benefits
→ Agent anticipates price objection, preemptively frames value
→ If user asks "What about Lino?", fetch Aeron vs Lino comparison
→ Present key differentiators focusing on price_positioning and adjustment_options
```