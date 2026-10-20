/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './features/auth/LoginScreen';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './features/dashboard/DashboardView';
import { MembersView } from './features/members/MembersView';
import { AttendanceView } from './features/attendance/AttendanceView';
import { DuesView } from './features/dues/DuesView';
import { PaymentsView } from './features/payments/PaymentsView';
import { PlansView } from './features/plans/PlansView';
import { ReportsView } from './features/reports/ReportsView';
import { SettingsView } from './features/settings/SettingsView';

import { AddMemberModal } from './components/modals/AddMemberModal';
import { RecordPaymentModal } from './components/modals/RecordPaymentModal';
import { RenewMembershipModal } from './components/modals/RenewMembershipModal';
import { MemberDetailsModal } from './components/modals/MemberDetailsModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { SupabaseSetupModal } from './components/modals/SupabaseSetupModal';

import { Member, MembershipPlan, Payment, Attendance, GymSettings, NotificationItem } from './types';
import { dbService } from './services/dbService';
import { categorizeMemberStatus } from './lib/calculations';

function GymAppContent() {
  const { user, loading } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Core Data State
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Modals state
  const [showAddMember, setShowAddMember] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [preselectedPaymentMemberId, setPreselectedPaymentMemberId] = useState<string | undefined>(undefined);
  const [renewingMember, setRenewingMember] = useState<Member | null>(null);
  const [inspectingMember, setInspectingMember] = useState<Member | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Fetch all core records
  const refreshData = useCallback(async () => {
    try {
      const [allMembers, allPlans, allPayments, allAttendance, gymSettings] = await Promise.all([
        dbService.getMembers(),
        dbService.getPlans(),
        dbService.getPayments(),
        dbService.getAttendance(),
        dbService.getSettings()
      ]);

      setMembers(allMembers);
      setPlans(allPlans);
      setPayments(allPayments);
      setAttendance(allAttendance);
      setSettings(gymSettings);

      // Generate in-app notifications
      const todayDateStr = new Date().toISOString().split('T')[0];
      const items: NotificationItem[] = [];

      allMembers.forEach(m => {
        if (m.status !== 'archived') {
          const { isExpiringSoon, isExpired, isOverdue } = categorizeMemberStatus({
            expiryDate: m.current_expiry_date || m.join_date,
            todayDate: todayDateStr,
            balance: m.outstanding_balance || 0,
            reminderDays: 7
          });

          if (isExpiringSoon && !isExpired) {
            items.push({
              id: `notif-exp-${m.id}`,
              type: 'expiry',
              title: `Membership Expiring: ${m.full_name}`,
              message: `Membership expires on ${m.current_expiry_date}. Follow up for renewal.`,
              timestamp: 'Upcoming',
              read: false,
              member_id: m.id
            });
          }

          if (isOverdue && m.outstanding_balance && m.outstanding_balance > 0) {
            items.push({
              id: `notif-due-${m.id}`,
              type: 'overdue',
              title: `Overdue Balance: ${m.full_name}`,
              message: `Outstanding fee of ₹${m.outstanding_balance} pending. Send WhatsApp reminder.`,
              timestamp: 'Due now',
              read: false,
              member_id: m.id
            });
          }
        }
      });

      setNotifications(items.slice(0, 10));
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Auth loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#E11D2E] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#A3A3A3] font-medium font-poppins">Loading The Wellness Warriors Gym...</p>
        </div>
      </div>
    );
  }

  // Not authenticated -> show Login Screen
  if (!user) {
    return <LoginScreen onOpenSupabaseModal={() => setShowSupabaseModal(true)} />;
  }

  // Count due members
  const dueCount = members.filter(m => (m.outstanding_balance || 0) > 0 && m.status !== 'archived').length;

  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Operations Dashboard', subtitle: 'The Wellness Warriors Gym • Jalpaiguri, West Bengal' },
    members: { title: 'Member Directory', subtitle: 'Search, filter, view profiles and renew memberships' },
    attendance: { title: 'Daily Attendance', subtitle: 'Fast lookup and check-in terminal with timestamp logs' },
    dues: { title: 'Due & Overdue Balances', subtitle: 'Financial follow-ups and WhatsApp reminders' },
    payments: { title: 'Fee Collection & Receipts', subtitle: 'Record transactions and print official gym receipts' },
    plans: { title: 'Membership Plans', subtitle: 'Configure durations, pricing, admission fees, and add-ons' },
    reports: { title: 'Reports & Analytics', subtitle: 'Financial collections, member demographics, and CSV exports' },
    settings: { title: 'System Settings', subtitle: 'Gym location, phone, operating hours, and Supabase database' }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col lg:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        dueCount={dueCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Sticky Header */}
        <Header
          setMobileOpen={setMobileOpen}
          title={tabTitles[activeTab].title}
          subtitle={tabTitles[activeTab].subtitle}
          onQuickAddMember={() => setShowAddMember(true)}
          onOpenSupabaseModal={() => setShowSupabaseModal(true)}
          notifications={notifications}
          onDismissNotification={handleDismissNotification}
        />

        {/* Tab View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {dataLoading ? (
            <div className="p-12 text-center text-xs text-[#737373]">
              Loading system records...
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  members={members}
                  payments={payments}
                  attendance={attendance}
                  plans={plans}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenAddMember={() => setShowAddMember(true)}
                  onOpenRecordPayment={(memId) => {
                    setPreselectedPaymentMemberId(memId);
                    setShowRecordPayment(true);
                  }}
                  onSelectMember={(mem) => setInspectingMember(mem)}
                  onViewReceipt={(p) => setActiveReceipt(p)}
                />
              )}

              {activeTab === 'members' && (
                <MembersView
                  members={members}
                  plans={plans}
                  onOpenAddMember={() => setShowAddMember(true)}
                  onSelectMember={(mem) => setInspectingMember(mem)}
                  onRecordPayment={(memId) => {
                    setPreselectedPaymentMemberId(memId);
                    setShowRecordPayment(true);
                  }}
                  onRenewMember={(mem) => setRenewingMember(mem)}
                  onMarkAttendance={async (mem) => {
                    setActiveTab('attendance');
                  }}
                  onArchiveMember={async (memId) => {
                    await dbService.archiveMember(memId);
                    refreshData();
                  }}
                />
              )}

              {activeTab === 'attendance' && (
                <AttendanceView
                  members={members}
                  attendance={attendance}
                  onAttendanceUpdated={refreshData}
                />
              )}

              {activeTab === 'dues' && (
                <DuesView
                  members={members}
                  payments={payments}
                  onRecordPayment={(memId) => {
                    setPreselectedPaymentMemberId(memId);
                    setShowRecordPayment(true);
                  }}
                  onSelectMember={(mem) => setInspectingMember(mem)}
                  gymPhone={settings?.phone}
                  gymName={settings?.gym_name}
                />
              )}

              {activeTab === 'payments' && (
                <PaymentsView
                  payments={payments}
                  members={members}
                  onOpenRecordPayment={() => {
                    setPreselectedPaymentMemberId(undefined);
                    setShowRecordPayment(true);
                  }}
                  onViewReceipt={(p) => setActiveReceipt(p)}
                />
              )}

              {activeTab === 'plans' && (
                <PlansView
                  plans={plans}
                  members={members}
                  onPlansUpdated={refreshData}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  members={members}
                  payments={payments}
                  attendance={attendance}
                  plans={plans}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  onOpenSupabaseModal={() => setShowSupabaseModal(true)}
                  onSettingsSaved={refreshData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        plans={plans}
        onMemberAdded={(newMem, initialPay) => {
          refreshData();
          if (initialPay) {
            setActiveReceipt(initialPay);
          }
        }}
      />

      {/* 2. Record Payment Modal */}
      <RecordPaymentModal
        isOpen={showRecordPayment}
        onClose={() => {
          setShowRecordPayment(false);
          setPreselectedPaymentMemberId(undefined);
        }}
        members={members}
        preselectedMemberId={preselectedPaymentMemberId}
        onPaymentSuccess={(newPayment) => {
          refreshData();
          setActiveReceipt(newPayment);
        }}
      />

      {/* 3. Renew Membership Modal */}
      <RenewMembershipModal
        isOpen={Boolean(renewingMember)}
        onClose={() => setRenewingMember(null)}
        member={renewingMember}
        plans={plans}
        onRenewalSuccess={(payment) => {
          refreshData();
          if (payment) {
            setActiveReceipt(payment);
          }
        }}
      />

      {/* 4. Member Details Modal */}
      <MemberDetailsModal
        member={inspectingMember}
        isOpen={Boolean(inspectingMember)}
        onClose={() => setInspectingMember(null)}
        onRecordPayment={(memId) => {
          setInspectingMember(null);
          setPreselectedPaymentMemberId(memId);
          setShowRecordPayment(true);
        }}
        onRenewMembership={(mem) => {
          setInspectingMember(null);
          setRenewingMember(mem);
        }}
        onMarkAttendance={(mem) => {
          setInspectingMember(null);
          setActiveTab('attendance');
        }}
        onViewReceipt={(p) => {
          setActiveReceipt(p);
        }}
        onArchiveMember={async (memId) => {
          await dbService.archiveMember(memId);
          refreshData();
        }}
      />

      {/* 5. Printable Receipt Modal */}
      <ReceiptModal
        payment={activeReceipt}
        isOpen={Boolean(activeReceipt)}
        onClose={() => setActiveReceipt(null)}
        gymSettings={settings || undefined}
      />

      {/* 6. Supabase Setup Modal */}
      <SupabaseSetupModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GymAppContent />
    </AuthProvider>
  );
}
