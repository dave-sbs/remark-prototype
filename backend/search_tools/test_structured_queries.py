"""
Test file for structured query functions with mocked data.
Tests the response formatting and function behavior without requiring database access.
"""

import asyncio
from unittest.mock import Mock, patch, AsyncMock
from structured_queries import (
    search_products_by_price,
    get_product_details,
    get_chair_configuration_price,
    get_size_recommendation_for_user,
    list_all_products,
    get_sustainable_options
)


# ============================================================================
# Mock Data
# ============================================================================
PRODUCT_ID = {
    "prod_1": "a84ed3b1-af81-4bbe-9f76-04e3aa95a078",
    "prod_2": "eae98cf2-100b-45c1-9fa8-73b057b7d288",
    "prod_3": "543f17bc-f34f-47b2-af45-1d6f930da323",
    "prod_4": "c30b4970-fe09-469d-af2d-262d858ca255",
}


MOCK_PRODUCTS = [
    {
        "id": PRODUCT_ID["prod_1"],
        "name": "Aeron Chair",
        "price_tier": "premium",
        "design_style": "modern-ergonomic"
    },
    {
        "id": PRODUCT_ID["prod_2"],
        "name": "Cosm Chair",
        "price_tier": "mid-range",
        "design_style": "minimalist"
    },
    {
        "id": PRODUCT_ID["prod_3"],
        "name": "Lino Chair",
        "price_tier": "budget",
        "design_style": "modern-ergonomic"
    }
]

MOCK_VARIANTS = [
    {
        "id": "var_1",
        "product_id": PRODUCT_ID["prod_1"],
        "variant_type": "size",
        "variant_name": "Size A",
        "base_price": 1395.0,
        "is_default": False
    },
    {
        "id": "var_2",
        "product_id": PRODUCT_ID["prod_1"],
        "variant_type": "size",
        "variant_name": "Size B",
        "base_price": 1495.0,
        "is_default": True
    },
    {
        "id": "var_3",
        "product_id": PRODUCT_ID["prod_1"],
        "variant_type": "size",
        "variant_name": "Size C",
        "base_price": 1595.0,
        "is_default": False
    }
]

MOCK_ADDONS = [
    {
        "id": "addon_1",
        "product_id": PRODUCT_ID["prod_1"],
        "addon_category": "arms",
        "addon_name": "Adjustable Arms",
        "addon_price": 85.0,
        "is_default": False,
        "requires_variant_type": None
    },
    {
        "id": "addon_2",
        "product_id": PRODUCT_ID["prod_1"],
        "addon_category": "tilt",
        "addon_name": "Forward Tilt",
        "addon_price": 125.0,
        "is_default": False,
        "requires_variant_type": None
    },
    {
        "id": "addon_3",
        "product_id": PRODUCT_ID["prod_1"],
        "addon_category": "base",
        "addon_name": "Polished Aluminum Base",
        "addon_price": 175.0,
        "is_default": False,
        "requires_variant_type": None
    }
]

MOCK_COLORS = [
    {
        "id": "color_1",
        "product_id": PRODUCT_ID["prod_1"],
        "color_name": "Carbon",
        "color_code": "#1a1a1a",
        "applies_to": ["mesh", "frame"]
    },
    {
        "id": "color_2",
        "product_id": PRODUCT_ID["prod_1"],
        "color_name": "Mineral",
        "color_code": "#4a4a4a",
        "applies_to": ["mesh"]
    }
]

MOCK_MATERIALS = [
    {
        "id": "mat_1",
        "product_id": PRODUCT_ID["prod_1"],
        "component": "Mesh",
        "material": "8Z Pellicle",
        "is_sustainable": True,
        "description": "Breathable elastomeric suspension material"
    },
    {
        "id": "mat_2",
        "product_id": PRODUCT_ID["prod_1"],
        "component": "Frame",
        "material": "Recycled Aluminum",
        "is_sustainable": True,
        "description": "65% recycled aluminum construction"
    }
]

