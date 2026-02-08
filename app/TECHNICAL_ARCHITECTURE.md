# Technical Architecture Guide - Multi-Tenant POS Platform

## 1. Project Structure

```
app/
├── frontend/                    # React + shadcn-ui frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── pos/            # POS-specific components
│   │   │   │   ├── ProductGrid.tsx
│   │   │   │   ├── Cart.tsx
│   │   │   │   ├── ModifierModal.tsx
│   │   │   │   └── CheckoutScreen.tsx
│   │   │   ├── catalog/        # Catalog management components
│   │   │   │   ├── ItemForm.tsx
│   │   │   │   ├── ModifierGroupForm.tsx
│   │   │   │   └── ItemList.tsx
│   │   │   ├── orders/         # Order history components
│   │   │   │   ├── OrderList.tsx
│   │   │   │   ├── OrderDetail.tsx
│   │   │   │   └── Receipt.tsx
│   │   │   ├── reports/        # Reporting components
│   │   │   │   ├── DailySalesChart.tsx
│   │   │   │   ├── PaymentBreakdown.tsx
│   │   │   │   └── TopItemsTable.tsx
│   │   │   └── ui/             # shadcn-ui components
│   │   ├── pages/
│   │   │   ├── AuthCallback.tsx
│   │   │   ├── POS.tsx
│   │   │   ├── Catalog.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Settings.tsx
│   │   ├── lib/
│   │   │   ├── api.ts          # API client wrapper
│   │   │   ├── helcim.ts       # HelcimPay.js integration
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useOrganization.ts
│   │   │   ├── useCart.ts
│   │   │   └── usePermissions.ts
│   │   ├── types/
│   │   │   ├── catalog.ts
│   │   │   ├── order.ts
│   │   │   └── payment.ts
│   │   └── App.tsx
│   └── public/
│       └── assets/
├── backend/                     # FastAPI backend
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── organization.py
│   │   ├── user.py
│   │   ├── item.py
│   │   ├── order.py
│   │   └── payment.py
│   ├── routers/                 # API endpoints
│   │   ├── auth.py
│   │   ├── organizations.py
│   │   ├── items.py
│   │   ├── orders.py
│   │   ├── payments.py
│   │   ├── helcim.py
│   │   └── reports.py
│   ├── services/                # Business logic
│   │   ├── helcim_service.py
│   │   ├── order_service.py
│   │   ├── payment_service.py
│   │   └── report_service.py
│   ├── schemas/                 # Pydantic schemas
│   │   ├── item.py
│   │   ├── order.py
│   │   └── payment.py
│   ├── dependencies/
│   │   └── auth.py             # Auth dependencies
│   ├── main.py
│   └── requirements.txt
└── IMPLEMENTATION_PLAN.md
```

---

## 2. Database Schema Implementation

### 2.1 JSON Schema Definitions for BackendManager.create_tables

