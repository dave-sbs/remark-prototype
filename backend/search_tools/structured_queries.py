"""
Structured SQL-based search functions for product catalog.
These are fast, deterministic queries for exact matches and filters.
Target latency: <100ms
"""

import asyncio
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from langchain_core.tools import tool, InjectedToolArg
from typing_extensions import Annotated

from supabase import create_client, Client
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_LOCAL_URL")
SUPABASE_KEY = os.getenv("SUPABASE_LOCAL_PUBLISHABLE")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================================================
# Async Supabase Wrapper
# ============================================================================

async def async_supabase_query(query_builder):
    """Execute Supabase query asynchronously."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: query_builder.execute())


# ============================================================================
# Response Models
# ============================================================================

class Product(BaseModel):
    id: str
    name: str
    price_tier: Optional[str] = None
    design_style: Optional[str] = None
    brand_line: Optional[str] = None


class ProductVariant(BaseModel):
    id: str
    product_id: str
    variant_type: str
    variant_name: str
    base_price: float
    is_default: bool


class ProductAddon(BaseModel):
    id: str
    product_id: str
    addon_category: str
    addon_name: str
    addon_price: float
    is_default: bool
    requires_variant_type: Optional[str] = None


class ProductColor(BaseModel):
    id: str
    product_id: str
    color_name: str
    color_code: Optional[str] = None
    applies_to: Optional[List[str]] = None


class ProductMaterial(BaseModel):
    id: str
    product_id: str
    component: str
    material: str
    is_sustainable: bool
    description: Optional[str] = None


class ProductDimension(BaseModel):
    id: str
    product_id: str
    variant_name: Optional[str] = None
    height_min: Optional[float] = None
    height_max: Optional[float] = None
    width_min: Optional[float] = None
    width_max: Optional[float] = None
    depth_min: Optional[float] = None
    depth_max: Optional[float] = None
    seat_height_min: Optional[float] = None
    seat_height_max: Optional[float] = None
    seat_depth: Optional[float] = None
    arm_height_min: Optional[float] = None
    arm_height_max: Optional[float] = None


class PriceBreakdown(BaseModel):
    variant_name: str
    base_price: float
    addons: List[Dict[str, Any]]
    total_price: float


# ============================================================================
# Core API Functions (Direct Supabase Access)
# ============================================================================

async def get_all_products() -> List[Product]:
    """Fetch all products from catalog."""
    query = supabase.table("products").select("*").order("name")
    result = await async_supabase_query(query)
    return [Product(**row) for row in result.data] if result.data else []


async def get_product_by_id(product_id: str) -> Optional[Product]:
    """Fetch a specific product by ID."""
    query = supabase.table("products").select("*").eq("id", product_id)
    result = await async_supabase_query(query)
    return Product(**result.data[0]) if result.data else None


async def get_product_by_name(product_name: str) -> Optional[Product]:
    """Fetch a product by exact name match (case-insensitive)."""
    query = supabase.table("products").select("*").ilike("name", product_name)
    result = await async_supabase_query(query)
    return Product(**result.data[0]) if result.data else None


async def search_products_by_price_range(
    min_price: float,
    max_price: float,
    price_tier: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Search products by price range across all variants.
    Returns products with their matching variants.
    """
    query = supabase.table("product_variants").select(
        "id, variant_name, variant_type, base_price, products(id, name, price_tier, design_style)"
    ).gte("base_price", min_price).lte("base_price", max_price)

    if price_tier:
        query = query.eq("products.price_tier", price_tier)

    query = query.order("base_price")
    result = await async_supabase_query(query)

    return result.data if result.data else []


async def get_product_variants(product_id: str) -> List[ProductVariant]:
    """Fetch all variants for a product."""
    query = supabase.table("product_variants").select("*").eq(
        "product_id", product_id
    ).order("base_price")
    result = await async_supabase_query(query)

    return [ProductVariant(**row) for row in result.data] if result.data else []


