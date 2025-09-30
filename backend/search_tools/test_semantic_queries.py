"""
Test file for semantic query functions with mocked data.
Tests the response formatting and function behavior without requiring database/embeddings access.
"""

import asyncio
from unittest.mock import Mock, patch, AsyncMock
from semantic_queries import (
    semantic_product_search,
    find_best_use_case,
    find_popular_configuration,
    compare_products_with_framework,
    expanded_semantic_search
)


# ============================================================================
# Mock Data
# ============================================================================

MOCK_SEMANTIC_RESULTS = [
    {
        "product_id": "prod_1",
        "product_name": "Aeron Chair",
        "chunk_text": "The Aeron Chair is designed for long hours of comfortable sitting with advanced ergonomic features including PostureFit lumbar support and breathable 8Z Pellicle mesh.",
        "similarity": 0.92,
        "price_tier": "premium",
        "design_style": "ergonomic"
    },
    {
        "product_id": "prod_2",
        "product_name": "Embody Chair",
        "chunk_text": "Embody promotes healthy circulation and reduces pressure points with its Pixelated Support system. Ideal for extended work sessions.",
        "similarity": 0.88,
        "price_tier": "premium",
        "design_style": "ergonomic"
    },
    {
        "product_id": "prod_3",
        "product_name": "Cosm Chair",
        "chunk_text": "Cosm offers instant comfort with automatic harmonic tilt that responds to your body's movements. Modern design with ergonomic intelligence.",
        "similarity": 0.78,
        "price_tier": "premium",
        "design_style": "modern"
    }
]

MOCK_USE_CASE_SCENARIOS = [
    {
        "scenario_id": "scenario_1",
        "scenario_name": "Remote Developer with Back Pain",
        "description": "For software developers working from home who experience lower back discomfort after long coding sessions.",
        "similarity": 0.91,
        "recommended_products": ["Aeron Chair", "Embody Chair", "Mirra 2 Chair"],
        "reasoning": "These chairs provide exceptional lumbar support and promote healthy posture during extended periods of sitting."
    },
    {
        "scenario_id": "scenario_2",
        "scenario_name": "Gamer and Remote Worker Hybrid",
        "description": "For users who split time between gaming and professional work, requiring comfort and adjustability.",
        "similarity": 0.85,
        "recommended_products": ["Aeron Chair", "Cosm Chair"],
        "reasoning": "Versatile chairs that support both focused work and extended gaming sessions with excellent adjustability."
    }
]

MOCK_CONFIGURATIONS = [
    {
        "config_id": "config_1",
        "product_id": "prod_1",
        "product_name": "Aeron Chair",
        "variant_name": "Size B",
        "addons": ["Adjustable Arms", "Forward Tilt", "Polished Aluminum Base"],
        "total_price": 1880.0,
        "similarity": 0.89,
        "popularity_rank": 1
    },
    {
        "config_id": "config_2",
        "product_id": "prod_1",
        "product_name": "Aeron Chair",
        "variant_name": "Size B",
        "addons": ["Adjustable Arms", "Forward Tilt"],
        "total_price": 1705.0,
        "similarity": 0.86,
        "popularity_rank": 2
    },
    {
        "config_id": "config_3",
        "product_id": "prod_1",
        "product_name": "Aeron Chair",
        "variant_name": "Size B",
        "addons": ["Adjustable Arms"],
        "total_price": 1580.0,
        "similarity": 0.81,
        "popularity_rank": 5
    }
]

MOCK_COMPARISON_FRAMEWORK = {
    "framework_id": "comp_1",
    "products_compared": ["prod_1", "prod_2"],
    "comparison_data": {
        "Ergonomics": {
            "Aeron Chair": "PostureFit lumbar support, highly adjustable, 8Z Pellicle mesh",
            "Cosm Chair": "Auto-harmonic tilt, IAF back support, minimal adjustments needed"
        },
        "Price": {
            "Aeron Chair": "Starting at $1,395",
            "Cosm Chair": "Starting at $1,095"
        },
        "Best For": {
            "Aeron Chair": "Users who want maximum adjustability and customization",
            "Cosm Chair": "Users who prefer instant comfort with minimal setup"
        },
        "Design": {
            "Aeron Chair": "Classic ergonomic design, iconic mesh aesthetic",
            "Cosm Chair": "Modern minimalist design, seamless form"
        }
    },
    "use_cases": [
        "Power users who customize everything",
        "Users seeking instant comfort without tweaking",
        "Traditional office vs modern workspace aesthetics"
    ]
}

