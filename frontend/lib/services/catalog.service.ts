import { createClient } from '@supabase/supabase-js'

/**
 * Service for loading the product catalog for the AI context
 */
export class CatalogService {
    private supabase

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!
        )
    }

    async loadProductCatalog(): Promise<string> {
        try {
            console.log('[CatalogService] 📦 Loading product catalog...')

            const { data: products, error: productsError } = await this.supabase
                .from('products')
                .select('*')
                .order('name')

            if (productsError) {
                throw new Error(`Failed to fetch products: ${productsError.message}`)
            }

            const { data: variants, error: variantsError } = await this.supabase
                .from('product_variants')
                .select('*')
                .eq('is_default', true)

            if (variantsError) {
                throw new Error(`Failed to fetch variants: ${variantsError.message}`)
            }

            // Build price map
            const priceMap: Record<string, number> = {}
            variants?.forEach((v: any) => {
                priceMap[v.product_id] = v.base_price
            })

            // Format catalog
            let catalog = "# Product Catalog\n\n"
            products?.forEach((product: any) => {
                const basePrice = priceMap[product.id] || 'N/A'
                catalog += `**${product.name}**\n`
                catalog += `  - Price Tier: ${product.price_tier}\n`
                catalog += `  - Design Style: ${product.design_style}\n`
                catalog += `  - Base Price: $${basePrice}\n`
                catalog += `  - Product ID: ${product.id}\n\n`
            })

            const formattedCatalog = `\n\n# PRODUCT CATALOG (Your Context)\n\n${catalog}\n\n---\n\n`

            console.log('[CatalogService] ✅ Product catalog loaded successfully')
            return formattedCatalog

        } catch (error) {
            console.error('[CatalogService] ❌ Error loading catalog:', error)
            return '\n\n# PRODUCT CATALOG\n\nError loading catalog\n\n---\n\n'
        }
    }
}
