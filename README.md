# The Wellness Warriors Gym Management System

Internal operations, athlete records, fee collection, and attendance software built for:
- **Business Name**: The Wellness Warriors Gym
- **Location**: Club Road, Near Kadamtala, Jalpaiguri, West Bengal 735101, India
- **Phone**: +91 7872103454
- **Currency**: Indian Rupee (₹)
- **Timezone**: Asia/Kolkata (IST)

---

## 1. System Overview & Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons
- **State & Data Integrity**: Decoupled financial calculation engine, React context, Recharts analytics
- **Database & Auth**: Supabase PostgreSQL database, Supabase Auth, Row Level Security (RLS)
- **Deployment Target**: Vercel

---

## 2. Seeded Membership Plans & Pricing

| Plan | Duration | Membership Price | Admission Fee | Perks |
|---|---|---|---|---|
| **Monthly Plan** | 1 month | ₹800 | ₹300 | Cardio & strength equipment access |
| **Quarterly Plan** | 3 months | ₹2,100 | ₹300 | Assessment & diet guidelines |
| **Half-Yearly Plan** | 6 months | ₹3,800 | ₹300 | Locker facility & body composition check |
| **Yearly Plan** | 12 months | ₹6,500 | **₹0 (Waived)** | Best value, admission fee 100% waived |

- **Personal Training Add-on**: ₹1,500 per month across all plans.

---

## 3. Demonstration & Testing Credentials

For initial testing in development or demonstration mode:
- **Username**: `admin` or `admin@wellnesswarriors.gym`
- **Password**: `demo123`

The application includes 12 realistic fictional member profiles from Jalpaiguri, West Bengal (active, expired, archived, fully paid, partial payments, and overdue balances).

---

## 4. Supabase Setup & Database Migration

To run against a live Supabase PostgreSQL project:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Run the schema migration from `/supabase/migrations/001_initial_schema.sql`. This creates:
   - `profiles`
   - `gym_settings`
   - `membership_plans`
   - `members`
   - `memberships`
   - `fee_charges`
   - `payments`
   - `attendance`
   - `enquiries`
   - `audit_logs`
   - Complete Row Level Security (RLS) policies.
4. Run the seed script from `/supabase/seed.sql` to populate default settings, plans, and sample members.
5. In Supabase Dashboard -> **Authentication > Users**, click **Add User** and create:
   - Email: `admin@wellnesswarriors.gym`
   - Password: `[YOUR_SECURE_PASSWORD]`
6. Copy your **Project URL** and **Anon public API key** from Project Settings > API.
7. Configure them in your `.env` or in the in-app **Supabase & SQL** settings modal:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-public-key"
   ```

---

## 5. Local Development & Production Build

```bash
# Install dependencies
npm install

# Run unit tests (Node.js test runner)
node --test src/lib/calculations.test.ts

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 6. Vercel Deployment

1. Push repository to GitHub or import directly into Vercel.
2. In Vercel Project Settings > **Environment Variables**, set:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon public key
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
