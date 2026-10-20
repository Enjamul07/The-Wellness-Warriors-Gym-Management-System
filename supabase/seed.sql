-- =====================================================================
-- The Wellness Warriors Gym - Seed Data
-- 12 Fictional Sample Members, Plans, Charges, Payments, Attendance
-- Location: Jalpaiguri, West Bengal (+91 7872103454)
-- =====================================================================

-- Default Gym Settings
INSERT INTO public.gym_settings (
    id, gym_name, location, phone, whatsapp_number,
    currency_symbol, currency_code, timezone, operating_hours,
    pt_monthly_price, default_admission_fee, expiry_reminder_days,
    receipt_prefix, receipt_footer_note
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'The Wellness Warriors Gym',
    'Club Road, Near Kadamtala, Jalpaiguri, West Bengal 735101, India',
    '+91 7872103454',
    '+917872103454',
    '₹',
    'INR',
    'Asia/Kolkata',
    'Mon - Sat: 06:00 AM - 10:00 PM | Sun: 07:00 AM - 12:00 PM',
    1500.00,
    300.00,
    7,
    'WWG-',
    'Stay Strong, Stay Healthy! Fees once paid are non-refundable.'
) ON CONFLICT (id) DO NOTHING;

-- Membership Plans
INSERT INTO public.membership_plans (id, code, name, duration_months, membership_price, admission_fee, is_active, description) VALUES
('b0000000-0000-0000-0000-000000000001', 'PLAN-M1', 'Monthly Plan', 1, 800.00, 300.00, true, 'Standard 1-month fitness access with cardio and strength equipment'),
('b0000000-0000-0000-0000-000000000002', 'PLAN-Q3', 'Quarterly Plan', 3, 2100.00, 300.00, true, '3 months access with fitness assessment and diet consultation'),
('b0000000-0000-0000-0000-000000000003', 'PLAN-H6', 'Half-Yearly Plan', 6, 3800.00, 300.00, true, '6 months unlimited access, free locker, body composition tracking'),
('b0000000-0000-0000-0000-000000000004', 'PLAN-Y12', 'Yearly Plan', 12, 6500.00, 0.00, true, 'Best value! 12 months full access with admission fee 100% waived')
ON CONFLICT (code) DO NOTHING;

-- Fictional Members
INSERT INTO public.members (id, member_code, full_name, phone, email, photo_url, gender, join_date, status, notes) VALUES
('c0000000-0000-0000-0000-000000000001', 'WWG-1001', 'Rahul Das', '+91 9832011223', 'rahul.das@example.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=faces', 'Male', CURRENT_DATE - INTERVAL '25 days', 'active', 'Regular morning workout enthusiast.'),
('c0000000-0000-0000-0000-000000000002', 'WWG-1002', 'Priya Sharma', '+91 9434055667', 'priya.sharma@example.com', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&fit=crop&crop=faces', 'Female', CURRENT_DATE - INTERVAL '40 days', 'active', 'Enrolled in 1-on-1 Personal Training.'),
('c0000000-0000-0000-0000-000000000003', 'WWG-1003', 'Amit Roy', '+91 8900123456', 'amit.roy@example.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop&crop=faces', 'Male', CURRENT_DATE - INTERVAL '15 days', 'active', 'Partial payment made on Half-Yearly plan; ₹800 balance pending.'),
('c0000000-0000-0000-0000-000000000004', 'WWG-1004', 'Sneha Banerjee', '+91 9733099887', 'sneha.banerjee@example.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop&crop=faces', 'Female', CURRENT_DATE - INTERVAL '90 days', 'active', 'Annual member. Very punctual.'),
('c0000000-0000-0000-0000-000000000005', 'WWG-1005', 'Sourav Ganguly', '+91 9474012345', 'sourav.g@example.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop&crop=faces', 'Male', CURRENT_DATE - INTERVAL '5 days', 'active', 'New joiner. Payment overdue for admission and monthly plan.'),
('c0000000-0000-0000-0000-000000000006', 'WWG-1006', 'Ananya Paul', '+91 9832156789', 'ananya.paul@example.com', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&fit=crop&crop=faces', 'Female', CURRENT_DATE - INTERVAL '60 days', 'active', 'Quarterly plan member.'),
('c0000000-0000-0000-0000-000000000007', 'WWG-1007', 'Subhasish Dey', '+91 9933221100', 'subhasish.dey@example.com', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&fit=crop&crop=faces', 'Male', CURRENT_DATE - INTERVAL '35 days', 'expired', 'Membership expired 5 days ago. Needs follow-up for renewal.'),
('c0000000-0000-0000-0000-000000000008', 'WWG-1008', 'Rituja Sen', '+91 9434198765', 'rituja.sen@example.com', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&fit=crop&crop=faces', 'Female', CURRENT_DATE - INTERVAL '8 days', 'active', 'Joined this month. Fully paid.'),
('c0000000-0000-0000-0000-000000000009', 'WWG-1009', 'Bikram Ghosh', '+91 9800765432', 'bikram.ghosh@example.com', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&fit=crop&crop=faces', 'Male', CURRENT_DATE - INTERVAL '110 days', 'expired', 'Expired 20 days ago with ₹500 outstanding dues.'),
('c0000000-0000-0000-0000-000000000010', 'WWG-1010', 'Tanmoy Mukherjee', '+91 9734123456', 'tanmoy.m@example.com', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&fit=crop&crop=faces', 'Male', CURRENT_DATE - INTERVAL '75 days', 'active', 'Yearly plan + 3 months Personal Training.'),
('c0000000-0000-0000-0000-000000000011', 'WWG-1011', 'Payel Dutta', '+91 9434887766', 'payel.dutta@example.com', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&fit=crop&crop=faces', 'Female', CURRENT_DATE - INTERVAL '12 days', 'active', 'New half-yearly member, morning batch.'),
('c0000000-0000-0000-0000-000000000012', 'WWG-1012', 'Debashis Chakraborty', '+91 9832889900', 'debashis.c@example.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&fit=crop&crop=faces', 'Male', CURRENT_DATE - INTERVAL '180 days', 'archived', 'Archived member due to relocation. Historical records intact.')
ON CONFLICT (member_code) DO NOTHING;
