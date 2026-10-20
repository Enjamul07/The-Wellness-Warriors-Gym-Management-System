import React, { useState } from 'react';
import { X, Database, Check, Copy, ExternalLink, Key, Shield, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured, SUPABASE_URL, SUPABASE_ANON_KEY, saveCustomSupabaseConfig } from '../../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'schema' | 'seed'>('status');
  const [urlInput, setUrlInput] = useState(SUPABASE_URL);
  const [keyInput, setKeyInput] = useState(SUPABASE_ANON_KEY);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomSupabaseConfig(urlInput, keyInput);
    setSavedSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const migrationSql = `-- Run this in your Supabase SQL Editor:
-- Tables: profiles, gym_settings, membership_plans, members, memberships, fee_charges, payments, attendance, audit_logs
-- Refer to /supabase/migrations/001_initial_schema.sql in the project tree.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#181818] border border-[#303030] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-[#2b2b2b] flex items-center justify-between bg-[#1f1f1f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E11D2E]/20 text-[#E11D2E] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-poppins">Supabase Database & Auth Configuration</h3>
              <p className="text-xs text-[#A3A3A3]">PostgreSQL database setup and connection status</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#737373] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2b2b2b] bg-[#141414] px-4">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'status'
                ? 'border-[#E11D2E] text-white'
                : 'border-transparent text-[#A3A3A3] hover:text-white'
            }`}
          >
            Connection & Credentials
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-[#E11D2E] text-white'
                : 'border-transparent text-[#A3A3A3] hover:text-white'
            }`}
          >
            SQL Migration Guide
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'status' && (
            <>
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isConfigured 
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
              }`}>
                {isConfigured ? (
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-sm text-white">
                    {isConfigured ? 'Supabase Project Connected' : 'Running in Local Demonstration Mode'}
                  </p>
                  <p className="mt-1">
                    {isConfigured
                      ? 'The system is connected to your Supabase PostgreSQL database. Authentication and queries run directly on your database instance.'
                      : 'Supabase credentials are not detected in environment variables. The application is operating with high-fidelity local persistence seeded with 12 sample members, payments, charges, attendance, and plans. You can connect your live Supabase database below.'}
                  </p>
                </div>
              </div>

              {/* Form to connect custom Supabase instance */}
              <form onSubmit={handleSaveCredentials} className="space-y-4 bg-[#141414] p-4 rounded-xl border border-[#2b2b2b]">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#E11D2E]" />
                  Connect Your Supabase Project
                </h4>

                <div>
                  <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Project URL (VITE_SUPABASE_URL)</label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://xyzproject.supabase.co"
                    className="w-full bg-[#1e1e1e] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A3A3A3] mb-1">Anon / Public API Key (VITE_SUPABASE_ANON_KEY)</label>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-[#1e1e1e] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#E11D2E] hover:bg-[#c91424] text-white text-xs font-semibold rounded-lg transition-colors shadow-md shadow-[#E11D2E]/25"
                  >
                    Save & Reconnect
                  </button>
                  {savedSuccess && (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved! Reloading...
                    </span>
                  )}
                </div>
              </form>

              {/* Instructions */}
              <div className="bg-[#141414] p-4 rounded-xl border border-[#2b2b2b] text-xs text-[#A3A3A3] space-y-2">
                <p className="font-semibold text-white">How to set up Supabase for The Wellness Warriors Gym:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Create a free account or project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#E11D2E] underline">supabase.com</a>.</li>
                  <li>In Supabase Dashboard, navigate to <strong>SQL Editor</strong>.</li>
                  <li>Copy and run the SQL migration script from the <strong>SQL Migration Guide</strong> tab.</li>
                  <li>Run the seed script to populate initial plans and sample data.</li>
                  <li>Under <strong>Authentication &gt; Users</strong>, add your administrator email (e.g. <code className="text-white">admin@wellnesswarriors.gym</code>) and password.</li>
                </ol>
              </div>
            </>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">PostgreSQL Schema & RLS</h4>
                  <p className="text-xs text-[#A3A3A3]">Complete schema migration file located at <code className="text-white">/supabase/migrations/001_initial_schema.sql</code></p>
                </div>
                <button
                  onClick={() => copyToClipboard('Please see /supabase/migrations/001_initial_schema.sql in the project root.')}
                  className="px-3 py-1.5 bg-[#262626] hover:bg-[#333333] text-white text-xs rounded-md flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Path'}</span>
                </button>
              </div>

              <div className="bg-[#101010] p-3.5 rounded-lg border border-[#262626] font-mono text-xs text-[#d4d4d4] max-h-60 overflow-y-auto">
                <pre>{`-- Includes 10 Core Tables with PostgreSQL RLS:
1. profiles (UUID PK, role, email)
2. gym_settings (Jalpaiguri location, phone, currency ₹, PT fees)
3. membership_plans (Monthly, Quarterly, Half-Yearly, Yearly)
4. members (WWG-1001, phone, photo, status)
5. memberships (start_date, expiry_date, PT add-on)
6. fee_charges (financial debits)
7. payments (financial credits with unique WWG-YYYYMM-XXX receipts)
8. attendance (unique member per day constraint, override reasons)
9. enquiries (internal lead tracking)
10. audit_logs (compliance & logs)

-- All tables have Row Level Security enabled for authenticated administrators.`}</pre>
              </div>
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
