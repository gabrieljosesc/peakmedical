export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  description: string | null
  image_url: string | null
  created_at: string
}

export interface Brand {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  price: number
  sale_price: number | null
  sku: string | null
  stock_quantity: number | null
  is_in_stock: boolean
  category_id: string | null
  brand_id: string | null
  images: string[]
  featured: boolean
  created_at: string
  updated_at: string
  category?: Category
  brand?: Brand
}

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: Product
}

export interface WishlistItem {
  id: string
  product_id: string
  user_id: string
  created_at: string
  product: Product
}

export interface Order {
  id: string
  user_id: string
  reference_number: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  total: number
  shipping_address: ShippingAddress
  notes: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image: string | null
  quantity: number
  unit_price: number
  total_price: number
}

export interface ShippingAddress {
  first_name: string
  last_name: string
  company: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
}

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  company: string | null
  phone: string | null
  license_number: string | null
  created_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  image_url: string | null
  published: boolean
  created_at: string
}

export type SortOption = 'popularity' | 'latest' | 'price_asc' | 'price_desc'

export interface ShopFilters {
  category?: string
  brand?: string
  min_price?: number
  max_price?: number
  search?: string
  sort?: SortOption
  page?: number
}
