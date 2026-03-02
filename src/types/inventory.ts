export type UnitType = 'unidade' | 'kg' | 'litro' | 'metro' | 'metro_quadrado';

export type MovementType = 'entrada' | 'saida';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unitType: UnitType;
  currentStock: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentMovements: number;
}
