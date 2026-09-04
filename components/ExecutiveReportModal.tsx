'use client';

import React from 'react';
import { Download, X, Printer, ShieldCheck, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { AuditReport, SampleTenderDoc, BidderProfile } from '../lib/types';
import { formatPKR } from '../lib/compliance_engine';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditReport: AuditReport | null;
  tender: SampleTenderDoc | any | null;
  bidder: BidderProfile;
}

export function ExecutiveReportModal({
  isOpen,
  onClose,
  auditReport,
  tender,
  bidder,
}: ExecutiveReportModalProps) {
  if (!isOpen || !auditReport || !tender) return null;

  const extractionMeta = tender?.extractedData?.extractionMeta;

  const generateReportHtml = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Karez 2.0 - PPRA Audit Report - ${tender.ppraRef || tender.extractedData?.basicInfo?.ppraReferenceNo || 'N/A'}</title>
  <style>
    @page { margin: 0; }
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; padding: 15px; font-size: 11pt; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 30px; color: #111827; line-height: 1.5; background: #fff; }
    .header { border-bottom: 3px solid #00401A; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .badge { background: #E6F2EB; color: #00401A; border: 1px solid #00401A; padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .title { color: #00401A; font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 8px 0 2px 0; letter-spacing: -0.5px; }
    .subtitle { color: #4B5563; font-size: 12px; font-weight: 600; }
    .meta-box { font-family: monospace; font-size: 11px; text-align: right; background: #F8FAFC; padding: 10px; border-radius: 6px; border: 1px solid #E2E8F0; }
    .status-box { padding: 16px; border-radius: 10px; margin-bottom: 24px; }
    .status-pass { background: #ECFDF5; border: 1px solid #10B981; color: #064E3B; }
    .status-fail { background: #FEF2F2; border: 1px solid #EF4444; color: #7F1D1D; }
    .status-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-family: monospace; }
    .status-pill { font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; color: #fff; }
    .pill-pass { background: #059669; }
    .pill-fail { background: #DC2626; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #F8FAFC; padding: 16px; border-radius: 10px; border: 1px solid #E2E8F0; font-size: 12px; }
    .grid-title { font-weight: 800; color: #64748B; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 6px; }
    .grid-heading { font-weight: 800; font-size: 14px; color: #0F172A; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 12px; }
    th { background: #F1F5F9; text-align: left; padding: 10px; border: 1px solid #CBD5E1; font-weight: 800; color: #334155; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
    td { padding: 10px; border: 1px solid #CBD5E1; color: #1E293B; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; text-align: center; font-size: 12px; }
    .sig-line { border-bottom: 1px solid #94A3B8; padding-bottom: 30px; margin-bottom: 6px; color: #94A3B8; font-family: monospace; font-size: 11px; }
    .btn { background: #00401A; color: white; border: none; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn:hover { background: #002D12; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">Karez 2.0 — Procurement Compliance Audit</span>
      <h1 class="title">Technical Eligibility Evaluation</h1>
      <div class="subtitle">Public Procurement Regulatory Authority (PPRA) Rules 2004</div>
    </div>
    <div class="meta-box">
      <div><strong>Audit Date:</strong> ${new Date().toLocaleDateString('en-PK')}</div>
      <div><strong>Doc ID:</strong> KRZ-${auditReport.tenderId.replace(/[^a-zA-Z0-9]/g, '')}</div>
      ${extractionMeta ? `<div><strong>Extraction:</strong> ${extractionMeta.provider} / ${extractionMeta.model} (${extractionMeta.pagesAnalysed} pages)</div>` : ''}
      <div style="margin-top:4px; font-weight:bold; color:#00401A;">AI-ASSISTED PRE-SUBMISSION AUDIT</div>
    </div>
  </div>

  <div class="status-box ${auditReport.overallEligibility === 'HIGH_DISQUALIFICATION_RISK' ? 'status-fail' : 'status-pass'}">
    <div class="status-header">
      <strong style="text-transform:uppercase; font-size:12px;">Executive Evaluation Result:</strong>
      <span class="status-pill ${auditReport.overallEligibility === 'HIGH_DISQUALIFICATION_RISK' ? 'pill-fail' : 'pill-pass'}">
        ${auditReport.overallEligibility.replace(/_/g, ' ')}
      </span>
    </div>
    <p style="margin:0; font-size:13px; font-weight:500;">${auditReport.summaryExecutive}</p>
  </div>

  <div class="grid">
    <div>
      <div class="grid-title">Procuring Tender Details:</div>
      <div class="grid-heading">${tender.title}</div>
      <div><strong>Agency:</strong> ${tender.agency}</div>
      <div><strong>PPRA Ref:</strong> ${tender.ppraRef}</div>
      <div><strong>Procedure:</strong> ${tender.biddingType}</div>
    </div>
    <div>
      <div class="grid-title">Bidder Entity Profile:</div>
      <div class="grid-heading">${bidder.companyName}</div>
      <div><strong>PEC Category:</strong> ${bidder.pecCategory} (${bidder.pecStatus})</div>
      <div><strong>3-Yr Avg Turnover:</strong> ${formatPKR(bidder.avgAnnualTurnoverPKR)}</div>
      <div><strong>FBR NTN Status:</strong> ${bidder.ntnStatus}</div>
    </div>
  </div>

  <h3 style="font-size:14px; font-weight:800; color:#0F172A; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px;">
    Detailed Clause Audit & Disqualification Risk Breakdown
  </h3>
  <table>
    <thead>
      <tr>
        <th>Clause Item</th>
        <th>Tender Mandatory Requirement</th>
        <th>Bidder Value Submitted</th>
        <th style="text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${auditReport.items
        .map(
          (item) => `
        <tr>
          <td>
            <strong>${item.ruleTitle}</strong>
            <div style="font-size:10px; color:#64748B; font-family:monospace;">Page ${item.sourcePage}</div>
          </td>
          <td>${item.requiredValueText}</td>
          <td>${item.bidderValueText}</td>
          <td style="text-align:center; font-weight:bold; color:${item.status === 'PASSED' ? '#059669' : '#DC2626'};">
            ${item.status}
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="signatures">
    <div>
      <div class="sig-line">&nbsp;</div>
      <strong>Reviewed by (Bid Manager)</strong>
      <div style="font-size:11px; color:#64748B;">Bidder's own bid preparation team</div>
    </div>
    <div>
      <div class="sig-line">&nbsp;</div>
      <strong>Second reviewer</strong>
      <div style="font-size:11px; color:#64748B;">Independent internal check</div>
    </div>
  </div>

  <div style="margin-top:24px; padding:12px; background:#FFFBEB; border:1px solid #F59E0B; border-radius:8px; font-size:10px; color:#78350F;">
    <strong>Disclaimer:</strong> This is an AI-assisted pre-submission audit generated by Karez 2.0 for the bidder's
    internal use. It is not issued, endorsed or verified by any procuring agency or by PPRA. Criteria marked
    "not stated" were not found on the pages analysed and must be verified against the complete bidding document.
    Final responsibility for bid compliance rests with the bidding team.
  </div>

  <div class="no-print" style="margin-top:40px; text-align:center; padding: 20px; background: #F8FAFC; border-radius: 10px; border: 1px solid #E2E8F0;">
    <button onclick="window.print()" class="btn">
      🖨️ Print / Save as PDF
    </button>
  </div>
</body>
</html>`;
  };

  const handleDownloadFile = () => {
    const htmlContent = generateReportHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Karez_PPRA_Audit_Certificate_${tender.ppraRef.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const htmlContent = generateReportHtml();

    // 1. Try popup window for direct clean print dialog
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          try {
            printWindow.print();
          } catch (e) {
            console.warn('Pop-up print call failed:', e);
          }
        }, 350);
        return;
      }
    } catch (e) {
      console.warn('Pop-up print window blocked:', e);
    }

    // 2. Fallback: try window.print() in current window context
    try {
      window.print();
    } catch (e) {
      console.warn('Direct window.print failed:', e);
    }

    // 3. Fallback: trigger file download automatically
    handleDownloadFile();
  };

  const handleDownloadPDF = () => {
    const reportElement = document.getElementById('executive-report-content');
    const htmlContent = reportElement ? reportElement.innerHTML : '';
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Karez 2.0 — PPRA Audit Certificate</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { margin: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              color: #111827;
              background: white;
              padding: 32px;
              font-size: 11pt;
              line-height: 1.6;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none !important; }
            }
            h1, h2, h3 { color: #00401A; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th { background: #F1F5F9; padding: 8px 10px; border: 1px solid #CBD5E1; 
                 font-size: 10pt; text-align: left; font-weight: bold; }
            td { padding: 8px 10px; border: 1px solid #CBD5E1; font-size: 10pt; }
            .status-pass { color: #059669; font-weight: bold; }
            .status-fail { color: #DC2626; font-weight: bold; }
            .status-flag { color: #D97706; font-weight: bold; }
            .header-bar { border-bottom: 3px solid #00401A; padding-bottom: 12px; 
                           margin-bottom: 20px; }
            .score-box { background: #F0FDF4; border: 1px solid #86EFAC; 
                          padding: 12px; border-radius: 8px; margin-bottom: 16px; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E2E8F0; 
                       font-size: 9pt; color: #64748B; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <h1 style="font-size: 20pt; font-weight: 900; text-transform: uppercase;">
              Karez 2.0 — AI-Assisted Pre-Submission Audit Report
            </h1>
            <div style="color: #4B5563; font-size: 10pt; margin-top: 4px;">
              Public Procurement Regulatory Authority (PPRA) Rules 2004 |
              Generated: ${new Date().toLocaleDateString('en-PK')}
              ${extractionMeta ? ` | Extraction: ${extractionMeta.provider} / ${extractionMeta.model}` : ''}
            </div>
          </div>
          ${htmlContent}
          <div class="footer">
            Generated by Karez 2.0 — AI-assisted pre-submission audit for the bidder's internal use.
            Not issued or endorsed by any procuring agency or PPRA. Final verification
            responsibility rests with the bidding team.
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#CDE0D2] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header Bar */}
        <div className="p-4 border-b border-[#002D12] flex items-center justify-between bg-[#00401A] text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                PPRA 2004 Technical Eligibility Audit Report
              </h3>
              <p className="text-xs text-emerald-100/80">
                AI-assisted pre-submission audit for the bidder&apos;s internal review
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleDownloadFile}
              className="bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition-all shadow-sm cursor-pointer"
              title="Save report as printable document"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>Download Report</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-white hover:bg-emerald-50 text-[#00401A] border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#00401A]" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-emerald-200 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Printable) */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0">
          <div id="executive-report-content">
            {/* Certificate Letterhead Header */}
            <div className="border-b-2 border-[#00401A] pb-6 mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#00401A] font-extrabold text-xs uppercase tracking-widest mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Karez 2.0 — Procurement Compliance Audit</span>
                </div>
                <h1 className="text-2xl font-black text-[#00401A] tracking-tight uppercase">
                  TECHNICAL ELIGIBILITY EVALUATION
                </h1>
                <p className="text-xs font-bold text-slate-600 mt-1">
                  Bound by Public Procurement Regulatory Authority (PPRA) Rules 2004
                </p>
              </div>

              <div className="text-right border-l-2 border-slate-200 pl-4 font-mono text-xs">
                <div className="font-bold text-slate-900">Audit Date: {new Date().toLocaleDateString('en-PK')}</div>
                <div className="text-slate-500 text-[10px]">Doc ID: KRZ-{auditReport.tenderId.replace(/[^a-zA-Z0-9]/g, '')}</div>
                {extractionMeta && (
                  <div className="text-slate-500 text-[10px]">
                    Extraction: {extractionMeta.provider} / {extractionMeta.model} ({extractionMeta.pagesAnalysed} pages)
                  </div>
                )}
                <div className="mt-1 inline-block px-2 py-0.5 bg-slate-100 border border-slate-300 font-bold text-[10px] rounded">
                  AI-ASSISTED PRE-SUBMISSION AUDIT
                </div>
              </div>
            </div>

            {/* Key Executive Summary Box */}
            <div
              className={`p-4 rounded-xl border mb-6 ${
                auditReport.overallEligibility === 'HIGH_DISQUALIFICATION_RISK'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold uppercase text-xs tracking-wider font-mono">
                  Executive Status:
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase font-mono ${
                    auditReport.overallEligibility === 'HIGH_DISQUALIFICATION_RISK'
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {auditReport.overallEligibility.replace(/_/g, ' ')}
                </span>
              </div>

              <p className="text-sm font-medium leading-relaxed">
                {auditReport.summaryExecutive}
              </p>
            </div>

            {/* Tender & Bidder Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-500 uppercase block mb-1">
                  Procuring Tender Details:
                </span>
                <div className="font-bold text-slate-900 text-sm">{tender.title}</div>
                <div className="text-slate-600">Agency: {tender.agency}</div>
                <div className="text-slate-600">PPRA Reference: {tender.ppraRef}</div>
                <div className="text-slate-600">Procedure: {tender.biddingType}</div>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase block mb-1">
                  Bidder Entity Profile:
                </span>
                <div className="font-bold text-slate-900 text-sm">{bidder.companyName}</div>
                <div className="text-slate-600">PEC Category: {bidder.pecCategory} ({bidder.pecStatus})</div>
                <div className="text-slate-600">Turnover: {formatPKR(bidder.avgAnnualTurnoverPKR)}</div>
                <div className="text-slate-600">FBR NTN Status: {bidder.ntnStatus}</div>
              </div>
            </div>

            {/* Audit Items Table */}
            <div className="mb-6">
              <h3 className="font-bold text-sm text-slate-900 mb-2 uppercase tracking-wide">
                Detailed Clause Audit & Disqualification Risk Breakdown
              </h3>
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="p-2 border border-slate-300">Clause Item</th>
                    <th className="p-2 border border-slate-300">Tender Mandatory Requirement</th>
                    <th className="p-2 border border-slate-300">Bidder Value Submitted</th>
                    <th className="p-2 border border-slate-300 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {auditReport.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2 font-bold border border-slate-300 text-slate-900">
                        {item.ruleTitle}
                        <span className="block text-[10px] font-normal text-slate-500 font-mono">
                          Page {item.sourcePage}
                        </span>
                      </td>
                      <td className="p-2 border border-slate-300 font-mono text-slate-800">
                        {item.requiredValueText}
                      </td>
                      <td className="p-2 border border-slate-300 font-mono text-slate-800">
                        {item.bidderValueText}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            item.status === 'PASSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Internal Review Sign-off (bidder's own team — NOT agency signatures) */}
            <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-b border-slate-400 pb-8 mb-2 font-mono text-slate-400">
                  &nbsp;
                </div>
                <div className="font-bold text-slate-900">Reviewed by (Bid Manager)</div>
                <div className="text-slate-500 text-[10px]">Bidder&apos;s own bid preparation team</div>
              </div>

              <div>
                <div className="border-b border-slate-400 pb-8 mb-2 font-mono text-slate-400">
                  &nbsp;
                </div>
                <div className="font-bold text-slate-900">Second reviewer</div>
                <div className="text-slate-500 text-[10px]">Independent internal check</div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 p-3 bg-amber-50 border border-amber-300 rounded-lg text-[10px] text-amber-900 leading-relaxed">
              <strong>Disclaimer:</strong> This is an AI-assisted pre-submission audit generated by Karez 2.0 for the
              bidder&apos;s internal use. It is not issued, endorsed or verified by any procuring agency or by PPRA.
              Criteria marked &quot;not stated&quot; were not found on the pages analysed and must be verified against the
              complete bidding document. Final responsibility for bid compliance rests with the bidding team.
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-800/50 flex items-center justify-between print:hidden">
          <span className="text-[11px] text-slate-400">
            Export compliant with NHA, LDA, C&W, WAPDA procurement guidelines.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
          >
            Close Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
