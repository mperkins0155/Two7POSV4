export interface Payment {
  id: number;
  organization_id: number;
  order_id: number;
  amount: number;
  payment_method: string;
  helcim_transaction_id?: string;
  helcim_card_token?: string;
  card_last_four?: string;
  card_brand?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  error_message?: string;
  processed_at?: string;
  created_at: string;
}

export interface InitializePaymentRequest {
  order_id: number;
  amount: number;
  currency?: string;
}

export interface InitializePaymentResponse {
  checkoutToken: string;
  secretToken: string;
}

export interface ValidatePaymentRequest {
  order_id: number;
  transaction_id: string;
  response_hash: string;
  card_last_four: string;
  card_brand: string;
}

export interface ValidatePaymentResponse {
  success: boolean;
  payment_id: number;
  order_status: string;
}