```json
[
  {
    "title": "organizations",
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "description": "Primary key, auto-increment"
      },
      "name": {
        "type": "string",
        "description": "Organization name"
      },
      "slug": {
        "type": "string",
        "description": "URL-friendly identifier"
      },
      "business_type": {
        "type": "string",
        "description": "Type of business"
      },
      "phone": {
        "type": "string"
      },
      "email": {
        "type": "string"
      },
      "address_line1": {
        "type": "string"
      },
      "address_line2": {
        "type": "string"
      },
      "city": {
        "type": "string"
      },
      "state": {
        "type": "string"
      },
      "postal_code": {
        "type": "string"
      },
      "country": {
        "type": "string",
        "default": "US"
      },
      "timezone": {
        "type": "string",
        "default": "America/New_York"
      },
      "currency": {
        "type": "string",
        "default": "USD"
      },
      "helcim_merchant_id": {
        "type": "string"
      },
      "helcim_api_token": {
        "type": "string"
      },
      "helcim_connected_at": {
        "type": "string",
        "format": "date-time"
      },
      "status": {
        "type": "string",
        "default": "active"
      },
      "created_at": {
        "type": "string",
        "format": "date-time"
      },
      "updated_at": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": ["id", "name", "slug"],
    "create_only": false
  },
  {
    "title": "user_profiles",
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "description": "Primary key, auto-increment"
      },
      "user_id": {
        "type": "string",
        "description": "User ID from auth system"
      },
      "organization_id": {
        "type": "integer",
        "description": "Foreign key to organizations"
      },
      "role": {
        "type": "string",
        "description": "owner, manager, or cashier"
      },
      "first_name": {
        "type": "string"
      },
      "last_name": {
        "type": "string"
      },
      "phone": {
        "type": "string"
      },
      "pin_code": {
        "type": "string"
      },
      "is_active": {
        "type": "boolean",
        "default": true
      },
      "created_at": {
        "type": "string",
        "format": "date-time"
      },
      "updated_at": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": ["id", "user_id", "organization_id", "role"],
    "create_only": true
  },
  {
    "title": "items",
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "description": "Primary key, auto-increment"
      },
      "organization_id": {
        "type": "integer",
        "description": "Foreign key to organizations"
      },
      "name": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "item_type": {
        "type": "string",
        "description": "product or service"
      },
      "sku": {
        "type": "string"
      },
      "base_price": {
        "type": "number"
      },
      "cost": {
        "type": "number"
      },
      "tax_rate": {
        "type": "number",
        "default": 0
      },
      "category": {
        "type": "string"
      },
      "image_url": {
        "type": "string"
      },
      "is_active": {
        "type": "boolean",
        "default": true
      },
      "track_inventory": {
        "type": "boolean",
        "default": false
      },
      "current_stock": {
        "type": "integer",
        "default": 0
      },
      "low_stock_alert": {
        "type": "integer"
      },
      "created_at": {
        "type": "string",
        "format": "date-time"
      },
      "updated_at": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": ["id", "organization_id", "name", "item_type", "base_price"],
    "create_only": true
  },
  {
    "title": "variants",
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "description": "Primary key, auto-increment"
      },
      "item_id": {
        "type": "integer",
        "description": "Foreign key to items"
      },
      "name": {
        "type": "string"
      },
      "price_adjustment": {
        "type": "number",
        "default": 0
      },
      "sku": {
        "type": "string"
      },
      "is_active": {
        "type": "boolean",
        "default": true
      },
      "sort_order": {
        "type": "integer",
        "default": 0
      },
      "created_at": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": ["id", "item_id", "name"],
    "create_only": true
  },
  {
    "title": "modifier_groups",
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "description": "Primary key, auto-increment"
      },
      "organization_id": {
        "type": "integer",
        "description": "Foreign key to organizations"
      },
      "name": {
        "type": "string"
      },
      "selection_type": {
        "type": "string",
        "description": "choose_one or choose_many"
      },
      "min_selections": {
        "type": "integer",
        "default": 0
      },
      "max_selections": {
        "type": "integer"
      },
      "is_required": {
        "type": "boolean",
        "default": false
      },
      "sort_order": {
        "type": "integer",
        "default": 0
      },
      "created_at": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": ["id", "organization_id", "name", "selection_type"],
    "create_only": true
  },
  {
    "title": "modifier_options",
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "description": "Primary key, auto-increment"
      },
      "modifier_group_id": {
        "type": "integer",
        "description": "Foreign key to modifier_groups"
      },
      "name": {
        "type": "string"
      },
      "price_adjustment": {
        "type": "number",
        "default": 0
      },
      "is_active": {
        "type": "boolean",
        "default": true
      },
      "sort_order": {
        "type": "integer",
        "default": 0
      },
      "created_at": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": ["id", "modifier_group_id", "name"],
    "create_only": true
  },
  {
    "title": "item_modifier_groups",
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "description": "Primary key, auto-increment"
      },
      "item_id": {
        "type": "integer",
        "description": "Foreign key to items"
      },
      "modifier_group_id": {
        "type": "integer",
        "description": "Foreign key to modifier_groups"
      },
      "sort_order": {
        "type": "integer",
        "default": 0
      },
      "created_at": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": ["id", "item_id", "modifier_group_id"],
    "create_only": true
  },
  {
    "title": "orders",
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "description": "Primary key, auto-increment"
      },
      "organization_id": {
        "type": "integer",
        "description": "Foreign key to organizations"
      },
      "order_number": {
        "type": "string",
        "description": "Unique order identifier"
      },
      "cashier_id": {
        "type": "integer",
        "description": "Foreign key to user_profiles"
      },
      "customer_name": {
        "type": "string"
      },
      "customer_email": {
        "type": "string"
      },
      "customer_phone": {
        "type": "string"
      },
      "subtotal": {
        "type": "number"
      },
      "tax_amount": {
        "type": "number",
        "default": 0
      },
      "discount_amount": {
        "type": "number",
        "default": 0
      },
      "tip_amount": {
        "type": "number",
        "default": 0
      },
      "total_amount": {
        "type": "number"
      },
      "status": {
        "type": "string",
        "default": "pending"
      },
      "payment_method": {
        "type": "string"
      },
      "payment_status": {
        "type": "string",
        "default": "unpaid"
      },
      "notes": {
        "type": "string"
      },
      "created_at": {
        "type": "string",
        "format": "date-time"
      },
      "completed_at": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": ["id", "organization_id", "order_number", "subtotal", "total_amount"],
    "create_only": true
  },
  {
    "title": "order_items",
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "description": "Primary key, auto-increment"
      },
      "order_id": {
        "type": "integer",
        "description": "Foreign key to orders"
      },
      "item_id": {
        "type": "integer",
        "description": "Foreign key to items"
      },
      "variant_id": {
        "type": "integer",
        "description": "Foreign key to variants"
      },
      "item_name": {
        "type": "string"
      },
      "variant_name": {
        "type": "string"
      },
      "quantity": {
        "type": "integer",
        "default": 1
      },
      "unit_price": {
        "type": "number"
      },
      "subtotal": {
        "type": "number"
      },
      "notes": {
        "type": "string"
      },
      "created_at": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": ["id", "order_id", "item_name", "quantity", "unit_price", "subtotal"],
    "create_only": true
  },
  {
    "title": "order_item_modifiers",
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "description": "Primary key, auto-increment"
      },
      "order_item_id": {
        "type": "integer",
        "description": "Foreign key to order_items"
      },
      "modifier_option_id": {
        "type": "integer",
        "description": "Foreign key to modifier_options"
      },
      "modifier_name": {
        "type": "string"
      },
      "option_name": {
        "type": "string"
      },
      "price_adjustment": {
        "type": "number",
        "default": 0
      },
      "created_at": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": ["id", "order_item_id", "modifier_name", "option_name"],
    "create_only": true
  },
  {
    "title": "payments",
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "description": "Primary key, auto-increment"
      },
      "organization_id": {
        "type": "integer",
        "description": "Foreign key to organizations"
      },
      "order_id": {
        "type": "integer",
        "description": "Foreign key to orders"
      },
      "amount": {
        "type": "number"
      },
      "payment_method": {
        "type": "string"
      },
      "helcim_transaction_id": {
        "type": "string"
      },
      "helcim_card_token": {
        "type": "string"
      },
      "card_last_four": {
        "type": "string"
      },
      "card_brand": {
        "type": "string"
      },
      "status": {
        "type": "string",
        "default": "pending"
      },
      "error_message": {
        "type": "string"
      },
      "processed_at": {
        "type": "string",
        "format": "date-time"
      },
      "created_at": {
        "type": "string",
        "format": "date-time"
      }
    },
    "required": ["id", "organization_id", "order_id", "amount", "payment_method"],
    "create_only": true
  }
]
```

