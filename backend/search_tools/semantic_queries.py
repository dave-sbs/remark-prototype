"""
Semantic search functions for product catalog using embeddings.
These leverage vector similarity for natural language queries.
Target latency: 200-400ms
"""

import asyncio
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from langchain_core.tools import tool, InjectedToolArg
from typing_extensions import Annotated

from supabase import create_client, Client
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

from structured_queries import (
    get_product_by_name,
    get_product_by_id,
    get_product_variants,
    get_product_addons,
    get_product_colors,
    get_product_materials
)

load_dotenv()

# Initialize clients
SUPABASE_URL = os.getenv("SUPABASE_LOCAL_URL")
SUPABASE_KEY = os.getenv("SUPABASE_LOCAL_PUBLISHABLE")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Embedding model configuration
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSION = 1536


# ============================================================================
# Response Models
# ============================================================================

class SemanticSearchResult(BaseModel):
    """Result from semantic product search."""
    product_id: str
    product_name: str
    chunk_text: Optional[str] = None
    similarity: float
    price_tier: Optional[str] = None
    design_style: Optional[str] = None


class UseCaseMatch(BaseModel):
    """Matched use case scenario with recommendations."""
    scenario_id: str
    scenario_name: str
    description: str
    similarity: float
    recommended_products: List[str]
    reasoning: Optional[str] = None


class ConfigurationMatch(BaseModel):
    """Matched product configuration."""
    config_id: str
    product_id: str
    product_name: str
    variant_name: str
    addons: List[str]
    total_price: float
    similarity: float
    popularity_rank: Optional[int] = None


class ComparisonFramework(BaseModel):
    """Pre-computed comparison framework between products."""
    framework_id: str
    products_compared: List[str]
    comparison_context: str
    key_differentiators: Dict[str, Any]
    decision_criteria: List[str]


class AddonMatch(BaseModel):
    """Matched product addon from semantic search."""
    addon_id: str
    product_id: str
    product_name: str
    addon_category: str
    addon_name: str
    addon_price: float
    similarity: float
    is_default: bool


# ============================================================================
# Embedding Utilities
# ============================================================================

async def generate_embedding(text: str) -> List[float]:
    """Generate embedding for a single text query."""
    response = await openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text
    )
    return response.data[0].embedding


