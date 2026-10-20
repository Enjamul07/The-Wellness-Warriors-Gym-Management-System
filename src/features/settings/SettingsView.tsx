import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  RotateCcw, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Receipt,
  ShieldCheck,
  Code
} from 'lucide-react';
import { GymSettings } from '../../types';
import { dbService, resetDemoData } from '../../services/dbService';
import { isSupabaseConfigured, SUPABASE_URL } from '../../lib/supabase';

interface SettingsViewProps {
  onOpenSupabaseModal: () => void;
  onSettingsSaved: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenSupabaseModal,
  onSettingsSaved
}) => {
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    dbService.getSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setFeedback(null);

    try {
      await dbService.updateSettings(settings);
      setFeedback({ type: 'success', message: 'Gym configuration saved successfully to database.' });
      onSettingsSaved();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    resetDemoData();
    setFeedback({
      type: 'success',
      message: 'Demo dataset safely reset to 12 pristine sample members, plans, and attendance!'
    });
    setResetConfirm(false);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-xs text-[#737373]">Loading gym settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Top Banner */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white font-poppins flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#E11D2E]" />
            Gym System Settings & Database
          </h3>
          <p className="text-xs text-[#A3A3A3]">
            Configure operational parameters, contact details, currency, and Supabase integration
          </p>
        </div>
        
        <button
          onClick={onOpenSupabaseModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-xs font-semibold border border-[#383838] transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Supabase & SQL Migrations</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
          feedback.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/40 border-red-500/40 text-red-300'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#E11D2E] shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-6 shadow-xl space-y-6 text-xs">
        
        {/* Section 1: Business Identity */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 text-[#E11D2E] flex items-center gap-2">
            <span>1. Gym Identity & Contact</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1">Business Name</label>
              <input
                type="text"
                required
                value={settings.gym_name}
                onChange={(e) => setSettings({ ...settings, gym_name: e.target.value })}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
              />
            </div>

            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1">Official Gym Phone</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
              />
            </div>

            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1">WhatsApp Reminder Number</label>
              <input
                type="text"
                required
                value={settings.whatsapp_number}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
              />
            </div>

            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1">Physical Location / Address</label>
              <input
                type="text"
                required
                value={settings.location}
                onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[#A3A3A3] font-semibold mb-1">Operating Hours</label>
              <input
                type="text"
                value={settings.operating_hours}
                onChange={(e) => setSettings({ ...settings, operating_hours: e.target.value })}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pricing Defaults & Reminders */}
        <div className="pt-4 border-t border-[#262626]">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 text-[#E11D2E]">
            2. Financial Defaults & Reminder Rules
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1">Personal Training (₹/Month)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={settings.pt_monthly_price}
                onChange={(e) => setSettings({ ...settings, pt_monthly_price: Number(e.target.value) })}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
              />
            </div>

            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1">Default Admission Fee (₹)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={settings.default_admission_fee}
                onChange={(e) => setSettings({ ...settings, default_admission_fee: Number(e.target.value) })}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
              />
            </div>

            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1">Expiry Reminder Days Before</label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.expiry_reminder_days}
                onChange={(e) => setSettings({ ...settings, expiry_reminder_days: Number(e.target.value) })}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Receipt Template */}
        <div className="pt-4 border-t border-[#262626]">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 text-[#E11D2E]">
            3. Official Receipt Configuration
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1">Receipt Number Prefix</label>
              <input
                type="text"
                value={settings.receipt_prefix}
                onChange={(e) => setSettings({ ...settings, receipt_prefix: e.target.value })}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#E11D2E]"
              />
            </div>

            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1">Receipt Footer Note</label>
              <input
                type="text"
                value={settings.receipt_footer_note}
                onChange={(e) => setSettings({ ...settings, receipt_footer_note: e.target.value })}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E11D2E]"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-[#262626] flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#E11D2E] hover:bg-[#c91424] text-white font-semibold rounded-lg shadow-md shadow-[#E11D2E]/25 transition-all text-xs"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Gym Settings'}</span>
          </button>
        </div>
      </form>

      {/* Development & Demonstration Data Tools */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-6 shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-amber-500" />
          <span>Development Demonstration Tools</span>
        </h4>
        <p className="text-xs text-[#A3A3A3] leading-relaxed">
          Need to test the 12 sample members, payments, and attendance afresh? You can reset the local demonstration repository back to initial state.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetData}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
              resetConfirm
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-[#262626] hover:bg-[#333333] text-amber-400 border border-amber-600/30'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{resetConfirm ? 'Click Again to Confirm Reset' : 'Reset Sample Demonstration Data (12 Members)'}</span>
          </button>

          {resetConfirm && (
            <button
              type="button"
              onClick={() => setResetConfirm(false)}
              className="text-xs text-[#A3A3A3] hover:text-white underline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
