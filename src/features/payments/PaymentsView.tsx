import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Printer, 
  Calendar, 
  IndianRupee, 
  Filter, 
  ArrowUpDown,
  Download
} from 'lucide-react';
import { Payment, Member } from '../../types';
import { formatCurrencyINR } from '../../lib/calculations';

interface PaymentsViewProps {
  payments: Payment[];
  members: Member[];
  onOpenRecordPayment: () => void;
  onViewReceipt: (payment: Payment) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  members,
  onOpenRecordPayment,
  onViewReceipt
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'Cash' | 'UPI'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Enriched payments with member names
  const enrichedPayments = useMemo(() => {
    return payments.map(p => {
      const member = members.find(m => m.id === p.member_id);
      return {
        ...p,
        member_name: member?.full_name || 'Member',
        member_code: member?.member_code || 'N/A',
        member_phone: member?.phone || 'N/A',
        remaining_balance: member?.outstanding_balance || 0
      };
    });
  }, [payments, members]);

  // Filtering
  const filteredPayments = useMemo(() => {
    return enrichedPayments.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = 
        !q ||
        p.receipt_number.toLowerCase().includes(q) ||
        p.member_name.toLowerCase().includes(q) ||
        p.member_code.toLowerCase().includes(q) ||
        (p.transaction_ref && p.transaction_ref.toLowerCase().includes(q));

      const matchesMethod = methodFilter === 'all' || p.payment_method === methodFilter;
      const matchesCategory = categoryFilter === 'all' || p.fee_category === categoryFilter;

      let matchesDate = true;
      if (startDate && p.payment_date < startDate) matchesDate = false;
      if (endDate && p.payment_date > endDate) matchesDate = false;

      return matchesQuery && matchesMethod && matchesCategory && matchesDate;
    });
  }, [enrichedPayments, searchQuery, methodFilter, categoryFilter, startDate, endDate]);

  const totalCollectedInFilter = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [filteredPayments]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage]);

  const handleExportCSV = () => {
    const rows = [
      ['Receipt No', 'Member Name', 'Member ID', 'Payment Date', 'Amount (INR)', 'Method', 'Category', 'Transaction Ref', 'Recorded By']
    ];
    filteredPayments.forEach(p => {
      rows.push([
        p.receipt_number,
        `"${p.member_name}"`,
        p.member_code,
        p.payment_date,
        p.amount.toString(),
        p.payment_method,
        p.fee_category,
        `"${p.transaction_ref || ''}"`,
        p.recorded_by
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wellness_warriors_payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white font-poppins flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#E11D2E]" />
              Fee Collection & Payment Receipts
            </h3>
            <p className="text-xs text-[#A3A3A3]">
              All official gym transactions, invoices, and instant printable receipts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#121212] px-4 py-2 rounded-xl border border-[#333333] text-right">
              <span className="text-[10px] uppercase font-bold text-[#A3A3A3] block">Collected in View</span>
              <span className="text-xl font-extrabold text-emerald-400 font-poppins">
                {formatCurrencyINR(totalCollectedInFilter)}
              </span>
            </div>
            <button
              onClick={onOpenRecordPayment}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#E11D2E] hover:bg-[#c91424] text-white rounded-lg text-xs font-semibold shadow-md shadow-[#E11D2E]/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
              placeholder="Search receipt #, member name, or UPI ref..."
              className="w-full bg-[#121212] border border-[#333333] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
            />
          </div>

          <div>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
            >
              <option value="all">All Payment Modes</option>
              <option value="Cash">Cash Payments</option>
              <option value="UPI">UPI Digital Payments</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#121212] border border-[#333333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E]"
            >
              <option value="all">All Fee Categories</option>
              <option value="combined">Combined Package</option>
              <option value="membership">Membership Fee</option>
              <option value="admission">Admission Fee</option>
              <option value="personal_training">Personal Training</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="bg-[#181818] border border-[#2b2b2b] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1f1f1f] text-[#A3A3A3] uppercase text-[10px] font-bold tracking-wider border-b border-[#2b2b2b]">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-3">Member Name</th>
                <th className="py-3 px-3">Payment Date</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3 text-right">Amount Received</th>
                <th className="py-3 px-3 text-right">Remaining Balance</th>
                <th className="py-3 px-3">Recorded By</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#737373]">
                    No payments match your search filters.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-[#202020] transition-colors">
                    {/* Receipt No */}
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {p.receipt_number}
                    </td>

                    {/* Member */}
                    <td className="py-3 px-3">
                      <p className="font-semibold text-white">{p.member_name}</p>
                      <span className="font-mono text-[10px] text-[#A3A3A3]">{p.member_code}</span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-[#d4d4d4]">
                      {p.payment_date}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 capitalize text-[#A3A3A3]">
                      {p.fee_category.replace('_', ' ')}
                    </td>

                    {/* Method */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#262626] text-white">
                        {p.payment_method}
                      </span>
                      {p.transaction_ref && (
                        <p className="text-[10px] font-mono text-[#737373] mt-0.5">{p.transaction_ref}</p>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-sm text-emerald-400">
                        {formatCurrencyINR(p.amount)}
                      </span>
                    </td>

                    {/* Remaining */}
                    <td className="py-3 px-3 text-right">
                      <span className={`font-semibold ${
                        (p.remaining_balance || 0) > 0 ? 'text-[#E11D2E]' : 'text-gray-400'
                      }`}>
                        {formatCurrencyINR(p.remaining_balance || 0)}
                      </span>
                    </td>

                    {/* Recorded By */}
                    <td className="py-3 px-3 text-[#737373]">
                      {p.recorded_by}
                    </td>

                    {/* View/Print Receipt */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onViewReceipt(p)}
                        className="px-2.5 py-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded-lg transition-colors flex items-center gap-1.5 text-[11px] font-medium mx-auto"
                        title="View & Print Official Receipt"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#E11D2E]" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-[#141414] border-t border-[#262626] flex items-center justify-between text-xs text-[#A3A3A3]">
          <span>
            Showing {paginated.length} of {filteredPayments.length} payment(s)
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
