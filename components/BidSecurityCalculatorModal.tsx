'use client';

import React, { useState } from 'react';
import {
  Calculator,
  X,
  ShieldCheck,
  ShieldAlert,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building,
} from 'lucide-react';
import { SampleTenderDoc } from '../lib/types';
import { formatPKR } from '../lib/compliance_engine';

interface BidSecurityCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tender: SampleTenderDoc | any | null;
}

const SCHEDULED_PAKISTANI_BANKS = [
  { name: 'Habib Bank Limited (HBL)', rating: 'AAA', isScheduled: true },
  { name: 'National Bank of Pakistan (NBP)', rating: 'AAA', isScheduled: true },
  { name: 'United Bank Limited (UBL)', rating: 'AAA', isScheduled: true },
  { name: 'MCB Bank Limited', rating: 'AAA', isScheduled: true },
  { name: 'Allied Bank Limited (ABL)', rating: 'AAA', isScheduled: true },
  { name: 'Meezan Bank Limited', rating: 'AAA', isScheduled: true },
  { name: 'Bank Alfalah Limited', rating: 'AA+', isScheduled: true },
  { name: 'Askari Bank Limited', rating: 'AA+', isScheduled: true },
  { name: 'Faysal Bank Limited', rating: 'AA+', isScheduled: true },
  { name: 'Bank of Punjab (BOP)', rating: 'AA+', isScheduled: true },
  { name: 'Khyber Bank (BOK)', rating: 'A+', isScheduled: true },
  { name: 'Cooperative / Microfinance Bank (Non-Scheduled)', rating: 'B', isScheduled: false },
];

