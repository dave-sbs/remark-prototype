"""
Integration tests for semantic query functions.
These tests hit the REAL database and require embeddings - no mocking.
Manually verify the results match your actual data and make semantic sense.

Tests include:
- All LangChain tool wrappers
- New RPC function wrappers
- Strategy-based retrieval functions
- Performance/latency validation
"""

import asyncio
import time
import sys
from pathlib import Path

# Add parent directory to path so we can import semantic_queries
sys.path.insert(0, str(Path(__file__).parent.parent))

from semantic_queries import (
    # LangChain Tools for Agents
    semantic_product_search,
    find_best_use_case,
    find_popular_configuration,
    compare_products_with_framework,
    expanded_semantic_search,
    # Internal functions for direct testing
    semantic_product_search_internal,
    search_product_addons_semantic,
    search_comparison_frameworks_semantic,
    find_use_case_scenarios,
    # Strategy functions
    get_product_full_details,
    strategy_comparison_lookup,
    strategy_scenario_match,
    strategy_rich_configuration_search
)


def print_section(title):
    """Print a formatted section header."""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)


def print_subsection(title):
    """Print a formatted subsection."""
    print(f"\n--- {title} ---")


def semantic_search_internal():
    """Test internal semantic search function with different param configurations"""
    print_section("TEST: semantic_search_internal (Integration)")

    # Test various natural language queries
    test_queries = [
        "What is aesthetically appealing about the cosm chair?"
    ]

    for query in test_queries:
        try:
            print_subsection(f"Query: '{query}'")
            start = time.time()

            result = asyncio.run(semantic_product_search_internal(
                query=query,
                max_results=5,
                min_similarity=0.3,
                price_tier=None,
                design_style=None
            ))

            elapsed = (time.time() - start) * 1000

            """
            Output schema:
                product_id='a84ed3b1-af81-4bbe-9f76-04e3aa95a078', 
                product_name='Aeron Chair', chunk_text='Adjustable Lumbar Support: Optional adjustable lumbar support for personalized back comfort', 
                similarity=0.421745275154992, price_tier='premium', 
                design_style='modern-ergonomic'), 
            """
            for item in result:
                print(item)
            print(f"✓ Search completed in {elapsed:.0f}ms")

        except Exception as e:
            print(f"✗ Error: {e}")


def test_semantic_product_search():
    """Test semantic search with real embeddings (updated for simplified implementation)."""
    print_section("TEST: semantic_product_search (Integration)")

    # Test various natural language queries
    test_queries = [
       "What is aesthetically appealing about the cosm chair?"
    ]

    for query in test_queries:
        try:
            print_subsection(f"Query: '{query}'")
            start = time.time()

            result = semantic_product_search.invoke({
                "query": query
            })

            elapsed = (time.time() - start) * 1000

            print(result)
            print(f"✓ Search completed in {elapsed:.0f}ms")

            # Check latency target
            if elapsed > 400:
                print(f"⚠ Latency warning: {elapsed:.0f}ms exceeds 400ms target")

        except Exception as e:
            print(f"✗ Error: {e}")


def test_find_best_use_case():
    """Test use case scenario matching with real data."""
    print_section("TEST: find_best_use_case (Integration)")
    
    # Test various user situations
    test_situations = [
        "I'm a software developer working from home and my back hurts after long days",
        "I need a chair for my home office that looks good on video calls",
        "I sit 10+ hours a day and need maximum ergonomic support",
        "I'm setting up a new office and want something modern and sleek",
        "I work in a creative agency and want something stylish but comfortable",
        "I'm on a budget but need something ergonomic for daily use",
    ]
    
    for situation in test_situations:
        try:
            print_subsection(f"Situation: '{situation}'")
            result = find_best_use_case.invoke({
                "user_situation": situation
            })
            print(result)
            print("✓ Use case found")
            
        except Exception as e:
            print(f"✗ Error: {e}")
    
    print("\nManually verify:")
    print("  - Recommendations match the user's situation")
    print("  - Explanation is helpful and relevant")
    print("  - Products suggested are appropriate")


