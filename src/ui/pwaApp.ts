import { DatabaseService } from '../services/db';
import { MusicService } from '../services/musicService';
import { QrScannerService } from '../services/qrScannerService';
import { Customer, Expense, PaymentMethod, Product, Sale, Supplier, SupportedLanguage, UserRole } from '../types';
import { formatETB, translations } from '../utils/i18n';
import { InstallAppButton } from './components/InstallAppButton';

export class PwaApp {
  private db = DatabaseService.getInstance();
  private music = MusicService.getInstance();
  private qrScanner = QrScannerService.getInstance();
  private installButton = new InstallAppButton();

  private container: HTMLElement;
  private currentTab:
    | 'dashboard'
    | 'pos'
    | 'inventory'
    | 'purchases'
    | 'customers'
    | 'suppliers'
    | 'financials'
    | 'music'
    | 'users'
    | 'admin'
    | 'audit'
    | 'deployment' = 'dashboard';

  private lang: SupportedLanguage = 'en';
  private posCart: { product: Product; quantity: number; unitPrice: number }[] = [];
  private posSelectedCustomerId = '';
  private posCustomerName = '';
  private posPaymentMethod: PaymentMethod = 'cash';
  private posPaidAmount = 0;
  private posDiscount = 0;
  private posNotes = '';
  private posAllowNegative = false;
  private posSearchQuery = '';
  private posSelectedCategory = 'all';

  private invSearchQuery = '';
  private invSelectedCategory = 'all';
  private invOnlyNeedsReview = false;

  private selectedSaleForModal: Sale | null = null;
  private modalState:
    | 'none'
    | 'receipt'
    | 'addProduct'
    | 'adjustStock'
    | 'addExpense'
    | 'collectCustomer'
    | 'paySupplier'
    | 'dailyClosing'
    | 'qrScanner'
    | 'productQrTag' = 'none';
  private activeProductToAdjust: Product | null = null;
  private activeCustomerToCollect: Customer | null = null;
  private activeSupplierToPay: Supplier | null = null;

  // QR Scanner & Shelf Label State
  private qrScannerMode: 'inventory' | 'pos' = 'inventory';
  private qrLastScannedProduct: Product | null = null;
  private qrScanError: string | null = null;
  private qrScanFeedback: string | null = null;
  private activeProductForQrTag: Product | null = null;
  private generatedQrDataUrl: string = '';

  // PWA Installation & Offline State
  private isPwaInstalled: boolean = false;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private showIosInstallGuide: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;

    // Detect standalone PWA mode
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      this.isPwaInstalled = isStandalone;

      window.addEventListener('pwa-prompt-available', () => {
        this.render();
      });

      window.addEventListener('pwa-app-installed', () => {
        this.isPwaInstalled = true;
        this.showToast('Chercher Shop installed to your device successfully!', 'check_circle');
        this.render();
      });

