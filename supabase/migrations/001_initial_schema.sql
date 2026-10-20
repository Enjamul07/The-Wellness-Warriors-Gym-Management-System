-- =====================================================================
-- The Wellness Warriors Gym Management System
-- Supabase PostgreSQL Database Migration
-- Location: Jalpaiguri, West Bengal, India (+91 7872103454)
-- Currency: INR (₹) | Timezone: Asia/Kolkata
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Admins and Staff)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL DEFAULT 'Gym Administrator',
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. GYM SETTINGS
CREATE TABLE IF NOT EXISTS public.gym_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_name TEXT NOT NULL DEFAULT 'The Wellness Warriors Gym',
    location TEXT NOT NULL DEFAULT 'Jalpaiguri, West Bengal, India',
    phone TEXT NOT NULL DEFAULT '+91 7872103454',
    whatsapp_number TEXT NOT NULL DEFAULT '+917872103454',
    currency_symbol TEXT NOT NULL DEFAULT '₹',
    currency_code TEXT NOT NULL DEFAULT 'INR',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    operating_hours TEXT NOT NULL DEFAULT 'Mon - Sat: 06:00 AM - 10:00 PM | Sun: 07:00 AM - 12:00 PM',
    pt_monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
    default_admission_fee NUMERIC(10, 2) NOT NULL DEFAULT 300.00,
    expiry_reminder_days INT NOT NULL DEFAULT 7,
    receipt_prefix TEXT NOT NULL DEFAULT 'WWG-',
    receipt_footer_note TEXT NOT NULL DEFAULT 'Stay Strong, Stay Healthy! Fees once paid are non-refundable.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. MEMBERSHIP PLANS
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    duration_months INT NOT NULL CHECK (duration_months > 0),
    membership_price NUMERIC(10, 2) NOT NULL CHECK (membership_price >= 0),
    admission_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (admission_fee >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. MEMBERS
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_code TEXT UNIQUE NOT NULL, -- e.g. WWG-1001
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    photo_url TEXT,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    blood_group TEXT,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'archived')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexing for fast search
CREATE INDEX IF NOT EXISTS idx_members_search ON public.members (member_code, full_name, phone);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members (status);

-- 5. MEMBERSHIPS (Contracts / Subscriptions)
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.membership_plans(id),
    plan_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'renewed', 'cancelled')),
    has_personal_training BOOLEAN NOT NULL DEFAULT false,
    pt_months INT NOT NULL DEFAULT 0,
    pt_monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    base_price NUMERIC(10, 2) NOT NULL,
    admission_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_memberships_member ON public.memberships (member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_dates ON public.memberships (start_date, expiry_date, status);

-- 6. FEE CHARGES (Financial integrity - debits)
CREATE TABLE IF NOT EXISTS public.fee_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
    charge_type TEXT NOT NULL CHECK (charge_type IN ('membership', 'admission', 'personal_training', 'other')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_fee_charges_member ON public.fee_charges (member_id, status);

-- 7. PAYMENTS (Financial integrity - credits)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number TEXT UNIQUE NOT NULL, -- e.g. REC-202610-001
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
    charge_id UUID REFERENCES public.fee_charges(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI')),
    fee_category TEXT NOT NULL CHECK (fee_category IN ('membership', 'admission', 'personal_training', 'combined', 'other')),
    transaction_ref TEXT,
    notes TEXT,
    recorded_by TEXT NOT NULL DEFAULT 'Administrator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_payments_member ON public.payments (member_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments (payment_date);

-- 8. ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIME NOT NULL DEFAULT CURRENT_TIME,
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'overridden')),
    override_reason TEXT,
    recorded_by TEXT NOT NULL DEFAULT 'Administrator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    -- Prevent duplicate daily attendance for the same member
    CONSTRAINT unique_daily_attendance UNIQUE (member_id, check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance (check_in_date);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON public.attendance (member_id);

-- 9. ENQUIRIES (Internal gym inquiries)
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    interested_plan TEXT,
    source TEXT DEFAULT 'Walk-in',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'converted', 'closed')),
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    performed_by TEXT NOT NULL DEFAULT 'Administrator',
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (staff/admin) full access to operations
CREATE POLICY "Admins full access profiles" ON public.profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins full access settings" ON public.gym_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins full access plans" ON public.membership_plans FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins full access members" ON public.members FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins full access memberships" ON public.memberships FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins full access charges" ON public.fee_charges FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins full access payments" ON public.payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins full access attendance" ON public.attendance FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins full access enquiries" ON public.enquiries FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins full access audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true);