async def get_product_addons(
    product_id: str,
    addon_category: Optional[str] = None
) -> List[ProductAddon]:
    """Fetch addons for a product, optionally filtered by category."""
    query = supabase.table("product_addons").select("*").eq("product_id", product_id)

    if addon_category:
        query = query.eq("addon_category", addon_category)

    query = query.order("addon_category, addon_name")
    result = await async_supabase_query(query)

    return [ProductAddon(**row) for row in result.data] if result.data else []


async def calculate_configuration_price(
    variant_id: str,
    addon_ids: List[str]
) -> PriceBreakdown:
    """Calculate total price for a configuration."""
    # Get variant
    variant_query = supabase.table("product_variants").select("*").eq("id", variant_id)
    variant_result = await async_supabase_query(variant_query)

    if not variant_result.data:
        raise ValueError(f"Variant {variant_id} not found")

    variant = variant_result.data[0]
    base_price = float(variant["base_price"])

    # Get addons
    addons = []
    total_addon_price = 0.0

    if addon_ids:
        addon_query = supabase.table("product_addons").select("*").in_("id", addon_ids)
        addon_result = await async_supabase_query(addon_query)

        if addon_result.data:
            for addon in addon_result.data:
                addon_price = float(addon["addon_price"])
                addons.append({
                    "name": addon["addon_name"],
                    "category": addon["addon_category"],
                    "price": addon_price
                })
                total_addon_price += addon_price

    return PriceBreakdown(
        variant_name=variant["variant_name"],
        base_price=base_price,
        addons=addons,
        total_price=base_price + total_addon_price
    )


async def get_product_colors(product_id: str) -> List[ProductColor]:
    """Fetch all color options for a product."""
    query = supabase.table("product_colors").select("*").eq("product_id", product_id)
    result = await async_supabase_query(query)
    return [ProductColor(**row) for row in result.data] if result.data else []


async def get_product_materials(
    product_id: str,
    sustainable_only: bool = False
) -> List[ProductMaterial]:
    """Fetch materials for a product, optionally filtered by sustainability."""
    query = supabase.table("product_materials").select("*").eq("product_id", product_id)

    if sustainable_only:
        query = query.eq("is_sustainable", True)

    result = await async_supabase_query(query)
    return [ProductMaterial(**row) for row in result.data] if result.data else []


async def get_product_dimensions(
    product_id: str,
    variant_name: Optional[str] = None
) -> List[ProductDimension]:
    """Fetch dimensions for a product, optionally filtered by variant."""
    query = supabase.table("product_dimensions").select("*").eq("product_id", product_id)

    if variant_name:
        query = query.eq("variant_name", variant_name)

    result = await async_supabase_query(query)
    return [ProductDimension(**row) for row in result.data] if result.data else []


async def get_size_recommendation(
    product_name: str,
    user_height: float,  # in inches
    user_weight: float   # in pounds
) -> Dict[str, Any]:
    """
    Recommend chair size based on user height and weight.
    Currently implements Aeron sizing logic.
    """
    # Aeron sizing rules
    if "aeron" in product_name.lower():
        if user_height < 64 or user_weight < 130:  # 5'4" / 130 lbs
            recommended_size = "Size A"
            explanation = "Recommended for users under 5'4\" and 130 lbs"
        elif user_height > 78 or user_weight > 230:  # 6'6" / 230 lbs
            recommended_size = "Size C"
            explanation = "Recommended for users over 6'6\" or 230 lbs"
        else:
            recommended_size = "Size B"
            explanation = "Recommended for users 5'4\" - 6'6\" and 130-230 lbs (fits 95% of people)"

        return {
            "product": product_name,
            "recommended_size": recommended_size,
            "explanation": explanation,
            "user_height": user_height,
            "user_weight": user_weight
        }

    # Other products don't have size variants
    return {
        "product": product_name,
        "recommended_size": "Standard (one size fits most)",
        "explanation": f"{product_name} is designed to fit users 5'0\" - 6'5\"",
        "user_height": user_height,
        "user_weight": user_weight
    }


# ============================================================================
# LangChain Tool Wrappers (Agent Interface)
# ============================================================================

