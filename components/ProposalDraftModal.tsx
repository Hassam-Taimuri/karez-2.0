'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckSquare,
  Loader2,
  AlertCircle,
  Building2,
  Stamp,
  ShieldAlert,
  Download,
  MessageSquare,
  Share2,
} from 'lucide-react';

interface ProposalDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenderData: any;
  bidderProfile: any;
  auditReport?: any;
  language?: 'en' | 'ur';
}

export function ProposalDraftModal({
  isOpen,
  onClose,
  tenderData,
  bidderProfile,
  auditReport,
  language = 'en',
}: ProposalDraftModalProps) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [proposalData, setProposalData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'proposal' | 'checklist' | 'briefing'>('proposal');
  const [error, setError] = useState<string | null>(null);

  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState<boolean>(true);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState<boolean>(false);
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const generateProposal = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 85000);

    try {
      const res = await fetch('/api/draft-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenderData, bidderProfile, auditReport }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok || !data.success || !data.proposal) {
        throw new Error(data.error || 'Failed to draft technical proposal.');
      }

      setProposalData(data.proposal);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        console.warn('Proposal generation request timed out or was aborted.');
        setError('Proposal drafting timed out. Please click "Regenerate" to try again.');
      } else {
        console.error('Error generating proposal draft:', err);
        setError(err.message || 'An unexpected error occurred while drafting the proposal.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [tenderData, bidderProfile, auditReport]);

  // Clean up abort controller ONLY on unmount or when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [isOpen]);

  // Auto-generate proposal when modal opens if no data/error exists
  useEffect(() => {
    if (isOpen && !proposalData && !isGenerating && !error) {
      generateProposal();
    }
  }, [isOpen, proposalData, isGenerating, error, generateProposal]);

  if (!isOpen) return null;

  const handleCopyText = (text: string, sectionId?: string) => {
    navigator.clipboard.writeText(text);
    if (sectionId) {
      setCopiedSectionId(sectionId);
      setTimeout(() => setCopiedSectionId(null), 2000);
    } else {
      setCopiedCoverLetter(true);
      setTimeout(() => setCopiedCoverLetter(false), 2000);
    }
  };

  const handlePrintPDF = () => {
    const printContent = document.getElementById('proposal-print-area');
    if (!printContent) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${proposalData?.proposalTitle || 'Technical Proposal'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', serif; color: #111; 
                   background: white; padding: 40px; font-size: 12pt; 
                   line-height: 1.6; }
            .print-header { text-align: center; border-bottom: 2px solid #1a6b3c; 
                            padding-bottom: 16px; margin-bottom: 24px; }
            .print-header h1 { font-size: 16pt; color: #1a6b3c; margin-bottom: 6px; }
            .print-header .meta { font-size: 10pt; color: #444; }
            .cover-letter { background: #f9f9f9; border: 1px solid #ddd; 
                            padding: 16px; margin-bottom: 24px; border-radius: 4px; }
            .cover-letter h2 { font-size: 12pt; color: #1a6b3c; margin-bottom: 8px; }
            .section { margin-bottom: 24px; page-break-inside: avoid; }
            .section-header { background: #1a6b3c; color: white; 
                              padding: 8px 12px; font-weight: bold; 
                              font-size: 11pt; margin-bottom: 8px; }
            .section-content { padding: 0 4px; font-size: 11pt; 
                                white-space: pre-wrap; }
            .doc-item { border: 1px solid #ddd; padding: 10px 12px; 
                        margin-bottom: 8px; border-radius: 4px; 
                        page-break-inside: avoid; }
            .doc-name { font-weight: bold; font-size: 11pt; color: #1a6b3c; }
            .doc-desc { font-size: 10pt; color: #333; margin-top: 4px; }
            .doc-meta { font-size: 9pt; color: #666; margin-top: 4px; }
            .critical { border-left: 4px solid #dc2626; }
            .important { border-left: 4px solid #d97706; }
            .standard { border-left: 4px solid #16a34a; }
            h2.section-title { font-size: 14pt; color: #1a6b3c; 
                               margin-bottom: 16px; border-bottom: 1px solid #ddd; 
                               padding-bottom: 6px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${proposalData?.proposalTitle || 'Technical Proposal'}</h1>
            <div class="meta">
              Prepared for: ${proposalData?.preparedFor || ''} &nbsp;|&nbsp; 
              Prepared by: ${proposalData?.preparedBy || ''} &nbsp;|&nbsp; 
              Ref: ${proposalData?.tenderReference || ''}
            </div>
          </div>
          ${proposalData?.coverLetterDraft ? `
          <div class="cover-letter">
            <h2>Cover Letter</h2>
            <div style="white-space: pre-wrap; font-size: 11pt;">${proposalData.coverLetterDraft}</div>
          </div>` : ''}
          ${(proposalData?.sections || []).map((s: any) => `
          <div class="section">
            <div class="section-header">${s.sectionNumber} ${s.title}</div>
            <div class="section-content">${s.content}</div>
          </div>`).join('')}
          ${proposalData?.documentChecklist?.length ? `
          <h2 class="section-title" style="margin-top: 32px;">Document Submission Checklist</h2>
          ${(proposalData.documentChecklist || []).map((d: any) => `
          <div class="doc-item ${d.urgencyLevel || 'standard'}">
            <div class="doc-name">${d.documentName}</div>
            <div class="doc-desc">${d.description}</div>
            <div class="doc-meta">
              Source: ${d.source || 'N/A'} | 
              Copies: ${d.copiesRequired || 1} | 
              ${d.isOriginalRequired ? 'Original Required | ' : ''}
              ${d.stampPaperRequired ? 'Stamp Paper: Rs.' + (d.stampPaperDenomination || 500) : ''}
            </div>
          </div>`).join('')}` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleWhatsAppShare = () => {
    if (!proposalData) return;
    
    const criticalDocs = (proposalData.documentChecklist || [])
      .filter((d: any) => d.urgencyLevel === 'critical')
      .map((d: any) => `• ${d.documentName}`)
      .join('\n');
    
    const stampDocs = (proposalData.documentChecklist || [])
      .filter((d: any) => d.stampPaperRequired)
      .map((d: any) => `• ${d.documentName} (Rs. ${d.stampPaperDenomination || 500})`)
      .join('\n');
    
    const isUrdu = language === 'ur';

    const message = isUrdu
      ? `*ٹینڈر تعمیل خلاصہ*\n*Karez 2.0 — PPRA کمپلائنس انجن*\n\n` +
        `*ٹینڈر:* ${proposalData.proposalTitle || 'سرکاری ٹینڈر'}\n` +
        `*ادارہ:* ${proposalData.preparedFor || 'نامعلوم'}\n` +
        `*حوالہ:* ${proposalData.tenderReference || 'نامعلوم'}\n` +
        `*تیار کردہ برائے:* ${proposalData.preparedBy || 'آپ کی کمپنی'}\n\n` +
        `*لازمی دستاویزات:*\n${criticalDocs || 'مکمل فہرست دیکھیں'}\n\n` +
        `${stampDocs ? '*اسٹامپ پیپر حلف نامے:*\n' + stampDocs + '\n\n' : ''}` +
        `*تکنیکی تجویز:* ${proposalData.sections?.length || 8} حصے تیار\n\n` +
        `_Karez 2.0 — PPRA AI کمپلائنس انجن کی جانب سے_`
      : `*TENDER COMPLIANCE SUMMARY*\n*Karez 2.0 — PPRA Compliance Engine*\n\n` +
        `*Tender:* ${proposalData.proposalTitle || 'Government Tender'}\n` +
        `*Agency:* ${proposalData.preparedFor || 'N/A'}\n` +
        `*Reference:* ${proposalData.tenderReference || 'N/A'}\n` +
        `*Prepared for:* ${proposalData.preparedBy || 'Your Company'}\n\n` +
        `*CRITICAL DOCUMENTS REQUIRED:*\n${criticalDocs || 'See full checklist'}\n\n` +
        `${stampDocs ? '*STAMP PAPER AFFIDAVITS:*\n' + stampDocs + '\n\n' : ''}` +
        `*Technical Proposal:* ${proposalData.sections?.length || 8} sections drafted\n\n` +
        `_Generated by Karez 2.0 — AI-Native PPRA Compliance Engine_`;
    
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const t = {
    briefingBanner: language === 'ur' 
      ? 'یہ اپنے کلائنٹ کو بلند آواز میں پڑھیں۔ سادہ زبان، کوئی تکنیکی اصطلاح نہیں۔'
      : 'Read this aloud to your client. Plain language, no technical jargon.',
    tenderGlance: language === 'ur' ? 'ٹینڈر کا مختصر جائزہ' : 'The Tender At a Glance',
    tenderTitle: language === 'ur' ? 'ٹینڈر کا نام' : 'Tender Title',
    procuringAgency: language === 'ur' ? 'خریداری ادارہ' : 'Procuring Agency',
    referenceNo: language === 'ur' ? 'حوالہ نمبر' : 'Tender Reference Number',
    estimatedValue: language === 'ur' ? 'تخمینہ لاگت' : 'Estimated Value / Requirement',
    eligibilityStatus: language === 'ur' ? 'آپ کی اہلیت کی صورتحال' : 'Your Eligibility Status',
    coveredInProposal: language === 'ur' ? 'تجویز میں شامل' : 'Covered in proposal',
    criticalDocs: language === 'ur' ? 'لازمی جمع کروائی جانے والی دستاویزات' : 'Critical Documents You Must Submit',
    stampPaperDocs: language === 'ur' ? 'اسٹامپ پیپر پر دستاویزات' : 'Documents Needing Stamp Paper',
    stampPaperRequired: language === 'ur' ? 'اسٹامپ پیپر درکار' : 'stamp paper required',
    whatNext: language === 'ur' ? 'اگلے اقدامات' : 'What Happens Next',
    steps: language === 'ur' ? [
      'اوپر درج تمام لازمی دستاویزات تیار کریں',
      'اپنے شیڈیولڈ بینک سے CDR / بڈ سکیورٹی حاصل کریں',
      'نوٹری سے اسٹامپ پیپر حلف نامے بنوائیں',
      'تکنیکی اور مالی بولیاں الگ الگ بند لفافوں میں جمع کروائیں',
      'آخری تاریخ پر بولی کھلنے کی تقریب میں شرکت کریں'
    ] : [
      'Prepare all critical documents listed above',
      'Get CDR / Bid Security from your scheduled bank',
      'Arrange stamp paper affidavits from a notary',
      'Submit technical and financial bids in separate sealed envelopes',
      'Attend bid opening on the submission deadline date'
    ],
    noCritical: language === 'ur' ? 'کوئی لازمی دستاویز نہیں' : 'No critical documents flagged.',
    noStamp: language === 'ur' ? 'کوئی اسٹامپ پیپر دستاویز نہیں' : 'No stamp paper documents required.',
  };

  const tenderTitle =
    tenderData?.tenderTitle ||
    tenderData?.title ||
    proposalData?.proposalTitle ||
    'Government Procurement Tender';

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/90 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Technical Proposal Draft
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50 font-mono">
              PPRA 2004
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl truncate">
            {tenderTitle}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {/* Tabs */}
          {!isGenerating && proposalData && (
            <div className="flex items-center bg-gray-950 p-1 rounded-lg border border-gray-800">
              <button
                onClick={() => setActiveTab('proposal')}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'proposal'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Proposal Sections
              </button>
              <button
                onClick={() => setActiveTab('checklist')}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'checklist'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Document Checklist
              </button>
              <button
                onClick={() => setActiveTab('briefing')}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'briefing'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Client Briefing
              </button>
            </div>
          )}

          {/* Regenerate Button */}
          {!isGenerating && (
            <button
              onClick={() => {
                setProposalData(null);
                generateProposal();
              }}
              className="flex items-center gap-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2 rounded-lg border border-gray-700 transition-colors"
              title="Regenerate proposal draft using AI"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              Regenerate
            </button>
          )}

          {/* Download PDF Button */}
          {!isGenerating && proposalData && (
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg transition-colors shadow-sm"
              title="Download proposal as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          )}

          {/* Share via WhatsApp Button */}
          {!isGenerating && proposalData && (
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 text-xs font-medium bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors shadow-sm"
              title="Share summary via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Close proposal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
        {/* Loading State */}
        {isGenerating && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-950 border-t-emerald-400 animate-spin" />
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin absolute inset-0 m-auto" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-wide">
              Generating your technical proposal...
            </h3>
            <p className="text-sm text-gray-400 mt-2 max-w-md">
              This may take 20–30 seconds as Gemini crafts customized technical
              sections under PPRA Rules 2004.
            </p>
          </div>
        )}

        {/* Error State */}
        {!isGenerating && error && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800/50 flex items-center justify-center text-red-400 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Proposal Generation Failed</h3>
            <p className="text-sm text-red-300 mt-1 max-w-lg bg-red-950/30 border border-red-900/50 p-3 rounded-lg font-mono text-xs">
              {error}
            </p>
            <button
              onClick={generateProposal}
              className="mt-6 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-emerald-950"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Generated Proposal Content */}
        {!isGenerating && !error && proposalData && (
          <div className="max-w-5xl mx-auto space-y-6" id="proposal-print-area">
            {/* Proposal Sections Tab */}
            {activeTab === 'proposal' && (
              <>
                {/* Proposal Overview Banner */}
                <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 border border-gray-800 rounded-xl p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">
                        OFFICIAL TECHNICAL PROPOSAL DRAFT
                      </span>
                      <h1 className="text-lg font-bold text-white mt-0.5">
                        {proposalData.proposalTitle || tenderTitle}
                      </h1>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 mt-2">
                        {proposalData.preparedFor && (
                          <div>
                            <span className="text-gray-500">Procuring Agency: </span>
                            <span className="text-gray-200 font-medium">
                              {proposalData.preparedFor}
                            </span>
                          </div>
                        )}
                        {proposalData.preparedBy && (
                          <div>
                            <span className="text-gray-500">Bidder Firm: </span>
                            <span className="text-gray-200 font-medium">
                              {proposalData.preparedBy}
                            </span>
                          </div>
                        )}
                        {proposalData.tenderReference && (
                          <div>
                            <span className="text-gray-500">Ref / Tender ID: </span>
                            <span className="text-gray-200 font-mono">
                              {proposalData.tenderReference}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Cover Letter */}
                {proposalData.coverLetterDraft && (
                  <div className="bg-gray-900 border border-emerald-900/50 rounded-xl overflow-hidden shadow-sm">
                    <div
                      onClick={() => setIsCoverLetterOpen(!isCoverLetterOpen)}
                      className="w-full px-5 py-4 bg-gray-900 hover:bg-gray-850 flex items-center justify-between cursor-pointer border-b border-gray-800/80 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-white">
                          Cover Letter Draft
                        </h3>
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40 font-mono">
                          Formal Submission Letter
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(proposalData.coverLetterDraft);
                          }}
                          className="flex items-center gap-1 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded border border-gray-700 transition-colors"
                        >
                          {copiedCoverLetter ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy Letter
                            </>
                          )}
                        </button>
                        {isCoverLetterOpen ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isCoverLetterOpen && (
                      <div className="p-5 bg-gray-950/60 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans border-t border-gray-800/50">
                        {proposalData.coverLetterDraft}
                      </div>
                    )}
                  </div>
                )}

                {/* Proposal Sections */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">
                    Technical Proposal Sections ({proposalData.sections?.length || 0})
                  </h3>

                  {proposalData.sections && proposalData.sections.length > 0 ? (
                    proposalData.sections.map((section: any, idx: number) => (
                      <div
                        key={section.id || `section-${idx}`}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm space-y-3"
                      >
                        {/* Section Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded">
                              {section.sectionNumber || `${idx + 1}.0`}
                            </span>
                            <h4 className="text-base font-bold text-white">
                              {section.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            {section.isRequired !== false ? (
                              <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded">
                                Mandatory Section
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                                Optional
                              </span>
                            )}

                            {section.pageEstimate && (
                              <span className="text-[10px] font-mono bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded">
                                ~{section.pageEstimate} pages
                              </span>
                            )}

                            <button
                              onClick={() =>
                                handleCopyText(
                                  `${section.sectionNumber || ''} ${section.title}\n\n${section.content}`,
                                  section.id || `sec-${idx}`
                                )
                              }
                              className="flex items-center gap-1 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 px-2.5 py-1 rounded border border-gray-700 transition-colors ml-1"
                            >
                              {copiedSectionId === (section.id || `sec-${idx}`) ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  Copy Section
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Section Content */}
                        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans pt-1">
                          {section.content}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
                      No specific sections generated.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Document Checklist Tab */}
            {activeTab === 'checklist' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                      Mandatory Submission Checklist
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Verified against PPRA 2004 submission guidelines and tender requirements.
                    </p>
                  </div>
                  <span className="text-xs bg-gray-900 border border-gray-800 text-gray-300 px-3 py-1 rounded-lg font-mono">
                    Total Documents: {proposalData.documentChecklist?.length || 0}
                  </span>
                </div>

                {proposalData.documentChecklist &&
                proposalData.documentChecklist.length > 0 ? (
                  <div className="space-y-3">
                    {proposalData.documentChecklist.map((doc: any, idx: number) => {
                      const urgency = doc.urgencyLevel?.toLowerCase() || 'standard';
                      return (
                        <div
                          key={doc.id || `doc-${idx}`}
                          className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-gray-700 transition-colors"
                        >
                          {/* Left Details */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Urgency Badge */}
                              {urgency === 'critical' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-950 text-red-400 border border-red-800/60 px-2 py-0.5 rounded uppercase tracking-wider">
                                  <ShieldAlert className="w-3 h-3" /> Critical
                                </span>
                              )}
                              {urgency === 'important' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded uppercase tracking-wider">
                                  Important
                                </span>
                              )}
                              {urgency === 'standard' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded uppercase tracking-wider">
                                  Standard
                                </span>
                              )}

                              <h4 className="text-sm font-bold text-white">
                                {doc.documentName}
                              </h4>
                            </div>

                            <p className="text-xs text-gray-300 leading-relaxed">
                              {doc.description}
                            </p>

                            {doc.source && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-0.5">
                                <Building2 className="w-3 h-3 text-gray-500" />
                                <span>Source / Issuing Authority: </span>
                                <span className="text-gray-200 font-medium">
                                  {doc.source}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Right Badges */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 md:justify-end">
                            {doc.stampPaperRequired && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/50 px-2.5 py-1 rounded-lg">
                                <Stamp className="w-3.5 h-3.5" />
                                Stamp Paper Rs.{' '}
                                {doc.stampPaperDenomination || 500}
                              </span>
                            )}

                            {doc.isOriginalRequired && (
                              <span className="text-xs font-semibold bg-red-950/80 text-red-300 border border-red-800/50 px-2.5 py-1 rounded-lg">
                                Original Required
                              </span>
                            )}

                            <span className="text-xs font-mono bg-gray-800 text-gray-300 border border-gray-700 px-2.5 py-1 rounded-lg">
                              {doc.copiesRequired || 1} Copy
                              {(doc.copiesRequired || 1) > 1 ? 'ies' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
                    No document checklist items extracted.
                  </div>
                )}
              </div>
            )}

            {/* Client Briefing Tab */}
            {activeTab === 'briefing' && (
              <div
                className="space-y-6"
                dir={language === 'ur' ? 'rtl' : 'ltr'}
                style={{ fontFamily: language === 'ur' ? 'serif' : 'inherit' }}
              >
                {/* Banner */}
                <div className="bg-amber-950/80 border border-amber-800/60 rounded-xl p-4 text-amber-200 text-sm font-semibold flex items-center gap-3 shadow-sm">
                  <MessageSquare className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>{t.briefingBanner}</span>
                </div>

                {/* Card 1 — The Tender At a Glance */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2">
                    {t.tenderGlance}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                        {t.tenderTitle}
                      </span>
                      <p className="text-white font-semibold text-lg mt-0.5">
                        {tenderData?.tenderTitle || tenderData?.title || proposalData?.proposalTitle || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                        {t.procuringAgency}
                      </span>
                      <p className="text-white font-semibold text-lg mt-0.5">
                        {tenderData?.agency || tenderData?.procuringAgency || proposalData?.preparedFor || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                        {t.referenceNo}
                      </span>
                      <p className="text-emerald-400 font-mono font-bold text-base mt-0.5">
                        {tenderData?.tenderId || tenderData?.referenceNo || proposalData?.tenderReference || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                        {t.estimatedValue}
                      </span>
                      <p className="text-emerald-400 font-semibold text-base mt-0.5">
                        {tenderData?.estimatedCostPKR
                          ? `PKR ${Number(tenderData.estimatedCostPKR).toLocaleString()}`
                          : tenderData?.financialCriteria?.turnoverRequiredPKR
                          ? `PKR ${Number(tenderData.financialCriteria.turnoverRequiredPKR).toLocaleString()} (Min Annual Turnover required)`
                          : 'As per Bidding Document'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 2 — Your Eligibility Status */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2">
                    {t.eligibilityStatus}
                  </h3>
                  <div className="space-y-3">
                    {(proposalData?.sections || []).slice(0, 3).map((sec: any, idx: number) => (
                      <div key={sec.id || `elig-${idx}`} className="flex items-center gap-3 bg-gray-950 p-3 rounded-lg border border-gray-800">
                        <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-base font-bold text-white block">
                            {sec.title}
                          </span>
                          <span className="text-xs text-emerald-400 font-semibold">
                            {t.coveredInProposal}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 3 — Critical Documents You Must Submit */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    {t.criticalDocs}
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const criticals = (proposalData?.documentChecklist || []).filter(
                        (d: any) => d.urgencyLevel?.toLowerCase() === 'critical'
                      );
                      if (criticals.length === 0) {
                        return <p className="text-sm text-gray-400">{t.noCritical}</p>;
                      }
                      return criticals.map((d: any, idx: number) => (
                        <div key={d.id || `crit-${idx}`} className="flex items-start gap-3 bg-gray-950 p-3.5 rounded-lg border border-red-900/40">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-2" />
                          <div>
                            <span className="text-base font-bold text-white block">
                              {d.documentName}
                            </span>
                            <span className="text-sm text-gray-300 mt-0.5 block leading-relaxed">
                              {d.description}
                            </span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Card 4 — Documents Needing Stamp Paper */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2 flex items-center gap-2">
                    <Stamp className="w-5 h-5 text-amber-400" />
                    {t.stampPaperDocs}
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const stampDocs = (proposalData?.documentChecklist || []).filter(
                        (d: any) => d.stampPaperRequired === true
                      );
                      if (stampDocs.length === 0) {
                        return <p className="text-sm text-gray-400">{t.noStamp}</p>;
                      }
                      return stampDocs.map((d: any, idx: number) => (
                        <div key={d.id || `stamp-${idx}`} className="flex items-start gap-3 bg-gray-950 p-3.5 rounded-lg border border-amber-900/40">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                          <div>
                            <span className="text-base font-bold text-white block">
                              {d.documentName}
                            </span>
                            <span className="text-sm font-semibold text-amber-300 mt-0.5 block">
                              Rs. {d.stampPaperDenomination || 500} {t.stampPaperRequired}
                            </span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Card 5 — What Happens Next */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-2">
                    {t.whatNext}
                  </h3>
                  <ol className="space-y-3 text-base text-gray-200">
                    <li className="flex items-start gap-3 bg-gray-950 p-3.5 rounded-lg border border-gray-800">
                      <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-sm flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span>{t.steps[0]}</span>
                    </li>
                    <li className="flex items-start gap-3 bg-gray-950 p-3.5 rounded-lg border border-gray-800">
                      <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-sm flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span>{t.steps[1]}</span>
                    </li>
                    <li className="flex items-start gap-3 bg-gray-950 p-3.5 rounded-lg border border-gray-800">
                      <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-sm flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span>{t.steps[2]}</span>
                    </li>
                    <li className="flex items-start gap-3 bg-gray-950 p-3.5 rounded-lg border border-gray-800">
                      <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-sm flex items-center justify-center shrink-0">
                        4
                      </span>
                      <span>{t.steps[3]}</span>
                    </li>
                    <li className="flex items-start gap-3 bg-gray-950 p-3.5 rounded-lg border border-gray-800">
                      <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-sm flex items-center justify-center shrink-0">
                        5
                      </span>
                      <span>{t.steps[4]}</span>
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
