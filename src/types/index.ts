export type MembershipStatus = 'active' | 'expired' | 'archived';
export type PaymentMethod = 'Cash' | 'UPI';
export type FeeCategory = 'membership' | 'admission' | 'personal_training' | 'combined' | 'other';
export type ChargeType = 'membership' | 'admission' | 'personal_training' | 'other';
export type ChargeStatus = 'unpaid' | 'partially_paid' | 'paid';
export type AttendanceStatus = 'present' | 'overridden';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'staff' | 'super_admin';
  created_at: string;
  updated_at: string;
}

export interface GymSettings {
  id: string;
  gym_name: string;
  location: string;
  phone: string;
  whatsapp_number: string;
  currency_symbol: string;
  currency_code: string;
  timezone: string;
  operating_hours: string;
  pt_monthly_price: number;
  default_admission_fee: number;
  expiry_reminder_days: number;
  receipt_prefix: string;
  receipt_footer_note: string;
  logo_url?: string;
}

export interface MembershipPlan {
  id: string;
  code: string;
  name: string;
  duration_months: number;
  membership_price: number;
  admission_fee: number;
  is_active: boolean;
  description?: string;
  created_at?: string;
}

export interface Member {
  id: string;
  member_code: string;
  full_name: string;
  phone: string;
  email?: string;
  photo_url?: string;
  gender?: 'Male' | 'Female' | 'Other';
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_group?: string;
  join_date: string;
  status: MembershipStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed or joined properties
  current_plan_name?: string;
  current_expiry_date?: string;
  total_charged?: number;
  total_paid?: number;
  outstanding_balance?: number;
}

export interface Membership {
  id: string;
  member_id: string;
  plan_id: string;
  plan_name: string;
  start_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'renewed' | 'cancelled';
  has_personal_training: boolean;
  pt_months: number;
  pt_monthly_fee: number;
  base_price: number;
  admission_fee: number;
  total_amount: number;
  notes?: string;
  created_at: string;
}

export interface FeeCharge {
  id: string;
  member_id: string;
  membership_id?: string;
  charge_type: ChargeType;
  amount: number;
  due_date: string;
  status: ChargeStatus;
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  receipt_number: string;
  member_id: string;
  membership_id?: string;
  charge_id?: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  fee_category: FeeCategory;
  transaction_ref?: string;
  notes?: string;
  recorded_by: string;
  created_at: string;
  // joined for receipts
  member_name?: string;
  member_code?: string;
  member_phone?: string;
  remaining_balance?: number;
}

export interface Attendance {
  id: string;
  member_id: string;
  check_in_date: string;
  check_in_time: string;
  status: AttendanceStatus;
  override_reason?: string;
  recorded_by: string;
  created_at: string;
  // joined
  member_name?: string;
  member_code?: string;
  member_photo?: string;
  plan_name?: string;
}

export interface NotificationItem {
  id: string;
  type: 'expiry' | 'overdue' | 'new_member' | 'payment' | 'attendance';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  member_id?: string;
}
