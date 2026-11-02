# 📖 Chercher Building Material Retail Shop — Comprehensive System Documentation

## Table of Contents
1. [System Overview & Business Objectives](#1-system-overview--business-objectives)
2. [Software Architecture & Core Components](#2-software-architecture--core-components)
3. [Database Design & Normalization](#3-database-design--normalization)
4. [Inventory Management & Ethiopian Unit Conversions](#4-inventory-management--ethiopian-unit-conversions)
5. [Point of Sale (POS) & Receipt Printing](#5-point-of-sale-pos--receipt-printing)
6. [Accounting, COGS & Daily Financial Closing](#6-accounting-cogs--daily-financial-closing)
7. [Customer Credit Ledger & Supplier Liabilities](#7-customer-credit-ledger--supplier-liabilities)
8. [Web Admin Console, Backups & Disaster Recovery](#8-web-admin-console-backups--disaster-recovery)
9. [Role-Based Access Control (RBAC) Matrix](#9-role-based-access-control-rbac-matrix)
10. [WebXR 3D Spatial Warehouse Guide](#10-webxr-3d-spatial-warehouse-guide)
11. [Ethio Telecom VPS & Docker Deployment Guide](#11-ethio-telecom-vps--docker-deployment-guide)

---

## 1. System Overview & Business Objectives
Chercher Building Material Retail Shop is an enterprise management platform custom-tailored to the operational realities of building materials merchants in Ethiopia. It is designed to handle high transaction volumes, diverse physical packaging units (from individual screws to truckloads of sand and rebar bundles), flexible payment channels (telebirr, CBE Birr, Awash Bank, cash, and contractor credit), and strict Ethiopian tax compliance (TIN, VAT invoices, and withholding tax).

---

## 2. Software Architecture & Core Components
The application employs an isomorphic dual-experience design:

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser / Client                      │
│                                                             │
│   ┌─────────────────────────────┐  ┌────────────────────┐   │
│   │     2D Responsive PWA       │  │  3D WebXR Studio   │   │
│   │ (POS, Inventory, Financials,│  │(Palletized Stacks, │   │
│   │    Web Admin, Reports)      │  │  Spatial Kiosks)   │   │
│   └──────────────┬──────────────┘  └─────────┬──────────┘   │
│                  │                           │              │
│                  ▼                           ▼              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │        DatabaseService & Transaction Manager        │   │
│   │     (ACID In-Memory & LocalStorage Persistence)     │   │
│   └──────────────────────────────┬──────────────────────┘   │
└──────────────────────────────────┼──────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server / Backend Proxy                   │
│                                                             │
│   ┌─────────────────────────────┐  ┌────────────────────┐   │
│   │   Vite / Node HTTP Server   │  │   Gemini Lyria-3   │   │
│   │   (/api/health, /api/music) │  │  Music Generation  │   │
│   └──────────────┬──────────────┘  └────────────────────┘   │
│                  │                                          │
│                  ▼                                          │
│   ┌─────────────────────────────┐                           │
│   │    PostgreSQL 16 Database   │                           │
│   │  (schema.sql Multi-Tenant)  │                           │
│   └─────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Design & Normalization

The production relational schema (`/docker/schema.sql`) implements fully normalized, auditable tables:

- **`tenants`**: Supports future multi-branch or SaaS expansion with strict isolation.
- **`users`**: Role-based authentication (`owner`, `manager`, `cashier`, `inventory`).
- **`categories`**: 14 building material sectors.
- **`products`**: Product codes, names, cost prices, selling prices, stock quantities, and minimum reorder thresholds.
- **`unit_conversions`**: Configurable multipliers (e.g. `1 quintal = 100 kg`, `1 tonne = 10 quintals`, `1 truckload = 16 m³`).
- **`sales` & `sale_items`**: Complete snapshot of unit cost, selling price, and subtotal per line to ensure historical margin preservation.
- **`purchases` & `purchase_items`**: Inbound supplier deliveries with auto-updating weighted average cost.
- **`customers`**: Profiles with contact numbers, addresses, credit limits, and live outstanding debt balances.
- **`suppliers`**: Profiles with bank account numbers and accounts payable balances.
- **`payments`**: Bidirectional payment records (customer debt repayments & supplier settlements).
- **`expenses`**: Operating expenditures categorized by rent, wages, transport/fuel, utilities, maintenance, loading/unloading.
- **`stock_movements`**: Immutable audit ledger recording every change in inventory level.
- **`audit_logs`**: Security logs recording user actions, IP addresses, and timestamps.
- **`daily_closings`**: End-of-day cash reconciliation records.

---

## 4. Inventory Management & Ethiopian Unit Conversions

The system natively supports traditional and metric building material units:

| Unit Name | Symbol | Description | Standard Conversion |
| :--- | :--- | :--- | :--- |
| **Piece / Each** | `pc` | Single unit (paints, brushes, locks, breakers) | Base unit |
| **Bag** | `bag` | 50kg cement, gypsum, lime bags | 1 bag = 50 kg |
| **Kilogram** | `kg` | Nails, ferostibo, loose chemicals | Base metric |
| **Quintal** | `quintal` | Ethiopian commercial standard (100kg) | 1 quintal = 100 kg |
| **Tonne** | `tonne` | Metric tonne for bulk rebar & cement | 1 tonne = 10 quintals = 1,000 kg |
| **Metre** | `m` | Rebar length, electrical wire, PPR pipes | Base linear metric |
| **Litre** | `L` | Thinner, solvent, liquid sealants | Base liquid metric |
| **Gallon** | `gallon` | Paint gallons (Panda, Jet, Nifas Silk) | Standard commercial paint bucket |
| **Box / Carton** | `carton` | Ceramic tiles, screws, electrical switches | Multi-piece packaged box |
| **Truckload** | `truckload` | Sino truck for aggregates & sand | 1 truckload ≈ 16 cubic metres |

---

## 5. Point of Sale (POS) & Receipt Printing

### Cashier Checkout Flow
1. Cashier scans barcode or types product name in the search box.
2. Items are added to the active cart with live subtotal calculation.
3. Cashier selects the customer:
   - Walk-in Cash Customer.
   - Registered Credit Contractor.
4. Cashier selects payment method: **Cash**, **telebirr**, **CBE Birr**, **Bank Transfer**, or **Credit**.
5. The system performs validation:
   - Checks stock availability. If stock is zero, sale is blocked unless **Admin Override** is enabled.
   - If Credit is chosen, checks that `current_balance + new_sale <= credit_limit`.
6. Sale completes: Stock is decremented, stock movement is recorded, and invoice is finalized.

### 80mm & 58mm Thermal ESC/POS Receipt Output
The invoice modal includes browser print stylesheet optimizations (`@media print` in `src/index.css`) designed to print directly onto thermal roll paper without dialog margins:
- Store Name in Amharic & English.
- Official TIN & VAT registration numbers.
- Itemized lines with quantity, unit, price, and subtotal.
- Tax breakdown and payment method.
- Return & exchange policy footer.

---

## 6. Accounting, COGS & Daily Financial Closing

### Cost of Goods Sold (COGS) Calculation
Profit is not calculated simply as cash received minus cash paid. When an item is sold:
$$\text{Line Gross Profit} = (\text{Selling Price} - \text{Weighted Average Cost}) \times \text{Quantity}$$
$$\text{Net Profit} = \sum \text{Gross Profit} - \sum \text{Operating Expenses}$$

### Daily Financial Closing Protocol
At the end of every business day:
1. Manager opens the **Financials & Daily Closing** tab.
2. System calculates expected cash from register sales vs credit collections.
3. Cashier enters the physical counted banknotes.
4. Discrepancies (shortages or overages) are automatically calculated and permanently recorded.
5. Daily closing is signed off and logged in the immutable audit log.

---

## 7. Customer Credit Ledger & Supplier Liabilities

### Accounts Receivable (Customer Credit)
Contractors often purchase building materials on credit with payment scheduled post-construction.
- Every registered customer has an authorized **Credit Limit**.
- When an invoice is ringed with an unpaid balance, the customer's balance increases.
- Debt collection payments can be recorded with partial settlements.

### Accounts Payable (Suppliers)
- Inbound goods increase supplier liabilities.
- Outbound bank transfers, CBE Birr, or cash disbursements reduce supplier balances.

---

## 8. Web Admin Console, Backups & Disaster Recovery

The **Web Admin** tab provides management controls:
- **Business Profile Editor**: Edit store name, TIN, VAT, address, phone, and official receipt headers/footers.
- **One-Click JSON Backup**: Exports complete store database to `chercher_erp_backup_YYYY-MM-DD.json`.
- **JSON Restore**: Upload any previously downloaded backup to restore the complete store state.
- **Factory Reset**: Restores original ~150-SKU Chercher Hardware catalog.
- **Test Sales Generator**: Seeds realistic test sales for quick review of dashboard charts.

---

## 9. Role-Based Access Control (RBAC) Matrix

| Feature / Tab | Owner / Admin | Store Manager | Cashier | Inventory Officer |
| :--- | :---: | :---: | :---: | :---: |
| **POS Checkout** | ✅ | ✅ | ✅ | ❌ |
| **Allow Negative Stock Override** | ✅ | ✅ | ❌ | ❌ |
| **Inventory Recount / Adjust** | ✅ | ✅ | ❌ | ✅ |
| **Register Supplier Purchases** | ✅ | ✅ | ❌ | ✅ |
| **View Profit & Margins** | ✅ | ✅ | ❌ | ❌ |
| **Record Operating Expenses** | ✅ | ✅ | ❌ | ❌ |
| **Daily Financial Closing** | ✅ | ✅ | ❌ | ❌ |
| **Web Admin & Database Backups** | ✅ | ❌ | ❌ | ❌ |
| **Audit Log Inspection** | ✅ | ✅ | ❌ | ❌ |

---

## 10. WebXR 3D Spatial Warehouse Guide

Chercher Shop integrates a real-time 3D spatial yard built with **Three.js** and **XR Blocks 0.24**:
- **Pallet Stacks**:
  - Dangote 42.5R Cement (stacked 50kg kraft paper bags on timber pallets).
  - Deformed Steel Rebar 12mm (steel A-frame bundle with Grade 60 tag).
  - Corrugated Galvanized Roofing Sheets (G32 corrugated stack).
  - Kadisco Paints & Thinner (white & blue barrels with red lids).
- **Spatial UI Cards**:
  - **Yard Status Monitor**: Displays live valuation, sales today, and low-stock count.
  - **3D POS Dispenser**: Direct fulfillment buttons deducting items from inventory in real time.
  - **Chercher Audio Jukebox**: Procedural Ethiopian pentatonic music (Tizita and fanfare) + Gemini Lyria-3 integration.

---

## 11. Ethio Telecom VPS & Docker Deployment Guide

To deploy on an Ubuntu Linux Virtual Private Server (VPS) hosted by Ethio telecom:

```bash
# 1. Update VPS and install Docker
ssh root@your-vps-ip
apt update && apt upgrade -y
apt install -y docker.io docker-compose git

# 2. Clone repository
git clone https://github.com/kabtamu2281/chercher-shop-admin.git /opt/chercher-shop
cd /opt/chercher-shop

# 3. Configure production environment
cp .env.example .env
nano .env

# 4. Launch multi-container services
docker-compose up -d --build

# 5. Verify system health
docker ps
curl http://localhost:3000/api/health
```

Automated daily backup cron job:
```bash
# Add to crontab for daily automated PostgreSQL backup at 11:30 PM
30 23 * * * /opt/chercher-shop/docker/backup.sh /opt/backups/chercher >> /var/log/chercher_backup.log 2>&1
```

---

## 12. Camera QR Code & Barcode Scanner Architecture

### 12.1 Hardware Camera Access & Video Pipeline
The scanner uses HTML5 `navigator.mediaDevices.getUserMedia`:
- Ideal resolution: `1280x720` (720p HD)
- Facing mode: `environment` (rear warehouse camera) with fallback to `user`
- Video tag: configured with `playsinline`, `autoplay`, and `muted` for Android Chrome and iOS Safari compatibility

### 12.2 Dual Detection Engine
1. **Native Chromium `BarcodeDetector`**: Detected via `'BarcodeDetector' in window`. Offers hardware-accelerated detection of `qr_code`, `code_128`, `code_39`, `ean_13`, `ean_8`, and `upc_a`.
2. **Pure JavaScript `jsQR` Engine**: Draws current video frame into an off-screen `<canvas>` with `willReadFrequently: true` and processes raw pixel data. Provides 100% universal compatibility across devices where native BarcodeDetector is disabled.

### 12.3 Audio Feedback & Scan Confirmation
Uses the Web Audio API (`AudioContext`) to generate a synthesized 2-tone frequency chirp (1760 Hz to 2349 Hz with exponential decay) so warehouse staff receive instant auditory confirmation even in noisy yard environments without needing external audio asset downloads.

### 12.4 Workflow Modes
- **Warehouse Recount Mode**: Scans SKU or barcode, displays full product details, current stock balance, cost, and selling price. Staff can tap quick delta buttons (`-10`, `-1`, `+1`, `+10`, `+50`) or enter physical inventory count, add an audit reason, and tap "Save Stock" to immediately commit the adjustment to the stock movement ledger.
- **POS Continuous Scan Mode**: Keeps camera active with a 1.6-second deduplication cooldown, automatically adding items to the cashier basket and updating totals on the fly.
- **Shelf QR Label Generator**: Renders 90mm printable shelf tags containing generated QR code (encoding JSON SKU, name, unit, and ETB price) and barcodes for shelf mounting.

