'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Download,
  Trash2,
  Mail,
  Cookie,
  ShieldCheck,
  FileJson,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseUser } from '@/lib/supabase/use-user';
import { dispatchOpenCookieSettings } from './cookie-consent-banner';
import { DataDeletionRequest } from '@/types';
import { formatDateTimeInAppTz } from '@/lib/utils/timezone';

export function PrivacyCenterClient() {
  const { user, isLoading: isAuthLoading, isConfigured } = useSupabaseUser();

  // GDPR Art. 15 / 20 Data Export state
  const [exportRef, setExportRef] = React.useState('');
  const [exportEmailInput, setExportEmailInput] = React.useState<string | null>(null);
  const [exportJson, setExportJson] = React.useState<string | null>(null);
  const [exportError, setExportError] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  // Marketing Consent state
  const [marketingEmailInput, setMarketingEmailInput] = React.useState<string | null>(null);
  const [marketingGranted, setMarketingGranted] = React.useState(false);
  const [marketingStatus, setMarketingStatus] = React.useState<string | null>(null);
  const [marketingError, setMarketingError] = React.useState<string | null>(null);
  const [isSavingMarketing, setIsSavingMarketing] = React.useState(false);

  // Data Deletion (GDPR Art. 17) state
  const [delEmailInput, setDelEmailInput] = React.useState<string | null>(null);
  const [delNameInput, setDelNameInput] = React.useState<string | null>(null);
  const [delBookingRef, setDelBookingRef] = React.useState('');
  const [delScope, setDelScope] = React.useState<'FULL_ACCOUNT' | 'BOOKING_PII' | 'MARKETING_DATA'>('BOOKING_PII');
  const [delReason, setDelReason] = React.useState('');
  const [delImmediate, setDelImmediate] = React.useState(false);
  const [isSubmittingDel, setIsSubmittingDel] = React.useState(false);
  const [delFeedback, setDelFeedback] = React.useState<string | null>(null);
  const [delError, setDelError] = React.useState<string | null>(null);
  const [myDeletionRequests, setMyDeletionRequests] = React.useState<DataDeletionRequest[]>([]);

  const exportEmail = exportEmailInput ?? user?.email ?? '';
  const marketingEmail = marketingEmailInput ?? user?.email ?? '';
  const delEmail = delEmailInput ?? user?.email ?? '';
  const delName = delNameInput ?? user?.profile.fullName ?? '';

  React.useEffect(() => {
    if (!user?.email) return;
    let active = true;
    fetch('/api/privacy/deletion')
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((data) => {
        if (active && Array.isArray(data.requests)) {
          setMyDeletionRequests(data.requests);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  const handleExportData = async (downloadFile: boolean) => {
    setIsExporting(true);
    setExportError(null);

    try {
      const params = new URLSearchParams();
      if (!user) {
        if (!exportRef.trim() || !exportEmail.trim()) {
          setExportError('Enter both your booking reference number and email address to verify identity.');
          setIsExporting(false);
          return;
        }
        params.set('ref', exportRef.trim());
        params.set('email', exportEmail.trim());
      }
      if (downloadFile) {
        params.set('download', '1');
      }

      const res = await fetch(`/api/privacy/export?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setExportError(err.error || 'Unable to export data.');
        return;
      }

      const text = await res.text();
      setExportJson(text);

      if (downloadFile) {
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'civicspaces-gdpr-data-export.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch {
      setExportError('Network error while generating your GDPR data export.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleMarketingSave = async (granted: boolean) => {
    setIsSavingMarketing(true);
    setMarketingStatus(null);
    setMarketingError(null);

    try {
      const res = await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'marketing',
          email: user?.email || marketingEmail.trim(),
          granted,
          source: 'privacy_center',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMarketingError(data.error || 'Could not update marketing preferences.');
        return;
      }
      setMarketingGranted(granted);
      setMarketingStatus(data.message);
    } catch {
      setMarketingError('Network error updating marketing consent.');
    } finally {
      setIsSavingMarketing(false);
    }
  };

  const handleDeletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDel(true);
    setDelFeedback(null);
    setDelError(null);

    try {
      const res = await fetch('/api/privacy/deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: delEmail.trim(),
          requesterName: delName.trim() || undefined,
          bookingReference: delBookingRef.trim() || undefined,
          scope: delScope,
          reason: delReason.trim() || undefined,
          executeImmediately: delImmediate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDelError(data.error || 'Could not submit deletion request.');
        return;
      }
      setDelFeedback(data.message);
      if (data.request) {
        setMyDeletionRequests((prev) => [data.request, ...prev]);
      }
      setDelReason('');
    } catch {
      setDelError('Network error submitting deletion request.');
    } finally {
      setIsSubmittingDel(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Status Banner */}
      <div className="p-4 rounded-lg bg-[#EBF3EE] border border-[#CDE3D5] text-xs text-[#1A3B2B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {isConfigured && !isAuthLoading && user ? (
              <>
                Signed in as <strong>{user.email}</strong>. You can directly export your account data, adjust marketing consent, or execute GDPR erasure requests.
              </>
            ) : (
              <>
                Self-service privacy rights are available for all citizens. Sign in or verify using your booking reference number + email address.
              </>
            )}
          </span>
        </div>
        {isConfigured && !isAuthLoading && !user && (
          <Link href="/login?next=/privacy-center" className="shrink-0">
            <Button variant="primary" size="sm" className="text-xs">
              Sign In
            </Button>
          </Link>
        )}
      </div>

      {/* 1. Cookie Preferences */}
      <section id="cookies" className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-[#FAEEE8] text-[#C85A32] flex items-center justify-center">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1917]">04 — Cookie Consent Settings</h2>
              <p className="text-xs text-[#615B52]">
                Control strictly necessary, functional, and opt-in analytics cookies at any time.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={dispatchOpenCookieSettings}
            className="text-xs gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Open Cookie Preferences
          </Button>
        </div>
      </section>

      {/* 2. GDPR Data Export */}
      <section id="export" className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center">
            <FileJson className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1C1917]">
              03 — GDPR Right of Access &amp; Portability (Art. 15 &amp; Art. 20)
            </h2>
            <p className="text-xs text-[#615B52]">
              Download a machine-readable JSON copy of your profile, booking records, consent receipts, and deletion logs.
            </p>
          </div>
        </div>

        {!user && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Input
              label="Booking Reference Number"
              placeholder="e.g. REQ-2026-8041"
              value={exportRef}
              onChange={(e) => setExportRef(e.target.value)}
            />
            <Input
              label="Requester Email Address"
              type="email"
              placeholder="ananya.deshmukh@example.org"
              value={exportEmail}
              onChange={(e) => setExportEmailInput(e.target.value)}
            />
          </div>
        )}

        {exportError && <Alert variant="error" className="text-xs">{exportError}</Alert>}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isExporting}
            onClick={() => handleExportData(true)}
            className="text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download JSON Export
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={() => handleExportData(false)}
            className="text-xs"
          >
            Preview Export Payload
          </Button>
        </div>

        {exportJson && (
          <pre className="p-3 rounded-md bg-[#FBF9F5] border border-[#E5DFD5] text-[11px] font-mono text-[#1C1917] max-h-64 overflow-auto">
            {exportJson}
          </pre>
        )}
      </section>

      {/* 3. Marketing Consent */}
      <section id="marketing" className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-[#EDF3FA] text-[#18283E] flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1C1917]">
              06 — Marketing &amp; Civic Updates Consent (Opt-In / Withdrawal)
            </h2>
            <p className="text-xs text-[#615B52]">
              Optional community event bulletins and seasonal venue availability alerts. Never required to book a hall.
            </p>
          </div>
        </div>

        {!user && (
          <div className="max-w-md">
            <Input
              label="Email Address"
              type="email"
              placeholder="citizen@example.org"
              value={marketingEmail}
              onChange={(e) => setMarketingEmailInput(e.target.value)}
            />
          </div>
        )}

        {marketingStatus && (
          <Alert variant="success" className="text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{marketingStatus}</span>
            </div>
          </Alert>
        )}
        {marketingError && <Alert variant="error" className="text-xs">{marketingError}</Alert>}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={marketingGranted ? 'primary' : 'outline'}
            size="sm"
            isLoading={isSavingMarketing}
            onClick={() => handleMarketingSave(true)}
            className="text-xs"
          >
            Opt In to Civic Updates
          </Button>
          <Button
            type="button"
            variant={!marketingGranted ? 'secondary' : 'outline'}
            size="sm"
            disabled={isSavingMarketing}
            onClick={() => handleMarketingSave(false)}
            className="text-xs"
          >
            Withdraw Marketing Consent (Opt Out)
          </Button>
        </div>
      </section>

      {/* 4. Data Deletion (GDPR Art. 17) */}
      <section id="deletion" className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-[#FEF3F2] text-[#B42318] flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1C1917]">
              07 — Data Deletion &amp; Right to Erasure (GDPR Art. 17)
            </h2>
            <p className="text-xs text-[#615B52]">
              Request erasure or anonymization of your personal identifiers across bookings, marketing lists, or your citizen profile.
            </p>
          </div>
        </div>

        {delFeedback && <Alert variant="success" className="text-xs">{delFeedback}</Alert>}
        {delError && <Alert variant="error" className="text-xs">{delError}</Alert>}

        <form onSubmit={handleDeletionSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              required
              value={delEmail}
              onChange={(e) => setDelEmailInput(e.target.value)}
              placeholder="citizen@example.org"
            />
            <Input
              label="Full Name (Optional)"
              value={delName}
              onChange={(e) => setDelNameInput(e.target.value)}
              placeholder="Your name"
            />
            <Select
              label="Erasure Scope"
              value={delScope}
              onChange={(e) =>
                setDelScope(e.target.value as 'FULL_ACCOUNT' | 'BOOKING_PII' | 'MARKETING_DATA')
              }
              options={[
                { value: 'BOOKING_PII', label: 'Booking Contact PII Anonymization' },
                { value: 'FULL_ACCOUNT', label: 'Full Citizen Profile & All Linked Booking PII' },
                { value: 'MARKETING_DATA', label: 'Marketing & Outreach Contact Erasure' },
              ]}
            />
            <Input
              label="Booking Reference (Required for Unauthenticated Booking Erasure)"
              value={delBookingRef}
              onChange={(e) => setDelBookingRef(e.target.value)}
              placeholder="e.g. REQ-2026-8302"
            />
          </div>

          <Textarea
            label="Reason / Additional Notes (Optional)"
            value={delReason}
            onChange={(e) => setDelReason(e.target.value)}
            placeholder="e.g. Event completed, requesting removal of personal contact details."
          />

          <label className="flex items-start gap-2.5 text-xs text-[#615B52] cursor-pointer">
            <input
              type="checkbox"
              checked={delImmediate}
              onChange={(e) => setDelImmediate(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#CDC5B7] text-[#B42318] focus:ring-[#B42318]"
            />
            <span>
              Execute self-service PII anonymization immediately (available when signed in as the account owner or when verifying with an exact booking reference &amp; email match).
            </span>
          </label>

          <Button type="submit" variant="destructive" size="sm" isLoading={isSubmittingDel} className="text-xs gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />
            Submit Erasure Request
          </Button>
        </form>

        {myDeletionRequests.length > 0 && (
          <div className="pt-4 border-t border-[#E5DFD5] space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
              Submitted Erasure Requests
            </h3>
            <div className="divide-y divide-[#E5DFD5] border border-[#E5DFD5] rounded-md">
              {myDeletionRequests.map((req) => (
                <div key={req.id} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-[#1C1917]">{req.referenceCode}</span>{' '}
                    <span className="text-[#615B52]">• {req.scope}</span>
                    {req.resolutionNotes && (
                      <p className="text-[11px] text-[#615B52] mt-0.5">{req.resolutionNotes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded bg-[#F3EFE8] text-[#1C1917] font-semibold text-[11px]">
                      {req.status}
                    </span>
                    <span className="block text-[10px] text-[#8A8275] mt-0.5">
                      {formatDateTimeInAppTz(req.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
