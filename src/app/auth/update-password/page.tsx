'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supabase) {
      setError('Supabase is not configured in this environment.');
      return;
    }

    if (password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsUpdating(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(updateErr.message);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/my-requests'), 2000);
      }
    } catch {
      setError('Failed to update password.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="py-12 md:py-20">
      <div className="civic-container max-w-md">
        <div className="civic-card p-6 sm:p-8 bg-white border border-[#E5DFD5] space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-[#1C1917]">Set New Password</h1>
            <p className="text-xs text-[#615B52]">
              Choose a strong password for your CivicSpaces account.
            </p>
          </div>

          {error && <Alert variant="error" className="text-xs">{error}</Alert>}

          {success ? (
            <Alert variant="success" className="text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password updated successfully! Redirecting to My Requests...</span>
              </div>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-xs font-semibold text-[#1C1917] mb-1">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] focus:ring-1 focus:ring-[#1A3B2B]"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] focus:ring-1 focus:ring-[#1A3B2B]"
                />
              </div>
              <Button type="submit" variant="primary" isLoading={isUpdating} className="w-full text-xs">
                Update Password
              </Button>
            </form>
          )}

          <div className="text-center pt-2 border-t border-[#E5DFD5]">
            <Link href="/my-requests" className="text-xs text-[#1A3B2B] hover:underline">
              ← Return to My Requests
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
