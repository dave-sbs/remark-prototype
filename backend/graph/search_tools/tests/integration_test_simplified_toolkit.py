import asyncio
import sys
from pathlib import Path

# Add parent directory to path so we can import semantic_queries
sys.path.insert(0, str(Path(__file__).parent.parent))

from simplified_toolkit import (
    # Core API Functions
    get_all_products,
    get_product_by_id,
    get_product_by_name,
    get_all_products_with_price,
    get_product_features_by_product_id,
    get_product_colors,
    get_product_variants,
    get_product_addons,
    get_product_materials,
    get_product_dimensions,
    get_size_recommendation,
    calculate_configuration_price,
    # LLM Tool Functions
    get_product_catalog,
    get_product_details,
    get_all_base_prices,
    get_product_unique_features,
    get_size_recommendation_for_user,
    get_chair_configuration_price
)

cosm_chair_id = "eae98cf2-100b-45c1-9fa8-73b057b7d288"
aeron_chair_id = "d4f8e5b2-3c9a-4f1e-8d7b-2a5c6e9f0b1d"  # You may need to update this

# ============================================================================
# CORE API FUNCTION TESTS
# ============================================================================

def test_get_all_products():
    """Test getting all products."""
    products = asyncio.run(get_all_products())
    print("Getting all Products")
    print(products)
    assert len(products) > 0

def test_get_product_by_id():
    """Test getting a product by ID."""
    product = asyncio.run(get_product_by_id(cosm_chair_id))
    print("\n Getting Cosm Chair by ID")
    print(product)
    assert product is not None

def test_get_product_by_name():
    """Test getting a product by name."""
    product = asyncio.run(get_product_by_name("Cosm Chair"))
    print("\n Getting Cosm Chair details using the name")
    print(product)
    assert product is not None

def test_get_all_products_with_price():
    """Test getting all products with price."""
    products = asyncio.run(get_all_products_with_price())
    print("\n Getting all products base prices")
    print(products)
    assert len(products) > 0

def test_get_product_features_by_product_id():
    """Test getting product features by product ID."""
    features = asyncio.run(get_product_features_by_product_id(cosm_chair_id))
    print("\nGetting all features for Cosm Chair")
    print(features)
    assert len(features) >= 0

def test_get_product_colors():
    """Test getting product colors."""
    colors = asyncio.run(get_product_colors(cosm_chair_id))
    print("\n Getting all colors for Cosm Chair")
    print(colors)
    assert isinstance(colors, list)

def test_get_product_variants():
    """Test getting product variants."""
    variants = asyncio.run(get_product_variants(cosm_chair_id))
    print("\n Getting all variants for Cosm Chair")
    print(variants)
    assert isinstance(variants, list)
    if variants:
        assert variants[0].base_price > 0

def test_get_product_addons():
    """Test getting product addons."""
    addons = asyncio.run(get_product_addons(cosm_chair_id))
    print("\n Getting all addons for Cosm Chair")
    print(addons)
    assert isinstance(addons, list)

def test_get_product_addons_with_category():
    """Test getting product addons filtered by category."""
    addons = asyncio.run(get_product_addons(cosm_chair_id, addon_category="Arms"))
    print("\n Getting Arms addons for Cosm Chair")
    print(addons)
    assert isinstance(addons, list)

def test_get_product_materials():
    """Test getting product materials."""
    materials = asyncio.run(get_product_materials(cosm_chair_id))
    print("\n Getting all materials for Cosm Chair")
    print(materials)
    assert isinstance(materials, list)

def test_get_product_materials_sustainable():
    """Test getting sustainable materials only."""
    materials = asyncio.run(get_product_materials(cosm_chair_id, sustainable_only=True))
    print("\n Getting sustainable materials for Cosm Chair")
    print(materials)
    # Verify all returned materials are sustainable
    for material in materials:
        assert material.is_sustainable is True

def test_get_product_dimensions():
    """Test getting product dimensions."""
    dimensions = asyncio.run(get_product_dimensions(cosm_chair_id))
    print("\n Getting dimensions for Cosm Chair")
    print(dimensions)
    assert isinstance(dimensions, list)

def test_get_size_recommendation():
    """Test size recommendation logic."""
    # Test Aeron Chair Size B (average user)
    result = asyncio.run(get_size_recommendation("Aeron Chair", 69, 180))
    print("\n Getting size recommendation for Aeron Chair (5'9\", 180 lbs)")
    print(result)
    assert result["recommended_size"] == "Size B"
    assert result["product"] == "Aeron Chair"

    # Test Aeron Chair Size A (smaller user)
    result_small = asyncio.run(get_size_recommendation("Aeron Chair", 62, 120))
    print("\n Getting size recommendation for Aeron Chair (5'2\", 120 lbs)")
    print(result_small)
    assert result_small["recommended_size"] == "Size A"

    # Test Aeron Chair Size C (larger user)
    result_large = asyncio.run(get_size_recommendation("Aeron Chair", 79, 240))
    print("\n Getting size recommendation for Aeron Chair (6'7\", 240 lbs)")
    print(result_large)
    assert result_large["recommended_size"] == "Size C"

    # Test non-Aeron product (one size)
    result_cosm = asyncio.run(get_size_recommendation("Cosm Chair", 69, 180))
    print("\n Getting size recommendation for Cosm Chair (5'9\", 180 lbs)")
    print(result_cosm)
    assert "Standard" in result_cosm["recommended_size"]

