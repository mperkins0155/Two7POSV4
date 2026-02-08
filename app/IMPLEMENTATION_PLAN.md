# Multi-Tenant POS Platform - Complete Implementation Plan

## Executive Summary
A mobile-first, web-based Point of Sale platform similar to Square, designed for small business owners. The system supports multi-tenant architecture with role-based access control, comprehensive catalog management, Helcim payment integration, and basic reporting capabilities.

---

## 1. Database Schema Design

### 1.1 Core Tables

#### organizations
```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  business_type VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(255),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'US',
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  currency VARCHAR(3) DEFAULT 'USD',
  helcim_merchant_id VARCHAR(100),
  helcim_api_token TEXT,
  helcim_connected_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);
```

#### users
```sql
-- Managed by Lovable Auth, extended with:
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL REFERENCES auth.users(id),
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'cashier')),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  pin_code VARCHAR(6),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_org_id ON user_profiles(organization_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
```

#### items
```sql
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('product', 'service')),
  sku VARCHAR(100),
  base_price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  tax_rate DECIMAL(5,2) DEFAULT 0,
  category VARCHAR(100),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  track_inventory BOOLEAN DEFAULT false,
  current_stock INTEGER DEFAULT 0,
  low_stock_alert INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_items_org_id ON items(organization_id);
CREATE INDEX idx_items_category ON items(organization_id, category);
CREATE INDEX idx_items_active ON items(organization_id, is_active);
CREATE INDEX idx_items_sku ON items(organization_id, sku);
```

#### variants
```sql
CREATE TABLE variants (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  sku VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_variants_item_id ON variants(item_id);
```

#### modifier_groups
```sql
CREATE TABLE modifier_groups (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  selection_type VARCHAR(20) NOT NULL CHECK (selection_type IN ('choose_one', 'choose_many')),
  min_selections INTEGER DEFAULT 0,
  max_selections INTEGER,
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_modifier_groups_org_id ON modifier_groups(organization_id);
```

#### modifier_options
```sql
CREATE TABLE modifier_options (
  id SERIAL PRIMARY KEY,
  modifier_group_id INTEGER NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_modifier_options_group_id ON modifier_options(modifier_group_id);
```

#### item_modifier_groups
```sql
CREATE TABLE item_modifier_groups (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  modifier_group_id INTEGER NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(item_id, modifier_group_id)
);

CREATE INDEX idx_item_modifier_groups_item_id ON item_modifier_groups(item_id);
```

