'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  Product,
  ProductVariant,
  ProductAddon,
  ProductColor,
  ProductMaterial,
  ProductDimension
} from '@/types/database'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)

  const [addons, setAddons] = useState<ProductAddon[]>([])
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())

  const [colors, setColors] = useState<ProductColor[]>([])
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null)

  const [materials, setMaterials] = useState<ProductMaterial[]>([])
  const [dimensions, setDimensions] = useState<ProductDimension[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load products on mount
  useEffect(() => {
    loadProducts()
  }, [])

  // Load product details when selected
  useEffect(() => {
    if (selectedProduct) {
      loadProductDetails(selectedProduct.id)
    }
  }, [selectedProduct])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const loadProductDetails = async (productId: string) => {
    try {
      setLoading(true)

      // Load variants
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('base_price')

      if (variantsError) throw variantsError
      setVariants(variantsData || [])

      // Set default variant
      const defaultVariant = variantsData?.find(v => v.is_default) || variantsData?.[0] || null
      setSelectedVariant(defaultVariant)

      // Load addons
      const { data: addonsData, error: addonsError } = await supabase
        .from('product_addons')
        .select('*')
        .eq('product_id', productId)
        .order('addon_category, addon_name')

      if (addonsError) throw addonsError
      setAddons(addonsData || [])

      // Set default addons
      const defaultAddonIds = new Set(
        addonsData?.filter(a => a.is_default).map(a => a.id) || []
      )
      setSelectedAddons(defaultAddonIds)

      // Load colors
      const { data: colorsData, error: colorsError } = await supabase
        .from('product_colors')
        .select('*')
        .eq('product_id', productId)

      if (colorsError) throw colorsError
      setColors(colorsData || [])
      setSelectedColor(colorsData?.[0] || null)

      // Load materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('product_materials')
        .select('*')
        .eq('product_id', productId)

      if (materialsError) throw materialsError
      setMaterials(materialsData || [])

      // Load dimensions
      const { data: dimensionsData, error: dimensionsError } = await supabase
        .from('product_dimensions')
        .select('*')
        .eq('product_id', productId)

      if (dimensionsError) throw dimensionsError
      setDimensions(dimensionsData || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product details')
    } finally {
      setLoading(false)
    }
  }

  const toggleAddon = (addonId: string) => {
    const newSelected = new Set(selectedAddons)
    if (newSelected.has(addonId)) {
      newSelected.delete(addonId)
    } else {
      newSelected.add(addonId)
    }
    setSelectedAddons(newSelected)
  }

  const calculateTotalPrice = () => {
    if (!selectedVariant) return 0

    const basePrice = selectedVariant.base_price
    const addonsPrice = addons
      .filter(a => selectedAddons.has(a.id))
      .reduce((sum, addon) => sum + addon.addon_price, 0)

    return basePrice + addonsPrice
  }

  const getCurrentDimensions = () => {
    if (!selectedVariant) return null
    return dimensions.find(d => d.variant_name === selectedVariant.variant_name)
  }

  if (loading && products.length === 0) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-600">Loading products...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Chair Configuration Tester</h1>

        {/* Product Selection */}
        <section className="bg-white rounded border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Select Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`p-4 rounded border-2 text-left transition-colors ${selectedProduct?.id === product.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="font-semibold">{product.name}</div>
                {product.price_tier && (
                  <div className="text-sm text-gray-600 mt-1">{product.price_tier}</div>
                )}
              </button>
            ))}
          </div>
        </section>

        {selectedProduct && (
          <>
            {/* Variant Selection */}
            <section className="bg-white rounded border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">2. Select Size/Variant</h2>
              {variants.length === 0 ? (
                <p className="text-gray-500 text-sm">No variants available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {variants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-4 rounded border-2 text-left transition-colors ${selectedVariant?.id === variant.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="font-semibold">{variant.variant_name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        ${variant.base_price.toFixed(2)}
                      </div>
                      {variant.is_default && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                          Default
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Add-ons Selection */}
            <section className="bg-white rounded border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">3. Select Add-ons</h2>
              {addons.length === 0 ? (
                <p className="text-gray-500 text-sm">No add-ons available</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(
                    addons.reduce((acc, addon) => {
                      const category = addon.addon_category
                      if (!acc[category]) acc[category] = []
                      acc[category].push(addon)
                      return acc
                    }, {} as Record<string, ProductAddon[]>)
                  ).map(([category, categoryAddons]) => (
                    <div key={category} className="border-b pb-4 last:border-b-0">
                      <h3 className="font-semibold text-gray-700 mb-2">{category}</h3>
                      <div className="space-y-1">
                        {categoryAddons.map(addon => (
                          <label
                            key={addon.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedAddons.has(addon.id)}
                                onChange={() => toggleAddon(addon.id)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{addon.addon_name}</span>
                              {addon.is_default && (
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-semibold">
                              +${addon.addon_price.toFixed(2)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Colors */}
            <section className="bg-white rounded border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">4. Available Colors</h2>
              {colors.length === 0 ? (
                <p className="text-gray-500 text-sm">No colors available</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {colors.map(color => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color)}
                      className={`p-3 rounded border-2 text-left text-sm transition-colors ${selectedColor?.id === color.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="font-semibold">{color.color_name}</div>
                      {color.applies_to && (
                        <div className="text-xs text-gray-500 mt-1">
                          {color.applies_to.join(', ')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Materials */}
            <section className="bg-white rounded border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">5. Materials</h2>
              {materials.length === 0 ? (
                <p className="text-gray-500 text-sm">No materials data</p>
              ) : (
                <div className="space-y-2">
                  {materials.map(material => (
                    <div key={material.id} className="border-b pb-2 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-sm">{material.component}</span>
                          <span className="text-sm text-gray-600 ml-2">{material.material}</span>
                        </div>
                        {material.is_sustainable && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Sustainable
                          </span>
                        )}
                      </div>
                      {material.description && (
                        <p className="text-xs text-gray-500 mt-1">{material.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Dimensions */}
            {getCurrentDimensions() && (
              <section className="bg-white rounded border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">6. Dimensions ({selectedVariant?.variant_name})</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {(() => {
                    const dims = getCurrentDimensions()!
                    return (
                      <>
                        {dims.height_min !== null && (
                          <div>
                            <span className="text-gray-600">Height:</span>
                            <span className="ml-2 font-semibold">
                              {dims.height_min === dims.height_max
                                ? `${dims.height_min}"`
                                : `${dims.height_min}" - ${dims.height_max}"`}
                            </span>
                          </div>
                        )}
                        {dims.width_min !== null && (
                          <div>
                            <span className="text-gray-600">Width:</span>
                            <span className="ml-2 font-semibold">
                              {dims.width_min === dims.width_max
                                ? `${dims.width_min}"`
                                : `${dims.width_min}" - ${dims.width_max}"`}
                            </span>
                          </div>
                        )}
                        {dims.depth_min !== null && (
                          <div>
                            <span className="text-gray-600">Depth:</span>
                            <span className="ml-2 font-semibold">
                              {dims.depth_min === dims.depth_max
                                ? `${dims.depth_min}"`
                                : `${dims.depth_min}" - ${dims.depth_max}"`}
                            </span>
                          </div>
                        )}
                        {dims.seat_height_min !== null && (
                          <div>
                            <span className="text-gray-600">Seat Height:</span>
                            <span className="ml-2 font-semibold">
                              {dims.seat_height_min === dims.seat_height_max
                                ? `${dims.seat_height_min}"`
                                : `${dims.seat_height_min}" - ${dims.seat_height_max}"`}
                            </span>
                          </div>
                        )}
                        {dims.seat_depth !== null && (
                          <div>
                            <span className="text-gray-600">Seat Depth:</span>
                            <span className="ml-2 font-semibold">{dims.seat_depth}"</span>
                          </div>
                        )}
                        {dims.arm_height_min !== null && (
                          <div>
                            <span className="text-gray-600">Arm Height:</span>
                            <span className="ml-2 font-semibold">
                              {dims.arm_height_min === dims.arm_height_max
                                ? `${dims.arm_height_min}"`
                                : `${dims.arm_height_min}" - ${dims.arm_height_max}"`}
                            </span>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </section>
            )}

            {/* Price Summary */}
            <section className="bg-blue-50 rounded border-2 border-blue-500 p-6 sticky bottom-4">
              <h2 className="text-xl font-semibold mb-4">Total Price</h2>
              <div className="space-y-2 text-sm mb-4">
                {selectedVariant && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Base ({selectedVariant.variant_name}):</span>
                    <span className="font-semibold">${selectedVariant.base_price.toFixed(2)}</span>
                  </div>
                )}
                {addons.filter(a => selectedAddons.has(a.id)).map(addon => (
                  <div key={addon.id} className="flex justify-between">
                    <span className="text-gray-700">{addon.addon_name}:</span>
                    <span className="font-semibold">+${addon.addon_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-blue-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">Total:</span>
                  <span className="text-3xl font-bold text-blue-600">
                    ${calculateTotalPrice().toFixed(2)}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