### 2.2 Create Tables Command

After backend activation, create all tables using:

```python
await BackendManager.create_tables(list_of_json_schema='<paste the JSON above>')
```

---

## 3. Frontend Architecture Patterns

### 3.1 Authentication Hook

```typescript
// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { createClient } from '@metagptx/web-sdk';

const client = createClient();

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [role, setRole] = useState<'owner' | 'manager' | 'cashier' | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await client.auth.me();
      setUser(response.data);
      
      // Fetch user profile to get organization and role
      const profileResponse = await client.entities.user_profiles.query({
        query: { user_id: response.data.id },
        limit: 1
      });
      
      if (profileResponse.data.items.length > 0) {
        const profile = profileResponse.data.items[0];
        setRole(profile.role);
        
        // Fetch organization details
        const orgResponse = await client.entities.organizations.get({
          id: profile.organization_id
        });
        setOrganization(orgResponse.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    client.auth.toLogin();
  };

  const logout = async () => {
    await client.auth.logout();
    setUser(null);
    setOrganization(null);
    setRole(null);
  };

  return {
    user,
    organization,
    role,
    loading,
    isAuthenticated: !!user,
    isOwner: role === 'owner',
    isManager: role === 'manager',
    isCashier: role === 'cashier',
    isAdmin: role === 'owner' || role === 'manager',
    login,
    logout,
    checkAuth
  };
}
```

### 3.2 Cart Management Hook

```typescript
// src/hooks/useCart.ts
import { useState, useCallback } from 'react';

interface CartItem {
  id: string;
  itemId: number;
  itemName: string;
  variantId?: number;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  modifiers: Array<{
    modifierName: string;
    optionName: string;
    priceAdjustment: number;
  }>;
  subtotal: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    const id = `${item.itemId}-${item.variantId || 0}-${Date.now()}`;
    setItems(prev => [...prev, { ...item, id }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const subtotal = item.unitPrice * quantity;
        return { ...item, quantity, subtotal };
      }
      return item;
    }));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };
}
```

