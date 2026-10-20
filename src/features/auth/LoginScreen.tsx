import React, { useState } from 'react';
import { 
  Dumbbell, 
  Lock, 
  User, 
  ShieldCheck, 
  Database, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginScreenProps {
  onOpenSupabaseModal: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onOpenSupabaseModal }) => {
  const { loginWithSupabase, loginDemo, supabaseConfigured } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('demo123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (supabaseConfigured) {
        // Authenticate via Supabase Auth
        const res = await loginWithSupabase(username, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Authentication failed. Please check your credentials.');
        }
      } else {
        // Demo authentication mode
        const res = await loginDemo(username, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid administrator credentials.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoFill = async () => {
    setUsername('admin');
    setPassword('demo123');
    setErrorMsg('');
    setIsSubmitting(true);
    await loginDemo('admin', 'demo123');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col justify-center items-center px-4 py-8 text-white">
      {/* Brand Badge */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E11D2E] text-white shadow-xl shadow-[#E11D2E]/25 mb-3">
          <Dumbbell className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-poppins text-white uppercase">
          The Wellness <span className="text-[#E11D2E]">Warriors Gym</span>
        </h1>
        <p className="text-xs text-[#A3A3A3] mt-1 font-medium">
          Internal Operations & Administration Portal • Jalpaiguri, West Bengal
        </p>
        <p className="text-[11px] text-[#737373]">Phone: +91 7872103454 • Timezone: Asia/Kolkata</p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#181818] border border-[#303030] rounded-2xl p-6 sm:p-8 shadow-2xl">
        
        {/* Supabase status notice */}
        {!supabaseConfigured ? (
          <div className="mb-5 p-3.5 bg-[#201810] border border-[#f59e0b]/40 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#f59e0b] font-bold">
                <Database className="w-3.5 h-3.5" />
                Demo Mode Active
              </span>
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                className="text-[11px] text-[#E11D2E] hover:underline font-semibold"
              >
                Supabase Setup
              </button>
            </div>
            <p className="text-[#d4d4d4] text-[11px] leading-relaxed">
              Supabase environment variables are not yet configured. The system will run in full local demo mode seeded with 12 sample members, payments, and attendance.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] text-[#A3A3A3]">
              <span>Demo credentials: <strong>admin</strong> / <strong>demo123</strong></span>
            </div>
          </div>
        ) : (
          <div className="mb-5 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Supabase Cloud PostgreSQL connected. Authenticating via Supabase Auth.</span>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/50 text-red-300 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5">
              {supabaseConfigured ? 'Administrator Email' : 'Username / Email'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                <User className="w-4 h-4" />
              </div>
              <input
                type={supabaseConfigured ? 'email' : 'text'}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={supabaseConfigured ? 'admin@wellnesswarriors.gym' : 'admin'}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5">
              Administrator Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#121212] border border-[#333333] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#E11D2E] hover:bg-[#c91424] text-white text-xs font-bold rounded-lg shadow-lg shadow-[#E11D2E]/25 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Gym Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Button */}
        {!supabaseConfigured && (
          <div className="mt-5 pt-4 border-t border-[#262626]">
            <button
              type="button"
              onClick={handleQuickDemoFill}
              disabled={isSubmitting}
              className="w-full py-2 bg-[#222222] hover:bg-[#2b2b2b] border border-[#383838] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#E11D2E]" />
              <span>One-Click Demo Admin Login (admin / demo123)</span>
            </button>
          </div>
        )}

      </div>

      {/* Footer Disclaimer */}
      <div className="mt-8 text-center text-xs text-[#737373] max-w-sm">
        <p className="flex items-center justify-center gap-1">
          <Info className="w-3.5 h-3.5 text-[#A3A3A3]" />
          Internal gym administration system only.
        </p>
        <p className="mt-1 text-[11px]">
          Jalpaiguri, West Bengal • Protected by PostgreSQL Row Level Security.
        </p>
      </div>
    </div>
  );
};
