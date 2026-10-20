import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { Member, PaymentMethod, FeeCategory, Payment } from '../../types';
import { dbService } from '../../services/dbService';
import { formatCurrencyINR } from '../../lib/calculations';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  preselectedMemberId?: string;
  onPaymentSuccess: (payment: Payment) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  members,
  preselectedMemberId,
  onPaymentSuccess
}) => {
  const [memberId, setMemberId] = useState(preselectedMemberId || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [feeCategory, setFeeCategory] = useState<FeeCategory>('combined');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const todayIso = new Date().toISOString().split('T')[0];
  const [paymentDate, setPaymentDate] = useState(todayIso);

  useEffect(() => {
    if (preselectedMemberId) {
      setMemberId(preselectedMemberId);
    } else if (members.length > 0 && !memberId) {
      setMemberId(members[0].id);
    }
  }, [preselectedMemberId, members, isOpen]);

  const selectedMember = members.find(m => m.id === memberId);

  // Auto-fill amount to outstanding balance if available
  useEffect(() => {
    if (selectedMember && selectedMember.outstanding_balance && selectedMember.outstanding_balance > 0) {
      setAmount(selectedMember.outstanding_balance);
    }
  }, [selectedMember]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!memberId) {
      setErrorMsg('Please select a member.');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newPayment = await dbService.recordPayment({
        member_id: memberId,
        amount: numAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        fee_category: feeCategory,
        transaction_ref: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
        recorded_by: 'Gym Administrator'
      });

      // Calculate remaining balance for receipt
      const remainingBalance = Math.max(0, (selectedMember?.outstanding_balance || 0) - numAmount);
      
      const populatedPayment: Payment = {
        ...newPayment,
        member_name: selectedMember?.full_name || 'Member',
        member_code: selectedMember?.member_code,
        member_phone: selectedMember?.phone,
        remaining_balance: remainingBalance
      };

      onPaymentSuccess(populatedPayment);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#181818] border border-[#303030] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-[#2b2b2b] flex items-center justify-between bg-[#1f1f1f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E11D2E]/20 text-[#E11D2E] flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-poppins">Record Fee Payment</h3>
              <p className="text-xs text-[#A3A3A3]">The Wellness Warriors Gym • Jalpaiguri</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#737373] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Member Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Select Member</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
              required
            >
              <option value="">-- Choose Member --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.member_code}) - {m.current_plan_name || 'Active'}
                  {m.outstanding_balance && m.outstanding_balance > 0 ? ` [Due: ₹${m.outstanding_balance}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Member Outstanding Info */}
          {selectedMember && (
            <div className="bg-[#121212] p-3 rounded-lg border border-[#262626] flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-white">{selectedMember.full_name}</p>
                <p className="text-[#A3A3A3] text-[11px]">Phone: {selectedMember.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#A3A3A3] block">Current Outstanding</span>
                <span className={`font-bold text-sm ${
                  (selectedMember.outstanding_balance || 0) > 0 ? 'text-[#E11D2E]' : 'text-emerald-400'
                }`}>
                  {formatCurrencyINR(selectedMember.outstanding_balance || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Amount (₹ INR)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 1100"
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#E11D2E]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
                required
              />
            </div>
          </div>

          {/* Payment Method & Fee Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`py-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                    paymentMethod === 'Cash'
                      ? 'bg-[#E11D2E] text-white border-[#E11D2E]'
                      : 'bg-[#121212] text-[#A3A3A3] border-[#333333] hover:text-white'
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`py-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                    paymentMethod === 'UPI'
                      ? 'bg-[#E11D2E] text-white border-[#E11D2E]'
                      : 'bg-[#121212] text-[#A3A3A3] border-[#333333] hover:text-white'
                  }`}
                >
                  UPI
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Fee Category</label>
              <select
                value={feeCategory}
                onChange={(e) => setFeeCategory(e.target.value as FeeCategory)}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
              >
                <option value="combined">Combined / Package</option>
                <option value="membership">Membership Fee</option>
                <option value="admission">Admission Fee</option>
                <option value="personal_training">Personal Training (PT)</option>
                <option value="other">Other / Locker</option>
              </select>
            </div>
          </div>

          {/* UPI Transaction ID (if UPI) */}
          {paymentMethod === 'UPI' && (
            <div>
              <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">UPI Transaction Reference / UTR</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. UPI/428910248/99"
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#E11D2E]"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#A3A3A3] mb-1">Notes / Remarks (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid in full for October cycle"
              className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white text-xs font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#E11D2E] hover:bg-[#c91424] text-white text-xs font-semibold rounded-lg shadow-md shadow-[#E11D2E]/25 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment & Receipt'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
