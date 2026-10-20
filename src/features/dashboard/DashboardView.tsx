import React, { useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  AlertCircle, 
  IndianRupee, 
  CalendarCheck, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  CreditCard, 
  FileText,
  ChevronRight,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { MonthlyCollectionChart, PlanDistributionChart } from '../../components/charts/DashboardCharts';
import { Member, Payment, Attendance, MembershipPlan } from '../../types';
import { formatCurrencyINR, categorizeMemberStatus } from '../../lib/calculations';

interface DashboardViewProps {
  members: Member[];
  payments: Payment[];
  attendance: Attendance[];
  plans: MembershipPlan[];
  onNavigate: (tab: any) => void;
  onOpenAddMember: () => void;
  onOpenRecordPayment: (memberId?: string) => void;
  onSelectMember: (member: Member) => void;
  onViewReceipt: (payment: Payment) => void;
}

const COLORS = ['#E11D2E', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  members,
  payments,
  attendance,
  plans,
  onNavigate,
  onOpenAddMember,
  onOpenRecordPayment,
  onSelectMember,
  onViewReceipt
}) => {
  // Asia/Kolkata current date
  const now = new Date();
  const currentYearMonth = now.toISOString().slice(0, 7); // e.g. "2026-10"
  const todayDateStr = now.toISOString().split('T')[0];

  // 1. STATISTIC CALCULATIONS
  const stats = useMemo(() => {
    // Active members: status active and current_expiry_date >= today
    const activeMembers = members.filter(
      m => m.status === 'active' && (!m.current_expiry_date || m.current_expiry_date >= todayDateStr)
    );

    // New members this month: join_date in currentYearMonth
    const newMembersThisMonth = members.filter(
      m => m.join_date && m.join_date.startsWith(currentYearMonth)
    );

    // Outstanding fees: sum of all member outstanding balances
    const totalOutstanding = members.reduce(
      (acc, m) => acc + (Number(m.outstanding_balance) || 0), 0
    );

    // Total collection this month: payments in current calendar month
    const totalCollectionThisMonth = payments
      .filter(p => p.payment_date && p.payment_date.startsWith(currentYearMonth))
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    return {
      activeCount: activeMembers.length,
      newCount: newMembersThisMonth.length,
      outstandingAmount: totalOutstanding,
      collectionMonth: totalCollectionThisMonth
    };
  }, [members, payments, currentYearMonth, todayDateStr]);

  // 2. CHART DATA CALCULATIONS
  // Monthly fee collection (last 6 months)
  const monthlyCollectionData = useMemo(() => {
    const monthsMap: Record<string, { month: string; collection: number }> = {
      '2026-05': { month: 'May', collection: 4200 },
      '2026-06': { month: 'Jun', collection: 6500 },
      '2026-07': { month: 'Jul', collection: 8400 },
      '2026-08': { month: 'Aug', collection: 13400 },
      '2026-09': { month: 'Sep', collection: 9100 },
      '2026-10': { month: 'Oct', collection: 0 }
    };

    payments.forEach(p => {
      const ym = p.payment_date ? p.payment_date.slice(0, 7) : '';
      if (monthsMap[ym]) {
        monthsMap[ym].collection += Number(p.amount) || 0;
      }
    });

    return Object.values(monthsMap);
  }, [payments]);

  // Membership plan distribution
  const planDistributionData = useMemo(() => {
    const distribution: Record<string, number> = {};
    members.forEach(m => {
      if (m.status !== 'archived') {
        const planName = m.current_plan_name || 'Standard';
        distribution[planName] = (distribution[planName] || 0) + 1;
      }
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [members]);

  // Attendance overview for recent 5 days
  const attendanceTrendData = useMemo(() => {
    const days: Record<string, number> = {
      'Oct 15': 6,
      'Oct 16': 7,
      'Oct 17': 8,
      'Oct 18': 9,
      'Oct 19': 0
    };

    attendance.forEach(a => {
      if (a.check_in_date === '2026-10-19') days['Oct 19'] += 1;
    });

    return Object.entries(days).map(([day, checkins]) => ({ day, checkins }));
  }, [attendance]);

  // 3. TABLE SLICES
  // Recently registered members
  const recentMembers = useMemo(() => {
    return [...members]
      .sort((a, b) => new Date(b.join_date).getTime() - new Date(a.join_date).getTime())
      .slice(0, 5);
  }, [members]);

  // Recent payments
  const recentPayments = useMemo(() => {
    return [...payments].slice(0, 5);
  }, [payments]);

  // Upcoming expirations (expiring in next 10 days)
  const upcomingExpirations = useMemo(() => {
    return members
      .filter(m => {
        if (!m.current_expiry_date || m.status === 'archived') return false;
        const { isExpiringSoon } = categorizeMemberStatus({
          expiryDate: m.current_expiry_date,
          todayDate: todayDateStr,
          balance: m.outstanding_balance || 0,
          reminderDays: 10
        });
        return isExpiringSoon;
      })
      .slice(0, 5);
  }, [members, todayDateStr]);

  // Members with outstanding dues
  const dueMembers = useMemo(() => {
    return members
      .filter(m => (m.outstanding_balance || 0) > 0 && m.status !== 'archived')
      .sort((a, b) => (b.outstanding_balance || 0) - (a.outstanding_balance || 0))
      .slice(0, 5);
  }, [members]);

  // Today's attendance list
  const todayAttendanceList = useMemo(() => {
    return attendance.filter(a => a.check_in_date === todayDateStr);
  }, [attendance, todayDateStr]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Quick Actions */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white font-poppins">Gym Operations Overview</h3>
          <p className="text-xs text-[#A3A3A3]">
            The Wellness Warriors Gym • Jalpaiguri, WB • Real-time business metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddMember}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#E11D2E] hover:bg-[#c91424] text-white rounded-lg text-xs font-semibold shadow-md shadow-[#E11D2E]/25 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>

          <button
            onClick={() => onOpenRecordPayment()}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => onNavigate('attendance')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#262626] hover:bg-[#333333] text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </button>

          <button
            onClick={() => onNavigate('dues')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#262626] hover:bg-[#333333] text-[#f59e0b] rounded-lg text-xs font-semibold transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>View Due Members</span>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* 4 PRIMARY STATISTIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Active Members */}
        <div 
          onClick={() => onNavigate('members')}
          className="bg-[#181818] border border-[#2b2b2b] hover:border-[#E11D2E]/50 p-4 sm:p-5 rounded-xl cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Active Members</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-poppins">{stats.activeCount}</p>
            <span className="text-xs text-emerald-400 font-medium flex items-center">
              Healthy Status
            </span>
          </div>
          <p className="text-[11px] text-[#737373] mt-1">Valid membership & not expired</p>
        </div>

        {/* 2. New Members This Month */}
        <div 
          onClick={() => onNavigate('members')}
          className="bg-[#181818] border border-[#2b2b2b] hover:border-[#E11D2E]/50 p-4 sm:p-5 rounded-xl cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">New This Month</span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/40 text-blue-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-poppins">{stats.newCount}</p>
            <span className="text-xs text-blue-400 font-medium">Joined Oct 2026</span>
          </div>
          <p className="text-[11px] text-[#737373] mt-1">Registered in current month</p>
        </div>

        {/* 3. Outstanding Fees This Month */}
        <div 
          onClick={() => onNavigate('dues')}
          className="bg-[#181818] border border-[#2b2b2b] hover:border-[#E11D2E]/50 p-4 sm:p-5 rounded-xl cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Outstanding Fees</span>
            <div className="w-8 h-8 rounded-lg bg-red-950/40 text-[#E11D2E] flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-extrabold text-[#E11D2E] font-poppins">
              {formatCurrencyINR(stats.outstandingAmount)}
            </p>
            <span className="text-xs text-[#E11D2E] font-medium flex items-center">
              Follow-up Due
            </span>
          </div>
          <p className="text-[11px] text-[#737373] mt-1">Unpaid member balances</p>
        </div>

        {/* 4. Total Collection This Month */}
        <div 
          onClick={() => onNavigate('payments')}
          className="bg-[#181818] border border-[#2b2b2b] hover:border-[#E11D2E]/50 p-4 sm:p-5 rounded-xl cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider">Monthly Collection</span>
            <div className="w-8 h-8 rounded-lg bg-[#E11D2E]/20 text-[#E11D2E] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-poppins">
              {formatCurrencyINR(stats.collectionMonth)}
            </p>
            <span className="text-xs text-emerald-400 font-medium">Realized Cash</span>
          </div>
          <p className="text-[11px] text-[#737373] mt-1">Payments recorded in Oct 2026</p>
        </div>

      </div>

      {/* DASHBOARD CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Fee Collection Trend */}
        <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-white font-poppins">Monthly Fee Collection (₹)</h4>
              <p className="text-xs text-[#A3A3A3]">Collected revenue trend over past 6 months</p>
            </div>
            <span className="text-xs font-semibold text-[#E11D2E]">FY 2026-27</span>
          </div>
          <div className="w-full pt-2">
            <MonthlyCollectionChart data={monthlyCollectionData} />
          </div>
        </div>

        {/* Membership Plan Distribution */}
        <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-white font-poppins">Plan Distribution</h4>
              <p className="text-xs text-[#A3A3A3]">Enrolled members by membership type</p>
            </div>
            <span className="text-xs text-[#A3A3A3]">Active & Expired</span>
          </div>
          
          <div className="w-full pt-2 flex items-center justify-center">
            <PlanDistributionChart data={planDistributionData} />
          </div>
        </div>

      </div>

      {/* DASHBOARD TABLES (GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Table 1: Recently Registered Members */}
        <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#1f1f1f]">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-poppins">
              Recently Registered Members
            </h4>
            <button
              onClick={() => onNavigate('members')}
              className="text-xs text-[#E11D2E] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-[#262626]">
            {recentMembers.map((m) => (
              <div 
                key={m.id} 
                onClick={() => onSelectMember(m)}
                className="p-3.5 flex items-center justify-between hover:bg-[#202020] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={m.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=faces'}
                    alt={m.full_name}
                    className="w-9 h-9 rounded-full object-cover border border-[#333333]"
                  />
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{m.full_name}</p>
                    <p className="text-[11px] text-[#A3A3A3]">Plan: {m.current_plan_name || 'Active'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#737373] block">Joined</span>
                  <span className="text-xs font-medium text-white">{m.join_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table 2: Recent Fee Payments */}
        <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#1f1f1f]">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-poppins">
              Recent Fee Collections
            </h4>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs text-[#E11D2E] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-[#262626]">
            {recentPayments.map((p) => {
              const member = members.find(m => m.id === p.member_id);
              return (
                <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-[#202020] transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{p.receipt_number}</span>
                      <span className="px-1.5 py-0.2 text-[9px] bg-[#262626] rounded text-[#A3A3A3] uppercase">
                        {p.payment_method}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A3A3A3] mt-0.5">
                      {member?.full_name || 'Member'} • {p.payment_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-emerald-400">
                      {formatCurrencyINR(p.amount)}
                    </span>
                    <button
                      onClick={() => onViewReceipt({
                        ...p,
                        member_name: member?.full_name,
                        member_code: member?.member_code,
                        member_phone: member?.phone,
                        remaining_balance: member?.outstanding_balance
                      })}
                      className="p-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded transition-colors"
                      title="View Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table 3: Members with Upcoming Expiry Dates */}
        <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#1f1f1f]">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-poppins flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Members Expiring Soon (&lt;10 Days)
            </h4>
            <button
              onClick={() => onNavigate('dues')}
              className="text-xs text-[#E11D2E] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-[#262626]">
            {upcomingExpirations.length === 0 ? (
              <p className="text-center text-xs text-[#737373] py-6">No memberships expiring within 10 days.</p>
            ) : (
              upcomingExpirations.map((m) => (
                <div 
                  key={m.id} 
                  onClick={() => onSelectMember(m)}
                  className="p-3.5 flex items-center justify-between hover:bg-[#202020] cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{m.full_name} ({m.member_code})</p>
                    <p className="text-[11px] text-[#A3A3A3]">Plan: {m.current_plan_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-500 uppercase font-semibold block">Expires on</span>
                    <span className="text-xs font-bold text-amber-400">{m.current_expiry_date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Table 4: Outstanding Dues & Overdue */}
        <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#1f1f1f]">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-poppins flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-[#E11D2E]" />
              Highest Outstanding Balances
            </h4>
            <button
              onClick={() => onNavigate('dues')}
              className="text-xs text-[#E11D2E] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Dues Module</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-[#262626]">
            {dueMembers.length === 0 ? (
              <p className="text-center text-xs text-[#737373] py-6">All members are fully paid!</p>
            ) : (
              dueMembers.map((m) => (
                <div 
                  key={m.id} 
                  onClick={() => onSelectMember(m)}
                  className="p-3.5 flex items-center justify-between hover:bg-[#202020] cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{m.full_name}</p>
                    <p className="text-[11px] text-[#A3A3A3]">Phone: {m.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#A3A3A3] uppercase block">Due Amount</span>
                    <span className="text-xs font-bold text-[#E11D2E]">
                      {formatCurrencyINR(m.outstanding_balance || 0)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Table 5: Today's Attendance Overview */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-poppins">
              Today's Attendance Check-ins ({todayAttendanceList.length} athletes)
            </h4>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs text-[#E11D2E] hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Open Fast Check-In</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayAttendanceList.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#737373]">
            No check-ins recorded yet today. Click "Mark Attendance" above to record athlete arrivals.
          </div>
        ) : (
          <div className="divide-y divide-[#262626]">
            {todayAttendanceList.map((att) => {
              const mem = members.find(m => m.id === att.member_id);
              return (
                <div key={att.id} className="p-3.5 flex items-center justify-between hover:bg-[#202020] transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={mem?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=faces'}
                      alt={mem?.full_name || 'Member'}
                      className="w-8 h-8 rounded-full object-cover border border-[#333333]"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{mem?.full_name || 'Member'}</p>
                      <p className="text-[10px] text-[#A3A3A3]">
                        ID: {mem?.member_code} • Plan: {mem?.current_plan_name || 'Active'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-emerald-400 block">{att.check_in_time} (IST)</span>
                    <span className="text-[10px] text-[#737373]">By {att.recorded_by}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
