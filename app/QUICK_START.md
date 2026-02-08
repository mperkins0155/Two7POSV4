# Quick Start Guide - Multi-Tenant POS Platform

## Prerequisites
- Lovable Cloud account with backend enabled
- Helcim developer account (for payment integration)
- Node.js 18+ and pnpm installed locally (for testing)

---

## Step 1: Database Setup (Week 1, Day 1)

### 1.1 Create All Tables

Navigate to backend directory and create tables using the JSON schema from `TECHNICAL_ARCHITECTURE.md`:

```bash
cd /workspace/app/backend
```

Use `BackendManager.create_tables()` with the complete JSON schema array (12 tables total).

### 1.2 Verify Table Creation

Check that all tables were created:
```bash
# Use BackendManager.get_schemas() to list all tables
```

Expected tables:
- organizations
- user_profiles
- items
- variants
- modifier_groups
- modifier_options
- item_modifier_groups
- orders
- order_items
- order_item_modifiers
- payments

### 1.3 Insert Sample Data (Optional)

For development/testing, insert sample organizations and items:

```json
// Sample organization
{
  "name": "Demo Coffee Shop",
  "slug": "demo-coffee",
  "business_type": "restaurant",
  "email": "demo@coffeeshop.com",
  "currency": "USD",
  "status": "active"
}

// Sample items
[
  {
    "organization_id": 1,
    "name": "Latte",
    "item_type": "product",
    "base_price": 4.50,
    "category": "Coffee",
    "is_active": true
  },
  {
    "organization_id": 1,
    "name": "Croissant",
    "item_type": "product",
    "base_price": 3.50,
    "category": "Pastries",
    "is_active": true
  }
]
```

---

## Step 2: Authentication Setup (Week 1, Day 2-3)

### 2.1 Configure Auth Routes

Create auth routes in `frontend/src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthCallback from './pages/AuthCallback';
import Login from './pages/Login';
import POS from './pages/POS';
import { useAuth } from './hooks/useAuth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
        {/* Add more routes */}
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
}
```

### 2.2 Implement useAuth Hook

Copy the `useAuth` hook from `TECHNICAL_ARCHITECTURE.md` section 3.1.

### 2.3 Test Authentication

1. Run the app: `pnpm run dev`
2. Navigate to `/login`
3. Click login button → should redirect to Lovable Auth
4. After login → should redirect to `/auth/callback` → then to `/pos`
5. Verify user profile is fetched with organization and role

---

## Step 3: Helcim Integration (Week 4)

### 3.1 Set Up Helcim Developer Account

1. Sign up at https://www.helcim.com/developers
2. Create a test account
3. Get your Partner Token and test API credentials

### 3.2 Store Helcim Credentials

Use `SecretManager.collect_secret()` to store:
- `HELCIM_PARTNER_TOKEN` (for creating connected accounts)
- Test merchant `HELCIM_API_TOKEN` (for development)

### 3.3 Create Helcim Service

Create `backend/services/helcim_service.py` using the code from `TECHNICAL_ARCHITECTURE.md` section 4.1.

### 3.4 Create Payment Routes

Create `backend/routers/payments.py` using the code from `TECHNICAL_ARCHITECTURE.md` section 4.2.

### 3.5 Test Payment Flow

1. Create a test order in the database
2. Call `/api/v1/payments/initialize` with order_id and amount
3. Verify you receive `checkoutToken` and `secretToken`
4. Use Helcim's test card: `4111111111111111`
5. Call `/api/v1/payments/validate` with transaction details
6. Verify order status updates to 'paid'

---

## Step 4: Build POS Interface (Week 3)

### 4.1 Create Product Grid Component

```typescript
// frontend/src/components/pos/ProductGrid.tsx
import { useEffect, useState } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Card, CardContent } from '@/components/ui/card';

const client = createClient();

export function ProductGrid({ onAddToCart }) {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const response = await client.entities.items.query({
      query: { is_active: true },
      sort: 'category,name'
    });
    setItems(response.data.items);
  };

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(item => item.category === selectedCategory);

  return (
    <div>
      {/* Category filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button onClick={() => setSelectedCategory('all')}>All</button>
        {/* Add category buttons */}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map(item => (
          <Card key={item.id} onClick={() => onAddToCart(item)}>
            <CardContent>
              <h3>{item.name}</h3>
              <p>${item.base_price.toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 4.2 Create Cart Component

```typescript
// frontend/src/components/pos/Cart.tsx
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';

