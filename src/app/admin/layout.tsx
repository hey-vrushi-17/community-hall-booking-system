import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { AdminHeader } from '@/components/admin/admin-header';
import { getAllBookings } from '@/lib/services/booking-store';

export const metadata: Metadata = {
  title: 'Facilities Administration Portal | CivicSpaces',
  description: 'Municipal community facility reservation management and schedule coordination.',
};

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // If not authenticated, redirect to admin login
  if (!session.isAuthenticated || !session.user) {
    redirect('/admin/login');
  }

  // Retrieve pending requests count for badge indicator
  const allBookings = await getAllBookings();
  const pendingCount = allBookings.filter((b) => b.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col">
      <AdminHeader user={session.user} pendingCount={pendingCount} />
      <main className="flex-1 py-8 md:py-10">
        <div className="civic-container">{children}</div>
      </main>
    </div>
  );
}
