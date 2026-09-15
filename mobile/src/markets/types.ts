export interface Paged<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Market {
  id: number;
  name: string;
  district: string;
  location: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketPrice {
  id: number;
  product: string;
  market: number;
  market_name: string;
  price: string;
  unit: string;
  price_date: string;
  source: string;
  created_at: string;
  updated_at: string;
}