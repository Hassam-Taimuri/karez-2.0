'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  FileText,
  Sliders,
  Download,
  CheckCircle2,
  Sparkles,
  Upload,
  FileSignature,
  Calculator,
  FolderCheck,
  Users,
  LogOut,
  History,
  ChevronDown,
  Languages,
  Menu,
} from 'lucide-react';
import { SampleTenderDoc, BidderProfile, AuditReport } from '../lib/types';
import { SAMPLE_TENDERS, UNDERQUALIFIED_BIDDER_TEST_PROFILE } from '../lib/sample_tenders';

interface HeaderProps {
  currentTender: SampleTenderDoc | null;
  isTenderLoaded?: boolean;
  onSelectTender: (tender: SampleTenderDoc) => void;
  currentBidder: BidderProfile;
  onSelectBidder: (bidder: BidderProfile) => void;
  onOpenBidderModal: () => void;
  onOpenOpenCvModal: () => void;
  onOpenReportModal: () => void;
  onOpenAffidavitModal: () => void;
  onOpenCdrModal: () => void;
  onOpenEnvelopeModal: () => void;
  onOpenJvModal: () => void;
  onCustomFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAnalyzing: boolean;
  auditReport?: AuditReport | null;
  onLogout?: () => void;
  savedTenders?: any[];
  onDraftProposal?: () => void;
  language?: 'en' | 'ur';
  onToggleLanguage?: () => void;
  clientSwitcher?: React.ReactNode;
}

