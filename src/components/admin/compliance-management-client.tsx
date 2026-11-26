'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Trash2,
  Clock,
  CheckCircle2,
  Plus,
  FileCheck2,
  Database,
} from 'lucide-react';
import {
  BreachIncident,
  BreachSeverity,
  BreachStatus,
  ConsentRecord,
  DataDeletionRequest,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTimeInAppTz } from '@/lib/utils/timezone';
import { DATA_RETENTION_SCHEDULE } from '@/lib/config/compliance-config';

interface ComplianceManagementClientProps {
  initialDeletionRequests: DataDeletionRequest[];
  initialBreachIncidents: BreachIncident[];
  initialConsentSummary: {
    totalReceipts: number;
    marketingOptIns: number;
    analyticsOptIns: number;
    recentReceipts: ConsentRecord[];
  };
  setupWarning?: string | null;
}

const SEVERITY_BADGE: Record<BreachSeverity, string> = {
  LOW: 'bg-[#F3EFE8] text-[#1C1917] border-[#E5DFD5]',
  MEDIUM: 'bg-[#FEF6EE] text-[#8C3B00] border-[#F9DBAF]',
  HIGH: 'bg-[#FAEEE8] text-[#AF4924] border-[#E8B8A6]',
  CRITICAL: 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]',
};

