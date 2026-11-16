import { checkSlotAvailability, getDaySchedule } from '../src/lib/services/availability-service';
import {
  bookingStore,
  getBookingsForHall,
  getMaintenanceForHall,
  createBookingRequest,
  approveBookingWithConcurrencyCheck,
} from '../src/lib/services/booking-store';
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

  assert(
    newRequest.status === 'PENDING',
    'Newly created booking request must be initialized with PENDING status'
  );
  assert(
    newRequest.referenceNumber.startsWith('REQ-2026-'),
    'Booking reference must follow REQ-2026-XXXX format'
  );

  // 7. Test Concurrency-Guarded Approval
  const approvalResult = await approveBookingWithConcurrencyCheck(
    newRequest.id,
    'admin@civic.example',
    'Approved by senior administrator'
  );
  assert(
    approvalResult.success === true && approvalResult.booking.status === 'APPROVED',
    'Admin should successfully approve booking when no overlap exists'
  );

  // 8. Test Overlapping Approval Prevention
  // Create another request for the same slot
  const conflictingRequest = await createBookingRequest({
    hallId: 'hall-riverside-02',
    requesterName: 'Second Requester',
    requesterEmail: 'second@civic.example',
    requesterPhone: '(555) 019-8888',
    eventName: 'Conflicting Gathering',
    eventType: 'Community Meeting',
    expectedAttendees: 40,
    bookingDate: '2026-12-05',
    startTime: '11:00', // overlaps 10:00 - 14:00
    endTime: '13:00',
    agreeToTerms: true,
  });

  const conflictingApproval = await approveBookingWithConcurrencyCheck(
    conflictingRequest.id,
    'admin2@civic.example',
    'Attempting concurrent approval'
  );
  assert(
    conflictingApproval.success === false,
    'System must reject approval when an overlapping approved booking already exists'
  );

  // 9. Day Schedule Breakdown
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
