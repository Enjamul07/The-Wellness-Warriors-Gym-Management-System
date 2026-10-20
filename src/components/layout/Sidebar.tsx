import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  CreditCard, 
  AlertCircle, 
  CalendarCheck, 
  BarChart3, 
  Settings, 
  LogOut, 
  Dumbbell,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab = 
  | 'dashboard' 
  | 'members' 
  | 'plans' 
  | 'payments' 
  | 'dues' 
  | 'attendance' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  dueCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  dueCount
}) => {
  const { user, logout, isDemo } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members' as NavTab, label: 'Members', icon: Users },
    { id: 'attendance' as NavTab, label: 'Daily Attendance', icon: CalendarCheck },
    { id: 'dues' as NavTab, label: 'Due & Overdue', icon: AlertCircle, badge: dueCount > 0 ? dueCount : undefined },
    { id: 'payments' as NavTab, label: 'Fee Collection', icon: CreditCard },
    { id: 'plans' as NavTab, label: 'Membership Plans', icon: Layers },
    { id: 'reports' as NavTab, label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'Settings & Supabase', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#141414] border-r border-[#262626] flex flex-col transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E11D2E] flex items-center justify-center text-white shadow-lg shadow-[#E11D2E]/20">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight uppercase leading-tight font-poppins">
                The Wellness<br />
                <span className="text-[#E11D2E]">Warriors Gym</span>
              </h1>
              <p className="text-[10px] text-[#A3A3A3] mt-0.5">Jalpaiguri, WB</p>
            </div>
          </div>
        </div>

        {/* Demo Mode Notice */}
        {isDemo && (
          <div className="mx-4 mt-3 px-3 py-1.5 bg-[#221c16] border border-[#d97706]/40 rounded-md flex items-center gap-2 text-xs text-[#fbbf24]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#f59e0b]" />
            <span className="text-[11px] font-medium leading-tight">Admin Demo Session</span>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#E11D2E] text-white shadow-md shadow-[#E11D2E]/25 font-semibold'
                    : 'text-[#A3A3A3] hover:text-white hover:bg-[#1f1f1f]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#737373]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                    isActive ? 'bg-white text-[#E11D2E]' : 'bg-[#E11D2E]/20 text-[#E11D2E] border border-[#E11D2E]/40'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin Footer Profile */}
        <div className="p-4 border-t border-[#262626] bg-[#0F0F0F]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#262626] border border-[#383838] flex items-center justify-center text-xs font-semibold text-white">
                AD
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Administrator'}</p>
                <p className="text-[10px] text-[#A3A3A3] truncate">{user?.email || 'admin@wellnesswarriors.gym'}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 text-[#A3A3A3] hover:text-[#E11D2E] hover:bg-[#1a1a1a] rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
