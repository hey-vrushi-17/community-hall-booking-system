import { Metadata } from 'next';
import { complianceStore } from '@/lib/services/compliance-store';
import { ComplianceManagementClient } from '@/components/admin/compliance-management-client';
import { DatabaseSetupError } from '@/lib/services/hall-service';

export const metadata: Metadata = {
  title: 'Compliance & Breach Governance | CivicSpaces Administration',
  description:
    'Manage GDPR deletion requests, 72-hour data breach response procedures, consent receipts, and retention policies.',
};

export const instant = false;

export default async function AdminCompliancePage() {
  let deletionRequests: Awaited<ReturnType<typeof complianceStore.getDeletionRequests>> = [];
  let breachIncidents: Awaited<ReturnType<typeof complianceStore.getBreachIncidents>> = [];
  let consentSummary: Awaited<ReturnType<typeof complianceStore.getAllConsentSummary>> = {
    totalReceipts: 0,
    marketingOptIns: 0,
    analyticsOptIns: 0,
    recentReceipts: [],
  };
  let setupWarning: string | null = null;

  try {
    [deletionRequests, breachIncidents, consentSummary] = await Promise.all([
      complianceStore.getDeletionRequests(),
      complianceStore.getBreachIncidents(),
      complianceStore.getAllConsentSummary(),
    ]);
  } catch (err: unknown) {
    if (err instanceof DatabaseSetupError) {
      setupWarning =
        'Compliance tables (`consent_records`, `data_deletion_requests`, `breach_incidents`) are not yet applied in Supabase. Run `supabase/migrations/20261126000004_compliance_and_privacy.sql` to enable database persistence.';
    } else {
      setupWarning = 'Unable to load compliance metrics from the database.';
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5DFD5] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
          Privacy, Retention &amp; Breach Governance
        </h1>
        <p className="text-xs sm:text-sm text-[#615B52] mt-1">
          Administer GDPR Article 17 data erasure workflows, track 72-hour Article 33 breach
          incident SLAs, and monitor consent &amp; retention compliance.
        </p>
      </div>

      <ComplianceManagementClient
        initialDeletionRequests={deletionRequests}
        initialBreachIncidents={breachIncidents}
        initialConsentSummary={consentSummary}
        setupWarning={setupWarning}
      />
    </div>
  );
}
