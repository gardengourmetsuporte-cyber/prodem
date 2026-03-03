import { supabase } from '@/integrations/supabase/client';
import { FinanceAccount, FinanceCategory, FinanceTransaction } from '@/types/finance';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export async function fetchAccountsCore(userId: string, unitId: string | null, isPersonal: boolean) {
  let query = supabase
    .from('finance_accounts')
    .select('*')
    .eq('is_active', true)
    .order('created_at');
  if (isPersonal) query = query.eq('user_id', userId).is('unit_id', null);
  else if (unitId) query = query.eq('unit_id', unitId);
  else query = query.eq('user_id', userId);
  const { data } = await query;
  return (data || []) as FinanceAccount[];
}

export async function fetchCategoriesCore(userId: string, unitId: string | null, isPersonal: boolean) {
  let query = supabase
    .from('finance_categories')
    .select('*')
    .order('sort_order');
  if (isPersonal) query = query.eq('user_id', userId).is('unit_id', null);
  else if (unitId) query = query.eq('unit_id', unitId);
  else query = query.eq('user_id', userId);
  const { data } = await query;

  const all = (data || []) as FinanceCategory[];
  const parents = all.filter(c => !c.parent_id);
  return parents.map(parent => ({
    ...parent,
    subcategories: all.filter(c => c.parent_id === parent.id),
  }));
}

export async function fetchTransactionsCore(userId: string, unitId: string | null, isPersonal: boolean, month: Date) {
  const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(month), 'yyyy-MM-dd');

  const selectStr = isPersonal
    ? `*, category:finance_categories(*), account:finance_accounts!finance_transactions_account_id_fkey(*), to_account:finance_accounts!finance_transactions_to_account_id_fkey(*)`
    : `*, category:finance_categories(*), account:finance_accounts!finance_transactions_account_id_fkey(*), to_account:finance_accounts!finance_transactions_to_account_id_fkey(*), supplier:suppliers!finance_transactions_supplier_id_fkey(id, name), employee:employees!finance_transactions_employee_id_fkey(id, full_name)`;

  let query = supabase
    .from('finance_transactions')
    .select(selectStr)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (isPersonal) query = query.eq('user_id', userId).is('unit_id', null);
  else if (unitId) query = query.eq('unit_id', unitId);
  else query = query.eq('user_id', userId);
  const { data } = await query;
  return (data || []) as unknown as FinanceTransaction[];
}
