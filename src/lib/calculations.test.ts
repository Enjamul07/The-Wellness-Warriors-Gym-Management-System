import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMembershipExpiry,
  calculateRenewalStartDate,
  calculateInitialPayable,
  calculateOutstandingBalance,
  formatCurrencyINR,
  normalizeIndianPhoneNumber,
  formatWhatsAppReminderUrl,
  checkDailyAttendanceEligibility,
  categorizeMemberStatus
} from './calculations.ts';

test('calculateMembershipExpiry adds months correctly', () => {
  // 1 month
  assert.equal(calculateMembershipExpiry('2026-10-15', 1), '2026-11-15');
  // 3 months
  assert.equal(calculateMembershipExpiry('2026-10-15', 3), '2027-01-15');
  // 12 months (Yearly)
  assert.equal(calculateMembershipExpiry('2026-10-15', 12), '2027-10-15');
  // Month boundary clamping (e.g. Jan 31 + 1 month -> Feb 28)
  assert.equal(calculateMembershipExpiry('2026-01-31', 1), '2026-02-28');
});

test('calculateRenewalStartDate extends active membership after current expiry', () => {
  // If membership is active until 2026-11-10 and today is 2026-10-20, renewal starts 2026-11-11
  const renewalStart = calculateRenewalStartDate('2026-11-10', '2026-10-20');
  assert.equal(renewalStart, '2026-11-11');

  // If already expired (e.g. expired 2026-10-01, today is 2026-10-20), renewal starts on today or chosen date
  const expiredRenewal = calculateRenewalStartDate('2026-10-01', '2026-10-20');
  assert.equal(expiredRenewal, '2026-10-20');

  const customRenewal = calculateRenewalStartDate('2026-10-01', '2026-10-20', '2026-10-25');
  assert.equal(customRenewal, '2026-10-25');
});

test('calculateInitialPayable waives admission fee on Yearly plan and computes PT', () => {
  // Monthly plan: ₹800 + ₹300 admission = ₹1,100
  const monthlyRes = calculateInitialPayable({
    plan: { membership_price: 800, admission_fee: 300, duration_months: 1, code: 'PLAN-M1' },
    hasPersonalTraining: false
  });
  assert.equal(monthlyRes.basePrice, 800);
  assert.equal(monthlyRes.admissionFee, 300);
  assert.equal(monthlyRes.ptFee, 0);
  assert.equal(monthlyRes.totalAmount, 1100);

  // Yearly plan: ₹6,500 + ₹0 admission (waived!) = ₹6,500
  const yearlyRes = calculateInitialPayable({
    plan: { membership_price: 6500, admission_fee: 300, duration_months: 12, code: 'PLAN-Y12' },
    hasPersonalTraining: false
  });
  assert.equal(yearlyRes.basePrice, 6500);
  assert.equal(yearlyRes.admissionFee, 0); // Waived
  assert.equal(yearlyRes.totalAmount, 6500);

  // Quarterly + 3 months Personal Training (₹2,100 + ₹300 + 3 * ₹1500 = ₹6,900)
  const ptRes = calculateInitialPayable({
    plan: { membership_price: 2100, admission_fee: 300, duration_months: 3, code: 'PLAN-Q3' },
    hasPersonalTraining: true,
    ptMonths: 3,
    ptMonthlyFee: 1500
  });
  assert.equal(ptRes.basePrice, 2100);
  assert.equal(ptRes.admissionFee, 300);
  assert.equal(ptRes.ptFee, 4500);
  assert.equal(ptRes.totalAmount, 6900);
});

test('calculateOutstandingBalance calculates balance correctly and avoids negative balances', () => {
  const charges = [
    { id: '1', amount: 800 },
    { id: '2', amount: 300 }
  ];
  const partialPayments = [
    { id: 'p1', amount: 500 }
  ];
  const result = calculateOutstandingBalance(charges, partialPayments);
  assert.equal(result.totalCharged, 1100);
  assert.equal(result.totalPaid, 500);
  assert.equal(result.balance, 600);

  // Fully paid
  const fullResult = calculateOutstandingBalance(charges, [{ id: 'p1', amount: 1100 }]);
  assert.equal(fullResult.balance, 0);
});

test('formatCurrencyINR formats Indian rupees properly', () => {
  assert.equal(formatCurrencyINR(800), '₹800');
  assert.equal(formatCurrencyINR(2100), '₹2,100');
  assert.equal(formatCurrencyINR(6500), '₹6,500');
});

test('normalizeIndianPhoneNumber and formatWhatsAppReminderUrl create proper link', () => {
  const normalized = normalizeIndianPhoneNumber('+91 7872103454');
  assert.equal(normalized, '917872103454');

  const normalizedLocal = normalizeIndianPhoneNumber('9832011223');
  assert.equal(normalizedLocal, '919832011223');

  const url = formatWhatsAppReminderUrl(
    { full_name: 'Rahul Das', phone: '+91 9832011223' },
    600,
    '+91 7872103454',
    'The Wellness Warriors Gym'
  );
  assert.ok(url.startsWith('https://wa.me/919832011223?text='));
  assert.ok(url.includes('Rahul%20Das'));
  assert.ok(url.includes('7872103454'));
  assert.ok(url.includes('The%20Wellness%20Warriors%20Gym'));
});

test('checkDailyAttendanceEligibility validates duplicate check-ins and expired overrides', () => {
  // Active member first check-in today: allowed
  const normal = checkDailyAttendanceEligibility({
    isExpired: false,
    hasAlreadyCheckedInToday: false,
    memberStatus: 'active'
  });
  assert.equal(normal.allowed, true);
  assert.equal(normal.requiresOverrideReason, false);

  // Duplicate check-in today: rejected
  const dup = checkDailyAttendanceEligibility({
    isExpired: false,
    hasAlreadyCheckedInToday: true,
    memberStatus: 'active'
  });
  assert.equal(dup.allowed, false);
  assert.ok(dup.warning?.includes('already recorded'));

  // Expired member: requires override reason
  const exp = checkDailyAttendanceEligibility({
    isExpired: true,
    hasAlreadyCheckedInToday: false,
    memberStatus: 'expired'
  });
  assert.equal(exp.allowed, true);
  assert.equal(exp.requiresOverrideReason, true);
  assert.ok(exp.warning?.includes('override required'));
});

test('categorizeMemberStatus separates expired, expiring soon, and overdue', () => {
  // Expired 3 days ago with balance
  const expStatus = categorizeMemberStatus({
    expiryDate: '2026-10-16',
    todayDate: '2026-10-19',
    balance: 500,
    reminderDays: 7
  });
  assert.equal(expStatus.isExpired, true);
  assert.equal(expStatus.isExpiringSoon, false);
  assert.equal(expStatus.isOverdue, true);

  // Expiring in 4 days (within 7 days reminder window) with 0 balance
  const soonStatus = categorizeMemberStatus({
    expiryDate: '2026-10-23',
    todayDate: '2026-10-19',
    balance: 0,
    reminderDays: 7
  });
  assert.equal(soonStatus.isExpired, false);
  assert.equal(soonStatus.isExpiringSoon, true);
  assert.equal(soonStatus.isOverdue, false);
});
