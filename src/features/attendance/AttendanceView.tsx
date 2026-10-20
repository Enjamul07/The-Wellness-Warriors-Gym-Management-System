import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Clock, 
  User, 
  ShieldAlert,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Member, Attendance } from '../../types';
import { dbService } from '../../services/dbService';
import { checkDailyAttendanceEligibility } from '../../lib/calculations';

interface AttendanceViewProps {
  members: Member[];
  attendance: Attendance[];
  onAttendanceUpdated: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  members,
  attendance,
  onAttendanceUpdated
}) => {
  const [lookupQuery, setLookupQuery] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter attendance history
  const [filterDate, setFilterDate] = useState('');

  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];

  // Kolkata formatted time string (e.g. 06:45:00)
  const currentTimeKolkata = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);

  // Filter members matching lookup
  const matchedMembers = useMemo(() => {
    if (!lookupQuery.trim()) return [];
    const q = lookupQuery.toLowerCase().trim();
    return members.filter(
      m => m.full_name.toLowerCase().includes(q) ||
           m.phone.includes(q) ||
           m.member_code.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [members, lookupQuery]);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Check check-in eligibility for selected member
  const eligibility = useMemo(() => {
    if (!selectedMember) return null;
    const isExpired = selectedMember.current_expiry_date ? selectedMember.current_expiry_date < todayDateStr : false;
    const hasCheckedInToday = attendance.some(
      a => a.member_id === selectedMember.id && a.check_in_date === todayDateStr
    );

    return checkDailyAttendanceEligibility({
      isExpired,
      hasAlreadyCheckedInToday: hasCheckedInToday,
      memberStatus: selectedMember.status
    });
  }, [selectedMember, attendance, todayDateStr]);

  const handleSelectMember = (mem: Member) => {
    setSelectedMember(mem);
    setLookupQuery('');
    setFeedback(null);
    setShowOverrideInput(false);
    setOverrideReason('');
  };

  const handleCheckIn = async () => {
    if (!selectedMember || !eligibility) return;
    setFeedback(null);

    // If duplicate check-in
    if (!eligibility.allowed && !eligibility.requiresOverrideReason) {
      setFeedback({ type: 'error', message: eligibility.warning || 'Attendance not allowed' });
      return;
    }

    // If requires override reason and not yet provided
    if (eligibility.requiresOverrideReason && !overrideReason.trim()) {
      setShowOverrideInput(true);
      setFeedback({
        type: 'error',
        message: 'Membership is expired. Please enter an authorized override reason before checking in.'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await dbService.recordAttendance({
        member_id: selectedMember.id,
        check_in_date: todayDateStr,
        check_in_time: currentTimeKolkata,
        status: eligibility.requiresOverrideReason ? 'overridden' : 'present',
        override_reason: overrideReason.trim() || undefined,
        recorded_by: 'Gym Administrator'
      });

      setFeedback({
        type: 'success',
        message: `Check-in confirmed for ${selectedMember.full_name} at ${currentTimeKolkata} (IST).`
      });

      setSelectedMember(null);
      setOverrideReason('');
      setShowOverrideInput(false);
      onAttendanceUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Check-in failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered attendance list
  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => {
      if (!filterDate) return true;
      return a.check_in_date === filterDate;
    });
  }, [attendance, filterDate]);

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Time (IST)', 'Member Code', 'Member Name', 'Status', 'Override Reason', 'Recorded By']
    ];

    filteredAttendance.forEach(a => {
      const mem = members.find(m => m.id === a.member_id);
      rows.push([
        a.check_in_date,
        a.check_in_time,
        mem?.member_code || 'N/A',
        `"${mem?.full_name || 'Member'}"`,
        a.status,
        `"${a.override_reason || ''}"`,
        a.recorded_by
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wellness_warriors_attendance_${filterDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Fast Check-In Terminal */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white font-poppins flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#E11D2E]" />
              Fast Daily Attendance Check-In
            </h3>
            <p className="text-xs text-[#A3A3A3]">
              Lookup member by name, phone (+91), or member ID • Asia/Kolkata timezone
            </p>
          </div>
          <div className="px-3 py-1 bg-[#121212] border border-[#303030] rounded-lg text-xs font-mono text-emerald-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Kolkata Time: {currentTimeKolkata}</span>
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className={`mb-4 p-3.5 rounded-lg text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#E11D2E]" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Search Input with Autocomplete Dropdown */}
        <div className="relative mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737373]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Search athlete to check in (e.g. Rahul Das or 9832011223 or WWG-1001)..."
              className="w-full bg-[#121212] border border-[#383838] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#737373] focus:outline-none focus:border-[#E11D2E] shadow-inner"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {matchedMembers.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-[#1f1f1f] border border-[#383838] rounded-xl shadow-2xl z-30 overflow-hidden divide-y divide-[#2a2a2a]">
              {matchedMembers.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectMember(m)}
                  className="p-3 hover:bg-[#282828] cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={m.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=faces'}
                      alt={m.full_name}
                      className="w-8 h-8 rounded-full object-cover border border-[#444444]"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{m.full_name}</p>
                      <p className="text-[11px] text-[#A3A3A3]">
                        {m.member_code} • {m.phone} • Plan: {m.current_plan_name || 'Standard'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#E11D2E] font-semibold flex items-center gap-1">
                    Select <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Member Check-In Terminal Card */}
        {selectedMember && (
          <div className="bg-[#121212] border border-[#333333] rounded-xl p-4 sm:p-5 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedMember.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=faces'}
                  alt={selectedMember.full_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#E11D2E] shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white font-poppins">{selectedMember.full_name}</h4>
                    <span className="font-mono text-xs px-2 py-0.5 bg-[#202020] rounded border border-[#333333] text-gray-300">
                      {selectedMember.member_code}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-1.5 text-xs text-[#A3A3A3]">
                    <p>Phone: <span className="text-white font-mono">{selectedMember.phone}</span></p>
                    <p>Plan: <span className="text-white font-medium">{selectedMember.current_plan_name}</span></p>
                    <p>Expiry: <span className={`font-semibold ${
                      selectedMember.current_expiry_date && selectedMember.current_expiry_date < todayDateStr
                        ? 'text-[#E11D2E]'
                        : 'text-emerald-400'
                    }`}>
                      {selectedMember.current_expiry_date || 'N/A'}
                    </span></p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCheckIn}
                  disabled={isSubmitting || (eligibility ? !eligibility.allowed && !eligibility.requiresOverrideReason : false)}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 ${
                    eligibility && !eligibility.allowed && !eligibility.requiresOverrideReason
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'Recording Check-In...' : 'Confirm Check In'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="text-xs text-[#737373] hover:text-white underline text-center"
                >
                  Cancel selection
                </button>
              </div>
            </div>

            {/* Warning or Override Notice */}
            {eligibility && eligibility.warning && (
              <div className="mt-4 p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg text-xs text-amber-300 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>{eligibility.warning}</span>
                </div>
                {eligibility.requiresOverrideReason && (
                  <div>
                    <label className="block text-[11px] text-[#A3A3A3] mb-1 font-semibold">
                      Authorized Override Reason * (e.g. Promised renewal tomorrow / Guest pass)
                    </label>
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Enter administrator override reason..."
                      className="w-full bg-[#181818] border border-[#444444] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attendance History Section */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#262626] flex flex-wrap items-center justify-between gap-3 bg-[#1f1f1f]">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-poppins">
              Attendance Records Log ({filteredAttendance.length})
            </h4>
            <p className="text-[11px] text-[#A3A3A3]">Recorded timestamps & staff verification</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-[#141414] border border-[#333333] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-[#A3A3A3] hover:text-white underline"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141414] text-[#A3A3A3] uppercase text-[10px] font-bold tracking-wider border-b border-[#262626]">
              <tr>
                <th className="py-2.5 px-4">Member Name</th>
                <th className="py-2.5 px-3">Member ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Time (IST)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Override Reason</th>
                <th className="py-2.5 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#737373]">
                    No attendance records found for this date.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((a) => {
                  const mem = members.find(m => m.id === a.member_id);
                  return (
                    <tr key={a.id} className="hover:bg-[#202020] transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        {mem?.full_name || 'Member'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#A3A3A3]">
                        {mem?.member_code || 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-[#d4d4d4]">
                        {a.check_in_date}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-emerald-400">
                        {a.check_in_time}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          a.status === 'overridden' ? 'bg-amber-950/60 text-amber-400' : 'bg-emerald-950/60 text-emerald-400'
                        }`}>
                          {a.status === 'overridden' ? 'Override' : 'Present'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#A3A3A3] italic">
                        {a.override_reason || '-'}
                      </td>
                      <td className="py-3 px-4 text-[#737373]">
                        {a.recorded_by}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
