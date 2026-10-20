import React, { useState } from 'react';
import { formatCurrencyINR } from '../../lib/calculations';

// 1. Monthly Fee Collection Area Chart (Pure SVG)
interface MonthlyCollectionChartProps {
  data: { month: string; collection: number }[];
}

export const MonthlyCollectionChart: React.FC<MonthlyCollectionChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const height = 200;
  const width = 500;
  const paddingX = 40;
  const paddingY = 25;

  const maxVal = Math.max(...data.map(d => d.collection), 15000);

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (d.collection / maxVal) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    return `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="w-full">
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-52 overflow-visible">
          <defs>
            <linearGradient id="gymRedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E11D2E" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#E11D2E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - paddingY - pct * (height - paddingY * 2);
            const val = Math.round((pct * maxVal) / 1000);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#262626"
                  strokeDasharray="4 4"
                />
                <text x={paddingX - 8} y={y + 3} textAnchor="end" fill="#737373" fontSize="10">
                  ₹{val}k
                </text>
              </g>
            );
          })}

          {/* Gradient Area */}
          <path d={areaD} fill="url(#gymRedGrad)" />

          {/* Stroke Line */}
          <path d={pathD} fill="none" stroke="#E11D2E" strokeWidth="2.5" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : 4}
                fill={hoveredIndex === i ? '#ffffff' : '#E11D2E'}
                stroke="#181818"
                strokeWidth="2"
                className="transition-all"
              />
              <text x={p.x} y={height - 6} textAnchor="middle" fill="#A3A3A3" fontSize="11" fontWeight="500">
                {p.month}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute -top-3 bg-[#1e1e1e] border border-[#333333] px-3 py-1.5 rounded-lg shadow-xl text-xs pointer-events-none transform -translate-x-1/2 transition-all"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`
            }}
          >
            <p className="font-semibold text-white">{points[hoveredIndex].month} 2026</p>
            <p className="text-[#E11D2E] font-bold">{formatCurrencyINR(points[hoveredIndex].collection)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Membership Plan Donut Chart (Pure SVG)
interface PlanDistributionChartProps {
  data: { name: string; value: number }[];
}

const PALETTE = ['#E11D2E', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export const PlanDistributionChart: React.FC<PlanDistributionChartProps> = ({ data }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = 65;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
          {data.map((item, idx) => {
            const strokeDasharray = `${(item.value / total) * circumference} ${circumference}`;
            const strokeDashoffset = -accumulated;
            accumulated += (item.value / total) * circumference;

            return (
              <circle
                key={idx}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={PALETTE[idx % PALETTE.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
        <div className="absolute text-center">
          <span className="text-xl font-extrabold text-white font-poppins">{total}</span>
          <span className="block text-[10px] text-[#A3A3A3] uppercase tracking-wider">Members</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2.5 mt-3">
        {data.map((item, idx) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
            <span className="text-[#A3A3A3] text-[11px]">{item.name} ({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Payment Method Split Chart (Pure SVG)
interface PaymentMethodSplitChartProps {
  cash: number;
  upi: number;
}

export const PaymentMethodSplitChart: React.FC<PaymentMethodSplitChartProps> = ({ cash, upi }) => {
  const total = cash + upi || 1;
  const upiPct = Math.round((upi / total) * 100);
  const cashPct = 100 - upiPct;

  return (
    <div className="space-y-4">
      <div className="w-full bg-[#121212] h-4 rounded-full overflow-hidden flex border border-[#2b2b2b]">
        <div className="bg-[#E11D2E] h-full transition-all" style={{ width: `${upiPct}%` }} title={`UPI: ${upiPct}%`} />
        <div className="bg-[#3b82f6] h-full transition-all" style={{ width: `${cashPct}%` }} title={`Cash: ${cashPct}%`} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-[#121212] rounded-lg border border-[#2b2b2b]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#E11D2E] shrink-0" />
            <span className="text-[#A3A3A3] font-medium">UPI Digital</span>
          </div>
          <p className="text-base font-bold text-white mt-1">{formatCurrencyINR(upi)}</p>
          <span className="text-[10px] text-[#737373]">{upiPct}% of collections</span>
        </div>

        <div className="p-3 bg-[#121212] rounded-lg border border-[#2b2b2b]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#3b82f6] shrink-0" />
            <span className="text-[#A3A3A3] font-medium">Physical Cash</span>
          </div>
          <p className="text-base font-bold text-white mt-1">{formatCurrencyINR(cash)}</p>
          <span className="text-[10px] text-[#737373]">{cashPct}% of collections</span>
        </div>
      </div>
    </div>
  );
};

