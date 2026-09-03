'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Filter,
  Layers,
  BarChart2,
} from 'lucide-react';
import { AuditReport, CategoryKey, ComplianceItemAudit } from '../lib/types';

interface ComplianceRiskHeatmapProps {
  auditReport: AuditReport;
  onSelectCategory?: (category: CategoryKey) => void;
  selectedCategory?: CategoryKey | null;
}

interface CategoryMetric {
  key: CategoryKey;
  name: string;
  shortName: string;
  passed: number;
  failed: number;
  flagged: number;
  total: number;
  riskPoints: number;
  maxRiskPoints: number;
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW';
  gaps: ComplianceItemAudit[];
}

export function ComplianceRiskHeatmap({
  auditReport,
  onSelectCategory,
  selectedCategory,
}: ComplianceRiskHeatmapProps) {
  const [activeView, setActiveView] = useState<'heatmap' | 'chart'>('heatmap');

  const categoryConfigs: { key: CategoryKey; name: string; shortName: string }[] = [
    { key: 'pecLicensing', name: 'PEC Licensing & Category', shortName: 'PEC & Tech' },
    { key: 'financials', name: 'Financial Capacity & CDR', shortName: 'Financials' },
    { key: 'affidavits', name: 'Legal, Stamp & Affidavits', shortName: 'Legal & Stamp' },
    { key: 'jvRules', name: 'Joint Venture (JV) Rules', shortName: 'JV Rules' },
  ];

  const categoryMetrics: CategoryMetric[] = categoryConfigs.map((cfg) => {
    const items = auditReport.items.filter((item) => item.category === cfg.key);
    const passed = items.filter((i) => i.status === 'PASSED' || i.humanApproved).length;
    const failed = items.filter((i) => i.status === 'FAILED - DISQUALIFICATION RISK' && !i.humanApproved).length;
    const flagged = items.filter((i) => i.status === 'FLAGGED FOR HUMAN REVIEW' && !i.humanApproved).length;
    const total = items.length;

    const getRiskWeight = (item: ComplianceItemAudit) => {
      switch (item.disqualificationRiskLevel) {
        case 'CRITICAL':
          return 40;
        case 'HIGH':
          return 25;
        case 'MEDIUM':
          return 15;
        default:
          return 0;
      }
    };

    const riskPoints = items
      .filter((i) => (i.status === 'FAILED - DISQUALIFICATION RISK' || i.status === 'FLAGGED FOR HUMAN REVIEW') && !i.humanApproved)
      .reduce((acc, curr) => acc + getRiskWeight(curr), 0);

    const maxRiskPoints = items.reduce((acc, curr) => acc + getRiskWeight(curr), 0);

    let riskLevel: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    if (failed > 0 || riskPoints >= 25) {
      riskLevel = 'HIGH';
    } else if (flagged > 0 || riskPoints > 0) {
      riskLevel = 'MODERATE';
    }

    const gaps = items.filter(
      (i) => (i.status === 'FAILED - DISQUALIFICATION RISK' || i.status === 'FLAGGED FOR HUMAN REVIEW') && !i.humanApproved
    );

    return {
      key: cfg.key,
      name: cfg.name,
      shortName: cfg.shortName,
      passed,
      failed,
      flagged,
      total,
      riskPoints,
      maxRiskPoints,
      riskLevel,
      gaps,
    };
  });

  const chartData = categoryMetrics.map((m) => ({
    name: m.shortName,
    fullName: m.name,
    Passed: m.passed,
    'Critical Gaps': m.failed,
    'Review Flagged': m.flagged,
    riskPoints: m.riskPoints,
    riskLevel: m.riskLevel,
  }));

  const totalGapsCount = categoryMetrics.reduce((acc, c) => acc + c.failed + c.flagged, 0);

  return (
    <div className="bg-white border border-[#CDE0D2] rounded-xl overflow-hidden shadow-2xs transition-all">
      {/* Heatmap Section Header */}
      <div className="bg-[#00401A] text-white px-3.5 py-2.5 flex items-center justify-between border-b border-[#002D12]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-amber-300">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-white flex items-center gap-1.5">
              <span>PPRA Compliance Risk Heatmap</span>
              <span className="text-[10px] bg-emerald-900 text-emerald-200 px-1.5 py-0.2 rounded font-mono font-normal border border-emerald-700/50">
                Rule Gap Prioritizer
              </span>
            </h3>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={() => setActiveView('heatmap')}
            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              activeView === 'heatmap'
                ? 'bg-white text-[#00401A] shadow-xs'
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Matrix</span>
          </button>
          <button
            onClick={() => setActiveView('chart')}
            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              activeView === 'chart'
                ? 'bg-white text-[#00401A] shadow-xs'
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            <span>Chart</span>
          </button>
        </div>
      </div>

      {/* Main Visualizer Body */}
      <div className="p-3 bg-[#F8FAF8]">
        {activeView === 'heatmap' ? (
          /* Matrix Heatmap Blocks */
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
              <span className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#00401A]" />
                Click category block to prioritize review:
              </span>
              <span className="font-mono text-[10px] font-bold">
                {totalGapsCount > 0 ? (
                  <span className="text-rose-700">{totalGapsCount} Active Compliance Gaps</span>
                ) : (
                  <span className="text-[#00401A]">0 Gaps Identified</span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categoryMetrics.map((m) => {
                const isSelected = selectedCategory === m.key;
                let bgStyle = 'bg-emerald-50/70 border-emerald-200 text-[#00401A]';
                let badgeStyle = 'bg-[#00401A] text-white';
                let icon = <ShieldCheck className="w-4 h-4 text-[#00401A]" />;
                let statusLabel = '100% Compliant';

                if (m.riskLevel === 'HIGH') {
                  bgStyle = 'bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100/70';
                  badgeStyle = 'bg-rose-700 text-white';
                  icon = <ShieldAlert className="w-4 h-4 text-rose-600" />;
                  statusLabel = `${m.failed} Critical Gap${m.failed > 1 ? 's' : ''}`;
                } else if (m.riskLevel === 'MODERATE') {
                  bgStyle = 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100/70';
                  badgeStyle = 'bg-amber-600 text-white';
                  icon = <AlertTriangle className="w-4 h-4 text-amber-600" />;
                  statusLabel = `${m.flagged} Review Flag${m.flagged > 1 ? 's' : ''}`;
                }

                return (
                  <button
                    key={m.key}
                    onClick={() => onSelectCategory && onSelectCategory(m.key)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden group ${bgStyle} ${
                      isSelected ? 'ring-2 ring-[#00401A] shadow-sm' : 'hover:shadow-2xs'
                    }`}
                  >
                    {/* Top Row: Category Title & Status */}
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        {icon}
                        <span className="font-extrabold text-xs tracking-tight leading-tight">
                          {m.shortName}
                        </span>
                      </div>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase font-mono ${badgeStyle}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Progress / Risk Bar */}
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden my-1.5 flex">
                      <div
                        style={{ width: `${(m.passed / m.total) * 100}%` }}
                        className="bg-[#00401A] h-full"
                        title={`${m.passed} passed`}
                      />
                      <div
                        style={{ width: `${(m.flagged / m.total) * 100}%` }}
                        className="bg-amber-500 h-full"
                        title={`${m.flagged} flagged`}
                      />
                      <div
                        style={{ width: `${(m.failed / m.total) * 100}%` }}
                        className="bg-rose-600 h-full"
                        title={`${m.failed} failed`}
                      />
                    </div>

                    {/* Bottom Details Row */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
                      <span>{m.passed}/{m.total} Satisfied</span>
                      <span className="font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>Risk Pts: {m.riskPoints}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </span>
                    </div>

                    {/* Specific Gap Items Tooltip / Preview */}
                    {m.gaps.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-200/70 text-[10px] space-y-1">
                        {m.gaps.slice(0, 2).map((gap) => (
                          <div
                            key={gap.id}
                            className="flex items-center justify-between text-[10px] truncate"
                          >
                            <span className="font-semibold text-rose-900 truncate">
                              • {gap.ruleTitle}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono shrink-0 pl-1">
                              {gap.ppraClauseRef || `Rule ${gap.sourcePage}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Recharts Bar Graph View */
          <div className="space-y-2">
            <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between mb-1">
              <span>PPRA Category Criteria Distribution:</span>
              <span className="text-[10px] font-mono font-bold text-[#00401A]">
                Recharts Risk Breakdown
              </span>
            </div>

            <div className="h-44 w-full bg-white border border-[#CDE0D2] rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-xl border border-slate-700 max-w-xs">
                            <p className="font-bold text-emerald-300">{data.fullName}</p>
                            <div className="mt-1 space-y-0.5 text-[11px]">
                              <p className="text-emerald-400">✓ Passed: {data.Passed}</p>
                              <p className="text-amber-300">⚠ Review Flagged: {data['Review Flagged']}</p>
                              <p className="text-rose-400">✖ Critical Gaps: {data['Critical Gaps']}</p>
                              <p className="text-slate-400 font-mono mt-1 text-[10px]">
                                Weight Score: {data.riskPoints} Risk Pts
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="Passed" stackId="a" fill="#00401A" name="Passed" />
                  <Bar dataKey="Review Flagged" stackId="a" fill="#F59E0B" name="Review Flagged" />
                  <Bar dataKey="Critical Gaps" stackId="a" fill="#DC2626" name="Critical Gaps" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-4 text-[10px] font-medium text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00401A]"></span> Passed Criteria
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Review Required
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Disqualification Risk
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
