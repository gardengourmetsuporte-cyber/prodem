import { useState } from 'react';
import { useScrollToTopOnChange } from '@/components/ScrollToTop';
import { useAuth } from '@/contexts/AuthContext';
import { Employee } from '@/types/employee';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeePayments } from '@/components/employees/EmployeePayments';
import { MyPayslips } from '@/components/employees/MyPayslips';
import { EmployeeScheduleRequest } from '@/components/employees/EmployeeScheduleRequest';
import { ScheduleManagement } from '@/components/employees/ScheduleManagement';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { AppIcon } from '@/components/ui/app-icon';

export default function Employees() {
  const { isAdmin } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('employees');
  useScrollToTopOnChange(activeTab);

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 py-3 lg:px-6 space-y-4">
          {isAdmin ? (
            selectedEmployee ? (
              <EmployeePayments
                employee={selectedEmployee}
                onBack={() => setSelectedEmployee(null)}
              />
            ) : (
              <>
                <AnimatedTabs
                  tabs={[
                    { key: 'employees', label: 'Funcionários', icon: <AppIcon name="Users" size={16} /> },
                    { key: 'schedules', label: 'Folgas', icon: <AppIcon name="Calendar" size={16} /> },
                  ]}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
                <div className="animate-fade-in" key={activeTab}>
                  {activeTab === 'employees' && <EmployeeList onSelectEmployee={setSelectedEmployee} />}
                  {activeTab === 'schedules' && <ScheduleManagement />}
                </div>
              </>
            )
          ) : (
            <>
              <AnimatedTabs
                tabs={[
                  { key: 'payslips', label: 'Holerites', icon: <AppIcon name="Users" size={16} /> },
                  { key: 'schedules', label: 'Folgas', icon: <AppIcon name="Calendar" size={16} /> },
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
              <div className="animate-fade-in" key={activeTab}>
                {activeTab === 'payslips' && <MyPayslips />}
                {activeTab === 'schedules' && <EmployeeScheduleRequest />}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