@tool(parse_docstring=True)
def search_products_by_price(
    min_price: float,
    max_price: float,
    price_tier: Annotated[Optional[str], InjectedToolArg] = None
) -> str:
    """Search for products within a specific price range.

    Use this when users ask about budget, affordability, or price comparisons.
    Returns products with their variants and base prices.

    Args:
        min_price: Minimum price in dollars (e.g., 500)
        max_price: Maximum price in dollars (e.g., 1500)
        price_tier: Optional filter by tier ('budget', 'mid-range', 'premium', 'luxury')

    Returns:
        Formatted string with products and their price options
    """
    results = asyncio.run(search_products_by_price_range(min_price, max_price, price_tier))

    if not results:
        return f"No products found in the ${min_price}-${max_price} range."

    # Format output
    output = f"Products available between ${min_price} and ${max_price}:\n\n"

    current_product = None
    for item in results:
        product_info = item.get("products", {})
        product_name = product_info.get("name", "Unknown")

        if product_name != current_product:
            current_product = product_name
            output += f"\n**{product_name}**\n"
            if product_info.get("price_tier"):
                output += f"  Tier: {product_info['price_tier']}\n"

        output += f"  - {item['variant_name']}: ${item['base_price']}\n"

    return output


@tool(parse_docstring=True)
def get_product_details(product_name: str) -> str:
    """Get comprehensive details about a specific product.

    Use this when users ask about a specific chair or want to know more details.

    Args:
        product_name: Name of the product (e.g., "Aeron Chair", "Cosm Chair")

    Returns:
        Formatted string with product details including variants and options
    """
    product = asyncio.run(get_product_by_name(product_name))

    if not product:
        return f"Product '{product_name}' not found in catalog."

    # Get related data
    variants = asyncio.run(get_product_variants(product.id))
    colors = asyncio.run(get_product_colors(product.id))
    materials = asyncio.run(get_product_materials(product.id))

    # Format output
    output = f"**{product.name}**\n\n"

    if product.price_tier:
        output += f"Price Tier: {product.price_tier}\n"
    if product.design_style:
        output += f"Design Style: {product.design_style}\n"

    output += "\n**Available Variants:**\n"
    for v in variants:
        default_marker = " (default)" if v.is_default else ""
        output += f"- {v.variant_name}: ${v.base_price}{default_marker}\n"

    if colors:
        output += "\n**Available Colors:**\n"
        for c in colors[:5]:  # Limit to first 5 colors
            applies = f" (applies to: {', '.join(c.applies_to)})" if c.applies_to else ""
            output += f"- {c.color_name}{applies}\n"

    if materials:
        output += "\n**Materials:**\n"
        for m in materials[:5]:  # Limit to first 5 materials
            sustainable = " (sustainable)" if m.is_sustainable else ""
            output += f"- {m.component}: {m.material}{sustainable}\n"

    return output


@tool(parse_docstring=True)
def get_chair_configuration_price(
    product_name: str,
    variant_name: str,
    addon_names: List[str]
) -> str:
    """Calculate the total price for a specific chair configuration.

    Use this when users want to build a custom configuration or understand pricing.

    Args:
        product_name: Name of the product (e.g., "Aeron Chair")
        variant_name: Variant name (e.g., "Size B")
        addon_names: List of addon names (e.g., ["Adjustable Arms", "Forward Tilt"])

    Returns:
        Formatted price breakdown with itemized costs
    """
    # Get product
    product = asyncio.run(get_product_by_name(product_name))
    if not product:
        return f"Product '{product_name}' not found."

    # Get variant
    variants = asyncio.run(get_product_variants(product.id))
    variant = next((v for v in variants if v.variant_name == variant_name), None)
    if not variant:
        return f"Variant '{variant_name}' not found for {product_name}."

    # Get addons
    all_addons = asyncio.run(get_product_addons(product.id))
    addon_ids = [a.id for a in all_addons if a.addon_name in addon_names]

    # Calculate price
    breakdown = asyncio.run(calculate_configuration_price(variant.id, addon_ids))

    # Format output
    output = f"**{product_name} - {breakdown.variant_name}**\n\n"
    output += f"Base Price: ${breakdown.base_price:.2f}\n\n"

    if breakdown.addons:
        output += "Add-ons:\n"
        for addon in breakdown.addons:
            output += f"  - {addon['name']}: +${addon['price']:.2f}\n"
        output += "\n"

    output += f"**Total: ${breakdown.total_price:.2f}**"

    return output