def test_find_popular_configuration():
    """Test finding popular configurations with real data."""
    print_section("TEST: find_popular_configuration (Integration)")
    
    # Test configuration searches
    test_configs = [
        {
            "product_name": "Aeron Chair",
            "description": "popular setup for developers"
        },
        {
            "product_name": "Aeron Chair",
            "description": "best configuration for back support"
        },
        {
            "product_name": "Cosm Chair",
            "description": "most comfortable setup"
        },
        {
            "product_name": "Cosm Chair",
            "description": "gaming configuration"
        },
    ]
    
    for config in test_configs:
        try:
            print_subsection(f"Query: {config['product_name']} - '{config['description']}'")
            result = find_popular_configuration.invoke({
                "product_name": config["product_name"],
                "configuration_description": config["description"]
            })
            print(result)
            print("✓ Configuration found")
            
        except Exception as e:
            print(f"✗ Error: {e}")
    
    print("\nManually verify:")
    print("  - Configurations match the description")
    print("  - Pricing is accurate")
    print("  - Popularity rankings make sense")


def test_compare_products_with_framework():
    """Test product comparison with real comparison frameworks."""
    print_section("TEST: compare_products_with_framework (Integration)")
    
    # Test various product comparisons
    test_comparisons = [
        ["Aeron Chair", "Cosm Chair"],
        ["Aeron Chair", "Lino Chair"],
        ["Cosm Chair", "Lino Chair"],
        ["Lino Chair", "Eames Aluminum Group Chair"],
    ]
    
    for products in test_comparisons:
        try:
            print_subsection(f"Comparing: {' vs '.join(products)}")
            result = compare_products_with_framework.invoke({
                "product_names": products
            })
            print(result)
            
            if "No pre-built comparison" in result:
                print("⚠ No framework found - showing basic comparison")
            else:
                print("✓ Expert comparison found")
                
        except Exception as e:
            print(f"✗ Error: {e}")
    
    print("\nManually verify:")
    print("  - Comparisons are accurate")
    print("  - Framework data is relevant (if available)")
    print("  - Fallback works when no framework exists")


def test_expanded_semantic_search():
    """Test multi-query semantic search expansion."""
    print_section("TEST: expanded_semantic_search (Integration)")
    
    # Test queries that should be expanded
    test_queries = [
        "ergonomic office chair",
        "comfortable seating",
        "modern design chair",
        "back support chair",
    ]
    
    for query in test_queries:
        try:
            print_subsection(f"Query: '{query}'")
            result = expanded_semantic_search.invoke({
                "primary_query": query
            })
            print(result)
            print("✓ Expanded search completed")
            
        except Exception as e:
            print(f"✗ Error: {e}")
    
    print("\nManually verify:")
    print("  - Results include variations of the query")
    print("  - Multiple aspects are covered")
    print("  - Results are more comprehensive than single search")


def test_search_product_addons_semantic():
    """Test semantic addon search (new RPC wrapper)."""
    print_section("TEST: search_product_addons_semantic (New RPC Wrapper)")

    test_queries = [
        {
            "query": "adjustable armrests for better ergonomics",
            "product_id": None,
            "description": "General addon search"
        },
        {
            "query": "lumbar support upgrade",
            "product_id": None,
            "description": "Specific feature search"
        },
        {
            "query": "premium finishes and materials",
            "product_id": None,
            "description": "Premium options"
        }
    ]

    for test in test_queries:
        try:
            print_subsection(f"{test['description']}: '{test['query']}'")
            start = time.time()

            results = asyncio.run(search_product_addons_semantic(
                query=test["query"],
                product_id=test.get("product_id"),
                max_results=5
            ))

            elapsed = (time.time() - start) * 1000

            if results:
                print(f"Found {len(results)} addons in {elapsed:.0f}ms:")
                for addon in results[:3]:
                    print(f"  - {addon.addon_name} ({addon.product_name}): ${addon.addon_price}")
                    print(f"    Category: {addon.addon_category}, Similarity: {addon.similarity:.3f}")
                print("✓ Addon search completed")
            else:
                print("No addons found")
                print("⚠ Verify embeddings are generated for product_addons table")

        except Exception as e:
            print(f"✗ Error: {e}")

    print("\nManually verify:")
    print("  - Addon results are semantically relevant to query")
    print("  - Similarity scores make sense")
    print("  - Latency is acceptable (<400ms)")