### 3.3 Helcim Payment Integration

```typescript
// src/lib/helcim.ts
import { createClient } from '@metagptx/web-sdk';

const client = createClient();

export async function processHelcimPayment(orderId: number, amount: number) {
  try {
    // 1. Initialize payment session server-side
    const initResponse = await client.apiCall.invoke({
      url: '/api/v1/payments/initialize',
      method: 'POST',
      data: { order_id: orderId, amount }
    });

    const { checkoutToken, secretToken } = initResponse.data;

    // 2. Load HelcimPay.js if not already loaded
    if (!window.HelcimPay) {
      await loadHelcimScript();
    }

    // 3. Initialize HelcimPay
    const helcimPay = new window.HelcimPay();
    
    return new Promise((resolve, reject) => {
      helcimPay.initialize(checkoutToken);

      helcimPay.on('success', async (response) => {
        try {
          // 4. Validate payment server-side
          const validateResponse = await client.apiCall.invoke({
            url: '/api/v1/payments/validate',
            method: 'POST',
            data: {
              order_id: orderId,
              transaction_id: response.transactionId,
              response_hash: response.hash,
              card_last_four: response.cardLastFour,
              card_brand: response.cardBrand
            }
          });

          resolve(validateResponse.data);
        } catch (error) {
          reject(error);
        }
      });

      helcimPay.on('error', (error) => {
        reject(new Error(error.message));
      });

      helcimPay.on('cancel', () => {
        reject(new Error('Payment cancelled by user'));
      });
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
}

function loadHelcimScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://secure.helcim.app/helcim-pay/services/start.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load HelcimPay.js'));
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    HelcimPay: any;
  }
}
```

---

## 4. Backend Architecture Patterns

### 4.1 Helcim Service

```python
# backend/services/helcim_service.py
import os
import httpx
import hashlib
from typing import Dict, Any

class HelcimService:
    def __init__(self):
        self.partner_token = os.environ.get("HELCIM_PARTNER_TOKEN")
        self.base_url = "https://api.helcim.com/v2"
    
    async def create_connected_account(self, business_name: str, business_email: str) -> Dict[str, Any]:
        """Create a connected account for a merchant"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/partners/accounts",
                headers={
                    "Authorization": f"Bearer {self.partner_token}",
                    "Content-Type": "application/json"
                },
                json={
                    "businessName": business_name,
                    "email": business_email
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def initialize_checkout(self, api_token: str, amount: float, currency: str = "USD") -> Dict[str, Any]:
        """Initialize a checkout session for a merchant"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/payment-sessions",
                headers={
                    "Authorization": f"Bearer {api_token}",
                    "Content-Type": "application/json"
                },
                json={
                    "amount": amount,
                    "currency": currency
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def verify_transaction(self, api_token: str, transaction_id: str) -> Dict[str, Any]:
        """Verify a transaction with Helcim"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/transactions/{transaction_id}",
                headers={
                    "Authorization": f"Bearer {api_token}"
                }
            )
            response.raise_for_status()
            return response.json()
    
    def validate_response_hash(self, secret_token: str, response_data: Dict[str, Any]) -> bool:
        """Validate the response hash from HelcimPay.js"""
        # Implement Helcim's hash validation logic
        # This is a placeholder - refer to Helcim docs for exact algorithm
        expected_hash = hashlib.sha256(
            f"{secret_token}{response_data.get('transactionId')}".encode()
        ).hexdigest()
        return expected_hash == response_data.get('hash')
```

### 4.2 Payment Router

