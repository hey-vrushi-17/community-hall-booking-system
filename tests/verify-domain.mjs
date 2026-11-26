import { checkSlotAvailability, getDaySchedule } from '../src/lib/services/availability-service';
import {
  createBookingRequest,
  cancelOwnPendingBooking,
  approveBookingWithConcurrencyCheck,
  rejectBooking,
  getAdminDashboardSummary,
  createMaintenanceWindow,
  cancelMaintenanceWindow,
  getAuditEvents,
} from '../src/lib/services/booking-store';
import {
  getAllHalls,
  getAllHallsAdmin,
  createHall,
  updateHall,
  archiveHall,
} from '../src/lib/services/hall-service';
import { SAMPLE_HALLS } from '../src/lib/data/sample-halls';
import { zonedLocalToUtcIso } from '../src/lib/utils/timezone';
import { validateBookingBusinessRules } from '../src/lib/validation/booking-schema';
import { complianceStore } from '../src/lib/services/compliance-store';
import {
  calculateBookingFeeSummary,
  LEGAL_DOCUMENTS,
  OPEN_SOURCE_PACKAGES,
} from '../src/lib/config/compliance-config';

async function runVerification() {
  console.log('=== RUNNING CIVICSPACES SYSTEM VERIFICATION ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Verify Sample Community Halls catalog
  assert(SAMPLE_HALLS.length === 15, 'Should have 15 community halls in development sample catalog');
  const babarRoad = SAMPLE_HALLS.find((h) => h.id === 'hall-ndmc-babar-01');
  assert(
    babarRoad && babarRoad.capacity === 225 && babarRoad.address.includes('110001'),
    'Babar Road NDMC Community Centre capacity should be 225 with Delhi 110001 PIN'
  );

  // 2. Test Availability Engine: Approved Booking Conflict
  const slotConflictCheck = await checkSlotAvailability(
    'hall-ndmc-babar-01',
    new Date('2026-11-20T15:00:00Z'),
    new Date('2026-11-20T18:00:00Z')
  );
  assert(
    slotConflictCheck.isAvailable === false,
    'Slot overlapping an APPROVED booking must be reported as unavailable'
  );
  assert(
    slotConflictCheck.conflictingBookings.length > 0,
    'Conflict must list the approved booking record'
  );

  // 3. Test Availability Engine: Maintenance Window Conflict
  const maintConflictCheck = await checkSlotAvailability(
    'hall-ndmc-babar-01',
    new Date('2026-11-19T08:00:00Z'),
    new Date('2026-11-19T11:00:00Z')
  );
  assert(
    maintConflictCheck.isAvailable === false,
    'Slot overlapping a SCHEDULED MAINTENANCE window must be reported as unavailable'
  );

  // 4. Test Core Domain Rule: Pending Requests DO NOT block availability
  const pendingCheck = await checkSlotAvailability(
    'hall-ndmc-babar-01',
    new Date('2026-11-28T11:00:00Z'),
    new Date('2026-11-28T14:00:00Z')
  );
  assert(
    pendingCheck.isAvailable === true,
    'Pending booking request must NOT block slot availability'
  );

  // 5. Test Open Available Slot
  const openSlotCheck = await checkSlotAvailability(
    'hall-ndmc-babar-01',
    new Date('2026-11-29T10:00:00Z'),
    new Date('2026-11-29T14:00:00Z')
  );
  assert(
    openSlotCheck.isAvailable === true,
    'Completely unreserved slot must report as available'
  );

  // 6. Test Timezone Conversion (IST Asia/Kolkata -> UTC) & Business Rule Validation
  const istConverted = zonedLocalToUtcIso('2026-12-10', '13:00', 'Asia/Kolkata');
  assert(
    istConverted === '2026-12-10T07:30:00.000Z',
    'Local 13:00 Asia/Kolkata converts accurately to 07:30:00Z UTC'
  );

  const overCapacityViolations = validateBookingBusinessRules(
    {
      hallId: 'hall-blr-sevasadan-05',
      requesterName: 'Test Organizer',
      requesterEmail: 'test@example.org',
      requesterPhone: '+91 98110 11111',
      eventName: 'Oversized Assembly',
      eventType: 'Community Meeting',
      expectedAttendees: 999,
      bookingDate: '2026-12-10',
      startTime: '10:00',
      endTime: '12:00',
      agreeToTerms: true,
    },
    SAMPLE_HALLS.find((h) => h.id === 'hall-blr-sevasadan-05') || null,
    { allowPastDatesForTests: true }
  );
  assert(
    overCapacityViolations.some((v) => v.field === 'expectedAttendees'),
    'Business rule validation rejects attendance exceeding hall capacity'
  );

  // 7. Test Booking Request Creation
  const newRequest = await createBookingRequest(
    {
      hallId: 'hall-ihc-stein-02',
      requesterName: 'Rohan Deshpande',
      requesterEmail: 'rohan@civic.example',
      requesterPhone: '+91 98110 99999',
      requesterOrg: 'Delhi Urban Design Forum',
      eventName: 'Sustainable Cities Public Dialogue',
      eventType: 'Community Meeting',
      expectedAttendees: 180,
      bookingDate: '2026-12-05',
      startTime: '10:00',
      endTime: '14:00',
      specialRequests: 'Interpretation booths requested',
      agreeToTerms: true,
    },
    'user-123'
  );

  assert(newRequest.id && newRequest.id.startsWith('bkg-'), 'New booking ID should be generated');
  assert(newRequest.status === 'PENDING', 'New booking request must strictly be in PENDING status');
  assert(newRequest.referenceNumber.startsWith('REQ-'), 'Reference number should follow format REQ-YYYY-XXXX');

  // 8. Test Owner Pending Cancellation Rules
  const wrongOwnerCancel = await cancelOwnPendingBooking(newRequest.id, 'other-user', 'other@example.org');
  assert(
    wrongOwnerCancel.success === false && wrongOwnerCancel.statusCode === 403,
    'Non-owner cannot cancel another user booking request'
  );

  const ownerCancel = await cancelOwnPendingBooking(newRequest.id, 'user-123', 'rohan@civic.example', 'Schedule moved');
  assert(
    ownerCancel.success === true && ownerCancel.booking?.status === 'CANCELLED',
    'Authenticated owner can cancel their own PENDING booking request'
  );

  // 9. Test Concurrency & Overlap Protection on Approval
  const req1 = await createBookingRequest({
    hallId: 'hall-blr-sevasadan-05',
    requesterName: 'Kavita Rao',
    requesterEmail: 'kavita@civic.example',
    requesterPhone: '+91 98450 12345',
    eventName: 'Carnatic Vocal Concert',
    eventType: 'Performance / Rehearsal',
    expectedAttendees: 120,
    bookingDate: '2026-12-10',
    startTime: '13:00',
    endTime: '17:00',
    agreeToTerms: true,
  });

  const req2 = await createBookingRequest({
    hallId: 'hall-blr-sevasadan-05',
    requesterName: 'Suresh Menon',
    requesterEmail: 'suresh@civic.example',
    requesterPhone: '+91 98451 54321',
    eventName: 'Classical Dance Rehearsal',
    eventType: 'Performance / Rehearsal',
    expectedAttendees: 80,
    bookingDate: '2026-12-10',
    startTime: '14:00',
    endTime: '16:00',
    agreeToTerms: true,
  });

  const approveReq1Result = await approveBookingWithConcurrencyCheck(
    req1.id,
    'admin@civic.example',
    'Approved - space available'
  );
  assert(
    approveReq1Result.success === true && approveReq1Result.booking?.status === 'APPROVED',
    'First pending request should approve successfully'
  );

  const approveReq2Result = await approveBookingWithConcurrencyCheck(
    req2.id,
    'admin@civic.example',
    'Attempting approval'
  );
  assert(
    approveReq2Result.success === false,
    'Server must reject approval of an overlapping booking request'
  );
  assert(
    approveReq2Result.conflictBookings && approveReq2Result.conflictBookings.length > 0,
    'Rejection payload must specify the conflicting approved booking'
  );

  // 10. Availability check reflects the newly approved booking (13:00-17:00 IST = 07:30-11:30Z)
  const sevaSadanAvailability = await checkSlotAvailability(
    'hall-blr-sevasadan-05',
    new Date('2026-12-10T08:30:00Z'),
    new Date('2026-12-10T09:30:00Z')
  );
  assert(
    sevaSadanAvailability.isAvailable === false,
    'Slot approved during test must now be unavailable for public booking'
  );

  // 11. Day Schedule breakdown verification
  const daySchedule = await getDaySchedule('hall-ndmc-babar-01', '2026-11-20');
  assert(
    daySchedule.length > 0,
    'Day schedule breakdown should return hourly slots for operating hours'
  );
  const bookedSlot = daySchedule.find((s) => s.conflictReason === 'APPROVED_BOOKING');
  assert(
    bookedSlot !== undefined,
    'Day schedule should indicate confirmed booked slots'
  );

  // 12. Administrator Experience: Rejecting a booking request
  const rejectedResult = await rejectBooking(
    req2.id,
    'admin@civic.example',
    'Cannot accommodate due to overlapping confirmed booking'
  );
  assert(
    rejectedResult.success === true && rejectedResult.booking?.status === 'REJECTED',
    'Administrator must be able to reject a request with an explicit reason'
  );
  assert(
    rejectedResult.booking?.decisionNotes?.includes('overlapping'),
    'Rejection decision notes must be recorded'
  );

  // 13. Administrator Experience: Dashboard Summary & Hall Utilization
  const dashboardSummary = await getAdminDashboardSummary();
  assert(
    dashboardSummary.pendingCount >= 0,
    'Admin dashboard summary must calculate pending request count'
  );
  assert(
    dashboardSummary.approvedCount >= 1,
    'Admin dashboard summary must calculate approved booking count'
  );
  assert(
    dashboardSummary.hallUtilization.length >= 15,
    'Admin dashboard summary must calculate utilization metrics for all facilities'
  );
  assert(
    typeof dashboardSummary.hallUtilization[0].utilizationRate === 'number',
    'Hall utilization percentage must be computed numerically'
  );

  // 14. Hall Management: Create, Update, Archive & Audit Recording
  const createdFacility = await createHall(
    {
      name: 'Nehru Memorial Town Hall Kochi',
      tagline: 'Heritage municipal town hall in Mattancherry',
      description: 'Historic public gathering venue managed by Kochi Municipal Corporation.',
      capacity: 1000,
      hourlyRate: 1500,
      location: 'Mattancherry, Kochi',
      address: 'Town Hall Rd, Koovapadam, Mattancherry, Kochi, Kerala 682002',
      neighborhood: 'Kochi',
      amenities: ['Main Hall', 'Audio System', 'Dining Area'],
      images: [{ url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205', alt: 'Nehru Memorial Town Hall' }],
      operatingHours: { open: '08:00', close: '22:00', days: 'Monday - Sunday' },
    },
    { email: 'admin@civic.example' }
  );
  assert(createdFacility.id && createdFacility.slug === 'nehru-memorial-town-hall-kochi', 'Hall slug and ID generated');

  const updatedFacility = await updateHall(createdFacility.id, { capacity: 1100 }, { email: 'admin@civic.example' });
  assert(updatedFacility && updatedFacility.capacity === 1100, 'Facility capacity updated to 1100');

  const archivedFacility = await archiveHall(createdFacility.id, true, { email: 'admin@civic.example' });
  assert(archivedFacility && archivedFacility.isActive === false, 'Archiving facility sets isActive to false');

  const publicHallsAfterArchive = await getAllHalls();
  assert(
    !publicHallsAfterArchive.some((h) => h.id === createdFacility.id),
    'Archived facility must be excluded from public active listings'
  );

  const adminHallsAfterArchive = await getAllHallsAdmin(true);
  assert(
    adminHallsAfterArchive.some((h) => h.id === createdFacility.id),
    'Archived facility must remain visible in administrative management view'
  );

  // 15. Maintenance Scheduling & Cancellation
  const conflictMaintenance = await createMaintenanceWindow(
    {
      hallId: 'hall-ndmc-babar-01',
      title: 'Emergency Electrical Panel Upgrade',
      reason: 'Upgrade main breaker',
      startTime: '2026-11-20T16:00:00Z',
      endTime: '2026-11-20T19:00:00Z',
    },
    { email: 'admin@civic.example' }
  );
  assert(
    conflictMaintenance.success === false && (conflictMaintenance.conflicts?.length || 0) > 0,
    'Maintenance window overlapping an APPROVED booking must be rejected with conflict details'
  );

  const validMaintenance = await createMaintenanceWindow(
    {
      hallId: 'hall-ndmc-babar-01',
      title: 'Early Morning Fire Alarm Testing',
      reason: 'Annual sensor calibration',
      startTime: '2026-12-15T05:00:00Z',
      endTime: '2026-12-15T07:30:00Z',
    },
    { email: 'admin@civic.example' }
  );
  assert(validMaintenance.success === true, 'Non-conflicting maintenance window must be scheduled successfully');

  const checkMaintSlot = await checkSlotAvailability(
    'hall-ndmc-babar-01',
    new Date('2026-12-15T06:00:00Z'),
    new Date('2026-12-15T07:00:00Z')
  );
  assert(checkMaintSlot.isAvailable === false, 'Scheduled maintenance window blocks slot availability');

  const cancelResult = await cancelMaintenanceWindow(
    validMaintenance.maintenance.id,
    'Calibration finished ahead of schedule',
    { email: 'admin@civic.example' }
  );
  assert(cancelResult.success === true && cancelResult.maintenance?.status === 'CANCELLED', 'Maintenance window marked CANCELLED');

  const checkRestoredSlot = await checkSlotAvailability(
    'hall-ndmc-babar-01',
    new Date('2026-12-15T06:00:00Z'),
    new Date('2026-12-15T07:00:00Z')
  );
  assert(checkRestoredSlot.isAvailable === true, 'Cancelling maintenance window immediately unblocks slot availability');

  // 16. Audit Log verification
  const hallAuditEvents = await getAuditEvents({ entityType: 'Hall' });
  assert(
    hallAuditEvents.some((e) => e.action === 'ARCHIVE_HALL' && e.entityId === createdFacility.id),
    'Audit events record hall administrative changes with filtering support'
  );

  // 17. Compliance Suite & Payment Fee Summary verification
  assert(
    LEGAL_DOCUMENTS.length === 15,
    'All 15 compliance and legal policy documents should be registered'
  );
  assert(
    OPEN_SOURCE_PACKAGES.length >= 15,
    'Open-source licence inventory should document project dependencies'
  );

  const feeSummary = calculateBookingFeeSummary(2000, '10:00', '14:00');
  assert(
    feeSummary &&
      feeSummary.durationHours === 4 &&
      feeSummary.baseRentalFee === 8000 &&
      feeSummary.securityDeposit === 2000 &&
      feeSummary.estimatedTotalDueOnApproval === 10000,
    'Payment & Subscription Terms fee calculator computes rental and 25% refundable deposit accurately'
  );

  // 18. Consent Receipt & GDPR Data Export & Art. 17 PII Anonymization
  const consentReceipt = await complianceStore.recordConsent({
    subjectEmail: 'kavita@civic.example',
    consentType: 'MARKETING_EMAIL',
    granted: true,
    policyVersion: '2026.1',
    source: 'domain_test',
    legalBasis: 'GDPR Art. 6(1)(a)',
  });
  assert(consentReceipt.id && consentReceipt.granted === true, 'Consent receipt recorded');

  const exportedData = await complianceStore.exportPersonalData({
    email: 'kavita@civic.example',
  });
  assert(
    exportedData.bookings.length >= 1 && exportedData.consentHistory.length >= 1,
    'GDPR Art. 15/20 data export bundles bookings and consent receipts for data subject'
  );

  const deletionResult = await complianceStore.createDeletionRequest({
    requesterEmail: 'kavita@civic.example',
    bookingReference: req1.referenceNumber,
    scope: 'BOOKING_PII',
    reason: 'Verification test erasure',
    executeImmediately: true,
  });
  assert(
    deletionResult.status === 'COMPLETED' && deletionResult.anonymizedRecordsCount >= 1,
    'GDPR Art. 17 self-service erasure anonymizes booking PII immediately when verified'
  );

  // 19. 72-Hour Data Breach Incident Workflow
  const incident = await complianceStore.createBreachIncident({
    title: 'Verification Drill Incident',
    severity: 'MEDIUM',
    affectedDataCategories: ['Email'],
    estimatedAffectedSubjects: 2,
    summary: 'Simulated verification breach incident for 72h SLA calculation',
    containmentActions: 'Session revoked and rotated',
    reportedBy: 'admin@civic.example',
  });
  const deadlineDiffHours =
    (new Date(incident.notificationDeadlineAt).getTime() -
      new Date(incident.detectedAt).getTime()) /
    (1000 * 60 * 60);
  assert(
    Math.round(deadlineDiffHours) === 72 && incident.status === 'DETECTED',
    'Breach incident sets exact 72-hour GDPR Art. 33 notification deadline'
  );

  const updatedIncident = await complianceStore.updateBreachIncident({
    incidentId: incident.id,
    status: 'NOTIFIED_AUTHORITY',
    adminEmail: 'admin@civic.example',
  });
  assert(
    updatedIncident &&
      updatedIncident.status === 'NOTIFIED_AUTHORITY' &&
      Boolean(updatedIncident.authorityNotifiedAt),
    'Updating breach incident to NOTIFIED_AUTHORITY records notification timestamp'
  );

  console.log(`\n========================================`);
  console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
