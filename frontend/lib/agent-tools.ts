import { tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
)

// ============================================================================
// LLM Tool Functions (Formatted for Agent Consumption)
// ============================================================================

export const getProductCatalog = tool({
    description: 'Get all available products with their basic information and base prices. Use this to show all available products to the customer, get an overview of the product catalog, or find product IDs for further detailed queries.',
    inputSchema: z.object({}),
    execute: async ({ }) => {
        try {
            // Fetch all products
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('*')
                .order('name')

            if (productsError) throw productsError

            // Fetch default variants with prices
            const { data: variants, error: variantsError } = await supabase
                .from('product_variants')
                .select('*')
                .eq('is_default', true)

            if (variantsError) throw variantsError

            // Create a mapping of product_id to base price
            const priceMap: Record<string, number> = {}
            variants?.forEach((v: any) => {
                priceMap[v.product_id] = v.base_price
            })

            // Format output
            let result = "# Product Catalog\n\n"
            products?.forEach((product: any) => {
                const basePrice = priceMap[product.id] || 'N/A'
                result += `**${product.name}**\n`
                result += `  - Price Tier: ${product.price_tier}\n`
                result += `  - Design Style: ${product.design_style}\n`
                result += `  - Base Price: $${basePrice}\n`
                result += `  - Product ID: ${product.id}\n\n`
            })

            return result
        } catch (error) {
            console.error('Error fetching product catalog:', error)
            return 'Error loading product catalog. Please try again.'
        }
    }
})

export const getProductDetails = tool({
    description: 'Get comprehensive details about a specific product including price tier, design style, variants, colors, and materials. Use this when users ask about a specific chair or want to know more details.',
    inputSchema: z.object({
        product_name: z.string().describe('Name of the product (e.g., "Aeron Chair", "Cosm Chair")')
    }),
    execute: async ({ product_name }: { product_name: string }) => {
        try {
            // Get product by name (case-insensitive)
            const { data: products, error: productError } = await supabase
                .from('products')
                .select('*')
                .ilike('name', product_name)
                .limit(1)

            if (productError) throw productError
            if (!products || products.length === 0) {
                return `Product '${product_name}' not found in catalog.`
            }

            const product = products[0]

            // Get variants
            const { data: variants } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', product.id)
                .order('base_price')

            // Get colors
            const { data: colors } = await supabase
                .from('product_colors')
                .select('*')
                .eq('product_id', product.id)
                .limit(5)

            // Get materials
            const { data: materials } = await supabase
                .from('product_materials')
                .select('*')
                .eq('product_id', product.id)
                .limit(5)

            // Format output
            let output = `**${product.name}**\n\n`

            if (product.price_tier) {
                output += `Price Tier: ${product.price_tier}\n`
            }
            if (product.design_style) {
                output += `Design Style: ${product.design_style}\n`
            }

            if (variants && variants.length > 0) {
                output += "\n**Available Variants:**\n"
                variants.forEach((v: any) => {
                    const defaultMarker = v.is_default ? " (default)" : ""
                    output += `- ${v.variant_name}: $${v.base_price}${defaultMarker}\n`
                })
            }

            if (colors && colors.length > 0) {
                output += "\n**Available Colors:**\n"
                colors.forEach((c: any) => {
                    const applies = c.applies_to ? ` (applies to: ${c.applies_to.join(', ')})` : ""
                    output += `- ${c.color_name}${applies}\n`
                })
            }

            if (materials && materials.length > 0) {
                output += "\n**Materials:**\n"
                materials.forEach((m: any) => {
                    const sustainable = m.is_sustainable ? " (sustainable)" : ""
                    output += `- ${m.component}: ${m.material}${sustainable}\n`
                })
            }

            return output
        } catch (error) {
            console.error('Error fetching product details:', error)
            return `Error loading details for '${product_name}'. Please try again.`
        }
    }
})