export function Header({
  currentTender,
  isTenderLoaded = true,
  onSelectTender,
  currentBidder,
  onSelectBidder,
  onOpenBidderModal,
  onOpenOpenCvModal,
  onOpenReportModal,
  onOpenAffidavitModal,
  onOpenCdrModal,
  onOpenEnvelopeModal,
  onOpenJvModal,
  onCustomFileUpload,
  isAnalyzing,
  auditReport,
  onLogout,
  savedTenders = [],
  onDraftProposal,
  language = 'en',
  onToggleLanguage,
  clientSwitcher,
}: HeaderProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const isQualified = currentBidder.companyName.includes('Habib') || currentBidder.companyName.includes('Frontier');

  // Compute Compliance Percentage & Circular Progress Ring
  const successCount = auditReport
    ? auditReport.items.filter((i) => i.status === 'PASSED' || i.humanApproved).length
    : 0;
  const totalChecks = auditReport ? auditReport.totalChecks : 0;
  const compliancePercent = totalChecks > 0 ? Math.round((successCount / totalChecks) * 100) : 0;

  const radius = 13;
  const circumference = 2 * Math.PI * radius; // ~81.68
  const strokeDashoffset = circumference - (compliancePercent / 100) * circumference;

  const ringColor = compliancePercent >= 80
    ? 'stroke-emerald-400'
    : compliancePercent >= 50
    ? 'stroke-amber-400'
    : 'stroke-rose-400';

  const badgeBg = compliancePercent >= 80
    ? 'bg-[#002D12] text-emerald-300 border-emerald-700/60'
    : compliancePercent >= 50
    ? 'bg-amber-950/80 text-amber-300 border-amber-600/60'
    : 'bg-rose-950/80 text-rose-300 border-rose-600/60';

  return (
    <header className="bg-[#00401A] text-white border-b border-[#002D12] sticky top-0 z-40 shrink-0 shadow-md">
      <div className="h-14 flex items-center justify-between px-3 sm:px-5">
        {/* Brand & Subtitle */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[#00401A] text-sm shrink-0 shadow-sm border border-emerald-100">
            <span className="text-emerald-800 font-black">🇵🇰</span>
          </div>
          <div className="flex items-center">
            <span className="font-extrabold text-lg tracking-tight text-white">Karez <span className="text-emerald-300 font-semibold">2.0</span></span>
            <span className="text-emerald-200/80 text-xs sm:text-sm border-l border-emerald-800/80 pl-3 ml-2 font-medium hidden md:inline-block">
              PPRA Rules 2004 AI Engine
            </span>
          </div>
          {clientSwitcher}
        </div>

        {/* Control Actions & Compliance Badge */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Circular Progress Indicator Badge */}
          {auditReport && (
            <div
              className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border font-mono ${badgeBg} shadow-xs transition-all`}
              title={`Compliance Score: ${compliancePercent}% (${successCount} of ${totalChecks} criteria satisfied)`}
            >
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    className="stroke-white/20"
                    strokeWidth="3.5"
                    fill="transparent"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    className={`${ringColor} transition-all duration-500 ease-out`}
                    strokeWidth="3.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-white leading-none">
                  {compliancePercent}%
                </span>
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-[9px] uppercase font-bold tracking-wider leading-tight opacity-80">
                  Compliance Rate
                </span>
                <span className="text-[11px] font-extrabold text-white leading-tight">
                  {successCount}/{totalChecks} Passed
                </span>
              </div>
            </div>
          )}

          {/* Secondary Actions Wrapper (Desktop Only) */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Specs Modal Button */}
            <button
              onClick={onOpenBidderModal}
              className="bg-[#002D12] hover:bg-[#005B25] text-white border border-emerald-700/60 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Edit Bidder Parameters"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-300" />
              <span>Bidder Specs</span>
            </button>

            {/* Contractor Bidding Toolkit Button Group */}
            <div className="flex items-center space-x-1 border-l border-r border-emerald-800/80 px-2 my-0.5">
              <button
                onClick={onOpenAffidavitModal}
                className="bg-[#002D12] hover:bg-[#005B25] text-emerald-100 border border-emerald-700/60 px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Draft Judicial Stamp Paper Affidavits (Rs. 500/1000)"
              >
                <FileSignature className="w-3.5 h-3.5 text-emerald-300" />
                <span>Affidavits</span>
              </button>

              <button
                onClick={onOpenCdrModal}
                className="bg-[#002D12] hover:bg-[#005B25] text-emerald-100 border border-emerald-700/60 px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="CDR & Earnest Money Ready-Calculator"
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-300" />
                <span>CDR Calc</span>
              </button>

              <button
                onClick={onOpenEnvelopeModal}
                className="bg-[#002D12] hover:bg-[#005B25] text-emerald-100 border border-emerald-700/60 px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Single Stage Two Envelope Packing Checklist (Rule 36-b)"
              >
                <FolderCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Envelopes</span>
              </button>

              <button
                onClick={onOpenJvModal}
                className="bg-[#002D12] hover:bg-[#005B25] text-emerald-100 border border-emerald-700/60 px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Joint Venture Partner Share & Capability Combiner"
              >
                <Users className="w-3.5 h-3.5 text-emerald-300" />
                <span>JV Evaluator</span>
              </button>
            </div>

            {/* OpenCV Pipeline Modal Button */}
            <button
              onClick={onOpenOpenCvModal}
              className="bg-[#002D12] hover:bg-[#005B25] text-amber-200 border border-amber-500/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="OpenCV Vision Pre-Processor Pipeline"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>OpenCV Engine</span>
            </button>

            {/* Previous Tenders History Dropdown */}
            {savedTenders && savedTenders.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="bg-[#002D12] hover:bg-[#005B25] text-emerald-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-700/60 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  title="View previously analyzed tenders"
                >
                  <History className="w-3.5 h-3.5 text-emerald-300" />
                  <span>
                    {savedTenders.length} previous {savedTenders.length === 1 ? 'tender' : 'tenders'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-emerald-400 opacity-80" />
                </button>

                {isHistoryOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2.5 z-50 text-slate-200">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-1">
                      <span className="font-bold text-xs text-emerald-400 tracking-wide uppercase">
                        Saved Tenders History
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {savedTenders.length} items
                      </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                      {savedTenders.map((item, idx) => (
                        <button
                          key={item.id || idx}
                          onClick={() => {
                            alert(`Tender: ${item.tenderTitle || 'Untitled Tender'}\nAgency: ${item.procuringAgency || 'N/A'}`);
                            setIsHistoryOpen(false);
                          }}
                          className="w-full text-left p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-emerald-700/50 transition-all cursor-pointer group"
                        >
                          <div className="font-medium text-xs text-slate-200 group-hover:text-emerald-300 truncate">
                            {item.tenderTitle || 'Untitled Tender Analysis'}
                          </div>
                          {item.procuringAgency && (
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {item.procuringAgency}
                            </div>
                          )}
                          {item.createdAt && (
                            <div className="text-[9px] text-slate-500 mt-0.5">
                              {new Date(item.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Language Toggle Button */}
            {onToggleLanguage && (
              <button
                onClick={onToggleLanguage}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm font-bold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Toggle Language / زبان تبدیل کریں"
              >
                <Languages className="w-4 h-4 text-emerald-400" />
                <span>{language === 'en' ? 'اردو' : 'EN'}</span>
              </button>
            )}
          </div>

          {/* Primary Action Buttons (Always Visible) */}
          {/* Upload Scan PDF */}
          <label className="cursor-pointer bg-[#002D12] hover:bg-[#005B25] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-700/60 flex items-center gap-1.5 transition-colors shadow-xs">
            <Upload className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">{isAnalyzing ? 'Analyzing...' : 'Upload Scan'}</span>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => {
                onCustomFileUpload(e);
                e.target.value = '';
              }}
              className="hidden"
              disabled={isAnalyzing}
            />
          </label>

          {/* Draft Proposal Button */}
          {onDraftProposal && (
            <button
              onClick={() => {
                if (!isTenderLoaded) return;
                onDraftProposal();
              }}
              disabled={!isTenderLoaded}
              className={`bg-indigo-900/90 text-indigo-100 border border-indigo-600/60 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
                !isTenderLoaded
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-indigo-800 cursor-pointer'
              }`}
              title={isTenderLoaded ? "Draft Technical Proposal with AI" : "Upload a tender first to draft proposal"}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">Draft Proposal</span>
            </button>
          )}

          {/* Export Report */}
          <button
            onClick={onOpenReportModal}
            className="bg-white hover:bg-emerald-50 text-[#00401A] font-extrabold text-xs px-3 py-1.5 rounded-lg shadow-md border border-emerald-100 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#00401A]" />
            <span>Report</span>
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="bg-[#002D12] hover:bg-red-900/80 text-emerald-100 hover:text-red-100 border border-emerald-700/60 hover:border-red-600/80 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Sign Out / Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-emerald-300 hover:text-red-300" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}

          {/* More Button (Mobile Only) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-2 text-gray-300 transition-colors cursor-pointer"
            title="More Options"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-gray-900 border-t border-gray-800 px-4 py-3 flex flex-wrap gap-2">
          <button
            onClick={() => {
              onOpenBidderModal();
              setIsMobileMenuOpen(false);
            }}
            className="w-full sm:w-auto bg-[#002D12] hover:bg-[#005B25] text-white border border-emerald-700/60 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-300" />
            <span>Bidder Specs</span>
          </button>

          <button
            onClick={() => {
              onOpenAffidavitModal();
              setIsMobileMenuOpen(false);
            }}
            className="w-full sm:w-auto bg-[#002D12] hover:bg-[#005B25] text-emerald-100 border border-emerald-700/60 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <FileSignature className="w-3.5 h-3.5 text-emerald-300" />
            <span>Affidavits</span>
          </button>

          <button
            onClick={() => {
              onOpenCdrModal();
              setIsMobileMenuOpen(false);
            }}
            className="w-full sm:w-auto bg-[#002D12] hover:bg-[#005B25] text-emerald-100 border border-emerald-700/60 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-300" />
            <span>CDR Calc</span>
          </button>

          <button
            onClick={() => {
              onOpenEnvelopeModal();
              setIsMobileMenuOpen(false);
            }}
            className="w-full sm:w-auto bg-[#002D12] hover:bg-[#005B25] text-emerald-100 border border-emerald-700/60 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <FolderCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Envelopes</span>
          </button>

          <button
            onClick={() => {
              onOpenJvModal();
              setIsMobileMenuOpen(false);
            }}
            className="w-full sm:w-auto bg-[#002D12] hover:bg-[#005B25] text-emerald-100 border border-emerald-700/60 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span>JV Evaluator</span>
          </button>

          <button
            onClick={() => {
              onOpenOpenCvModal();
              setIsMobileMenuOpen(false);
            }}
            className="w-full sm:w-auto bg-[#002D12] hover:bg-[#005B25] text-amber-200 border border-amber-500/40 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>OpenCV Engine</span>
          </button>

          {savedTenders && savedTenders.length > 0 && (
            <button
              onClick={() => {
                setIsHistoryOpen(!isHistoryOpen);
                setIsMobileMenuOpen(false);
              }}
              className="w-full sm:w-auto bg-[#002D12] hover:bg-[#005B25] text-emerald-200 text-xs font-semibold px-3 py-2 rounded-lg border border-emerald-700/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-emerald-300" />
              <span>
                {savedTenders.length} previous {savedTenders.length === 1 ? 'tender' : 'tenders'}
              </span>
            </button>
          )}

          {onToggleLanguage && (
            <button
              onClick={() => {
                onToggleLanguage();
                setIsMobileMenuOpen(false);
              }}
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Languages className="w-4 h-4 text-emerald-400" />
              <span>{language === 'en' ? 'اردو' : 'EN'}</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