MOCK_PRICE_RANGE_RESULTS = [
    {
        "id": "var_2",
        "variant_name": "Size B",
        "variant_type": "size",
        "base_price": 1495.0,
        "products": {
            "id": PRODUCT_ID["prod_1"],
            "name": "Aeron Chair",
            "price_tier": "premium",
            "design_style": "ergonomic"
        }
    },
    {
        "id": "var_3",
        "variant_name": "Size C",
        "variant_type": "size",
        "base_price": 1595.0,
        "products": {
            "id": PRODUCT_ID["prod_1"],
            "name": "Aeron Chair",
            "price_tier": "premium",
            "design_style": "ergonomic"
        }
    }
]


# ============================================================================
# Test Functions
# ============================================================================

def test_search_products_by_price():
    """Test price range search functionality."""
    print("\n" + "="*80)
    print("TEST: search_products_by_price")
    print("="*80)

    with patch('structured_queries.search_products_by_price_range', new_callable=AsyncMock) as mock_query:
        mock_query.return_value = MOCK_PRICE_RANGE_RESULTS

        result = search_products_by_price.invoke({"min_price": 1400.0, "max_price": 1600.0})

        print("\nInput:")
        print(f"  min_price: $1400")
        print(f"  max_price: $1600")

        print("\nOutput:")
        print(result)

        assert "Aeron Chair" in result
        assert "Size B" in result
        assert "$1495.0" in result
        print("\n✓ Test passed!")


def test_get_product_details():
    """Test fetching product details."""
    print("\n" + "="*80)
    print("TEST: get_product_details")
    print("="*80)

    with patch('structured_queries.get_product_by_name', new_callable=AsyncMock) as mock_product, \
         patch('structured_queries.get_product_variants', new_callable=AsyncMock) as mock_variants, \
         patch('structured_queries.get_product_colors', new_callable=AsyncMock) as mock_colors, \
         patch('structured_queries.get_product_materials', new_callable=AsyncMock) as mock_materials:
        
        mock_product.return_value = Mock(id="prod_1", name="Aeron Chair", price_tier="premium", design_style="ergonomic")
        mock_variants.return_value = [Mock(**v) for v in MOCK_VARIANTS]
        mock_colors.return_value = [Mock(**c) for c in MOCK_COLORS]
        mock_materials.return_value = [Mock(**m) for m in MOCK_MATERIALS]

        result = get_product_details.invoke({"product_name": "Aeron Chair"})

        print("\nInput:")
        print(f"  product_name: 'Aeron Chair'")

        print("\nOutput:")
        print(result)

        assert "Aeron Chair" in result
        assert "Size B" in result
        assert "premium" in result
        print("\n✓ Test passed!")


def test_get_chair_configuration_price():
    """Test configuration price calculation."""
    print("\n" + "="*80)
    print("TEST: get_chair_configuration_price")
    print("="*80)

    with patch('structured_queries.get_product_by_name', new_callable=AsyncMock) as mock_product, \
         patch('structured_queries.get_product_variants', new_callable=AsyncMock) as mock_variants, \
         patch('structured_queries.get_product_addons', new_callable=AsyncMock) as mock_addons, \
         patch('structured_queries.calculate_configuration_price', new_callable=AsyncMock) as mock_calc:
        
        mock_product.return_value = Mock(id="prod_1", name="Aeron Chair")
        mock_variants.return_value = [Mock(**v) for v in MOCK_VARIANTS]
        mock_addons.return_value = [Mock(**a) for a in MOCK_ADDONS]
        mock_calc.return_value = Mock(
            variant_name="Size B",
            base_price=1495.0,
            addons=[
                {"name": "Adjustable Arms", "category": "arms", "price": 85.0},
                {"name": "Forward Tilt", "category": "tilt", "price": 125.0}
            ],
            total_price=1705.0
        )

        result = get_chair_configuration_price.invoke({
            "product_name": "Aeron Chair",
            "variant_name": "Size B",
            "addon_names": ["Adjustable Arms", "Forward Tilt"]
        })

        print("\nInput:")
        print(f"  product_name: 'Aeron Chair'")
        print(f"  variant_name: 'Size B'")
        print(f"  addon_names: ['Adjustable Arms', 'Forward Tilt']")

        print("\nOutput:")
        print(result)

        assert "Size B" in result
        assert "1495.00" in result
        assert "Adjustable Arms" in result
        assert "1705.00" in result
        print("\n✓ Test passed!")