export const getAllBasePrices = tool({
    description: 'Get the base prices for all products in their default configurations. Use this when customer asks about pricing across multiple products, you need to compare prices between products, or customer has a budget constraint and wants to see options.',
    inputSchema: z.object({}),
    execute: async ({ }) => {
        try {
            // Fetch all products
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('*')

            if (productsError) throw productsError

            // Fetch default variants with prices
            const { data: variants, error: variantsError } = await supabase
                .from('product_variants')
                .select('*')
                .eq('is_default', true)

            if (variantsError) throw variantsError

            // Create a mapping of product_id to variant details
            const variantMap: Record<string, any> = {}
            variants?.forEach((v: any) => {
                variantMap[v.product_id] = v
            })

            // Sort by price
            const productsWithPrices: Array<{ product: any, variant: any }> = []
            products?.forEach((product: any) => {
                const variant = variantMap[product.id]
                if (variant) {
                    productsWithPrices.push({ product, variant })
                }
            })

            productsWithPrices.sort((a, b) => a.variant.base_price - b.variant.base_price)

            // Format output
            let result = "# Base Prices (Default Configuration)\n\n"
            productsWithPrices.forEach(({ product, variant }) => {
                result += `**${product.name}**\n`
                result += `  - Starting at: $${variant.base_price}\n`
                result += `  - Configuration: ${variant.variant_name}\n`
                result += `  - Price Tier: ${product.price_tier}\n\n`
            })

            return result
        } catch (error) {
            console.error('Error fetching base prices:', error)
            return 'Error loading base prices. Please try again.'
        }
    }
})

export const getProductUniqueFeatures = tool({
    description: 'Get the unique and standout features that differentiate this product. Use this when customer wants to know what makes a product special, you need to highlight key differentiators, or customer is comparing products and needs decision-making information.',
    inputSchema: z.object({
        product_name: z.string().describe('The exact name of the product')
    }),
    execute: async ({ product_name }: { product_name: string }) => {
        try {
            // Get product by name
            const { data: products, error: productError } = await supabase
                .from('products')
                .select('*')
                .ilike('name', product_name)
                .limit(1)

            if (productError) throw productError
            if (!products || products.length === 0) {
                return `Product '${product_name}' not found in catalog.`
            }

            const product = products[0]

            // Get features
            const { data: features, error: featuresError } = await supabase
                .from('product_features')
                .select('*')
                .eq('product_id', product.id)

            if (featuresError) throw featuresError

            let result = `# What Makes ${product.name} Unique\n\n`

            // Prioritize standard features (core to the product identity)
            const standardFeatures = features?.filter((f: any) => f.is_standard && f.description) || []
            const optionalFeatures = features?.filter((f: any) => !f.is_standard && f.description) || []

            if (standardFeatures.length > 0) {
                result += "**Core Features**\n"
                standardFeatures.forEach((feature: any) => {
                    result += `  • **${feature.feature_name}**: ${feature.description}\n`
                })
                result += "\n"
            }

            if (optionalFeatures.length > 0) {
                result += "**Customization Options**\n"
                optionalFeatures.forEach((feature: any) => {
                    result += `  • **${feature.feature_name}**: ${feature.description}\n`
                })
                result += "\n"
            }

            result += `\n*Design Philosophy: ${product.design_style} | ${product.brand_line}*`

            return result
        } catch (error) {
            console.error('Error fetching product features:', error)
            return `Error loading features for '${product_name}'. Please try again.`
        }
    }
})

export const getSizeRecommendationForUser = tool({
    description: 'Recommend the appropriate chair size based on user\'s body measurements. Use this when users provide their height/weight or ask which size fits them.',
    inputSchema: z.object({
        product_name: z.string().describe('Name of the product (e.g., "Aeron Chair")'),
        height_inches: z.number().describe('User\'s height in inches (e.g., 69 for 5\'9")'),
        weight_pounds: z.number().describe('User\'s weight in pounds (e.g., 180)')
    }),
    execute: async ({ product_name, height_inches, weight_pounds }: { product_name: string; height_inches: number; weight_pounds: number }) => {
        // Aeron sizing rules
        if (product_name.toLowerCase().includes('aeron')) {
            let recommendedSize = ''
            let explanation = ''

            if (height_inches < 64 || weight_pounds < 130) {  // 5'4" / 130 lbs
                recommendedSize = "Size A"
                explanation = 'Recommended for users under 5\'4" and 130 lbs'
            } else if (height_inches > 78 || weight_pounds > 230) {  // 6'6" / 230 lbs
                recommendedSize = "Size C"
                explanation = 'Recommended for users over 6\'6" or 230 lbs'
            } else {
                recommendedSize = "Size B"
                explanation = 'Recommended for users 5\'4" - 6\'6" and 130-230 lbs (fits 95% of people)'
            }

            const feet = Math.floor(height_inches / 12)
            const inches = height_inches % 12

            let output = `**Size Recommendation for ${product_name}**\n\n`
            output += `Based on your measurements:\n`
            output += `  Height: ${height_inches}" (${feet}'${inches}")\n`
            output += `  Weight: ${weight_pounds} lbs\n\n`
            output += `**Recommended: ${recommendedSize}**\n`
            output += `${explanation}`

            return output
        }

        // Other products don't have size variants
        const feet = Math.floor(height_inches / 12)
        const inches = height_inches % 12

        let output = `**Size Recommendation for ${product_name}**\n\n`
        output += `Based on your measurements:\n`
        output += `  Height: ${height_inches}" (${feet}'${inches}")\n`
        output += `  Weight: ${weight_pounds} lbs\n\n`
        output += `**Recommended: Standard (one size fits most)**\n`
        output += `${product_name} is designed to fit users 5'0" - 6'5"`

        return output
    }
})

