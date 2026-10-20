import { 
  Member, 
  MembershipPlan, 
  Membership, 
  FeeCharge, 
  Payment, 
  Attendance, 
  GymSettings 
} from '../types';
import { 
  INITIAL_SETTINGS, 
  INITIAL_PLANS, 
  INITIAL_MEMBERS, 
  INITIAL_MEMBERSHIPS, 
  INITIAL_CHARGES, 
  INITIAL_PAYMENTS, 
  INITIAL_ATTENDANCE 
} from '../lib/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { calculateOutstandingBalance } from '../lib/calculations';

// Local storage keys for offline/demo persistent store
const STORAGE_KEYS = {
  SETTINGS: 'wwg_data_settings',
  PLANS: 'wwg_data_plans',
  MEMBERS: 'wwg_data_members',
  MEMBERSHIPS: 'wwg_data_memberships',
  CHARGES: 'wwg_data_charges',
  PAYMENTS: 'wwg_data_payments',
  ATTENDANCE: 'wwg_data_attendance'
};

function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to local repository', err);
  }
}

// Initialize seed data if empty
export function initRepository(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
    setLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    setLocal(STORAGE_KEYS.PLANS, INITIAL_PLANS);
    setLocal(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    setLocal(STORAGE_KEYS.MEMBERSHIPS, INITIAL_MEMBERSHIPS);
    setLocal(STORAGE_KEYS.CHARGES, INITIAL_CHARGES);
    setLocal(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    setLocal(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }
}

// Reset sample data safely in dev mode
export function resetDemoData(): void {
  if (typeof window === 'undefined') return;
  setLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  setLocal(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  setLocal(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  setLocal(STORAGE_KEYS.MEMBERSHIPS, INITIAL_MEMBERSHIPS);
  setLocal(STORAGE_KEYS.CHARGES, INITIAL_CHARGES);
  setLocal(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  setLocal(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
}

// ==========================================
// DB SERVICE METHODS
// ==========================================

export const dbService = {
  // --- Settings ---
  async getSettings(): Promise<GymSettings> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('gym_settings').select('*').limit(1).single();
      if (!error && data) return data;
    }
    initRepository();
    return getLocal<GymSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  async updateSettings(settings: Partial<GymSettings>): Promise<GymSettings> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('gym_settings').upsert(settings).select().single();
      if (!error && data) return data;
    }
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    setLocal(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  // --- Plans ---
  async getPlans(): Promise<MembershipPlan[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('membership_plans').select('*').order('duration_months');
      if (!error && data && data.length > 0) return data;
    }
    initRepository();
    return getLocal<MembershipPlan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  },

  async savePlan(plan: Partial<MembershipPlan>): Promise<MembershipPlan> {
    if (isSupabaseConfigured() && supabase) {
      if (plan.id && !plan.id.startsWith('plan-')) {
        const { data } = await supabase.from('membership_plans').update(plan).eq('id', plan.id).select().single();
        if (data) return data;
      } else {
        const { data } = await supabase.from('membership_plans').insert(plan).select().single();
        if (data) return data;
      }
    }
    const plans = await this.getPlans();
    if (plan.id) {
      const idx = plans.findIndex(p => p.id === plan.id);
      if (idx !== -1) {
        plans[idx] = { ...plans[idx], ...plan } as MembershipPlan;
        setLocal(STORAGE_KEYS.PLANS, plans);
        return plans[idx];
      }
    }
    const newPlan: MembershipPlan = {
      id: `plan-${Date.now()}`,
      code: plan.code || `PLAN-${Date.now().toString().slice(-4)}`,
      name: plan.name || 'New Plan',
      duration_months: Number(plan.duration_months) || 1,
      membership_price: Number(plan.membership_price) || 800,
      admission_fee: Number(plan.admission_fee) || 0,
      is_active: plan.is_active ?? true,
      description: plan.description || ''
    };
    plans.push(newPlan);
    setLocal(STORAGE_KEYS.PLANS, plans);
    return newPlan;
  },

  // --- Members ---
  async getMembers(): Promise<Member[]> {
    let members: Member[] = [];
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        members = data;
      }
    }
    if (members.length === 0) {
      initRepository();
      members = getLocal<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
    }

    // Attach latest financial calculations (charges vs payments) and current membership
    const charges = await this.getCharges();
    const payments = await this.getPayments();
    const memberships = await this.getMemberships();

    return members.map(m => {
      const memberCharges = charges.filter(c => c.member_id === m.id);
      const memberPayments = payments.filter(p => p.member_id === m.id);
      const { totalCharged, totalPaid, balance } = calculateOutstandingBalance(memberCharges, memberPayments);

      const memberMships = memberships
        .filter(ms => ms.member_id === m.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestMship = memberMships[0];

      return {
        ...m,
        total_charged: totalCharged,
        total_paid: totalPaid,
        outstanding_balance: balance,
        current_plan_name: latestMship ? latestMship.plan_name : m.current_plan_name || 'None',
        current_expiry_date: latestMship ? latestMship.expiry_date : m.current_expiry_date || m.join_date
      };
    });
  },

  async getMemberById(id: string): Promise<Member | null> {
    const members = await this.getMembers();
    return members.find(m => m.id === id) || null;
  },

  async createMember(memberData: {
    full_name: string;
    phone: string;
    email?: string;
    gender?: 'Male' | 'Female' | 'Other';
    photo_url?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    blood_group?: string;
    join_date: string;
    plan_id: string;
    has_personal_training: boolean;
    pt_months?: number;
    initial_payment_amount?: number;
    payment_method?: 'Cash' | 'UPI';
    notes?: string;
    custom_expiry_date?: string;
  }): Promise<{ member: Member; membership: Membership; payment?: Payment }> {
    const plans = await this.getPlans();
    const plan = plans.find(p => p.id === memberData.plan_id) || plans[0];

    const memberCount = (await this.getMembers()).length + 1001;
    const memberCode = `WWG-${memberCount}`;
    const newMemberId = `mem-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newMember: Member = {
      id: newMemberId,
      member_code: memberCode,
      full_name: memberData.full_name,
      phone: memberData.phone,
      email: memberData.email || '',
      gender: memberData.gender || 'Male',
      photo_url: memberData.photo_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=faces`,
      address: memberData.address || 'Jalpaiguri, West Bengal',
      emergency_contact_name: memberData.emergency_contact_name || '',
      emergency_contact_phone: memberData.emergency_contact_phone || '',
      blood_group: memberData.blood_group || '',
      join_date: memberData.join_date,
      status: 'active',
      notes: memberData.notes || '',
      created_at: nowIso,
      updated_at: nowIso,
      current_plan_name: plan.name,
      current_expiry_date: memberData.custom_expiry_date || memberData.join_date
    };

    // Calculate dates and amounts
    const ptMonths = memberData.has_personal_training ? (memberData.pt_months || plan.duration_months) : 0;
    const ptMonthlyFee = 1500;
    const ptTotal = ptMonths * ptMonthlyFee;
    const admissionFee = plan.duration_months === 12 ? 0 : plan.admission_fee;
    const totalAmount = plan.membership_price + admissionFee + ptTotal;

    const newMembershipId = `mship-${Date.now()}`;
    const newMembership: Membership = {
      id: newMembershipId,
      member_id: newMemberId,
      plan_id: plan.id,
      plan_name: plan.name,
      start_date: memberData.join_date,
      expiry_date: memberData.custom_expiry_date || memberData.join_date,
      status: 'active',
      has_personal_training: memberData.has_personal_training,
      pt_months: ptMonths,
      pt_monthly_fee: ptMonthlyFee,
      base_price: plan.membership_price,
      admission_fee: admissionFee,
      total_amount: totalAmount,
      created_at: nowIso
    };

    // Create fee charges
    const charges: FeeCharge[] = [
      {
        id: `ch-${Date.now()}-1`,
        member_id: newMemberId,
        membership_id: newMembershipId,
        charge_type: 'membership',
        amount: plan.membership_price,
        due_date: memberData.join_date,
        status: 'unpaid',
        created_at: nowIso
      }
    ];

    if (admissionFee > 0) {
      charges.push({
        id: `ch-${Date.now()}-2`,
        member_id: newMemberId,
        membership_id: newMembershipId,
        charge_type: 'admission',
        amount: admissionFee,
        due_date: memberData.join_date,
        status: 'unpaid',
        created_at: nowIso
      });
    }

    if (ptTotal > 0) {
      charges.push({
        id: `ch-${Date.now()}-3`,
        member_id: newMemberId,
        membership_id: newMembershipId,
        charge_type: 'personal_training',
        amount: ptTotal,
        due_date: memberData.join_date,
        status: 'unpaid',
        created_at: nowIso
      });
    }

    // Save charges
    const allCharges = await this.getCharges();
    allCharges.push(...charges);
    setLocal(STORAGE_KEYS.CHARGES, allCharges);

    // Save member & membership
    const allMembers = await this.getMembers();
    allMembers.unshift(newMember);
    setLocal(STORAGE_KEYS.MEMBERS, allMembers);

    const allMships = await this.getMemberships();
    allMships.unshift(newMembership);
    setLocal(STORAGE_KEYS.MEMBERSHIPS, allMships);

    // Record initial payment if provided
    let payment: Payment | undefined;
    const initialPaid = Number(memberData.initial_payment_amount) || 0;
    if (initialPaid > 0) {
      payment = await this.recordPayment({
        member_id: newMemberId,
        membership_id: newMembershipId,
        amount: initialPaid,
        payment_date: memberData.join_date,
        payment_method: memberData.payment_method || 'Cash',
        fee_category: 'combined',
        recorded_by: 'Administrator',
        notes: 'Initial registration payment'
      });
    }

    return { member: newMember, membership: newMembership, payment };
  },

  async updateMember(id: string, updates: Partial<Member>): Promise<Member> {
    const allMembers = await this.getMembers();
    const idx = allMembers.findIndex(m => m.id === id);
    if (idx !== -1) {
      allMembers[idx] = { ...allMembers[idx], ...updates, updated_at: new Date().toISOString() };
      setLocal(STORAGE_KEYS.MEMBERS, allMembers);
      return allMembers[idx];
    }
    throw new Error('Member not found');
  },

  async archiveMember(id: string): Promise<void> {
    await this.updateMember(id, { status: 'archived' });
  },

  // --- Memberships & Renewals ---
  async getMemberships(): Promise<Membership[]> {
    initRepository();
    return getLocal<Membership[]>(STORAGE_KEYS.MEMBERSHIPS, INITIAL_MEMBERSHIPS);
  },

  async renewMembership(params: {
    member_id: string;
    plan_id: string;
    start_date: string;
    expiry_date: string;
    has_personal_training: boolean;
    pt_months?: number;
    payment_amount?: number;
    payment_method?: 'Cash' | 'UPI';
    notes?: string;
  }): Promise<{ membership: Membership; payment?: Payment }> {
    const plans = await this.getPlans();
    const plan = plans.find(p => p.id === params.plan_id) || plans[0];
    const nowIso = new Date().toISOString();

    const ptMonths = params.has_personal_training ? (params.pt_months || plan.duration_months) : 0;
    const ptMonthlyFee = 1500;
    const ptTotal = ptMonths * ptMonthlyFee;
    const admissionFee = 0; // Renewals do not recharge admission fee
    const totalAmount = plan.membership_price + ptTotal;

    const newMembershipId = `mship-${Date.now()}`;
    const newMembership: Membership = {
      id: newMembershipId,
      member_id: params.member_id,
      plan_id: plan.id,
      plan_name: plan.name,
      start_date: params.start_date,
      expiry_date: params.expiry_date,
      status: 'active',
      has_personal_training: params.has_personal_training,
      pt_months: ptMonths,
      pt_monthly_fee: ptMonthlyFee,
      base_price: plan.membership_price,
      admission_fee: 0,
      total_amount: totalAmount,
      notes: params.notes || 'Renewed membership',
      created_at: nowIso
    };

    // Add charges
    const charges: FeeCharge[] = [
      {
        id: `ch-${Date.now()}-1`,
        member_id: params.member_id,
        membership_id: newMembershipId,
        charge_type: 'membership',
        amount: plan.membership_price,
        due_date: params.start_date,
        status: 'unpaid',
        created_at: nowIso
      }
    ];

    if (ptTotal > 0) {
      charges.push({
        id: `ch-${Date.now()}-2`,
        member_id: params.member_id,
        membership_id: newMembershipId,
        charge_type: 'personal_training',
        amount: ptTotal,
        due_date: params.start_date,
        status: 'unpaid',
        created_at: nowIso
      });
    }

    const allCharges = await this.getCharges();
    allCharges.push(...charges);
    setLocal(STORAGE_KEYS.CHARGES, allCharges);

    const allMships = await this.getMemberships();
    allMships.unshift(newMembership);
    setLocal(STORAGE_KEYS.MEMBERSHIPS, allMships);

    // Update member's status and current plan
    await this.updateMember(params.member_id, {
      status: 'active',
      current_plan_name: plan.name,
      current_expiry_date: params.expiry_date
    });

    let payment: Payment | undefined;
    const paymentAmount = Number(params.payment_amount) || 0;
    if (paymentAmount > 0) {
      payment = await this.recordPayment({
        member_id: params.member_id,
        membership_id: newMembershipId,
        amount: paymentAmount,
        payment_date: params.start_date,
        payment_method: params.payment_method || 'Cash',
        fee_category: 'membership',
        recorded_by: 'Administrator',
        notes: `Renewal payment for ${plan.name}`
      });
    }

    return { membership: newMembership, payment };
  },

  // --- Charges & Payments ---
  async getCharges(): Promise<FeeCharge[]> {
    initRepository();
    return getLocal<FeeCharge[]>(STORAGE_KEYS.CHARGES, INITIAL_CHARGES);
  },

  async getPayments(): Promise<Payment[]> {
    initRepository();
    return getLocal<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  },

  async recordPayment(paymentData: {
    member_id: string;
    membership_id?: string;
    amount: number;
    payment_date: string;
    payment_method: 'Cash' | 'UPI';
    fee_category: 'membership' | 'admission' | 'personal_training' | 'combined' | 'other';
    transaction_ref?: string;
    notes?: string;
    recorded_by: string;
  }): Promise<Payment> {
    const payments = await this.getPayments();
    const count = payments.length + 1;
    const yearMonth = paymentData.payment_date.slice(0, 7).replace('-', '');
    const receiptNumber = `WWG-${yearMonth}-${String(count).padStart(3, '0')}`;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      receipt_number: receiptNumber,
      member_id: paymentData.member_id,
      membership_id: paymentData.membership_id,
      amount: Number(paymentData.amount),
      payment_date: paymentData.payment_date,
      payment_method: paymentData.payment_method,
      fee_category: paymentData.fee_category,
      transaction_ref: paymentData.transaction_ref,
      notes: paymentData.notes,
      recorded_by: paymentData.recorded_by || 'Administrator',
      created_at: new Date().toISOString()
    };

    payments.unshift(newPayment);
    setLocal(STORAGE_KEYS.PAYMENTS, payments);

    return newPayment;
  },

  // --- Attendance ---
  async getAttendance(): Promise<Attendance[]> {
    initRepository();
    return getLocal<Attendance[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  },

  async recordAttendance(params: {
    member_id: string;
    check_in_date: string;
    check_in_time: string;
    status: 'present' | 'overridden';
    override_reason?: string;
    recorded_by: string;
  }): Promise<Attendance> {
    const list = await this.getAttendance();

    // Prevent duplicate attendance for the same member on the same day
    const alreadyExists = list.some(
      a => a.member_id === params.member_id && a.check_in_date === params.check_in_date
    );
    if (alreadyExists) {
      throw new Error('Attendance for this member has already been recorded today.');
    }

    const newAttendance: Attendance = {
      id: `att-${Date.now()}`,
      member_id: params.member_id,
      check_in_date: params.check_in_date,
      check_in_time: params.check_in_time,
      status: params.status,
      override_reason: params.override_reason,
      recorded_by: params.recorded_by,
      created_at: new Date().toISOString()
    };

    list.unshift(newAttendance);
    setLocal(STORAGE_KEYS.ATTENDANCE, list);
    return newAttendance;
  }
};
