"""
Supabase Data Upload Script
Handles inserting product data from JSON files with:
- Automatic UUID capture and foreign key resolution
- Embedding generation via OpenAI
- Filtering of _note fields before upload
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any
from supabase import create_client, Client
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize clients
SUPABASE_URL = "http://127.0.0.1:54321"
SUPABASE_KEY = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY]):
    raise ValueError("Missing required environment variables: SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# File paths
DATA_DIR = Path(__file__).parent / "json-data"
PRODUCTS_FILE = DATA_DIR / "products.json"
PRODUCT_FEATURES_FILE = DATA_DIR / "product_features.json"
PRODUCT_DIMENSIONS_FILE = DATA_DIR / "product_dimensions.json"
PRODUCT_MATERIALS_FILE = DATA_DIR / "product_materials.json"
PRODUCT_COLORS_FILE = DATA_DIR / "product_colors.json"
PRODUCT_VARIANTS_FILE = DATA_DIR / "product_variants.json"
PRODUCT_ADDONS_FILE = DATA_DIR / "product_addons.json"
PRODUCT_CONFIGURATIONS_FILE = DATA_DIR / "product_configurations.json"
USE_CASE_SCENARIOS_FILE = DATA_DIR / "use_case_scenarios.json"
COMPARISON_FRAMEWORKS_FILE = DATA_DIR / "comparison_frameworks.json"

# Hardcoded product IDs from previous insertion
PRODUCT_MAP = {
    "Aeron Chair": "a84ed3b1-af81-4bbe-9f76-04e3aa95a078",
    "Cosm Chair": "eae98cf2-100b-45c1-9fa8-73b057b7d288",
    "Lino Chair": "543f17bc-f34f-47b2-af45-1d6f930da323",
    "Eames Aluminum Group Chair": "c30b4970-fe09-469d-af2d-262d858ca255"
}


def get_variant_map_from_db() -> Dict[str, str]:
    """
    Fetch all product variants from Supabase and return mapping of (product_name, variant_name) -> variant_id.

    Returns:
        Dictionary mapping variant keys to UUIDs
    """
    print("Fetching product variants from database...")

    # Get all variants with their associated product info
    result = supabase.table("product_variants").select("id, variant_name, product_id, products(name)").execute()

    variant_map = {}
    for variant in result.data:
        product_name = variant["products"]["name"]
        variant_name = variant["variant_name"]
        variant_id = variant["id"]
        variant_key = f"{product_name}|{variant_name}"
        variant_map[variant_key] = variant_id
        print(f"Loaded: {product_name} - {variant_name} (ID: {variant_id})")

    print(f"Loaded {len(variant_map)} product variants\n")
    return variant_map


def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding for text using OpenAI's text-embedding-3-small model.

    Args:
        text: Text to embed

    Returns:
        1536-dimensional embedding vector
    """
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding


def remove_notes_field(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Remove _note fields from records before upload.

    Args:
        records: List of record dictionaries

    Returns:
        Records without _note fields
    """
    return [{k: v for k, v in record.items() if k != "_note"} for record in records]


def insert_products() -> Dict[str, str]:
    """
    Insert products and return mapping of product_name -> product_id.

    Returns:
        Dictionary mapping product names to UUIDs
    """
    print("Inserting products...")

    with open(PRODUCTS_FILE, "r") as f:
        products = json.load(f)

    product_map = {}

    for product in products:
        # Insert product
        result = supabase.table("products").insert(product).execute()

        if result.data:
            product_id = result.data[0]["id"]
            product_name = product["name"]
            product_map[product_name] = product_id
            print(f"Inserted: {product_name} (ID: {product_id})")
        else:
            print(f"Failed to insert: {product['name']}")

    print(f"Inserted {len(product_map)} products\n")
    return product_map


def insert_product_features(product_map: Dict[str, str]) -> None:
    """
    Insert product features with embeddings.

    Args:
        product_map: Mapping of product_name -> product_id
    """
    print("Inserting product features with embeddings...")

    with open(PRODUCT_FEATURES_FILE, "r") as f:
        features = json.load(f)

    features = remove_notes_field(features)

    for feature in features:
        product_name = feature.pop("product_name")
        product_id = product_map.get(product_name)

        if not product_id:
            print(f"Skipping feature: Product '{product_name}' not found")
            continue

        feature["product_id"] = product_id

        # Generate embedding
        embedding_text = f"{feature['feature_name']}: {feature['description']}"
        feature["embedding"] = generate_embedding(embedding_text)

        # Insert feature
        result = supabase.table("product_features").insert(feature).execute()

        if result.data:
            print(f"Inserted: {product_name} - {feature['feature_name']}")
        else:
            print(f"Failed to insert: {product_name} - {feature['feature_name']}")

    print(f"Inserted {len(features)} product features\n")


def insert_product_variants(product_map: Dict[str, str]) -> Dict[str, str]:
    """
    Insert product variants and return mapping of (product_name, variant_name) -> variant_id.

    Args:
        product_map: Mapping of product_name -> product_id

    Returns:
        Dictionary mapping variant keys to UUIDs
    """
    print("Inserting product variants...")

    with open(PRODUCT_VARIANTS_FILE, "r") as f:
        variants = json.load(f)

    variants = remove_notes_field(variants)
    variant_map = {}

    for variant in variants:
        product_name = variant.pop("product_name")
        product_id = product_map.get(product_name)

        if not product_id:
            print(f"Skipping variant: Product '{product_name}' not found")
            continue

        variant["product_id"] = product_id
        variant_name = variant["variant_name"]

        # Insert variant
        result = supabase.table("product_variants").upsert(variant).execute()

        if result.data:
            variant_id = result.data[0]["id"]
            variant_key = f"{product_name}|{variant_name}"
            variant_map[variant_key] = variant_id
            print(f"Inserted: {product_name} - {variant_name}")
        else:
            print(f"Failed to insert: {product_name} - {variant_name}")

    print(f"Inserted {len(variant_map)} product variants\n")
    return variant_map


def insert_product_addons(product_map: Dict[str, str]) -> Dict[str, str]:
    """
    Insert product add-ons (no embeddings for keyword search).

    Args:
        product_map: Mapping of product_name -> product_id

    Returns:
        Dictionary mapping addon keys to UUIDs
    """
    print("Inserting product add-ons...")

    with open(PRODUCT_ADDONS_FILE, "r") as f:
        addons = json.load(f)

    addons = remove_notes_field(addons)
    addon_map = {}

    for addon in addons:
        product_name = addon.pop("product_name")
        product_id = product_map.get(product_name)

        if not product_id:
            print(f"Skipping addon: Product '{product_name}' not found")
            continue

        addon["product_id"] = product_id
        addon_name = addon["addon_name"]

        # Skip addons with null prices
        if addon["addon_price"] is None:
            print(f"Skipping addon with null price: {product_name} - {addon_name}")
            continue

        # Remove embedding field (we're using keyword search for addons)
        addon.pop("embedding", None)

        # Insert addon
        result = supabase.table("product_addons").insert(addon).execute()

        if result.data:
            addon_id = result.data[0]["id"]
            addon_key = f"{product_name}|{addon_name}"
            addon_map[addon_key] = addon_id
            print(f"Inserted: {product_name} - {addon_name}")
        else:
            print(f"Failed to insert: {product_name} - {addon_name}")

    print(f"Inserted {len(addon_map)} product add-ons\n")
    return addon_map


def insert_product_colors(product_map: Dict[str, str]) -> None:
    """
    Insert product colors.

    Args:
        product_map: Mapping of product_name -> product_id
    """
    print("Inserting product colors...")

    with open(PRODUCT_COLORS_FILE, "r") as f:
        colors = json.load(f)

    colors = remove_notes_field(colors)

    for color in colors:
        product_name = color.pop("product_name")
        product_id = product_map.get(product_name)

        if not product_id:
            print(f"Skipping color: Product '{product_name}' not found")
            continue

        color["product_id"] = product_id

        # Insert color
        result = supabase.table("product_colors").insert(color).execute()

        if result.data:
            print(f"Inserted: {product_name} - {color['color_name']}")
        else:
            print(f"Failed to insert: {product_name} - {color['color_name']}")

    print(f"Inserted {len(colors)} product colors\n")


def insert_product_materials(product_map: Dict[str, str]) -> None:
    """
    Insert product materials.

    Args:
        product_map: Mapping of product_name -> product_id
    """
    print("Inserting product materials...")

    with open(PRODUCT_MATERIALS_FILE, "r") as f:
        materials = json.load(f)

    materials = remove_notes_field(materials)

    for material in materials:
        product_name = material.pop("product_name")
        product_id = product_map.get(product_name)

        if not product_id:
            print(f"Skipping material: Product '{product_name}' not found")
            continue

        material["product_id"] = product_id

        # Insert material
        result = supabase.table("product_materials").insert(material).execute()

        if result.data:
            print(f"Inserted: {product_name} - {material['component']}")
        else:
            print(f"Failed to insert: {product_name} - {material['component']}")

    print(f"Inserted {len(materials)} product materials\n")


def insert_product_dimensions(product_map: Dict[str, str]) -> None:
    """
    Insert product dimensions.

    Args:
        product_map: Mapping of product_name -> product_id
    """
    print("Inserting product dimensions...")

    with open(PRODUCT_DIMENSIONS_FILE, "r") as f:
        dimensions = json.load(f)

    dimensions = remove_notes_field(dimensions)

    for dimension in dimensions:
        product_name = dimension.pop("product_name")
        # variant_name stays in the dimension dict as it's a column in the schema
        variant_name = dimension.get("variant_name")

        product_id = product_map.get(product_name)

        if not product_id:
            print(f"Skipping dimension: Product '{product_name}' not found")
            continue

        dimension["product_id"] = product_id

        # Insert dimension
        result = supabase.table("product_dimensions").insert(dimension).execute()

        if result.data:
            print(f"Inserted: {product_name} - {variant_name}")
        else:
            print(f"Failed to insert: {product_name} - {variant_name}")

    print(f"Inserted {len(dimensions)} product dimensions\n")


def insert_product_configurations(
    product_map: Dict[str, str],
    variant_map: Dict[str, str],
    addon_map: Dict[str, str]
) -> None:
    """
    Insert product configurations with embeddings.

    Args:
        product_map: Mapping of product_name -> product_id
        variant_map: Mapping of variant keys -> variant_id
        addon_map: Mapping of addon keys -> addon_id
    """
    print("Inserting product configurations with embeddings...")

    with open(PRODUCT_CONFIGURATIONS_FILE, "r") as f:
        configurations = json.load(f)

    configurations = remove_notes_field(configurations)

    for config in configurations:
        product_name = config.pop("product_name")
        variant_name = config.pop("variant_name")
        addon_names = config.pop("addon_names")

        product_id = product_map.get(product_name)
        variant_key = f"{product_name}|{variant_name}"
        variant_id = variant_map.get(variant_key)

        if not product_id or not variant_id:
            print(f"Skipping config: Product/variant not found for '{product_name}'")
            continue

        # Skip configurations with null total_price
        if config.get("total_price") is None:
            print(f"Skipping config with null price: {config['configuration_name']}")
            continue

        config["product_id"] = product_id
        config["variant_id"] = variant_id

        # Resolve addon names to IDs
        addon_ids = []
        for addon_name in addon_names:
            addon_key = f"{product_name}|{addon_name}"
            addon_id = addon_map.get(addon_key)
            if addon_id:
                addon_ids.append(addon_id)
            else:
                print(f"Addon not found: {addon_name}")

        config["addon_ids"] = addon_ids

        # Generate embedding
        embedding_text = f"{config['configuration_name']}: {config['description']}"
        config["embedding"] = generate_embedding(embedding_text)

        # Insert configuration
        result = supabase.table("product_configurations").insert(config).execute()

        if result.data:
            print(f"Inserted: {product_name} - {config['configuration_name']}")
        else:
            print(f"Failed to insert: {product_name} - {config['configuration_name']}")

    print(f"Inserted product configurations\n")


def insert_use_case_scenarios(product_map: Dict[str, str]) -> None:
    """
    Insert use case scenarios with embeddings.

    Args:
        product_map: Mapping of product_name -> product_id
    """
    print("Inserting use case scenarios with embeddings...")

    with open(USE_CASE_SCENARIOS_FILE, "r") as f:
        scenarios = json.load(f)

    scenarios = remove_notes_field(scenarios)

    for scenario in scenarios:
        # Convert recommended_products array (currently has product IDs)
        # These are already UUIDs in the JSON, so we keep them as-is
        recommended_products = scenario.get("recommended_products", [])

        # Validate that recommended product IDs exist in our product map
        valid_products = []
        for product_id in recommended_products:
            if product_id in product_map.values():
                valid_products.append(product_id)
            else:
                print(f"Warning: Product ID {product_id} not found in product map")

        scenario["recommended_products"] = valid_products

        # Generate embedding from scenario content
        # Combine scenario_name, pain_points, and talking_points for rich semantic search
        pain_points_text = " ".join(scenario.get("pain_points", []))
        talking_points = scenario.get("talking_points", "")
        embedding_text = f"{scenario['scenario_name']}. Pain points: {pain_points_text}. {talking_points}"

        scenario["embedding"] = generate_embedding(embedding_text)

        # Insert scenario
        result = supabase.table("use_case_scenarios").insert(scenario).execute()

        if result.data:
            print(f"Inserted: {scenario['scenario_name']}")
        else:
            print(f"Failed to insert: {scenario['scenario_name']}")

    print(f"Inserted {len(scenarios)} use case scenarios\n")


def insert_comparison_frameworks(product_map: Dict[str, str]) -> None:
    """
    Insert comparison frameworks with embeddings.

    Args:
        product_map: Mapping of product_name -> product_id
    """
    print("Inserting comparison frameworks with embeddings...")

    with open(COMPARISON_FRAMEWORKS_FILE, "r") as f:
        frameworks = json.load(f)

    frameworks = remove_notes_field(frameworks)

    for framework in frameworks:
        # Validate products_compared IDs
        products_compared = framework.get("products_compared", [])
        valid_products = []
        for product_id in products_compared:
            if product_id in product_map.values():
                valid_products.append(product_id)
            else:
                print(f"Warning: Product ID {product_id} not found in product map")

        framework["products_compared"] = valid_products

        # Generate embedding from comparison content
        # Combine comparison_context, key_differentiators, and decision_criteria
        context = framework.get("comparison_context", "")
        decision_criteria = " ".join(framework.get("decision_criteria", []))

        # Extract key differentiator content from nested JSONB
        key_diff_text = ""
        if "key_differentiators" in framework:
            for category, content in framework["key_differentiators"].items():
                if isinstance(content, dict):
                    key_diff_text += f" {category}: " + " ".join(str(v) for v in content.values())
                else:
                    key_diff_text += f" {category}: {content}"

        embedding_text = f"{context}. {key_diff_text}. Decision criteria: {decision_criteria}"

        framework["embedding"] = generate_embedding(embedding_text)

        # Insert framework
        result = supabase.table("comparison_frameworks").insert(framework).execute()

        if result.data:
            print(f"Inserted: {framework['comparison_context']}")
        else:
            print(f"Failed to insert: {framework['comparison_context']}")

    print(f"Inserted {len(frameworks)} comparison frameworks\n")


def main():
    """
    Main orchestration function to upload all product data.
    """
    print("\n" + "="*60)
    print("  Supabase Product Data Upload")
    print("="*60 + "\n")

    try:
        # Use hardcoded product map (products already inserted)
        product_map = PRODUCT_MAP

        # Step 8: Insert use case scenarios with embeddings
        insert_use_case_scenarios(product_map)

        # Step 9: Insert comparison frameworks with embeddings
        insert_comparison_frameworks(product_map)

        print("\n" + "="*60)
        print("  Upload Complete!")
        print("="*60 + "\n")

    except Exception as e:
        print(f"\nL Error during upload: {e}")
        raise


if __name__ == "__main__":
    main()