#### orders
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  cashier_id INTEGER REFERENCES user_profiles(id),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tip_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'cancelled')),
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_orders_org_id ON orders(organization_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(organization_id, status);
CREATE INDEX idx_orders_created_at ON orders(organization_id, created_at DESC);
CREATE INDEX idx_orders_cashier_id ON orders(cashier_id);
```

#### order_items
```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES items(id),
  variant_id INTEGER REFERENCES variants(id),
  item_name VARCHAR(255) NOT NULL,
  variant_name VARCHAR(255),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_item_id ON order_items(item_id);
```

#### order_item_modifiers
```sql
CREATE TABLE order_item_modifiers (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  modifier_option_id INTEGER REFERENCES modifier_options(id),
  modifier_name VARCHAR(255) NOT NULL,
  option_name VARCHAR(255) NOT NULL,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_item_modifiers_order_item_id ON order_item_modifiers(order_item_id);
```

#### payments
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  helcim_transaction_id VARCHAR(100),
  helcim_card_token VARCHAR(100),
  card_last_four VARCHAR(4),
  card_brand VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  error_message TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_org_id ON payments(organization_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_helcim_txn ON payments(helcim_transaction_id);
CREATE INDEX idx_payments_created_at ON payments(organization_id, created_at DESC);
```

### 1.2 Relationships Summary
- **organizations** → user_profiles (1:many)
- **organizations** → items (1:many)
- **organizations** → modifier_groups (1:many)
- **organizations** → orders (1:many)
- **items** → variants (1:many)
- **items** → item_modifier_groups → modifier_groups (many:many)
- **modifier_groups** → modifier_options (1:many)
- **orders** → order_items (1:many)
- **order_items** → order_item_modifiers (1:many)
- **orders** → payments (1:many)

---

## 2. Row Level Security (RLS) & Permissions Model

### 2.1 Multi-Tenant Isolation Strategy

All tables with `organization_id` must enforce RLS to ensure data isolation between tenants.

#### RLS Policy Pattern
```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Example: user_profiles RLS policy
CREATE POLICY "Users can view profiles in their organization"
  ON user_profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and managers can manage profiles"
  ON user_profiles FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

-- Example: items RLS policy
CREATE POLICY "Users can view items in their organization"
  ON items FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and managers can manage items"
  ON items FOR INSERT, UPDATE, DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

-- Example: orders RLS policy (all roles can create/view)
CREATE POLICY "Users can view orders in their organization"
  ON orders FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "All staff can create orders"
  ON orders FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and managers can update/delete orders"
  ON orders FOR UPDATE, DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );
```

### 2.2 Role-Based Permissions Matrix

| Resource | Owner | Manager | Cashier |
|----------|-------|---------|---------|
| Organization settings | Full | Read | None |
| User management | Full | Full | None |
| Items/Catalog | Full | Full | Read |
| Modifier groups | Full | Full | Read |
| Create orders | Yes | Yes | Yes |
| View orders | All | All | Own only* |
| Refund orders | Yes | Yes | No |
| Reports | Full | Full | Limited |
| Payment settings | Yes | No | No |

*Cashiers can view all orders in MVP; restrict to own orders in Phase 2 if needed.

### 2.3 Helper Functions for Permission Checks

```sql
-- Function to get user's role in their organization
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM user_profiles WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user is owner or manager
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
$$ LANGUAGE SQL SECURITY DEFINER;
```

---

## 3. Edge Functions List

All Edge Functions must be created in `app/backend/routers/` and follow the secure pattern of never exposing Helcim credentials to the client.

### 3.1 Helcim Connected Account Management

#### `POST /api/v1/helcim/onboard`
**Purpose**: Initiate Helcim connected account onboarding for a merchant.

**Request Body**:
```json
{
  "organization_id": 123,
  "business_name": "Coffee Shop",
  "business_email": "owner@coffeeshop.com"
}
```

**Server-side Logic**:
1. Verify user is owner of organization
2. Call Helcim API with partner-token to create connected account
3. Store `helcim_merchant_id` and encrypted `helcim_api_token` in organizations table
4. Return onboarding status

**Response**:
```json
{
  "success": true,
  "merchant_id": "helcim_merchant_123",
  "status": "onboarding_complete"
}
```

#### `POST /api/v1/helcim/webhook`
**Purpose**: Handle Helcim webhooks for connected account events.

**Logic**:
1. Verify webhook signature
2. Process events: account.approved, payment.completed, etc.
3. Update organizations or payments table accordingly

### 3.2 Payment Processing

#### `POST /api/v1/payments/initialize`
**Purpose**: Initialize HelcimPay.js checkout session server-side.

**Request Body**:
```json
{
  "order_id": 456,
  "amount": 25.50,
  "currency": "USD"
}
```

**Server-side Logic**:
1. Verify order belongs to user's organization
2. Retrieve merchant's `helcim_api_token` from organizations table
3. Call Helcim API to initialize checkout session
4. Return `checkoutToken` and `secretToken` for client-side HelcimPay.js

**Response**:
```json
{
  "checkoutToken": "abc123...",
  "secretToken": "xyz789..."
}
```

**Security**: Never expose `helcim_api_token` or `partner-token` to client.

#### `POST /api/v1/payments/validate`
**Purpose**: Validate payment response from HelcimPay.js and mark order as paid.

**Request Body**:
```json
{
  "order_id": 456,
  "transaction_id": "helcim_txn_123",
  "response_hash": "hash_from_helcim",
  "card_last_four": "4242",
  "card_brand": "Visa"
}
```

**Server-side Logic**:
1. Verify order belongs to user's organization
2. Retrieve `secretToken` from session/cache
3. Validate `response_hash` using secretToken (Helcim's hash validation)
4. Query Helcim API to confirm transaction status
5. Create payment record in payments table
6. Update order status to 'paid' and payment_status to 'completed'
7. Return success confirmation

**Response**:
```json
{
  "success": true,
  "payment_id": 789,
  "order_status": "paid"
}
```

### 3.3 Reporting

#### `GET /api/v1/reports/daily-sales`
**Purpose**: Get daily sales summary for the organization.

**Query Params**: `?date=2024-01-15`

**Server-side Logic**:
1. Verify user belongs to organization
2. Query orders and payments for specified date
3. Calculate totals, payment method breakdown, top items

**Response**:
```json
{
  "date": "2024-01-15",
  "total_sales": 1250.00,
  "order_count": 45,
  "payment_methods": {
    "card": 1100.00,
    "cash": 150.00
  },
  "top_items": [
    {"item_name": "Latte", "quantity": 30, "revenue": 150.00},
    {"item_name": "Croissant", "quantity": 25, "revenue": 125.00}
  ]
}
```

---

## 4. Frontend Routes & Pages

### 4.1 Mobile-First Design Principles
- Touch-optimized buttons (min 44x44px)
- Large, readable fonts (16px+ body text)
- Bottom navigation for primary actions
- Swipe gestures for cart management
- Responsive grid layouts (1 col mobile, 2-3 cols tablet, 4+ cols desktop)

### 4.2 Route Structure

#### Public Routes
- `/` - Landing page (marketing)
- `/login` - Login page
- `/signup` - Merchant signup
- `/auth/callback` - OAuth callback

#### Authenticated Routes (Require Login)

**Onboarding Flow** (First-time setup)
- `/onboarding/business` - Business information form
- `/onboarding/helcim` - Helcim connected account setup
- `/onboarding/catalog` - Add first items (optional)
- `/onboarding/complete` - Success & next steps

**POS Interface** (Primary cashier interface)
- `/pos` - Main POS screen
  - Product grid (left/top 70%)
  - Cart sidebar (right/bottom 30%)
  - Category filter tabs
  - Search bar
- `/pos/item/:id` - Item detail with variant/modifier selection modal
- `/pos/checkout` - Checkout screen with payment options
- `/pos/receipt/:orderId` - Digital receipt view

**Backoffice/Admin** (Owner & Manager)
- `/dashboard` - Overview dashboard with today's sales
- `/catalog` - Catalog management hub
  - `/catalog/items` - Items list with search/filter
  - `/catalog/items/new` - Create new item
  - `/catalog/items/:id/edit` - Edit item
  - `/catalog/modifiers` - Modifier groups list
  - `/catalog/modifiers/new` - Create modifier group
  - `/catalog/modifiers/:id/edit` - Edit modifier group
- `/orders` - Order history with filters
- `/orders/:id` - Order detail view
- `/reports` - Reporting dashboard
  - Daily sales chart
  - Payment method breakdown
  - Top items table
- `/settings` - Organization settings
  - `/settings/business` - Business info
  - `/settings/users` - User management
  - `/settings/payments` - Helcim integration status

### 4.3 UX Behaviors

#### POS Flow
1. **Product Selection**:
   - Tap product card → open variant/modifier modal if applicable
   - If no variants/modifiers → add directly to cart
   - Show quantity stepper in modal
   - "Add to Cart" button at bottom

2. **Cart Management**:
   - Swipe left on cart item → delete
   - Tap cart item → edit quantity/modifiers
   - Clear cart button with confirmation
   - Real-time subtotal/tax/total calculation

3. **Checkout**:
   - Optional customer info (name, email, phone)
   - Tip selection (%, custom, or none)
   - Payment method selection (Card via Helcim, Cash, Other)
   - If Card → open HelcimPay.js iframe modal
   - On success → show receipt, option to print/email
   - "New Order" button to reset POS

#### Catalog Management
1. **Item Creation**:
   - Basic info form (name, price, type, category)
   - Optional image upload
   - Add variants (if applicable)
   - Assign modifier groups (multi-select)
   - Save & continue or Save & close

2. **Modifier Group Creation**:
   - Name, selection type (choose-one/many)
   - Min/max selections
   - Add options with price adjustments
   - Drag-to-reorder options

---

## 5. Step-by-Step Milestone Plan

### Phase 1: MVP (Weeks 1-6)

#### Milestone 1.1: Foundation & Auth (Week 1)
**Deliverables**:
- Database schema created with all tables
- RLS policies implemented and tested
- Auth flow: signup, login, logout
- Basic organization creation

**Acceptance Criteria**:
- User can sign up and create an organization
- Multi-tenant data isolation verified (user A cannot see user B's data)
- Role assignment working (owner, manager, cashier)

#### Milestone 1.2: Catalog Management (Week 2)
**Deliverables**:
- Items CRUD (create, read, update, delete)
- Variants management
- Modifier groups & options CRUD
- Item-to-modifier-group associations

**Acceptance Criteria**:
- Owner/Manager can create items with variants
- Owner/Manager can create modifier groups with options
- Owner/Manager can assign modifier groups to items
- Cashier can view catalog (read-only)

#### Milestone 1.3: POS Interface (Week 3)
**Deliverables**:
- Product grid with category filtering
- Cart functionality (add, remove, update quantity)
- Variant/modifier selection modal
- Real-time price calculation with modifiers

**Acceptance Criteria**:
- Cashier can browse products by category
- Cashier can add items with variants/modifiers to cart
- Cart displays correct prices including modifiers
- Mobile-first UI is touch-friendly and responsive

#### Milestone 1.4: Helcim Integration Setup (Week 4)
**Deliverables**:
- Edge Function: `/api/v1/helcim/onboard`
- Edge Function: `/api/v1/payments/initialize`
- Edge Function: `/api/v1/payments/validate`
- Helcim webhook handler
- Secure credential storage in organizations table

**Acceptance Criteria**:
- Owner can complete Helcim connected account onboarding
- Helcim API tokens stored securely (never exposed to client)
- Payment initialization returns valid checkoutToken
- Payment validation correctly verifies hash and updates order status

#### Milestone 1.5: Checkout & Payment Flow (Week 5)
**Deliverables**:
- Checkout screen with customer info form
- Tip selection UI
- HelcimPay.js iframe integration
- Order creation with pending status
- Payment validation and order completion
- Digital receipt display

**Acceptance Criteria**:
- Cashier can complete checkout with card payment
- HelcimPay.js iframe opens and processes payment
- Order status updates to 'paid' after successful payment
- Receipt displays all order details correctly
- Cash payment option marks order as paid immediately

#### Milestone 1.6: Order History & Basic Reporting (Week 6)
**Deliverables**:
- Order history page with filters (date range, status)
- Order detail view
- Daily sales report
- Payment method breakdown
- Top items report

**Acceptance Criteria**:
- Users can view order history for their organization
- Daily sales report shows accurate totals
- Payment method breakdown matches actual payments
- Top items report ranks by quantity sold

### Phase 2: Enhancements (Weeks 7-10)

#### Milestone 2.1: Inventory Management (Week 7)
**Deliverables**:
- Track inventory toggle on items
- Stock level updates on order completion
- Low stock alerts
- Inventory adjustment UI

**Acceptance Criteria**:
- Stock decrements automatically when order is paid
- Low stock alert appears when threshold reached
- Manager can manually adjust inventory levels

#### Milestone 2.2: Appointments/Bookings (Week 8)
**Deliverables**:
- Service appointment scheduling
- Calendar view for bookings
- Customer booking portal (optional)
- Appointment reminders (email/SMS)

**Acceptance Criteria**:
- Staff can schedule appointments for services
- Calendar displays all bookings
- Customers receive confirmation emails

#### Milestone 2.3: Advanced Reporting (Week 9)
**Deliverables**:
- Sales trends over time (charts)
- Employee performance reports
- Customer analytics (repeat customers, average order value)
- Export to CSV/PDF

**Acceptance Criteria**:
- Reports display visual charts for trends
- Owner can view sales by employee
- Reports can be exported for external analysis

#### Milestone 2.4: Smart Terminal Integration (Week 10)
**Deliverables**:
- Terminal pairing flow
- Terminal payment initiation from POS
- Terminal status monitoring
- Receipt printing via terminal

**Acceptance Criteria**:
- POS can send payment request to paired terminal
- Terminal processes payment and returns result to POS
- Order completes after terminal payment success

---

## 6. Technical Implementation Notes

### 6.1 Security Best Practices
1. **Never expose Helcim credentials**: All API calls must go through Edge Functions
2. **Hash validation**: Always validate payment response hash server-side
3. **RLS enforcement**: Test multi-tenant isolation thoroughly
4. **Input validation**: Sanitize all user inputs on both client and server
5. **Rate limiting**: Implement rate limits on payment endpoints

### 6.2 Performance Optimization
1. **Database indexes**: All foreign keys and frequently queried columns indexed
2. **Lazy loading**: Load order history and reports on-demand
3. **Image optimization**: Compress and resize product images
4. **Caching**: Cache catalog data on client-side for faster POS performance

### 6.3 Mobile-First Considerations
1. **Offline mode** (Phase 3): Queue orders locally, sync when online
2. **Touch gestures**: Swipe to delete, long-press for options
3. **Large tap targets**: Minimum 44x44px for all interactive elements
4. **Responsive images**: Serve appropriately sized images for device

### 6.4 Testing Strategy
1. **Unit tests**: Test RLS policies, permission checks, price calculations
2. **Integration tests**: Test full payment flow end-to-end
3. **Multi-tenant tests**: Verify data isolation between organizations
4. **Role-based tests**: Verify each role's permissions
5. **Payment tests**: Use Helcim test credentials for payment flow testing

---

## 7. Acceptance Criteria Summary

### MVP Must-Haves
✅ Multi-tenant data isolation working correctly  
✅ Three roles (owner, manager, cashier) with correct permissions  
✅ Items with variants and modifiers can be created and managed  
✅ POS interface allows adding items to cart with variant/modifier selection  
✅ Helcim payment integration working end-to-end  
✅ Orders are created, paid, and stored correctly  
✅ Digital receipts display all order details  
✅ Basic reporting shows daily sales, payment methods, top items  
✅ Mobile-first UI is responsive and touch-friendly  

### Phase 2 Goals
✅ Inventory tracking with low stock alerts  
✅ Appointment scheduling for services  
✅ Advanced reporting with charts and trends  
✅ Smart terminal payment integration  

---

## 8. Risk Mitigation

### Technical Risks
1. **Helcim API changes**: Monitor Helcim developer docs for breaking changes
2. **Payment failures**: Implement retry logic and clear error messages
3. **Multi-tenant bugs**: Thorough RLS testing before production

### Business Risks
1. **Helcim approval delays**: Have fallback plan for manual onboarding
2. **Revenue share complexity**: Clearly document partner-token usage
3. **Scalability**: Plan for database sharding if >1000 organizations

---

## 9. Next Steps

1. **Review this plan** with stakeholders and Lovable team
2. **Set up development environment** with Lovable Cloud
3. **Create database schema** and test RLS policies
4. **Implement Milestone 1.1** (Foundation & Auth)
5. **Iterate based on feedback** after each milestone

---

## Appendix A: Helcim Integration Reference

### HelcimPay.js Client-Side Flow
```javascript
// 1. Initialize checkout (call Edge Function)
const { checkoutToken, secretToken } = await fetch('/api/v1/payments/initialize', {
  method: 'POST',
  body: JSON.stringify({ order_id: 123, amount: 25.50 })
}).then(r => r.json());

// 2. Open HelcimPay.js iframe
const helcimPay = new window.HelcimPay();
helcimPay.initialize(checkoutToken);

helcimPay.on('success', async (response) => {
  // 3. Validate payment server-side
  await fetch('/api/v1/payments/validate', {
    method: 'POST',
    body: JSON.stringify({
      order_id: 123,
      transaction_id: response.transactionId,
      response_hash: response.hash,
      card_last_four: response.cardLastFour,
      card_brand: response.cardBrand
    })
  });
});
```

### Helcim API Endpoints (Server-Side Only)
- **Create Connected Account**: `POST https://api.helcim.com/v2/partners/accounts`
- **Initialize Checkout**: `POST https://api.helcim.com/v2/payment-sessions`
- **Verify Transaction**: `GET https://api.helcim.com/v2/transactions/{id}`

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Status**: Ready for Implementation