import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession, isDemoAdminEnabled } from '@/lib/auth/admin-auth';
import { AdminLoginClient } from './admin-login-client';

export const metadata: Metadata = {
  title: 'Administrator Sign In | CivicSpaces',
  description: 'Municipal Facilities Administration sign-in portal.',
};

export const instant = false;

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session.isAuthenticated) {
    redirect('/admin');
  }

  return (
    <div className="py-12 md:py-20 bg-[#FBF9F5] min-h-[calc(100vh-140px)] flex items-center justify-center">
      <div className="civic-container w-full">
        <AdminLoginClient demoEnabled={isDemoAdminEnabled()} />
      </div>
    </div>
  );
}