MOCK_MULTI_QUERY_RESULTS = [
    {
        "product_id": "prod_1",
        "product_name": "Aeron Chair",
        "chunk_text": None,
        "similarity": 0.92,
        "price_tier": "premium",
        "design_style": "ergonomic"
    },
    {
        "product_id": "prod_2",
        "product_name": "Embody Chair",
        "chunk_text": None,
        "similarity": 0.89,
        "price_tier": "premium",
        "design_style": "ergonomic"
    },
    {
        "product_id": "prod_3",
        "product_name": "Cosm Chair",
        "chunk_text": None,
        "similarity": 0.85,
        "price_tier": "premium",
        "design_style": "modern"
    },
    {
        "product_id": "prod_4",
        "product_name": "Sayl Chair",
        "chunk_text": None,
        "similarity": 0.79,
        "price_tier": "mid-range",
        "design_style": "modern"
    }
]


# ============================================================================
# Test Functions
# ============================================================================

def test_semantic_product_search():
    """Test semantic product search with natural language query."""
    print("\n" + "="*80)
    print("TEST: semantic_product_search")
    print("="*80)

    with patch('semantic_queries.asyncio.run') as mock_run:
        mock_run.return_value = [Mock(**result) for result in MOCK_SEMANTIC_RESULTS]

        result = semantic_product_search.invoke({
            "query": "comfortable chair for long coding sessions"
        })

        print("\nInput:")
        print(f"  query: 'comfortable chair for long coding sessions'")

        print("\nOutput:")
        print(result)

        assert "Aeron Chair" in result
        assert "Embody Chair" in result
        assert "High" in result  # High confidence match
        assert "ergonomic" in result
        print("\n✓ Test passed!")


def test_find_best_use_case():
    """Test use case scenario matching."""
    print("\n" + "="*80)
    print("TEST: find_best_use_case")
    print("="*80)

    with patch('semantic_queries.asyncio.run') as mock_run:
        mock_run.return_value = [Mock(**scenario) for scenario in MOCK_USE_CASE_SCENARIOS]

        result = find_best_use_case.invoke({
            "user_situation": "I'm a software developer working from home and my back hurts after long days"
        })

        print("\nInput:")
        print(f"  user_situation: 'I'm a software developer working from home and my back hurts after long days'")

        print("\nOutput:")
        print(result)

        assert "Remote Developer with Back Pain" in result
        assert "Aeron Chair" in result
        assert "Embody Chair" in result
        assert "lumbar support" in result
        print("\n✓ Test passed!")


def test_find_popular_configuration():
    """Test finding popular pre-built configurations."""
    print("\n" + "="*80)
    print("TEST: find_popular_configuration")
    print("="*80)

    # Mock the get_product_by_name import
    with patch('semantic_queries.get_product_by_name') as mock_get_product:
        with patch('semantic_queries.asyncio.run') as mock_run:
            # First call returns product, second returns configurations
            mock_product = Mock(id="prod_1", name="Aeron Chair")
            mock_run.side_effect = [
                mock_product,
                [Mock(**config) for config in MOCK_CONFIGURATIONS]
            ]

            result = find_popular_configuration.invoke({
                "configuration_description": "popular setup for developers",
                "product_name": "Aeron Chair"
            })

            print("\nInput:")
            print(f"  configuration_description: 'popular setup for developers'")
            print(f"  product_name: 'Aeron Chair'")

            print("\nOutput:")
            print(result)

            assert "Aeron Chair" in result
            assert "Size B" in result
            assert "Adjustable Arms" in result
            assert "1880.00" in result or "1705.00" in result
            assert "Popularity: #1" in result or "Popularity: #2" in result
            print("\n✓ Test passed!")


