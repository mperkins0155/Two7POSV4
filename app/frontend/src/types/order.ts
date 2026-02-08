export interface Order {
  id: number;
  organization_id: number;
  order_number: string;
  cashier_id?: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  tip_amount: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  payment_method?: string;
  payment_status: string;
  notes?: string;
  created_at: string;
  completed_at?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  item_id?: number;
  variant_id?: number;
  item_name: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  created_at: string;
}

export interface OrderItemModifier {
  id: number;
  order_item_id: number;
  modifier_option_id?: number;
  modifier_name: string;
  option_name: string;
  price_adjustment: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  itemId: number;
  itemName: string;
  variantId?: number;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  modifiers: Array<{
    modifierGroupId: number;
    modifierName: string;
    optionId: number;
    optionName: string;
    priceAdjustment: number;
  }>;
  subtotal: number;
  taxRate: number;
}