export function BidSecurityCalculatorModal({
  isOpen,
  onClose,
  tender,
}: BidSecurityCalculatorModalProps) {
  const tenderEstimatedCost = tender?.extractedData?.basicInfo?.estimatedCostPKR || 450000000;
  const tenderCdrRequired = tender?.extractedData?.financialCriteria?.cdrAmountPKR || 9000000;
  const tenderCdrPercent = tender?.extractedData?.financialCriteria?.cdrPercentage || 2;
  const procuringAgency = tender?.extractedData?.basicInfo?.procuringAgency || tender?.agency || 'Procuring Agency';

  // Contractor Input State
  const [estimatedCostInput, setEstimatedCostInput] = useState<number>(tenderEstimatedCost);
  const [requiredPercentInput, setRequiredPercentInput] = useState<number>(tenderCdrPercent);
  const [contractorCdrAmount, setContractorCdrAmount] = useState<number>(tenderCdrRequired);
  const [selectedBank, setSelectedBank] = useState<string>(SCHEDULED_PAKISTANI_BANKS[0].name);
  const [instrumentType, setInstrumentType] = useState<'CDR' | 'Bank_Guarantee' | 'Pay_Order'>('CDR');
  const [payeeTitle, setPayeeTitle] = useState<string>(`General Manager (RAMD), ${procuringAgency}`);
  const [validityDays, setValidityDays] = useState<number>(120);
  const [cdrNumber, setCdrNumber] = useState<string>('CDR-2026-894102');

  React.useEffect(() => {
    if (tender) {
      const cost = tender.extractedData?.basicInfo?.estimatedCostPKR || 450000000;
      const cdr = tender.extractedData?.financialCriteria?.cdrAmountPKR || 9000000;
      const pct = tender.extractedData?.financialCriteria?.cdrPercentage || 2;
      const agency = tender.extractedData?.basicInfo?.procuringAgency || tender.agency || 'Procuring Agency';
      setEstimatedCostInput(cost);
      setRequiredPercentInput(pct);
      setContractorCdrAmount(cdr);
      setPayeeTitle(`General Manager (RAMD), ${agency}`);
    }
  }, [tender, isOpen]);

  if (!isOpen) return null;

  // Computed Check Values
  const minRequiredCdrAmount = (estimatedCostInput * requiredPercentInput) / 100;
  const isAmountValid = contractorCdrAmount >= minRequiredCdrAmount;
  const bankObj = SCHEDULED_PAKISTANI_BANKS.find((b) => b.name === selectedBank);
  const isBankScheduled = bankObj?.isScheduled ?? true;
  const isBankRatingAcceptable = bankObj?.rating ? ['AAA', 'AA+', 'AA'].includes(bankObj.rating) : true;
  const isValidityAcceptable = validityDays >= 90;
  const isPayeeSpecified = payeeTitle.trim().length > 5;

  const isOverallCdrValid = isAmountValid && isBankScheduled && isBankRatingAcceptable && isValidityAcceptable && isPayeeSpecified;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#00401A] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#002D12]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-emerald-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 font-mono bg-[#002D12] px-2.5 py-0.5 rounded border border-emerald-700/50">
                  Financial Envelope Tool
                </span>
                <span className="text-xs text-emerald-200 font-medium">PPRA Rule 25 & Rule 36</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Call Deposit Receipt (CDR) & Earnest Money Ready-Calculator
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
          {/* Top Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
              isOverallCdrValid
                ? 'bg-emerald-50 border-emerald-300 text-[#00401A]'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              {isOverallCdrValid ? (
                <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-8 h-8 text-rose-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-mono font-extrabold uppercase tracking-wider">
                  {isOverallCdrValid ? 'CDR / Earnest Money Status: Ready for Financial Envelope' : 'Disqualification Risk: Invalid CDR Details'}
                </div>
                <div className="text-sm font-black">
                  {isOverallCdrValid
                    ? `Your CDR instrument of ${formatPKR(contractorCdrAmount)} complies with 2% Tender Security requirements.`
                    : 'The entered CDR details fail mandatory PPRA Rule 25 parameters. Correct issues below before sealing.'}
                </div>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider text-white shrink-0 ${
                isOverallCdrValid ? 'bg-[#00401A]' : 'bg-rose-600'
              }`}
            >
              {isOverallCdrValid ? 'PASS (Ready)' : 'REJECT (Fix Needed)'}
            </span>
          </div>

          {/* Calculator Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Tender Requirements & Calculation */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#00401A]" />
                <span>Tender Security Calculation</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Estimated Project Cost (PKR)</label>
                <input
                  type="number"
                  value={estimatedCostInput}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEstimatedCostInput(val);
                    setContractorCdrAmount((val * requiredPercentInput) / 100);
                  }}
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                />
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Equivalent: {formatPKR(estimatedCostInput)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Required Security %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={requiredPercentInput}
                    onChange={(e) => {
                      const pct = Number(e.target.value);
                      setRequiredPercentInput(pct);
                      setContractorCdrAmount((estimatedCostInput * pct) / 100);
                    }}
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Mandatory Min Amount</label>
                  <div className="w-full text-xs font-mono font-extrabold px-3 py-2 bg-slate-200 text-slate-800 border border-slate-300 rounded-lg">
                    {formatPKR(minRequiredCdrAmount)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Contractor Provided CDR Amount (PKR)</label>
                <input
                  type="number"
                  value={contractorCdrAmount}
                  onChange={(e) => setContractorCdrAmount(Number(e.target.value))}
                  className={`w-full text-xs font-extrabold px-3 py-2 bg-white border rounded-lg focus:outline-none ${
                    isAmountValid ? 'border-emerald-500 text-emerald-900' : 'border-rose-500 text-rose-900 bg-rose-50'
                  }`}
                />
                {!isAmountValid && (
                  <div className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Deficit of {formatPKR(minRequiredCdrAmount - contractorCdrAmount)}! Will cause instant disqualification.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Bank Instrument Parameters */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#00401A]" />
                <span>Bank Instrument Verification</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Issuing Bank Name</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                >
                  {SCHEDULED_PAKISTANI_BANKS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} [{b.rating} Rating]
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between font-mono">
                  <span>Credit Rating: {bankObj?.rating}</span>
                  <span className={isBankScheduled ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    {isBankScheduled ? 'State Bank Scheduled Bank ✓' : 'Non-Scheduled (Invalid) ✗'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Instrument Type</label>
                  <select
                    value={instrumentType}
                    onChange={(e) => setInstrumentType(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                  >
                    <option value="CDR">Call Deposit Receipt (CDR)</option>
                    <option value="Bank_Guarantee">Bank Guarantee</option>
                    <option value="Pay_Order">Pay Order / Demand Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className={`w-full text-xs font-bold px-3 py-2 bg-white border rounded-lg focus:outline-none ${
                      isValidityAcceptable ? 'border-slate-300' : 'border-rose-500 text-rose-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Payee Title (In Favor Of)</label>
                <input
                  type="text"
                  value={payeeTitle}
                  onChange={(e) => setPayeeTitle(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                />
                <div className="text-[10px] text-slate-500 mt-1">Must match exact title specified in the Tender Notice.</div>
              </div>
            </div>
          </div>

          {/* Verification Audit Checklist Cards */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Mandatory PPRA Rule 25 Compliance Checks:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${isAmountValid ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                <div className="flex items-center gap-2">
                  {isAmountValid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                  <span>CDR Amount &gt;= Required 2%</span>
                </div>
                <span className="font-mono font-bold">{formatPKR(contractorCdrAmount)}</span>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${isBankScheduled ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                <div className="flex items-center gap-2">
                  {isBankScheduled ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                  <span>Scheduled Bank (SBP Approved)</span>
                </div>
                <span className="font-mono font-bold">{bankObj?.rating}</span>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${isValidityAcceptable ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                <div className="flex items-center gap-2">
                  {isValidityAcceptable ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                  <span>Instrument Validity Period</span>
                </div>
                <span className="font-mono font-bold">{validityDays} Days</span>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${isPayeeSpecified ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                <div className="flex items-center gap-2">
                  {isPayeeSpecified ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                  <span>Exact Procuring Agency Payee Title</span>
                </div>
                <span className="font-mono font-bold">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Rule 25: Procuring agency shall forfeit bid security if bidder withdraws during bid validity.
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
