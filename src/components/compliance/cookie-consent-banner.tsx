'use client';

import * as React from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, SlidersHorizontal, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CookiePreferences } from '@/types';
import {
  COMPLIANCE_VERSIONS,
  COOKIE_CONSENT_COOKIE_NAME,
} from '@/lib/config/compliance-config';

export const OPEN_COOKIE_SETTINGS_EVENT = 'civicspaces:open-cookie-settings';
const CONSENT_CHANGED_EVENT = 'civicspaces:cookie-consent-changed';

export function dispatchOpenCookieSettings() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
  }
}

export function CookieSettingsButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={dispatchOpenCookieSettings}
      className={className || 'hover:text-[#1A3B2B] transition-colors cursor-pointer'}
    >
      Cookie Settings
    </button>
  );
}

function readConsentCookieRaw(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_CONSENT_COOKIE_NAME}=`));
  return match ? match.split('=').slice(1).join('=') : null;
}

function parseConsentCookie(raw: string | null): CookiePreferences | null {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as CookiePreferences;
  } catch {
    return null;
  }
}

const emptySubscribe = () => () => {};

function subscribeConsentStore(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CONSENT_CHANGED_EVENT, callback);
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, callback);
}

export function CookieConsentBanner() {
  const isClient = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const rawSavedCookie = React.useSyncExternalStore(
    subscribeConsentStore,
    readConsentCookieRaw,
    () => null
  );
  const savedPreferences = React.useMemo(
    () => parseConsentCookie(rawSavedCookie),
    [rawSavedCookie]
  );

  const gpcDetected = React.useMemo(() => {
    if (!isClient) return false;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    return Boolean(nav.globalPrivacyControl);
  }, [isClient]);

  const [showModal, setShowModal] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [functionalOverride, setFunctionalOverride] = React.useState<boolean | null>(null);
  const [analyticsOverride, setAnalyticsOverride] = React.useState<boolean | null>(null);
  const [marketingOverride, setMarketingOverride] = React.useState<boolean | null>(null);

  const functional = functionalOverride ?? savedPreferences?.functional ?? true;
  const analytics =
    analyticsOverride ?? (gpcDetected ? false : (savedPreferences?.analytics ?? false));
  const marketing =
    marketingOverride ?? (gpcDetected ? false : (savedPreferences?.marketing ?? false));

  React.useEffect(() => {
    const handleOpen = () => {
      setFunctionalOverride(null);
      setAnalyticsOverride(null);
      setMarketingOverride(null);
      setShowModal(true);
    };

    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpen);
  }, []);

  const persistPreferences = async (
    next: { functional: boolean; analytics: boolean; marketing: boolean },
    source: string
  ) => {
    setIsSaving(true);
    const payload: CookiePreferences = {
      necessary: true,
      functional: next.functional,
      analytics: next.analytics,
      marketing: next.marketing,
      version: COMPLIANCE_VERSIONS.cookiePolicy,
      updatedAt: new Date().toISOString(),
    };

    try {
      document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${encodeURIComponent(
        JSON.stringify(payload)
      )}; path=/; max-age=15552000; SameSite=Lax`;
      window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT));

      await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'cookies',
          necessary: true,
          functional: next.functional,
          analytics: next.analytics,
          marketing: next.marketing,
          source,
        }),
      });
    } catch {
      // Cookie already persisted client-side
    } finally {
      setFunctionalOverride(next.functional);
      setAnalyticsOverride(next.analytics);
      setMarketingOverride(next.marketing);
      setShowModal(false);
      setIsSaving(false);
    }
  };

  if (!isClient) return null;
  const showBanner = savedPreferences === null;

  return (
    <>
      {showBanner && (
        <aside
          aria-label="Cookie Consent Banner"
          className="fixed bottom-4 left-4 right-4 z-50 max-w-4xl mx-auto civic-card bg-white border border-[#CDC5B7] shadow-xl p-4 sm:p-5"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1A3B2B]">
                <Cookie className="w-4 h-4 text-[#C85A32]" />
                <span>Cookie &amp; Privacy Preferences (GDPR &amp; ePrivacy)</span>
                {gpcDetected && (
                  <span className="px-2 py-0.5 rounded bg-[#EBF3EE] text-[#1A3B2B] text-[10px] font-semibold">
                    GPC Signal Respected
                  </span>
                )}
              </div>
              <p className="text-xs text-[#615B52] leading-relaxed">
                CivicSpaces uses strictly necessary cookies for authentication and session security.
                Optional functional and analytics cookies remain disabled unless you opt in. Read our{' '}
                <Link href="/legal/cookies" className="text-[#1A3B2B] font-semibold underline">
                  Cookie Policy
                </Link>{' '}
                and{' '}
                <Link href="/legal/privacy-policy" className="text-[#1A3B2B] font-semibold underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowModal(true)}
                className="text-xs gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Preferences
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isSaving}
                onClick={() =>
                  persistPreferences(
                    { functional: false, analytics: false, marketing: false },
                    'cookie_banner_reject'
                  )
                }
                className="text-xs"
              >
                Reject Non-Essential
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isSaving}
                onClick={() =>
                  persistPreferences(
                    { functional: true, analytics: !gpcDetected, marketing: false },
                    'cookie_banner_accept_all'
                  )
                }
                className="text-xs gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Accept All
              </Button>
            </div>
          </div>
        </aside>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Manage Cookie & Tracking Preferences"
        description={`Policy Version ${COMPLIANCE_VERSIONS.cookiePolicy} • Consent can be changed or withdrawn at any time.`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {gpcDetected && (
            <div className="p-3 rounded-md bg-[#EBF3EE] border border-[#CDE3D5] text-[#1A3B2B] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Global Privacy Control (GPC) browser signal detected — non-essential analytics and marketing cookies are defaulted to off.
              </span>
            </div>
          )}

          {/* Strictly Necessary */}
          <div className="p-3.5 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-[#1C1917]">1. Strictly Necessary Cookies</div>
              <p className="text-[#615B52] leading-relaxed">
                Essential for Supabase citizen authentication (`sb-*`), staff HMAC session cookies (`civic_admin_session`), and saving your cookie consent choice. Cannot be disabled.
              </p>
            </div>
            <span className="px-2 py-1 rounded bg-[#EBF3EE] text-[#1A3B2B] font-semibold text-[11px] shrink-0">
              Always Active
            </span>
          </div>

          {/* Functional */}
          <label className="p-3.5 rounded-md border border-[#E5DFD5] bg-white flex items-start justify-between gap-4 cursor-pointer">
            <div className="space-y-1">
              <div className="font-bold text-[#1C1917]">2. Functional Preferences</div>
              <p className="text-[#615B52] leading-relaxed">
                Remembers hall directory filters, timezone display aids, and UI accessibility choices.
              </p>
            </div>
            <input
              type="checkbox"
              checked={functional}
              onChange={(e) => setFunctionalOverride(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#CDC5B7] text-[#1A3B2B] focus:ring-[#1A3B2B]"
            />
          </label>

          {/* Analytics */}
          <label className="p-3.5 rounded-md border border-[#E5DFD5] bg-white flex items-start justify-between gap-4 cursor-pointer">
            <div className="space-y-1">
              <div className="font-bold text-[#1C1917]">3. Analytics &amp; Service Quality (Opt-In)</div>
              <p className="text-[#615B52] leading-relaxed">
                Aggregated, non-identifying facility demand metrics to improve civic hall scheduling capacity. Never shared with ad networks.
              </p>
            </div>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalyticsOverride(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#CDC5B7] text-[#1A3B2B] focus:ring-[#1A3B2B]"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E5DFD5]">
            <Link
              href="/privacy-center"
              onClick={() => setShowModal(false)}
              className="text-[#1A3B2B] font-semibold hover:underline"
            >
              Open Full Privacy &amp; Data Rights Center →
            </Link>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={() =>
                  persistPreferences(
                    { functional: false, analytics: false, marketing: false },
                    'cookie_modal_reject'
                  )
                }
                className="text-xs"
              >
                Reject All Optional
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isSaving}
                onClick={() =>
                  persistPreferences(
                    { functional, analytics, marketing },
                    'cookie_modal_save'
                  )
                }
                className="text-xs"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
