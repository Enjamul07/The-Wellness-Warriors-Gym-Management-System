/**
 * Pure calculation and business logic for The Wellness Warriors Gym
 * Location: Jalpaiguri, West Bengal, India
 * Timezone: Asia/Kolkata | Currency: INR (₹)
 */

export interface FeeCharge {
  id: string;
  amount: number;
  status?: string;
  charge_type?: string;
}

export interface Payment {
  id: string;
  amount: number;
  payment_method?: 'Cash' | 'UPI';
  fee_category?: string;
}

export interface PlanPricing {
  membership_price: number;
  admission_fee: number;
  duration_months: number;
  code?: string;
}

/**
 * Calculates membership expiration date given start date (YYYY-MM-DD) and duration in months.
 * Uses standard calendar month addition.
 */
export function calculateMembershipExpiry(startDateStr: string, durationMonths: number): string {
  if (!startDateStr || durationMonths <= 0) {
    return startDateStr;
  }
  const [year, month, day] = startDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  
  // Add months
  const targetMonth = date.getUTCMonth() + durationMonths;
  date.setUTCMonth(targetMonth);

  // Handle month boundary clamping (e.g., Jan 31 + 1 month -> Feb 28/29)
  const expectedMonth = (month - 1 + durationMonths) % 12;
  while (date.getUTCMonth() !== expectedMonth && date.getUTCMonth() > expectedMonth) {
    date.setUTCDate(date.getUTCDate() - 1);
  }

  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates renewal start date:
 * If existing membership is active and expiry date is in the future,
 * the renewal starts the day after current expiry.
 * If already expired, renewal starts on the administrator's chosen start date.
 */
export function calculateRenewalStartDate(
  currentExpiryDate: string | null | undefined,
  todayStr: string,
  chosenStartDate?: string
): string {
  if (!currentExpiryDate) {
    return chosenStartDate || todayStr;
  }

  // If current expiry is >= today, renewal continues consecutively after current expiry
  if (currentExpiryDate >= todayStr) {
    const [y, m, d] = currentExpiryDate.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + 1);
    const ny = date.getUTCFullYear();
    const nm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const nd = String(date.getUTCDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  }

  // Already expired, start on chosen start date or today
  return chosenStartDate || todayStr;
}

/**
 * Calculates total initial payable amounts.
 * Yearly plan waives admission fee by default.
 */
export function calculateInitialPayable(params: {
  plan: PlanPricing;
  hasPersonalTraining: boolean;
  ptMonths?: number;
  ptMonthlyFee?: number;
  customAdmissionFee?: number;
}): {
  basePrice: number;
  admissionFee: number;
  ptFee: number;
  totalAmount: number;
} {
  const basePrice = Math.max(0, Number(params.plan.membership_price) || 0);
  
  // Yearly plan waives admission fee (0), otherwise default or custom
  let admissionFee = 0;
  if (params.customAdmissionFee !== undefined) {
    admissionFee = Math.max(0, Number(params.customAdmissionFee));
  } else if (params.plan.duration_months === 12 || params.plan.code === 'PLAN-Y12') {
    admissionFee = 0;
  } else {
    admissionFee = Math.max(0, Number(params.plan.admission_fee) || 0);
  }

  let ptFee = 0;
  if (params.hasPersonalTraining) {
    const months = params.ptMonths && params.ptMonths > 0 ? params.ptMonths : params.plan.duration_months;
    const monthlyRate = params.ptMonthlyFee !== undefined ? params.ptMonthlyFee : 1500;
    ptFee = months * monthlyRate;
  }

  const totalAmount = basePrice + admissionFee + ptFee;

  return {
    basePrice,
    admissionFee,
    ptFee,
    totalAmount
  };
}

/**
 * Accurately calculates total charges, total paid, and outstanding balance.
 * Returns balance = totalCharged - totalPaid.
 */
export function calculateOutstandingBalance(
  charges: FeeCharge[] = [],
  payments: Payment[] = []
): {
  totalCharged: number;
  totalPaid: number;
  balance: number;
} {
  const totalCharged = charges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const balance = Math.max(0, totalCharged - totalPaid);

  return {
    totalCharged: Math.round(totalCharged * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    balance: Math.round(balance * 100) / 100,
  };
}

/**
 * Formats Indian Currency (INR ₹)
 */
export function formatCurrencyINR(amount: number): string {
  const rounded = Math.round(amount || 0);
  return '₹' + new Intl.NumberFormat('en-IN').format(rounded);
}

/**
 * Normalizes an Indian phone number (10 digits, or with +91)
 */
export function normalizeIndianPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+91')) {
    return cleaned.replace('+', '');
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned;
  }
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Generates WhatsApp reminder link with prefilled respectful message
 */
export function formatWhatsAppReminderUrl(
  member: { full_name: string; phone: string },
  balance: number,
  gymPhone: string = '+91 7872103454',
  gymName: string = 'The Wellness Warriors Gym'
): string {
  const normalizedPhone = normalizeIndianPhoneNumber(member.phone);
  const formattedBalance = formatCurrencyINR(balance);
  const message = `Hello ${member.full_name}, this is a friendly reminder from ${gymName}. Our records show an outstanding balance of ${formattedBalance}. If you have already paid, please disregard this message. For assistance, contact us at ${gymPhone}. Thank you.`;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Validates check-in eligibility
 */
export function checkDailyAttendanceEligibility(params: {
  isExpired: boolean;
  hasAlreadyCheckedInToday: boolean;
  memberStatus: 'active' | 'expired' | 'archived';
}): {
  allowed: boolean;
  warning?: string;
  requiresOverrideReason?: boolean;
} {
  if (params.memberStatus === 'archived') {
    return {
      allowed: false,
      warning: 'Member is archived. Cannot check in.',
      requiresOverrideReason: false
    };
  }

  if (params.hasAlreadyCheckedInToday) {
    return {
      allowed: false,
      warning: 'Attendance already recorded for today.',
      requiresOverrideReason: false
    };
  }

  if (params.isExpired || params.memberStatus === 'expired') {
    return {
      allowed: true,
      warning: 'Membership is expired! Authorized administrator override required with reason.',
      requiresOverrideReason: true
    };
  }

  return {
    allowed: true,
    requiresOverrideReason: false
  };
}

/**
 * Distinguishes membership expired vs payment overdue vs expiring soon.
 */
export function categorizeMemberStatus(params: {
  expiryDate: string;
  todayDate: string;
  balance: number;
  reminderDays?: number;
}): {
  isExpired: boolean;
  isExpiringSoon: boolean;
  isOverdue: boolean;
  daysUntilExpiry: number;
} {
  const reminderDays = params.reminderDays || 7;
  const expiryTime = new Date(params.expiryDate).getTime();
  const todayTime = new Date(params.todayDate).getTime();
  const diffDays = Math.ceil((expiryTime - todayTime) / (1000 * 60 * 60 * 24));

  const isExpired = diffDays < 0;
  const isExpiringSoon = diffDays >= 0 && diffDays <= reminderDays;
  const isOverdue = params.balance > 0;

  return {
    isExpired,
    isExpiringSoon,
    isOverdue,
    daysUntilExpiry: diffDays
  };
}
