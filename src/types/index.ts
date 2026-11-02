export type UserRole = 'owner' | 'manager' | 'cashier' | 'inventory';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
}

export type UnitType =
  | 'piece'
  | 'pc'
  | 'bag'
  | 'kg'
  | 'quintal'
  | 'tonne'
  | 'metre'
  | 'm'
  | 'sq_metre'
  | 'cubic_metre'
  | 'litre'
  | 'L'
  | 'gallon'
  | 'box'
  | 'carton'
  | 'roll'
  | 'lot'
  | 'truckload';

export interface UnitConversion {
  id: string;
  fromUnit: UnitType;
  toUnit: UnitType;
  factor: number;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  nameAm?: string;
  nameOm?: string;
  description: string;
  icon: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  nameAm?: string;
  nameOm?: string;
  categoryId: string;
  categoryName?: string;
  brand: string;
  unit: UnitType;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minThreshold: number;
  supplierId: string;
  barcode?: string;
  description?: string;
  color?: string;
  needsChecking?: boolean;
  soldIn30Days?: number;
}

export interface Customer {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address: string;
  creditLimit: number;
  outstandingBalance: number;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  balancePayable: number;
  bankAccount?: string;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'telebirr' | 'cbe_birr' | 'bank_transfer' | 'credit';

export interface SaleItem {
  productId: string;
  productName: string;
  unit: UnitType;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId?: string;
  customerName: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  costOfGoodsSold: number;
  grossProfit: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  isCredit: boolean;
  status: 'completed' | 'returned' | 'partial';
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  unit: UnitType;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  orderNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'received' | 'pending' | 'returned';
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'rent' | 'utilities' | 'transport_fuel' | 'wages' | 'loading_unloading' | 'maintenance' | 'other';
  title: string;
  amount: number;
  paidBy: string;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  type: 'customer_payment' | 'supplier_payment';
  partyId: string;
  partyName: string;
  referenceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  recordedBy: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment_in' | 'adjustment_out' | 'return';
  quantityChange: number;
  newBalance: number;
  referenceId?: string;
  reason?: string;
  performedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: 'sales' | 'inventory' | 'purchases' | 'financials' | 'users' | 'customers' | 'system';
  details: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  closedBy: string;
  openingCash: number;
  cashSales: number;
  telebirrSales: number;
  bankSales: number;
  creditSales: number;
  customerCollections: number;
  supplierPayments: number;
  expensesPaid: number;
  expectedCashInDrawer: number;
  actualCashInDrawer: number;
  cashVariance: number;
  totalGrossProfit: number;
  netProfit: number;
  notes?: string;
}

export type SupportedLanguage = 'en' | 'am' | 'om';
