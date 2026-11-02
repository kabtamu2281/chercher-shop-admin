# 🏢 Chercher Building Material Retail Shop
### Enterprise Cloud Management ERP, Point of Sale & 3D Spatial WebXR Warehouse
*Developed by Kpax Technologies for Building-Materials Retailers & Wholesalers in Ethiopia*

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-purple.svg)](https://vitejs.dev/)
[![WebXR](https://img.shields.io/badge/WebXR-XR%20Blocks%200.24-orange.svg)](https://github.com/google-ar/xrblocks)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black.svg)](https://threejs.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20Android%20%26%20Desktop-teal.svg)](https://web.dev/progressive-web-apps/)
[![Docker](https://img.shields.io/badge/Docker-Compose%20Ready-2496ED.svg)](https://www.docker.com/)

---

## 🌟 Executive Summary

**Chercher Building Material Retail Shop** is a commercial software suite designed specifically for building-materials retailers, hardware shops, cement distributors, steel suppliers, paint stores, and construction wholesale yards in Ethiopia.

The application combines a high-speed **Progressive Web App (PWA)** for rapid counter checkout, customer credit management, and inventory auditing with an immersive **3D WebXR Virtual Yard** that allows managers and contractors to spatially inspect palletized building materials (Dangote cement, deformed steel rebar, galvanized roofing sheets, and Kadisco paint drums).

---

## 🚀 Quick Launch & Testing Guide

You can run and test the complete application locally or deploy it to a Linux VPS in minutes:

### 1. Local Development (Node.js)

```bash
# 1. Clone the repository
git clone https://github.com/kabtamu2281/chercher-shop-admin.git
cd chercher-shop-admin

# 2. Install dependencies
npm install

# 3. Create environment file (optional for Gemini Lyria music)
cp .env.example .env

# 4. Start the development server
npm run dev
```

Visit **`http://localhost:3000`** in Google Chrome or any modern browser.

---

### 2. Run with Docker Compose (Production Ready)

The repository includes a multi-stage `Dockerfile` and `docker-compose.yml` pre-configured with PostgreSQL and Nginx reverse proxy:

```bash
# Launch containerized app + PostgreSQL 16 database
docker-compose up -d --build

# View container logs
docker-compose logs -f app

# Check health endpoint
curl http://localhost:3000/api/health
```

---

### 3. Install as a Mobile App (Android PWA)

1. Open the app URL in **Google Chrome** on your Android smartphone, tablet, or Galaxy XR device.
2. Tap the **3-dots menu** (top right) in Chrome.
3. Select **"Install app"** or **"Add to Home Screen"**.
4. The **Chercher Shop** icon will appear on your app launcher with fullscreen standalone mode and offline caching support!

---

## 📦 What's Inside: Core Features

### 1. Comprehensive Inventory Catalog (~150 SKUs across 14 Categories)
Pre-populated with real hardware stock from the Chercher catalog:
- **Paints & Thinner**: Antirust Panda (1kg, gallon), Jet enamel (black, gold, silver, white), Nifas Silk Simba/Super/SP, Sofatin series (212, 301, 316, 409, 420, 508, 620, 710, 820), Rodas varnish, stainers, thinner solvents.
- **Glue, Putty & Sealants**: Damac glue, Rodas glue, wall putty (*mastish* 1/4kg, 1/2kg, 1kg, 1.5kg), Ferostibo, silicone sealant tubes, wood fix adhesives.
- **Cement, Gypsum & Plaster**: Dangote OPC 42.5R (50kg bags), Mugher PPC 32.5N, Gypsum powder (*ganch*), Kalki lime (25kg), Korkoro plaster.
- **Structural Steel & Roofing**: Deformed rebar 12mm & 14mm Grade 60 (quintals), corrugated galvanized iron roofing sheets (G32, 3m).
- **Fasteners & Hardware**: Construction wire nails (6cm, 7cm, 8cm, 10cm, 12cm, 14cm), Gypsum drywall screws, iron screws (1/2" to 3"), bolts, nuts, and washers.
- **Electrical & Plumbing**: CHNT circuit breakers, sockets, switches, PPR pipes & fittings, PVC pipes, gate valves, Teflon tape.
- **Dedicated Shelf Audit Tool**: Toggle the **"Needs Name Review"** button to isolate memo/photo items requiring physical shelf verification.

### 2. Camera Barcode & QR Code Scanner (Warehouse & POS)
- **Real-Time Camera Scanner**: Uses the device camera via HTML5 `getUserMedia` with an animated laser reticle and audio confirmation beep.
- **Dual Engine Architecture**: Fast hardware-accelerated detection with Android Chrome's native `BarcodeDetector` API + pure JavaScript universal fallback via `jsQR` (works on Android XR, iOS, Android, and desktop webcams).
- **Two Operational Modes**:
  - **Stock Lookup & Recount**: Aim at any shelf label or packaging barcode to instantly view available stock, cost price, selling price, and execute an immediate physical inventory recount with delta adjustment buttons (`[-10]`, `[-1]`, `[+1]`, `[+10]`, `[+50]`).
  - **POS Quick Add to Cart**: Continuous hands-free scanning that immediately adds scanned items to the active cashier cart with audible feedback.
- **Printable Shelf QR Tags**: One-click generation of high-resolution QR codes and printable 90mm shelf tags with Ethiopian Birr pricing, product SKU, and barcode.
- **Camera Controls**: Includes flashlight/torch toggle, front/rear camera switching, and desktop test simulation chips.

### 3. Point of Sale (POS) & Thermal Receipts
- High-speed cashier checkout with instant SKU barcode / name filtering.
- Ethiopian payment channels: **Cash**, **telebirr**, **CBE Birr**, **Awash Bank**, **Bank Transfer**, and **Customer Credit**.
- Hard zero-stock protection with an administrator override for approved backorders.
- **Printable 80mm & 58mm Thermal Receipts** formatted for standard receipt printers with Ethiopian Tax details (TIN & VAT) and custom headers/footers in Amharic & English.

### 3. Customer Accounts & Credit Ledger (Accounts Receivable)
- Customer profiles with credit limits, telephone numbers, and transaction history.
- Automatic verification blocking sales if a customer exceeds their allocated credit ceiling.
- Partial debt collection with instant payment receipts.

### 4. Supplier Management & Payables (Accounts Payable)
- Purchase order registration and stock receipt recording with automatic Weighted Average Cost (WAC) recalculation.
- Supplier liability tracking and payment settlement records.

### 5. Financial Management & Daily Closing
- Real-time Gross Profit, Operating Expenses, and Net Profit calculated using GAAP-compliant cost-of-goods-sold (COGS) methodology.
- **Daily Financial Closing Register**: Compares calculated drawer cash and telebirr collections against actual physical cash counts to detect cashier shortages/overages.

### 6. Web Admin Console & Data Operations
- **Store Profile Management**: Configure store name, legal TIN, VAT registration, address, and telephone contacts.
- **POS Hardware Setup**: Choose between 80mm standard or 58mm compact thermal roll widths, configure receipt return policies, and toggle audio fanfare alerts.
- **Backup & Restore**:
  - **Export JSON**: One-click download of all 150 products, customers, suppliers, and sales invoices.
  - **Restore JSON**: Instant restoration from backup file.
  - **Seed Realistic Test Sales**: Instantly populates dashboard charts and reports for evaluation.
  - **Factory Reset**: Restores original ~150-item catalog at any time.

### 7. Trilingual Localization
- Full UI translation across **English**, **Amharic (አማርኛ)**, and **Afaan Oromo**.
- Ethiopian currency formatting (`ETB`) with proper decimal precision.

### 8. 3D WebXR Warehouse & Audio Studio
- **Spatial Yard**: Physical 3D models of cement bag pallets, steel rebar racks, corrugated roofing stacks, and paint drums.
- **Spatial Status Card**: Floating warehouse KPI monitor showing live stock valuation and low-stock reorder alerts.
- **3D POS Dispenser**: Walk up to physical building material pallets and fulfill orders directly in VR/AR.
- **Chercher Audio Jukebox**: Built-in Ethiopian pentatonic synthesizer (Tizita and celebratory fanfare) + server-side Gemini Lyria-3 API for authentic store atmosphere.

---

## 🏗️ Architecture & Technology Stack

```
chercher-shop-admin/
├── index.html                   # HTML5 Entry Point with PWA tags & Google Fonts
├── metadata.json                # Project configuration & Gemini API capabilities
├── package.json                 # Dependencies (Three.js, XR Blocks, Tailwind)
├── tsconfig.json                # Strict TypeScript configuration
├── vite.config.ts               # Vite server + Server-side Gemini API middleware
├── public/
│   ├── manifest.json            # PWA Web App Manifest
│   ├── icon.svg                 # Scalable application icon
│   └── sw.js                    # Offline Service Worker & cache strategy
├── src/
│   ├── index.ts                 # Main bootstrap mounting PWA & XR Warehouse
│   ├── index.css                # Global styling, 80mm print rules & XR overlays
│   ├── data/
│   │   └── chercherStock.ts     # ~150 Hardware items parsed across 14 categories
│   ├── types/
│   │   └── index.ts             # Domain models (Product, Sale, Customer, etc.)
│   ├── services/
│   │   ├── db.ts                # ACID in-memory & LocalStorage database engine
│   │   └── musicService.ts      # WebAudio Ethiopian synthesizer & Lyria client
│   ├── ui/
│   │   └── pwaApp.ts            # Responsive 2D PWA console & Web Admin UI
│   ├── utils/
│   │   └── i18n.ts              # Trilingual translations (EN, AM, OM)
│   └── xr/
│       └── WarehouseScene.ts    # 3D Three.js & XR Blocks palletized warehouse
└── docker/
    ├── Dockerfile               # Node.js production container build
    ├── docker-compose.yml       # App + PostgreSQL 16 Compose file
    ├── schema.sql               # Normalized multi-tenant PostgreSQL schema
    ├── backup.sh                # Automated daily database backup script
    └── restore.sh               # Automated database restore script
```

---

## 🧪 Testing Checklist for QA & Reviewers

| Module | Test Action | Expected Result |
| :--- | :--- | :--- |
| **Point of Sale** | Select *Antirust Panda 1kg*, tender via *telebirr*, complete sale | Stock decrements, invoice generated, thermal receipt printable |
| **Zero-Stock Hard Stop** | Attempt to ring up 10,000 bags of cement | Sale blocked with error unless Admin Override is toggled |
| **Customer Credit Limit** | Select *Teklehaimanot Construction*, ring credit sale exceeding limit | Sale blocked with clear notification of balance vs limit |
| **Inventory Audit** | Open Inventory tab, toggle *"Needs Name Review"* | Displays items requiring physical store audit |
| **Web Admin Console** | Go to *Web Admin*, click *"Seed Test Sales"* | Dashboard charts immediately update with realistic sales |
| **Database Backup** | Click *"Export Backup (JSON)"* | Downloads `.json` snapshot of entire store database |
| **Language Switcher** | Click *አማ* or *OM* in top navigation bar | All labels, tables, and units instantly localize |
| **3D XR Warehouse** | Click *"Enter 3D XR Warehouse"* (or launch on Galaxy XR) | 3D concrete warehouse floor, pallets, and spatial cards render |
| **Audio Studio** | Open *Audio Studio* or click *"Play Store Music"* | Synthesizes authentic Ethiopian Tizita pentatonic scale |

---

## 📄 License & Credits

Developed by **Kpax Technologies** for **Chercher Building Material Retail Shop** (Addis Ababa, Ethiopia).  
Licensed under the **MIT License**.