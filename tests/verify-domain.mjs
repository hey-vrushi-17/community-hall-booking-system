import { checkSlotAvailability, getDaySchedule } from '../src/lib/services/availability-service';
import {
  bookingStore,
  getBookingsForHall,
  getMaintenanceForHall,
  createBookingRequest,
  approveBookingWithConcurrencyCheck,
  rejectBooking,
  getAdminDashboardSummary,
  createMaintenanceWindow,
  cancelMaintenanceWindow,
} from '../src/lib/services/booking-store';
import {
  getAllHalls,
  getAllHallsAdmin,
  createHall,
  updateHall,
  archiveHall,
} from '../src/lib/services/hall-service';
import { SAMPLE_HALLS } from '../src/lib/data/sample-halls';

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

  // 1. Verify Sample Halls data
  assert(SAMPLE_HALLS.length === 6, 'Should have exactly 6 initial civic facilities');
  const oakridge = SAMPLE_HALLS.find((h) => h.id === 'hall-oakridge-01');
  assert(oakridge && oakridge.capacity === 350, 'Oakridge Civic Hall capacity should be 350');

  // 2. Test Availability Engine: Approved Booking Conflict
  // Oakridge has an APPROVED booking on 2026-11-20 from 14:00 to 21:00 UTC
  const slotConflictCheck = await checkSlotAvailability(
    'hall-oakridge-01',
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
  // Oakridge has MAINTENANCE on 2026-11-19 from 07:00 to 13:00 UTC
  const maintConflictCheck = await checkSlotAvailability(
    'hall-oakridge-01',
    new Date('2026-11-19T08:00:00Z'),
    new Date('2026-11-19T11:00:00Z')
  );
  assert(
    maintConflictCheck.isAvailable === false,
    'Slot overlapping a SCHEDULED MAINTENANCE window must be reported as unavailable'
  );

  // 4. Test Core Domain Rule: Pending Requests DO NOT block availability
  // Oakridge has a PENDING request on 2026-11-28 from 10:00 to 18:00 UTC
  const pendingCheck = await checkSlotAvailability(
    'hall-oakridge-01',
    new Date('2026-11-28T11:00:00Z'),
    new Date('2026-11-28T14:00:00Z')
  );
  assert(
    pendingCheck.isAvailable === true,
    'Pending booking request must NOT block slot availability'
  );

  // 5. Test Open Available Slot
  const openSlotCheck = await checkSlotAvailability(
    'hall-oakridge-01',
    new Date('2026-11-29T10:00:00Z'),
    new Date('2026-11-29T14:00:00Z')
  );
  assert(
    openSlotCheck.isAvailable === true,
    'Completely unreserved slot must report as available'
  );

  // 6. Test Booking Request Creation
  const newRequest = await createBookingRequest({
    hallId: 'hall-riverside-02',
    requesterName: 'Marcus Aurelius',
    requesterEmail: 'marcus@civic.example',
    requesterPhone: '(555) 019-9999',
    requesterOrg: 'Philosophy Society',
    eventName: 'Stoic Ethics Community Forum',
    eventType: 'Community Meeting',
    expectedAttendees: 60,
    bookingDate: '2026-12-05',
    startTime: '10:00',
    endTime: '14:00',
    specialRequests: 'Mobile display monitors requested',
    agreeToTerms: true,
  });

  assert(newRequest.id && newRequest.id.startsWith('bkg-'), 'New booking ID should be generated');
  assert(newRequest.status === 'PENDING', 'New booking request must strictly be in PENDING status');
  assert(newRequest.referenceNumber.startsWith('REQ-'), 'Reference number should follow format REQ-YYYY-XXXX');

  // 7. Test Concurrency & Overlap Protection on Approval:
  // Step A: Create two overlapping pending requests for the same slot
  const req1 = await createBookingRequest({
    hallId: 'hall-cedar-grove-04',
    requesterName: 'Alice Walker',
    requesterEmail: 'alice@civic.example',
    requesterPhone: '(555) 123-4567',
    eventName: 'Art Exhibition Setup',
    eventType: 'Exhibition',
    expectedAttendees: 40,
    bookingDate: '2026-12-10',
    startTime: '13:00',
    endTime: '17:00',
    agreeToTerms: true,
  });

  const req2 = await createBookingRequest({
    hallId: 'hall-cedar-grove-04',
    requesterName: 'Bob Dylan',
    requesterEmail: 'bob@civic.example',
    requesterPhone: '(555) 765-4321',
    eventName: 'Folk Music Rehearsal',
    eventType: 'Performance',
    expectedAttendees: 30,
    bookingDate: '2026-12-10',
    startTime: '14:00',
    endTime: '16:00', // Overlaps req1!
    agreeToTerms: true,
  });

  // Step B: Approve req1 -> Should succeed
  const approveReq1Result = await approveBookingWithConcurrencyCheck(
    req1.id,
    'admin@civic.example',
    'Approved - space available'
  );
  assert(
    approveReq1Result.success === true && approveReq1Result.booking.status === 'APPROVED',
    'First pending request should approve successfully'
  );

  // Step C: Attempt to approve req2 -> MUST fail with conflict error!
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

  // 8. Availability check reflects the newly approved booking
  const cedarAvailability = await checkSlotAvailability(
    'hall-cedar-grove-04',
    new Date('2026-12-10T14:30:00Z'),
    new Date('2026-12-10T15:30:00Z')
  );
  assert(
    cedarAvailability.isAvailable === false,
    'Slot approved during test must now be unavailable for public booking'
  );

  // 9. Day Schedule breakdown verification
  const daySchedule = await getDaySchedule('hall-oakridge-01', '2026-11-20');
  assert(
    daySchedule.length > 0,
    'Day schedule breakdown should return hourly slots for operating hours'
  );
  const bookedSlot = daySchedule.find((s) => s.conflictReason === 'APPROVED_BOOKING');
  assert(
    bookedSlot !== undefined,
    'Day schedule should indicate confirmed booked slots'
  );

  // 10. Administrator Experience: Rejecting a booking request
  const rejectedResult = await rejectBooking(
    req2.id,
    'admin@civic.example',
    'Cannot accommodate due to overlapping confirmed booking'
  );
  assert(
    rejectedResult.success === true && rejectedResult.booking.status === 'REJECTED',
    'Administrator must be able to reject a request with an explicit reason'
  );
  assert(
    rejectedResult.booking.decisionNotes.includes('overlapping'),
    'Rejection decision notes must be recorded'
  );

  // 11. Administrator Experience: Dashboard Summary & Hall Utilization
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
    dashboardSummary.hallUtilization.length >= 6,
    'Admin dashboard summary must calculate utilization metrics for all civic facilities'
  );
  assert(
    typeof dashboardSummary.hallUtilization[0].utilizationRate === 'number',
    'Hall utilization percentage must be computed numerically'
  );

  // 12. Hall Management: Create, Update, and Archive
  const createdFacility = await createHall({
    name: 'Harborview Cultural Pavilion',
    tagline: 'Waterfront hall with maritime architecture',
    description: 'Breathtaking venue ideal for large civic receptions and coastal festivals.',
    capacity: 220,
    hourlyRate: 85,
    location: 'Harbor District',
    address: '500 Ocean Boulevard',
    neighborhood: 'Waterfront District',
    amenities: ['Waterfront Deck', 'Audio System', 'Catering Kitchen'],
    images: [{ url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205', alt: 'Harborview Pavilion' }],
    operatingHours: { open: '08:00', close: '23:00', days: 'Monday - Sunday' },
  });
  assert(createdFacility.id && createdFacility.slug === 'harborview-cultural-pavilion', 'Hall slug and ID generated');

  const updatedFacility = await updateHall(createdFacility.id, {
    capacity: 250,
  });
  assert(updatedFacility && updatedFacility.capacity === 250, 'Facility capacity updated to 250');

  // Archival test
  const archivedFacility = await archiveHall(createdFacility.id, true);
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

  // 13. Maintenance Scheduling: Conflict Check against Approved Booking
  // Oakridge has an APPROVED booking on 2026-11-20 from 14:00 to 21:00 UTC
  const conflictMaintenance = await createMaintenanceWindow({
    hallId: 'hall-oakridge-01',
    title: 'Emergency Roof Tile Replacement',
    reason: 'Repair tile damage',
    startTime: '2026-11-20T16:00:00Z',
    endTime: '2026-11-20T19:00:00Z',
  });
  assert(
    conflictMaintenance.success === false && conflictMaintenance.conflicts.length > 0,
    'Maintenance window overlapping an APPROVED booking must be rejected with conflict details'
  );

  // 14. Maintenance Scheduling: Non-conflicting window and Cancellation restoration
  const validMaintenance = await createMaintenanceWindow({
    hallId: 'hall-oakridge-01',
    title: 'Early Morning Fire Alarm Testing',
    reason: 'Annual sensor calibration',
    startTime: '2026-12-15T05:00:00Z',
    endTime: '2026-12-15T07:30:00Z',
  });
  assert(validMaintenance.success === true, 'Non-conflicting maintenance window must be scheduled successfully');

  // Verify it blocks slot availability
  const checkMaintSlot = await checkSlotAvailability(
    'hall-oakridge-01',
    new Date('2026-12-15T06:00:00Z'),
    new Date('2026-12-15T07:00:00Z')
  );
  assert(checkMaintSlot.isAvailable === false, 'Scheduled maintenance window blocks slot availability');

  // Cancel the maintenance window
  const cancelResult = await cancelMaintenanceWindow(validMaintenance.maintenance.id, 'Calibration finished ahead of schedule');
  assert(cancelResult.success === true && cancelResult.maintenance.status === 'CANCELLED', 'Maintenance window marked CANCELLED');

  // Verify availability is restored
  const checkRestoredSlot = await checkSlotAvailability(
    'hall-oakridge-01',
    new Date('2026-12-15T06:00:00Z'),
    new Date('2026-12-15T07:00:00Z')
  );
  assert(checkRestoredSlot.isAvailable === true, 'Cancelling maintenance window immediately unblocks slot availability');

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