```python
# backend/routers/payments.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime

from core.database import get_db
from dependencies.auth import get_current_user
from services.helcim_service import HelcimService
from models.order import Orders
from models.payment import Payments
from models.organization import Organizations
from schemas.auth import UserResponse

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])
helcim_service = HelcimService()

class InitializePaymentRequest(BaseModel):
    order_id: int
    amount: float
    currency: str = "USD"

class InitializePaymentResponse(BaseModel):
    checkoutToken: str
    secretToken: str

class ValidatePaymentRequest(BaseModel):
    order_id: int
    transaction_id: str
    response_hash: str
    card_last_four: str
    card_brand: str

class ValidatePaymentResponse(BaseModel):
    success: bool
    payment_id: int
    order_status: str

@router.post("/initialize", response_model=InitializePaymentResponse)
async def initialize_payment(
    data: InitializePaymentRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Initialize a Helcim checkout session"""
    try:
        # Verify order belongs to user's organization
        order = await db.get(Orders, data.order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Get organization's Helcim API token
        org = await db.get(Organizations, order.organization_id)
        if not org or not org.helcim_api_token:
            raise HTTPException(status_code=400, detail="Helcim not configured for this organization")
        
        # Initialize checkout with Helcim
        checkout_data = await helcim_service.initialize_checkout(
            api_token=org.helcim_api_token,
            amount=data.amount,
            currency=data.currency
        )
        
        return InitializePaymentResponse(
            checkoutToken=checkout_data["checkoutToken"],
            secretToken=checkout_data["secretToken"]
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize payment: {str(e)}")

@router.post("/validate", response_model=ValidatePaymentResponse)
async def validate_payment(
    data: ValidatePaymentRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Validate payment and update order status"""
    try:
        # Verify order belongs to user's organization
        order = await db.get(Orders, data.order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Get organization's Helcim API token
        org = await db.get(Organizations, order.organization_id)
        
        # Verify transaction with Helcim
        transaction = await helcim_service.verify_transaction(
            api_token=org.helcim_api_token,
            transaction_id=data.transaction_id
        )
        
        if transaction["status"] != "approved":
            raise HTTPException(status_code=400, detail="Payment not approved")
        
        # Create payment record
        payment = Payments(
            organization_id=order.organization_id,
            order_id=order.id,
            amount=order.total_amount,
            payment_method="card",
            helcim_transaction_id=data.transaction_id,
            card_last_four=data.card_last_four,
            card_brand=data.card_brand,
            status="completed",
            processed_at=datetime.now()
        )
        db.add(payment)
        
        # Update order status
        order.status = "paid"
        order.payment_status = "completed"
        order.payment_method = "card"
        order.completed_at = datetime.now()
        
        await db.commit()
        await db.refresh(payment)
        
        return ValidatePaymentResponse(
            success=True,
            payment_id=payment.id,
            order_status=order.status
        )
    
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to validate payment: {str(e)}")
```

---

## 5. Key Implementation Notes

### 5.1 Security Checklist
- ✅ Never expose `HELCIM_PARTNER_TOKEN` or merchant `helcim_api_token` to client
- ✅ All Helcim API calls must go through backend Edge Functions
- ✅ Validate payment response hash server-side
- ✅ Implement RLS policies on all tenant-scoped tables
- ✅ Use parameterized queries to prevent SQL injection
- ✅ Sanitize all user inputs

### 5.2 Performance Optimization
- ✅ Index all foreign keys and frequently queried columns
- ✅ Cache catalog data on client-side for faster POS
- ✅ Lazy load order history and reports
- ✅ Compress and optimize product images
- ✅ Use database connection pooling

### 5.3 Mobile-First UI Guidelines
- ✅ Minimum 44x44px touch targets
- ✅ Large, readable fonts (16px+ body text)
- ✅ Bottom navigation for primary actions
- ✅ Swipe gestures for cart management
- ✅ Responsive grid: 1 col mobile, 2-3 tablet, 4+ desktop

---

## 6. Testing Strategy

### 6.1 Multi-Tenant Isolation Tests
```typescript
// Test that User A cannot access User B's data
describe('Multi-tenant isolation', () => {
  it('should not allow cross-tenant data access', async () => {
    // Login as User A (Org 1)
    const userA = await loginAs('userA@org1.com');
    
    // Try to fetch items from Org 2
    const response = await client.entities.items.query({
      query: { organization_id: 2 }
    });
    
    // Should return empty or throw error
    expect(response.data.items).toHaveLength(0);
  });
});
```

### 6.2 Payment Flow Tests
```typescript
describe('Payment flow', () => {
  it('should complete end-to-end payment', async () => {
    // 1. Create order
    const order = await createTestOrder();
    
    // 2. Initialize payment
    const { checkoutToken } = await initializePayment(order.id, order.total_amount);
    expect(checkoutToken).toBeDefined();
    
    // 3. Simulate Helcim success response
    const mockResponse = {
      transactionId: 'test_txn_123',
      hash: 'valid_hash',
      cardLastFour: '4242',
      cardBrand: 'Visa'
    };
    
    // 4. Validate payment
    const result = await validatePayment(order.id, mockResponse);
    expect(result.success).toBe(true);
    expect(result.order_status).toBe('paid');
  });
});
```

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Status**: Ready for Implementation