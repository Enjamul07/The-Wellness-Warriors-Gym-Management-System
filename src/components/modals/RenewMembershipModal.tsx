import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Calendar, CheckCircle2, Dumbbell, AlertCircle } from 'lucide-react';
import { Member, MembershipPlan, Payment } from '../../types';
import { calculateMembershipExpiry, calculateRenewalStartDate, formatCurrencyINR } from '../../lib/calculations';
import { dbService } from '../../services/dbService';

interface RenewMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  plans: MembershipPlan[];
  onRenewalSuccess: (payment?: Payment) => void;
}

export const RenewMembershipModal: React.FC<RenewMembershipModalProps> = ({
  isOpen,
  onClose,
  member,
  plans,
  onRenewalSuccess
}) => {
  const todayIso = new Date().toISOString().split('T')[0];

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startDate, setStartDate] = useState(todayIso);
  const [expiryDate, setExpiryDate] = useState('');
  const [hasPT, setHasPT] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI'>('Cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // When opened with a member, calculate consecutive or today's start date
  useEffect(() => {
    if (member) {
      const calculatedStart = calculateRenewalStartDate(member.current_expiry_date, todayIso);
      setStartDate(calculatedStart);
      if (plans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plans[0].id);
      }
    }
  }, [member, plans, isOpen]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  // Auto-calculate expiry whenever plan or startDate changes
  useEffect(() => {
    if (selectedPlan && startDate) {
      const computed = calculateMembershipExpiry(startDate, selectedPlan.duration_months);
      setExpiryDate(computed);
    }
  }, [selectedPlan, startDate]);

  // Renewal pricing: no admission fee on renewal, only membership price + optional PT
  const ptMonths = hasPT ? (selectedPlan?.duration_months || 1) : 0;
  const ptFee = ptMonths * 1500;
  const totalRenewalAmount = (selectedPlan?.membership_price || 0) + ptFee;

  // By default, set paymentAmount to totalRenewalAmount
  useEffect(() => {
    setPaymentAmount(totalRenewalAmount);
  }, [totalRenewalAmount]);

  if (!isOpen || !member) return null;

  const isCurrentlyActive = member.current_expiry_date && member.current_expiry_date >= todayIso;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      setIsSubmitting(true);
      const { payment } = await dbService.renewMembership({
        member_id: member.id,
        plan_id: selectedPlan.id,
        start_date: startDate,
        expiry_date: expiryDate,
        has_personal_training: hasPT,
        pt_months: ptMonths,
        payment_amount: paymentAmount === '' ? 0 : Number(paymentAmount),
        payment_method: paymentMethod,
        notes: notes.trim() || undefined
      });

      if (payment) {
        payment.member_name = member.full_name;
        payment.member_code = member.member_code;
        payment.member_phone = member.phone;
      }

      onRenewalSuccess(payment);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to renew membership');
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
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-poppins">Renew Membership</h3>
              <p className="text-xs text-[#A3A3A3]">{member.full_name} ({member.member_code})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#737373] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Status banner */}
          <div className="bg-[#121212] p-3 rounded-lg border border-[#2b2b2b] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#A3A3A3] uppercase block">Current Plan & Expiry</span>
              <p className="font-semibold text-white">{member.current_plan_name || 'N/A'}</p>
              <p className="text-[11px] text-[#A3A3A3]">Expires on: {member.current_expiry_date || 'N/A'}</p>
            </div>
            <div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                isCurrentlyActive ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-600/40' : 'bg-red-950/60 text-[#E11D2E] border border-red-600/40'
              }`}>
                {isCurrentlyActive ? 'Active (Extends Seamlessly)' : 'Expired'}
              </span>
            </div>
          </div>

          {/* Plan Selector */}
          <div>
            <label className="block text-[#A3A3A3] font-semibold mb-1">Select Renewal Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.duration_months} mo) - {formatCurrencyINR(p.membership_price)}
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1">Renewal Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                required
              />
            </div>
            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1">New Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                required
              />
            </div>
          </div>

          {/* PT Add-on */}
          <div className="p-3 bg-[#121212] rounded-lg border border-[#2b2b2b] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#E11D2E]" />
              <div>
                <p className="font-semibold text-white">Include Personal Training (PT)</p>
                <p className="text-[10px] text-[#A3A3A3]">₹1,500/month for {selectedPlan?.duration_months} month(s)</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasPT}
                onChange={(e) => setHasPT(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#333333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E11D2E]"></div>
            </label>
          </div>

          {/* Fee Calculation Box */}
          <div className="bg-[#101010] p-3 rounded-lg border border-[#2b2b2b] flex items-center justify-between text-xs">
            <div>
              <p className="text-[#A3A3A3]">Renewal Charge (Admission fee ₹0):</p>
              <p className="text-white font-semibold">
                Plan: {formatCurrencyINR(selectedPlan?.membership_price || 0)}
                {hasPT ? ` + PT: ${formatCurrencyINR(ptFee)}` : ''}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#A3A3A3] uppercase block">Total Payable</span>
              <span className="text-base font-bold text-[#E11D2E]">{formatCurrencyINR(totalRenewalAmount)}</span>
            </div>
          </div>

          {/* Immediate Payment Option */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1">Payment Received (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 800"
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-[#E11D2E]"
              />
            </div>
            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1">Payment Method</label>
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
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#E11D2E] hover:bg-[#c91424] text-white font-semibold rounded-lg shadow-md shadow-[#E11D2E]/25 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? 'Renewing...' : 'Confirm Renewal & Save'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