def test_compare_products_with_framework():
    """Test product comparison using pre-built framework."""
    print("\n" + "="*80)
    print("TEST: compare_products_with_framework")
    print("="*80)

    with patch('semantic_queries.get_product_by_name') as mock_get_product:
        with patch('semantic_queries.asyncio.run') as mock_run:
            # Mock product lookups
            mock_get_product.side_effect = [
                Mock(id="prod_1", name="Aeron Chair"),
                Mock(id="prod_2", name="Cosm Chair")
            ]

            # Mock comparison framework lookup
            mock_run.return_value = Mock(**MOCK_COMPARISON_FRAMEWORK)

            result = compare_products_with_framework.invoke({
                "product_names": ["Aeron Chair", "Cosm Chair"]
            })

            print("\nInput:")
            print(f"  product_names: ['Aeron Chair', 'Cosm Chair']")

            print("\nOutput:")
            print(result)

            assert "Expert Comparison" in result
            assert "Ergonomics" in result
            assert "PostureFit" in result
            assert "Auto-harmonic" in result
            assert "Price" in result
            print("\n✓ Test passed!")


def test_compare_products_no_framework():
    """Test when no pre-built comparison exists."""
    print("\n" + "="*80)
    print("TEST: compare_products_with_framework (no framework)")
    print("="*80)

    with patch('semantic_queries.get_product_by_name') as mock_get_product:
        with patch('semantic_queries.asyncio.run') as mock_run:
            # Mock product lookups
            mock_get_product.side_effect = [
                Mock(id="prod_1", name="Aeron Chair"),
                Mock(id="prod_3", name="Sayl Chair")
            ]

            # Mock no comparison framework found
            mock_run.return_value = None

            result = compare_products_with_framework.invoke({
                "product_names": ["Aeron Chair", "Sayl Chair"]
            })

            print("\nInput:")
            print(f"  product_names: ['Aeron Chair', 'Sayl Chair']")

            print("\nOutput:")
            print(result)

            assert "No pre-built comparison available" in result
            assert "feature-by-feature" in result
            print("\n✓ Test passed!")


def test_expanded_semantic_search():
    """Test expanded search with query variations."""
    print("\n" + "="*80)
    print("TEST: expanded_semantic_search")
    print("="*80)

    with patch('semantic_queries.asyncio.run') as mock_run:
        mock_run.return_value = [Mock(**result) for result in MOCK_MULTI_QUERY_RESULTS]

        result = expanded_semantic_search.invoke({
            "primary_query": "ergonomic office chair"
        })

        print("\nInput:")
        print(f"  primary_query: 'ergonomic office chair'")

        print("\nOutput:")
        print(result)

        assert "Comprehensive search results" in result
        assert "Aeron Chair" in result
        assert "Embody Chair" in result
        assert "Cosm Chair" in result
        print("\n✓ Test passed!")


def test_semantic_search_no_results():
    """Test semantic search with no matching results."""
    print("\n" + "="*80)
    print("TEST: semantic_product_search (no results)")
    print("="*80)

    with patch('semantic_queries.asyncio.run') as mock_run:
        mock_run.return_value = []

        result = semantic_product_search.invoke({
            "query": "standing desk with adjustable monitor arm"
        })

        print("\nInput:")
        print(f"  query: 'standing desk with adjustable monitor arm'")

        print("\nOutput:")
        print(result)

        assert "No products found" in result
        print("\n✓ Test passed!")


# ============================================================================
# Run All Tests
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*80)
    print("RUNNING SEMANTIC QUERIES TESTS")
    print("="*80)

    try:
        test_semantic_product_search()
        test_find_best_use_case()
        test_find_popular_configuration()
        test_compare_products_with_framework()
        test_compare_products_no_framework()
        test_expanded_semantic_search()
        test_semantic_search_no_results()

        print("\n" + "="*80)
        print("ALL TESTS PASSED ✓")
        print("="*80 + "\n")

    except AssertionError as e:
        print(f"\n✗ Test failed: {e}\n")
    except Exception as e:
        print(f"\n✗ Error running tests: {e}\n")
