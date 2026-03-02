// Types for Cash Closing Module

export type CashClosingStatus = 'pending' | 'approved' | 'divergent';

export interface ExpenseItem {
  description: string;
  amount: number;
}

export interface CashClosing {
  id: string;
  date: string;
  user_id: string;
  unit_name: string;
  
  // Payment amounts
  cash_amount: number;
  debit_amount: number;
  credit_amount: number;
  pix_amount: number;
  meal_voucher_amount: number;
  delivery_amount: number;
  signed_account_amount: number;
  total_amount: number;
  
  // Cash difference
  cash_difference: number;
  
  // Receipt
  receipt_url: string;
  
  // Expenses
  expenses: ExpenseItem[];
  
  // Status
  status: CashClosingStatus;
  notes: string | null;
  
  // Validation
  validated_by: string | null;
  validated_at: string | null;
  validation_notes: string | null;
  
  // Financial integration
  financial_integrated: boolean;
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  validator_profile?: {
    full_name: string;
  };
}

export interface CashClosingFormData {
  date: string;
  unit_name: string;
  initial_cash: number;
  cash_amount: number;
  debit_amount: number;
  credit_amount: number;
  pix_amount: number;
  meal_voucher_amount: number;
  delivery_amount: number;
  signed_account_amount: number;
  cash_difference: number;
  receipt_url?: string;
  notes?: string;
  expenses?: ExpenseItem[];
}

export const PAYMENT_METHODS = [
  { key: 'cash_amount', label: 'Dinheiro', icon: 'Banknote', color: '#22c55e' },
  { key: 'debit_amount', label: 'Boleto', icon: 'FileText', color: '#3b82f6' },
  { key: 'credit_amount', label: 'Transferência / TED / DOC', icon: 'Building2', color: '#8b5cf6' },
  { key: 'pix_amount', label: 'Pix', icon: 'Smartphone', color: '#06b6d4' },
  { key: 'meal_voucher_amount', label: 'Cheque', icon: 'FileCheck', color: '#f59e0b' },
  { key: 'delivery_amount', label: 'Cartão (Débito/Crédito)', icon: 'CreditCard', color: '#f97316' },
  { key: 'signed_account_amount', label: 'Faturado (a prazo)', icon: 'ClipboardList', color: '#64748b' },
] as const;