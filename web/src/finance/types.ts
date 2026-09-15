export type { Paged } from '../farms/types'

export type ExpenseCategory =
  | 'Seeds'
  | 'Fertilizer'
  | 'Pesticides'
  | 'Labour'
  | 'Transport'
  | 'Equipment'
  | 'Feed'
  | 'Veterinary'
  | 'Land preparation'
  | 'Other'

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'Seeds', label: 'Seeds' },
  { value: 'Fertilizer', label: 'Fertilizer' },
  { value: 'Pesticides', label: 'Pesticides' },
  { value: 'Labour', label: 'Labour' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Equipment', label: 'Equipment' },
  { value: 'Feed', label: 'Feed' },
  { value: 'Veterinary', label: 'Veterinary' },
  { value: 'Land preparation', label: 'Land preparation' },
  { value: 'Other', label: 'Other' },
]

export type HarvestUnit = string

export interface Expense {
  id: number
  farm: number
  farm_name: string
  crop: number | null
  crop_name: string | null
  category: ExpenseCategory
  category_display: string
  amount: string
  date: string
  description: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Harvest {
  id: number
  farm: number
  farm_name: string
  crop: number
  crop_name: string
  quantity: string
  unit: string
  harvest_date: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Sale {
  id: number
  farmer: number
  farm: number
  farm_name: string
  crop: number | null
  crop_name: string | null
  quantity: string
  unit: string
  unit_price: string
  total_amount: string
  buyer_name: string
  buyer_contact: string
  sale_date: string
  notes: string
  created_at: string
  updated_at: string
}

export interface ProfitLoss {
  total_expenses: string
  total_revenue: string
  profit_loss: string
  expense_count: number
  sale_count: number
}

export interface ExpensePayload {
  farm: number
  crop: number | null
  category: ExpenseCategory
  amount: string
  date: string
  description: string
  notes: string
}

export interface HarvestPayload {
  farm: number
  crop: number
  quantity: string
  unit: string
  harvest_date: string
  notes: string
}

export interface SalePayload {
  farm: number
  crop: number | null
  quantity: string
  unit: string
  unit_price: string
  buyer_name: string
  buyer_contact: string
  sale_date: string
  notes: string
}

export interface ProfitLossFilters {
  farm_id?: string
  crop_id?: string
  start_date?: string
  end_date?: string
}
