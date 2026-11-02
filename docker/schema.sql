-- KPAX SHOP: PRODUCTION POSTGRESQL DATABASE SCHEMA
-- Developed by Kpax Technologies for Ethiopian Building Materials Retailers & Wholesalers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Businesses (Tenant Isolation for future multi-shop subscription)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    tin_number VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    currency VARCHAR(10) DEFAULT 'ETB',
    timezone VARCHAR(50) DEFAULT 'Africa/Addis_Ababa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users and Roles
CREATE TYPE user_role_enum AS ENUM ('owner', 'manager', 'cashier', 'inventory');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role_enum NOT NULL DEFAULT 'cashier',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Units of Measurement & Conversions
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_am VARCHAR(100),
    name_om VARCHAR(100)
);

CREATE TABLE unit_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    from_unit VARCHAR(50) NOT NULL,
    to_unit VARCHAR(50) NOT NULL,
    conversion_factor NUMERIC(14, 4) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Product Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_am VARCHAR(255),
    name_om VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    bank_account_info TEXT,
    balance_payable NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Customers (Credit Ledger)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    credit_limit NUMERIC(14, 2) DEFAULT 0.00,
    outstanding_balance NUMERIC(14, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Products (Inventory)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    name_am VARCHAR(255),
    name_om VARCHAR(255),
    brand VARCHAR(100),
    unit VARCHAR(50) NOT NULL,
    purchase_price NUMERIC(14, 2) NOT NULL,
    selling_price NUMERIC(14, 2) NOT NULL,
    quantity_available NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    min_stock_threshold NUMERIC(14, 2) NOT NULL DEFAULT 10.00,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_business_sku UNIQUE (business_id, sku)
);

-- 8. Sales & Invoices
CREATE TYPE payment_method_enum AS ENUM ('cash', 'telebirr', 'cbe_birr', 'bank_transfer', 'credit');
CREATE TYPE sale_status_enum AS ENUM ('completed', 'partial', 'returned', 'cancelled');

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subtotal NUMERIC(14, 2) NOT NULL,
    discount NUMERIC(14, 2) DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL,
    cost_of_goods_sold NUMERIC(14, 2) NOT NULL,
    gross_profit NUMERIC(14, 2) NOT NULL,
    paid_amount NUMERIC(14, 2) NOT NULL,
    due_amount NUMERIC(14, 2) NOT NULL,
    payment_method payment_method_enum NOT NULL,
    is_credit BOOLEAN DEFAULT FALSE,
    status sale_status_enum DEFAULT 'completed',
    notes TEXT,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity NUMERIC(14, 2) NOT NULL,
    unit_price NUMERIC(14, 2) NOT NULL,
    cost_price NUMERIC(14, 2) NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL
);

-- 9. Purchases & Goods Inbound
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    total_amount NUMERIC(14, 2) NOT NULL,
    paid_amount NUMERIC(14, 2) NOT NULL,
    due_amount NUMERIC(14, 2) NOT NULL,
    payment_method payment_method_enum NOT NULL,
    status VARCHAR(50) DEFAULT 'received',
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity NUMERIC(14, 2) NOT NULL,
    unit_cost NUMERIC(14, 2) NOT NULL,
    total_cost NUMERIC(14, 2) NOT NULL
);

-- 10. Operating Expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    paid_by VARCHAR(255) NOT NULL,
    payment_method payment_method_enum NOT NULL,
    receipt_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Customer & Supplier Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(50) NOT NULL, -- 'customer_payment' or 'supplier_payment'
    party_id UUID NOT NULL,
    party_name VARCHAR(255) NOT NULL,
    reference_id VARCHAR(100),
    amount NUMERIC(14, 2) NOT NULL,
    payment_method payment_method_enum NOT NULL,
    recorded_by VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Stock Movements (Inventory Ledger)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    movement_type VARCHAR(50) NOT NULL, -- 'sale', 'purchase', 'adjustment_in', 'adjustment_out', 'return'
    quantity_change NUMERIC(14, 2) NOT NULL,
    new_balance NUMERIC(14, 2) NOT NULL,
    reference_id VARCHAR(100),
    reason TEXT,
    performed_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Audit Logs (Security & Compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Daily Financial Closing Register
CREATE TABLE daily_closings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    closing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    closed_by VARCHAR(255) NOT NULL,
    opening_cash NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cash_sales NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    telebirr_sales NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    bank_sales NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    credit_sales NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    customer_collections NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    supplier_payments NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    expenses_paid NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    expected_cash_in_drawer NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    actual_cash_in_drawer NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cash_variance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_gross_profit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    net_profit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
