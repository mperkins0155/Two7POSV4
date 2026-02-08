export interface Organization {
  id: number;
  name: string;
  slug: string;
  business_type?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  timezone: string;
  currency: string;
  helcim_merchant_id?: string;
  helcim_api_token?: string;
  helcim_connected_at?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  user_id: string;
  organization_id: number;
  role: 'owner' | 'manager' | 'cashier';
  first_name?: string;
  last_name?: string;
  phone?: string;
  pin_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: number;
  organization_id: number;
  name: string;
  description?: string;
  item_type: 'product' | 'service';
  sku?: string;
  base_price: number;
  cost?: number;
  tax_rate: number;
  category?: string;
  image_url?: string;
  is_active: boolean;
  track_inventory: boolean;
  current_stock: number;
  low_stock_alert?: number;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: number;
  item_id: number;
  name: string;
  price_adjustment: number;
  sku?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ModifierGroup {
  id: number;
  organization_id: number;
  name: string;
  selection_type: 'choose_one' | 'choose_many';
  min_selections: number;
  max_selections?: number;
  is_required: boolean;
  sort_order: number;
  created_at: string;
}

export interface ModifierOption {
  id: number;
  modifier_group_id: number;
  name: string;
  price_adjustment: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ItemModifierGroup {
  id: number;
  item_id: number;
  modifier_group_id: number;
  sort_order: number;
  created_at: string;
}