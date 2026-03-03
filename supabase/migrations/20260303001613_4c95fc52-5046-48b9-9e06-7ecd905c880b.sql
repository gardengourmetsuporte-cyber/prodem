-- Finance transactions: allow unit members to view all unit data
DROP POLICY IF EXISTS "Users manage own transactions" ON public.finance_transactions;
CREATE POLICY "Users manage own transactions" ON public.finance_transactions
  FOR ALL USING (
    auth.uid() = user_id 
    OR user_has_unit_access(auth.uid(), unit_id)
  ) WITH CHECK (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Finance accounts: allow unit members to view
DROP POLICY IF EXISTS "Users manage own accounts" ON public.finance_accounts;
CREATE POLICY "Users manage own accounts" ON public.finance_accounts
  FOR ALL USING (
    auth.uid() = user_id 
    OR user_has_unit_access(auth.uid(), unit_id)
  ) WITH CHECK (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Finance categories: allow unit members to view
DROP POLICY IF EXISTS "Users manage own categories" ON public.finance_categories;
CREATE POLICY "Users manage own categories" ON public.finance_categories
  FOR ALL USING (
    auth.uid() = user_id 
    OR user_has_unit_access(auth.uid(), unit_id)
  ) WITH CHECK (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Finance budgets
DROP POLICY IF EXISTS "Users manage own budgets" ON public.finance_budgets;
CREATE POLICY "Users manage own budgets" ON public.finance_budgets
  FOR ALL USING (
    auth.uid() = user_id 
    OR user_has_unit_access(auth.uid(), unit_id)
  ) WITH CHECK (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Finance snapshots
DROP POLICY IF EXISTS "Users manage own snapshots" ON public.finance_snapshots;
CREATE POLICY "Users manage own snapshots" ON public.finance_snapshots
  FOR ALL USING (
    auth.uid() = user_id 
    OR user_has_unit_access(auth.uid(), unit_id)
  ) WITH CHECK (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Finance tags
DROP POLICY IF EXISTS "Users manage own tags" ON public.finance_tags;
CREATE POLICY "Users manage own tags" ON public.finance_tags
  FOR ALL USING (
    auth.uid() = user_id 
    OR user_has_unit_access(auth.uid(), unit_id)
  ) WITH CHECK (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Credit card invoices
DROP POLICY IF EXISTS "Users manage own invoices" ON public.credit_card_invoices;
CREATE POLICY "Users manage own invoices" ON public.credit_card_invoices
  FOR ALL USING (
    auth.uid() = user_id 
    OR user_has_unit_access(auth.uid(), unit_id)
  ) WITH CHECK (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Cash closings
DROP POLICY IF EXISTS "Users can view own closings" ON public.cash_closings;
DROP POLICY IF EXISTS "Users can create own closings" ON public.cash_closings;
DROP POLICY IF EXISTS "Users can update own pending closings" ON public.cash_closings;
CREATE POLICY "Users can view closings" ON public.cash_closings
  FOR SELECT USING (
    auth.uid() = user_id 
    OR user_has_unit_access(auth.uid(), unit_id)
  );
CREATE POLICY "Users can create closings" ON public.cash_closings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update closings" ON public.cash_closings
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::app_role)
  );