def test_get_size_recommendation_for_user():
    """Test size recommendation logic."""
    print("\n" + "="*80)
    print("TEST: get_size_recommendation_for_user")
    print("="*80)

    with patch('structured_queries.get_size_recommendation', new_callable=AsyncMock) as mock_rec:
        mock_rec.return_value = {
            "product": "Aeron Chair",
            "recommended_size": "Size B",
            "explanation": "Recommended for users 5'4\" - 6'6\" and 130-230 lbs (fits 95% of people)",
            "user_height": 69,
            "user_weight": 180
        }

        result = get_size_recommendation_for_user.invoke({
            "product_name": "Aeron Chair",
            "height_inches": 69,
            "weight_pounds": 180
        })

        print("\nInput:")
        print(f"  product_name: 'Aeron Chair'")
        print(f"  height_inches: 69 (5'9\")")
        print(f"  weight_pounds: 180")

        print("\nOutput:")
        print(result)

        assert "Size B" in result
        assert "69" in result
        assert "180" in result
        print("\n✓ Test passed!")


def test_list_all_products():
    """Test listing all products."""
    print("\n" + "="*80)
    print("TEST: list_all_products")
    print("="*80)

    with patch('structured_queries.get_all_products', new_callable=AsyncMock) as mock_products:
        mock_products.return_value = [Mock(**p) for p in MOCK_PRODUCTS]

        result = list_all_products.invoke({})

        print("\nOutput:")
        print(result)

        assert "Aeron Chair" in result
        assert "Cosm Chair" in result
        assert "Lino Chair" in result  # Updated to match mock data
        assert "premium" in result
        assert "mid-range" in result
        assert "3 chairs available" in result
        print("\n✓ Test passed!")


def test_get_sustainable_options():
    """Test fetching sustainable materials."""
    print("\n" + "="*80)
    print("TEST: get_sustainable_options")
    print("="*80)

    with patch('structured_queries.get_product_by_name', new_callable=AsyncMock) as mock_product, \
         patch('structured_queries.get_product_materials', new_callable=AsyncMock) as mock_materials:
        
        mock_product.return_value = Mock(id="prod_1", name="Aeron Chair")
        mock_materials.return_value = [Mock(**m) for m in MOCK_MATERIALS if m["is_sustainable"]]

        result = get_sustainable_options.invoke({"product_name": "Aeron Chair"})

        print("\nInput:")
        print(f"  product_name: 'Aeron Chair'")

        print("\nOutput:")
        print(result)

        assert "Sustainable Materials" in result
        assert "8Z Pellicle" in result
        assert "Recycled Aluminum" in result
        print("\n✓ Test passed!")


# ============================================================================
# Run All Tests
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*80)
    print("RUNNING STRUCTURED QUERIES TESTS")
    print("="*80)

    try:
        test_search_products_by_price()
        test_get_product_details()
        test_get_chair_configuration_price()
        test_get_size_recommendation_for_user()
        test_list_all_products()
        test_get_sustainable_options()

        print("\n" + "="*80)
        print("ALL TESTS PASSED ✓")
        print("="*80 + "\n")

    except AssertionError as e:
        print(f"\n✗ Test failed: {e}\n")
    except Exception as e:
        print(f"\n✗ Error running tests: {e}\n")
