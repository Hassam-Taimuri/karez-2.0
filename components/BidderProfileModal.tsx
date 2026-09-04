'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, X, Check, RefreshCw, Building2, ShieldAlert } from 'lucide-react';
import { BidderProfile, PECCategory } from '../lib/types';
import { formatPKR, MAX_PLAUSIBLE_TURNOVER_PKR, MAX_PLAUSIBLE_CDR_PKR } from '../lib/compliance_engine';

interface BidderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  bidder: BidderProfile;
  onSave: (updated: BidderProfile) => void | Promise<void>;
}

export function BidderProfileModal({
  isOpen,
  onClose,
  bidder,
  onSave,
}: BidderProfileModalProps) {
  const [formData, setFormData] = useState<BidderProfile>(bidder);

  // Re-sync the form whenever the modal opens: the active bidder may have
  // changed since last time (new blank client, sample profile, client switch).
  useEffect(() => {
    if (isOpen) setFormData(bidder);
  }, [isOpen, bidder]);

  if (!isOpen) return null;

  const handleChange = (field: keyof BidderProfile, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isFirstTimeSetup = !bidder.companyName;
  const canSave = formData.companyName.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ ...formData, companyName: formData.companyName.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#CDE0D2] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#002D12] flex items-center justify-between bg-[#00401A] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                Bidder Credentials & Parameters Manager
              </h3>
              <p className="text-xs text-emerald-100/80">
                Modify contractor specs to trigger live PPRA compliance recalculation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800 bg-[#F8FAF8]">
          {/* First-time setup banner */}
          {isFirstTimeSetup && (
            <div className="bg-[#E6F2EB] border border-[#00401A]/30 rounded-xl p-3.5 flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-[#00401A] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#00401A]">Welcome — set up your company profile</div>
                <div className="text-slate-600 mt-0.5">
                  Your account starts blank: no specs, no history, no assumed values. Enter your firm&apos;s
                  real details below — the compliance engine audits tenders against exactly what you save here.
                  You can update any of it later from &quot;Bidder Specs&quot;.
                </div>
              </div>
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="font-bold text-[#00401A] block mb-1">
              Company / Firm Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="e.g. M/s Your Construction Company (Pvt) Ltd"
              className="w-full bg-white border border-[#CDE0D2] focus:border-[#00401A] focus:ring-1 focus:ring-[#00401A] rounded-lg p-2.5 text-slate-900 focus:outline-none transition-all"
            />
            {!canSave && (
              <span className="text-[10px] text-rose-600 font-semibold mt-1 block">
                Company name is required before the profile can be saved.
              </span>
            )}
          </div>

          {/* PEC Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[#00401A] block mb-1">
                PEC Registration Category
              </label>
              <select
                value={formData.pecCategory ?? ''}
                onChange={(e) => handleChange('pecCategory', e.target.value === '' ? null : (e.target.value as PECCategory))}
                className="w-full bg-white border border-[#CDE0D2] focus:border-[#00401A] focus:ring-1 focus:ring-[#00401A] rounded-lg p-2.5 text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="">— Select PEC category —</option>
                <option value="C-A">C-A (No Limit)</option>
                <option value="C-B">C-B (Up to PKR 3,000M)</option>
                <option value="C-1">C-1 (Up to PKR 1,000M)</option>
                <option value="C-2">C-2 (Up to PKR 500M)</option>
                <option value="C-3">C-3 (Up to PKR 200M)</option>
                <option value="C-4">C-4 (Up to PKR 100M)</option>
                <option value="C-5">C-5 (Up to PKR 50M)</option>
                <option value="C-6">C-6 (Up to PKR 25M)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#00401A] block mb-1">
                PEC License Renewal Status
              </label>
              <select
                value={formData.pecStatus}
                onChange={(e) => handleChange('pecStatus', e.target.value)}
                className="w-full bg-white border border-[#CDE0D2] focus:border-[#00401A] focus:ring-1 focus:ring-[#00401A] rounded-lg p-2.5 text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE (Renewed for FY 2026-27)</option>
                <option value="EXPIRED">EXPIRED (Not Renewed)</option>
                <option value="SUSPENDED">SUSPENDED / BLACKLISTED</option>
              </select>
            </div>
          </div>

          {/* Financial Turnover & CDR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[#00401A] block mb-1">
                3-Year Avg Turnover (PKR)
              </label>
              <input
                type="number"
                value={formData.avgAnnualTurnoverPKR || ''}
                onChange={(e) => handleChange('avgAnnualTurnoverPKR', Number(e.target.value))}
                placeholder="e.g. 850000000 for PKR 850 Million"
                className="w-full bg-white border border-[#CDE0D2] focus:border-[#00401A] focus:ring-1 focus:ring-[#00401A] rounded-lg p-2.5 text-slate-900 focus:outline-none font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Formatted: {formatPKR(formData.avgAnnualTurnoverPKR)}
              </span>
              {formData.avgAnnualTurnoverPKR > MAX_PLAUSIBLE_TURNOVER_PKR && (
                <span className="text-[10px] text-red-600 font-bold mt-1 block">
                  Implausible value ({formatPKR(formData.avgAnnualTurnoverPKR)}). Even the largest Pakistani
                  contractors report tens of billions PKR — check for extra zeros. The audit will flag this.
                </span>
              )}
            </div>

            <div>
              <label className="font-bold text-[#00401A] block mb-1">
                Call Deposit Receipt (CDR) Attached (PKR)
              </label>
              <input
                type="number"
                value={formData.cdrAvailableAmountPKR || ''}
                onChange={(e) => handleChange('cdrAvailableAmountPKR', Number(e.target.value))}
                placeholder="e.g. 850000000 for PKR 850 Million"
                className="w-full bg-white border border-[#CDE0D2] focus:border-[#00401A] focus:ring-1 focus:ring-[#00401A] rounded-lg p-2.5 text-slate-900 focus:outline-none font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Formatted: {formatPKR(formData.cdrAvailableAmountPKR)}
              </span>
              {formData.cdrAvailableAmountPKR > MAX_PLAUSIBLE_CDR_PKR && (
                <span className="text-[10px] text-red-600 font-bold mt-1 block">
                  Implausible CDR ({formatPKR(formData.cdrAvailableAmountPKR)}). Bid securities run 2–5% of
                  project cost — check for extra zeros. The audit will flag this.
                </span>
              )}
            </div>
          </div>

          {/* FBR NTN Number & Liquid Assets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[#00401A] block mb-1">
                FBR NTN (National Tax Number)
              </label>
              <input
                type="text"
                value={formData.fbrRegistrationNumber}
                onChange={(e) => handleChange('fbrRegistrationNumber', e.target.value)}
                placeholder="e.g. 1234567-8"
                className="w-full bg-white border border-[#CDE0D2] focus:border-[#00401A] focus:ring-1 focus:ring-[#00401A] rounded-lg p-2.5 text-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-[#00401A] block mb-1">
                Liquid Assets / Working Capital (PKR)
              </label>
              <input
                type="number"
                value={formData.liquidAssetsPKR || ''}
                onChange={(e) => handleChange('liquidAssetsPKR', Number(e.target.value))}
                placeholder="e.g. 350000000 for PKR 350 Million"
                className="w-full bg-white border border-[#CDE0D2] focus:border-[#00401A] focus:ring-1 focus:ring-[#00401A] rounded-lg p-2.5 text-slate-900 focus:outline-none font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Formatted: {formatPKR(formData.liquidAssetsPKR)}
              </span>
            </div>
          </div>

          {/* PEC Specialization Codes & Bank Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[#00401A] block mb-1">
                PEC Specialization Codes
              </label>
              <input
                type="text"
                value={formData.pecSpecializationCodes.join(', ')}
                onChange={(e) =>
                  handleChange(
                    'pecSpecializationCodes',
                    e.target.value
                      .split(',')
                      .map((c) => c.trim().toUpperCase())
                      .filter(Boolean)
                  )
                }
                placeholder="e.g. CE01, CE02, BC01 (comma separated)"
                className="w-full bg-white border border-[#CDE0D2] focus:border-[#00401A] focus:ring-1 focus:ring-[#00401A] rounded-lg p-2.5 text-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-[#00401A] block mb-1">
                Bank Credit Rating (Optional)
              </label>
              <input
                type="text"
                value={formData.bankRating}
                onChange={(e) => handleChange('bankRating', e.target.value)}
                placeholder="e.g. AA (PACRA/VIS rating of your bank)"
                className="w-full bg-white border border-[#CDE0D2] focus:border-[#00401A] focus:ring-1 focus:ring-[#00401A] rounded-lg p-2.5 text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Stamp Paper Denomination & FBR ATL Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[#00401A] block mb-1">
                Non-Blacklisting Affidavit Prepared (Stamp Value)
              </label>
              <select
                value={formData.uploadedAffidavits[0]?.stampPaperValuePKR ?? 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val === 0) {
                    handleChange('uploadedAffidavits', []);
                    return;
                  }
                  const updatedAffs = [...formData.uploadedAffidavits];
                  if (updatedAffs[0]) {
                    updatedAffs[0] = { ...updatedAffs[0], stampPaperValuePKR: val };
                  } else {
                    updatedAffs.push({
                      title: 'Affidavit of Non-Blacklisting & Non-Litigation',
                      stampPaperValuePKR: val,
                      hasBlacklistingStatement: true,
                      hasLitigationStatement: true,
                      isJudicialVerified: true,
                    });
                  }
                  handleChange('uploadedAffidavits', updatedAffs);
                }}
                className="w-full bg-white border border-[#CDE0D2] focus:border-[#00401A] focus:ring-1 focus:ring-[#00401A] rounded-lg p-2.5 text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value={0}>None prepared yet</option>
                <option value={500}>Rs. 500 Judicial Stamp Paper</option>
                <option value={100}>Rs. 100 Non-Judicial Stamp Paper (Defective for NHA)</option>
                <option value={50}>Rs. 50 Stamp Paper</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#00401A] block mb-1">
                FBR NTN Active Taxpayer List (ATL) Status
              </label>
              <select
                value={formData.ntnStatus}
                onChange={(e) => handleChange('ntnStatus', e.target.value)}
                className="w-full bg-white border border-[#CDE0D2] focus:border-[#00401A] focus:ring-1 focus:ring-[#00401A] rounded-lg p-2.5 text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="ACTIVE_TAXPAYER">ACTIVE_TAXPAYER (Appears on FBR ATL)</option>
                <option value="INACTIVE">INACTIVE (Failed FBR ATL Check)</option>
              </select>
            </div>
          </div>

          {/* Joint Venture Settings */}
          <div className="bg-[#E6F2EB] p-3.5 rounded-xl border border-[#B2D8C0] space-y-3">
            <label className="flex items-center gap-2 font-bold text-[#00401A] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isJV}
                onChange={(e) => handleChange('isJV', e.target.checked)}
                className="w-4 h-4 rounded border-[#00401A] text-[#00401A] focus:ring-[#00401A]"
              />
              <span>Bidding as a Joint Venture (JV) Entity</span>
            </label>

            {formData.isJV && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] text-[#00401A] font-semibold block mb-1">JV Role</label>
                  <select
                    value={formData.jvRole || 'LEAD'}
                    onChange={(e) => handleChange('jvRole', e.target.value)}
                    className="w-full bg-white border border-[#CDE0D2] rounded p-2 text-slate-900"
                  >
                    <option value="LEAD">LEAD Partner</option>
                    <option value="MEMBER">MEMBER Partner</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#00401A] font-semibold block mb-1">
                    Lead Partner Share %
                  </label>
                  <input
                    type="number"
                    value={formData.jvLeadPartnerSharePercent || 50}
                    onChange={(e) => handleChange('jvLeadPartnerSharePercent', Number(e.target.value))}
                    className="w-full bg-white border border-[#CDE0D2] rounded p-2 text-slate-900 font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#CDE0D2] bg-[#F4F8F5] flex items-center justify-between">
          <span className="text-[11px] text-slate-600 font-medium">
            Changes will immediately re-run the compliance engine.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`px-5 py-2 rounded-lg font-extrabold flex items-center gap-1.5 shadow-md transition-all ${
                canSave
                  ? 'bg-[#00401A] hover:bg-[#003315] text-white shadow-[#00401A]/20 cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isFirstTimeSetup ? 'Save Profile & Start' : 'Apply & Re-Audit'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