def test_search_comparison_frameworks_semantic():
    """Test semantic comparison framework search (new RPC wrapper)."""
    print_section("TEST: search_comparison_frameworks_semantic (New RPC Wrapper)")

    test_queries = [
        "comparing office chairs for home office setup",
        "difference between premium and budget ergonomic seating",
        "executive vs task chair comparison",
        "mesh vs upholstered chair decision"
    ]

    for query in test_queries:
        try:
            print_subsection(f"Query: '{query}'")
            start = time.time()

            results = asyncio.run(search_comparison_frameworks_semantic(
                query=query,
                max_results=3
            ))

            elapsed = (time.time() - start) * 1000

            if results:
                print(f"Found {len(results)} comparison frameworks in {elapsed:.0f}ms:")
                for framework in results:
                    print(f"  - Context: {framework.comparison_context[:100]}...")
                    print(f"    Products: {len(framework.products_compared)} products")
                    print(f"    Decision criteria: {len(framework.decision_criteria)} points")
                print("✓ Framework search completed")
            else:
                print("No comparison frameworks found")
                print("⚠ Verify comparison_frameworks table has data and embeddings")

        except Exception as e:
            print(f"✗ Error: {e}")

    print("\nManually verify:")
    print("  - Frameworks are contextually relevant")
    print("  - Comparison data is useful")
    print("  - Latency is acceptable (<400ms)")


def test_edge_cases():
    """Test edge cases and error handling for semantic queries."""
    print_section("TEST: Edge Cases & Error Handling")
    
    # Test 1: Query with no results
    try:
        print_subsection("Query: Completely unrelated search")
        result = semantic_product_search.invoke({
            "query": "standing desk with adjustable monitor arm and keyboard tray"
        })
        print(result)
        print("✓ Handled gracefully")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 2: Non-existent product comparison
    try:
        print_subsection("Compare: Non-existent products")
        result = compare_products_with_framework.invoke({
            "product_names": ["Fake Chair 1", "Fake Chair 2"]
        })
        print(result)
        print("✓ Handled gracefully")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 3: Empty query
    try:
        print_subsection("Query: Empty string")
        result = semantic_product_search.invoke({
            "query": ""
        })
        print(result)
        print("✓ Handled gracefully")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 4: Very long query
    try:
        print_subsection("Query: Very long description")
        long_query = "I need a chair that is comfortable, ergonomic, modern, stylish, affordable, durable, breathable, adjustable, supportive, and perfect for long work sessions at my home office where I spend most of my day coding and attending video meetings"
        result = semantic_product_search.invoke({
            "query": long_query
        })
        print(result)
        print("✓ Handled gracefully")
    except Exception as e:
        print(f"✗ Error: {e}")


