import { CHERCHER_CATEGORIES, generateChercherProducts } from '../data/chercherStock';
import {
  AuditLog,
  Category,
  Customer,
  DailyClosing,
  Expense,
  PaymentMethod,
  PaymentRecord,
  Product,
  Purchase,
  Sale,
  StockMovement,
  Supplier,
  UnitConversion,
  User,
  UserRole,
} from '../types';

const STORAGE_PREFIX = 'chercher_shop_v2_';

export class DatabaseService {
  private static instance: DatabaseService;

  public categories: Category[] = [];
  public unitConversions: UnitConversion[] = [];
  public products: Product[] = [];
  public customers: Customer[] = [];
  public suppliers: Supplier[] = [];
  public sales: Sale[] = [];
  public purchases: Purchase[] = [];
  public expenses: Expense[] = [];
  public payments: PaymentRecord[] = [];
  public stockMovements: StockMovement[] = [];
  public auditLogs: AuditLog[] = [];
  public dailyClosings: DailyClosing[] = [];
  public users: User[] = [];
  public currentUser: User = {
    id: 'usr_owner_1',
    name: 'Abebe Bikila',
    email: 'abebe@cherchershop.et',
    role: 'owner',
    phone: '+251 911 234567',
  };

  public storeProfile = {
    name: 'Chercher Building Material Retail Shop',
    tagline: 'High Quality Construction Materials, Paints & Hardware',
    tin: '0054892104',
    vatNumber: 'VAT-ETH-982134',
    address: 'Bole Subcity, Woreda 03, Main Commercial Road',
    city: 'Addis Ababa, Ethiopia',
    phone: '+251 911 234567 / +251 922 890123',
    email: 'info@cherchershop.et',
    receiptHeader: 'ቸርቸር የግንባታ እቃዎች መደብር\nChercher Building Material Retail Shop',
    receiptFooter: 'ስለመረጡን እናመሰግናለን! ጋንች፣ ሲሚንቶ፣ ቀለም፣ ሚስማርና ብረት\nThank you for choosing Chercher Shop!',
    currency: 'ETB',
    printerWidth: '80mm' as '80mm' | '58mm',
    enableSound: true,
  };

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public saveToStorage() {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}categories`, JSON.stringify(this.categories));
      localStorage.setItem(`${STORAGE_PREFIX}unitConversions`, JSON.stringify(this.unitConversions));
      localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(this.products));
      localStorage.setItem(`${STORAGE_PREFIX}customers`, JSON.stringify(this.customers));
      localStorage.setItem(`${STORAGE_PREFIX}suppliers`, JSON.stringify(this.suppliers));
      localStorage.setItem(`${STORAGE_PREFIX}sales`, JSON.stringify(this.sales));
      localStorage.setItem(`${STORAGE_PREFIX}purchases`, JSON.stringify(this.purchases));
      localStorage.setItem(`${STORAGE_PREFIX}expenses`, JSON.stringify(this.expenses));
      localStorage.setItem(`${STORAGE_PREFIX}payments`, JSON.stringify(this.payments));
      localStorage.setItem(`${STORAGE_PREFIX}stockMovements`, JSON.stringify(this.stockMovements));
      localStorage.setItem(`${STORAGE_PREFIX}auditLogs`, JSON.stringify(this.auditLogs));
      localStorage.setItem(`${STORAGE_PREFIX}dailyClosings`, JSON.stringify(this.dailyClosings));
      localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(this.users));
      localStorage.setItem(`${STORAGE_PREFIX}storeProfile`, JSON.stringify(this.storeProfile));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  public resetToDefaultSeed() {
    localStorage.clear();
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const storedProducts = localStorage.getItem(`${STORAGE_PREFIX}products`);
    if (storedProducts) {
      try {
        this.categories = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}categories`) || '[]');
        this.unitConversions = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}unitConversions`) || '[]');
        this.products = JSON.parse(storedProducts);
        this.customers = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}customers`) || '[]');
        this.suppliers = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}suppliers`) || '[]');
        this.sales = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}sales`) || '[]');
        this.purchases = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}purchases`) || '[]');
        this.expenses = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}expenses`) || '[]');
        this.payments = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}payments`) || '[]');
        this.stockMovements = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}stockMovements`) || '[]');
        this.auditLogs = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}auditLogs`) || '[]');
        this.dailyClosings = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}dailyClosings`) || '[]');
        this.users = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}users`) || '[]');
        const storedProfile = localStorage.getItem(`${STORAGE_PREFIX}storeProfile`);
        if (storedProfile) {
          this.storeProfile = { ...this.storeProfile, ...JSON.parse(storedProfile) };
        }
        return;
      } catch (e) {
        console.error('Failed to parse stored data, reloading seed', e);
      }
    }

    this.initializeDefaultSeed();
    this.saveToStorage();
  }

  private initializeDefaultSeed() {
    this.users = [
      {
        id: 'usr_owner_1',
        name: 'Ato Solomon (Chercher Retail)',
        email: 'solomon@cherchershop.et',
        role: 'owner',
        phone: '+251 911 234567',
      },
      {
        id: 'usr_mgr_1',
        name: 'Selamawit Desta',
        email: 'selam@cherchershop.et',
        role: 'manager',
        phone: '+251 912 345678',
      },
      {
        id: 'usr_csh_1',
        name: 'Dawit Kebede',
        email: 'dawit@cherchershop.et',
        role: 'cashier',
        phone: '+251 913 456789',
      },
      {
        id: 'usr_inv_1',
        name: 'Chala Tufa',
        email: 'chala@cherchershop.et',
        role: 'inventory',
        phone: '+251 914 567890',
      },
    ];

    // Load full Chercher categories
    this.categories = CHERCHER_CATEGORIES;

    this.unitConversions = [
      {
        id: 'uc_1',
        fromUnit: 'quintal',
        toUnit: 'kg',
        factor: 100,
        description: '1 Quintal = 100 kg (1 ኩንታል = 100 ኪ.ግ)',
      },
      {
        id: 'uc_2',
        fromUnit: 'tonne',
        toUnit: 'quintal',
        factor: 10,
        description: '1 Tonne = 10 Quintals = 1,000 kg (1 ቶን = 10 ኩንታል)',
      },
      {
        id: 'uc_3',
        fromUnit: 'box',
        toUnit: 'pc',
        factor: 100,
        description: '1 Box Screws = ~100 pcs',
      },
      {
        id: 'uc_4',
        fromUnit: 'carton',
        toUnit: 'kg',
        factor: 5,
        description: '1 Carton Nails = ~5 kg',
      },
      {
        id: 'uc_5',
        fromUnit: 'gallon',
        toUnit: 'L',
        factor: 3.785,
        description: '1 Gallon Paint = ~3.785 Litres',
      },
    ];

    this.suppliers = [
      {
        id: 'sup_panda',
        name: 'Panda Paints & Chemical Industries',
        contactPerson: 'Kidus Hailu',
        phone: '+251 11 558 0001',
        email: 'sales@pandapaints.et',
        address: 'Addis Ababa Industrial Zone',
        balancePayable: 140000,
        bankAccount: 'CBE 1000123456789',
        notes: 'Antirust, lacquer, and Panda enamel supplier.',
      },
      {
        id: 'sup_nifas_silk',
        name: 'Nifas Silk Paint Factory',
        contactPerson: 'Almaz Belay',
        phone: '+251 11 278 1234',
        email: 'order@nifassilkpaint.et',
        address: 'Nifas Silk, Addis Ababa',
        balancePayable: 180000,
        bankAccount: 'CBE 1000987654321',
      },
      {
        id: 'sup_abyssinia',
        name: 'Abyssinia Fasteners & Steel Mills',
        contactPerson: 'Solomon Teshome',
        phone: '+251 11 433 9988',
        email: 'hardware@abyssiniasteel.com',
        address: 'Bishoftu Industrial Zone',
        balancePayable: 220000,
        bankAccount: 'Awash Bank 0132049102900',
        notes: 'Screws, bolts, rebar, nails, and welding electrodes.',
      },
      {
        id: 'sup_rodas',
        name: 'Rodas Adhesive & Chemical Industry',
        contactPerson: 'Ephrem Girma',
        phone: '+251 11 629 3344',
        email: 'rodas@rodaschemicals.et',
        address: 'Gerji Industrial Area, Addis Ababa',
        balancePayable: 85000,
        bankAccount: 'Dashen Bank 50192837465',
      },
    ];

    this.customers = [
      {
        id: 'cust_tekle',
        name: 'Teklehaimanot Contractors & Villa Builders',
        company: 'Teklehaimanot Construction',
        phone: '+251 911 887766',
        email: 'purchasing@tekleconst.et',
        address: 'Bole / Chercher Road, Addis Ababa',
        creditLimit: 250000,
        outstandingBalance: 48500,
        notes: 'Frequent buyer of paints, thinner, and electrical fittings.',
        createdAt: '2026-01-15',
      },
      {
        id: 'cust_girma',
        name: 'Girma Plumbing & Finishing Workshop',
        company: 'Girma Plumbing Services',
        phone: '+251 912 665544',
        address: 'Chercher Market Site',
        creditLimit: 80000,
        outstandingBalance: 18400,
        notes: 'Purchases PPR pipes, valves, teflon, and glue.',
        createdAt: '2026-02-10',
      },
      {
        id: 'cust_walkin',
        name: 'Chercher Walk-in Cash Customer',
        phone: '+251 930 112233',
        address: 'Local Neighborhood',
        creditLimit: 50000,
        outstandingBalance: 0,
        notes: 'Standard retail walk-in customer.',
        createdAt: '2026-03-01',
      },
    ];

    // Load full Chercher products
    this.products = generateChercherProducts();

    const todayStr = new Date().toISOString().split('T')[0];

    // Seed recent purchases from Chercher suppliers
    this.purchases = [
      {
        id: 'pur_1001',
        orderNumber: 'PO-2026-0081',
        date: todayStr,
        supplierId: 'sup_panda',
        supplierName: 'Panda Paints & Chemical Industries',
        items: [
          {
            productId: 'prod_chr_1',
            productName: 'Antirust Panda 1kg',
            unit: 'pc',
            quantity: 20,
            unitCost: 850,
            totalCost: 17000,
          },
          {
            productId: 'prod_chr_40',
            productName: 'Thinner Solvent (Litre)',
            unit: 'L',
            quantity: 100,
            unitCost: 500,
            totalCost: 50000,
          },
        ],
        totalAmount: 67000,
        paidAmount: 40000,
        dueAmount: 27000,
        status: 'received',
        paymentMethod: 'bank_transfer',
        notes: 'Stock delivery to Chercher Retail counter.',
      },
    ];

    // Seed recent sales
    this.sales = [
      {
        id: 'sale_2001',
        invoiceNumber: 'INV-2026-0210',
        date: todayStr,
        customerId: 'cust_tekle',
        customerName: 'Teklehaimanot Contractors & Villa Builders',
        cashierId: 'usr_csh_1',
        cashierName: 'Dawit Kebede',
        items: [
          {
            productId: 'prod_chr_2',
            productName: 'Antirust Panda gallon',
            unit: 'gallon',
            quantity: 2,
            unitPrice: 3000,
            costPrice: 2743.75,
            subtotal: 6000,
          },
          {
            productId: 'prod_chr_3',
            productName: 'Jet black 1kg',
            unit: 'pc',
            quantity: 4,
            unitPrice: 1600,
            costPrice: 1300,
            subtotal: 6400,
          },
          {
            productId: 'prod_chr_40',
            productName: 'Thinner Solvent (Litre)',
            unit: 'L',
            quantity: 10,
            unitPrice: 600,
            costPrice: 500,
            subtotal: 6000,
          },
        ],
        subtotal: 18400,
        discount: 400,
        totalAmount: 18000,
        costOfGoodsSold: 15687.5,
        grossProfit: 2312.5,
        paidAmount: 12000,
        dueAmount: 6000,
        paymentMethod: 'telebirr',
        isCredit: true,
        status: 'partial',
        notes: 'Customer paid 12,000 ETB via telebirr, 6,000 ETB added to credit ledger.',
      },
      {
        id: 'sale_2002',
        invoiceNumber: 'INV-2026-0211',
        date: todayStr,
        customerName: 'Walk-in Retail Customer (Mekonnen)',
        cashierId: 'usr_csh_1',
        cashierName: 'Dawit Kebede',
        items: [
          {
            productId: 'prod_chr_41',
            productName: 'Damac glue 1kg',
            unit: 'pc',
            quantity: 2,
            unitPrice: 700,
            costPrice: 600,
            subtotal: 1400,
          },
          {
            productId: 'prod_chr_73',
            productName: 'Concrete nail',
            unit: 'pc',
            quantity: 50,
            unitPrice: 10,
            costPrice: 7,
            subtotal: 500,
          },
          {
            productId: 'prod_chr_59',
            productName: 'Abro masking tape',
            unit: 'pc',
            quantity: 3,
            unitPrice: 200,
            costPrice: 150,
            subtotal: 600,
          },
        ],
        subtotal: 2500,
        discount: 50,
        totalAmount: 2450,
        costOfGoodsSold: 2000,
        grossProfit: 450,
        paidAmount: 2450,
        dueAmount: 0,
        paymentMethod: 'cash',
        isCredit: false,
        status: 'completed',
        notes: 'Cash payment completed at Chercher retail counter.',
      },
    ];

    this.expenses = [
      {
        id: 'exp_1',
        date: todayStr,
        category: 'loading_unloading',
        title: 'Paint cans and thinner crates unloading',
        amount: 850,
        paidBy: 'Dawit Kebede',
        paymentMethod: 'cash',
        receiptNumber: 'VOUCHER-044',
      },
      {
        id: 'exp_2',
        date: todayStr,
        category: 'utilities',
        title: 'Chercher shop electricity & water bill',
        amount: 1200,
        paidBy: 'Selamawit Desta',
        paymentMethod: 'telebirr',
        receiptNumber: 'EEP-9901',
      },
    ];

    this.auditLogs = [
      {
        id: 'log_1',
        timestamp: `${todayStr} 08:00:00`,
        userId: 'usr_owner_1',
        userName: 'Ato Solomon (Chercher Retail)',
        action: 'SHOP_OPENED',
        module: 'system',
        details: 'Chercher Building Material Retail Shop opened for daily trading.',
      },
      {
        id: 'log_2',
        timestamp: `${todayStr} 08:35:10`,
        userId: 'usr_csh_1',
        userName: 'Dawit Kebede',
        action: 'SALE_CREATED',
        module: 'sales',
        details: 'Invoice INV-2026-0210 created for Teklehaimanot Contractors (18,000 ETB).',
      },
    ];
  }

  // Transaction execution methods
  public createSale(params: {
    customerId?: string;
    customerName: string;
    items: { productId: string; quantity: number; unitPrice?: number }[];
    discount: number;
    paymentMethod: PaymentMethod;
    paidAmount: number;
    notes?: string;
    allowNegativeStock?: boolean;
  }): { success: boolean; sale?: Sale; error?: string } {
    if (!params.items || params.items.length === 0) {
      return { success: false, error: 'Cannot complete a sale with no items.' };
    }

    // Step 1: Stock verification and pricing calculation
    const resolvedItems = [];
    let subtotal = 0;
    let totalCogs = 0;

    for (const item of params.items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (!product) {
        return { success: false, error: `Product not found: ${item.productId}` };
      }

      if (!params.allowNegativeStock && product.quantity < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.quantity} ${product.unit}, requested: ${item.quantity}. Admin override required to allow negative stock.`,
        };
      }

      const unitPrice = item.unitPrice ?? product.sellingPrice;
      const lineSubtotal = unitPrice * item.quantity;
      const lineCost = product.purchasePrice * item.quantity;

      subtotal += lineSubtotal;
      totalCogs += lineCost;

      resolvedItems.push({
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        quantity: item.quantity,
        unitPrice,
        costPrice: product.purchasePrice,
        subtotal: lineSubtotal,
      });
    }

    const discount = Math.max(0, params.discount || 0);
    const totalAmount = Math.max(0, subtotal - discount);
    const paidAmount = Math.min(totalAmount, Math.max(0, params.paidAmount || 0));
    const dueAmount = totalAmount - paidAmount;
    const isCredit = dueAmount > 0 || params.paymentMethod === 'credit';
    const grossProfit = totalAmount - totalCogs;

    // Check customer credit limit if credit sale
    let customer: Customer | undefined;
    if (params.customerId) {
      customer = this.customers.find((c) => c.id === params.customerId);
      if (customer && dueAmount > 0) {
        if (customer.outstandingBalance + dueAmount > customer.creditLimit) {
          return {
            success: false,
            error: `Credit limit exceeded for ${customer.name}. Current balance: ${customer.outstandingBalance} ETB, requested additional credit: ${dueAmount} ETB, Limit: ${customer.creditLimit} ETB.`,
          };
        }
      }
    }

    // Step 2: Atomic State Mutation
    const nextInvoiceNum = `INV-${new Date().getFullYear()}-${String(this.sales.length + 212).padStart(4, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      invoiceNumber: nextInvoiceNum,
      date: todayStr,
      customerId: params.customerId,
      customerName: params.customerName || (customer ? customer.name : 'Chercher Retail Cash Customer'),
      cashierId: this.currentUser.id,
      cashierName: this.currentUser.name,
      items: resolvedItems,
      subtotal,
      discount,
      totalAmount,
      costOfGoodsSold: totalCogs,
      grossProfit,
      paidAmount,
      dueAmount,
      paymentMethod: params.paymentMethod,
      isCredit,
      status: dueAmount === 0 ? 'completed' : 'partial',
      notes: params.notes,
    };

    // Deduct stock and log movements
    for (const item of resolvedItems) {
      const product = this.products.find((p) => p.id === item.productId)!;
      product.quantity -= item.quantity;

      this.stockMovements.unshift({
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        date: new Date().toISOString(),
        productId: product.id,
        productName: product.name,
        type: 'sale',
        quantityChange: -item.quantity,
        newBalance: product.quantity,
        referenceId: newSale.invoiceNumber,
        reason: `Sold on invoice ${newSale.invoiceNumber}`,
        performedBy: this.currentUser.name,
      });
    }

    // Update customer balance if credit
    if (customer && dueAmount > 0) {
      customer.outstandingBalance += dueAmount;
    }

    this.sales.unshift(newSale);

    // Audit log
    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'SALE_COMPLETED',
      module: 'sales',
      details: `Invoice ${newSale.invoiceNumber} created. Total: ${totalAmount} ETB, Paid: ${paidAmount} ETB, Due: ${dueAmount} ETB.`,
    });

    this.saveToStorage();
    return { success: true, sale: newSale };
  }

  public createPurchase(params: {
    supplierId: string;
    items: { productId: string; quantity: number; unitCost: number }[];
    paidAmount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): { success: boolean; purchase?: Purchase; error?: string } {
    const supplier = this.suppliers.find((s) => s.id === params.supplierId);
    if (!supplier) {
      return { success: false, error: 'Supplier not found.' };
    }

    let totalAmount = 0;
    const resolvedItems = [];

    for (const item of params.items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (!product) continue;

      const totalCost = item.quantity * item.unitCost;
      totalAmount += totalCost;

      resolvedItems.push({
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost,
      });

      // Update weighted average purchase price and increase stock
      const oldQty = Math.max(0, product.quantity);
      const newQty = oldQty + item.quantity;
      if (newQty > 0) {
        product.purchasePrice = Math.round(
          (oldQty * product.purchasePrice + item.quantity * item.unitCost) / newQty,
        );
      }
      product.quantity += item.quantity;

      this.stockMovements.unshift({
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        date: new Date().toISOString(),
        productId: product.id,
        productName: product.name,
        type: 'purchase',
        quantityChange: item.quantity,
        newBalance: product.quantity,
        reason: `Goods received from ${supplier.name}`,
        performedBy: this.currentUser.name,
      });
    }

    const paidAmount = Math.min(totalAmount, Math.max(0, params.paidAmount || 0));
    const dueAmount = totalAmount - paidAmount;

    // Increase supplier liability
    supplier.balancePayable += dueAmount;

    const newPurchase: Purchase = {
      id: `pur_${Date.now()}`,
      orderNumber: `PO-${new Date().getFullYear()}-${String(this.purchases.length + 82).padStart(4, '0')}`,
      date: new Date().toISOString().split('T')[0],
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: resolvedItems,
      totalAmount,
      paidAmount,
      dueAmount,
      status: 'received',
      paymentMethod: params.paymentMethod,
      notes: params.notes,
    };

    this.purchases.unshift(newPurchase);

    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'PURCHASE_RECEIVED',
      module: 'purchases',
      details: `Goods received ${newPurchase.orderNumber} from ${supplier.name}. Total: ${totalAmount} ETB, Paid: ${paidAmount} ETB, Due: ${dueAmount} ETB.`,
    });

    this.saveToStorage();
    return { success: true, purchase: newPurchase };
  }

  public recordCustomerPayment(params: {
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): { success: boolean; error?: string } {
    const customer = this.customers.find((c) => c.id === params.customerId);
    if (!customer) return { success: false, error: 'Customer not found.' };

    const paymentAmount = Math.min(customer.outstandingBalance, params.amount);
    customer.outstandingBalance = Math.max(0, customer.outstandingBalance - paymentAmount);

    const record: PaymentRecord = {
      id: `pay_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'customer_payment',
      partyId: customer.id,
      partyName: customer.name,
      referenceId: 'LEDGER-COLLECTION',
      amount: paymentAmount,
      paymentMethod: params.paymentMethod,
      recordedBy: this.currentUser.name,
      notes: params.notes,
    };

    this.payments.unshift(record);

    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'CUSTOMER_COLLECTION',
      module: 'financials',
      details: `Collected ${paymentAmount} ETB from ${customer.name} via ${params.paymentMethod}. Remaining credit: ${customer.outstandingBalance} ETB.`,
    });

    this.saveToStorage();
    return { success: true };
  }

  public recordSupplierPayment(params: {
    supplierId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): { success: boolean; error?: string } {
    const supplier = this.suppliers.find((s) => s.id === params.supplierId);
    if (!supplier) return { success: false, error: 'Supplier not found.' };

    const paymentAmount = Math.min(supplier.balancePayable, params.amount);
    supplier.balancePayable = Math.max(0, supplier.balancePayable - paymentAmount);

    const record: PaymentRecord = {
      id: `pay_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'supplier_payment',
      partyId: supplier.id,
      partyName: supplier.name,
      referenceId: 'SUPPLIER-SETTLEMENT',
      amount: paymentAmount,
      paymentMethod: params.paymentMethod,
      recordedBy: this.currentUser.name,
      notes: params.notes,
    };

    this.payments.unshift(record);

    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'SUPPLIER_PAYMENT',
      module: 'financials',
      details: `Paid ${paymentAmount} ETB to ${supplier.name} via ${params.paymentMethod}. Remaining payable: ${supplier.balancePayable} ETB.`,
    });

    this.saveToStorage();
    return { success: true };
  }

  public recordExpense(params: {
    category: Expense['category'];
    title: string;
    amount: number;
    paymentMethod: PaymentMethod;
    receiptNumber?: string;
    notes?: string;
  }): { success: boolean } {
    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      category: params.category,
      title: params.title,
      amount: params.amount,
      paidBy: this.currentUser.name,
      paymentMethod: params.paymentMethod,
      receiptNumber: params.receiptNumber,
      notes: params.notes,
    };

    this.expenses.unshift(newExpense);

    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'EXPENSE_RECORDED',
      module: 'financials',
      details: `Expense ${params.title} recorded for ${params.amount} ETB (${params.category}).`,
    });

    this.saveToStorage();
    return { success: true };
  }

  public adjustStock(params: {
    productId: string;
    newQuantity: number;
    reason: string;
  }): { success: boolean; error?: string } {
    const product = this.products.find((p) => p.id === params.productId);
    if (!product) return { success: false, error: 'Product not found.' };

    const oldQty = product.quantity;
    const diff = params.newQuantity - oldQty;
    product.quantity = params.newQuantity;

    this.stockMovements.unshift({
      id: `sm_${Date.now()}`,
      date: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      type: diff >= 0 ? 'adjustment_in' : 'adjustment_out',
      quantityChange: diff,
      newBalance: product.quantity,
      reason: params.reason || 'Physical yard stock count adjustment',
      performedBy: this.currentUser.name,
    });

    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'STOCK_ADJUSTED',
      module: 'inventory',
      details: `Stock for ${product.name} adjusted from ${oldQty} to ${params.newQuantity} (${diff >= 0 ? '+' : ''}${diff} ${product.unit}). Reason: ${params.reason}`,
    });

    this.saveToStorage();
    return { success: true };
  }

  public findProductByBarcodeOrSku(codeOrBarcode: string): Product | undefined {
    if (!codeOrBarcode) return undefined;
    const clean = codeOrBarcode.trim().toLowerCase();

    // 1. Direct barcode match
    const byBarcode = this.products.find((p) => p.barcode && p.barcode.toLowerCase() === clean);
    if (byBarcode) return byBarcode;

    // 2. Direct SKU code match (case-insensitive)
    const byCode = this.products.find((p) => p.code && p.code.toLowerCase() === clean);
    if (byCode) return byCode;

    // 3. Direct ID match
    const byId = this.products.find((p) => p.id && p.id.toLowerCase() === clean);
    if (byId) return byId;

    // 4. Fuzzy match: SKU without non-alphanumeric chars
    const noHyphen = clean.replace(/[^a-z0-9]/g, '');
    const byFuzzyCode = this.products.find(
      (p) => p.code.toLowerCase().replace(/[^a-z0-9]/g, '') === noHyphen,
    );
    if (byFuzzyCode) return byFuzzyCode;

    // 5. Name match (case-insensitive)
    return this.products.find((p) => p.name.toLowerCase() === clean);
  }

  public saveProduct(product: Partial<Product> & { id?: string }): { success: boolean } {
    if (product.id) {
      const idx = this.products.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        this.products[idx] = { ...this.products[idx], ...product } as Product;
      }
    } else {
      const newProduct: Product = {
        id: `prod_chr_${Date.now()}`,
        code: product.code || `CHR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: product.name || 'New Hardware Item',
        categoryId: product.categoryId || this.categories[0].id,
        brand: product.brand || 'Chercher Standard',
        unit: product.unit || 'pc',
        purchasePrice: product.purchasePrice || 0,
        sellingPrice: product.sellingPrice || 0,
        quantity: product.quantity || 0,
        minThreshold: product.minThreshold || 2,
        supplierId: product.supplierId || (this.suppliers[0]?.id ?? ''),
        barcode: product.barcode || String(Math.floor(1000000000 + Math.random() * 9000000000)),
        description: product.description || '',
      };
      this.products.unshift(newProduct);
    }
    this.saveToStorage();
    return { success: true };
  }

  public switchUserRole(role: UserRole) {
    const user = this.users.find((u) => u.role === role);
    if (user) {
      this.currentUser = user;
    } else {
      this.currentUser = {
        ...this.currentUser,
        role,
      };
    }
    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'ROLE_SWITCHED',
      module: 'users',
      details: `Active role switched to ${role.toUpperCase()}.`,
    });
    this.saveToStorage();
  }

  // Financial Metrics & Dashboard aggregates
  public getDashboardMetrics() {
    const todayStr = new Date().toISOString().split('T')[0];

    const todaySales = this.sales.filter((s) => s.date === todayStr);
    const todayPurchases = this.purchases.filter((p) => p.date === todayStr);
    const todayExpenses = this.expenses.filter((e) => e.date === todayStr);

    const totalSalesToday = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalPurchasesToday = todayPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
    const grossProfitToday = todaySales.reduce((acc, s) => acc + s.grossProfit, 0);
    const totalExpensesToday = todayExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfitToday = grossProfitToday - totalExpensesToday;

    const currentStockValue = this.products.reduce(
      (acc, p) => acc + Math.max(0, p.quantity) * p.purchasePrice,
      0,
    );

    const currentStockRetailValue = this.products.reduce(
      (acc, p) => acc + Math.max(0, p.quantity) * p.sellingPrice,
      0,
    );

    const outstandingCustomerCredit = this.customers.reduce(
      (acc, c) => acc + c.outstandingBalance,
      0,
    );

    const supplierLiabilities = this.suppliers.reduce(
      (acc, s) => acc + s.balancePayable,
      0,
    );

    const lowStockProducts = this.products.filter(
      (p) => p.quantity <= p.minThreshold,
    );

    const needsReviewProducts = this.products.filter((p) => p.needsChecking);

    return {
      totalSalesToday,
      totalPurchasesToday,
      grossProfitToday,
      netProfitToday,
      totalExpensesToday,
      currentStockValue,
      currentStockRetailValue,
      outstandingCustomerCredit,
      supplierLiabilities,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      needsReviewCount: needsReviewProducts.length,
      needsReviewProducts,
    };
  }

  private logAudit(
    action: string,
    module: 'customers' | 'financials' | 'inventory' | 'purchases' | 'sales' | 'system' | 'users',
    details: string,
  ) {
    this.auditLogs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action,
      module,
      details,
    });
  }

  public updateStoreProfile(updates: Partial<typeof this.storeProfile>) {
    this.storeProfile = { ...this.storeProfile, ...updates };
    this.saveToStorage();
    this.logAudit('STORE_PROFILE_UPDATED', 'system', `Updated store profile info.`);
    return this.storeProfile;
  }

  public exportDatabaseBackup(): string {
    const backupData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      storeProfile: this.storeProfile,
      categories: this.categories,
      unitConversions: this.unitConversions,
      products: this.products,
      customers: this.customers,
      suppliers: this.suppliers,
      sales: this.sales,
      purchases: this.purchases,
      expenses: this.expenses,
      payments: this.payments,
      stockMovements: this.stockMovements,
      auditLogs: this.auditLogs,
      dailyClosings: this.dailyClosings,
      users: this.users,
    };
    return JSON.stringify(backupData, null, 2);
  }

  public importDatabaseBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data.products) || !Array.isArray(data.categories)) {
        return { success: false, message: 'Invalid backup format: missing core product tables.' };
      }

      this.categories = data.categories || [];
      this.unitConversions = data.unitConversions || [];
      this.products = data.products || [];
      this.customers = data.customers || [];
      this.suppliers = data.suppliers || [];
      this.sales = data.sales || [];
      this.purchases = data.purchases || [];
      this.expenses = data.expenses || [];
      this.payments = data.payments || [];
      this.stockMovements = data.stockMovements || [];
      this.auditLogs = data.auditLogs || [];
      this.dailyClosings = data.dailyClosings || [];
      this.users = data.users || this.users;
      if (data.storeProfile) {
        this.storeProfile = { ...this.storeProfile, ...data.storeProfile };
      }

      this.saveToStorage();
      this.logAudit('DATABASE_RESTORED', 'system', `Imported backup created at ${data.exportedAt || 'unknown'}`);
      return { success: true, message: `Successfully restored ${this.products.length} products and ${this.sales.length} sales.` };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : 'JSON parsing error' };
    }
  }

  public clearTransactionsOnly() {
    this.sales = [];
    this.purchases = [];
    this.expenses = [];
    this.payments = [];
    this.stockMovements = [];
    this.dailyClosings = [];

    // Reset customer & supplier balances to 0
    this.customers.forEach((c) => (c.outstandingBalance = 0));
    this.suppliers.forEach((s) => (s.balancePayable = 0));

    this.saveToStorage();
    this.logAudit('TRANSACTIONS_CLEARED', 'system', 'Cleared all transaction history while preserving catalog.');
  }

  public seedDemoTransactions() {
    // Generate realistic demo sales for test previews
    const sampleItems = [
      { product: this.products[0], qty: 2 },
      { product: this.products[1] || this.products[0], qty: 1 },
    ];

    this.createSale({
      customerId: this.customers[0]?.id,
      customerName: this.customers[0]?.name || 'Teklehaimanot Construction',
      items: sampleItems.map((s) => ({ productId: s.product.id, quantity: s.qty })),
      discount: 100,
      paymentMethod: 'telebirr',
      paidAmount: sampleItems.reduce((acc, s) => acc + s.product.sellingPrice * s.qty, 0) - 100,
      notes: 'Demo sale via Telebirr for test run',
    });

    this.recordExpense({
      category: 'transport_fuel',
      title: 'Cement transport from yard to site',
      amount: 1500,
      paymentMethod: 'cash',
      notes: 'Isuzu Truck Rental Addis',
    });

    this.saveToStorage();
  }
}
