'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileSignature,
  Calculator,
  FolderCheck,
  Users,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  Info,
  Sparkles,
  HelpCircle,
  FileCheck2,
  UserCheck,
} from 'lucide-react';
import { AuditReport, ComplianceItemAudit, CategoryKey } from '../lib/types';
import { ComplianceRiskHeatmap } from './ComplianceRiskHeatmap';

interface ComplianceChecklistProps {
  auditReport: AuditReport | null;
  onJumpToPage: (page: number, clauseId?: string) => void;
  onToggleHumanApproval: (itemId: string) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
  onOverrideExtractedValue?: (itemId: string, newValue: string) => void;
  onOpenAffidavitModal?: () => void;
  onOpenCdrModal?: () => void;
  onOpenEnvelopeModal?: () => void;
  onOpenJvModal?: () => void;
}

export function ComplianceChecklist({
  auditReport,
  onJumpToPage,
  onToggleHumanApproval,
  onUpdateNotes,
  onOverrideExtractedValue,
  onOpenAffidavitModal,
  onOpenCdrModal,
  onOpenEnvelopeModal,
  onOpenJvModal,
}: ComplianceChecklistProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    pecLicensing: true,
    financials: true,
    affidavits: true,
    jvRules: true,
    basicInfo: true,
  });

  const [selectedHeatmapCat, setSelectedHeatmapCat] = useState<CategoryKey | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  if (!auditReport) return null;

  const handleSelectHeatmapCategory = (catKey: CategoryKey) => {
    setSelectedHeatmapCat(catKey);
    setExpandedCategories((prev) => ({
      ...prev,
      [catKey]: true,
    }));

    // Scroll category element into view if present
    const el = document.getElementById(`category-accordion-${catKey}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleCategory = (catKey: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  const categories: { key: CategoryKey; title: string; desc: string }[] = [
    {
      key: 'pecLicensing',
      title: '1. PEC Licensing & Category Eligibility',
      desc: 'Pakistan Engineering Council Category (C-A to C-6) & Specialization Codes (CE/BC/ME/EE)',
    },
    {
      key: 'financials',
      title: '2. Financial Capacity & CDR Security',
      desc: '3-Year Annual Turnover, Liquid Assets, Net Worth, Call Deposit Receipt (CDR) & Bank Rating',
    },
    {
      key: 'affidavits',
      title: '3. Legal, Stamp Paper & Affidavits',
      desc: 'Rs. 100/500 Judicial Stamp Paper, Non-Blacklisting, Litigation History & FBR NTN/ATL',
    },
    {
      key: 'jvRules',
      title: '4. Joint Venture (JV) Clauses',
      desc: 'Max partners allowed, Lead partner share %, Minor partner thresholds',
    },
  ];

  const isFailedOverall = auditReport.overallEligibility === 'HIGH_DISQUALIFICATION_RISK';
  const isReviewOverall = auditReport.overallEligibility === 'NEEDS_HUMAN_REVIEW';

  return (
    <div className="bg-white border border-[#CDE0D2] rounded-xl overflow-hidden flex flex-col h-full shadow-sm text-slate-900">
      {/* High-Level Risk Score Banner Header (Govdash Theme) */}
      <div
        className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 transition-all ${
          isFailedOverall
            ? 'bg-rose-50/80 border-rose-200 text-rose-950 border-l-4 border-l-rose-600'
            : isReviewOverall
            ? 'bg-amber-50/80 border-amber-200 text-amber-950 border-l-4 border-l-amber-500'
            : 'bg-[#E6F2EB] border-[#B2D8C0] text-[#00401A] border-l-4 border-l-[#00401A]'
        }`}
      >
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00401A]/80 font-mono bg-white/70 px-2 py-0.5 rounded border border-[#00401A]/15">
              Audit Engine • PPRA Rules 2004
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-2">
            {isFailedOverall ? (
              <>
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="text-rose-900">DISQUALIFICATION RISK DETECTED</span>
              </>
            ) : isReviewOverall ? (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-amber-900">HUMAN AUDIT REQUIRED</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-[#00401A] shrink-0" />
                <span className="text-[#00401A]">100% TECHNICALLY ELIGIBLE</span>
              </>
            )}
          </h2>

          <p className="text-xs font-medium leading-relaxed opacity-90">
            {auditReport.summaryExecutive}
          </p>
        </div>

        {/* Risk Score Gauge Box */}
        <div className="text-right shrink-0 pl-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5 font-mono">
            Risk Score
          </div>
          <div
            className={`text-3xl sm:text-4xl font-black leading-none font-mono ${
              auditReport.riskScore >= 40
                ? 'text-rose-700'
                : auditReport.riskScore > 10
                ? 'text-amber-700'
                : 'text-[#00401A]'
            }`}
          >
            {auditReport.riskScore}/100
          </div>
          <span
            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase inline-block mt-1 tracking-wider ${
              auditReport.riskScore >= 40
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : auditReport.riskScore > 10
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-white text-[#00401A] border border-[#00401A]/30 shadow-xs'
            }`}
          >
            {auditReport.riskScore >= 40 ? 'HIGH DISQUALIFICATION' : auditReport.riskScore > 10 ? 'MODERATE' : 'LOW RISK'}
          </span>
        </div>
      </div>

      {/* Contractor & Bidding Specialist Pre-Submission Quick Tools Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center justify-between shrink-0 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider shrink-0 font-mono">
          <span className="w-2 h-2 rounded-full bg-[#00401A]"></span>
          <span>Contractor Bidding Suite:</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenAffidavitModal && (
            <button
              onClick={onOpenAffidavitModal}
              className="bg-white hover:bg-[#E6F2EB] text-[#00401A] border border-[#00401A]/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <FileSignature className="w-3.5 h-3.5 text-[#00401A]" />
              <span>Draft Affidavits</span>
            </button>
          )}

          {onOpenCdrModal && (
            <button
              onClick={onOpenCdrModal}
              className="bg-white hover:bg-[#E6F2EB] text-[#00401A] border border-[#00401A]/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-[#00401A]" />
              <span>CDR Calc</span>
            </button>
          )}

          {onOpenEnvelopeModal && (
            <button
              onClick={onOpenEnvelopeModal}
              className="bg-white hover:bg-[#E6F2EB] text-[#00401A] border border-[#00401A]/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <FolderCheck className="w-3.5 h-3.5 text-[#00401A]" />
              <span>Rule 36-b Envelopes</span>
            </button>
          )}

          {onOpenJvModal && (
            <button
              onClick={onOpenJvModal}
              className="bg-white hover:bg-[#E6F2EB] text-[#00401A] border border-[#00401A]/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#00401A]" />
              <span>JV Evaluator</span>
            </button>
          )}
        </div>
      </div>

      {/* Key Stats Cards Grid (High Density Govdash Theme) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#F4F8F5] border-b border-[#CDE0D2] shrink-0 text-xs">
        <div className="border border-[#CDE0D2] rounded-lg p-2.5 bg-white shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Passed Checks</div>
          <div className="flex items-center justify-between">
            <span className="text-base font-extrabold text-[#00401A]">{auditReport.passedCount}</span>
            <span className="text-[9px] bg-[#E6F2EB] text-[#00401A] border border-[#00401A]/20 px-1.5 py-0.5 rounded-full font-bold uppercase">
              Passed
            </span>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg p-2.5 bg-white shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Critical Failures</div>
          <div className="flex items-center justify-between">
            <span className="text-base font-extrabold text-rose-700">{auditReport.failedCount}</span>
            <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded-full font-bold uppercase">
              Risky
            </span>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg p-2.5 bg-white shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Flagged Items</div>
          <div className="flex items-center justify-between">
            <span className="text-base font-extrabold text-amber-700">{auditReport.flaggedCount}</span>
            <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold uppercase">
              Review
            </span>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg p-2.5 bg-white shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">Auditor Approved</div>
          <div className="flex items-center justify-between">
            <span className="text-base font-extrabold text-slate-800">
              {auditReport.items.filter((i) => i.humanApproved).length}
            </span>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-full font-bold uppercase">
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* Accordion Compliance Table Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#F8FAF8]">
        {/* Compliance Risk Heatmap Visualization */}
        <ComplianceRiskHeatmap
          auditReport={auditReport}
          onSelectCategory={handleSelectHeatmapCategory}
          selectedCategory={selectedHeatmapCat}
        />

        {categories.map((cat) => {
          const categoryItems = auditReport.items.filter((item) => item.category === cat.key);
          if (categoryItems.length === 0) return null;

          const isExpanded = expandedCategories[cat.key];
          const hasFailedInCat = categoryItems.some(
            (i) => i.status === 'FAILED - DISQUALIFICATION RISK'
          );

          return (
            <div
              key={cat.key}
              id={`category-accordion-${cat.key}`}
              className={`border rounded-lg overflow-hidden transition-all shadow-2xs ${
                hasFailedInCat ? 'border-rose-300 bg-rose-50/20' : 'border-[#CDE0D2] bg-white'
              }`}
            >
              {/* Category Accordion Header */}
              <button
                onClick={() => toggleCategory(cat.key)}
                className="w-full px-3.5 py-2.5 bg-[#00401A] hover:bg-[#003315] text-white flex items-center justify-between text-left transition-colors border-b border-[#002D12]"
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      hasFailedInCat
                        ? 'bg-rose-400 animate-pulse'
                        : categoryItems.some((i) => i.status === 'FLAGGED FOR HUMAN REVIEW')
                        ? 'bg-amber-300'
                        : 'bg-emerald-300'
                    }`}
                  />
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                      <span>{cat.title}</span>
                      <span className="text-[10px] font-mono text-emerald-200/80 font-normal">
                        ({categoryItems.length} checks)
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {hasFailedInCat && (
                    <span className="text-[9px] bg-rose-500 text-white border border-rose-300 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                      Action Needed
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-emerald-200" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-emerald-200" />
                  )}
                </div>
              </button>

              {/* Accordion Body Items */}
              {isExpanded && (
                <div className="divide-y divide-slate-100 bg-white">
                  {categoryItems.map((item) => {
                    const isFailed = item.status === 'FAILED - DISQUALIFICATION RISK';
                    const isFlagged = item.status === 'FLAGGED FOR HUMAN REVIEW';

                    return (
                      <div
                        key={item.id}
                        className={`p-3 transition-colors ${
                          isFailed ? 'bg-red-50/50' : isFlagged ? 'bg-amber-50/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Title & Status Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            {/* Icon Indicator Badge */}
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isFailed
                                  ? 'border-red-500 bg-red-50 text-red-600'
                                  : isFlagged
                                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                                  : 'border-emerald-500 bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              {isFailed ? '✕' : isFlagged ? '!' : '✓'}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900">
                                {item.ruleTitle}
                              </span>
                              {item.ppraClauseRef && (
                                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1 py-0.2 rounded">
                                  {item.ppraClauseRef}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            {/* Jump to Page */}
                            <button
                              onClick={() => onJumpToPage(item.sourcePage, item.id)}
                              className="text-[10px] bg-white hover:bg-[#E6F2EB] text-[#00401A] border border-[#00401A]/30 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono font-bold transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 text-[#00401A]" />
                              <span>Page {item.sourcePage}</span>
                            </button>

                            {/* Status Badge */}
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-tight flex items-center gap-1 ${
                                isFailed
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : isFlagged
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-[#E6F2EB] text-[#00401A] border border-[#00401A]/30'
                              }`}
                            >
                              {isFailed
                                ? '[DISQUALIFICATION RISK]'
                                : isFlagged
                                ? '[HUMAN REVIEW]'
                                : '[COMPLIANT]'}
                            </span>
                          </div>
                        </div>

                        {/* Step 5 Low Confidence Warning */}
                        {item.isLowConfidenceWarning && (
                          <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-900 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              <strong>Step 5 OCR Warning:</strong> Faded text detected on Page {item.sourcePage} ({item.confidenceScore}% confidence). Please verify manually.
                            </span>
                          </div>
                        )}

                        {/* Extracted Clause Quote */}
                        <div className="mt-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-mono text-slate-800">
                          <div className="text-[10px] font-sans font-bold text-slate-500 mb-1 flex justify-between">
                            <span>EXTRACTED CLAUSE (Qwen-2.5-VL):</span>
                            <span>OCR: {item.confidenceScore}%</span>
                          </div>
                          <p className="text-slate-800">&quot;{item.extractedClauseText}&quot;</p>
                        </div>

                        {/* Requirements vs Bidder Comparison Grid */}
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-100/70 p-2 rounded border border-slate-200">
                            <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                              Tender Mandate:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {item.requiredValueText}
                            </span>
                          </div>

                          <div
                            className={`p-2 rounded border ${
                              isFailed
                                ? 'bg-red-100/60 border-red-300 text-red-900'
                                : 'bg-slate-100/70 border-slate-200 text-slate-800'
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                              Bidder Credentials:
                            </span>
                            <span className="font-bold">{item.bidderValueText}</span>
                          </div>
                        </div>

                        {/* Disqualification Reason Box */}
                        {isFailed && item.disqualificationReason && (
                          <div className="mt-2 bg-red-100/80 border border-red-300 rounded p-2.5 text-xs text-red-900 space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-red-800">
                              <ShieldAlert className="w-4 h-4 text-red-700" />
                              <span>PPRA Disqualification Vulnerability:</span>
                            </div>
                            <p className="leading-relaxed text-red-900">
                              {item.disqualificationReason}
                            </p>
                          </div>
                        )}

                        {/* Human Auditor Actions */}
                        <div className="mt-2.5 pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#CDE0D2] text-xs">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 transition-colors">
                            <input
                              type="checkbox"
                              checked={item.humanApproved}
                              onChange={() => onToggleHumanApproval(item.id)}
                              className="w-4 h-4 rounded border-slate-300 text-[#00401A] focus:ring-[#00401A] cursor-pointer"
                            />
                            <span className={`font-semibold ${item.humanApproved ? 'text-[#00401A] font-extrabold' : 'text-slate-600'}`}>
                              Auditor Verified
                            </span>
                          </label>

                          <div className="flex-1 max-w-sm">
                            <input
                              type="text"
                              placeholder="Add auditor notes..."
                              value={item.humanNotes || ''}
                              onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                              className="w-full bg-[#F4F8F5] border border-[#CDE0D2] focus:border-[#00401A] focus:ring-1 focus:ring-[#00401A] rounded-md px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Action Strip (Govdash Theme) */}
      <div className="p-3 sm:p-4 border-t border-[#CDE0D2] bg-[#F4F8F5] flex items-center justify-between shrink-0 text-xs">
        <span className="text-[11px] text-[#00401A] font-bold tracking-wide flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00401A]"></span>
          Target Compliance: 100% Rules Bound
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              // Toggle all categories expanded
              const allExpanded = Object.keys(expandedCategories).reduce(
                (acc, key) => ({ ...acc, [key]: true }),
                {}
              );
              setExpandedCategories(allExpanded);
            }}
            className="bg-white border border-[#00401A]/30 text-[#00401A] text-[11px] font-extrabold uppercase px-3 py-1.5 rounded-lg hover:bg-[#E6F2EB] shadow-2xs transition-colors cursor-pointer"
          >
            Expand All
          </button>
        </div>
      </div>
    </div>
  );
}
