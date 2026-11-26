'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Lock, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface AdminLoginClientProps {
  demoEnabled: boolean;
}

export function AdminLoginClient({ demoEnabled }: AdminLoginClientProps) {
  const router = useRouter();
  const [email, setEmail] = React.useState(demoEnabled ? 'admin@civic.example' : '');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to authenticate administrator session.');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Network error while authenticating administrator credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoAdmin: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Demo sign-in failed.');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Network error during demo administrator authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="civic-card p-6 sm:p-8 bg-white border border-[#E5DFD5] shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#18283E] text-white flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-6 h-6 text-[#C85A32]" />
          </div>
          <h1 className="text-xl font-bold text-[#1C1917] tracking-tight">
            Facilities Administration Sign In
          </h1>
          <p className="text-xs text-[#615B52]">
            Restricted to authorized Staff and Administrator accounts.
          </p>
        </div>

        {error && (
          <Alert variant="error" className="text-xs">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold text-[#1C1917] mb-1">
              Staff Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@civic.example"
              className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B]"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-semibold text-[#1C1917] mb-1">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B]"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full text-xs gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Admin Portal'}</span>
          </Button>
        </form>

        {demoEnabled && (
          <div className="border-t border-[#E5DFD5] pt-5 space-y-3">
            <span className="text-[11px] font-semibold text-[#8A8275] uppercase tracking-wider block text-center">
              Development &amp; Local Preview Access
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full text-xs gap-2 text-[#1A3B2B] hover:bg-[#EBF3EE] border-[#CDE3D5]"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#1A3B2B]" />
              <span>Sign In as Demo Administrator (Dev Only)</span>
            </Button>
          </div>
        )}

        <div className="border-t border-[#E5DFD5] pt-4 text-center">
          <Link
            href="/"
            className="text-xs text-[#615B52] hover:text-[#1A3B2B] hover:underline"
          >
            ← Return to Public Community Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