async def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for multiple texts in parallel."""
    response = await openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts
    )
    return [item.embedding for item in response.data]


# ============================================================================
# Async Supabase RPC Wrapper
# ============================================================================

async def async_supabase_rpc(function_name: str, params: Dict[str, Any]):
    """Execute Supabase RPC function asynchronously."""
    # Note: supabase-py doesn't have native async support yet
    # This runs in thread pool to avoid blocking
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        lambda: supabase.rpc(function_name, params).execute()
    )


# ============================================================================
# Core Semantic Search Functions
# ============================================================================

async def semantic_product_search_internal(
    query: str,
    max_results: int = 10,
    min_similarity: float = 0.7,
    price_tier: Optional[str] = None,
    design_style: Optional[str] = None
) -> List[SemanticSearchResult]:
    """
    Perform semantic search on product features.
    Uses vector similarity search on product_features table.
    Direct wrapper for semantic_search_product_features RPC - no redundant aggregation.

    Args:
        query: Natural language search query
        max_results: Maximum number of results to return
        min_similarity: Minimum similarity threshold (0-1)
        price_tier: Optional filter by price tier
        design_style: Optional filter by design style

    Returns:
        List of semantic search results with similarity scores
    """
    # Generate query embedding
    query_embedding = await generate_embedding(query)

    # Build RPC parameters
    rpc_params = {
        "query_embedding": query_embedding,
        "match_count": max_results,
        "min_similarity": min_similarity
    }

    if price_tier:
        rpc_params["filter_price_tier"] = price_tier
    if design_style:
        rpc_params["filter_design_style"] = design_style

    # Execute semantic search RPC on product_features
    result = await async_supabase_rpc("semantic_search_product_features", rpc_params)

    if not result.data:
        return []

    # Direct mapping - SQL function already handles joins and filtering
    return [
        SemanticSearchResult(
            product_id=row["product_id"],
            product_name=row["product_name"],
            chunk_text=f"{row['feature_name']}: {row.get('feature_description', '')}",
            similarity=row["similarity"],
            price_tier=row.get("price_tier"),
            design_style=row.get("design_style")
        )
        for row in result.data
    ]


async def find_use_case_scenarios(
    user_query: str,
    max_results: int = 5,
    min_similarity: float = 0.75
) -> List[UseCaseMatch]:
    """
    Match user query to pre-defined use case scenarios.
    Maps user situations to expert sales playbooks.

    Args:
        user_query: User's description of their needs/situation
        max_results: Maximum number of scenarios to return
        min_similarity: Minimum similarity threshold

    Returns:
        List of matched use cases with product recommendations
    """
    # Generate query embedding
    query_embedding = await generate_embedding(user_query)

    # Search use case scenarios
    result = await async_supabase_rpc(
        "search_use_case_scenarios",
        {
            "query_embedding": query_embedding,
            "match_count": max_results,
            "min_similarity": min_similarity
        }
    )

    if not result.data:
        return []

    return [
        UseCaseMatch(
            scenario_id=row.get("scenario_id"),
            scenario_name=row.get("scenario_name"),
            description=row.get("description"),
            similarity=row.get("similarity"),
            recommended_products=row.get("recommended_products", []),
            reasoning=row.get("reasoning")
        )
        for row in result.data
    ]


async def search_product_configurations(
    query: str,
    product_id: Optional[str] = None,
    min_popularity: Optional[int] = None,
    max_results: int = 10
) -> List[ConfigurationMatch]:
    """
    Search for pre-built product configurations using semantic search.
    Useful for finding popular setups or recommendations.

    Args:
        query: Description of desired configuration
        product_id: Optional filter by specific product
        min_popularity: Optional minimum popularity rank
        max_results: Maximum number of configurations to return

    Returns:
        List of matched configurations with pricing
    """
    # Generate query embedding
    query_embedding = await generate_embedding(query)

    # Build RPC parameters
    rpc_params = {
        "query_embedding": query_embedding,
        "match_count": max_results
    }

    if product_id:
        rpc_params["filter_product_id"] = product_id
    if min_popularity:
        rpc_params["min_popularity_rank"] = min_popularity

    # Search configurations
    result = await async_supabase_rpc("search_product_configurations", rpc_params)

    if not result.data:
        return []

    return [
        ConfigurationMatch(
            config_id=row.get("config_id"),
            product_id=row.get("product_id"),
            product_name=row.get("product_name"),
            variant_name=row.get("variant_name"),
            addons=row.get("addons", []),
            total_price=row.get("total_price"),
            similarity=row.get("similarity"),
            popularity_rank=row.get("popularity_rank")
        )
        for row in result.data
    ]


async def search_product_addons_semantic(
    query: str,
    product_id: Optional[str] = None,
    max_results: int = 10,
    min_similarity: float = 0.7
) -> List[AddonMatch]:
    """
    Search product addons using semantic similarity.
    Uses search_product_addons RPC function.

    Args:
        query: Natural language description of desired addon/accessory
        product_id: Optional filter by specific product
        max_results: Maximum number of addons to return
        min_similarity: Minimum similarity threshold

    Returns:
        List of matched addons with similarity scores
    """
    # Generate query embedding
    query_embedding = await generate_embedding(query)

    # Build RPC parameters
    rpc_params = {
        "query_embedding": query_embedding,
        "match_count": max_results,
        "min_similarity": min_similarity
    }

    if product_id:
        rpc_params["filter_product_id"] = product_id

    # Execute semantic search RPC
    result = await async_supabase_rpc("search_product_addons", rpc_params)

    if not result.data:
        return []

    return [
        AddonMatch(
            addon_id=row["addon_id"],
            product_id=row["product_id"],
            product_name=row["product_name"],
            addon_category=row["addon_category"],
            addon_name=row["addon_name"],
            addon_price=row["addon_price"],
            similarity=row["similarity"],
            is_default=row["is_default"]
        )
        for row in result.data
    ]


async def search_comparison_frameworks_semantic(
    query: str,
    max_results: int = 5,
    min_similarity: float = 0.7
) -> List[ComparisonFramework]:
    """
    Search comparison frameworks using semantic similarity.
    Uses search_comparison_frameworks RPC function.

    Args:
        query: Description of comparison scenario or products
        max_results: Maximum number of frameworks to return
        min_similarity: Minimum similarity threshold

    Returns:
        List of matched comparison frameworks
    """
    # Generate query embedding
    query_embedding = await generate_embedding(query)

    # Execute semantic search RPC
    result = await async_supabase_rpc(
        "search_comparison_frameworks",
        {
            "query_embedding": query_embedding,
            "match_count": max_results,
            "min_similarity": min_similarity
        }
    )

    if not result.data:
        return []

    return [
        ComparisonFramework(
            framework_id=row["framework_id"],
            products_compared=row["products_compared"],
            comparison_context=row["comparison_context"],
            key_differentiators=row["key_differentiators"],
            decision_criteria=row["decision_criteria"]
        )
        for row in result.data
    ]


async def find_comparison_framework(
    product_ids: List[str]
) -> Optional[ComparisonFramework]:
    """
    Find pre-computed comparison framework for specific products by exact product ID match.
    Returns expert-curated product comparisons if they exist.

    Args:
        product_ids: List of product IDs to compare (order doesn't matter)

    Returns:
        Comparison framework if it exists, None otherwise
    """
    # Sort product IDs for consistent lookup
    sorted_ids = sorted(product_ids)

    # Query comparison frameworks table
    result = supabase.table("comparison_frameworks").select("*").contains(
        "products_compared", sorted_ids
    ).execute()

    if not result.data:
        return None

    # Return first matching framework
    row = result.data[0]

    return ComparisonFramework(
        framework_id=row.get("id"),
        products_compared=row.get("products_compared"),
        comparison_context=row.get("comparison_context"),
        key_differentiators=row.get("key_differentiators"),
        decision_criteria=row.get("decision_criteria"),
    )


# ============================================================================
# Strategy-Based Retrieval Functions (Aligned with AGENTS_PLAN.md)
# ============================================================================

async def get_product_full_details(product_id: str) -> Dict[str, Any]:
    """
    Strategy D: Rich Context - Parallel fetch everything about a product.
    Target latency: 200-300ms with parallel execution.

    Args:
        product_id: Product UUID

    Returns:
        Complete product context bundle
    """
    results = await asyncio.gather(
        get_product_by_id(product_id),
        get_product_variants(product_id),
        get_product_addons(product_id),
        get_product_colors(product_id),
        get_product_materials(product_id),
        return_exceptions=True  # Don't fail if one query fails
    )

    return {
        "product": results[0] if not isinstance(results[0], Exception) else None,
        "variants": results[1] if not isinstance(results[1], Exception) else [],
        "addons": results[2] if not isinstance(results[2], Exception) else [],
        "colors": results[3] if not isinstance(results[3], Exception) else [],
        "materials": results[4] if not isinstance(results[4], Exception) else []
    }


async def strategy_comparison_lookup(product_names: List[str]) -> Dict[str, Any]:
    """
    Strategy B: Comparison Lookup - Parallel framework + product details.
    Target latency: 200-400ms with parallel execution.

    Args:
        product_names: List of product names to compare

    Returns:
        Comparison framework and detailed product information
    """
    # Get product objects first
    products = await asyncio.gather(*[
        get_product_by_name(name) for name in product_names
    ])

    # Filter out None results
    valid_products = [p for p in products if p is not None]
    if len(valid_products) < 2:
        return {
            "comparison_framework": None,
            "products": valid_products,
            "error": "Need at least 2 valid products for comparison"
        }

    product_ids = [p.id for p in valid_products]

    # Parallel fetch: framework + full details for each product
    framework_task = find_comparison_framework(product_ids)
    details_tasks = [get_product_full_details(pid) for pid in product_ids]

    results = await asyncio.gather(framework_task, *details_tasks)

    return {
        "comparison_framework": results[0],
        "products": results[1:]
    }


async def strategy_scenario_match(user_query: str) -> Dict[str, Any]:
    """
    Strategy C: Scenario Match - Semantic search → enrich with product data.
    Target latency: 300-500ms (embedding + search + parallel product fetch).

    Args:
        user_query: User's description of their situation/needs

    Returns:
        Matched scenario with enriched product details
    """
    # Step 1: Find matching scenarios (includes embedding generation)
    scenarios = await find_use_case_scenarios(user_query, max_results=3)

    if not scenarios:
        return {
            "scenario": None,
            "products": [],
            "alternatives": []
        }

    top_scenario = scenarios[0]

    # Step 2: Parallel fetch product details for recommended products
    product_tasks = [
        get_product_by_id(pid) for pid in top_scenario.recommended_products[:5]
    ]
    products = await asyncio.gather(*product_tasks, return_exceptions=True)

    # Filter out failed fetches
    valid_products = [p for p in products if p is not None and not isinstance(p, Exception)]

    return {
        "scenario": top_scenario,
        "products": valid_products,
        "alternatives": scenarios[1:],
        "talking_points": top_scenario.description,
        "reasoning": top_scenario.reasoning
    }


async def strategy_rich_configuration_search(
    query: str,
    product_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Enhanced configuration search with product context.
    Target latency: 250-400ms.

    Args:
        query: Description of desired configuration
        product_name: Optional product name filter

    Returns:
        Configurations with full product details
    """
    # Get product_id if product name provided
    product_id = None
    if product_name:
        product = await get_product_by_name(product_name)
        if product:
            product_id = product.id

    # Search configurations
    configurations = await search_product_configurations(
        query=query,
        product_id=product_id,
        max_results=5
    )

    if not configurations:
        return {
            "configurations": [],
            "products": []
        }

    # Get unique product IDs from configurations
    unique_product_ids = list(set(config.product_id for config in configurations))

    # Parallel fetch product details
    product_details = await asyncio.gather(*[
        get_product_by_id(pid) for pid in unique_product_ids
    ], return_exceptions=True)

    # Map products by ID for easy lookup
    products_map = {
        p.id: p for p in product_details
        if p is not None and not isinstance(p, Exception)
    }

    return {
        "configurations": configurations,
        "products_map": products_map
    }


async def multi_query_semantic_search(
    queries: List[str],
    max_results_per_query: int = 5,
    deduplicate: bool = True
) -> List[SemanticSearchResult]:
    """
    Perform semantic search with multiple query variations in parallel.
    Useful for expanding search coverage.

    Args:
        queries: List of query variations
        max_results_per_query: Max results per individual query
        deduplicate: Whether to deduplicate by product_id

    Returns:
        Combined and optionally deduplicated results
    """
    # Generate embeddings in parallel
    embeddings = await generate_embeddings_batch(queries)

    # Prepare parallel searches with concurrency control
    semaphore = asyncio.Semaphore(8)  # Limit concurrent requests

    async def search_single(embedding):
        async with semaphore:
            result = await async_supabase_rpc(
                "semantic_search_product_features",
                {
                    "query_embedding": embedding,
                    "match_count": max_results_per_query,
                    "min_similarity": 0.7
                }
            )
            return result.data or []

    # Execute searches in parallel
    results_lists = await asyncio.gather(
        *(search_single(emb) for emb in embeddings)
    )

    # Flatten results
    all_results = []
    for results in results_lists:
        all_results.extend(results)

    # Deduplicate by product_id if requested, keeping highest similarity
    if deduplicate:
        unique_products = {}
        for row in all_results:
            product_id = row.get("product_id")
            if product_id not in unique_products or row.get("similarity", 0) > unique_products[product_id].get("similarity", 0):
                unique_products[product_id] = row
        all_results = list(unique_products.values())

    # Convert to models
    return [
        SemanticSearchResult(
            product_id=row.get("product_id"),
            product_name=row.get("product_name"),
            chunk_text=row.get("chunk_text"),
            similarity=row.get("similarity"),
            price_tier=row.get("price_tier"),
            design_style=row.get("design_style")
        )
        for row in all_results
    ]


# ============================================================================
# LangChain Tool Wrappers (Agent Interface)
# ============================================================================

@tool(parse_docstring=True)
def semantic_product_search(
    query: str,
    max_results: Annotated[int, InjectedToolArg] = 10,
    price_tier: Annotated[Optional[str], InjectedToolArg] = None
) -> str:
    """Search products using natural language with vector similarity.

    **When to use:**
    - User describes needs vaguely or qualitatively ("comfortable", "modern", "for back pain")
    - Need semantic understanding of features, not just exact matches
    - User mentions use case, pain points, or desired qualities

    **Don't use if:**
    - User specifies exact price range (use search_products_by_price from structured_queries)
    - User asks for specific product by name (use get_product_details from structured_queries)
    - User wants to compare specific products (use compare_products_with_framework)

    **Examples:**
    - "comfortable chair for long coding sessions" ✓
    - "something modern and ergonomic" ✓
    - "chairs under $1000" ✗ (use search_products_by_price)

    Args:
        query: Natural language description of what the user is looking for
        max_results: Maximum number of products to return (default 10)
        price_tier: Optional filter by price tier ('budget', 'mid-range', 'premium', 'luxury')

    Returns:
        Formatted string with semantically matched products and relevance scores
    """
    results = asyncio.run(
        semantic_product_search_internal(
            query=query,
            max_results=max_results,
            price_tier=price_tier
        )
    )

    if not results:
        return f"No products found matching '{query}'. Try broader search terms or different criteria."

    # Format output
    output = f"**Products matching: '{query}'**\n\n"

    for i, result in enumerate(results, 1):
        confidence = "High" if result.similarity > 0.85 else "Medium" if result.similarity > 0.75 else "Good"
        output += f"{i}. **{result.product_name}** (Match: {confidence})\n"

        if result.price_tier:
            output += f"   Price Tier: {result.price_tier}\n"
        if result.design_style:
            output += f"   Style: {result.design_style}\n"
        if result.chunk_text:
            # Show snippet of relevant description
            snippet = result.chunk_text[:150] + "..." if len(result.chunk_text) > 150 else result.chunk_text
            output += f"   {snippet}\n"
        output += "\n"

    return output


@tool(parse_docstring=True)
def find_best_use_case(
    user_situation: str,
    max_scenarios: Annotated[int, InjectedToolArg] = 3
) -> str:
    """Match user's situation to expert sales scenarios and recommendations.

    **When to use:**
    - User describes their work environment, daily routine, or lifestyle
    - User mentions health concerns (back pain, posture issues, ergonomics)
    - User explains their role or typical usage pattern
    - Need expert sales talking points and objection handlers

    **Don't use if:**
    - User already knows which product they want (use get_product_details)
    - User is just browsing by price (use search_products_by_price)

    **Examples:**
    - "I work from home with back pain" ✓
    - "setting up an executive office" ✓
    - "need chair for 12-hour coding sessions" ✓
    - "show me all chairs" ✗ (use list_all_products)

    **What you get:**
    - Matched use case scenarios with similarity scores
    - Product recommendations tailored to the situation
    - Sales talking points and reasoning
    - Objection handlers for common concerns

    Args:
        user_situation: Description of user's needs, environment, or situation
        max_scenarios: Maximum number of scenario matches to return

    Returns:
        Formatted string with matched scenarios and product recommendations
    """
    scenarios = asyncio.run(
        find_use_case_scenarios(
            user_query=user_situation,
            max_results=max_scenarios
        )
    )

    if not scenarios:
        return f"No specific scenarios found for '{user_situation}'. Let me help you find products another way."

    # Format output
    output = f"**Recommended scenarios for your situation:**\n\n"

    for i, scenario in enumerate(scenarios, 1):
        confidence = "Excellent" if scenario.similarity > 0.85 else "Good" if scenario.similarity > 0.75 else "Fair"
        output += f"{i}. **{scenario.scenario_name}** (Match: {confidence})\n"
        output += f"   {scenario.description}\n\n"

        if scenario.recommended_products:
            output += f"   Recommended products:\n"
            for product in scenario.recommended_products[:3]:  # Limit to top 3
                output += f"   - {product}\n"

        if scenario.reasoning:
            output += f"   Why: {scenario.reasoning}\n"

        output += "\n"

    return output


@tool(parse_docstring=True)
def find_popular_configuration(
    configuration_description: str,
    product_name: Optional[str] = None
) -> str:
    """Find pre-built popular product configurations using semantic search.

    **When to use:**
    - User asks for recommended setups or popular configurations
    - User wants to see typical builds or common combinations
    - User describes desired features and wants pre-packaged options
    - Need to suggest complete configurations with add-ons

    **Don't use if:**
    - User wants to build custom configuration from scratch (use get_chair_configuration_price)
    - User just wants to see base product options (use get_product_details)

    **Examples:**
    - "what's a good Aeron setup for developers" ✓
    - "most popular Cosm configuration" ✓
    - "typical executive chair setup" ✓
    - "build me a custom Aeron" ✗ (use get_product_details + get_chair_configuration_price)

    **What you get:**
    - Pre-built configurations ranked by popularity
    - Complete pricing including all add-ons
    - Variant and add-on combinations

    Args:
        configuration_description: Description of desired configuration or use case
        product_name: Optional specific product name to filter by

    Returns:
        Formatted string with matching configurations and pricing
    """
    # Get product_id if product name provided
    product_id = None
    if product_name:
        product = asyncio.run(get_product_by_name(product_name))
        if product:
            product_id = product.id

    configurations = asyncio.run(
        search_product_configurations(
            query=configuration_description,
            product_id=product_id,
            max_results=5
        )
    )

    if not configurations:
        return f"No pre-built configurations found matching '{configuration_description}'."

    # Format output
    output = f"**Popular configurations matching your needs:**\n\n"

    for i, config in enumerate(configurations, 1):
        output += f"{i}. **{config.product_name} - {config.variant_name}**\n"
        output += f"   Total Price: ${config.total_price:.2f}\n"

        if config.addons:
            output += f"   Includes:\n"
            for addon in config.addons:
                output += f"   - {addon}\n"

        if config.popularity_rank:
            output += f"   Popularity: #{config.popularity_rank}\n"

        output += "\n"

    return output


@tool(parse_docstring=True)
def compare_products_with_framework(
    product_names: List[str]
) -> str:
    """Get expert comparison framework between specific products.

    **When to use:**
    - User explicitly wants to compare 2-3 specific products by name
    - User asks "what's the difference between X and Y"
    - Need expert-curated comparison with key differentiators

    **Don't use if:**
    - User hasn't decided which products to compare yet (use semantic_product_search first)
    - User wants general product browsing (use list_all_products or search)

    **Examples:**
    - "compare Aeron vs Cosm" ✓
    - "what's the difference between Lino and Aeron" ✓
    - "which chair is better for me" ✗ (use find_best_use_case first)

    **What you get:**
    - Pre-computed expert comparison frameworks (if available)
    - Key differentiators organized by category
    - Decision criteria to help users choose
    - If no framework exists, prompts for feature-by-feature comparison

    Args:
        product_names: List of product names to compare (2-3 products)

    Returns:
        Formatted comparison framework or indication that comparison doesn't exist
    """
    product_ids = []
    for name in product_names:
        product = asyncio.run(get_product_by_name(name))
        if product:
            product_ids.append(product.id)
        else:
            return f"Product '{name}' not found in catalog."

    if len(product_ids) < 2:
        return "Need at least 2 valid products to compare."

    # Find comparison framework
    framework = asyncio.run(find_comparison_framework(product_ids))

    if not framework:
        return f"No pre-built comparison available for these products. Use feature-by-feature comparison instead."

    # Format output
    output = f"**Expert Comparison: {' vs '.join(product_names)}**\n\n"

    # Format comparison data (structure depends on your schema)
    if isinstance(framework.key_differentiators, dict):
        for category, details in framework.key_differentiators.items():
            output += f"**{category}:**\n"
            if isinstance(details, dict):
                for key, value in details.items():
                    output += f"  {key}: {value}\n"
            else:
                output += f"  {details}\n"
            output += "\n"

    if framework.decision_criteria:
        output += "**Use case criteria:**\n"
        for decision_criteria in framework.decision_criteria:
            output += f"- {decision_criteria}\n"

    return output


@tool(parse_docstring=True)
def expanded_semantic_search(
    primary_query: str,
    query_variations: Annotated[List[str], InjectedToolArg] = []
) -> str:
    """Expanded semantic search with multiple query variations for broader coverage.

    **When to use:**
    - User query is ambiguous or could mean multiple things
    - Want comprehensive results by searching multiple interpretations
    - Need to cast a wider net for semantic matches

    **Don't use if:**
    - Query is already specific and clear (use semantic_product_search)
    - User wants exact/structured filtering (use structured query tools)
    - Speed is critical (this takes 2x longer than regular semantic search)

    **Examples:**
    - User says "ergonomic" → also search "posture support", "back comfort", "adjustable"
    - User says "modern" → also search "contemporary design", "minimalist", "sleek"

    **Performance note:** Generates embeddings for multiple queries in parallel, searches each,
    then deduplicates results. Takes longer but catches more edge cases.

    Args:
        primary_query: Main search query from user
        query_variations: Additional query phrasings to expand search coverage

    Returns:
        Formatted string with comprehensive search results
    """
    # Combine primary query with variations
    all_queries = [primary_query] + query_variations

    results = asyncio.run(
        multi_query_semantic_search(
            queries=all_queries,
            max_results_per_query=5,
            deduplicate=True
        )
    )

    if not results:
        return f"No products found matching any variation of '{primary_query}'."

    # Sort by similarity
    results.sort(key=lambda x: x.similarity, reverse=True)

    # Format output
    output = f"**Comprehensive search results for: '{primary_query}'**\n"
    if query_variations:
        output += f"(Also searched: {', '.join(query_variations)})\n"
    output += "\n"

    for i, result in enumerate(results[:10], 1):  # Limit to top 10
        output += f"{i}. **{result.product_name}** (Relevance: {result.similarity:.2f})\n"

        if result.price_tier:
            output += f"   Price Tier: {result.price_tier}\n"

        output += "\n"

    return output