      window.addEventListener('appinstalled', () => {
        this.isPwaInstalled = true;
        (window as any).deferredPrompt = null;
        this.showToast('Chercher Shop installed to your device successfully!', 'check_circle');
        this.render();
      });

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.showToast('Back online. Data synchronized with local storage.', 'wifi');
        this.render();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.showToast('You are offline. Full offline local mode active.', 'cloud_off');
        this.render();
      });
    }
  }

  public init() {
    this.render();
  }

  private t() {
    return translations[this.lang];
  }

  public render() {
    const t = this.t();
    const role = this.db.currentUser.role;
    const metrics = this.db.getDashboardMetrics();

    this.container.innerHTML = `
      <div class="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
        
        <!-- SIDEBAR NAVIGATION (Desktop) -->
        <aside class="hidden md:flex flex-col w-72 bg-slate-900 border-r border-slate-800 shrink-0 select-none">
          <!-- Logo & Branding -->
          <div class="p-5 border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <span class="material-symbols-outlined text-2xl">apartment</span>
              </div>
              <div>
                <h1 class="font-bold text-lg leading-tight tracking-wide text-white flex items-center gap-1.5">
                  CHERCHER SHOP
                  <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                </h1>
                <p class="text-xs text-sky-400 font-medium">Building Material Retail</p>
              </div>
            </div>
          </div>

          <!-- Active Business Badge -->
          <div class="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 text-slate-300">
              <span class="material-symbols-outlined text-amber-400 text-sm">storefront</span>
              <span class="font-medium truncate max-w-[130px]">Chercher Retail Counter</span>
            </div>
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">ETB</span>
          </div>

          <!-- Navigation Links -->
          <nav class="flex-1 overflow-y-auto p-3 space-y-1">
            ${this.renderNavItem('dashboard', 'dashboard', t.nav.dashboard)}
            ${this.renderNavItem('pos', 'point_of_sale', t.nav.pos, 'text-emerald-400')}
            ${this.renderNavItem('inventory', 'inventory_2', t.nav.inventory, '', metrics.lowStockCount > 0 ? String(metrics.lowStockCount) : undefined)}
            ${this.renderNavItem('purchases', 'local_shipping', t.nav.purchases)}
            ${this.renderNavItem('customers', 'group', t.nav.customers)}
            ${this.renderNavItem('suppliers', 'domain', t.nav.suppliers)}
            ${this.renderNavItem('financials', 'account_balance', t.nav.financials)}
            ${this.renderNavItem('music', 'music_note', t.nav.music, 'text-purple-400')}
            ${this.renderNavItem('users', 'badge', t.nav.users)}
            ${this.renderNavItem('admin', 'settings_suggest', t.nav.admin || 'Web Admin', 'text-amber-400')}
            ${this.renderNavItem('audit', 'history', t.nav.audit)}
            ${this.renderNavItem('deployment', 'terminal', t.nav.deployment, 'text-amber-400')}
          </nav>

          <!-- Ready Downloadable & Install Controls in Sidebar -->
          <div class="px-3 py-2.5 border-t border-slate-800 space-y-1.5 bg-slate-900/90">
            <!-- Install PWA Button in Sidebar -->
            <button id="btn-sidebar-install-app" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
              this.isPwaInstalled
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold shadow-md shadow-amber-500/20'
            } transition">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-base">${this.isPwaInstalled ? 'check_circle' : 'install_mobile'}</span>
                <span>${this.isPwaInstalled ? 'App Installed' : 'Install App'}</span>
              </div>
              <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                this.isPwaInstalled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-black/25 text-amber-950 font-extrabold'
              }">
                ${this.isPwaInstalled ? 'PWA' : 'Offline'}
              </span>
            </button>

            <!-- Download ZIP in Sidebar -->
            <a href="/chercher-shop-admin.zip" download="chercher-shop-admin.zip" id="btn-sidebar-download-zip" class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/70 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition group" title="Download Full Standalone Source & Docker ZIP">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-base text-sky-400 group-hover:scale-110 transition-transform">folder_zip</span>
                <span>Download App ZIP</span>
              </div>
              <span class="text-[10px] text-sky-400 font-mono font-semibold">104 KB</span>
            </a>
          </div>

          <!-- 3D XR Launch Card in Sidebar -->
          <div class="p-4 border-t border-slate-800 bg-gradient-to-t from-slate-950/90 to-transparent">
            <button id="btn-enter-xr-sidebar" class="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all">
              <span class="material-symbols-outlined text-xl">view_in_ar</span>
              <span>${t.nav.xrMode}</span>
            </button>
            <p class="text-[11px] text-center text-slate-400 mt-2">Walk through 3D cement & rebar pallets</p>
          </div>
        </aside>

        <!-- MAIN VIEW AREA -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
          
          <!-- OFFLINE STATUS BANNER (When disconnected) -->
          ${!this.isOnline ? `
            <div class="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between z-30">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-400 text-base animate-pulse">cloud_off</span>
                <span><strong>Offline Mode Active:</strong> You are currently offline. All POS sales, inventory counts, and price adjustments are safely saved to local storage.</span>
              </div>
              <span class="px-2 py-0.5 rounded bg-amber-500/25 text-amber-100 font-mono text-[10px] font-bold uppercase tracking-wider">Local Persistence</span>
            </div>
          ` : ''}

          <!-- TOP NAVBAR -->
          <header class="h-16 px-4 md:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
            <!-- Mobile Menu Toggle & Title -->
            <div class="flex items-center gap-3">
              <button id="btn-mobile-nav-toggle" class="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white">
                <span class="material-symbols-outlined">menu</span>
              </button>
              <div class="md:hidden font-bold text-base text-white">CHERCHER SHOP</div>
              <div class="hidden md:flex items-center gap-2 text-sm text-slate-400">
                <span class="material-symbols-outlined text-slate-500 text-lg">calendar_today</span>
                <span>${new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <span class="mx-1">•</span>
                <span class="text-emerald-400 font-medium">Addis Ababa (GMT+3)</span>
              </div>
            </div>

            <!-- Top Right Action Controls -->
            <div class="flex items-center gap-2 md:gap-3">
              <!-- Offline indicator badge if offline -->
              ${!this.isOnline ? `
                <span class="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30 flex items-center gap-1 font-semibold">
                  <span class="material-symbols-outlined text-sm">cloud_off</span>
                  <span class="hidden lg:inline">Offline</span>
                </span>
              ` : ''}

              <!-- Download Ready App ZIP Button (Vivid & Always Visible) -->
              <a 
                href="/chercher-shop-admin.zip" 
                download="chercher-shop-admin.zip" 
                id="btn-top-download-zip" 
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white text-xs transition font-bold shadow-md shadow-sky-600/30 border border-sky-400/40 group cursor-pointer" 
                title="Click to Download Chercher Shop Standalone ZIP Package (Source, Docker, Catalog & Docs - 108 KB)"
              >
                <span class="material-symbols-outlined text-base text-amber-300">download</span>
                <span class="font-extrabold tracking-wide">Download App</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-sky-200 font-mono font-bold hidden md:inline">ZIP</span>
              </a>

              <!-- Install App UI Component (PWA) using 'pwa-prompt-available' -->
              ${this.installButton.renderHTML()}

              <!-- QR Scanner Quick Button -->
              <button id="btn-top-qr-scanner" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs transition font-medium shadow-sm shadow-emerald-500/10" title="Scan Product Barcode or QR Code">
                <span class="material-symbols-outlined text-base">qr_code_scanner</span>
                <span class="hidden sm:inline font-semibold">Scan Barcode / QR</span>
              </button>

              <!-- Audio Player Status Button -->
              <button id="btn-top-music" class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs transition">
                <span class="material-symbols-outlined text-base ${this.music.isPlaying ? 'animate-spin' : ''}">music_note</span>
                <span class="hidden sm:inline font-medium truncate max-w-[120px]">${this.music.isPlaying ? 'Playing' : 'Audio Studio'}</span>
              </button>

              <!-- Language Switcher -->
              <div class="flex rounded-lg border border-slate-700 bg-slate-800/80 p-0.5 text-xs font-semibold">
                <button class="lang-btn px-2 py-1 rounded ${this.lang === 'en' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}" data-lang="en">EN</button>
                <button class="lang-btn px-2 py-1 rounded ${this.lang === 'am' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}" data-lang="am">አማ</button>
                <button class="lang-btn px-2 py-1 rounded ${this.lang === 'om' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}" data-lang="om">OM</button>
              </div>

              <!-- User Role Switcher Dropdown / Badge -->
              <div class="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div class="flex flex-col text-right hidden lg:block">
                  <span class="text-xs font-semibold text-slate-200">${this.db.currentUser.name}</span>
                  <span class="text-[10px] text-amber-400 uppercase font-mono tracking-wider">${t.roles[role]}</span>
                </div>
                <select id="select-role-switcher" class="bg-slate-800 border border-slate-700 text-xs text-sky-400 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer">
                  <option value="owner" ${role === 'owner' ? 'selected' : ''}>Role: Owner</option>
                  <option value="manager" ${role === 'manager' ? 'selected' : ''}>Role: Manager</option>
                  <option value="cashier" ${role === 'cashier' ? 'selected' : ''}>Role: Cashier</option>
                  <option value="inventory" ${role === 'inventory' ? 'selected' : ''}>Role: Inventory</option>
                </select>
              </div>

              <!-- Quick Launch XR button on top -->
              <button id="btn-enter-xr-top" class="md:hidden flex items-center justify-center p-2 rounded-lg bg-sky-600 text-white">
                <span class="material-symbols-outlined text-lg">view_in_ar</span>
              </button>
            </div>
          </header>

          <!-- MOBILE DRAWER NAVIGATION (Hidden by default) -->
          <div id="mobile-nav-drawer" class="hidden md:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm">
            <div class="w-72 h-full bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between">
              <div class="space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span class="font-bold text-lg text-white">Navigation</span>
                  <button id="btn-close-mobile-nav" class="text-slate-400 hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>
                <nav class="space-y-1">
                  ${this.renderNavItem('dashboard', 'dashboard', t.nav.dashboard)}
                  ${this.renderNavItem('pos', 'point_of_sale', t.nav.pos, 'text-emerald-400')}
                  ${this.renderNavItem('inventory', 'inventory_2', t.nav.inventory)}
                  ${this.renderNavItem('purchases', 'local_shipping', t.nav.purchases)}
                  ${this.renderNavItem('customers', 'group', t.nav.customers)}
                  ${this.renderNavItem('suppliers', 'domain', t.nav.suppliers)}
                  ${this.renderNavItem('financials', 'account_balance', t.nav.financials)}
                  ${this.renderNavItem('music', 'music_note', t.nav.music)}
                  ${this.renderNavItem('users', 'badge', t.nav.users)}
                  ${this.renderNavItem('admin', 'settings_suggest', t.nav.admin || 'Web Admin', 'text-amber-400')}
                  ${this.renderNavItem('audit', 'history', t.nav.audit)}
                  ${this.renderNavItem('deployment', 'terminal', t.nav.deployment)}
                </nav>
              </div>

              <!-- Mobile Install & Download Buttons -->
              <div class="space-y-2 pt-3 border-t border-slate-800">
                <button id="btn-mobile-install-app" class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl ${
                  this.isPwaInstalled ? 'bg-slate-800 text-emerald-400' : 'bg-amber-500 text-slate-950 font-bold'
                } text-xs transition">
                  <span class="material-symbols-outlined text-base">${this.isPwaInstalled ? 'check_circle' : 'install_mobile'}</span>
                  <span>${this.isPwaInstalled ? 'Chercher App Installed' : 'Install App on Phone'}</span>
                </button>

                <a href="/chercher-shop-admin.zip" download="chercher-shop-admin.zip" id="btn-mobile-download-zip" class="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700">
                  <span class="material-symbols-outlined text-base text-sky-400">folder_zip</span>
                  <span>Download Standalone ZIP (104 KB)</span>
                </a>

                <button id="btn-enter-xr-mobile" class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 text-white font-semibold text-sm">
                  <span class="material-symbols-outlined">view_in_ar</span>
                  <span>${t.nav.xrMode}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- TAB CONTENT CONTAINER -->
          <main class="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-8">
            ${this.renderTabContent()}
          </main>
        </div>
      </div>

      <!-- GLOBAL TOAST NOTIFICATION CONTAINER -->
      <div id="global-toast" class="hidden fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-sky-500/40 text-slate-100 text-xs shadow-2xl shadow-sky-500/20 backdrop-blur transition-all duration-300">
        <span class="material-symbols-outlined text-sky-400 text-lg">info</span>
        <span id="global-toast-text" class="font-medium"></span>
      </div>

      <!-- MODALS CONTAINER -->
      ${this.renderActiveModal()}
      ${this.renderIosInstallGuideModal()}
    `;

    this.attachEventListeners();
  }

  private renderNavItem(
    tab: typeof this.currentTab,
    icon: string,
    label: string,
    accentClass: string = '',
    badge?: string,
  ): string {
    const isActive = this.currentTab === tab;
    return `
      <button 
        class="nav-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30 shadow-sm'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
        }"
        data-tab="${tab}"
      >
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-lg ${accentClass || (isActive ? 'text-sky-400' : 'text-slate-400')}">${icon}</span>
          <span>${label}</span>
        </div>
        ${badge ? `<span class="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">${badge}</span>` : ''}
      </button>
    `;
  }

  private renderTabContent(): string {
    switch (this.currentTab) {
      case 'dashboard':
        return this.renderDashboardTab();
      case 'pos':
        return this.renderPosTab();
      case 'inventory':
        return this.renderInventoryTab();
      case 'purchases':
        return this.renderPurchasesTab();
      case 'customers':
        return this.renderCustomersTab();
      case 'suppliers':
        return this.renderSuppliersTab();
      case 'financials':
        return this.renderFinancialsTab();
      case 'music':
        return this.renderMusicTab();
      case 'users':
        return this.renderUsersTab();
      case 'admin':
        return this.renderAdminTab();
      case 'audit':
        return this.renderAuditTab();
      case 'deployment':
        return this.renderDeploymentTab();
      default:
        return this.renderDashboardTab();
    }
  }

  // 1. DASHBOARD TAB
  private renderDashboardTab(): string {
    const t = this.t();
    const metrics = this.db.getDashboardMetrics();
    const recentSales = this.db.sales.slice(0, 5);

    return `
      <div class="space-y-6 max-w-7xl mx-auto">
        <!-- Dashboard Top Banner -->
        <div class="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Chercher Building Material Command Center</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Live ERP</span>
            </h2>
            <p class="text-sm text-slate-400 mt-1">Real-time stock valuation, sales, COGS, customer credit and supplier liabilities in Ethiopian Birr.</p>
          </div>
          <div class="flex items-center gap-3">
            <button class="nav-tab-btn px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition" data-tab="pos">
              <span class="material-symbols-outlined text-lg">add_shopping_cart</span>
              <span>New POS Sale</span>
            </button>
            <button id="btn-enter-xr-dash" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-sky-600/20 transition">
              <span class="material-symbols-outlined text-lg">view_in_ar</span>
              <span>3D Yard View</span>
            </button>
          </div>
        </div>

        <!-- DOWNLOAD APP & INSTALLATION HERO BANNER -->
        <div class="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/70 to-slate-900 border-2 border-sky-500/40 shadow-2xl relative overflow-hidden">
          <div class="absolute -right-8 -top-8 w-44 h-44 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
                  <span class="material-symbols-outlined text-sm text-amber-400">download_for_offline</span>
                  <span>DOWNLOADABLE STANDALONE APP READY</span>
                </span>
                <span class="text-xs text-sky-400 font-mono font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">108 KB • Full Package</span>
              </div>
              <h3 class="text-xl md:text-2xl font-black text-white tracking-tight">
                Download Chercher Building Material Retail Shop
              </h3>
              <p class="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Download the complete standalone application package with full TypeScript source code, Docker configs, Nginx setup, 150-SKU Ethiopian hardware catalog, and 3D XR warehouse. Or install directly to your device home screen with 1 click.
              </p>
            </div>
            
            <div class="flex flex-wrap items-center gap-3 shrink-0">
              <!-- Direct 1-Click ZIP Download Button -->
              <a 
                href="/chercher-shop-admin.zip" 
                download="chercher-shop-admin.zip" 
                id="btn-dash-download-zip" 
                class="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-sky-600/30 flex items-center gap-2 transition hover:scale-105 active:scale-95 border border-sky-400/50 cursor-pointer"
                title="Direct Download of Standalone App ZIP"
              >
                <span class="material-symbols-outlined text-lg text-amber-300">download</span>
                <span>Download App ZIP (108 KB)</span>
              </a>

              <!-- Install PWA Button -->
              <button 
                id="btn-dash-install-pwa" 
                class="px-4 py-3 rounded-xl ${
                  this.isPwaInstalled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/25 hover:scale-105'
                } text-xs font-bold transition flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-base">${this.isPwaInstalled ? 'verified' : 'install_mobile'}</span>
                <span>${this.isPwaInstalled ? 'App Installed' : 'Install on Phone / PC'}</span>
              </button>

              <!-- GitHub Repo Link -->
              <a 
                href="https://github.com/kabtamu2281/chercher-shop-admin" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="px-3.5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition"
              >
                <span class="material-symbols-outlined text-base text-sky-400">code</span>
                <span>GitHub Repo</span>
              </a>
            </div>
          </div>
        </div>

        <!-- 8 Core Financial Metrics Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Today's Sales -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>${t.dashboard.salesToday}</span>
              <span class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <span class="material-symbols-outlined text-xl">payments</span>
              </span>
            </div>
            <div class="mt-2 text-2xl font-bold text-white">${formatETB(metrics.totalSalesToday)}</div>
            <p class="mt-1 text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <span class="material-symbols-outlined text-sm">trending_up</span>
              <span>Daily trading register</span>
            </p>
          </div>

          <!-- Gross Profit Today -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>${t.dashboard.grossProfit}</span>
              <span class="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                <span class="material-symbols-outlined text-xl">query_stats</span>
              </span>
            </div>
            <div class="mt-2 text-2xl font-bold text-sky-400">${formatETB(metrics.grossProfitToday)}</div>
            <p class="mt-1 text-xs text-slate-400 font-medium">Real COGS basis (not cash minus cash)</p>
          </div>

          <!-- Total Purchases Today -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>${t.dashboard.purchasesToday}</span>
              <span class="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <span class="material-symbols-outlined text-xl">local_shipping</span>
              </span>
            </div>
            <div class="mt-2 text-2xl font-bold text-white">${formatETB(metrics.totalPurchasesToday)}</div>
            <p class="mt-1 text-xs text-blue-400 font-medium">Inbound cement & steel shipments</p>
          </div>

          <!-- Total Expenses Today -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>${t.dashboard.expenses}</span>
              <span class="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <span class="material-symbols-outlined text-xl">receipt_long</span>
              </span>
            </div>
            <div class="mt-2 text-2xl font-bold text-rose-400">${formatETB(metrics.totalExpensesToday)}</div>
            <p class="mt-1 text-xs text-slate-400 font-medium">Laborers, fuel, yard operations</p>
          </div>

          <!-- Current Stock Valuation -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>${t.dashboard.stockValue}</span>
              <span class="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <span class="material-symbols-outlined text-xl">warehouse</span>
              </span>
            </div>
            <div class="mt-2 text-2xl font-bold text-amber-400">${formatETB(metrics.currentStockValue)}</div>
            <p class="mt-1 text-xs text-slate-400 font-medium">Retail potential: ${formatETB(metrics.currentStockRetailValue)}</p>
          </div>

          <!-- Outstanding Customer Credit -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>${t.dashboard.receivables}</span>
              <span class="p-2 rounded-xl bg-yellow-500/10 text-yellow-400">
                <span class="material-symbols-outlined text-xl">account_balance_wallet</span>
              </span>
            </div>
            <div class="mt-2 text-2xl font-bold text-yellow-400">${formatETB(metrics.outstandingCustomerCredit)}</div>
            <p class="mt-1 text-xs text-slate-400 font-medium">Accounts receivable across contractors</p>
          </div>

          <!-- Supplier Liabilities -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>${t.dashboard.payables}</span>
              <span class="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <span class="material-symbols-outlined text-xl">store</span>
              </span>
            </div>
            <div class="mt-2 text-2xl font-bold text-purple-400">${formatETB(metrics.supplierLiabilities)}</div>
            <p class="mt-1 text-xs text-slate-400 font-medium">Accounts payable (Dangote, Abyssinia, etc.)</p>
          </div>

          <!-- Net Profit Today -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>${t.dashboard.netProfit}</span>
              <span class="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <span class="material-symbols-outlined text-xl">price_check</span>
              </span>
            </div>
            <div class="mt-2 text-2xl font-bold ${metrics.netProfitToday >= 0 ? 'text-teal-400' : 'text-rose-400'}">
              ${formatETB(metrics.netProfitToday)}
            </div>
            <p class="mt-1 text-xs text-slate-400 font-medium">Gross profit minus total operating expenses</p>
          </div>
        </div>

        <!-- 2 Column Section: Low Stock Warning + Quick POS & Sales Trend -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Low Stock Alert Panel -->
          <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-base text-white flex items-center gap-2">
                  <span class="material-symbols-outlined text-rose-500">warning</span>
                  <span>${t.dashboard.lowStockAlert}</span>
                </h3>
                <span class="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400">${metrics.lowStockCount} items</span>
              </div>
              <div class="space-y-3">
                ${
                  metrics.lowStockProducts.length === 0
                    ? '<p class="text-sm text-slate-400 py-4 text-center">All materials are well stocked above threshold.</p>'
                    : metrics.lowStockProducts
                        .map(
                          (p) => `
                    <div class="p-3 rounded-xl bg-slate-950/80 border border-rose-500/20 flex items-center justify-between text-xs">
                      <div>
                        <div class="font-semibold text-slate-200">${p.name}</div>
                        <div class="text-slate-400">SKU: ${p.code} • Threshold: ${p.minThreshold} ${p.unit}</div>
                      </div>
                      <div class="text-right">
                        <span class="font-bold text-rose-400 text-sm">${p.quantity}</span>
                        <span class="text-slate-400"> ${p.unit}</span>
                      </div>
                    </div>
                  `,
                        )
                        .join('')
                }
              </div>
            </div>
            <button class="nav-tab-btn mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-medium text-xs flex items-center justify-center gap-2 transition" data-tab="inventory">
              <span>Manage Inventory & Reorder</span>
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <!-- Recent Transactions Table -->
          <div class="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-base text-white flex items-center gap-2">
                <span class="material-symbols-outlined text-sky-400">receipt</span>
                <span>${t.dashboard.recentSales}</span>
              </h3>
              <button class="nav-tab-btn text-xs text-sky-400 hover:underline flex items-center gap-1" data-tab="pos">
                <span>Open POS</span>
                <span class="material-symbols-outlined text-sm">open_in_new</span>
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th class="py-3 px-3">Invoice</th>
                    <th class="py-3 px-3">Customer</th>
                    <th class="py-3 px-3">Method</th>
                    <th class="py-3 px-3 text-right">Total</th>
                    <th class="py-3 px-3 text-right">Profit</th>
                    <th class="py-3 px-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 font-medium">
                  ${
                    recentSales.length === 0
                      ? '<tr><td colspan="6" class="py-6 text-center text-slate-500">No sales recorded yet.</td></tr>'
                      : recentSales
                          .map(
                            (s) => `
                      <tr class="hover:bg-slate-800/40 transition">
                        <td class="py-3 px-3 font-mono text-sky-400">${s.invoiceNumber}</td>
                        <td class="py-3 px-3 text-slate-200">${s.customerName}</td>
                        <td class="py-3 px-3">
                          <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            s.paymentMethod === 'cash'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : s.paymentMethod === 'telebirr'
                                ? 'bg-sky-500/20 text-sky-400'
                                : s.paymentMethod === 'credit'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-purple-500/20 text-purple-400'
                          }">
                            ${s.paymentMethod}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-right font-bold text-white">${formatETB(s.totalAmount)}</td>
                        <td class="py-3 px-3 text-right text-emerald-400 font-semibold">+${formatETB(s.grossProfit)}</td>
                        <td class="py-3 px-3 text-center">
                          <button class="btn-view-receipt p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white" data-sale-id="${s.id}">
                            <span class="material-symbols-outlined text-base">print</span>
                          </button>
                        </td>
                      </tr>
                    `,
                          )
                          .join('')
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  // 2. POINT OF SALE (POS) TAB
  private renderPosTab(): string {
    const t = this.t();
    const categories = this.db.categories;
    const filteredProducts = this.db.products.filter((p) => {
      const matchCat = this.posSelectedCategory === 'all' || p.categoryId === this.posSelectedCategory;
      const matchSearch =
        !this.posSearchQuery ||
        p.name.toLowerCase().includes(this.posSearchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(this.posSearchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(this.posSearchQuery));
      return matchCat && matchSearch;
    });

    const subtotal = this.posCart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const grandTotal = Math.max(0, subtotal - this.posDiscount);
    const role = this.db.currentUser.role;
    const canOverrideNegative = role === 'owner' || role === 'manager';

    return `
      <div class="h-full flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        <!-- LEFT: Material Catalog & Search -->
        <div class="flex-1 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <!-- Top filter bar -->
          <div class="p-4 border-b border-slate-800 space-y-3">
            <div class="flex gap-2">
              <div class="relative flex-1">
                <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-xl">search</span>
                <input
                  id="pos-search-input"
                  type="text"
                  placeholder="${t.pos.searchProduct}"
                  value="${this.posSearchQuery}"
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
              <button id="btn-pos-scan-barcode" class="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 whitespace-nowrap transition">
                <span class="material-symbols-outlined text-base">qr_code_scanner</span>
                <span class="hidden sm:inline">Scan to Cart</span>
              </button>
            </div>
            <!-- Category Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button class="pos-cat-filter px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                this.posSelectedCategory === 'all' ? 'bg-sky-600 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-white'
              }" data-cat="all">All Materials</button>
              ${categories
                .map(
                  (c) => `
                <button class="pos-cat-filter px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  this.posSelectedCategory === c.id ? 'bg-sky-600 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-white'
                }" data-cat="${c.id}">
                  ${this.lang === 'am' && c.nameAm ? c.nameAm : c.name}
                </button>
              `,
                )
                .join('')}
            </div>
          </div>

          <!-- Product Grid -->
          <div class="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            ${
              filteredProducts.length === 0
                ? '<div class="col-span-full py-12 text-center text-slate-500 text-sm">No building materials found matching criteria.</div>'
                : filteredProducts
                    .map((p) => {
                      const inCart = this.posCart.find((c) => c.product.id === p.id);
                      const isOutOfStock = p.quantity <= 0;
                      return `
                  <div class="pos-product-card p-3.5 rounded-xl bg-slate-950/80 border ${
                    inCart ? 'border-sky-500/60 shadow-md shadow-sky-500/10' : 'border-slate-800 hover:border-slate-700'
                  } flex flex-col justify-between transition cursor-pointer select-none" data-prod-id="${p.id}">
                    <div>
                      <div class="flex items-center justify-between text-xs text-slate-400">
                        <span class="font-mono text-[11px]">${p.code}</span>
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          p.quantity <= p.minThreshold ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                        }">
                          ${p.quantity} ${p.unit}
                        </span>
                      </div>
                      <h4 class="font-semibold text-sm text-slate-100 mt-1 line-clamp-2">${p.name}</h4>
                      <p class="text-xs text-slate-400 mt-0.5">${p.brand}</p>
                    </div>
                    <div class="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                      <span class="font-bold text-base text-amber-400">${formatETB(p.sellingPrice)}</span>
                      <button class="px-2.5 py-1 rounded-lg ${
                        isOutOfStock && !this.posAllowNegative
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-sky-600 hover:bg-sky-500 text-white font-medium'
                      } text-xs flex items-center gap-1 transition">
                        <span class="material-symbols-outlined text-sm">add</span>
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                `;
                    })
                    .join('')
            }
          </div>
        </div>

        <!-- RIGHT: Current Invoice Cart & Payment Processing -->
        <div class="w-full lg:w-[420px] bg-slate-900 rounded-2xl border border-slate-800 flex flex-col shrink-0 overflow-hidden shadow-xl">
          <!-- Cart Header -->
          <div class="p-4 border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-400">shopping_cart_checkout</span>
              <h3 class="font-bold text-base text-white">Current Invoice</h3>
            </div>
            <button id="pos-btn-clear-cart" class="text-xs text-slate-400 hover:text-rose-400 transition">Clear All</button>
          </div>

          <!-- Customer Selection -->
          <div class="p-3 bg-slate-950/60 border-b border-slate-800 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <label class="text-slate-400 font-medium">Customer Account</label>
              <span class="text-[11px] text-sky-400">Credit Enabled</span>
            </div>
            <select id="pos-customer-select" class="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500">
              <option value="">-- ${t.pos.walkInCustomer} --</option>
              ${this.db.customers
                .map(
                  (c) => `
                <option value="${c.id}" ${this.posSelectedCustomerId === c.id ? 'selected' : ''}>
                  ${c.name} (Credit Balance: ${formatETB(c.outstandingBalance)} / Limit: ${formatETB(c.creditLimit)})
                </option>
              `,
                )
                .join('')}
            </select>
          </div>

          <!-- Cart Item List -->
          <div class="flex-1 overflow-y-auto p-3 space-y-2.5">
            ${
              this.posCart.length === 0
                ? '<div class="h-48 flex flex-col items-center justify-center text-slate-500 text-xs"><span class="material-symbols-outlined text-4xl mb-2 text-slate-600">add_shopping_cart</span><span>Cart is empty. Click materials on the left to add.</span></div>'
                : this.posCart
                    .map((item, idx) => {
                      const lineTotal = item.unitPrice * item.quantity;
                      return `
                  <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div class="min-w-0 pr-2">
                      <div class="font-semibold text-slate-200 truncate">${item.product.name}</div>
                      <div class="text-[11px] text-slate-400">${formatETB(item.unitPrice)} / ${item.product.unit}</div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <div class="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
                        <button class="pos-cart-dec px-2 py-1 text-slate-300 hover:bg-slate-800 font-bold" data-idx="${idx}">-</button>
                        <input type="number" class="pos-cart-qty w-12 text-center bg-transparent text-slate-100 font-bold focus:outline-none" value="${item.quantity}" min="1" data-idx="${idx}" />
                        <button class="pos-cart-inc px-2 py-1 text-slate-300 hover:bg-slate-800 font-bold" data-idx="${idx}">+</button>
                      </div>
                      <span class="w-16 text-right font-bold text-amber-400">${formatETB(lineTotal)}</span>
                      <button class="pos-cart-remove text-slate-500 hover:text-rose-400" data-idx="${idx}">
                        <span class="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                `;
                    })
                    .join('')
            }
          </div>

          <!-- Checkout & Calculation Footer -->
          <div class="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3">
            <div class="space-y-1.5 text-xs text-slate-400">
              <div class="flex justify-between">
                <span>Subtotal:</span>
                <span class="text-slate-200 font-semibold">${formatETB(subtotal)}</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Discount (ETB):</span>
                <input
                  id="pos-discount-input"
                  type="number"
                  class="w-24 px-2 py-1 text-right rounded bg-slate-900 border border-slate-700 text-slate-200 font-medium focus:outline-none"
                  value="${this.posDiscount}"
                  min="0"
                />
              </div>
              <div class="flex justify-between text-base font-bold text-white pt-1.5 border-t border-slate-800">
                <span>Total Payable:</span>
                <span class="text-emerald-400">${formatETB(grandTotal)}</span>
              </div>
            </div>

            <!-- Payment Method Buttons -->
            <div class="space-y-1.5">
              <label class="text-[11px] text-slate-400 font-medium">Payment Mode</label>
              <div class="grid grid-cols-3 gap-1.5 text-xs">
                ${(['cash', 'telebirr', 'credit', 'cbe_birr', 'bank_transfer'] as PaymentMethod[])
                  .map(
                    (m) => `
                  <button class="pos-pay-method-btn py-1.5 px-2 rounded-lg font-semibold uppercase text-[10px] border transition ${
                    this.posPaymentMethod === m
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }" data-method="${m}">
                    ${m.replace('_', ' ')}
                  </button>
                `,
                  )
                  .join('')}
              </div>
            </div>

            <!-- Amount Paid (Tendered) -->
            <div class="flex items-center justify-between text-xs pt-1">
              <label class="text-slate-300 font-medium">Amount Tendered:</label>
              <input
                id="pos-tendered-input"
                type="number"
                class="w-32 px-2.5 py-1.5 text-right rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-sky-500"
                value="${this.posPaidAmount || (this.posPaymentMethod === 'credit' ? 0 : grandTotal)}"
              />
            </div>

            <!-- Admin Negative Stock Override -->
            ${
              canOverrideNegative
                ? `
              <div class="flex items-center gap-2 pt-1 text-xs">
                <input type="checkbox" id="pos-allow-negative" class="rounded bg-slate-900 border-slate-700 text-sky-600" ${
                  this.posAllowNegative ? 'checked' : ''
                }/>
                <label for="pos-allow-negative" class="text-amber-400 font-medium text-[11px] cursor-pointer">
                  ${t.pos.allowNegativeStock}
                </label>
              </div>
            `
                : ''
            }

            <!-- Complete Sale Button -->
            <button
              id="pos-btn-submit-sale"
              class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 ${
                this.posCart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }"
              ${this.posCart.length === 0 ? 'disabled' : ''}
            >
              <span class="material-symbols-outlined text-lg">check_circle</span>
              <span>${t.pos.completeSale}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 3. INVENTORY TAB
  private renderInventoryTab(): string {
    const t = this.t();
    const categories = this.db.categories;
    const conversions = this.db.unitConversions;

    const filteredProducts = this.db.products.filter((p) => {
      if (this.invOnlyNeedsReview && !p.needsChecking) return false;
      const matchCat = this.invSelectedCategory === 'all' || p.categoryId === this.invSelectedCategory;
      const matchSearch =
        !this.invSearchQuery ||
        p.name.toLowerCase().includes(this.invSearchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(this.invSearchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(this.invSearchQuery));
      return matchCat && matchSearch;
    });

    const metrics = this.db.getDashboardMetrics();

    return `
      <div class="space-y-6 max-w-7xl mx-auto">
        <!-- Top Toolbar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-sky-400">inventory_2</span>
              <span>Chercher Stock Catalog & Inventory</span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Manage paints, plumbing, fasteners, tools, electrical and cement with real-time stock levels.</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button id="btn-open-qr-scanner-inv" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition">
              <span class="material-symbols-outlined text-base">qr_code_scanner</span>
              <span>Scan QR / Barcode</span>
            </button>
            <button id="btn-open-add-product" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition">
              <span class="material-symbols-outlined text-base">add</span>
              <span>${t.inventory.addProduct}</span>
            </button>
          </div>
        </div>

        <!-- Search & Filter Controls -->
        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-xl">search</span>
              <input
                id="inv-search-input"
                type="text"
                placeholder="${t.inventory.search}"
                value="${this.invSearchQuery}"
                class="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <!-- Needs Review Toggle Filter -->
            <button
              id="inv-filter-review-btn"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
                this.invOnlyNeedsReview
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }"
            >
              <span class="material-symbols-outlined text-base text-amber-400">pending_actions</span>
              <span>Needs Name Review (${metrics.needsReviewCount})</span>
            </button>
          </div>

          <!-- Category Filter Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button class="inv-cat-filter px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
              this.invSelectedCategory === 'all' ? 'bg-sky-600 text-white font-semibold' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }" data-cat="all">All (${this.db.products.length})</button>
            ${categories
              .map(
                (c) => `
              <button class="inv-cat-filter px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                this.invSelectedCategory === c.id ? 'bg-sky-600 text-white font-semibold' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }" data-cat="${c.id}">
                ${this.lang === 'am' && c.nameAm ? c.nameAm : c.name}
              </button>
            `,
              )
              .join('')}
          </div>
        </div>

        <!-- Unit Conversions Quick Reference -->
        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <div class="font-semibold text-amber-400 mb-2 flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">swap_horiz</span>
            <span>Building Material Packaging & Unit Conversions</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            ${conversions
              .map(
                (uc) => `
              <div class="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <span class="font-bold text-sky-400">${uc.description}</span>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>

        <!-- Product Table -->
        <div class="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th class="py-3 px-4">${t.inventory.sku}</th>
                  <th class="py-3 px-4">${t.inventory.name}</th>
                  <th class="py-3 px-4">${t.inventory.category}</th>
                  <th class="py-3 px-4 text-right">${t.inventory.stock}</th>
                  <th class="py-3 px-4 text-right">${t.inventory.costPrice}</th>
                  <th class="py-3 px-4 text-right">${t.inventory.sellingPrice}</th>
                  <th class="py-3 px-4 text-center">Reorder At</th>
                  <th class="py-3 px-4 text-center">Sold 30d</th>
                  <th class="py-3 px-4 text-center">Status</th>
                  <th class="py-3 px-4 text-center">${t.inventory.actions}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-medium">
                ${
                  filteredProducts.length === 0
                    ? '<tr><td colspan="10" class="py-8 text-center text-slate-500">No stock items match your filter criteria.</td></tr>'
                    : filteredProducts
                        .map((p) => {
                          const isLow = p.quantity <= p.minThreshold;
                          const cat = categories.find((c) => c.id === p.categoryId);
                          return `
                    <tr class="hover:bg-slate-800/40 transition ${p.needsChecking ? 'bg-amber-500/5' : ''}">
                      <td class="py-3 px-4 font-mono text-sky-400 font-semibold">${p.code}</td>
                      <td class="py-3 px-4">
                        <div class="font-bold text-slate-100 flex items-center gap-1.5 flex-wrap">
                          <span>${p.name}</span>
                          ${
                            p.needsChecking
                              ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">Review Name</span>'
                              : ''
                          }
                        </div>
                        <div class="text-[11px] text-slate-400">${p.brand} • Unit: <strong class="text-slate-300">${p.unit}</strong></div>
                      </td>
                      <td class="py-3 px-4 text-slate-400">${cat?.name || 'Hardware'}</td>
                      <td class="py-3 px-4 text-right">
                        <span class="font-bold text-sm ${isLow ? 'text-rose-400' : 'text-slate-100'}">${p.quantity}</span>
                        <span class="text-[11px] text-slate-400"> ${p.unit}</span>
                      </td>
                      <td class="py-3 px-4 text-right text-slate-400">${formatETB(p.purchasePrice)}</td>
                      <td class="py-3 px-4 text-right font-bold text-amber-400">${formatETB(p.sellingPrice)}</td>
                      <td class="py-3 px-4 text-center text-slate-300 font-mono">${p.minThreshold} ${p.unit}</td>
                      <td class="py-3 px-4 text-center text-slate-400 font-semibold">${p.soldIn30Days ?? '-'}</td>
                      <td class="py-3 px-4 text-center">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                          isLow ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }">
                          ${isLow ? 'Reorder' : 'Optimal'}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                          <button class="btn-open-adjust-stock px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold transition" data-prod-id="${p.id}" title="Recount & adjust stock">
                            Adjust
                          </button>
                          <button class="btn-view-product-qr px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition flex items-center gap-1" data-prod-id="${p.id}" title="View & Print QR shelf label">
                            <span class="material-symbols-outlined text-sm">qr_code</span>
                            <span>QR</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                        })
                        .join('')
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // 4. PURCHASES TAB
  private renderPurchasesTab(): string {
    const purchases = this.db.purchases;
    const suppliers = this.db.suppliers;
    const products = this.db.products;

    return `
      <div class="space-y-6 max-w-7xl mx-auto">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-blue-400">local_shipping</span>
              <span>Purchases & Goods Inbound Orders</span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Record bulk material replenishment, freight receipts, and supplier invoices.</p>
          </div>
        </div>

        <!-- Quick Inbound Purchase Order Form -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 class="font-bold text-sm text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-emerald-400">post_add</span>
            <span>Receive New Inbound Shipment</span>
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label class="text-slate-400 font-medium">Select Supplier</label>
              <select id="po-supplier-select" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                ${suppliers.map((s) => `<option value="${s.id}">${s.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-slate-400 font-medium">Material Item</label>
              <select id="po-product-select" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                ${products.map((p) => `<option value="${p.id}">${p.name} (Cost: ${formatETB(p.purchasePrice)})</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-slate-400 font-medium">Quantity to Receive</label>
              <input id="po-qty-input" type="number" min="1" value="50" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200" />
            </div>
            <div>
              <label class="text-slate-400 font-medium">Unit Cost (ETB)</label>
              <input id="po-cost-input" type="number" value="1650" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200" />
            </div>
          </div>
          <div class="flex items-center justify-between pt-2">
            <div class="text-xs text-slate-400">
              Payment Method: <span class="text-slate-200 font-semibold">Bank Transfer / Payable Balance</span>
            </div>
            <button id="po-btn-submit" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition">
              Process Goods Receipt & Add to Stock
            </button>
          </div>
        </div>

        <!-- Inbound Orders History Table -->
        <div class="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div class="p-4 border-b border-slate-800 font-bold text-sm text-white">Purchase Orders & Goods Received History</div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th class="py-3 px-4">PO Code</th>
                  <th class="py-3 px-4">Date</th>
                  <th class="py-3 px-4">Supplier</th>
                  <th class="py-3 px-4">Material Items</th>
                  <th class="py-3 px-4 text-right">Total Cost</th>
                  <th class="py-3 px-4 text-right">Paid</th>
                  <th class="py-3 px-4 text-right">Due (Payable)</th>
                  <th class="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-medium">
                ${purchases
                  .map(
                    (p) => `
                  <tr class="hover:bg-slate-800/40 transition">
                    <td class="py-3.5 px-4 font-mono text-sky-400 font-bold">${p.orderNumber}</td>
                    <td class="py-3.5 px-4 text-slate-400">${p.date}</td>
                    <td class="py-3.5 px-4 text-slate-200 font-semibold">${p.supplierName}</td>
                    <td class="py-3.5 px-4 text-slate-300">
                      ${p.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join(', ')}
                    </td>
                    <td class="py-3.5 px-4 text-right font-bold text-white">${formatETB(p.totalAmount)}</td>
                    <td class="py-3.5 px-4 text-right text-emerald-400 font-semibold">${formatETB(p.paidAmount)}</td>
                    <td class="py-3.5 px-4 text-right text-rose-400 font-semibold">${formatETB(p.dueAmount)}</td>
                    <td class="py-3.5 px-4 text-center">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ${p.status}
                      </span>
                    </td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // 5. CUSTOMERS & CREDIT LEDGER TAB
  private renderCustomersTab(): string {
    const customers = this.db.customers;

    return `
      <div class="space-y-6 max-w-7xl mx-auto">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-yellow-400">group</span>
              <span>Customer Accounts & Credit Ledger</span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Track building contractors, credit limits, outstanding balances, and debt collection.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${customers
            .map((c) => {
              const utilPercent = Math.min(100, Math.round((c.outstandingBalance / c.creditLimit) * 100));
              return `
              <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-lg">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-base text-white">${c.name}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                      utilPercent > 80 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    }">${utilPercent}% Utilized</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-1">${c.company || 'Private Contractor'} • ${c.phone}</p>
                  <p class="text-xs text-slate-500 mt-0.5">${c.address}</p>

                  <div class="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                    <div class="flex justify-between">
                      <span class="text-slate-400">Outstanding Credit:</span>
                      <span class="font-bold text-amber-400">${formatETB(c.outstandingBalance)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400">Approved Credit Limit:</span>
                      <span class="text-slate-200 font-semibold">${formatETB(c.creditLimit)}</span>
                    </div>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span class="text-[11px] text-slate-500">${c.notes || 'No notes'}</span>
                  <button class="btn-open-collect-customer px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition" data-cust-id="${c.id}">
                    Record Collection
                  </button>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  // 6. SUPPLIERS & PAYABLES TAB
  private renderSuppliersTab(): string {
    const suppliers = this.db.suppliers;

    return `
      <div class="space-y-6 max-w-7xl mx-auto">
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-purple-400">domain</span>
            <span>Supplier Profiles & Accounts Payable</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Manage building material manufacturers (Dangote, Mugher, Abyssinia Steel, Kadisco) and payment settlements.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${suppliers
            .map(
              (s) => `
            <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-lg">
              <div>
                <div class="flex items-center justify-between">
                  <h3 class="font-bold text-base text-white">${s.name}</h3>
                  <span class="font-mono text-xs text-purple-400">${s.bankAccount || 'CBE'}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">Contact: ${s.contactPerson} • ${s.phone}</p>
                <p class="text-xs text-slate-500">${s.address}</p>

                <div class="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span class="text-xs text-slate-400">Balance Payable to Supplier</span>
                    <div class="text-xl font-bold text-rose-400 mt-0.5">${formatETB(s.balancePayable)}</div>
                  </div>
                  <button class="btn-open-pay-supplier px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition" data-sup-id="${s.id}">
                    Record Settlement
                  </button>
                </div>
              </div>
            </div>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  // 7. FINANCIALS & DAILY CLOSING TAB
  private renderFinancialsTab(): string {
    const metrics = this.db.getDashboardMetrics();
    const expenses = this.db.expenses;

    return `
      <div class="space-y-6 max-w-7xl mx-auto">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-teal-400">account_balance</span>
              <span>Financial Management & Daily Register Closing</span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Track cash flow, operating expenses, cost of goods sold, and daily register reconciliations.</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button id="btn-open-add-expense" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 font-semibold text-xs flex items-center gap-1.5 transition">
              <span class="material-symbols-outlined text-base">receipt_long</span>
              <span>Record Expense</span>
            </button>
            <button id="btn-open-daily-closing" class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition">
              <span class="material-symbols-outlined text-base">lock</span>
              <span>Perform Daily Closing</span>
            </button>
          </div>
        </div>

        <!-- Profit & Loss Summary Card -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 class="font-bold text-sm text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-sky-400">calculate</span>
            <span>Real Financial Profit & Loss Statement (Accrual & COGS Standard)</span>
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span class="text-slate-400">Revenue (Total Sales)</span>
              <div class="text-lg font-bold text-white mt-1">${formatETB(metrics.totalSalesToday)}</div>
            </div>
            <div class="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span class="text-slate-400">Cost of Goods Sold (COGS)</span>
              <div class="text-lg font-bold text-amber-400 mt-1">${formatETB(metrics.totalSalesToday - metrics.grossProfitToday)}</div>
            </div>
            <div class="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span class="text-slate-400">Net Profit (After Operating Expenses)</span>
              <div class="text-lg font-bold ${metrics.netProfitToday >= 0 ? 'text-teal-400' : 'text-rose-400'} mt-1">
                ${formatETB(metrics.netProfitToday)}
              </div>
            </div>
          </div>
        </div>

        <!-- Operating Expenses Table -->
        <div class="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div class="p-4 border-b border-slate-800 font-bold text-sm text-white">Daily Operating Expenses</div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th class="py-3 px-4">Date</th>
                  <th class="py-3 px-4">Category</th>
                  <th class="py-3 px-4">Description</th>
                  <th class="py-3 px-4">Paid By</th>
                  <th class="py-3 px-4">Method</th>
                  <th class="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-medium">
                ${expenses
                  .map(
                    (e) => `
                  <tr class="hover:bg-slate-800/40 transition">
                    <td class="py-3.5 px-4 text-slate-400">${e.date}</td>
                    <td class="py-3.5 px-4 uppercase text-[10px] font-bold text-sky-400">${e.category.replace('_', ' ')}</td>
                    <td class="py-3.5 px-4 text-slate-100 font-semibold">${e.title}</td>
                    <td class="py-3.5 px-4 text-slate-400">${e.paidBy}</td>
                    <td class="py-3.5 px-4 uppercase text-[10px]">${e.paymentMethod}</td>
                    <td class="py-3.5 px-4 text-right font-bold text-rose-400">${formatETB(e.amount)}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // 8. AUDIO & LYRIA MUSIC STUDIO TAB
  private renderMusicTab(): string {
    const isPlaying = this.music.isPlaying;
    const tracks = this.music.tracks;

    return `
      <div class="space-y-6 max-w-4xl mx-auto">
        <div class="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/20 shadow-xl">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg">
              <span class="material-symbols-outlined text-3xl">music_note</span>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <span>Kpax Audio & Lyria Music Studio</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Gemini Lyria 3 Clip</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Generate ambient shop soundtrack, contractor celebration fanfare, and Ethiopian work beats.</p>
            </div>
          </div>

          <!-- Active Track Player Bar -->
          <div class="mt-6 p-4 rounded-xl bg-slate-950 border border-purple-500/30 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button id="btn-toggle-play-main" class="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md transition">
                <span class="material-symbols-outlined text-2xl">${isPlaying ? 'pause' : 'play_arrow'}</span>
              </button>
              <div>
                <span class="text-xs font-semibold text-slate-200">${this.music.currentTrackTitle}</span>
                <p class="text-[11px] text-purple-400 font-mono">${isPlaying ? 'Now Playing in Warehouse' : 'Ready'}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button id="btn-play-synth-tizita" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300">Tizita Calm</button>
              <button id="btn-play-synth-fanfare" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-400">Sale Fanfare</button>
            </div>
          </div>
        </div>

        <!-- Lyria Generator Box -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 class="font-bold text-sm text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-amber-400">auto_awesome</span>
            <span>Generate Custom Shop Track with Lyria</span>
          </h3>
          <div class="space-y-2">
            <label class="text-xs text-slate-400">Describe the atmosphere or occasion for your Ethiopian building shop:</label>
            <textarea
              id="lyria-prompt-input"
              rows="3"
              class="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              placeholder="e.g., Upbeat Ethiopian traditional masinqo rhythm with modern drum machine for busy morning truck loading..."
            >Upbeat Ethiopian traditional masinqo rhythm with modern drum machine for busy morning truck loading in Addis Ababa</textarea>
          </div>
          <div class="flex items-center justify-between">
            <div id="lyria-status-msg" class="text-xs text-purple-400 font-medium">Model: lyria-3-clip-preview (30s)</div>
            <button id="btn-generate-lyria" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition">
              <span class="material-symbols-outlined text-base">auto_awesome</span>
              <span>Generate Music</span>
            </button>
          </div>
        </div>

        <!-- Track Playlist -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 class="font-bold text-sm text-white">Preset Store Playlists & Fanfares</h3>
          <div class="space-y-2">
            ${tracks
              .map(
                (tr) => `
              <div class="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <div class="font-semibold text-slate-200">${tr.title}</div>
                  <div class="text-[11px] text-slate-400">${tr.prompt}</div>
                </div>
                <button class="btn-play-track px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 font-semibold" data-track-id="${tr.id}">
                  Play
                </button>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  // 9. USERS & RBAC TAB
  private renderUsersTab(): string {
    const users = this.db.users;
    const currentRole = this.db.currentUser.role;

    return `
      <div class="space-y-6 max-w-5xl mx-auto">
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-sky-400">badge</span>
            <span>User Management & Role-Based Access Control (RBAC)</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Switch active user role to verify permission boundaries and audit tracking.</p>
        </div>

        <!-- Role Matrix -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 class="font-bold text-sm text-white">Role Permission Capabilities</h3>
          <div class="overflow-x-auto text-xs">
            <table class="w-full text-left text-slate-300">
              <thead class="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th class="p-3">Module</th>
                  <th class="p-3">Owner / Admin</th>
                  <th class="p-3">Manager</th>
                  <th class="p-3">Cashier</th>
                  <th class="p-3">Inventory Keeper</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800 font-medium">
                <tr>
                  <td class="p-3 font-semibold text-slate-100">POS Sales & Invoices</td>
                  <td class="p-3 text-emerald-400 font-bold">Full Access</td>
                  <td class="p-3 text-emerald-400 font-bold">Full Access</td>
                  <td class="p-3 text-emerald-400 font-bold">Full Access</td>
                  <td class="p-3 text-slate-500">Read Only</td>
                </tr>
                <tr>
                  <td class="p-3 font-semibold text-slate-100">Allow Negative Stock Override</td>
                  <td class="p-3 text-emerald-400 font-bold">Allowed</td>
                  <td class="p-3 text-emerald-400 font-bold">Allowed</td>
                  <td class="p-3 text-rose-500">Blocked</td>
                  <td class="p-3 text-rose-500">Blocked</td>
                </tr>
                <tr>
                  <td class="p-3 font-semibold text-slate-100">Financial Reports & Daily Closing</td>
                  <td class="p-3 text-emerald-400 font-bold">Full Access</td>
                  <td class="p-3 text-emerald-400 font-bold">Full Access</td>
                  <td class="p-3 text-slate-500">Cash drawer only</td>
                  <td class="p-3 text-rose-500">Blocked</td>
                </tr>
                <tr>
                  <td class="p-3 font-semibold text-slate-100">Physical Stock Adjustment</td>
                  <td class="p-3 text-emerald-400 font-bold">Full Access</td>
                  <td class="p-3 text-emerald-400 font-bold">Full Access</td>
                  <td class="p-3 text-rose-500">Blocked</td>
                  <td class="p-3 text-emerald-400 font-bold">Full Access</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Users List -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${users
            .map((u) => {
              const isActive = this.db.currentUser.id === u.id;
              return `
              <div class="p-5 rounded-2xl bg-slate-900 border ${
                isActive ? 'border-sky-500 shadow-md shadow-sky-500/10' : 'border-slate-800'
              } flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-sm text-white">${u.name}</span>
                    ${isActive ? '<span class="px-2 py-0.5 rounded-full text-[10px] bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30">Active</span>' : ''}
                  </div>
                  <p class="text-xs text-slate-400 mt-1">${u.email} • ${u.phone}</p>
                  <span class="inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-amber-400 border border-slate-700">
                    ${u.role}
                  </span>
                </div>
                <button class="btn-switch-user-role px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold transition" data-role="${u.role}">
                  Switch to Role
                </button>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  // 10. AUDIT LOGS TAB
  private renderAuditTab(): string {
    const logs = this.db.auditLogs;

    return `
      <div class="space-y-6 max-w-5xl mx-auto">
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-slate-400">history</span>
            <span>Security & Business Transaction Audit Trail</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Immutable activity log recording who created, modified, or closed transactions.</p>
        </div>

        <div class="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th class="py-3 px-4">Timestamp</th>
                  <th class="py-3 px-4">User</th>
                  <th class="py-3 px-4">Module</th>
                  <th class="py-3 px-4">Action</th>
                  <th class="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 font-medium">
                ${logs
                  .map(
                    (l) => `
                  <tr class="hover:bg-slate-800/40 transition">
                    <td class="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">${l.timestamp}</td>
                    <td class="py-3 px-4 font-semibold text-slate-200">${l.userName}</td>
                    <td class="py-3 px-4 uppercase text-[10px] text-sky-400 font-bold">${l.module}</td>
                    <td class="py-3 px-4 font-mono text-[11px] text-amber-400 font-bold">${l.action}</td>
                    <td class="py-3 px-4 text-slate-300">${l.details}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // 11. VPS & DOCKER DEPLOYMENT TAB
  private renderDeploymentTab(): string {
    return `
      <div class="space-y-6 max-w-5xl mx-auto">
        <div class="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20 shadow-xl">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <span class="material-symbols-outlined text-3xl">terminal</span>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <span>Ethio Telecom Ubuntu Linux VPS Deployment Hub</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Ready for VPS</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Complete Dockerfile, Docker Compose, PostgreSQL schema, and automated backup scripts ready for deployment.</p>
            </div>
          </div>
        </div>

        <!-- Docker Compose Config Code Block -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-slate-200 font-mono">docker-compose.yml</span>
            <span class="text-[11px] text-slate-500">PostgreSQL + Next.js/Vite + Nginx</span>
          </div>
          <pre class="p-4 rounded-xl bg-slate-950 text-slate-300 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
version: '3.8'

services:
  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://kpax_user:kpax_secure_password@postgres:5432/kpax_shop
      - PORT=3000
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: kpax_user
      POSTGRES_PASSWORD: kpax_secure_password
      POSTGRES_DB: kpax_shop
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/schema.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

volumes:
  pgdata:
          </pre>
        </div>

        <!-- Deployment Instructions -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 class="font-bold text-sm text-white">VPS Setup Steps (Ubuntu 24.04 LTS Ethio telecom)</h3>
          <ol class="list-decimal list-inside text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>Connect to VPS: <code class="px-2 py-0.5 rounded bg-slate-950 text-sky-400 font-mono">ssh root@vps.ethiotelecom.et</code></li>
            <li>Install Docker & Docker Compose: <code class="px-2 py-0.5 rounded bg-slate-950 text-sky-400 font-mono">apt update && apt install -y docker.io docker-compose</code></li>
            <li>Clone repository and launch: <code class="px-2 py-0.5 rounded bg-slate-950 text-sky-400 font-mono">docker-compose up -d --build</code></li>
            <li>Healthcheck status: <code class="px-2 py-0.5 rounded bg-slate-950 text-sky-400 font-mono">curl http://localhost:3000/api/health</code></li>
          </ol>
        </div>
      </div>
    `;
  }

  // 12. WEB ADMIN & STORE SETTINGS TAB
  private renderAdminTab(): string {
    const profile = this.db.storeProfile;
    const metrics = this.db.getDashboardMetrics();
    const usedStorage = Math.round((JSON.stringify(localStorage).length / 1024) * 10) / 10;

    return `
      <div class="space-y-6 max-w-6xl mx-auto">
        <!-- Admin Hub Banner -->
        <div class="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <span class="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-2xl font-bold text-white tracking-tight">Chercher Web Admin Console</h2>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">System Active</span>
              </div>
              <p class="text-xs text-slate-400 mt-1">Manage store profile, tax/TIN credentials, thermal printer settings, PWA installation, and database backups.</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-admin-download-backup" class="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition">
              <span class="material-symbols-outlined text-sm">download</span>
              <span>Export Backup (JSON)</span>
            </button>
            <button id="btn-admin-install-pwa" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition">
              <span class="material-symbols-outlined text-sm">install_mobile</span>
              <span>Install PWA App</span>
            </button>
          </div>
        </div>

        <div id="admin-toast" class="hidden p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all">
          <span class="material-symbols-outlined text-sm">check_circle</span>
          <span id="admin-toast-text">Settings updated successfully!</span>
        </div>

        <!-- Section 1: Store Profile & Legal / Tax Info -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-sky-400">store</span>
              <h3 class="font-bold text-base text-white">Store Identity & Ethiopian Tax Registration</h3>
            </div>
            <span class="text-xs text-slate-400">ERCA / MOR Compliant</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Official Business / Shop Name</label>
              <input id="store-name-input" type="text" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-sky-500 focus:outline-none" value="${profile.name}" />
            </div>

            <div>
              <label class="text-slate-300 font-semibold block mb-1">Business Tagline / Specialty</label>
              <input id="store-tagline-input" type="text" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-sky-500 focus:outline-none" value="${profile.tagline}" />
            </div>

            <div>
              <label class="text-slate-300 font-semibold block mb-1">Tax Identification Number (TIN)</label>
              <input id="store-tin-input" type="text" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-medium focus:border-sky-500 focus:outline-none" value="${profile.tin}" placeholder="10-digit TIN" />
            </div>

            <div>
              <label class="text-slate-300 font-semibold block mb-1">VAT Registration Number</label>
              <input id="store-vat-input" type="text" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-medium focus:border-sky-500 focus:outline-none" value="${profile.vatNumber}" placeholder="VAT registration code" />
            </div>

            <div>
              <label class="text-slate-300 font-semibold block mb-1">Physical Street Address / Yard Location</label>
              <input id="store-address-input" type="text" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-sky-500 focus:outline-none" value="${profile.address}" />
            </div>

            <div>
              <label class="text-slate-300 font-semibold block mb-1">City / Region / Postal Code</label>
              <input id="store-city-input" type="text" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-sky-500 focus:outline-none" value="${profile.city}" />
            </div>

            <div>
              <label class="text-slate-300 font-semibold block mb-1">Store Telephones (Mobile & Landline)</label>
              <input id="store-phone-input" type="text" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-sky-500 focus:outline-none" value="${profile.phone}" />
            </div>

            <div>
              <label class="text-slate-300 font-semibold block mb-1">Official Contact Email</label>
              <input id="store-email-input" type="email" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-sky-500 focus:outline-none" value="${profile.email}" />
            </div>
          </div>

          <div class="pt-2 flex justify-end">
            <button id="btn-save-store-profile" class="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/25 transition">
              <span class="material-symbols-outlined text-sm">save</span>
              <span>Save Business Details</span>
            </button>
          </div>
        </div>

        <!-- Section 2: POS Hardware & Thermal Receipt Configuration -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-emerald-400">print</span>
              <h3 class="font-bold text-base text-white">POS Thermal Printer & Receipt Formats</h3>
            </div>
            <span class="text-xs text-slate-400">80mm & 58mm Thermal ESC/POS Support</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="text-slate-300 font-semibold block mb-1">Receipt Header Text (Appears on top of invoices)</label>
              <textarea id="store-header-input" rows="3" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-sky-500 focus:outline-none">${profile.receiptHeader}</textarea>
            </div>

            <div>
              <label class="text-slate-300 font-semibold block mb-1">Receipt Footer Text / Return Policy</label>
              <textarea id="store-footer-input" rows="3" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-sky-500 focus:outline-none">${profile.receiptFooter}</textarea>
            </div>

            <div>
              <label class="text-slate-300 font-semibold block mb-1">Printer Roll Width</label>
              <select id="store-printer-select" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-sky-500 focus:outline-none">
                <option value="80mm" ${profile.printerWidth === '80mm' ? 'selected' : ''}>80mm Standard POS Thermal Paper</option>
                <option value="58mm" ${profile.printerWidth === '58mm' ? 'selected' : ''}>58mm Compact Bluetooth/USB Mobile Paper</option>
              </select>
            </div>

            <div>
              <label class="text-slate-300 font-semibold block mb-1">POS Checkout Sound Effects</label>
              <div class="mt-2 flex items-center gap-2">
                <input id="store-sound-toggle" type="checkbox" class="w-4 h-4 rounded bg-slate-950 border-slate-700 text-sky-600 focus:ring-0" ${profile.enableSound ? 'checked' : ''} />
                <span class="text-slate-300">Play celebratory audio fanfare on successful sale / receipt dispense</span>
              </div>
            </div>
          </div>

          <div class="pt-2 flex justify-end">
            <button id="btn-save-printer-settings" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition">
              <span class="material-symbols-outlined text-sm">check</span>
              <span>Update Printer Settings</span>
            </button>
          </div>
        </div>

        <!-- Section 3: PWA Installation & Ready Downloadable Package -->
        <div class="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-sky-500/30 shadow-xl space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-amber-400 text-2xl">install_mobile</span>
              <div>
                <h3 class="font-bold text-base text-white">Download Ready App & Install PWA</h3>
                <p class="text-xs text-slate-400">Run locally, deploy with Docker, or install directly on mobile devices with offline caching</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>PWA Certified</span>
              </span>
            </div>
          </div>

          <!-- Primary Actions: Install Button + Download ZIP Button -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Install Button Card -->
            <div class="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-sm text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-amber-400">offline_pin</span>
                    <span>1-Click App Installation</span>
                  </span>
                  <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded ${this.isPwaInstalled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'} font-bold">
                    ${this.isPwaInstalled ? 'Installed' : 'Ready'}
                  </span>
                </div>
                <p class="text-xs text-slate-300">
                  Installs the app directly onto your home screen or desktop. Works completely offline with cached assets, local catalog storage, and barcode scanner camera access.
                </p>
              </div>
              <button 
                id="btn-admin-install-pwa" 
                class="w-full py-2.5 px-4 rounded-xl ${
                  this.isPwaInstalled 
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 cursor-default' 
                    : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                } text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <span class="material-symbols-outlined text-base">${this.isPwaInstalled ? 'verified' : 'install_mobile'}</span>
                <span>${this.isPwaInstalled ? 'Chercher App Already Installed' : 'Install Chercher App Now'}</span>
              </button>
            </div>

            <!-- Download Standalone ZIP Card -->
            <div class="p-4 rounded-xl bg-slate-950/80 border border-sky-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-sm text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-sky-400">folder_zip</span>
                    <span>Ready Downloadable App Archive</span>
                  </span>
                  <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                    104 KB • ZIP
                  </span>
                </div>
                <p class="text-xs text-slate-300">
                  Complete standalone distribution package including full source code, 150-SKU seed catalog, Dockerfile, docker-compose, Nginx configs, and comprehensive documentation.
                </p>
              </div>
              <a 
                href="/chercher-shop-admin.zip" 
                download="chercher-shop-admin.zip" 
                id="btn-admin-download-zip" 
                class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 hover:from-sky-500 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-600/25 transition flex items-center justify-center gap-2 text-center"
              >
                <span class="material-symbols-outlined text-base">download</span>
                <span>Download App ZIP (Source + Docker + Docs)</span>
              </a>
            </div>
          </div>

          <!-- Package Contents Breakdown & Installation Steps -->
          <div class="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
            <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm text-sky-400">inventory</span>
              <span>What is included in the Downloadable ZIP Package:</span>
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-300">
              <div class="p-2 rounded bg-slate-900 border border-slate-800">
                <strong class="text-sky-400 block mb-0.5">📦 Source Code</strong>
                TypeScript, XR Blocks, Three.js warehouse, audio studio & QR scanner.
              </div>
              <div class="p-2 rounded bg-slate-900 border border-slate-800">
                <strong class="text-emerald-400 block mb-0.5">🐳 Docker & Compose</strong>
                Multi-stage build Dockerfile + docker-compose.yml + Nginx config.
              </div>
              <div class="p-2 rounded bg-slate-900 border border-slate-800">
                <strong class="text-amber-400 block mb-0.5">📊 150-SKU Seed Catalog</strong>
                Official Ethiopian retail building materials database with pricing.
              </div>
              <div class="p-2 rounded bg-slate-900 border border-slate-800">
                <strong class="text-purple-400 block mb-0.5">📖 Documentation</strong>
                Launch guide, README.md, offline PWA setup & thermal print manual.
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div class="flex items-center gap-2 text-sky-400 font-bold text-xs">
                <span class="material-symbols-outlined text-base">android</span>
                <span>Android Phones & Tablets</span>
              </div>
              <p class="text-[11px] text-slate-400 leading-normal">Tap <strong>"Install App"</strong> above or in the top navbar. Chrome will add it with a native launcher icon and full offline capability.</p>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div class="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <span class="material-symbols-outlined text-base">view_in_ar</span>
                <span>Android XR & Galaxy XR</span>
              </div>
              <p class="text-[11px] text-slate-400 leading-normal">Open in Galaxy XR or AURA browser → Tap <strong>"Enter 3D XR Warehouse"</strong> to inspect pallets and shelves spatially.</p>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div class="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <span class="material-symbols-outlined text-base">apple</span>
                <span>iOS (iPhone / iPad)</span>
              </div>
              <p class="text-[11px] text-slate-400 leading-normal">Open in Safari → Tap Share (<span class="inline-block text-[10px]">ios_share</span>) → Tap <strong>"Add to Home Screen"</strong> for full-screen offline execution.</p>
            </div>
          </div>
        </div>

        <!-- Section 4: Enterprise Database Administration & Backups -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-amber-400">database</span>
              <h3 class="font-bold text-base text-white">Database Backup, Restore & Test Operations</h3>
            </div>
            <span class="text-xs text-slate-400 font-mono">LocalStorage & JSON Engine</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <!-- Export Backup -->
            <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div class="flex items-center gap-2 text-white font-bold text-xs mb-1">
                  <span class="material-symbols-outlined text-sky-400 text-base">file_download</span>
                  <span>Export JSON Backup</span>
                </div>
                <p class="text-[11px] text-slate-400">Download complete dataset with all 150 products, sales, customers, suppliers, and audit logs.</p>
              </div>
              <button id="btn-action-export-json" class="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow">
                Download JSON File
              </button>
            </div>

            <!-- Import Backup -->
            <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div class="flex items-center gap-2 text-white font-bold text-xs mb-1">
                  <span class="material-symbols-outlined text-emerald-400 text-base">file_upload</span>
                  <span>Restore from JSON</span>
                </div>
                <p class="text-[11px] text-slate-400">Upload a previously exported Chercher backup file to restore records.</p>
                <input id="input-backup-file" type="file" accept=".json" class="hidden" />
              </div>
              <button id="btn-action-trigger-import" class="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow">
                Select Backup File
              </button>
            </div>

            <!-- Seed Demo Transactions -->
            <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div class="flex items-center gap-2 text-white font-bold text-xs mb-1">
                  <span class="material-symbols-outlined text-purple-400 text-base">auto_fix_high</span>
                  <span>Seed Test Sales</span>
                </div>
                <p class="text-[11px] text-slate-400">Adds realistic test orders and expenses so you can test dashboard charts and thermal receipts.</p>
              </div>
              <button id="btn-action-seed-demo" class="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow">
                Create Test Sales
              </button>
            </div>

            <!-- Factory Reset -->
            <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div class="flex items-center gap-2 text-white font-bold text-xs mb-1">
                  <span class="material-symbols-outlined text-rose-400 text-base">restart_alt</span>
                  <span>Factory Reset</span>
                </div>
                <p class="text-[11px] text-slate-400">Reloads the official 150-SKU Chercher Hardware catalog and resets test sales.</p>
              </div>
              <button id="btn-action-factory-reset" class="w-full py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs shadow">
                Reset Catalog
              </button>
            </div>
          </div>
        </div>

        <!-- Section 5: Live Database Status & Diagnostics -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-sky-400">monitoring</span>
              <h3 class="font-bold text-base text-white">System Diagnostics & Storage Metrics</h3>
            </div>
            <span class="text-xs text-slate-400">Client-Side High Performance Engine</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div class="text-xl font-bold text-white">${this.db.products.length}</div>
              <div class="text-[10px] text-slate-400 mt-1 uppercase">Total SKUs</div>
            </div>

            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div class="text-xl font-bold text-sky-400">${this.db.categories.length}</div>
              <div class="text-[10px] text-slate-400 mt-1 uppercase">Categories</div>
            </div>

            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div class="text-xl font-bold text-emerald-400">${this.db.sales.length}</div>
              <div class="text-[10px] text-slate-400 mt-1 uppercase">Total Invoices</div>
            </div>

            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div class="text-xl font-bold text-purple-400">${this.db.customers.length}</div>
              <div class="text-[10px] text-slate-400 mt-1 uppercase">Customers</div>
            </div>

            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div class="text-xl font-bold text-amber-400">${this.db.suppliers.length}</div>
              <div class="text-[10px] text-slate-400 mt-1 uppercase">Suppliers</div>
            </div>

            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div class="text-xl font-bold text-slate-200">${usedStorage} KB</div>
              <div class="text-[10px] text-slate-400 mt-1 uppercase">Storage Used</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ACTIVE MODAL POPUP
  private renderActiveModal(): string {
    if (this.modalState === 'none') return '';

    if (this.modalState === 'receipt' && this.selectedSaleForModal) {
      const s = this.selectedSaleForModal;
      return `
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-white text-slate-900 rounded-2xl p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 class="font-bold text-lg text-slate-900">KPAX SHOP</h3>
                <p class="text-xs text-slate-500">Building Materials Retail & Wholesale</p>
                <p class="text-[11px] text-slate-400">Addis Ababa, Ethiopia • TIN: 0012938475</p>
              </div>
              <button id="modal-btn-close" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div id="printable-receipt" class="text-xs space-y-3">
              <div class="flex justify-between text-[11px] text-slate-600">
                <span>Invoice: <strong>${s.invoiceNumber}</strong></span>
                <span>Date: ${s.date}</span>
              </div>
              <div class="text-[11px] text-slate-600">
                Customer: <strong>${s.customerName}</strong><br/>
                Cashier: ${s.cashierName}
              </div>

              <table class="w-full text-left text-[11px] border-t border-b border-slate-200 py-2">
                <thead>
                  <tr class="text-slate-500">
                    <th class="py-1">Item</th>
                    <th class="py-1 text-center">Qty</th>
                    <th class="py-1 text-right">Price</th>
                    <th class="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${s.items
                    .map(
                      (item) => `
                    <tr>
                      <td class="py-1">${item.productName}</td>
                      <td class="py-1 text-center">${item.quantity} ${item.unit}</td>
                      <td class="py-1 text-right">${formatETB(item.unitPrice)}</td>
                      <td class="py-1 text-right font-bold">${formatETB(item.subtotal)}</td>
                    </tr>
                  `,
                    )
                    .join('')}
                </tbody>
              </table>

              <div class="space-y-1 text-right text-xs">
                <div>Subtotal: <strong>${formatETB(s.subtotal)}</strong></div>
                ${s.discount > 0 ? `<div class="text-rose-600">Discount: -${formatETB(s.discount)}</div>` : ''}
                <div class="text-sm font-bold border-t border-slate-200 pt-1">Grand Total: ${formatETB(s.totalAmount)}</div>
                <div class="text-[11px] text-slate-600">Paid (${s.paymentMethod}): ${formatETB(s.paidAmount)}</div>
                ${s.dueAmount > 0 ? `<div class="text-xs text-rose-600 font-bold">Balance Due: ${formatETB(s.dueAmount)}</div>` : ''}
              </div>
            </div>

            <div class="flex gap-2 pt-2 border-t border-slate-100">
              <button onclick="window.print()" class="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md">
                <span class="material-symbols-outlined text-sm">print</span>
                <span>Print Invoice</span>
              </button>
              <button id="modal-btn-dismiss" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.modalState === 'adjustStock' && this.activeProductToAdjust) {
      const p = this.activeProductToAdjust;
      return `
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="font-bold text-base text-white">Adjust Stock: ${p.name}</h3>
              <button id="modal-btn-close" class="p-1 rounded text-slate-400 hover:text-white">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="space-y-3 text-xs">
              <div class="flex justify-between text-slate-400">
                <span>Current Stock:</span>
                <span class="font-bold text-white">${p.quantity} ${p.unit}</span>
              </div>
              <div>
                <label class="text-slate-300 font-medium">New Physical Count (${p.unit})</label>
                <input id="modal-adjust-qty" type="number" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm" value="${p.quantity}" />
              </div>
              <div>
                <label class="text-slate-300 font-medium">Reason for Adjustment</label>
                <input id="modal-adjust-reason" type="text" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs" placeholder="e.g. Physical inventory count discrepancy / warehouse damage" value="Physical yard recount" />
              </div>
            </div>
            <div class="flex gap-2 pt-2 border-t border-slate-800">
              <button id="modal-btn-submit-adjust" class="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md">
                Save & Update Stock Movement
              </button>
              <button id="modal-btn-dismiss" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.modalState === 'collectCustomer' && this.activeCustomerToCollect) {
      const c = this.activeCustomerToCollect;
      return `
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="font-bold text-base text-white">Record Credit Collection: ${c.name}</h3>
              <button id="modal-btn-close" class="p-1 rounded text-slate-400 hover:text-white">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="space-y-3 text-xs">
              <div class="flex justify-between text-slate-400">
                <span>Outstanding Balance:</span>
                <span class="font-bold text-amber-400 text-sm">${formatETB(c.outstandingBalance)}</span>
              </div>
              <div>
                <label class="text-slate-300 font-medium">Amount Received (ETB)</label>
                <input id="modal-collect-amount" type="number" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm" value="${c.outstandingBalance}" max="${c.outstandingBalance}" />
              </div>
              <div>
                <label class="text-slate-300 font-medium">Payment Mode</label>
                <select id="modal-collect-method" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200">
                  <option value="cash">Cash</option>
                  <option value="telebirr">telebirr</option>
                  <option value="cbe_birr">CBE Birr</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
            <div class="flex gap-2 pt-2 border-t border-slate-800">
              <button id="modal-btn-submit-collect" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md">
                Record Payment & Deduct Credit
              </button>
              <button id="modal-btn-dismiss" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.modalState === 'paySupplier' && this.activeSupplierToPay) {
      const s = this.activeSupplierToPay;
      return `
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="font-bold text-base text-white">Supplier Settlement: ${s.name}</h3>
              <button id="modal-btn-close" class="p-1 rounded text-slate-400 hover:text-white">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="space-y-3 text-xs">
              <div class="flex justify-between text-slate-400">
                <span>Current Balance Payable:</span>
                <span class="font-bold text-rose-400 text-sm">${formatETB(s.balancePayable)}</span>
              </div>
              <div>
                <label class="text-slate-300 font-medium">Payment Amount (ETB)</label>
                <input id="modal-pay-amount" type="number" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm" value="${s.balancePayable}" max="${s.balancePayable}" />
              </div>
              <div>
                <label class="text-slate-300 font-medium">Payment Mode</label>
                <select id="modal-pay-method" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200">
                  <option value="bank_transfer">Bank Transfer (CBE / Awash)</option>
                  <option value="telebirr">telebirr</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>
            <div class="flex gap-2 pt-2 border-t border-slate-800">
              <button id="modal-btn-submit-pay-supplier" class="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md">
                Confirm Settlement
              </button>
              <button id="modal-btn-dismiss" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.modalState === 'addExpense') {
      return `
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="font-bold text-base text-white">Record Operating Expense</h3>
              <button id="modal-btn-close" class="p-1 rounded text-slate-400 hover:text-white">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="space-y-3 text-xs">
              <div>
                <label class="text-slate-300 font-medium">Expense Category</label>
                <select id="modal-exp-cat" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200">
                  <option value="loading_unloading">Loading & Unloading Laborers</option>
                  <option value="transport_fuel">Transport & Diesel Fuel</option>
                  <option value="wages">Staff Daily Wages</option>
                  <option value="utilities">Utilities & Electricity</option>
                  <option value="rent">Yard / Shop Rent</option>
                  <option value="maintenance">Forklift / Truck Maintenance</option>
                  <option value="other">Other Operating Cost</option>
                </select>
              </div>
              <div>
                <label class="text-slate-300 font-medium">Description</label>
                <input id="modal-exp-title" type="text" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200" placeholder="e.g. Unloading 200 bags of Dangote cement" />
              </div>
              <div>
                <label class="text-slate-300 font-medium">Amount (ETB)</label>
                <input id="modal-exp-amount" type="number" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm" placeholder="2500" />
              </div>
            </div>
            <div class="flex gap-2 pt-2 border-t border-slate-800">
              <button id="modal-btn-submit-expense" class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md">
                Record Expense
              </button>
              <button id="modal-btn-dismiss" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.modalState === 'dailyClosing') {
      const metrics = this.db.getDashboardMetrics();
      return `
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="font-bold text-base text-white">Daily Register Closing & Cash Reconcile</h3>
              <button id="modal-btn-close" class="p-1 rounded text-slate-400 hover:text-white">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="space-y-3 text-xs">
              <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div class="flex justify-between text-slate-400">
                  <span>Gross Sales Today:</span>
                  <span class="font-bold text-white">${formatETB(metrics.totalSalesToday)}</span>
                </div>
                <div class="flex justify-between text-slate-400">
                  <span>Operating Expenses Paid:</span>
                  <span class="font-bold text-rose-400">-${formatETB(metrics.totalExpensesToday)}</span>
                </div>
                <div class="flex justify-between text-slate-300 font-semibold border-t border-slate-800 pt-1">
                  <span>Net Estimated Cash in Drawer:</span>
                  <span class="text-emerald-400 font-bold">${formatETB(Math.max(0, metrics.totalSalesToday - metrics.totalExpensesToday))}</span>
                </div>
              </div>
              <div>
                <label class="text-slate-300 font-medium">Actual Physical Cash Counted in Drawer (ETB)</label>
                <input id="modal-closing-cash" type="number" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm" value="${Math.max(0, metrics.totalSalesToday - metrics.totalExpensesToday)}" />
              </div>
              <div>
                <label class="text-slate-300 font-medium">Closing Notes / Discrepancy Reason</label>
                <input id="modal-closing-notes" type="text" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200" placeholder="Register closed with zero variance." />
              </div>
            </div>
            <div class="flex gap-2 pt-2 border-t border-slate-800">
              <button id="modal-btn-submit-closing" class="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md">
                Finalize Daily Financial Closing
              </button>
              <button id="modal-btn-dismiss" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.modalState === 'addProduct') {
      const categories = this.db.categories;
      const suppliers = this.db.suppliers;
      return `
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="w-full max-w-lg bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="font-bold text-base text-white">Add New Building Material</h3>
              <button id="modal-btn-close" class="p-1 rounded text-slate-400 hover:text-white">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="col-span-2">
                <label class="text-slate-300 font-medium">Material Name</label>
                <input id="modal-prod-name" type="text" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white" placeholder="e.g. National Cement PPC 32.5N" />
              </div>
              <div>
                <label class="text-slate-300 font-medium">SKU / Code</label>
                <input id="modal-prod-code" type="text" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono" placeholder="CEM-NAT-32" />
              </div>
              <div>
                <label class="text-slate-300 font-medium">Brand</label>
                <input id="modal-prod-brand" type="text" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white" placeholder="e.g. National" />
              </div>
              <div>
                <label class="text-slate-300 font-medium">Category</label>
                <select id="modal-prod-cat" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200">
                  ${categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="text-slate-300 font-medium">Unit</label>
                <select id="modal-prod-unit" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200">
                  <option value="bag">Bag (50kg)</option>
                  <option value="quintal">Quintal (100kg)</option>
                  <option value="piece">Piece</option>
                  <option value="litre">Litre</option>
                  <option value="box">Box (Tiles)</option>
                  <option value="truckload">Truckload (16m³)</option>
                </select>
              </div>
              <div>
                <label class="text-slate-300 font-medium">Purchase Cost (ETB)</label>
                <input id="modal-prod-cost" type="number" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold" placeholder="1500" />
              </div>
              <div>
                <label class="text-slate-300 font-medium">Selling Price (ETB)</label>
                <input id="modal-prod-price" type="number" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-amber-400" placeholder="1750" />
              </div>
              <div>
                <label class="text-slate-300 font-medium">Initial Quantity</label>
                <input id="modal-prod-qty" type="number" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white" placeholder="100" />
              </div>
              <div>
                <label class="text-slate-300 font-medium">Min Threshold Alert</label>
                <input id="modal-prod-thresh" type="number" class="w-full mt-1 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white" placeholder="20" />
              </div>
            </div>
            <div class="flex gap-2 pt-2 border-t border-slate-800">
              <button id="modal-btn-submit-add-product" class="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md">
                Add Material to Inventory
              </button>
              <button id="modal-btn-dismiss" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (this.modalState === 'qrScanner') {
      return `
        <div class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div class="w-full max-w-xl bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
            
            <!-- Modal Header -->
            <div class="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <span class="material-symbols-outlined text-xl">qr_code_scanner</span>
                </div>
                <div>
                  <h3 class="font-bold text-base text-white flex items-center gap-2">
                    <span>Camera Barcode & QR Scanner</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      this.qrScannerMode === 'pos'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }">
                      ${this.qrScannerMode === 'pos' ? 'POS Quick Add' : 'Warehouse Recount'}
                    </span>
                  </h3>
                  <p class="text-xs text-slate-400">Aim camera at packaging barcode or QR shelf label</p>
                </div>
              </div>
              <button id="modal-qr-close" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <!-- Mode Selector & Camera Controls Bar -->
            <div class="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              <div class="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button id="btn-qr-mode-inv" class="px-3 py-1 rounded-lg font-medium transition ${
                  this.qrScannerMode === 'inventory'
                    ? 'bg-sky-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }">
                  Stock Lookup & Recount
                </button>
                <button id="btn-qr-mode-pos" class="px-3 py-1 rounded-lg font-medium transition ${
                  this.qrScannerMode === 'pos'
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }">
                  POS Continuous Scan
                </button>
              </div>

              <div class="flex items-center gap-1.5">
                <button id="btn-qr-toggle-torch" class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition" title="Toggle Flashlight / Torch">
                  <span class="material-symbols-outlined text-base">flashlight_on</span>
                </button>
                <button id="btn-qr-flip-camera" class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 transition" title="Switch Front/Back Camera">
                  <span class="material-symbols-outlined text-base">flip_camera_ios</span>
                </button>
              </div>
            </div>

            <!-- Camera Viewport with Reticle Box & Laser -->
            <div class="relative w-full bg-black aspect-[4/3] sm:aspect-[16/9] flex items-center justify-center overflow-hidden shrink-0">
              <video id="qr-scanner-video" class="w-full h-full object-cover" playsinline autoplay muted></video>

              <!-- Centered Scanning Reticle -->
              <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div class="relative w-52 h-52 sm:w-60 sm:h-60 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/10">
                  <div class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl"></div>
                  <div class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl"></div>
                  <div class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl"></div>
                  <div class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl"></div>
                  <div class="animate-scan-laser"></div>
                </div>
              </div>

              <!-- Live Scan Status Banner Overlay -->
              ${
                this.qrScanFeedback
                  ? `
                <div class="absolute top-3 left-4 right-4 py-2 px-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg flex items-center justify-between">
                  <span class="flex items-center gap-1.5 truncate">
                    <span class="material-symbols-outlined text-base">check_circle</span>
                    <span class="truncate">${this.qrScanFeedback}</span>
                  </span>
                  <span class="text-[10px] uppercase font-mono tracking-wider ml-2 shrink-0">BEEP!</span>
                </div>
              `
                  : ''
              }

              <!-- Camera Error / Fallback Notification -->
              <div id="qr-camera-error-msg" class="${
                this.qrScanError ? '' : 'hidden'
              } absolute inset-0 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center">
                <span class="material-symbols-outlined text-4xl text-amber-400 mb-2">videocam_off</span>
                <h4 class="font-bold text-white text-sm">Camera Notice</h4>
                <p class="text-xs text-slate-300 mt-1 max-w-sm">${
                  this.qrScanError ||
                  'Camera unavailable or permission denied. You can still use the manual lookup or test chips below.'
                }</p>
                <button id="btn-qr-retry-camera" class="mt-3 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition">
                  Retry Camera
                </button>
              </div>
            </div>

            <!-- Content Area: Manual Search, Test Chips, and Scanned Item -->
            <div class="p-4 bg-slate-950/80 border-t border-slate-800 space-y-3 overflow-y-auto flex-1">
              <!-- Manual Code Search Input -->
              <div>
                <label class="text-[11px] text-slate-400 font-medium">Manual SKU or Barcode Lookup:</label>
                <div class="flex gap-2 mt-1">
                  <input
                    id="qr-manual-input"
                    type="text"
                    placeholder="e.g. CHR-PAI-101, 6901000000, or paste QR data..."
                    class="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button id="btn-qr-manual-lookup" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">search</span>
                    <span>Lookup</span>
                  </button>
                </div>
              </div>

              <!-- Instant Test Simulation Chips -->
              <div class="space-y-1">
                <span class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Test Simulation (Click any item to simulate instant scan):</span>
                <div class="flex flex-wrap gap-1.5 text-[11px]">
                  ${this.renderQuickSampleChips()}
                </div>
              </div>

              <!-- Scanned Product Action Card -->
              ${this.renderScannedProductCard()}
            </div>
          </div>
        </div>
      `;
    }

    if (this.modalState === 'productQrTag' && this.activeProductForQrTag) {
      const p = this.activeProductForQrTag;
      return `
        <div class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div class="w-full max-w-md bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-2xl space-y-4 my-auto">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-400">qr_code</span>
                <h3 class="font-bold text-base text-white">Shelf QR & Barcode Tag</h3>
              </div>
              <button id="modal-qr-tag-close" class="p-1 rounded text-slate-400 hover:text-white">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <!-- Printable Shelf Label Tag -->
            <div id="printable-shelf-label" class="p-4 bg-white text-black rounded-xl border-2 border-dashed border-slate-300 shadow-inner flex flex-col items-center text-center space-y-2">
              <div class="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Chercher Building Material Retail</div>
              <div class="font-extrabold text-base leading-tight text-slate-900">${p.name}</div>
              <div class="text-xs text-slate-700">${p.brand} • Unit: ${p.unit}</div>
              
              <img src="${this.generatedQrDataUrl}" alt="QR Code for ${p.code}" class="w-44 h-44 object-contain my-1 border border-slate-200 p-1 rounded-lg" />
              
              <div class="font-mono text-xs font-bold text-slate-800 tracking-wider">SKU: ${p.code}</div>
              <div class="font-mono text-[10px] text-slate-500">Barcode: ${p.barcode}</div>
              <div class="text-lg font-black text-emerald-700 pt-1">${formatETB(p.sellingPrice)}</div>
            </div>

            <div class="flex gap-2 pt-2 border-t border-slate-800">
              <button id="btn-print-shelf-label" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition">
                <span class="material-symbols-outlined text-base">print</span>
                <span>Print Shelf Tag</span>
              </button>
              <a href="${this.generatedQrDataUrl}" download="QR_${p.code}.png" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1 transition">
                <span class="material-symbols-outlined text-base">download</span>
                <span>Download PNG</span>
              </a>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  private renderQuickSampleChips(): string {
    const sampleSkus = ['CHR-PAI-101', 'CHR-PAI-103', 'CHR-ELE-126', 'CHR-PLU-138', 'CHR-LOC-149'];
    return sampleSkus
      .map((sku) => {
        const prod = this.db.findProductByBarcodeOrSku(sku);
        if (!prod) return '';
        return `
          <button class="btn-qr-sample-chip px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 font-mono transition flex items-center gap-1" data-sku="${sku}">
            <span class="material-symbols-outlined text-[12px] text-emerald-400">qr_code</span>
            <span>${sku} (${prod.name.split(' ')[0]})</span>
          </button>
        `;
      })
      .join('');
  }

  private renderScannedProductCard(): string {
    if (!this.qrLastScannedProduct) {
      return `
        <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400">
          <span class="material-symbols-outlined text-2xl text-slate-600 block mb-1">barcode_reader</span>
          <span>Waiting for scan... Point camera at a barcode or click a test sample above.</span>
        </div>
      `;
    }

    const p = this.qrLastScannedProduct;
    const cat = this.db.categories.find((c) => c.id === p.categoryId);
    const isLow = p.quantity <= p.minThreshold;

    return `
      <div class="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 shadow-xl space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">${p.code}</span>
              <span class="text-[11px] text-slate-400 font-mono">${p.barcode}</span>
            </div>
            <h4 class="font-bold text-sm text-white mt-1">${p.name}</h4>
            <div class="text-[11px] text-slate-400">${p.brand} • ${cat?.name || 'Hardware'} • Unit: <strong class="text-slate-200">${p.unit}</strong></div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-base font-extrabold text-amber-400">${formatETB(p.sellingPrice)}</div>
            <div class="text-[10px] text-slate-400">Cost: ${formatETB(p.purchasePrice)}</div>
          </div>
        </div>

        <!-- Stock Status & Live Adjustment Controls -->
        <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400">Current In-Stock:</span>
            <span class="font-bold text-sm ${isLow ? 'text-rose-400' : 'text-emerald-400'}">
              ${p.quantity} ${p.unit} ${isLow ? '(Low Stock Alert)' : ''}
            </span>
          </div>

          <!-- Quick Physical Recount / Stock Adjustment -->
          <div class="pt-2 border-t border-slate-800/80">
            <div class="flex items-center justify-between text-xs mb-1.5">
              <label class="text-slate-300 font-medium">Physical Yard Count / Recount:</label>
              <div class="flex items-center gap-1">
                <button class="btn-qr-delta-qty px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300" data-delta="-10">-10</button>
                <button class="btn-qr-delta-qty px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300" data-delta="-1">-1</button>
                <button class="btn-qr-delta-qty px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300" data-delta="1">+1</button>
                <button class="btn-qr-delta-qty px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300" data-delta="10">+10</button>
                <button class="btn-qr-delta-qty px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300" data-delta="50">+50</button>
              </div>
            </div>
            <div class="flex gap-2">
              <input
                id="qr-adjust-qty-input"
                type="number"
                class="w-28 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                value="${p.quantity}"
                min="0"
              />
              <input
                id="qr-adjust-reason-input"
                type="text"
                class="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                placeholder="Recount reason (e.g. Audit verification)"
                value="Physical warehouse recount via QR scanner"
              />
              <button id="btn-qr-save-stock" class="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition whitespace-nowrap">
                Save Stock
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Actions Row -->
        <div class="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <button id="btn-qr-add-to-pos" class="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition">
            <span class="material-symbols-outlined text-base">add_shopping_cart</span>
            <span>Add to POS Cart</span>
          </button>
          <button id="btn-qr-print-tag" class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold flex items-center gap-1 border border-slate-700 transition">
            <span class="material-symbols-outlined text-base">print</span>
            <span>Print Tag</span>
          </button>
          <button id="btn-qr-scan-next" class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1 border border-slate-700 transition">
            <span class="material-symbols-outlined text-base">restart_alt</span>
            <span>Scan Next</span>
          </button>
        </div>
      </div>
    `;
  }

  private openQrScanner(mode: 'inventory' | 'pos') {
    this.qrScannerMode = mode;
    this.modalState = 'qrScanner';
    this.qrScanError = null;
    this.qrScanFeedback = null;
    this.render();
  }

  private closeQrScanner() {
    this.qrScanner.stopScanning();
    this.modalState = 'none';
    this.qrLastScannedProduct = null;
    this.qrScanFeedback = null;
    this.qrScanError = null;
    this.render();
  }

  private async openProductQrTag(product: Product) {
    this.activeProductForQrTag = product;
    const qrPayload = JSON.stringify({
      shop: 'Chercher Building Materials',
      sku: product.code,
      name: product.name,
      unit: product.unit,
      price: product.sellingPrice,
      barcode: product.barcode,
    });
    this.generatedQrDataUrl = await this.qrScanner.generateQrDataUrl(qrPayload, {
      width: 320,
      margin: 1,
    });
    this.modalState = 'productQrTag';
    this.render();
  }

  private handleScannedCode(rawText: string) {
    const code = this.qrScanner.parseScannedProductCode(rawText);
    const prod = this.db.findProductByBarcodeOrSku(code);

    if (!prod) {
      this.qrScanError = `No material found matching: "${code}". Check SKU or add to catalog.`;
      this.qrScanFeedback = null;
      this.render();
      return;
    }

    this.qrScanError = null;
    this.qrLastScannedProduct = prod;

    if (this.qrScannerMode === 'pos') {
      const existing = this.posCart.find((c) => c.product.id === prod.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        this.posCart.push({ product: prod, quantity: 1, unitPrice: prod.sellingPrice });
      }
      this.qrScanFeedback = `Added 1x ${prod.name} to POS Cart! (Total: ${
        this.posCart.find((c) => c.product.id === prod.id)?.quantity
      } ${prod.unit})`;
      this.render();
    } else {
      this.qrScanFeedback = `Located ${prod.name} (${prod.code})! Current stock: ${prod.quantity} ${prod.unit}`;
      this.render();
    }
  }

  // ATTACH EVENT LISTENERS
  private attachEventListeners() {
    // 1. Camera Lifecycle for QR Scanner Modal
    if (this.modalState === 'qrScanner') {
      const videoEl = this.container.querySelector('#qr-scanner-video') as HTMLVideoElement;
      if (videoEl) {
        this.qrScanner.startScanning(
          videoEl,
          (code) => this.handleScannedCode(code),
          (errMsg) => {
            this.qrScanError = errMsg;
            const errBox = this.container.querySelector('#qr-camera-error-msg');
            if (errBox) {
              errBox.classList.remove('hidden');
              const p = errBox.querySelector('p');
              if (p) p.textContent = errMsg;
            }
          },
          { continuous: this.qrScannerMode === 'pos', cooldownMs: 1600 },
        );
      }
    } else {
      this.qrScanner.stopScanning();
    }

    // Top navbar QR scanner shortcut
    this.container.querySelector('#btn-top-qr-scanner')?.addEventListener('click', () => {
      this.openQrScanner('inventory');
    });

    // Inventory Toolbar Scan QR button
    this.container.querySelector('#btn-open-qr-scanner-inv')?.addEventListener('click', () => {
      this.openQrScanner('inventory');
    });

    // POS Scan to Cart button
    this.container.querySelector('#btn-pos-scan-barcode')?.addEventListener('click', () => {
      this.openQrScanner('pos');
    });

    // Product table row QR shelf label tag buttons
    this.container.querySelectorAll('.btn-view-product-qr').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prodId = (btn as HTMLElement).dataset.prodId;
        const prod = this.db.products.find((p) => p.id === prodId);
        if (prod) {
          this.openProductQrTag(prod);
        }
      });
    });

    // QR Scanner Modal internal controls
    this.container.querySelector('#modal-qr-close')?.addEventListener('click', () => {
      this.closeQrScanner();
    });

    this.container.querySelector('#btn-qr-mode-inv')?.addEventListener('click', () => {
      this.qrScannerMode = 'inventory';
      this.render();
    });

    this.container.querySelector('#btn-qr-mode-pos')?.addEventListener('click', () => {
      this.qrScannerMode = 'pos';
      this.render();
    });

    this.container.querySelector('#btn-qr-toggle-torch')?.addEventListener('click', async () => {
      await this.qrScanner.toggleTorch();
    });

    this.container.querySelector('#btn-qr-flip-camera')?.addEventListener('click', async () => {
      const videoEl = this.container.querySelector('#qr-scanner-video') as HTMLVideoElement;
      if (videoEl) {
        await this.qrScanner.toggleCamera(
          videoEl,
          (code) => this.handleScannedCode(code),
          (err) => console.warn('Flip camera error:', err),
        );
      }
    });

    this.container.querySelector('#btn-qr-retry-camera')?.addEventListener('click', () => {
      const videoEl = this.container.querySelector('#qr-scanner-video') as HTMLVideoElement;
      if (videoEl) {
        this.qrScanError = null;
        this.qrScanner.startScanning(
          videoEl,
          (code) => this.handleScannedCode(code),
          (errMsg) => {
            this.qrScanError = errMsg;
            this.render();
          },
        );
      }
    });

    // Manual input search & Enter key
    const submitManualLookup = () => {
      const input = this.container.querySelector('#qr-manual-input') as HTMLInputElement;
      const val = input?.value?.trim();
      if (val) {
        this.handleScannedCode(val);
      }
    };

    this.container.querySelector('#btn-qr-manual-lookup')?.addEventListener('click', submitManualLookup);
    this.container.querySelector('#qr-manual-input')?.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') {
        submitManualLookup();
      }
    });

    // Sample simulation chips
    this.container.querySelectorAll('.btn-qr-sample-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sku = (btn as HTMLElement).dataset.sku;
        if (sku) {
          this.handleScannedCode(sku);
        }
      });
    });

    // Delta quantity stepper buttons inside scanned product card
    this.container.querySelectorAll('.btn-qr-delta-qty').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = parseInt((btn as HTMLElement).dataset.delta || '0', 10);
        const input = this.container.querySelector('#qr-adjust-qty-input') as HTMLInputElement;
        if (input) {
          input.value = String(Math.max(0, parseInt(input.value || '0', 10) + delta));
        }
      });
    });

    // Save stock directly from scanned product card
    this.container.querySelector('#btn-qr-save-stock')?.addEventListener('click', () => {
      if (!this.qrLastScannedProduct) return;
      const input = this.container.querySelector('#qr-adjust-qty-input') as HTMLInputElement;
      const reasonInput = this.container.querySelector('#qr-adjust-reason-input') as HTMLInputElement;
      const newQty = parseInt(input?.value || '0', 10);
      const reason = reasonInput?.value || 'Warehouse physical recount via QR scan';

      const res = this.db.adjustStock({
        productId: this.qrLastScannedProduct.id,
        newQuantity: newQty,
        reason,
      });

      if (res.success) {
        this.qrScanner.playScanBeep();
        this.qrScanFeedback = `Stock updated! ${this.qrLastScannedProduct.name} is now ${newQty} ${this.qrLastScannedProduct.unit}.`;
        this.qrLastScannedProduct.quantity = newQty;
        this.render();
      } else {
        alert(res.error || 'Failed to update stock');
      }
    });

    // Add to POS Cart from scanned card
    this.container.querySelector('#btn-qr-add-to-pos')?.addEventListener('click', () => {
      if (this.qrLastScannedProduct) {
        const p = this.qrLastScannedProduct;
        const existing = this.posCart.find((c) => c.product.id === p.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          this.posCart.push({ product: p, quantity: 1, unitPrice: p.sellingPrice });
        }
        this.closeQrScanner();
        this.currentTab = 'pos';
        this.render();
      }
    });

    // Print Shelf Tag from scanned card
    this.container.querySelector('#btn-qr-print-tag')?.addEventListener('click', () => {
      if (this.qrLastScannedProduct) {
        this.openProductQrTag(this.qrLastScannedProduct);
      }
    });

    // Scan Next Item
    this.container.querySelector('#btn-qr-scan-next')?.addEventListener('click', () => {
      this.qrLastScannedProduct = null;
      this.qrScanFeedback = null;
      this.qrScanError = null;
      this.render();
    });

    // Shelf Tag Modal buttons
    this.container.querySelector('#modal-qr-tag-close')?.addEventListener('click', () => {
      this.modalState = 'none';
      this.render();
    });

    this.container.querySelector('#btn-print-shelf-label')?.addEventListener('click', () => {
      window.print();
    });

    // Tab switching
    this.container.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.tab as typeof this.currentTab;
        if (tab) {
          this.currentTab = tab;
          this.closeMobileNav();
          this.render();
        }
      });
    });

    // Language switcher
    this.container.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const l = (btn as HTMLElement).dataset.lang as SupportedLanguage;
        if (l) {
          this.lang = l;
          this.render();
        }
      });
    });

    // User Role switcher
    const roleSelect = this.container.querySelector('#select-role-switcher') as HTMLSelectElement;
    if (roleSelect) {
      roleSelect.addEventListener('change', (e) => {
        const newRole = (e.target as HTMLSelectElement).value as UserRole;
        this.db.switchUserRole(newRole);
        this.render();
      });
    }

    // Role switcher buttons in users tab
    this.container.querySelectorAll('.btn-switch-user-role').forEach((btn) => {
      btn.addEventListener('click', () => {
        const r = (btn as HTMLElement).dataset.role as UserRole;
        if (r) {
          this.db.switchUserRole(r);
          this.render();
        }
      });
    });

    // Mobile nav toggle
    const mobileNavToggle = this.container.querySelector('#btn-mobile-nav-toggle');
    const mobileNavDrawer = this.container.querySelector('#mobile-nav-drawer');
    const closeMobileNavBtn = this.container.querySelector('#btn-close-mobile-nav');

    if (mobileNavToggle && mobileNavDrawer) {
      mobileNavToggle.addEventListener('click', () => {
        mobileNavDrawer.classList.remove('hidden');
      });
    }
    if (closeMobileNavBtn && mobileNavDrawer) {
      closeMobileNavBtn.addEventListener('click', () => {
        mobileNavDrawer.classList.add('hidden');
      });
    }

    // Enter XR buttons
    const triggerEnterXR = () => {
      const xrBtn = document.querySelector('.XRButton') as HTMLButtonElement;
      if (xrBtn) {
        xrBtn.click();
      } else {
        // Hide 2D PWA container to view 3D canvas directly
        this.container.classList.add('opacity-10', 'pointer-events-none');
        const overlay = document.createElement('div');
        overlay.id = 'xr-sim-banner';
        overlay.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/90 border border-sky-500/40 text-white text-xs font-semibold flex items-center gap-3 shadow-2xl';
        overlay.innerHTML = `
          <span>Viewing 3D Warehouse & Pallets (Desktop Simulator / WebXR)</span>
          <button id="btn-exit-sim" class="px-2.5 py-1 rounded bg-sky-600 text-white font-bold hover:bg-sky-500">Back to Dashboard</button>
        `;
        document.body.appendChild(overlay);
        document.getElementById('btn-exit-sim')?.addEventListener('click', () => {
          overlay.remove();
          this.container.classList.remove('opacity-10', 'pointer-events-none');
        });
      }
    };

    this.container.querySelector('#btn-enter-xr-sidebar')?.addEventListener('click', triggerEnterXR);
    this.container.querySelector('#btn-enter-xr-top')?.addEventListener('click', triggerEnterXR);
    this.container.querySelector('#btn-enter-xr-mobile')?.addEventListener('click', triggerEnterXR);
    this.container.querySelector('#btn-enter-xr-dash')?.addEventListener('click', triggerEnterXR);

    // POS Catalog Search and Category filters
    const posSearchInput = this.container.querySelector('#pos-search-input') as HTMLInputElement;
    if (posSearchInput) {
      posSearchInput.addEventListener('input', (e) => {
        this.posSearchQuery = (e.target as HTMLInputElement).value;
        this.render();
      });
    }

    this.container.querySelectorAll('.pos-cat-filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.posSelectedCategory = (btn as HTMLElement).dataset.cat || 'all';
        this.render();
      });
    });

    // Inventory Catalog Search and Category filters
    const invSearchInput = this.container.querySelector('#inv-search-input') as HTMLInputElement;
    if (invSearchInput) {
      invSearchInput.addEventListener('input', (e) => {
        this.invSearchQuery = (e.target as HTMLInputElement).value;
        this.render();
      });
    }

    this.container.querySelectorAll('.inv-cat-filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.invSelectedCategory = (btn as HTMLElement).dataset.cat || 'all';
        this.render();
      });
    });

    const invReviewBtn = this.container.querySelector('#inv-filter-review-btn');
    if (invReviewBtn) {
      invReviewBtn.addEventListener('click', () => {
        this.invOnlyNeedsReview = !this.invOnlyNeedsReview;
        this.render();
      });
    }

    // POS Add to Cart
    this.container.querySelectorAll('.pos-product-card').forEach((card) => {
      card.addEventListener('click', () => {
        const prodId = (card as HTMLElement).dataset.prodId;
        const prod = this.db.products.find((p) => p.id === prodId);
        if (prod) {
          if (prod.quantity <= 0 && !this.posAllowNegative) {
            alert(`Cannot add ${prod.name}: Stock is zero. Admin override required.`);
            return;
          }
          const existing = this.posCart.find((c) => c.product.id === prod.id);
          if (existing) {
            existing.quantity += 1;
          } else {
            this.posCart.push({ product: prod, quantity: 1, unitPrice: prod.sellingPrice });
          }
          this.render();
        }
      });
    });

    // POS Cart controls
    this.container.querySelectorAll('.pos-cart-inc').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt((btn as HTMLElement).dataset.idx || '0');
        if (this.posCart[idx]) {
          this.posCart[idx].quantity += 1;
          this.render();
        }
      });
    });

    this.container.querySelectorAll('.pos-cart-dec').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt((btn as HTMLElement).dataset.idx || '0');
        if (this.posCart[idx]) {
          this.posCart[idx].quantity = Math.max(1, this.posCart[idx].quantity - 1);
          this.render();
        }
      });
    });

    this.container.querySelectorAll('.pos-cart-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt((btn as HTMLElement).dataset.idx || '0');
        this.posCart.splice(idx, 1);
        this.render();
      });
    });

    const clearCartBtn = this.container.querySelector('#pos-btn-clear-cart');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => {
        this.posCart = [];
        this.render();
      });
    }

    // POS Customer Select
    const custSelect = this.container.querySelector('#pos-customer-select') as HTMLSelectElement;
    if (custSelect) {
      custSelect.addEventListener('change', (e) => {
        this.posSelectedCustomerId = (e.target as HTMLSelectElement).value;
        const c = this.db.customers.find((cust) => cust.id === this.posSelectedCustomerId);
        this.posCustomerName = c ? c.name : '';
      });
    }

    // POS Discount
    const discountInput = this.container.querySelector('#pos-discount-input') as HTMLInputElement;
    if (discountInput) {
      discountInput.addEventListener('input', (e) => {
        this.posDiscount = Math.max(0, parseFloat((e.target as HTMLInputElement).value || '0'));
        this.render();
      });
    }

    // POS Payment Method
    this.container.querySelectorAll('.pos-pay-method-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.posPaymentMethod = (btn as HTMLElement).dataset.method as PaymentMethod;
        this.render();
      });
    });

    // POS Tendered Input
    const tenderedInput = this.container.querySelector('#pos-tendered-input') as HTMLInputElement;
    if (tenderedInput) {
      tenderedInput.addEventListener('input', (e) => {
        this.posPaidAmount = parseFloat((e.target as HTMLInputElement).value || '0');
      });
    }

    // POS Allow Negative
    const allowNegativeBox = this.container.querySelector('#pos-allow-negative') as HTMLInputElement;
    if (allowNegativeBox) {
      allowNegativeBox.addEventListener('change', (e) => {
        this.posAllowNegative = (e.target as HTMLInputElement).checked;
      });
    }

    // POS Submit Sale
    const submitSaleBtn = this.container.querySelector('#pos-btn-submit-sale');
    if (submitSaleBtn) {
      submitSaleBtn.addEventListener('click', () => {
        if (this.posCart.length === 0) return;

        const subtotal = this.posCart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const total = Math.max(0, subtotal - this.posDiscount);
        const paid = this.posPaidAmount || (this.posPaymentMethod === 'credit' ? 0 : total);

        const res = this.db.createSale({
          customerId: this.posSelectedCustomerId || undefined,
          customerName: this.posCustomerName,
          items: this.posCart.map((i) => ({ productId: i.product.id, quantity: i.quantity, unitPrice: i.unitPrice })),
          discount: this.posDiscount,
          paymentMethod: this.posPaymentMethod,
          paidAmount: paid,
          allowNegativeStock: this.posAllowNegative,
        });

        if (res.success && res.sale) {
          this.posCart = [];
          this.posDiscount = 0;
          this.selectedSaleForModal = res.sale;
          this.modalState = 'receipt';
          this.music.playProceduralTrack('fanfare');
          this.render();
        } else {
          alert(res.error || 'Sale failed');
        }
      });
    }

    // View Receipt from table
    this.container.querySelectorAll('.btn-view-receipt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const saleId = (btn as HTMLElement).dataset.saleId;
        const sale = this.db.sales.find((s) => s.id === saleId);
        if (sale) {
          this.selectedSaleForModal = sale;
          this.modalState = 'receipt';
          this.render();
        }
      });
    });

    // Inbound Purchase Order Submit
    const poSubmitBtn = this.container.querySelector('#po-btn-submit');
    if (poSubmitBtn) {
      poSubmitBtn.addEventListener('click', () => {
        const supId = (this.container.querySelector('#po-supplier-select') as HTMLSelectElement).value;
        const prodId = (this.container.querySelector('#po-product-select') as HTMLSelectElement).value;
        const qty = parseInt((this.container.querySelector('#po-qty-input') as HTMLInputElement).value || '0');
        const cost = parseFloat((this.container.querySelector('#po-cost-input') as HTMLInputElement).value || '0');

        if (qty <= 0 || cost <= 0) {
          alert('Please enter valid quantity and unit cost');
          return;
        }

        const res = this.db.createPurchase({
          supplierId: supId,
          items: [{ productId: prodId, quantity: qty, unitCost: cost }],
          paidAmount: 0,
          paymentMethod: 'bank_transfer',
          notes: 'Standard warehouse replenishment',
        });

        if (res.success) {
          alert('Goods received and added to inventory stock!');
          this.render();
        } else {
          alert(res.error);
        }
      });
    }

    // Modal Close
    this.container.querySelector('#modal-btn-close')?.addEventListener('click', () => {
      this.modalState = 'none';
      this.render();
    });
    this.container.querySelector('#modal-btn-dismiss')?.addEventListener('click', () => {
      this.modalState = 'none';
      this.render();
    });

    // Open Adjust Stock Modal
    this.container.querySelectorAll('.btn-open-adjust-stock').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prodId = (btn as HTMLElement).dataset.prodId;
        const p = this.db.products.find((prod) => prod.id === prodId);
        if (p) {
          this.activeProductToAdjust = p;
          this.modalState = 'adjustStock';
          this.render();
        }
      });
    });

    // Submit Adjust Stock
    this.container.querySelector('#modal-btn-submit-adjust')?.addEventListener('click', () => {
      if (!this.activeProductToAdjust) return;
      const newQty = parseInt((this.container.querySelector('#modal-adjust-qty') as HTMLInputElement).value || '0');
      const reason = (this.container.querySelector('#modal-adjust-reason') as HTMLInputElement).value;
      this.db.adjustStock({
        productId: this.activeProductToAdjust.id,
        newQuantity: newQty,
        reason,
      });
      this.modalState = 'none';
      this.render();
    });

    // Open Collect Customer Debt
    this.container.querySelectorAll('.btn-open-collect-customer').forEach((btn) => {
      btn.addEventListener('click', () => {
        const custId = (btn as HTMLElement).dataset.custId;
        const c = this.db.customers.find((cust) => cust.id === custId);
        if (c) {
          this.activeCustomerToCollect = c;
          this.modalState = 'collectCustomer';
          this.render();
        }
      });
    });

    this.container.querySelector('#modal-btn-submit-collect')?.addEventListener('click', () => {
      if (!this.activeCustomerToCollect) return;
      const amount = parseFloat((this.container.querySelector('#modal-collect-amount') as HTMLInputElement).value || '0');
      const method = (this.container.querySelector('#modal-collect-method') as HTMLSelectElement).value as PaymentMethod;
      this.db.recordCustomerPayment({
        customerId: this.activeCustomerToCollect.id,
        amount,
        paymentMethod: method,
      });
      this.modalState = 'none';
      this.render();
    });

    // Open Pay Supplier
    this.container.querySelectorAll('.btn-open-pay-supplier').forEach((btn) => {
      btn.addEventListener('click', () => {
        const supId = (btn as HTMLElement).dataset.supId;
        const s = this.db.suppliers.find((sup) => sup.id === supId);
        if (s) {
          this.activeSupplierToPay = s;
          this.modalState = 'paySupplier';
          this.render();
        }
      });
    });

    this.container.querySelector('#modal-btn-submit-pay-supplier')?.addEventListener('click', () => {
      if (!this.activeSupplierToPay) return;
      const amount = parseFloat((this.container.querySelector('#modal-pay-amount') as HTMLInputElement).value || '0');
      const method = (this.container.querySelector('#modal-pay-method') as HTMLSelectElement).value as PaymentMethod;
      this.db.recordSupplierPayment({
        supplierId: this.activeSupplierToPay.id,
        amount,
        paymentMethod: method,
      });
      this.modalState = 'none';
      this.render();
    });

    // Open Add Expense
    this.container.querySelector('#btn-open-add-expense')?.addEventListener('click', () => {
      this.modalState = 'addExpense';
      this.render();
    });

    this.container.querySelector('#modal-btn-submit-expense')?.addEventListener('click', () => {
      const cat = (this.container.querySelector('#modal-exp-cat') as HTMLSelectElement).value as Expense['category'];
      const title = (this.container.querySelector('#modal-exp-title') as HTMLInputElement).value;
      const amount = parseFloat((this.container.querySelector('#modal-exp-amount') as HTMLInputElement).value || '0');
      if (!title || amount <= 0) {
        alert('Please fill expense description and positive amount');
        return;
      }
      this.db.recordExpense({
        category: cat,
        title,
        amount,
        paymentMethod: 'cash',
      });
      this.modalState = 'none';
      this.render();
    });

    // Open Daily Closing
    this.container.querySelector('#btn-open-daily-closing')?.addEventListener('click', () => {
      this.modalState = 'dailyClosing';
      this.render();
    });

    this.container.querySelector('#modal-btn-submit-closing')?.addEventListener('click', () => {
      const cash = parseFloat((this.container.querySelector('#modal-closing-cash') as HTMLInputElement).value || '0');
      const notes = (this.container.querySelector('#modal-closing-notes') as HTMLInputElement).value;
      alert(`Daily closing recorded with physical cash: ${formatETB(cash)}. Report archived to audit log.`);
      this.db.auditLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: this.db.currentUser.id,
        userName: this.db.currentUser.name,
        action: 'DAILY_REGISTER_CLOSED',
        module: 'financials',
        details: `Day closed with counted cash ${cash} ETB. Notes: ${notes}`,
      });
      this.modalState = 'none';
      this.render();
    });

    // Open Add Product
    this.container.querySelector('#btn-open-add-product')?.addEventListener('click', () => {
      this.modalState = 'addProduct';
      this.render();
    });

    this.container.querySelector('#modal-btn-submit-add-product')?.addEventListener('click', () => {
      const name = (this.container.querySelector('#modal-prod-name') as HTMLInputElement).value;
      const code = (this.container.querySelector('#modal-prod-code') as HTMLInputElement).value;
      const brand = (this.container.querySelector('#modal-prod-brand') as HTMLInputElement).value;
      const cat = (this.container.querySelector('#modal-prod-cat') as HTMLSelectElement).value;
      const unit = (this.container.querySelector('#modal-prod-unit') as HTMLSelectElement).value as any;
      const cost = parseFloat((this.container.querySelector('#modal-prod-cost') as HTMLInputElement).value || '0');
      const price = parseFloat((this.container.querySelector('#modal-prod-price') as HTMLInputElement).value || '0');
      const qty = parseInt((this.container.querySelector('#modal-prod-qty') as HTMLInputElement).value || '0');
      const thresh = parseInt((this.container.querySelector('#modal-prod-thresh') as HTMLInputElement).value || '10');

      if (!name || price <= 0) {
        alert('Please fill product name and positive selling price');
        return;
      }

      this.db.saveProduct({
        name,
        code,
        brand,
        categoryId: cat,
        unit,
        purchasePrice: cost,
        sellingPrice: price,
        quantity: qty,
        minThreshold: thresh,
      });

      this.modalState = 'none';
      this.render();
    });

    // Music Studio Controls
    this.container.querySelector('#btn-top-music')?.addEventListener('click', () => {
      this.currentTab = 'music';
      this.render();
    });

    this.container.querySelector('#btn-toggle-play-main')?.addEventListener('click', () => {
      this.music.togglePlay();
      this.render();
    });

    this.container.querySelector('#btn-play-synth-tizita')?.addEventListener('click', () => {
      this.music.playProceduralTrack('tizita');
      this.render();
    });

    this.container.querySelector('#btn-play-synth-fanfare')?.addEventListener('click', () => {
      this.music.playProceduralTrack('fanfare');
      this.render();
    });

    this.container.querySelector('#btn-generate-lyria')?.addEventListener('click', async () => {
      const prompt = (this.container.querySelector('#lyria-prompt-input') as HTMLTextAreaElement).value;
      const statusLabel = this.container.querySelector('#lyria-status-msg');
      if (statusLabel) statusLabel.textContent = 'Contacting Lyria API...';

      const res = await this.music.generateLyriaTrack(prompt, (msg) => {
        if (statusLabel) statusLabel.textContent = msg;
      });

      if (res.success) {
        if (statusLabel) statusLabel.textContent = 'Track ready and playing!';
        this.render();
      } else {
        if (statusLabel) statusLabel.textContent = res.error || 'Failed';
      }
    });

    this.container.querySelectorAll('.btn-play-track').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.trackId;
        const tr = this.music.tracks.find((t) => t.id === id);
        if (tr) {
          if (tr.source === 'lyria') {
            this.music.playLyriaTrack(tr);
          } else {
            this.music.playProceduralTrack(tr.duration === 'Fanfare' ? 'fanfare' : 'tizita');
          }
          this.render();
        }
      });
    });

    // Web Admin Tab Event Handlers
    this.container.querySelector('#btn-save-store-profile')?.addEventListener('click', () => {
      const name = (this.container.querySelector('#store-name-input') as HTMLInputElement)?.value || '';
      const tagline = (this.container.querySelector('#store-tagline-input') as HTMLInputElement)?.value || '';
      const tin = (this.container.querySelector('#store-tin-input') as HTMLInputElement)?.value || '';
      const vatNumber = (this.container.querySelector('#store-vat-input') as HTMLInputElement)?.value || '';
      const address = (this.container.querySelector('#store-address-input') as HTMLInputElement)?.value || '';
      const city = (this.container.querySelector('#store-city-input') as HTMLInputElement)?.value || '';
      const phone = (this.container.querySelector('#store-phone-input') as HTMLInputElement)?.value || '';
      const email = (this.container.querySelector('#store-email-input') as HTMLInputElement)?.value || '';

      this.db.updateStoreProfile({ name, tagline, tin, vatNumber, address, city, phone, email });
      this.showAdminToast('Business profile and tax details saved successfully!');
    });

    this.container.querySelector('#btn-save-printer-settings')?.addEventListener('click', () => {
      const receiptHeader = (this.container.querySelector('#store-header-input') as HTMLTextAreaElement)?.value || '';
      const receiptFooter = (this.container.querySelector('#store-footer-input') as HTMLTextAreaElement)?.value || '';
      const printerWidth = ((this.container.querySelector('#store-printer-select') as HTMLSelectElement)?.value || '80mm') as '80mm' | '58mm';
      const enableSound = (this.container.querySelector('#store-sound-toggle') as HTMLInputElement)?.checked ?? true;

      this.db.updateStoreProfile({ receiptHeader, receiptFooter, printerWidth, enableSound });
      this.showAdminToast('POS thermal printer and receipt formats updated!');
    });

    const triggerBackupDownload = () => {
      const json = this.db.exportDatabaseBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chercher_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showAdminToast('Backup JSON downloaded successfully!');
    };

    this.container.querySelector('#btn-admin-download-backup')?.addEventListener('click', triggerBackupDownload);
    this.container.querySelector('#btn-action-export-json')?.addEventListener('click', triggerBackupDownload);

    this.container.querySelector('#btn-action-trigger-import')?.addEventListener('click', () => {
      const fileInput = this.container.querySelector('#input-backup-file') as HTMLInputElement;
      fileInput?.click();
    });

    this.container.querySelector('#input-backup-file')?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const res = this.db.importDatabaseBackup(text);
        if (res.success) {
          this.showAdminToast(res.message);
          setTimeout(() => this.render(), 800);
        } else {
          alert(`Backup import failed: ${res.message}`);
        }
      };
      reader.readAsText(file);
    });

    this.container.querySelector('#btn-action-seed-demo')?.addEventListener('click', () => {
      this.db.seedDemoTransactions();
      this.showAdminToast('Generated realistic test transactions for POS and reports!');
      setTimeout(() => this.render(), 600);
    });

    this.container.querySelector('#btn-action-factory-reset')?.addEventListener('click', () => {
      if (confirm('Reset catalog and transactions to official Chercher hardware seed?')) {
        this.db.resetToDefaultSeed();
        this.showAdminToast('System reset to original Chercher stock catalogue!');
        setTimeout(() => this.render(), 600);
      }
    });

    // PWA Installation Buttons (Dashboard Banner, Top Navbar, Desktop Sidebar, Mobile Drawer, Admin Tab)
    const handleInstallClick = () => this.triggerPwaInstall();
    this.container.querySelector('#btn-dash-install-pwa')?.addEventListener('click', handleInstallClick);
    this.container.querySelector('#btn-top-install-app')?.addEventListener('click', handleInstallClick);
    this.container.querySelector('#btn-sidebar-install-app')?.addEventListener('click', handleInstallClick);
    this.container.querySelector('#btn-mobile-install-app')?.addEventListener('click', handleInstallClick);
    this.container.querySelector('#btn-admin-install-pwa')?.addEventListener('click', handleInstallClick);

    // Download ZIP Notification handlers
    const handleDownloadClick = () => {
      this.showToast('Downloading Chercher Shop Standalone ZIP Package (108 KB)...', 'download');
    };
    this.container.querySelector('#btn-dash-download-zip')?.addEventListener('click', handleDownloadClick);
    this.container.querySelector('#btn-top-download-zip')?.addEventListener('click', handleDownloadClick);
    this.container.querySelector('#btn-sidebar-download-zip')?.addEventListener('click', handleDownloadClick);
    this.container.querySelector('#btn-mobile-download-zip')?.addEventListener('click', handleDownloadClick);
    this.container.querySelector('#btn-admin-download-zip')?.addEventListener('click', handleDownloadClick);

    // iOS Install Guide Modal Controls
    this.container.querySelector('#modal-btn-close-ios-guide')?.addEventListener('click', () => {
      this.showIosInstallGuide = false;
      this.render();
    });
    this.container.querySelector('#modal-btn-dismiss-ios-guide')?.addEventListener('click', () => {
      this.showIosInstallGuide = false;
      this.render();
    });
  }

  // Trigger PWA Installation flow using InstallAppButton component
  private triggerPwaInstall() {
    this.installButton.triggerInstall(
      (platform) => {
        this.isPwaInstalled = true;
        this.showToast('Thank you for installing Chercher Building Material Retail Shop!', 'check_circle');
        this.render();
      },
      () => {
        this.showToast('Installation prompt was dismissed.', 'info');
      },
      () => {
        const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) && !(window as any).MSStream;
        if (isIos && !this.isPwaInstalled) {
          this.showIosInstallGuide = true;
          this.render();
          return;
        }

        if (this.isPwaInstalled) {
          this.showToast('Chercher App is already installed and running!', 'check_circle');
        } else {
          this.showToast(
            'To install: Tap browser menu (⋮) -> "Install App" or "Add to Home screen", or click the install icon in the URL bar.',
            'install_mobile',
          );
        }
      }
    );
  }

  // Render iOS Safari 2-step Add to Home Screen Modal
  private renderIosInstallGuideModal(): string {
    if (!this.showIosInstallGuide) return '';
    return `
      <div class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-2xl space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-amber-400 text-2xl">apple</span>
              <h3 class="font-bold text-base text-white">Install on iOS (iPhone / iPad)</h3>
            </div>
            <button id="modal-btn-close-ios-guide" class="p-1 rounded text-slate-400 hover:text-white">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <p class="text-xs text-slate-300 leading-relaxed">
            Safari on iOS does not support one-click automatic installation, but you can install Chercher Shop to your home screen in two simple steps:
          </p>

          <div class="space-y-3 text-xs">
            <div class="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div class="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">1</div>
              <div class="space-y-1">
                <div class="font-semibold text-white flex items-center gap-1.5">
                  <span>Tap the Share Button</span>
                  <span class="material-symbols-outlined text-sky-400 text-sm">ios_share</span>
                </div>
                <p class="text-slate-400 text-[11px]">Located in Safari's bottom toolbar on iPhone (or top right on iPad).</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">2</div>
              <div class="space-y-1">
                <div class="font-semibold text-white flex items-center gap-1.5">
                  <span>Select "Add to Home Screen"</span>
                  <span class="material-symbols-outlined text-emerald-400 text-sm">add_box</span>
                </div>
                <p class="text-slate-400 text-[11px]">Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong>, then tap <strong>"Add"</strong>.</p>
              </div>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
            <span class="material-symbols-outlined text-base">offline_bolt</span>
            <span>Once added, launch from your Home Screen for full offline support, fast caching, and full-screen experience.</span>
          </div>

          <button id="modal-btn-dismiss-ios-guide" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition">
            Got it, Close
          </button>
        </div>
      </div>
    `;
  }

  // Global Toast Notification System
  public showToast(msg: string, icon: string = 'info') {
    const toast = this.container.querySelector('#global-toast');
    const toastText = this.container.querySelector('#global-toast-text');
    const toastIcon = toast?.querySelector('.material-symbols-outlined');
    if (toast && toastText) {
      toastText.textContent = msg;
      if (toastIcon) toastIcon.textContent = icon;
      toast.classList.remove('hidden');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 4000);
    }
  }

  private showAdminToast(msg: string) {
    this.showToast(msg, 'verified');
    const toast = this.container.querySelector('#admin-toast');
    const toastText = this.container.querySelector('#admin-toast-text');
    if (toast && toastText) {
      toastText.textContent = msg;
      toast.classList.remove('hidden');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 3500);
    }
  }

  private closeMobileNav() {
    const mobileNavDrawer = this.container.querySelector('#mobile-nav-drawer');
    if (mobileNavDrawer) mobileNavDrawer.classList.add('hidden');
  }
}
