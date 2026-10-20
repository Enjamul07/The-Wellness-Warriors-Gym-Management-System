import React from 'react';
import { X, Printer, Download, Dumbbell, CheckCircle2 } from 'lucide-react';
import { Payment } from '../../types';
import { formatCurrencyINR } from '../../lib/calculations';

interface ReceiptModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  gymSettings?: {
    gym_name: string;
    location: string;
    phone: string;
    receipt_footer_note: string;
  };
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  isOpen,
  onClose,
  gymSettings
}) => {
  if (!isOpen || !payment) return null;

  const gymName = gymSettings?.gym_name || 'The Wellness Warriors Gym';
  const gymLocation = gymSettings?.location || 'Club Road, Near Kadamtala, Jalpaiguri, West Bengal 735101, India';
  const gymPhone = gymSettings?.phone || '+91 7872103454';
  const footerNote = gymSettings?.receipt_footer_note || 'Stay Strong, Stay Healthy! Fees once paid are non-refundable.';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#181818] border border-[#303030] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Action Bar (Hidden during print) */}
        <div className="no-print p-4 border-b border-[#2b2b2b] flex items-center justify-between bg-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-poppins">Official Fee Receipt</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E11D2E] hover:bg-[#c91424] text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#737373] hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Container (Formatted for high-contrast on screen and paper) */}
        <div className="print-container p-6 bg-white text-black font-sans text-xs">
          
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-4">
            <div className="inline-flex items-center justify-center gap-2 mb-1">
              <span className="w-6 h-6 bg-[#E11D2E] text-white rounded flex items-center justify-center font-bold text-xs">
                WW
              </span>
              <h1 className="text-lg font-black uppercase tracking-tight font-poppins text-black">
                {gymName}
              </h1>
            </div>
            <p className="text-[11px] text-gray-700">{gymLocation}</p>
            <p className="text-[11px] font-semibold text-gray-900 mt-0.5">Phone: {gymPhone}</p>
            <div className="inline-block mt-2 px-3 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-bold uppercase tracking-wider">
              Payment Receipt
            </div>
          </div>

          {/* Receipt Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-xs pb-3 border-b border-gray-200">
            <div>
              <p className="text-gray-500 text-[10px] uppercase font-bold">Receipt Number</p>
              <p className="font-mono font-bold text-sm text-black">{payment.receipt_number}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-[10px] uppercase font-bold">Date of Payment</p>
              <p className="font-semibold text-black">{payment.payment_date}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] uppercase font-bold">Member Name</p>
              <p className="font-bold text-black">{payment.member_name || 'Member'}</p>
              {payment.member_code && (
                <p className="text-[10px] text-gray-600 font-mono">ID: {payment.member_code}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-[10px] uppercase font-bold">Phone Number</p>
              <p className="font-semibold text-black">{payment.member_phone || 'N/A'}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left mb-4 border-collapse">
            <thead>
              <tr className="border-b border-black text-[10px] uppercase font-bold text-gray-700">
                <th className="py-1">Description / Category</th>
                <th className="py-1">Payment Mode</th>
                <th className="py-1 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              <tr>
                <td className="py-2.5 capitalize font-medium text-black">
                  {payment.fee_category.replace('_', ' ')}
                  {payment.notes && <span className="block text-[10px] text-gray-500">{payment.notes}</span>}
                </td>
                <td className="py-2.5 font-medium text-black">
                  {payment.payment_method}
                  {payment.transaction_ref && (
                    <span className="block text-[10px] font-mono text-gray-500">{payment.transaction_ref}</span>
                  )}
                </td>
                <td className="py-2.5 text-right font-bold text-sm text-black">
                  {formatCurrencyINR(payment.amount)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Totals & Outstanding */}
          <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-5">
            <div className="flex justify-between items-center text-sm font-bold text-black">
              <span>Total Received:</span>
              <span className="text-base text-[#E11D2E]">{formatCurrencyINR(payment.amount)}</span>
            </div>
            {payment.remaining_balance !== undefined && (
              <div className="flex justify-between items-center text-xs text-gray-600 mt-1 pt-1 border-t border-gray-200">
                <span>Remaining Member Balance:</span>
                <span className={`font-semibold ${payment.remaining_balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {formatCurrencyINR(payment.remaining_balance)}
                </span>
              </div>
            )}
          </div>

          {/* Signature and Footer Note */}
          <div className="flex justify-between items-end pt-4 mb-2">
            <div className="text-[10px] text-gray-500">
              <p>Generated by: <strong>{payment.recorded_by || 'Administrator'}</strong></p>
              <p>System Timestamp: {new Date().toLocaleTimeString('en-IN')}</p>
            </div>
            <div className="text-center w-36">
              <div className="border-b border-black pb-1 mb-1"></div>
              <p className="text-[10px] font-bold uppercase text-gray-800">Authorized Signatory</p>
              <p className="text-[9px] text-gray-500">{gymName}</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-500 pt-3 border-t border-gray-200">
            {footerNote}
          </div>
        </div>

        {/* Modal Bottom Close */}
        <div className="no-print p-3 border-t border-[#2b2b2b] bg-[#141414] flex justify-between items-center text-xs text-[#A3A3A3]">
          <span>Tip: Use browser print dialog to save as PDF directly.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