export function Cart({ onCheckout }) {
  const { items, subtotal, removeItem, updateQuantity } = useCart();

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Cart</h2>
      
      <div className="flex-1 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center mb-2">
            <div>
              <p>{item.itemName}</p>
              {item.variantName && <p className="text-sm text-gray-500">{item.variantName}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              <button onClick={() => removeItem(item.id)}>×</button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <Button onClick={onCheckout} className="w-full">
          Checkout
        </Button>
      </div>
    </div>
  );
}
```

### 4.3 Create POS Page

```typescript
// frontend/src/pages/POS.tsx
import { useState } from 'react';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';

export default function POS() {
  const { addItem } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (item) => {
    // If item has variants/modifiers, open modal
    // Otherwise, add directly to cart
    addItem({
      itemId: item.id,
      itemName: item.name,
      quantity: 1,
      unitPrice: item.base_price,
      modifiers: [],
      subtotal: item.base_price
    });
  };

  const handleCheckout = () => {
    navigate('/pos/checkout');
  };

  return (
    <div className="h-screen flex">
      <div className="flex-1 p-4">
        <ProductGrid onAddToCart={handleAddToCart} />
      </div>
      <div className="w-80 border-l p-4">
        <Cart onCheckout={handleCheckout} />
      </div>
    </div>
  );
}
```

---

## Step 5: Catalog Management (Week 2)

### 5.1 Create Item Form Component

```typescript
// frontend/src/components/catalog/ItemForm.tsx
import { useState } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const client = createClient();

export function ItemForm({ item, onSave, onCancel }) {
  const [formData, setFormData] = useState(item || {
    name: '',
    item_type: 'product',
    base_price: 0,
    category: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (item?.id) {
      await client.entities.items.update({
        id: item.id,
        data: formData
      });
    } else {
      await client.entities.items.create({
        data: formData
      });
    }
    
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Item Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      
      <Input
        label="Price"
        type="number"
        step="0.01"
        value={formData.base_price}
        onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
        required
      />
      
      <Input
        label="Category"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
      />
      
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
```

---

## Step 6: Testing Checklist

### 6.1 Multi-Tenant Isolation
- [ ] Create two test organizations
- [ ] Create users in each organization
- [ ] Verify User A cannot see User B's items
- [ ] Verify User A cannot see User B's orders

### 6.2 Role-Based Permissions
- [ ] Owner can create/edit/delete items ✓
- [ ] Manager can create/edit/delete items ✓
- [ ] Cashier can only view items (read-only) ✓
- [ ] Cashier can create orders ✓
- [ ] Cashier cannot access settings ✓

### 6.3 Payment Flow
- [ ] Initialize payment returns valid token ✓
- [ ] HelcimPay.js iframe opens successfully ✓
- [ ] Payment validation updates order status ✓
- [ ] Payment record is created in database ✓
- [ ] Receipt displays correct information ✓

### 6.4 POS Functionality
- [ ] Products display in grid ✓
- [ ] Category filtering works ✓
- [ ] Add to cart works ✓
- [ ] Cart quantity updates work ✓
- [ ] Checkout flow completes ✓
- [ ] Receipt is generated ✓

---

## Common Issues & Solutions

### Issue: "User profile not found"
**Solution**: Ensure user_profiles table has a record for the logged-in user with correct organization_id and role.

### Issue: "Helcim API token not found"
**Solution**: Verify organizations table has helcim_api_token populated for the test organization.

### Issue: "RLS policy blocking query"
**Solution**: Check that user_profiles table has correct user_id matching auth.uid().

### Issue: "Payment validation fails"
**Solution**: Verify secretToken is correctly stored and retrieved for hash validation.

---

## Next Steps After MVP

1. **Inventory Management** (Phase 2.1)
   - Add stock tracking to items
   - Implement low stock alerts
   - Create inventory adjustment UI

2. **Appointments** (Phase 2.2)
   - Add appointments table
   - Create calendar view
   - Implement booking flow

3. **Advanced Reporting** (Phase 2.3)
   - Add sales trend charts
   - Implement employee performance reports
   - Add export functionality

4. **Smart Terminal** (Phase 2.4)
   - Integrate terminal pairing
   - Implement terminal payment flow
   - Add receipt printing

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Status**: Ready for Development