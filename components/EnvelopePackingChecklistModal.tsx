'use client';

import React, { useState } from 'react';
import {
  FolderCheck,
  X,
  CheckSquare,
  Square,
  AlertOctagon,
  ShieldCheck,
  Printer,
  FileCheck,
  Layers,
  Building,
  Lock,
} from 'lucide-react';
import { SampleTenderDoc, BidderProfile } from '../lib/types';

interface EnvelopePackingChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  tender: SampleTenderDoc | any | null;
  bidder: BidderProfile;
}

interface ChecklistItem {
  id: string;
  envelope: 'A' | 'B'; // Envelope A = Technical, Envelope B = Financial
  title: string;
  description: string;
  mandatory: boolean;
  checked: boolean;
  disqualificationRiskNote: string;
}

const INITIAL_CHECKLIST_ITEMS: ChecklistItem[] = [
  // ENVELOPE A (TECHNICAL PROPOSAL)
  {
    id: 'tech-1',
    envelope: 'A',
    title: 'Valid PEC License Copy & Renewal Receipt',
    description: 'Attested copy of active PEC registration in required category with CE01/BC01 codes.',
    mandatory: true,
    checked: true,
    disqualificationRiskNote: 'Expired PEC license causes instant rejection under PPRA Rule 36.',
  },
  {
    id: 'tech-2',
    envelope: 'A',
    title: 'FBR Active Taxpayer List (ATL) Certificate & NTN',
    description: 'FBR Online Verification printout showing Active Status for FY 2026.',
    mandatory: true,
    checked: true,
    disqualificationRiskNote: 'In-active taxpayer status disqualifies firm from receiving government payments.',
  },
  {
    id: 'tech-3',
    envelope: 'A',
    title: 'Judicial Stamp Affidavits (Rs. 500 Non-Blacklisting & Correctness)',
    description: 'Original Rs. 500 Judicial Stamp Paper attested by Oath Commissioner.',
    mandatory: true,
    checked: true,
    disqualificationRiskNote: 'Non-judicial paper or missing notary stamp leads to technical disqualification.',
  },
  {
    id: 'tech-4',
    envelope: 'A',
    title: '3-Year Audited Financial Statements & Turnover Certificate',
    description: 'Audited accounts certified by ICAP-registered Chartered Accountant.',
    mandatory: true,
    checked: true,
    disqualificationRiskNote: 'Unaudited or un-certified accounts are rejected during technical scoring.',
  },
  {
    id: 'tech-[#5]',
    envelope: 'A',
    title: 'Past 5 Years Work Completion Certificates & Client Performance Letters',
    description: 'Substantially completed projects of similar scale signed by Executive Engineer / Director.',
    mandatory: true,
    checked: true,
    disqualificationRiskNote: 'Missing client signatures or unverified project values deduct technical marks.',
  },
  {
    id: 'tech-6',
    envelope: 'A',
    title: 'Joint Venture (JV) Agreement (If Applicable)',
    description: 'Registered JV Deed defining Lead Partner (50%+) & Minor Partners.',
    mandatory: false,
    checked: false,
    disqualificationRiskNote: 'Unnotarized JV agreements are legally void under PEC guidelines.',
  },
  {
    id: 'tech-7',
    envelope: 'A',
    title: 'Unpriced Technical Bid Form & Equipment List',
    description: 'Technical Proposal Form signed & stamped on every single page.',
    mandatory: true,
    checked: true,
    disqualificationRiskNote: 'Unsigned pages give competing bidders grounds for grievance under Rule 48.',
  },

  // ENVELOPE B (FINANCIAL PROPOSAL)
  {
    id: 'fin-1',
    envelope: 'B',
    title: 'Original Call Deposit Receipt (CDR) / Bid Security',
    description: '2% Earnest money draft issued by SBP Scheduled Bank in favor of Procuring Agency.',
    mandatory: true,
    checked: true,
    disqualificationRiskNote: 'CRITICAL: Placing CDR in Envelope A causes INSTANT DISQUALIFICATION!',
  },
  {
    id: 'fin-2',
    envelope: 'B',
    title: 'Priced Bill of Quantities (BOQ) with Unit Rates & Total Premium %',
    description: 'BOQ sheet filled in ink/typed, initialed by authorized signatory on every page.',
    mandatory: true,
    checked: true,
    disqualificationRiskNote: 'Calculations errors exceeding 2% or overwritten un-initialed rates cause rejection.',
  },
  {
    id: 'fin-3',
    envelope: 'B',
    title: 'Financial Bid Form & Rebate Letter (If Any)',
    description: 'Official letterhead bid price declaration sealed inside Envelope B.',
    mandatory: true,
    checked: true,
    disqualificationRiskNote: 'Disclosing financial prices inside Envelope A invalidates the entire submission.',
  },
];

