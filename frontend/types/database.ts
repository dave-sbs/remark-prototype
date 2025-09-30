export interface Product {
  id: string
  name: string
  price_tier: string | null
  design_style: string | null
  brand_line: string | null
}

export interface ProductVariant {
  id: string
  product_id: string
  variant_type: string
  variant_name: string
  base_price: number
  is_default: boolean
}

export interface ProductAddon {
  id: string
  product_id: string
  addon_category: string
  addon_name: string
  addon_price: number
  is_default: boolean
  requires_variant_type: string | null
  incompatible_addons: string[] | null
}

export interface ProductColor {
  id: string
  product_id: string
  color_name: string
  color_code: string | null
  applies_to: string[] | null
}

export interface ProductMaterial {
  id: string
  product_id: string
  component: string
  material: string
  is_sustainable: boolean
  description: string | null
}

export interface ProductDimension {
  id: string
  product_id: string
  variant_name: string | null
  height_min: number | null
  height_max: number | null
  width_min: number | null
  width_max: number | null
  depth_min: number | null
  depth_max: number | null
  seat_height_min: number | null
  seat_height_max: number | null
  seat_depth: number | null
  arm_height_min: number | null
  arm_height_max: number | null
}

export interface ProductConfiguration {
  id: string
  product_id: string
  configuration_name: string
  variant_id: string
  addon_ids: string[] | null
  total_price: number
  popularity_rank: number | null
  description: string | null
}