"""
Integration tests for structured query functions.
These tests hit the REAL database - no mocking.
Manually verify the results match your actual data.
"""

import asyncio
from structured_queries import (
    search_products_by_price,
    get_product_details,
    get_chair_configuration_price,
    get_size_recommendation_for_user,
    list_all_products,
    get_sustainable_options
)


def print_section(title):
    """Print a formatted section header."""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)


def print_subsection(title):
    """Print a formatted subsection."""
    print(f"\n--- {title} ---")


def test_search_products_by_price():
    """Test price range search with real database."""
    print_section("TEST: search_products_by_price (Integration)")
    
    try:
        # Test case 1: Mid-range prices
        print_subsection("Query: Products between $1000-$1500")
        result = search_products_by_price.invoke({
            "min_price": 1000.0,
            "max_price": 1500.0
        })
        print(result)
        
        # Test case 2: Budget range
        print_subsection("Query: Products between $500-$900")
        result = search_products_by_price.invoke({
            "min_price": 500.0,
            "max_price": 900.0
        })
        print(result)
        
        # Test case 3: Premium range
        print_subsection("Query: Products between $1500-$2500")
        result = search_products_by_price.invoke({
            "min_price": 1500.0,
            "max_price": 2500.0
        })
        print(result)
        
        print("\n✓ Query executed successfully")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")


def test_get_product_details():
    """Test fetching product details from real database."""
    print_section("TEST: get_product_details (Integration)")
    
    # List of products to test - adjust these to match your actual products
    test_products = [
        "Aeron Chair",
        "Cosm Chair",
        "Eames Aluminum Group Chair",
        "Lino Chair",
    ]
    
    for product_name in test_products:
        try:
            print_subsection(f"Query: Details for '{product_name}'")
            result = get_product_details.invoke({
                "product_name": product_name
            })
            print(result)
            print("✓ Found")
            
        except Exception as e:
            print(f"✗ Error for {product_name}: {e}")


def test_get_chair_configuration_price():
    """Test configuration price calculation with real data."""
    print_section("TEST: get_chair_configuration_price (Integration)")
    
    # Test configurations - adjust these to match your actual data
    test_configs = [
        {
            "product_name": "Aeron Chair",
            "variant_name": "Size B",
            "addon_names": ["Adjustable Arms", "Forward Tilt"]
        },
        {
            "product_name": "Aeron Chair",
            "variant_name": "Size C",
            "addon_names": ["Polished Aluminum Base"]
        },
        {
            "product_name": "Cosm Chair",
            "variant_name": "High Back",
            "addon_names": []
        }
    ]
    
    for config in test_configs:
        try:
            print_subsection(f"Query: {config['product_name']} - {config['variant_name']}")
            result = get_chair_configuration_price.invoke(config)
            print(result)
            print("✓ Calculated successfully")
            
        except Exception as e:
            print(f"✗ Error: {e}")


def test_get_size_recommendation_for_user():
    """Test size recommendation logic with various measurements."""
    print_section("TEST: get_size_recommendation_for_user (Integration)")
    
    # Test various user measurements
    test_cases = [
        {
            "product_name": "Aeron Chair",
            "height_inches": 60,  # 5'0" - Should get Size A
            "weight_pounds": 120,
            "expected": "Size A"
        },
        {
            "product_name": "Aeron Chair",
            "height_inches": 69,  # 5'9" - Should get Size B
            "weight_pounds": 180,
            "expected": "Size B"
        },
        {
            "product_name": "Aeron Chair",
            "height_inches": 78,  # 6'6" - Should get Size C
            "weight_pounds": 240,
            "expected": "Size C"
        }
    ]
    
    for i, case in enumerate(test_cases, 1):
        try:
            print_subsection(f"Test Case {i}: {case['height_inches']}\" / {case['weight_pounds']}lbs (expect {case['expected']})")
            result = get_size_recommendation_for_user.invoke({
                "product_name": case["product_name"],
                "height_inches": case["height_inches"],
                "weight_pounds": case["weight_pounds"]
            })
            print(result)
            
            if case['expected'] in result:
                print(f"✓ Correct: Recommended {case['expected']}")
            else:
                print(f"⚠ Check: Expected {case['expected']}")
                
        except Exception as e:
            print(f"✗ Error: {e}")


def test_list_all_products():
    """Test listing all products from database."""
    print_section("TEST: list_all_products (Integration)")
    
    try:
        print_subsection("Query: All products in catalog")
        result = list_all_products.invoke({})
        print(result)
        print("\n✓ Query executed successfully")
        print("\nManually verify:")
        print("  - All products are listed")
        print("  - Price tiers are correct")
        print("  - Product count is accurate")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")


def test_get_sustainable_options():
    """Test fetching sustainable materials from database."""
    print_section("TEST: get_sustainable_options (Integration)")
    
    # Products to check for sustainability info
    test_products = [
        "Aeron Chair",
        "Cosm Chair",
        "Eames Aluminum Group Chair",
    ]
    
    for product_name in test_products:
        try:
            print_subsection(f"Query: Sustainable materials for '{product_name}'")
            result = get_sustainable_options.invoke({
                "product_name": product_name
            })
            print(result)
            print("✓ Found")
            
        except Exception as e:
            print(f"✗ Error for {product_name}: {e}")


def test_edge_cases():
    """Test edge cases and error handling."""
    print_section("TEST: Edge Cases & Error Handling")
    
    # Test non-existent product
    try:
        print_subsection("Query: Non-existent product")
        result = get_product_details.invoke({
            "product_name": "Fake Chair That Doesn't Exist"
        })
        print(result)
        print("✓ Handled gracefully")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test unrealistic price range
    try:
        print_subsection("Query: No products in range $10-$20")
        result = search_products_by_price.invoke({
            "min_price": 10.0,
            "max_price": 20.0
        })
        print(result)
        print("✓ Handled gracefully")
    except Exception as e:
        print(f"✗ Error: {e}")


# ============================================================================
# Run All Integration Tests
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*80)
    print("RUNNING STRUCTURED QUERIES INTEGRATION TESTS")
    print("="*80)
    print("\nThese tests query the REAL database.")
    print("Manually verify the results match your actual data.")
    print("\nMake sure:")
    print("  ✓ Supabase is running")
    print("  ✓ Database is populated")
    print("  ✓ .env file has correct credentials")
    
    input("\nPress Enter to continue...")
    
    try:
        # Run all tests
        test_list_all_products()
        test_search_products_by_price()
        test_get_product_details()
        test_get_chair_configuration_price()
        test_get_size_recommendation_for_user()
        test_get_sustainable_options()
        test_edge_cases()
        
        print("\n" + "="*80)
        print("INTEGRATION TESTS COMPLETED")
        print("="*80)
        print("\nManually review the output above to verify:")
        print("  - Data matches your database")
        print("  - Formatting is correct")
        print("  - Edge cases are handled properly")
        print("  - All expected products appear")
        
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")

