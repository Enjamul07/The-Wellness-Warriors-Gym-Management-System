import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  RefreshCw, 
  CalendarCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Archive,
  Printer
} from 'lucide-react';
import { Member, Membership, Payment, Attendance } from '../../types';
import { dbService } from '../../services/dbService';
import { formatCurrencyINR } from '../../lib/calculations';

interface MemberDetailsModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment: (memberId: string) => void;
  onRenewMembership: (member: Member) => void;
  onMarkAttendance: (member: Member) => void;
  onViewReceipt: (payment: Payment) => void;
  onArchiveMember: (memberId: string) => void;
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  member,
  isOpen,
  onClose,
  onRecordPayment,
  onRenewMembership,
  onMarkAttendance,
  onViewReceipt,
  onArchiveMember
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'memberships' | 'payments' | 'attendance'>('overview');
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member && isOpen) {
      setLoading(true);
      Promise.all([
        dbService.getMemberships(),
        dbService.getPayments(),
        dbService.getAttendance()
      ]).then(([allMships, allPayments, allAtt]) => {
        setMemberships(allMships.filter(m => m.member_id === member.id));
        setPayments(allPayments.filter(p => p.member_id === member.id));
        setAttendance(allAtt.filter(a => a.member_id === member.id));
        setLoading(false);
      });
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const todayIso = new Date().toISOString().split('T')[0];
  const isExpired = member.current_expiry_date ? member.current_expiry_date < todayIso : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#181818] border border-[#303030] rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header Profile Bar */}
        <div className="p-5 border-b border-[#2b2b2b] bg-[#1a1a1a] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={member.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=faces'}
              alt={member.full_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#E11D2E] shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-poppins">{member.full_name}</h3>
                <span className="font-mono text-xs px-2 py-0.5 bg-[#262626] border border-[#3a3a3a] text-gray-300 rounded font-semibold">
                  {member.member_code}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                  member.status === 'archived'
                    ? 'bg-zinc-800 text-zinc-400'
                    : isExpired
                    ? 'bg-red-950/70 text-[#E11D2E] border border-red-500/40'
                    : 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {member.status === 'archived' ? 'Archived' : isExpired ? 'Expired' : 'Active'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#A3A3A3] mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#E11D2E]" /> {member.phone}
                </span>
                {member.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#E11D2E]" /> {member.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#E11D2E]" /> {member.address || 'Jalpaiguri, WB'}
                </span>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="text-[#737373] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="px-5 py-2.5 bg-[#141414] border-b border-[#262626] flex flex-wrap items-center gap-2">
          <button
            onClick={() => onRecordPayment(member.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E11D2E] hover:bg-[#c91424] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => onRenewMembership(member)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Renew Plan</span>
          </button>

          <button
            onClick={() => onMarkAttendance(member)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262626] hover:bg-[#333333] text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </button>

          {member.status !== 'archived' && (
            <button
              onClick={() => {
                if (window.confirm(`Archive ${member.full_name}? Historical payments and attendance will be safely preserved.`)) {
                  onArchiveMember(member.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262626] hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded-lg text-xs transition-colors ml-auto"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#2b2b2b] bg-[#121212] px-5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-[#E11D2E] text-white'
                : 'border-transparent text-[#A3A3A3] hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('memberships')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'memberships'
                ? 'border-[#E11D2E] text-white'
                : 'border-transparent text-[#A3A3A3] hover:text-white'
            }`}
          >
            Memberships ({memberships.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-[#E11D2E] text-white'
                : 'border-transparent text-[#A3A3A3] hover:text-white'
            }`}
          >
            Payment Receipts ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'attendance'
                ? 'border-[#E11D2E] text-white'
                : 'border-transparent text-[#A3A3A3] hover:text-white'
            }`}
          >
            Attendance Logs ({attendance.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#121212] p-3.5 rounded-lg border border-[#2b2b2b]">
                  <span className="text-[10px] uppercase font-bold text-[#A3A3A3] block">Total Charged</span>
                  <p className="text-base font-bold text-white mt-1">
                    {formatCurrencyINR(member.total_charged || 0)}
                  </p>
                </div>
                <div className="bg-[#121212] p-3.5 rounded-lg border border-[#2b2b2b]">
                  <span className="text-[10px] uppercase font-bold text-[#A3A3A3] block">Total Paid</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">
                    {formatCurrencyINR(member.total_paid || 0)}
                  </p>
                </div>
                <div className="bg-[#121212] p-3.5 rounded-lg border border-[#2b2b2b]">
                  <span className="text-[10px] uppercase font-bold text-[#A3A3A3] block">Outstanding Dues</span>
                  <p className={`text-base font-bold mt-1 ${
                    (member.outstanding_balance || 0) > 0 ? 'text-[#E11D2E]' : 'text-gray-400'
                  }`}>
                    {formatCurrencyINR(member.outstanding_balance || 0)}
                  </p>
                </div>
              </div>

              {/* Membership Status Details */}
              <div className="bg-[#121212] p-4 rounded-lg border border-[#2b2b2b] space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Membership Status</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#A3A3A3]">Active Plan:</span>
                    <p className="font-semibold text-white">{member.current_plan_name || 'None'}</p>
                  </div>
                  <div>
                    <span className="text-[#A3A3A3]">Membership Expiry:</span>
                    <p className={`font-semibold ${isExpired ? 'text-[#E11D2E]' : 'text-white'}`}>
                      {member.current_expiry_date || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#A3A3A3]">Join Date:</span>
                    <p className="font-semibold text-white">{member.join_date}</p>
                  </div>
                  <div>
                    <span className="text-[#A3A3A3]">Check-in Count:</span>
                    <p className="font-semibold text-emerald-400">{attendance.length} session(s)</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {member.notes && (
                <div className="bg-[#121212] p-4 rounded-lg border border-[#2b2b2b]">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Staff Notes</h4>
                  <p className="text-[#A3A3A3] leading-relaxed">{member.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'memberships' && (
            <div className="space-y-3">
              {memberships.length === 0 ? (
                <p className="text-center text-[#737373] py-6">No historical memberships recorded.</p>
              ) : (
                memberships.map((m) => (
                  <div key={m.id} className="p-3.5 bg-[#121212] rounded-lg border border-[#262626] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm">{m.plan_name}</p>
                        {m.has_personal_training && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-[#E11D2E]/20 text-[#E11D2E] rounded font-semibold">
                            +Personal Training
                          </span>
                        )}
                      </div>
                      <p className="text-[#A3A3A3] text-[11px] mt-1">
                        Validity: {m.start_date} to {m.expiry_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{formatCurrencyINR(m.total_amount)}</p>
                      <span className={`text-[10px] font-semibold uppercase ${
                        m.expiry_date >= todayIso ? 'text-emerald-400' : 'text-gray-500'
                      }`}>
                        {m.expiry_date >= todayIso ? 'Active Period' : 'Expired Period'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-3">
              {payments.length === 0 ? (
                <p className="text-center text-[#737373] py-6">No payment records found.</p>
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="p-3.5 bg-[#121212] rounded-lg border border-[#262626] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{p.receipt_number}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-[#262626] rounded text-[#A3A3A3] uppercase">
                          {p.payment_method}
                        </span>
                      </div>
                      <p className="text-[#A3A3A3] text-[11px] mt-0.5">
                        Date: {p.payment_date} • Category: {p.fee_category.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-400">{formatCurrencyINR(p.amount)}</p>
                        <p className="text-[10px] text-[#737373]">By {p.recorded_by}</p>
                      </div>
                      <button
                        onClick={() => {
                          const enriched: Payment = {
                            ...p,
                            member_name: member.full_name,
                            member_code: member.member_code,
                            member_phone: member.phone,
                            remaining_balance: member.outstanding_balance
                          };
                          onViewReceipt(enriched);
                        }}
                        className="p-2 bg-[#222222] hover:bg-[#333333] text-white rounded-lg transition-colors"
                        title="View Official Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-2">
              {attendance.length === 0 ? (
                <p className="text-center text-[#737373] py-6">No check-in logs recorded yet.</p>
              ) : (
                <div className="divide-y divide-[#262626] border border-[#262626] rounded-lg overflow-hidden">
                  {attendance.map((a) => (
                    <div key={a.id} className="p-3 bg-[#121212] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="font-medium text-white">{a.check_in_date}</p>
                          <p className="text-[10px] text-[#A3A3A3]">Time: {a.check_in_time} (IST)</p>
                        </div>
                      </div>
                      <div className="text-right text-[11px]">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          a.status === 'overridden' ? 'bg-amber-950/60 text-amber-400' : 'bg-emerald-950/60 text-emerald-400'
                        }`}>
                          {a.status === 'overridden' ? 'Override' : 'Present'}
                        </span>
                        {a.override_reason && (
                          <p className="text-[10px] text-amber-500 mt-0.5">{a.override_reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2b2b2b] bg-[#141414] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
