export type { Paged } from '../farms/types'

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'CANCELLED'
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'

export interface ProduceCategory {
  id: number
  name: string
  slug: string
  description: string
}

export interface Listing {
  id: number
  farmer: number
  farmer_name: string
  product_name: string
  category: number
  category_name: string
  quantity: string
  quantity_remaining: string
  unit: string
  price_per_unit: string
  location: string
  district: string
  available_from: string
  description: string
  image: string | null
  status: ListingStatus
  status_display: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  listing: number
  listing_product_name: string
  listing_unit: string
  listing_price_per_unit: string
  listing_quantity_remaining: string
  buyer: number
  buyer_name: string
  quantity: string
  total_price: string
  status: OrderStatus
  status_display: string
  notes: string
  farmer_notes: string
  created_at: string
  updated_at: string
}

export interface ListingPayload {
  product_name: string
  category: number
  quantity: string
  unit: string
  price_per_unit: string
  location: string
  district: string
  available_from: string
  description: string
  status: ListingStatus
}

export interface OrderPayload {
  listing: number
  quantity: string
  notes: string
}

export interface OrderUpdatePayload {
  status?: OrderStatus
  notes?: string
  farmer_notes?: string
}

export const LISTING_STATUSES: { value: ListingStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CANCELLED', label: 'Cancelled' },
]