@tool(parse_docstring=True)
def get_size_recommendation_for_user(
    product_name: str,
    height_inches: float,
    weight_pounds: float
) -> str:
    """Recommend the appropriate chair size based on user's body measurements.

    Use this when users provide their height/weight or ask which size fits them.

    Args:
        product_name: Name of the product (e.g., "Aeron Chair")
        height_inches: User's height in inches (e.g., 69 for 5'9")
        weight_pounds: User's weight in pounds (e.g., 180)

    Returns:
        Size recommendation with explanation
    """
    recommendation = asyncio.run(get_size_recommendation(product_name, height_inches, weight_pounds))

    output = f"**Size Recommendation for {recommendation['product']}**\n\n"
    output += f"Based on your measurements:\n"
    output += f"  Height: {recommendation['user_height']}\" ({recommendation['user_height']//12}'{recommendation['user_height']%12}\")\n"
    output += f"  Weight: {recommendation['user_weight']} lbs\n\n"
    output += f"**Recommended: {recommendation['recommended_size']}**\n"
    output += f"{recommendation['explanation']}"

    return output


@tool(parse_docstring=True)
def list_all_products() -> str:
    """List all available products in the catalog.

    Use this for general browsing or when user asks "what do you have?" or "show me all chairs".

    Returns:
        Formatted list of all products with basic info
    """
    products = asyncio.run(get_all_products())

    if not products:
        return "No products found in catalog."

    output = "**Herman Miller Office Chairs:**\n\n"
    for p in products:
        output += f"**{p.name}**"
        if p.price_tier:
            output += f" ({p.price_tier})"
        output += "\n"

    output += f"\nTotal: {len(products)} chairs available"

    return output


@tool(parse_docstring=True)
def get_sustainable_options(product_name: str) -> str:
    """Get information about sustainable materials for a specific product.

    Use this when users ask about sustainability, eco-friendly options, or environmental impact.

    Args:
        product_name: Name of the product (e.g., "Aeron Chair")

    Returns:
        List of sustainable materials and components
    """
    product = asyncio.run(get_product_by_name(product_name))
    if not product:
        return f"Product '{product_name}' not found."

    materials = asyncio.run(get_product_materials(product.id, sustainable_only=True))

    if not materials:
        return f"No specific sustainable materials information available for {product_name}."

    output = f"**Sustainable Materials in {product_name}:**\n\n"
    for m in materials:
        output += f"**{m.component}**: {m.material}\n"
        if m.description:
            output += f"  {m.description}\n"

    return output


# ============================================================================
# Helper Tools
# ============================================================================
def get_today_str() -> str:
    """Get current date in a human-readable format."""
    return datetime.now().strftime("%a %b %-d, %Y")

def convert_feet_to_inches(height_feet: float, height_inches: float = 0) -> float:
    """Convert height from feet and inches to total inches.
    
    Args:
        height_feet: Height in feet (e.g., 5)
        height_inches: Additional inches (e.g., 9 for 5'9"), defaults to 0
    
    Returns:
        Total height in inches
    """
    return height_feet * 12 + height_inches

def convert_m_to_inches(height_m: float) -> float:
    """Convert height from meters to inches.
    
    Args:
        height_m: Height in meters (e.g., 1.75)
    
    Returns:
        Height in inches
    """
    return height_m * 39.3701

def convert_kg_to_pounds(weight_kg: float) -> float:
    """Convert weight from kilograms to pounds.
    
    Args:
        weight_kg: Weight in kilograms (e.g., 80)
    
    Returns:
        Weight in pounds
    """
    return weight_kg * 2.20462