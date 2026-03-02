import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/employee';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeeSheet } from '@/components/employees/EmployeeSheet';
import { useEmployees } from '@/hooks/useEmployees';
import { useUsers } from '@/hooks/useUsers';

export default function Employees() {
  const { isAdmin } = useAuth();
  const { employees, isLoading, deleteEmployee, updateEmployee } = useEmployees();
  const { users } = useUsers();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const availableUsers = users.filter(
    u => !employees.some(e => e.user_id === u.user_id)
  );

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setSheetOpen(true);
  };

  const handleNew = () => {
    setEditingEmployee(null);
    setSheetOpen(true);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6">
          <EmployeeList
            employees={employees}
            isLoading={isLoading}
            onEdit={handleEdit}
            onNew={handleNew}
            onDelete={deleteEmployee}
            onToggleActive={(emp) => updateEmployee({ id: emp.id, is_active: !emp.is_active })}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      <EmployeeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        employee={editingEmployee}
        availableUsers={availableUsers}
      />
    </AppLayout>
  );
}
