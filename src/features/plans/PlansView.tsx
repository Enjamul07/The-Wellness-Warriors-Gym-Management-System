import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  Users, 
  Dumbbell, 
  CheckCircle2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { MembershipPlan, Member } from '../../types';
import { formatCurrencyINR } from '../../lib/calculations';
import { dbService } from '../../services/dbService';

interface PlansViewProps {
  plans: MembershipPlan[];
  members: Member[];
  onPlansUpdated: () => void;
}

export const PlansView: React.FC<PlansViewProps> = ({
  plans,
  members,
  onPlansUpdated
}) => {
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    duration_months: 1,
    membership_price: 800,
    admission_fee: 300,
    is_active: true,
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const openCreateModal = () => {
    setFormData({
      name: '',
      duration_months: 1,
      membership_price: 800,
      admission_fee: 300,
      is_active: true,
      description: ''
    });
    setIsCreating(true);
    setEditingPlan(null);
  };

  const openEditModal = (plan: MembershipPlan) => {
    setFormData({
      name: plan.name,
      duration_months: plan.duration_months,
      membership_price: plan.membership_price,
      admission_fee: plan.admission_fee,
      is_active: plan.is_active,
      description: plan.description || ''
    });
    setEditingPlan(plan);
    setIsCreating(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dbService.savePlan({
        ...(editingPlan ? { id: editingPlan.id, code: editingPlan.code } : {}),
        name: formData.name,
        duration_months: Number(formData.duration_months),
        membership_price: Number(formData.membership_price),
        admission_fee: Number(formData.duration_months) === 12 ? 0 : Number(formData.admission_fee),
        is_active: formData.is_active,
        description: formData.description
      });

      setSuccessMsg(editingPlan ? 'Plan updated successfully!' : 'New membership plan created!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsCreating(false);
      setEditingPlan(null);
      onPlansUpdated();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (plan: MembershipPlan) => {
    await dbService.savePlan({
      ...plan,
      is_active: !plan.is_active
    });
    onPlansUpdated();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white font-poppins flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#E11D2E]" />
            Membership Plan Management
          </h3>
          <p className="text-xs text-[#A3A3A3]">
            Configure durations, base fees, admission waivers, and personal training packages
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#E11D2E] hover:bg-[#c91424] text-white rounded-lg text-xs font-semibold shadow-md shadow-[#E11D2E]/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const enrolledCount = members.filter(
            m => m.current_plan_name?.toLowerCase() === plan.name.toLowerCase() && m.status !== 'archived'
          ).length;

          const isYearly = plan.duration_months === 12 || plan.code === 'PLAN-Y12';

          return (
            <div 
              key={plan.id}
              className={`bg-[#181818] border rounded-xl p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                isYearly 
                  ? 'border-[#E11D2E] shadow-lg shadow-[#E11D2E]/10' 
                  : 'border-[#2b2b2b] hover:border-[#383838]'
              }`}
            >
              {isYearly && (
                <div className="absolute top-0 right-0 bg-[#E11D2E] text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-bl-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Free Admission</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#A3A3A3] uppercase">{plan.code}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    plan.is_active ? 'bg-emerald-950/60 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white mt-2 font-poppins">{plan.name}</h4>
                <p className="text-[11px] text-[#A3A3A3] mt-1 leading-relaxed">
                  {plan.description || `${plan.duration_months} month gym access.`}
                </p>

                {/* Price Display */}
                <div className="mt-4 pt-3 border-t border-[#262626]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-white font-poppins">
                      {formatCurrencyINR(plan.membership_price)}
                    </span>
                    <span className="text-xs text-[#737373]">/ {plan.duration_months} mo</span>
                  </div>
                  <div className="mt-1 text-xs text-[#A3A3A3]">
                    Admission Fee:{' '}
                    <strong className={isYearly ? 'text-emerald-400' : 'text-white'}>
                      {isYearly ? '₹0 (Waived)' : formatCurrencyINR(plan.admission_fee)}
                    </strong>
                  </div>
                </div>

                {/* Enrolled Count */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-[#737373] bg-[#121212] p-2 rounded-lg border border-[#262626]">
                  <Users className="w-3.5 h-3.5 text-[#E11D2E]" />
                  <span>{enrolledCount} athlete(s) currently enrolled</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-4 pt-3 border-t border-[#262626] flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleActive(plan)}
                  className="text-[11px] text-[#A3A3A3] hover:text-white"
                >
                  {plan.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(plan)}
                  className="flex items-center gap-1 text-[11px] text-[#E11D2E] hover:underline font-semibold"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Plan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add-on Info Box */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#E11D2E]/20 text-[#E11D2E] flex items-center justify-center">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-bold text-white font-poppins">Personal Training (PT) Add-on Standard Rate</h5>
            <p className="text-[#A3A3A3] text-[11px]">
              Configured at ₹1,500 per month across all membership plans in Jalpaiguri.
            </p>
          </div>
        </div>
        <span className="text-base font-extrabold text-[#E11D2E] font-poppins">₹1,500 / month</span>
      </div>

      {/* Modal: Create or Edit Plan */}
      {(isCreating || editingPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#181818] border border-[#303030] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 border-b border-[#2b2b2b] flex items-center justify-between bg-[#1f1f1f]">
              <h3 className="text-sm font-bold text-white font-poppins">
                {isCreating ? 'Create Membership Plan' : `Edit Plan: ${editingPlan?.name}`}
              </h3>
              <button 
                onClick={() => { setIsCreating(false); setEditingPlan(null); }}
                className="text-[#737373] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[#A3A3A3] font-semibold mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Student Special Plan"
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A3A3A3] font-semibold mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    required
                    value={formData.duration_months}
                    onChange={(e) => setFormData({ ...formData, duration_months: Number(e.target.value) })}
                    className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                  />
                </div>
                <div>
                  <label className="block text-[#A3A3A3] font-semibold mb-1">Membership Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={formData.membership_price}
                    onChange={(e) => setFormData({ ...formData, membership_price: Number(e.target.value) })}
                    className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A3A3A3] font-semibold mb-1">
                  Admission Fee (₹)
                  {formData.duration_months === 12 && (
                    <span className="text-emerald-400 font-normal ml-2">Automatically waived (₹0) on 12 months</span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  disabled={formData.duration_months === 12}
                  value={formData.duration_months === 12 ? 0 : formData.admission_fee}
                  onChange={(e) => setFormData({ ...formData, admission_fee: Number(e.target.value) })}
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white disabled:opacity-50 focus:outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div>
                <label className="block text-[#A3A3A3] font-semibold mb-1">Description / Perks</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Includes fitness assessment, locker access"
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="plan_active_checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 accent-[#E11D2E] rounded"
                />
                <label htmlFor="plan_active_checkbox" className="text-white font-medium">
                  Plan is currently active for new enrolments
                </label>
              </div>

              <div className="pt-3 border-t border-[#262626] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setEditingPlan(null); }}
                  className="px-3 py-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#E11D2E] hover:bg-[#c91424] text-white font-semibold rounded-lg shadow-md transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
