import React, { useState } from 'react';
import { Menu, Bell, Database, Plus, CheckCircle2, AlertTriangle, X, Clock, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../types';

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
  title: string;
  subtitle?: string;
  onQuickAddMember: () => void;
  onOpenSupabaseModal: () => void;
  notifications: NotificationItem[];
  onDismissNotification: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  setMobileOpen,
  title,
  subtitle,
  onQuickAddMember,
  onOpenSupabaseModal,
  notifications,
  onDismissNotification
}) => {
  const { supabaseConfigured, isDemo } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Kolkata current date display
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  const unreadCount = notifications.length;

  return (
    <header className="sticky top-0 z-30 bg-[#141414]/90 backdrop-blur-md border-b border-[#262626] px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 text-[#A3A3A3] hover:text-white rounded-lg hover:bg-[#202020] transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-white tracking-tight font-poppins">{title}</h2>
          {subtitle && (
            <p className="text-xs text-[#A3A3A3] hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Date pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#1a1a1a] border border-[#2b2b2b] rounded-md text-xs text-[#d4d4d4]">
          <Clock className="w-3.5 h-3.5 text-[#A3A3A3]" />
          <span>{todayFormatted} (IST)</span>
        </div>

        {/* Supabase Status Pill */}
        <button
          onClick={onOpenSupabaseModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            supabaseConfigured
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-600/40 hover:bg-emerald-900/50'
              : 'bg-[#221c16] text-[#f59e0b] border-[#d97706]/40 hover:bg-[#2a221b]'
          }`}
          title="Click to view Supabase Connection & SQL Migrations"
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {supabaseConfigured ? 'Supabase Connected' : 'Demo DB Mode'}
          </span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#A3A3A3] hover:text-white rounded-lg hover:bg-[#202020] transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E11D2E] ring-2 ring-[#141414]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#181818] border border-[#303030] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 border-b border-[#2b2b2b] flex items-center justify-between bg-[#1f1f1f]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Alerts & Reminders</span>
                  <span className="px-2 py-0.5 text-[10px] bg-[#E11D2E] text-white rounded-full font-bold">
                    {unreadCount}
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[#737373] hover:text-white p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#262626]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#737373]">
                    No active alerts or reminders.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div key={item.id} className="p-3 hover:bg-[#222222] transition-colors flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        {item.type === 'expiry' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        ) : item.type === 'overdue' ? (
                          <AlertTriangle className="w-4 h-4 text-[#E11D2E] shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-white leading-tight">{item.title}</p>
                          <p className="text-[11px] text-[#A3A3A3] mt-0.5 leading-snug">{item.message}</p>
                          <p className="text-[10px] text-[#666666] mt-1">{item.timestamp}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onDismissNotification(item.id)}
                        className="text-[#737373] hover:text-white p-1 rounded"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Member button */}
        <button
          onClick={onQuickAddMember}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E11D2E] hover:bg-[#c91424] text-white rounded-lg text-xs font-semibold shadow-md shadow-[#E11D2E]/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Member</span>
        </button>
      </div>
    </header>
  );
};
