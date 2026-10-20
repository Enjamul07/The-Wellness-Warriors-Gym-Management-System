import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Eye, 
  CreditCard, 
  RefreshCw, 
  CalendarCheck, 
  Archive, 
  Clock, 
  ArrowUpDown,
  MoreVertical
} from 'lucide-react';
import { Member, MembershipPlan } from '../../types';
import { formatCurrencyINR } from '../../lib/calculations';

interface MembersViewProps {
  members: Member[];
  plans: MembershipPlan[];
  onOpenAddMember: () => void;
  onSelectMember: (member: Member) => void;
  onRecordPayment: (memberId: string) => void;
  onRenewMember: (member: Member) => void;
  onMarkAttendance: (member: Member) => void;
  onArchiveMember: (memberId: string) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  plans,
  onOpenAddMember,
  onSelectMember,
  onRecordPayment,
  onRenewMember,
  onMarkAttendance,
  onArchiveMember
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'archived'>('all');
  const [dueFilter, setDueFilter] = useState<'all' | 'has_due' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'join_date' | 'expiry_date' | 'name' | 'due'>('join_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const todayIso = new Date().toISOString().split('T')[0];

  // Filtering and Sorting logic
  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        // Search by name, phone, or code
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          !query ||
          m.full_name.toLowerCase().includes(query) ||
          m.phone.includes(query) ||
          m.member_code.toLowerCase().includes(query);

        // Plan filter
        const matchesPlan = 
          selectedPlanFilter === 'all' || 
          m.current_plan_name?.toLowerCase() === selectedPlanFilter.toLowerCase();

        // Status filter
        let matchesStatus = true;
        const isExpired = m.current_expiry_date ? m.current_expiry_date < todayIso : false;
        if (statusFilter === 'active') {
          matchesStatus = m.status === 'active' && !isExpired;
        } else if (statusFilter === 'expired') {
          matchesStatus = m.status === 'expired' || isExpired;
        } else if (statusFilter === 'archived') {
          matchesStatus = m.status === 'archived';
        }

        // Due filter
        let matchesDue = true;
        const hasDue = (m.outstanding_balance || 0) > 0;
        if (dueFilter === 'has_due') matchesDue = hasDue;
        if (dueFilter === 'paid') matchesDue = !hasDue;

        return matchesQuery && matchesPlan && matchesStatus && matchesDue;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy === 'due' ? 'outstanding_balance' : sortBy === 'name' ? 'full_name' : sortBy === 'expiry_date' ? 'current_expiry_date' : 'join_date'] || '';
        let valB: any = b[sortBy === 'due' ? 'outstanding_balance' : sortBy === 'name' ? 'full_name' : sortBy === 'expiry_date' ? 'current_expiry_date' : 'join_date'] || '';

        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [members, searchQuery, selectedPlanFilter, statusFilter, dueFilter, sortBy, sortOrder, todayIso]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage]);

  const toggleSort = (field: 'join_date' | 'expiry_date' | 'name' | 'due') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Search Bar */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white font-poppins">Member Directory</h3>
            <p className="text-xs text-[#A3A3A3]">
              Manage athletes, renewals, memberships, and records • Jalpaiguri Center
            </p>
          </div>
          <button
            onClick={onOpenAddMember}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E11D2E] hover:bg-[#c91424] text-white rounded-lg text-xs font-semibold shadow-md shadow-[#E11D2E]/25 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Member</span>
          </button>
        </div>

        {/* Search & Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Name, Phone, or ID..."
              className="w-full bg-[#121212] border border-[#333333] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
            />
          </div>

          {/* Plan Filter */}
          <div>
            <select
              value={selectedPlanFilter}
              onChange={(e) => {
                setSelectedPlanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
            >
              <option value="all">All Membership Plans</option>
              {plans.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Members</option>
              <option value="expired">Expired Memberships</option>
              <option value="archived">Archived Members</option>
            </select>
          </div>

          {/* Dues Filter */}
          <div>
            <select
              value={dueFilter}
              onChange={(e) => {
                setDueFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
            >
              <option value="all">All Fee Balances</option>
              <option value="has_due">Has Outstanding Due</option>
              <option value="paid">Fully Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1f1f1f] text-[#A3A3A3] uppercase text-[10px] font-bold tracking-wider border-b border-[#2b2b2b]">
              <tr>
                <th className="py-3 px-4">Member Info</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Membership Plan</th>
                <th 
                  onClick={() => toggleSort('join_date')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Join Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('expiry_date')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Expiry Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Status</th>
                <th 
                  onClick={() => toggleSort('due')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Due Balance</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#737373]">
                    No members match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => {
                  const isExpired = member.current_expiry_date ? member.current_expiry_date < todayIso : false;
                  const hasDue = (member.outstanding_balance || 0) > 0;

                  return (
                    <tr key={member.id} className="hover:bg-[#202020] transition-colors">
                      {/* Member Info */}
                      <td className="py-3 px-4">
                        <div 
                          onClick={() => onSelectMember(member)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <img
                            src={member.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=faces'}
                            alt={member.full_name}
                            className="w-10 h-10 rounded-full object-cover border border-[#333333] group-hover:border-[#E11D2E] transition-colors"
                          />
                          <div>
                            <p className="font-bold text-white group-hover:text-[#E11D2E] transition-colors">
                              {member.full_name}
                            </p>
                            <span className="font-mono text-[10px] text-[#A3A3A3] bg-[#121212] px-1.5 py-0.5 rounded border border-[#2b2b2b]">
                              {member.member_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 font-mono text-[#d4d4d4]">
                        {member.phone}
                      </td>

                      {/* Plan */}
                      <td className="py-3 px-3 font-medium text-white">
                        {member.current_plan_name || 'Standard'}
                      </td>

                      {/* Join Date */}
                      <td className="py-3 px-3 text-[#A3A3A3]">
                        {member.join_date}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3 px-3">
                        <span className={`font-semibold ${isExpired ? 'text-[#E11D2E]' : 'text-emerald-400'}`}>
                          {member.current_expiry_date || 'N/A'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          member.status === 'archived'
                            ? 'bg-zinc-800 text-zinc-400'
                            : isExpired
                            ? 'bg-red-950/60 text-[#E11D2E] border border-red-500/30'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {member.status === 'archived' ? 'Archived' : isExpired ? 'Expired' : 'Active'}
                        </span>
                      </td>

                      {/* Due Balance */}
                      <td className="py-3 px-3 text-right">
                        <span className={`font-bold ${hasDue ? 'text-[#E11D2E]' : 'text-emerald-400'}`}>
                          {formatCurrencyINR(member.outstanding_balance || 0)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectMember(member)}
                            className="p-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded transition-colors"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onRecordPayment(member.id)}
                            className="p-1.5 bg-[#262626] hover:bg-[#333333] text-[#f59e0b] rounded transition-colors"
                            title="Record Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onRenewMember(member)}
                            className="p-1.5 bg-[#262626] hover:bg-[#333333] text-[#E11D2E] rounded transition-colors"
                            title="Renew Plan"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onMarkAttendance(member)}
                            className="p-1.5 bg-[#262626] hover:bg-[#333333] text-emerald-400 rounded transition-colors"
                            title="Mark Attendance"
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-[#141414] border-t border-[#262626] flex items-center justify-between text-xs text-[#A3A3A3]">
          <span>
            Showing {paginatedMembers.length} of {filteredMembers.length} member(s)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-[#262626] hover:bg-[#333333] disabled:opacity-40 text-white rounded transition-colors"
            >
              Previous
            </button>
            <span className="font-medium text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-[#262626] hover:bg-[#333333] disabled:opacity-40 text-white rounded transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