export function EnvelopePackingChecklistModal({
  isOpen,
  onClose,
  tender,
  bidder,
}: EnvelopePackingChecklistModalProps) {
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_CHECKLIST_ITEMS);

  if (!isOpen) return null;

  const toggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const techItems = items.filter((i) => i.envelope === 'A');
  const finItems = items.filter((i) => i.envelope === 'B');

  const techChecked = techItems.filter((i) => i.checked).length;
  const finChecked = finItems.filter((i) => i.checked).length;

  const totalMandatory = items.filter((i) => i.mandatory).length;
  const checkedMandatory = items.filter((i) => i.mandatory && i.checked).length;
  const isFullyPrepared = checkedMandatory === totalMandatory;

  const handlePrintSlip = () => {
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Envelope Packing Slip - ${tender?.ppraRef || tender?.extractedData?.basicInfo?.ppraReferenceNo || 'N/A'} - ${bidder?.companyName || ''}</title>
  <style>
    body { font-family: system-ui, sans-serif; font-size: 11pt; padding: 30px; color: #0f172a; }
    h1 { color: #00401A; font-size: 18pt; margin-bottom: 5px; text-transform: uppercase; }
    .badge { background: #00401A; color: white; padding: 4px 8px; font-weight: bold; border-radius: 4px; font-size: 10px; }
    .section { border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: #f8fafc; }
    .section-title { font-weight: 800; font-size: 12pt; border-bottom: 2px solid #00401A; padding-bottom: 5px; margin-bottom: 10px; color: #00401A; }
    ul { list-style: none; padding-left: 0; }
    li { padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 10pt; display: flex; align-items: center; justify-content: space-between; }
    .status { font-weight: bold; }
  </style>
</head>
<body>
  <span class="badge">KAREZ 2.0 CONTRACTOR DOSSIER VERIFICATION</span>
  <h1>Tender Envelope Sealing Checklist (PPRA Rule 36-b)</h1>
  <p><strong>Contractor Firm:</strong> ${bidder.companyName} | <strong>Tender Ref:</strong> ${tender.ppraRef}</p>
  <p><strong>Procuring Agency:</strong> ${tender.agency}</p>
  
  <div class="section">
    <div class="section-title">ENVELOPE A: TECHNICAL PROPOSAL (SEALED)</div>
    <ul>
      ${techItems
        .map(
          (i) =>
            `<li><span>[ ${i.checked ? '✔' : '❌'} ] <strong>${i.title}</strong></span> <span class="status">${
              i.checked ? 'VERIFIED INCLUDED' : 'MISSING'
            }</span></li>`
        )
        .join('')}
    </ul>
  </div>

  <div class="section">
    <div class="section-title">ENVELOPE B: FINANCIAL PROPOSAL (SEALED WITH ORIGINAL CDR)</div>
    <ul>
      ${finItems
        .map(
          (i) =>
            `<li><span>[ ${i.checked ? '✔' : '❌'} ] <strong>${i.title}</strong></span> <span class="status">${
              i.checked ? 'VERIFIED INCLUDED' : 'MISSING'
            }</span></li>`
        )
        .join('')}
    </ul>
  </div>

  <div style="margin-top: 30px; text-align: right; font-weight: bold;">
    <p>Sealed & Verified By Bidding Specialist: ___________________________</p>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
      printWin.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#00401A] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#002D12]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-emerald-300">
              <FolderCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 font-mono bg-[#002D12] px-2.5 py-0.5 rounded border border-emerald-700/50">
                  Pre-Submission Sealing Tool
                </span>
                <span className="text-xs text-emerald-200 font-medium">Single Stage - Two Envelope (Rule 36-b)</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Bidding Envelope Packing & Disqualification Prevention Checklist
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top Envelope Warning Banner */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
            <AlertOctagon className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-mono font-extrabold text-amber-900 uppercase tracking-wider">
                PPRA Rule 36-b Strict Separation Rule:
              </div>
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                Under Pakistani Single-Stage Two-Envelope bidding, <strong>Envelope A (Technical)</strong> and <strong>Envelope B (Financial)</strong> must be sealed separately. Never include financial figures or the original CDR in Envelope A — doing so will trigger non-negotiable instant disqualification.
              </p>
            </div>
          </div>

          {/* Readiness Gauge Bar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Dossier Preparation Progress:
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {checkedMandatory} of {totalMandatory} Mandatory Requirements Checked & Verified
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrintSlip}
                className="bg-white hover:bg-slate-100 text-[#00401A] border border-slate-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#00401A]" />
                <span>Print Sealing Slip</span>
              </button>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider text-white ${
                  isFullyPrepared ? 'bg-[#00401A]' : 'bg-amber-600'
                }`}
              >
                {isFullyPrepared ? '100% READY TO SEAL' : 'CHECKLIST INCOMPLETE'}
              </span>
            </div>
          </div>

          {/* Envelopes Split View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Envelope A Column */}
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="bg-slate-100 p-3 border-b border-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#00401A] text-white flex items-center justify-center font-bold text-xs">
                    A
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-tight">
                      ENVELOPE A: Technical Proposal
                    </h3>
                    <div className="text-[10px] text-slate-500 font-medium">Unpriced Technical & Legal Dossier</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-extrabold text-[#00401A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {techChecked}/{techItems.length} Verified
                </span>
              </div>

              <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto">
                {techItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      item.checked
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button className="mt-0.5 shrink-0 text-[#00401A]">
                      {item.checked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>{item.title}</span>
                        {item.mandatory && (
                          <span className="text-[9px] font-mono font-extrabold uppercase bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 leading-normal">{item.description}</div>
                      <div className="text-[10px] text-rose-700 font-mono font-medium mt-1">
                        ⚠️ {item.disqualificationRiskNote}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Envelope B Column */}
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="bg-slate-100 p-3 border-b border-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    B
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-tight">
                      ENVELOPE B: Financial Proposal
                    </h3>
                    <div className="text-[10px] text-slate-500 font-medium">Priced BOQ & Original CDR Security</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {finChecked}/{finItems.length} Verified
                </span>
              </div>

              <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto">
                {finItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      item.checked
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button className="mt-0.5 shrink-0 text-amber-700">
                      {item.checked ? (
                        <CheckSquare className="w-4 h-4 text-amber-700" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>{item.title}</span>
                        {item.mandatory && (
                          <span className="text-[9px] font-mono font-extrabold uppercase bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 leading-normal">{item.description}</div>
                      <div className="text-[10px] text-rose-700 font-mono font-medium mt-1">
                        ⚠️ {item.disqualificationRiskNote}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Rule 36-b: Financial proposals are held unopened in safe custody until technical evaluation completion.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#00401A] hover:bg-[#002D12] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
