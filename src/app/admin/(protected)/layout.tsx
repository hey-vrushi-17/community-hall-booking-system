import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { AdminHeader } from '@/components/admin/admin-header';
import { getAllBookings } from '@/lib/services/booking-store';
import { DataSourceIndicator } from '@/components/ui/datasource-indicator';

export const metadata: Metadata = {
  title: 'Facilities Administration Portal | CivicSpaces',
  description: 'Municipal community facility reservation management and schedule coordination.',
};

export const instant = false;

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session.isAuthenticated || !session.user) {
    redirect('/admin/login');
  }

  let pendingCount = 0;
  try {
    const allBookings = await getAllBookings('PENDING');
    pendingCount = allBookings.length;
  } catch {
    pendingCount = 0;
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col">
      <AdminHeader user={session.user} pendingCount={pendingCount} />
      <main className="flex-1 py-8 md:py-10">
        <div className="civic-container space-y-6">
          <DataSourceIndicator />
          {children}
        </div>
      </main>
    </div>
  );
}
