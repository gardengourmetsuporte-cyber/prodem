// Dashboard page
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { LiderDashboard } from '@/components/dashboard/LiderDashboard';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { isAdmin, isLider, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen pb-24 px-4 py-4">
          <PageSkeleton variant="dashboard" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen pb-36">
        {isAdmin ? <AdminDashboard /> : isLider ? <LiderDashboard /> : <EmployeeDashboard />}
      </div>
    </AppLayout>
  );
}