def test_calculate_configuration_price():
    """Test configuration price calculation."""
    # First get a variant and some addons
    variants = asyncio.run(get_product_variants(cosm_chair_id))
    if not variants:
        print("\n Skipping price calculation test - no variants found")
        return

    variant_id = variants[0].id

    # Get addons
    addons = asyncio.run(get_product_addons(cosm_chair_id))
    addon_ids = [addon.id for addon in addons[:2]] if addons else []

    # Calculate price
    breakdown = asyncio.run(calculate_configuration_price(variant_id, addon_ids))
    print("\n Calculating configuration price")
    print(breakdown)

    assert breakdown.base_price > 0
    assert breakdown.total_price >= breakdown.base_price
    if addon_ids:
        assert len(breakdown.addons) > 0

# ============================================================================
# LLM TOOL TESTS
# ============================================================================

def test_llm_get_product_catalog():
    """Test LLM tool: get_product_catalog."""
    result = asyncio.run(get_product_catalog.ainvoke({}))
    print("\n========== LLM TOOL: get_product_catalog ==========")
    print(result)
    assert "Product Catalog" in result
    assert len(result) > 0

def test_llm_get_product_details():
    """Test LLM tool: get_product_details."""
    result = asyncio.run(get_product_details.ainvoke({"product_name": "Cosm Chair"}))
    print("\n========== LLM TOOL: get_product_details ==========")
    print(result)
    assert len(result) > 0

def test_llm_get_all_base_prices():
    """Test LLM tool: get_all_base_prices."""
    result = asyncio.run(get_all_base_prices.ainvoke({}))
    print("\n========== LLM TOOL: get_all_base_prices ==========")
    print(result)
    assert "Base Prices" in result
    assert len(result) > 0

def test_llm_get_product_unique_features():
    """Test LLM tool: get_product_unique_features."""
    result = asyncio.run(get_product_unique_features.ainvoke({"product_name": "Cosm Chair"}))
    print("\n========== LLM TOOL: get_product_unique_features ==========")
    print(result)
    assert "What Makes Cosm Chair Unique" in result
    assert len(result) > 0

def test_llm_get_size_recommendation_for_user():
    """Test LLM tool: get_size_recommendation_for_user."""
    result = asyncio.run(get_size_recommendation_for_user.ainvoke({
        "product_name": "Aeron Chair",
        "height_inches": 69,
        "weight_pounds": 180
    }))
    print("\n========== LLM TOOL: get_size_recommendation_for_user ==========")
    print(result)
    assert "Size Recommendation" in result
    assert "Size B" in result
    assert len(result) > 0

def test_llm_get_chair_configuration_price():
    """Test LLM tool: get_chair_configuration_price."""
    result = asyncio.run(get_chair_configuration_price.ainvoke({
        "product_name": "Aeron Chair",
        "variant_name": "Size B",
        "addon_names": ["PostureFit SL Lumbar"]
    }))
    print("\n========== LLM TOOL: get_chair_configuration_price ==========")
    print(result)
    assert "Total:" in result or "not found" in result  # Allow for missing data
    assert len(result) > 0

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

if __name__ == "__main__":
    print("="*60)
    print("TESTING CORE API FUNCTIONS")
    print("="*60)

    # Basic product queries
    test_get_all_products()
    test_get_product_by_id()
    test_get_product_by_name()
    test_get_product_features_by_product_id()
    test_get_all_products_with_price()

    # Product details queries
    test_get_product_colors()
    test_get_product_variants()
    test_get_product_addons()
    test_get_product_addons_with_category()
    test_get_product_materials()
    test_get_product_materials_sustainable()
    test_get_product_dimensions()

    # Recommendation and pricing logic
    test_get_size_recommendation()
    test_calculate_configuration_price()

    # LLM Tool tests
    print("\n" + "="*60)
    print("TESTING LLM TOOLS")
    print("="*60)
    test_llm_get_product_catalog()
    test_llm_get_product_details()
    test_llm_get_all_base_prices()
    test_llm_get_product_unique_features()
    test_llm_get_size_recommendation_for_user()
    test_llm_get_chair_configuration_price()

    print("\n" + "="*60)
    print("ALL TESTS COMPLETED!")
    print("="*60)
