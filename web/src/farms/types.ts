export type SizeUnit = 'acres' | 'hectares' | 'square_meters'
export type FarmType =
  | 'crop_farming'
  | 'livestock'
  | 'mixed_farming'
  | 'poultry'
  | 'fish_farming'
  | 'other'
export type CropType =
  | 'maize'
  | 'beans'
  | 'coffee'
  | 'matooke'
  | 'groundnuts'
  | 'millet'
  | 'rice'
  | 'cassava'
  | 'sweet_potato'
  | 'irish_potato'
  | 'sunflower'
  | 'sesame'
  | 'sorghum'
  | 'horticulture'
  | 'other'
export type CropStatus =
  | 'PLANNED'
  | 'PLANTED'
  | 'GROWING'
  | 'READY_FOR_HARVEST'
  | 'HARVESTED'
  | 'COMPLETED'
  | 'CANCELLED'
export type ActivityType =
  | 'land_preparation'
  | 'planting'
  | 'weeding'
  | 'fertilization'
  | 'pest_control'
  | 'irrigation'
  | 'harvesting'
  | 'other'

export const SIZE_UNITS: { value: SizeUnit; label: string }[] = [
  { value: 'acres', label: 'Acres' },
  { value: 'hectares', label: 'Hectares' },
  { value: 'square_meters', label: 'Square meters' },
]

export const FARM_TYPES: { value: FarmType; label: string }[] = [
  { value: 'crop_farming', label: 'Crop farming' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'mixed_farming', label: 'Mixed farming' },
  { value: 'poultry', label: 'Poultry farming' },
  { value: 'fish_farming', label: 'Fish farming' },
  { value: 'other', label: 'Other' },
]

export const CROP_TYPES: { value: CropType; label: string }[] = [
  { value: 'maize', label: 'Maize' },
  { value: 'beans', label: 'Beans' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'matooke', label: 'Matooke' },
  { value: 'groundnuts', label: 'Groundnuts' },
  { value: 'millet', label: 'Millet' },
  { value: 'rice', label: 'Rice' },
  { value: 'cassava', label: 'Cassava' },
  { value: 'sweet_potato', label: 'Sweet potato' },
  { value: 'irish_potato', label: 'Irish potato' },
  { value: 'sunflower', label: 'Sunflower' },
  { value: 'sesame', label: 'Sesame' },
  { value: 'sorghum', label: 'Sorghum' },
  { value: 'horticulture', label: 'Horticulture' },
  { value: 'other', label: 'Other' },
]

export const CROP_STATUSES: { value: CropStatus; label: string }[] = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'PLANTED', label: 'Planted' },
  { value: 'GROWING', label: 'Growing' },
  { value: 'READY_FOR_HARVEST', label: 'Ready for harvest' },
  { value: 'HARVESTED', label: 'Harvested' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'land_preparation', label: 'Land preparation' },
  { value: 'planting', label: 'Planting' },
  { value: 'weeding', label: 'Weeding' },
  { value: 'fertilization', label: 'Fertilization' },
  { value: 'pest_control', label: 'Pest control' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'harvesting', label: 'Harvesting' },
  { value: 'other', label: 'Other' },
]

export interface Farm {
  id: number
  owner: number
  name: string
  location: string
  district: string
  subcounty: string
  size: string
  size_unit: SizeUnit
  farm_type: FarmType
  description: string
  field_count: number
  created_at: string
  updated_at: string
}

export interface Field {
  id: number
  farm: number
  name: string
  size: string
  size_unit: SizeUnit
  description: string
  created_at: string
  updated_at: string
}

export interface Crop {
  id: number
  farm: number
  farm_name: string
  field_id: number
  field_name: string
  crop_type: CropType
  crop_type_display: string
  variety: string
  planting_date: string | null
  expected_harvest_date: string | null
  status: CropStatus
  status_display: string
  notes: string
  created_at: string
  updated_at: string
}

export interface CropActivity {
  id: number
  crop: number
  activity_type: ActivityType
  activity_type_display: string
  date: string
  description: string
  cost: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Paged<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface FarmPayload {
  name: string
  location: string
  district: string
  subcounty: string
  size: string
  size_unit: SizeUnit
  farm_type: FarmType
  description: string
}

export interface FieldPayload {
  name: string
  size: string
  size_unit: SizeUnit
  description: string
}

export interface CropPayload {
  field_id: number
  crop_type: CropType
  variety: string
  planting_date: string | null
  expected_harvest_date: string | null
  status: CropStatus
  notes: string
}

export interface CropActivityPayload {
  activity_type: ActivityType
  date: string
  description: string
  cost: string
  notes: string
}