def test_strategy_functions():
    """Test strategy-based retrieval functions aligned with AGENTS_PLAN.md."""
    print_section("TEST: Strategy-Based Retrieval Functions")

    # Test Strategy D: get_product_full_details
    try:
        print_subsection("Strategy D: get_product_full_details (Rich Context)")
        print("Fetching complete product details for Aeron Chair...")

        start = time.time()
        # Note: You'll need to replace this with an actual product ID from your database
        result = asyncio.run(get_product_full_details("00000000-0000-0000-0000-000000000000"))
        elapsed = (time.time() - start) * 1000

        print(f"✓ Fetched in {elapsed:.0f}ms")
        print(f"  Product: {result['product'].name if result['product'] else 'Not found'}")
        print(f"  Variants: {len(result['variants'])} options")
        print(f"  Addons: {len(result['addons'])} available")
        print(f"  Colors: {len(result['colors'])} options")
        print(f"  Materials: {len(result['materials'])} components")

        if elapsed > 300:
            print(f"⚠ Latency warning: {elapsed:.0f}ms exceeds 300ms target")

    except Exception as e:
        print(f"✗ Error: {e}")
        print("Note: Update test with valid product_id from your database")

    # Test Strategy B: strategy_comparison_lookup
    try:
        print_subsection("Strategy B: strategy_comparison_lookup (Comparison)")
        print("Comparing Aeron Chair vs Cosm Chair...")

        start = time.time()
        result = asyncio.run(strategy_comparison_lookup(["Aeron Chair", "Cosm Chair"]))
        elapsed = (time.time() - start) * 1000

        print(f"✓ Comparison completed in {elapsed:.0f}ms")
        print(f"  Framework found: {result['comparison_framework'] is not None}")
        print(f"  Products retrieved: {len(result['products'])}")

        if result.get('error'):
            print(f"  Error: {result['error']}")

        if elapsed > 400:
            print(f"⚠ Latency warning: {elapsed:.0f}ms exceeds 400ms target")

    except Exception as e:
        print(f"✗ Error: {e}")

    # Test Strategy C: strategy_scenario_match
    try:
        print_subsection("Strategy C: strategy_scenario_match (Scenario)")
        print("Matching scenario for: 'I work from home with back pain'")

        start = time.time()
        result = asyncio.run(strategy_scenario_match("I work from home with back pain"))
        elapsed = (time.time() - start) * 1000

        print(f"✓ Scenario matched in {elapsed:.0f}ms")
        if result['scenario']:
            print(f"  Scenario: {result['scenario'].scenario_name}")
            print(f"  Products: {len(result['products'])} recommended")
            print(f"  Alternatives: {len(result['alternatives'])} options")
        else:
            print("  No scenario found")
            print("  ⚠ Verify use_case_scenarios table has data")

        if elapsed > 500:
            print(f"⚠ Latency warning: {elapsed:.0f}ms exceeds 500ms target")

    except Exception as e:
        print(f"✗ Error: {e}")

    # Test Strategy: strategy_rich_configuration_search
    try:
        print_subsection("Enhanced: strategy_rich_configuration_search")
        print("Searching configurations for: 'best setup for developers'")

        start = time.time()
        result = asyncio.run(strategy_rich_configuration_search(
            query="best setup for developers",
            product_name="Aeron Chair"
        ))
        elapsed = (time.time() - start) * 1000

        print(f"✓ Configuration search completed in {elapsed:.0f}ms")
        print(f"  Configurations found: {len(result['configurations'])}")
        print(f"  Unique products: {len(result['products_map'])}")

        if elapsed > 400:
            print(f"⚠ Latency warning: {elapsed:.0f}ms exceeds 400ms target")

    except Exception as e:
        print(f"✗ Error: {e}")

    print("\nManually verify:")
    print("  - All strategy functions return structured data")
    print("  - Parallel execution reduces latency")
    print("  - Error handling works gracefully")
    print("  - Latency targets are met (<500ms)")


def test_semantic_relevance():
    """Test that semantic search returns contextually appropriate results."""
    print_section("TEST: Semantic Relevance Check")

    # Test pairs: (query, expected_keywords_in_results)
    relevance_tests = [
        {
            "query": "chair for gaming",
            "expect": ["comfort", "support", "long", "hours"],
            "description": "Gaming query should return comfort/endurance features"
        },
        {
            "query": "executive boardroom seating",
            "expect": ["premium", "luxury", "professional", "design"],
            "description": "Executive query should return premium products"
        },
        {
            "query": "budget friendly work chair",
            "expect": ["affordable", "budget", "value", "price"],
            "description": "Budget query should emphasize value"
        },
    ]
    
    for test in relevance_tests:
        try:
            print_subsection(f"Relevance Test: {test['description']}")
            print(f"Query: '{test['query']}'")
            result = semantic_product_search.invoke({
                "query": test["query"]
            })
            print(result)
            
            # Check if expected keywords appear in results
            result_lower = result.lower()
            found_keywords = [kw for kw in test['expect'] if kw in result_lower]
            
            print(f"\nExpected keywords: {test['expect']}")
            print(f"Found keywords: {found_keywords}")
            
            if found_keywords:
                print(f"✓ Semantically relevant ({len(found_keywords)}/{len(test['expect'])} keywords found)")
            else:
                print("⚠ Check relevance - no expected keywords found")
                
        except Exception as e:
            print(f"✗ Error: {e}")