export const getChairConfigurationPrice = tool({
    description: 'Calculate the total price for a specific chair configuration. Use this when users want to build a custom configuration or understand pricing.',
    inputSchema: z.object({
        product_name: z.string().describe('Name of the product (e.g., "Aeron Chair")'),
        variant_name: z.string().describe('Variant name (e.g., "Size B")'),
        addon_names: z.array(z.string()).describe('List of addon names (e.g., ["Adjustable Arms", "Forward Tilt"])')
    }),
    execute: async ({ product_name, variant_name, addon_names }: { product_name: string; variant_name: string; addon_names: string[] }) => {
        try {
            // Get product
            const { data: products, error: productError } = await supabase
                .from('products')
                .select('*')
                .ilike('name', product_name)
                .limit(1)

            if (productError) throw productError
            if (!products || products.length === 0) {
                return `Product '${product_name}' not found.`
            }

            const product = products[0]

            // Get variant
            const { data: variants, error: variantError } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', product.id)

            if (variantError) throw variantError

            const variant = variants?.find((v: any) => v.variant_name === variant_name)
            if (!variant) {
                return `Variant '${variant_name}' not found for ${product_name}.`
            }

            const basePrice = parseFloat(variant.base_price)

            // Get addons
            const { data: allAddons, error: addonsError } = await supabase
                .from('product_addons')
                .select('*')
                .eq('product_id', product.id)

            if (addonsError) throw addonsError

            const selectedAddons = allAddons?.filter((a: any) => addon_names.includes(a.addon_name)) || []

            let totalAddonPrice = 0
            const addonList: Array<{ name: string, category: string, price: number }> = []

            selectedAddons.forEach((addon: any) => {
                const addonPrice = parseFloat(addon.addon_price)
                addonList.push({
                    name: addon.addon_name,
                    category: addon.addon_category,
                    price: addonPrice
                })
                totalAddonPrice += addonPrice
            })

            // Format output
            let output = `**${product_name} - ${variant.variant_name}**\n\n`
            output += `Base Price: $${basePrice.toFixed(2)}\n\n`

            if (addonList.length > 0) {
                output += "Add-ons:\n"
                addonList.forEach((addon) => {
                    output += `  - ${addon.name}: +$${addon.price.toFixed(2)}\n`
                })
                output += "\n"
            }

            output += `**Total: $${(basePrice + totalAddonPrice).toFixed(2)}**`

            return output
        } catch (error) {
            console.error('Error calculating configuration price:', error)
            return `Error calculating price for ${product_name}. Please try again.`
        }
    }
})

export const displayProduct = tool({
    description: 'Display a product card in the chat when the user is ready to explore or purchase a specific product. Use this when the conversation has narrowed down to a specific product recommendation.',
    inputSchema: z.object({
        product_name: z.string().describe('Exact name of the product (e.g., "Aeron Chair", "Cosm Chair", "Eames Aluminum Group Chair", "Lino Chair")'),
        reason: z.string().describe('Brief reason why this product matches their needs (e.g., "Perfect for long sitting sessions with PostureFit support")')
    }),
    execute: async ({ product_name, reason }: { product_name: string; reason: string }) => {
        // This tool returns data that will be used to render the ProductCard component
        return {
            action: 'display_product',
            product_name,
            reason,
            message: `I've shown you the ${product_name}. Click the card above to view full details and customize your configuration.`
        }
    }
})

