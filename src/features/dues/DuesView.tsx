import React, { useState, useMemo } from 'react';
import { 
  AlertCircle, 
  MessageSquare, 
  Search, 
  CreditCard, 
  Clock, 
  Calendar, 
  ArrowUpDown, 
  ExternalLink,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { Member, Payment } from '../../types';
import { formatCurrencyINR, formatWhatsAppReminderUrl, categorizeMemberStatus } from '../../lib/calculations';

interface DuesViewProps {
  members: Member[];
  payments: Payment[];
  onRecordPayment: (memberId: string) => void;
  onSelectMember: (member: Member) => void;
  gymPhone?: string;
  gymName?: string;
}

export const DuesView: React.FC<DuesViewProps> = ({
  members,
  payments,
  onRecordPayment,
  onSelectMember,
  gymPhone = '+91 7872103454',
  gymName = 'The Wellness Warriors Gym'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all_dues' | 'overdue' | 'expiring_soon' | 'high_balance'>('all_dues');
  const [sortBy, setSortBy] = useState<'balance' | 'due_date' | 'name'>('balance');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [reminderLogged, setReminderLogged] = useState<string | null>(null);

  const todayDateStr = new Date().toISOString().split('T')[0];

  // Process members with outstanding balances or approaching expiry
  const processedMembers = useMemo(() => {
    return members
      .filter(m => m.status !== 'archived')
      .map(m => {
        const balance = m.outstanding_balance || 0;
        const expiryDate = m.current_expiry_date || m.join_date;
        const { isExpired, isExpiringSoon, isOverdue } = categorizeMemberStatus({
          expiryDate,
          todayDate: todayDateStr,
          balance,
          reminderDays: 7
        });

        // Find last payment date
        const memberPayments = payments.filter(p => p.member_id === m.id);
        const lastPayment = memberPayments.length > 0
          ? memberPayments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]
          : null;

        return {
          ...m,
          balance,
          isExpired,
          isExpiringSoon,
          isOverdue,
          lastPaymentDate: lastPayment ? lastPayment.payment_date : 'None'
        };
      })
      .filter(m => {
        // Search filter
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          !q ||
          m.full_name.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.member_code.toLowerCase().includes(q);

        if (!matchesQuery) return false;

        if (filterType === 'all_dues') {
          return m.balance > 0;
        }
        if (filterType === 'overdue') {
          return m.balance > 0 && m.isExpired;
        }
        if (filterType === 'expiring_soon') {
          return m.isExpiringSoon;
        }
        if (filterType === 'high_balance') {
          return m.balance >= 1000;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'balance') {
          return sortOrder === 'desc' ? b.balance - a.balance : a.balance - b.balance;
        }
        if (sortBy === 'due_date') {
          const dateA = a.current_expiry_date || '';
          const dateB = b.current_expiry_date || '';
          return sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
        }
        return sortOrder === 'desc' ? b.full_name.localeCompare(a.full_name) : a.full_name.localeCompare(b.full_name);
      });
  }, [members, payments, searchQuery, filterType, sortBy, sortOrder, todayDateStr]);

  const totalOutstanding = useMemo(() => {
    return members.reduce((acc, m) => acc + (m.outstanding_balance || 0), 0);
  }, [members]);

  const handleSendWhatsAppReminder = (member: { full_name: string; phone: string; balance: number }) => {
    const url = formatWhatsAppReminderUrl(member, member.balance, gymPhone, gymName);
    window.open(url, '_blank', 'noopener,noreferrer');
    setReminderLogged(`WhatsApp client opened for ${member.full_name}. Message prepared.`);
    setTimeout(() => setReminderLogged(null), 5000);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white font-poppins flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#E11D2E]" />
              Fee Due & Overdue Management
            </h3>
            <p className="text-xs text-[#A3A3A3]">
              Track outstanding balances, membership expirations, and send WhatsApp payment reminders
            </p>
          </div>
          <div className="bg-[#121212] px-4 py-2 rounded-xl border border-[#333333] text-right">
            <span className="text-[10px] uppercase font-bold text-[#A3A3A3] block">Total Unpaid Balance</span>
            <span className="text-xl font-extrabold text-[#E11D2E] font-poppins">
              {formatCurrencyINR(totalOutstanding)}
            </span>
          </div>
        </div>

        {/* Reminder Feedback banner */}
        {reminderLogged && (
          <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{reminderLogged}</span>
          </div>
        )}

        {/* Search & Filters */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member by name, phone, or ID..."
              className="w-full bg-[#121212] border border-[#333333] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
            >
              <option value="all_dues">All Outstanding Balances ({members.filter(m => (m.outstanding_balance || 0) > 0).length})</option>
              <option value="overdue">Expired + Overdue Fee</option>
              <option value="expiring_soon">Expiring Soon (&lt; 7 Days)</option>
              <option value="high_balance">Outstanding &gt;= ₹1,000</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
            >
              <option value="balance">Sort by Highest Balance</option>
              <option value="due_date">Sort by Expiry / Due Date</option>
              <option value="name">Sort by Member Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Due Table */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1f1f1f] text-[#A3A3A3] uppercase text-[10px] font-bold tracking-wider border-b border-[#2b2b2b]">
              <tr>
                <th className="py-3 px-4">Member Info</th>
                <th className="py-3 px-3">Plan</th>
                <th className="py-3 px-3">Condition / Status</th>
                <th className="py-3 px-3">Total Charged</th>
                <th className="py-3 px-3">Total Paid</th>
                <th className="py-3 px-3 text-right">Outstanding Amount</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3">Last Payment</th>
                <th className="py-3 px-4 text-center">Reminder & Collection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {processedMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#737373]">
                    No members match this condition. All clear!
                  </td>
                </tr>
              ) : (
                processedMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-[#202020] transition-colors">
                    {/* Member */}
                    <td className="py-3 px-4">
                      <div 
                        onClick={() => onSelectMember(m)}
                        className="cursor-pointer group flex items-center gap-2.5"
                      >
                        <img
                          src={m.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=faces'}
                          alt={m.full_name}
                          className="w-8 h-8 rounded-full object-cover border border-[#333333]"
                        />
                        <div>
                          <p className="font-bold text-white group-hover:text-[#E11D2E] transition-colors">
                            {m.full_name}
                          </p>
                          <span className="font-mono text-[10px] text-[#A3A3A3]">
                            {m.member_code} • {m.phone}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="py-3 px-3 text-[#d4d4d4]">
                      {m.current_plan_name || 'Standard'}
                    </td>

                    {/* Separate conditions: Expired vs Expiring Soon vs Payment Overdue */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1 items-start">
                        {m.isExpired && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950/70 text-red-400 border border-red-500/30">
                            Membership Expired
                          </span>
                        )}
                        {m.isExpiringSoon && !m.isExpired && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/70 text-amber-400 border border-amber-500/30">
                            Expiring Soon
                          </span>
                        )}
                        {m.balance > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950/70 text-[#E11D2E] border border-rose-500/30">
                            Payment Overdue
                          </span>
                        )}
                        {m.balance === 0 && !m.isExpired && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950/70 text-emerald-400">
                            Fully Paid
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Charged */}
                    <td className="py-3 px-3 text-[#d4d4d4]">
                      {formatCurrencyINR(m.total_charged || 0)}
                    </td>

                    {/* Total Paid */}
                    <td className="py-3 px-3 text-emerald-400 font-medium">
                      {formatCurrencyINR(m.total_paid || 0)}
                    </td>

                    {/* Outstanding */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-sm text-[#E11D2E]">
                        {formatCurrencyINR(m.balance)}
                      </span>
                    </td>

                    {/* Expiry Date */}
                    <td className="py-3 px-3">
                      <span className={`font-semibold ${m.isExpired ? 'text-[#E11D2E]' : 'text-white'}`}>
                        {m.current_expiry_date || 'N/A'}
                      </span>
                    </td>

                    {/* Last Payment */}
                    <td className="py-3 px-3 text-[#A3A3A3]">
                      {m.lastPaymentDate}
                    </td>

                    {/* Actions: Record Payment & WhatsApp Reminder */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* WhatsApp Reminder Button */}
                        <button
                          onClick={() => handleSendWhatsAppReminder(m)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-xs"
                          title="Open WhatsApp with prefilled payment reminder message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Send WhatsApp Reminder</span>
                        </button>

                        {/* Record Payment Button */}
                        <button
                          onClick={() => onRecordPayment(m.id)}
                          className="p-1.5 bg-[#262626] hover:bg-[#333333] text-[#f59e0b] rounded-lg transition-colors"
                          title="Record Payment"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-3 bg-[#121212] rounded-lg border border-[#262626] text-[11px] text-[#737373] flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-[#A3A3A3]" />
        <span>
          Note: Clicking "Send WhatsApp Reminder" opens WhatsApp Web or App with a customized, polite payment notice. It does not claim delivery until you press Send in WhatsApp.
        </span>
      </div>

    </div>
  );
};
