/**
 * Domain types with joined/composite data.
 * 
 * Base column types come from `src/integrations/supabase/types.ts` (auto-generated).
 * This file defines ONLY:
 *   - String literal union types (enums not in DB enums)
 *   - Interfaces with joined/nested data (e.g. `items?: ChecklistItem[]`)
 *   - Composite view types not present in the auto-generated schema
 */

// ---- Enum-like string unions ----

export type AppRole = 'admin' | 'funcionario' | 'super_admin' | 'lider';
export type UserStatus = 'pending' | 'approved' | 'suspended';
export type UnitType = 'unidade' | 'kg' | 'litro' | 'metro' | 'metro_quadrado';
export type MovementType = 'entrada' | 'saida';
export type OrderStatus = 'draft' | 'sent' | 'received' | 'cancelled';
export type ChecklistType = 'abertura' | 'fechamento' | 'bonus';
export type ScheduleStatus = 'pending' | 'approved' | 'rejected';
export type ItemFrequency = 'daily' | 'weekly' | 'monthly';
export type RewardStatus = 'pending' | 'approved' | 'delivered' | 'cancelled';

// ---- Joined/composite interfaces ----
// These extend the auto-generated Row types with optional related data from joins.

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  job_title: string | null;
  department: string | null;
  status: UserStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category_id: string | null;
  supplier_id: string | null;
  unit_type: UnitType;
  unit_price: number | null;
  current_stock: number;
  min_stock: number;
  recipe_unit_type: string | null;
  recipe_unit_price: number | null;
  material_type: string | null;
  dimensions: string | null;
  thickness: string | null;
  technical_spec: string | null;
  internal_code: string | null;
  location: string | null;
  weight_per_unit: number | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  supplier?: Supplier;
}

export interface StockMovement {
  id: string;
  item_id: string;
  type: MovementType;
  quantity: number;
  notes: string | null;
  user_id: string | null;
  created_at: string;
  item?: InventoryItem;
  profile?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  item?: InventoryItem;
}

export interface Order {
  id: string;
  supplier_id: string;
  status: OrderStatus;
  notes: string | null;
  sent_at: string | null;
  created_by: string | null;
  supplier_invoice_id: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  order_items?: OrderItem[];
}

export interface ChecklistItem {
  id: string;
  subcategory_id: string;
  name: string;
  description: string | null;
  frequency: ItemFrequency;
  checklist_type: ChecklistType;
  sort_order: number;
  is_active: boolean;
  deleted_at: string | null;
  points: number;
  requires_photo: boolean;
  created_at: string;
  updated_at: string;
  subcategory?: ChecklistSubcategory;
}

export interface ChecklistSubcategory {
  id: string;
  sector_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  sector?: ChecklistSector;
  items?: ChecklistItem[];
}

export interface ChecklistSector {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  subcategories?: ChecklistSubcategory[];
}

export interface ChecklistCompletion {
  id: string;
  item_id: string;
  checklist_type: ChecklistType;
  completed_by: string;
  completed_at: string;
  notes: string | null;
  date: string;
  awarded_points: boolean;
  points_awarded: number;
  is_skipped: boolean;
  photo_url: string | null;
  is_contested: boolean;
  contested_by: string | null;
  contested_reason: string | null;
  contested_at: string | null;
  item?: ChecklistItem;
  profile?: Profile;
}

export interface WorkSchedule {
  id: string;
  user_id: string;
  month: number;
  year: number;
  day_off: number;
  status: ScheduleStatus;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  approver_profile?: Profile;
}

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentMovements: number;
}

export interface RewardProduct {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  image_url: string | null;
  is_active: boolean;
  stock: number | null;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  product_id: string;
  points_spent: number;
  status: RewardStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: RewardProduct;
  profile?: Profile;
}
