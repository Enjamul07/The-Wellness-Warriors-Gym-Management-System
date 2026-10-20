import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  IndianRupee, 
  Users, 
  CalendarCheck, 
  CreditCard, 
  Filter,
  Printer
} from 'lucide-react';
import { PaymentMethodSplitChart } from '../../components/charts/DashboardCharts';
import { Member, Payment, Attendance, MembershipPlan } from '../../types';
import { formatCurrencyINR } from '../../lib/calculations';

interface ReportsViewProps {
  members: Member[];
  payments: Payment[];
  attendance: Attendance[];
  plans: MembershipPlan[];
}

const COLORS = ['#E11D2E', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const ReportsView: React.FC<ReportsViewProps> = ({
  members,
  payments,
  attendance,
  plans
}) => {
  const [reportType, setReportType] = useState<'financial' | 'members' | 'attendance'>('financial');
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Financial calculations in date range
  const financialData = useMemo(() => {
    const rangePayments = payments.filter(p => {
      if (startDate && p.payment_date < startDate) return false;
      if (endDate && p.payment_date > endDate) return false;
      return true;
    });

    const totalCollected = rangePayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const cashCollected = rangePayments
      .filter(p => p.payment_method === 'Cash')
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const upiCollected = rangePayments
      .filter(p => p.payment_method === 'UPI')
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const categoryBreakdown: Record<string, number> = {
      membership: 0,
      admission: 0,
      personal_training: 0,
      combined: 0,
      other: 0
    };

    rangePayments.forEach(p => {
      const cat = p.fee_category || 'membership';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + Number(p.amount);
    });

    const totalOutstanding = members.reduce((acc, m) => acc + (m.outstanding_balance || 0), 0);

    return {
      totalCollected,
      cashCollected,
      upiCollected,
      categoryBreakdown,
      totalOutstanding,
      paymentsCount: rangePayments.length,
      rangePayments
    };
  }, [payments, members, startDate, endDate]);

  // Method breakdown chart
  const paymentMethodPie = useMemo(() => {
    return [
      { name: 'UPI Digital', value: financialData.upiCollected },
      { name: 'Cash', value: financialData.cashCollected }
    ].filter(d => d.value > 0);
  }, [financialData]);

  // Member stats
  const memberReportStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const total = members.filter(m => m.status !== 'archived').length;
    const active = members.filter(m => m.status === 'active' && (!m.current_expiry_date || m.current_expiry_date >= today)).length;
    const expired = members.filter(m => m.status === 'expired' || (m.current_expiry_date && m.current_expiry_date < today)).length;
    const archived = members.filter(m => m.status === 'archived').length;

    return { total, active, expired, archived };
  }, [members]);

  // Export CSV
  const handleExportCSV = () => {
    let rows: string[][] = [];
    let filename = `wellness_warriors_report_${reportType}.csv`;

    if (reportType === 'financial') {
      rows.push(['Receipt #', 'Member ID', 'Payment Date', 'Amount (INR)', 'Payment Mode', 'Category', 'Recorded By']);
      financialData.rangePayments.forEach(p => {
        rows.push([
          p.receipt_number,
          p.member_id,
          p.payment_date,
          p.amount.toString(),
          p.payment_method,
          p.fee_category,
          p.recorded_by
        ]);
      });
    } else if (reportType === 'members') {
      rows.push(['Member Code', 'Full Name', 'Phone', 'Plan', 'Join Date', 'Expiry Date', 'Status', 'Outstanding Due (INR)']);
      members.forEach(m => {
        rows.push([
          m.member_code,
          `"${m.full_name}"`,
          m.phone,
          m.current_plan_name || 'Standard',
          m.join_date,
          m.current_expiry_date || '',
          m.status,
          (m.outstanding_balance || 0).toString()
        ]);
      });
    } else {
      rows.push(['Date', 'Time (IST)', 'Member ID', 'Status', 'Override Reason', 'Recorded By']);
      attendance.forEach(a => {
        rows.push([
          a.check_in_date,
          a.check_in_time,
          a.member_id,
          a.status,
          `"${a.override_reason || ''}"`,
          a.recorded_by
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Date Range Controls */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white font-poppins flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#E11D2E]" />
              Business Reports & Analytics
            </h3>
            <p className="text-xs text-[#A3A3A3]">
              The Wellness Warriors Gym • Financial integrity, member demographics, and attendance logs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="no-print flex items-center gap-1.5 px-3 py-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E11D2E] hover:bg-[#c91424] text-white rounded-lg text-xs font-semibold shadow-md shadow-[#E11D2E]/25 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#262626]">
          <div className="flex bg-[#121212] p-1 rounded-lg border border-[#333333]">
            <button
              onClick={() => setReportType('financial')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                reportType === 'financial' ? 'bg-[#E11D2E] text-white' : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Financial Analytics
            </button>
            <button
              onClick={() => setReportType('members')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                reportType === 'members' ? 'bg-[#E11D2E] text-white' : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Member Demographics
            </button>
            <button
              onClick={() => setReportType('attendance')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                reportType === 'attendance' ? 'bg-[#E11D2E] text-white' : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Attendance Trends
            </button>
          </div>

          {/* Date range inputs */}
          <div className="flex items-center gap-2 ml-auto text-xs">
            <span className="text-[#A3A3A3]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#121212] border border-[#333333] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
            />
            <span className="text-[#A3A3A3]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#121212] border border-[#333333] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* REPORT CONTENT: FINANCIAL */}
      {reportType === 'financial' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#181818] border border-[#2b2b2b] p-4 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-[#A3A3A3] block">Total Realized Cash</span>
              <p className="text-2xl font-extrabold text-white mt-1 font-poppins">
                {formatCurrencyINR(financialData.totalCollected)}
              </p>
              <p className="text-[11px] text-emerald-400 mt-1">From {financialData.paymentsCount} transactions</p>
            </div>

            <div className="bg-[#181818] border border-[#2b2b2b] p-4 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-[#A3A3A3] block">UPI Digital Payments</span>
              <p className="text-2xl font-extrabold text-blue-400 mt-1 font-poppins">
                {formatCurrencyINR(financialData.upiCollected)}
              </p>
              <p className="text-[11px] text-[#A3A3A3] mt-1">Instant QR & VPA transfers</p>
            </div>

            <div className="bg-[#181818] border border-[#2b2b2b] p-4 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-[#A3A3A3] block">Cash Payments</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1 font-poppins">
                {formatCurrencyINR(financialData.cashCollected)}
              </p>
              <p className="text-[11px] text-[#A3A3A3] mt-1">Collected at gym front desk</p>
            </div>

            <div className="bg-[#181818] border border-[#2b2b2b] p-4 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-[#A3A3A3] block">Total Outstanding Dues</span>
              <p className="text-2xl font-extrabold text-[#E11D2E] mt-1 font-poppins">
                {formatCurrencyINR(financialData.totalOutstanding)}
              </p>
              <p className="text-[11px] text-[#737373] mt-1">Unpaid member balances</p>
            </div>
          </div>

          {/* Breakdown Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-5">
              <h4 className="text-sm font-bold text-white mb-1 font-poppins">Revenue by Category</h4>
              <p className="text-xs text-[#A3A3A3] mb-4">Membership fees, admission fees, and PT revenues</p>
              <div className="space-y-3 text-xs">
                {Object.entries(financialData.categoryBreakdown).map(([cat, amt]) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-white font-medium">
                      <span className="capitalize">{cat.replace('_', ' ')}</span>
                      <span>{formatCurrencyINR(amt)}</span>
                    </div>
                    <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#E11D2E] h-full rounded-full"
                        style={{
                          width: `${financialData.totalCollected > 0 ? (amt / financialData.totalCollected) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white mb-1 font-poppins">Payment Method Split</h4>
                <p className="text-xs text-[#A3A3A3] mb-4">UPI Digital vs Physical Cash</p>
              </div>
              <PaymentMethodSplitChart cash={financialData.cashCollected} upi={financialData.upiCollected} />
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: MEMBERS */}
      {reportType === 'members' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#181818] border border-[#2b2b2b] p-4 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-[#A3A3A3] block">Total Enrolled</span>
              <p className="text-2xl font-extrabold text-white mt-1 font-poppins">{memberReportStats.total}</p>
            </div>
            <div className="bg-[#181818] border border-[#2b2b2b] p-4 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-[#A3A3A3] block">Active Members</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1 font-poppins">{memberReportStats.active}</p>
            </div>
            <div className="bg-[#181818] border border-[#2b2b2b] p-4 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-[#A3A3A3] block">Expired Memberships</span>
              <p className="text-2xl font-extrabold text-[#E11D2E] mt-1 font-poppins">{memberReportStats.expired}</p>
            </div>
            <div className="bg-[#181818] border border-[#2b2b2b] p-4 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-[#A3A3A3] block">Archived Members</span>
              <p className="text-2xl font-extrabold text-zinc-400 mt-1 font-poppins">{memberReportStats.archived}</p>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: ATTENDANCE */}
      {reportType === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-[#181818] border border-[#2b2b2b] p-5 rounded-xl">
            <h4 className="text-sm font-bold text-white mb-1 font-poppins">Total Check-In Logs Recorded</h4>
            <p className="text-xs text-[#A3A3A3] mb-4">{attendance.length} total sessions tracked across Jalpaiguri members</p>
            <div className="p-4 bg-[#121212] rounded-lg border border-[#262626] text-xs text-[#A3A3A3] flex items-center justify-between">
              <span>All daily attendance is locked to Asia/Kolkata timestamps with duplicate prevention.</span>
              <span className="text-emerald-400 font-bold">{attendance.filter(a => a.status === 'present').length} Normal / {attendance.filter(a => a.status === 'overridden').length} Overridden</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
