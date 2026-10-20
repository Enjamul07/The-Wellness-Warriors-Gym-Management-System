import React, { useState, useEffect } from 'react';
import { X, UserPlus, Calendar, CreditCard, Sparkles, AlertCircle, Dumbbell } from 'lucide-react';
import { MembershipPlan, Member, Payment } from '../../types';
import { calculateMembershipExpiry, calculateInitialPayable, formatCurrencyINR } from '../../lib/calculations';
import { dbService } from '../../services/dbService';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: MembershipPlan[];
  onMemberAdded: (member: Member, payment?: Payment) => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&fit=crop&crop=faces',
];

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  plans,
  onMemberAdded
}) => {
  const todayIso = new Date().toISOString().split('T')[0];

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [photoUrl, setPhotoUrl] = useState(AVATAR_OPTIONS[0]);
  const [address, setAddress] = useState('Jalpaiguri, West Bengal');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [joinDate, setJoinDate] = useState(todayIso);

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [hasPT, setHasPT] = useState(false);
  const [initialPayment, setInitialPayment] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI'>('Cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Default to first plan if none selected
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  // Auto-calculate expiry date when joinDate or plan changes
  useEffect(() => {
    if (selectedPlan && joinDate) {
      const computedExpiry = calculateMembershipExpiry(joinDate, selectedPlan.duration_months);
      setCustomExpiryDate(computedExpiry);
    }
  }, [selectedPlan, joinDate]);

  // Compute fee breakdown
  const feeCalculation = selectedPlan
    ? calculateInitialPayable({
        plan: selectedPlan,
        hasPersonalTraining: hasPT,
        ptMonths: selectedPlan.duration_months,
        ptMonthlyFee: 1500
      })
    : { basePrice: 0, admissionFee: 0, ptFee: 0, totalAmount: 0 };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { member, payment } = await dbService.createMember({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        gender,
        photo_url: photoUrl,
        address: address.trim() || undefined,
        emergency_contact_phone: emergencyPhone.trim() || undefined,
        join_date: joinDate,
        plan_id: selectedPlan.id,
        has_personal_training: hasPT,
        pt_months: hasPT ? selectedPlan.duration_months : 0,
        initial_payment_amount: initialPayment === '' ? 0 : Number(initialPayment),
        payment_method: paymentMethod,
        custom_expiry_date: customExpiryDate,
        notes: notes.trim() || undefined
      });

      onMemberAdded(member, payment);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#181818] border border-[#303030] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-[#2b2b2b] flex items-center justify-between bg-[#1f1f1f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E11D2E]/20 text-[#E11D2E] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-poppins">Add New Member</h3>
              <p className="text-xs text-[#A3A3A3]">Register gym member with admission & membership plan</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#737373] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section: Personal Info */}
          <div>
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2 text-[#E11D2E]">
              1. Personal Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A3A3A3] font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subir Karmakar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div>
                <label className="block text-[#A3A3A3] font-semibold mb-1">Phone Number (10-digit / +91) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9832011223"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div>
                <label className="block text-[#A3A3A3] font-semibold mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="member@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div>
                <label className="block text-[#A3A3A3] font-semibold mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[#A3A3A3] font-semibold mb-1">Address / Location in Jalpaiguri</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Kadamtala, Jalpaiguri"
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                />
              </div>
            </div>

            {/* Avatar Select */}
            <div className="mt-3">
              <label className="block text-[#A3A3A3] font-semibold mb-1.5">Profile Photo</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVATAR_OPTIONS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPhotoUrl(url)}
                    className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all shrink-0 ${
                      photoUrl === url ? 'border-[#E11D2E] scale-105' : 'border-[#333333] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="avatar option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Membership Plan */}
          <div className="pt-2 border-t border-[#262626]">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2 text-[#E11D2E]">
              2. Membership Plan & Dates
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A3A3A3] font-semibold mb-1">Select Membership Plan</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.duration_months} mo) - {formatCurrencyINR(p.membership_price)}
                      {p.duration_months === 12 ? ' (Free Admission)' : ` (+₹${p.admission_fee} Admission)`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#A3A3A3] font-semibold mb-1">Join Date</label>
                <input
                  type="date"
                  value={joinDate}
                  onChange={(e) => setJoinDate(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#A3A3A3] font-semibold">Expiry Date (Auto-calculated with override)</label>
                  <span className="text-[10px] text-emerald-400">Duration: {selectedPlan?.duration_months} month(s)</span>
                </div>
                <input
                  type="date"
                  value={customExpiryDate}
                  onChange={(e) => setCustomExpiryDate(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                />
              </div>
            </div>

            {/* Personal Training Add-on */}
            <div className="mt-3 p-3 bg-[#121212] rounded-lg border border-[#2b2b2b] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#E11D2E]" />
                <div>
                  <p className="font-semibold text-white">Personal Training (PT) Add-on</p>
                  <p className="text-[10px] text-[#A3A3A3]">Dedicated coach guidance at ₹1,500/month</p>
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
          </div>

          {/* Section: Fee Summary & Initial Payment */}
          <div className="pt-2 border-t border-[#262626]">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2 text-[#E11D2E]">
              3. Fee Calculation & Initial Collection
            </h4>

            {/* Breakdown card */}
            <div className="bg-[#101010] p-3.5 rounded-lg border border-[#2b2b2b] space-y-1.5 mb-3">
              <div className="flex justify-between text-[#A3A3A3]">
                <span>Membership Base ({selectedPlan?.name}):</span>
                <span className="text-white font-medium">{formatCurrencyINR(feeCalculation.basePrice)}</span>
              </div>
              <div className="flex justify-between text-[#A3A3A3]">
                <span>Admission Fee:</span>
                <span className={feeCalculation.admissionFee === 0 ? 'text-emerald-400 font-semibold' : 'text-white'}>
                  {feeCalculation.admissionFee === 0 ? '₹0 (Waived on Annual)' : formatCurrencyINR(feeCalculation.admissionFee)}
                </span>
              </div>
              {hasPT && (
                <div className="flex justify-between text-[#A3A3A3]">
                  <span>Personal Training ({selectedPlan?.duration_months} mo × ₹1,500):</span>
                  <span className="text-white font-medium">{formatCurrencyINR(feeCalculation.ptFee)}</span>
                </div>
              )}
              <div className="border-t border-[#262626] pt-1.5 flex justify-between font-bold text-white text-sm">
                <span>Total Payable:</span>
                <span className="text-[#E11D2E] text-base">{formatCurrencyINR(feeCalculation.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A3A3A3] font-semibold mb-1">
                  Initial Payment Received (₹)
                  <span className="text-[10px] text-[#A3A3A3] block font-normal">Leave blank or ₹0 if unpaid; partial payments allowed</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={feeCalculation.totalAmount}
                  step="1"
                  placeholder="e.g. 1100"
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value === '' ? '' : Number(e.target.value))}
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

              <div className="md:col-span-2">
                <label className="block text-[#A3A3A3] font-semibold mb-1">Notes / Health remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Prefers morning workout, goal: muscle hypertrophy"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-[#262626] flex items-center justify-end gap-3">
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
              className="px-5 py-2 bg-[#E11D2E] hover:bg-[#c91424] text-white font-semibold rounded-lg shadow-md shadow-[#E11D2E]/25 transition-all"
            >
              {isSubmitting ? 'Registering...' : 'Register Member & Save'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