export function ComplianceManagementClient({
  initialDeletionRequests,
  initialBreachIncidents,
  initialConsentSummary,
  setupWarning,
}: ComplianceManagementClientProps) {
  const [deletionRequests, setDeletionRequests] =
    React.useState<DataDeletionRequest[]>(initialDeletionRequests);
  const [breaches, setBreaches] =
    React.useState<BreachIncident[]>(initialBreachIncidents);
  const [consentSummary] = React.useState(initialConsentSummary);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // New Breach Incident Form
  const [showNewBreach, setShowNewBreach] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [severity, setSeverity] = React.useState<BreachSeverity>('MEDIUM');
  const [categoriesText, setCategoriesText] = React.useState('Requester Email, Booking Metadata');
  const [estimatedSubjects, setEstimatedSubjects] = React.useState(0);
  const [summary, setSummary] = React.useState('');
  const [containmentActions, setContainmentActions] = React.useState('');
  const [isCreatingBreach, setIsCreatingBreach] = React.useState(false);

  const handleDeletionAction = async (
    requestId: string,
    action: 'APPROVE_AND_ANONYMIZE' | 'MARK_IN_REVIEW' | 'REJECT'
  ) => {
    setBusyId(requestId);
    setFeedback(null);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/compliance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'deletion', requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update deletion request.');
        return;
      }
      setDeletionRequests((prev) =>
        prev.map((r) => (r.id === requestId ? data.request : r))
      );
      setFeedback(`Deletion request ${data.request.referenceCode} updated to ${data.request.status}.`);
    } catch {
      setErrorMsg('Network error updating deletion request.');
    } finally {
      setBusyId(null);
    }
  };

  const handleBreachStatus = async (incidentId: string, status: BreachStatus) => {
    setBusyId(incidentId);
    setFeedback(null);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/compliance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update breach incident.');
        return;
      }
      setBreaches((prev) =>
        prev.map((b) => (b.id === incidentId ? data.incident : b))
      );
      setFeedback(`Incident ${data.incident.incidentCode} transitioned to ${status}.`);
    } catch {
      setErrorMsg('Network error updating breach incident.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateBreach = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingBreach(true);
    setFeedback(null);
    setErrorMsg(null);
    try {
      const affectedDataCategories = categoriesText
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          severity,
          affectedDataCategories:
            affectedDataCategories.length > 0 ? affectedDataCategories : ['General Portal Data'],
          estimatedAffectedSubjects: Number(estimatedSubjects),
          summary,
          containmentActions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to log security incident.');
        return;
      }
      setBreaches((prev) => [data.incident, ...prev]);
      setFeedback(data.message);
      setTitle('');
      setSummary('');
      setContainmentActions('');
      setEstimatedSubjects(0);
      setShowNewBreach(false);
    } catch {
      setErrorMsg('Network error logging security incident.');
    } finally {
      setIsCreatingBreach(false);
    }
  };

  const pendingDeletionsCount = deletionRequests.filter(
    (r) => r.status === 'PENDING' || r.status === 'IN_REVIEW'
  ).length;
  const openBreachesCount = breaches.filter((b) => b.status !== 'RESOLVED').length;

  return (
    <div className="space-y-8">
      {setupWarning && (
        <Alert variant="warning" title="Database Migration Notice" className="text-xs">
          {setupWarning}
        </Alert>
      )}
      {feedback && (
        <Alert variant="success" className="text-xs">
          {feedback}
        </Alert>
      )}
      {errorMsg && (
        <Alert variant="error" className="text-xs">
          {errorMsg}
        </Alert>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="civic-card p-4 bg-white border border-[#E5DFD5] space-y-1">
          <span className="text-xs text-[#615B52] font-medium">Open Erasure Requests</span>
          <div className="text-2xl font-bold text-[#1C1917]">{pendingDeletionsCount}</div>
          <span className="text-[11px] text-[#8A8275]">GDPR Art. 17 • 30-day SLA</span>
        </div>
        <div className="civic-card p-4 bg-white border border-[#E5DFD5] space-y-1">
          <span className="text-xs text-[#615B52] font-medium">Active Breach Incidents</span>
          <div className="text-2xl font-bold text-[#C85A32]">{openBreachesCount}</div>
          <span className="text-[11px] text-[#8A8275]">GDPR Art. 33 • 72h reporting window</span>
        </div>
        <div className="civic-card p-4 bg-white border border-[#E5DFD5] space-y-1">
          <span className="text-xs text-[#615B52] font-medium">Consent Receipts Logged</span>
          <div className="text-2xl font-bold text-[#1A3B2B]">{consentSummary.totalReceipts}</div>
          <span className="text-[11px] text-[#8A8275]">
            {consentSummary.marketingOptIns} marketing • {consentSummary.analyticsOptIns} analytics
          </span>
        </div>
        <div className="civic-card p-4 bg-white border border-[#E5DFD5] space-y-1">
          <span className="text-xs text-[#615B52] font-medium">Policy Suite</span>
          <div className="text-2xl font-bold text-[#18283E]">15 / 15</div>
          <Link href="/legal" className="text-[11px] text-[#1A3B2B] font-semibold hover:underline">
            View Published Legal Docs →
          </Link>
        </div>
      </div>

      {/* 1. Data Breach Procedures & 72h Incident Register */}
      <section className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5DFD5] pb-4">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#C85A32]" />
            <div>
              <h2 className="text-base font-bold text-[#1C1917]">
                12 — Data Breach Incident Register (GDPR Art. 33 &amp; Art. 34)
              </h2>
              <p className="text-xs text-[#615B52]">
                Log security incidents, track the mandatory 72-hour supervisory authority deadline, and record containment actions.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={() => setShowNewBreach(!showNewBreach)}
            className="text-xs gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {showNewBreach ? 'Cancel' : 'Log Security Incident'}
          </Button>
        </div>

        {showNewBreach && (
          <form
            onSubmit={handleCreateBreach}
            className="p-4 rounded-md bg-[#FBF9F5] border border-[#E5DFD5] space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Incident Title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unauthorized export attempt detected"
                />
              </div>
              <Select
                label="Severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as BreachSeverity)}
                options={[
                  { value: 'LOW', label: 'LOW' },
                  { value: 'MEDIUM', label: 'MEDIUM' },
                  { value: 'HIGH', label: 'HIGH' },
                  { value: 'CRITICAL', label: 'CRITICAL' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Affected Data Categories (comma-separated)"
                required
                value={categoriesText}
                onChange={(e) => setCategoriesText(e.target.value)}
              />
              <Input
                label="Estimated Affected Data Subjects"
                type="number"
                min={0}
                value={estimatedSubjects}
                onChange={(e) => setEstimatedSubjects(Number(e.target.value))}
              />
            </div>

            <Textarea
              label="Incident Summary & Scope"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe what occurred, affected tables/routes, and discovery source..."
            />
            <Textarea
              label="Immediate Containment Actions"
              required
              value={containmentActions}
              onChange={(e) => setContainmentActions(e.target.value)}
              placeholder="Sessions revoked, secrets rotated, endpoint locked..."
            />

            <Button type="submit" variant="primary" size="sm" isLoading={isCreatingBreach} className="text-xs">
              Create Incident &amp; Start 72h Timer
            </Button>
          </form>
        )}

        <div className="space-y-3">
          {breaches.map((inc) => (
            <div key={inc.id} className="p-4 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] space-y-3 text-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-[#1C1917]">{inc.incidentCode}</span>
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-bold ${SEVERITY_BADGE[inc.severity]}`}
                  >
                    {inc.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E5DFD5] font-semibold text-[11px]">
                    {inc.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#8C3B00] font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>72h Art. 33 Deadline: {formatDateTimeInAppTz(inc.notificationDeadlineAt)}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#1C1917]">{inc.title}</h3>
                <p className="text-[#615B52] mt-1">{inc.summary}</p>
                <p className="text-[#4D4841] mt-1">
                  <strong>Containment:</strong> {inc.containmentActions}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5DFD5]">
                <div className="text-[11px] text-[#615B52]">
                  Categories: <strong>{inc.affectedDataCategories.join(', ')}</strong> • Affected:{' '}
                  <strong>{inc.estimatedAffectedSubjects}</strong>
                </div>
                {inc.status !== 'RESOLVED' && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {inc.status === 'DETECTED' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyId === inc.id}
                        onClick={() => handleBreachStatus(inc.id, 'CONTAINED')}
                        className="text-[11px]"
                      >
                        Mark Contained
                      </Button>
                    )}
                    {inc.status !== 'NOTIFIED_AUTHORITY' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyId === inc.id}
                        onClick={() => handleBreachStatus(inc.id, 'NOTIFIED_AUTHORITY')}
                        className="text-[11px]"
                      >
                        Log Authority Notification
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={busyId === inc.id}
                      onClick={() => handleBreachStatus(inc.id, 'RESOLVED')}
                      className="text-[11px]"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Mark Resolved
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Data Deletion Requests Queue (GDPR Art. 17) */}
      <section className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#E5DFD5] pb-4">
          <Trash2 className="w-5 h-5 text-[#B42318]" />
          <div>
            <h2 className="text-base font-bold text-[#1C1917]">
              07 — Data Deletion &amp; Erasure Queue (GDPR Art. 17)
            </h2>
            <p className="text-xs text-[#615B52]">
              Verify requester identity and execute one-click PII anonymization across citizen profiles and booking records.
            </p>
          </div>
        </div>

        {deletionRequests.length === 0 ? (
          <p className="text-xs text-[#615B52] py-4">No data deletion requests recorded.</p>
        ) : (
          <div className="divide-y divide-[#E5DFD5] border border-[#E5DFD5] rounded-md">
            {deletionRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-[#1C1917]">{req.referenceCode}</span>
                    <span className="px-2 py-0.5 rounded bg-[#F3EFE8] font-semibold text-[11px]">
                      {req.scope}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#EBF3EE] text-[#1A3B2B] font-semibold text-[11px]">
                      {req.status}
                    </span>
                  </div>
                  <div className="text-[#4D4841]">
                    Requester: <strong>{req.requesterEmail}</strong>
                    {req.bookingReference && ` • Booking Ref: ${req.bookingReference}`}
                  </div>
                  {req.reason && <div className="text-[#615B52]">Reason: {req.reason}</div>}
                  {req.resolutionNotes && (
                    <div className="text-[11px] text-[#615B52]">{req.resolutionNotes}</div>
                  )}
                </div>

                {(req.status === 'PENDING' || req.status === 'IN_REVIEW') && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busyId === req.id}
                      onClick={() => handleDeletionAction(req.id, 'APPROVE_AND_ANONYMIZE')}
                      className="text-xs"
                    >
                      Approve &amp; Anonymize PII
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyId === req.id}
                      onClick={() => handleDeletionAction(req.id, 'REJECT')}
                      className="text-xs"
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Data Retention Policy Summary */}
      <section className="civic-card p-6 bg-white border border-[#E5DFD5] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#1A3B2B]" />
            <div>
              <h2 className="text-base font-bold text-[#1C1917]">
                08 — Active Data Retention &amp; Disposal Policy
              </h2>
              <p className="text-xs text-[#615B52]">
                Municipal storage limitation schedule enforced across records.
              </p>
            </div>
          </div>
          <Link href="/legal/data-retention" className="text-xs font-semibold text-[#1A3B2B] hover:underline flex items-center gap-1">
            <FileCheck2 className="w-3.5 h-3.5" />
            Full Policy
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {DATA_RETENTION_SCHEDULE.map((item) => (
            <div key={item.category} className="p-3.5 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] space-y-1">
              <div className="font-bold text-[#1C1917]">{item.category}</div>
              <div className="text-[#1A3B2B] font-semibold">{item.retentionPeriod}</div>
              <p className="text-[11px] text-[#615B52]">{item.disposalMethod}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
