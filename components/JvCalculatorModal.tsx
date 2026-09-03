'use client';

import React, { useState } from 'react';
import {
  Users,
  X,
  ShieldCheck,
  ShieldAlert,
  Building2,
  AlertCircle,
  CheckCircle2,
  PieChart,
  Layers,
  Award,
} from 'lucide-react';
import { SampleTenderDoc } from '../lib/types';
import { formatPKR } from '../lib/compliance_engine';

interface JvCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tender: SampleTenderDoc | any | null;
}

interface JvPartner {
  name: string;
  sharePercent: number;
  pecCategory: string;
  avgTurnoverPKR: number;
  isBlacklisted: boolean;
  hasLitigation: boolean;
}

export function JvCalculatorModal({
  isOpen,
  onClose,
  tender,
}: JvCalculatorModalProps) {
  // Requirements not stated in the tender stay 0 and are shown as "Not stated"
  // — the calculator never substitutes typical values.
  const tenderTurnoverRequired = tender?.extractedData?.financialCriteria?.minAvgAnnualTurnoverPKR || 0;
  const tenderMaxJvPartners = tender?.extractedData?.jvRules?.maxPartners || 0;
  const minLeadSharePercent = tender?.extractedData?.jvRules?.leadPartnerMinSharePercent || 0;
  const minPartnerSharePercent = tender?.extractedData?.jvRules?.otherPartnerMinSharePercent || 0;
  const partnerCapForUi = tenderMaxJvPartners > 0 ? tenderMaxJvPartners : 10;

  // Contractor Input State: two empty partner rows — turnovers are the
  // bidder's own inputs and start at 0.
  const [partners, setPartners] = useState<JvPartner[]>([
    {
      name: 'M/s Lead Contractor (Partner A)',
      sharePercent: 60,
      pecCategory: 'C-2',
      avgTurnoverPKR: 0,
      isBlacklisted: false,
      hasLitigation: false,
    },
    {
      name: 'M/s Associate Builder (Partner B)',
      sharePercent: 40,
      pecCategory: 'C-3',
      avgTurnoverPKR: 0,
      isBlacklisted: false,
      hasLitigation: false,
    },
  ]);

  if (!isOpen) return null;

  // Total Shares Check
  const totalSharePercent = partners.reduce((sum, p) => sum + p.sharePercent, 0);
  const isSharesSum100 = totalSharePercent === 100;

  // Lead Partner Identification & Checks (only enforceable when stated)
  const leadPartner = [...partners].sort((a, b) => b.sharePercent - a.sharePercent)[0];
  const isLeadShareValid = minLeadSharePercent === 0 || leadPartner.sharePercent >= minLeadSharePercent;

  // Other Partners Checks
  const nonLeadPartners = partners.filter((p) => p !== leadPartner);
  const isOtherPartnersValid =
    minPartnerSharePercent === 0 || nonLeadPartners.every((p) => p.sharePercent >= minPartnerSharePercent);

  // Combined Financial Turnover Check
  const combinedTurnoverPKR = partners.reduce((sum, p) => sum + p.avgTurnoverPKR, 0);
  const isTurnoverValid = tenderTurnoverRequired === 0 || combinedTurnoverPKR >= tenderTurnoverRequired;

  // Partner Disqualification Check
  const anyPartnerBlacklisted = partners.some((p) => p.isBlacklisted);

  const hasStatedRules =
    tenderTurnoverRequired > 0 || tenderMaxJvPartners > 0 || minLeadSharePercent > 0 || minPartnerSharePercent > 0;

  const isOverallJvEligible =
    isSharesSum100 &&
    isLeadShareValid &&
    isOtherPartnersValid &&
    isTurnoverValid &&
    !anyPartnerBlacklisted &&
    (tenderMaxJvPartners === 0 || partners.length <= tenderMaxJvPartners);

  const updatePartner = (index: number, field: keyof JvPartner, value: any) => {
    setPartners((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addPartner = () => {
    if (partners.length >= partnerCapForUi) return;
    setPartners((prev) => [
      ...prev,
      {
        name: `M/s JV Partner ${prev.length + 1}`,
        sharePercent: 0,
        pecCategory: 'C-4',
        avgTurnoverPKR: 0,
        isBlacklisted: false,
        hasLitigation: false,
      },
    ]);
  };

  const removePartner = (index: number) => {
    if (partners.length <= 2) return;
    setPartners((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#00401A] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#002D12]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-emerald-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 font-mono bg-[#002D12] px-2.5 py-0.5 rounded border border-emerald-700/50">
                  Contractor Consortium Engine
                </span>
                <span className="text-xs text-emerald-200 font-medium">PEC JV Bye-Laws Compliant</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Joint Venture (JV) Partner Capability & Share Evaluator
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
          {/* Top Overall Result Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
              isOverallJvEligible
                ? 'bg-emerald-50 border-emerald-300 text-[#00401A]'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              {isOverallJvEligible ? (
                <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-8 h-8 text-rose-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-mono font-extrabold uppercase tracking-wider">
                  {isOverallJvEligible
                    ? 'Joint Venture (JV) Qualified under PPRA & PEC Rules'
                    : 'Joint Venture Disqualification Warning'}
                </div>
                <div className="text-sm font-black">
                  {isOverallJvEligible
                    ? hasStatedRules
                      ? tenderTurnoverRequired > 0
                        ? `Combined Turnover of ${formatPKR(combinedTurnoverPKR)} meets the stated requirement (${formatPKR(tenderTurnoverRequired)}).`
                        : 'Configuration satisfies the JV rules stated in the analysed pages.'
                      : 'No JV thresholds were stated on the pages analysed — verify the JV clause manually before relying on this result.'
                    : 'Your JV configuration violates minimum share thresholds or financial turnover rules. Adjust partner parameters below.'}
                </div>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider text-white shrink-0 ${
                isOverallJvEligible ? 'bg-[#00401A]' : 'bg-rose-600'
              }`}
            >
              {isOverallJvEligible ? 'JV ELIGIBLE' : 'JV INELIGIBLE'}
            </span>
          </div>

          {/* Tender JV Mandatory Rules Summary Bar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Max JV Partners</div>
              <div className="font-extrabold text-slate-900">{tenderMaxJvPartners > 0 ? `${tenderMaxJvPartners} Partners Max` : 'Not stated'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Lead Partner Min Share</div>
              <div className="font-extrabold text-[#00401A]">{minLeadSharePercent > 0 ? `${minLeadSharePercent}% Minimum` : 'Not stated'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Minor Partner Min Share</div>
              <div className="font-extrabold text-slate-900">{minPartnerSharePercent > 0 ? `${minPartnerSharePercent}% Minimum` : 'Not stated'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Required Combined Turnover</div>
              <div className="font-extrabold text-emerald-800">{tenderTurnoverRequired > 0 ? formatPKR(tenderTurnoverRequired) : 'Not stated'}</div>
            </div>
          </div>

          {/* Partner Configurator Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Consortium Partners ({partners.length}{tenderMaxJvPartners > 0 ? ` / ${tenderMaxJvPartners}` : ' — cap not stated'}):
              </label>
              {partners.length < partnerCapForUi && (
                <button
                  onClick={addPartner}
                  className="bg-[#00401A] hover:bg-[#002D12] text-white text-xs px-3 py-1 rounded-lg font-bold transition-all shadow-xs cursor-pointer"
                >
                  + Add JV Partner
                </button>
              )}
            </div>

            <div className="space-y-3">
              {partners.map((partner, idx) => {
                const isLead = partner === leadPartner;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      isLead
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white ${
                            isLead ? 'bg-[#00401A]' : 'bg-slate-600'
                          }`}
                        >
                          P{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={partner.name}
                          onChange={(e) => updatePartner(idx, 'name', e.target.value)}
                          className="text-xs font-extrabold bg-transparent text-slate-900 border-b border-dashed border-slate-400 focus:outline-none focus:border-[#00401A] px-1 py-0.5"
                        />
                        {isLead && (
                          <span className="text-[10px] font-mono font-bold bg-[#00401A] text-emerald-200 px-2 py-0.5 rounded uppercase">
                            Lead Partner ({partner.sharePercent}%)
                          </span>
                        )}
                      </div>

                      {partners.length > 2 && (
                        <button
                          onClick={() => removePartner(idx)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Share Percentage (%)
                        </label>
                        <input
                          type="number"
                          value={partner.sharePercent}
                          onChange={(e) => updatePartner(idx, 'sharePercent', Number(e.target.value))}
                          className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          PEC Category
                        </label>
                        <select
                          value={partner.pecCategory}
                          onChange={(e) => updatePartner(idx, 'pecCategory', e.target.value)}
                          className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                        >
                          {['C-A', 'C-B', 'C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6'].map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          3-Yr Avg Annual Turnover (PKR)
                        </label>
                        <input
                          type="number"
                          value={partner.avgTurnoverPKR}
                          onChange={(e) => updatePartner(idx, 'avgTurnoverPKR', Number(e.target.value))}
                          className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                        />
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          {formatPKR(partner.avgTurnoverPKR)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation Checklist Cards */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              PPRA & PEC Joint Venture Legal Audit Checks:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${isSharesSum100 ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                <div className="flex items-center gap-2">
                  {isSharesSum100 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                  <span>JV Equity Shares Sum Exactly 100%</span>
                </div>
                <span className="font-mono font-bold">{totalSharePercent}%</span>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${isLeadShareValid ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                <div className="flex items-center gap-2">
                  {isLeadShareValid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                  <span>Lead Partner Share {minLeadSharePercent > 0 ? `>= ${minLeadSharePercent}%` : '(threshold not stated)'}</span>
                </div>
                <span className="font-mono font-bold">{leadPartner.sharePercent}%</span>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${isTurnoverValid ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                <div className="flex items-center gap-2">
                  {isTurnoverValid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                  <span>Combined Financial Turnover</span>
                </div>
                <span className="font-mono font-bold">{formatPKR(combinedTurnoverPKR)}</span>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center justify-between ${isOtherPartnersValid ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
                <div className="flex items-center gap-2">
                  {isOtherPartnersValid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                  <span>Minor Partner Thresholds {minPartnerSharePercent > 0 ? `>= ${minPartnerSharePercent}%` : '(not stated)'}</span>
                </div>
                <span className="font-mono font-bold">{isOtherPartnersValid ? 'Pass' : 'Fail'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            PEC Regulation: Joint Venture Deed must be registered on Judicial Stamp Paper & signed by all partner heads.
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