def test_performance_benchmarks():
    """Test performance against AGENTS_PLAN.md latency targets."""
    print_section("TEST: Performance Benchmarks (AGENTS_PLAN.md Targets)")

    benchmarks = []

    # Benchmark 1: Semantic product search (Target: 200-400ms)
    try:
        print_subsection("Benchmark: semantic_product_search_internal")
        query = "ergonomic chair with back support"

        times = []
        for i in range(3):
            start = time.time()
            asyncio.run(semantic_product_search_internal(query, max_results=10))
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)

        avg_time = sum(times) / len(times)
        print(f"  Average: {avg_time:.0f}ms (3 runs)")
        print(f"  Min: {min(times):.0f}ms, Max: {max(times):.0f}ms")
        print(f"  Target: 200-400ms")

        if avg_time <= 400:
            print("  ✓ Within target")
        else:
            print(f"  ✗ Exceeds target by {avg_time - 400:.0f}ms")

        benchmarks.append(("semantic_search", avg_time, 400))

    except Exception as e:
        print(f"  ✗ Error: {e}")

    # Benchmark 2: Use case scenario matching (Target: 300-500ms)
    try:
        print_subsection("Benchmark: find_use_case_scenarios")
        query = "I work from home and need ergonomic support"

        times = []
        for i in range(3):
            start = time.time()
            asyncio.run(find_use_case_scenarios(query, max_results=3))
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)

        avg_time = sum(times) / len(times)
        print(f"  Average: {avg_time:.0f}ms (3 runs)")
        print(f"  Min: {min(times):.0f}ms, Max: {max(times):.0f}ms")
        print(f"  Target: 300-500ms")

        if avg_time <= 500:
            print("  ✓ Within target")
        else:
            print(f"  ✗ Exceeds target by {avg_time - 500:.0f}ms")

        benchmarks.append(("use_case_search", avg_time, 500))

    except Exception as e:
        print(f"  ✗ Error: {e}")

    # Benchmark 3: Strategy comparison lookup (Target: 200-400ms)
    try:
        print_subsection("Benchmark: strategy_comparison_lookup")

        times = []
        for i in range(3):
            start = time.time()
            asyncio.run(strategy_comparison_lookup(["Aeron Chair", "Cosm Chair"]))
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)

        avg_time = sum(times) / len(times)
        print(f"  Average: {avg_time:.0f}ms (3 runs)")
        print(f"  Min: {min(times):.0f}ms, Max: {max(times):.0f}ms")
        print(f"  Target: 200-400ms")

        if avg_time <= 400:
            print("  ✓ Within target")
        else:
            print(f"  ✗ Exceeds target by {avg_time - 400:.0f}ms")

        benchmarks.append(("comparison_lookup", avg_time, 400))

    except Exception as e:
        print(f"  ✗ Error: {e}")

    # Summary
    print("\n" + "-"*80)
    print("Performance Summary:")
    print("-"*80)

    total_within_target = sum(1 for _, actual, target in benchmarks if actual <= target)
    print(f"\nBenchmarks passing: {total_within_target}/{len(benchmarks)}")

    for name, actual, target in benchmarks:
        status = "✓" if actual <= target else "✗"
        print(f"  {status} {name}: {actual:.0f}ms (target: <{target}ms)")

    if total_within_target == len(benchmarks):
        print("\n✓ All benchmarks within AGENTS_PLAN.md targets!")
    else:
        print(f"\n⚠ {len(benchmarks) - total_within_target} benchmark(s) need optimization")

    print("\nNote: Latency depends on:")
    print("  - Database location (local vs remote)")
    print("  - Network speed")
    print("  - Embedding generation time (OpenAI API)")
    print("  - Database load and indexing")


# ============================================================================
# Run All Integration Tests
# ============================================================================

if __name__ == "__main__":
    try:
        # Run all tests
        print("\n" + "="*80)
        print("PART 1: LangChain Tool Tests")
        print("="*80)
        # semantic_search_internal()
        test_semantic_product_search()

    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        print("\nPossible issues:")
        print("  - Database not populated")
        print("  - Embeddings not generated for all tables")
        print("  - pgvector not enabled")
        print("  - Connection issues")
        print("  - Using wrong API key (should use SUPABASE_LOCAL_PUBLISHABLE)")

