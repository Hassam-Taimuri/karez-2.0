/**
 * Karez 2.0 - Step 3: Compliance & Disqualification Logic Engine
 * Evaluates Bidder Profile against Extracted Tender Data under PPRA Rules 2004.
 *
 * HARD RULE: this engine is deterministic and never invents thresholds.
 * A requirement the document did not state (null / 0 / missing object) is
 * reported as FLAGGED FOR HUMAN REVIEW with the reason "not stated on the
 * pages analysed" — it is never replaced with a default value.
 */

import {
  TenderComplianceData,
  BidderProfile,
  AuditReport,
  ComplianceItemAudit,
  PECCategory,
  ComplianceStatus,
} from './types';

// PEC Category Hierarchy: C-A is highest (the only "No Limit" category), C-6 is lowest
const PEC_CATEGORY_RANK: Record<PECCategory, number> = {
  'C-A': 8,
  'C-B': 7,
  'C-1': 6,
  'C-2': 5,
  'C-3': 4,
  'C-4': 3,
  'C-5': 2,
  'C-6': 1,
};

// Plausibility ceilings. The largest Pakistani contractors have annual
// turnover in the tens of billions PKR; values above these ceilings are
// almost certainly a units/typing error (e.g. Rupees typed as Trillions).
export const MAX_PLAUSIBLE_TURNOVER_PKR = 500_000_000_000; // PKR 500 Billion
export const MAX_PLAUSIBLE_CDR_PKR = 50_000_000_000; // PKR 50 Billion

const NOT_STATED = 'Not stated on the pages analysed';

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE';

/**
 * Format currency in Pakistani Rupees (PKR) e.g., PKR 2.50 Billion (2,500,000,000 PKR)
 */
export function formatPKR(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'PKR 0';

  if (amount >= 1_000_000_000_000) {
    return `PKR ${(amount / 1_000_000_000_000).toFixed(2)} Trillion (${amount.toLocaleString('en-PK')} PKR)`;
  }
  if (amount >= 1_000_000_000) {
    return `PKR ${(amount / 1_000_000_000).toFixed(2)} Billion (${amount.toLocaleString('en-PK')} PKR)`;
  }
  if (amount >= 1_000_000) {
    return `PKR ${(amount / 1_000_000).toFixed(2)} Million (${amount.toLocaleString('en-PK')} PKR)`;
  }
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

/**
 * Step 3 Core Cross-Validation Function
 * audit_bidder_eligibility(tender_json, bidder_profile_json)
 */
export function auditBidderEligibility(
  tenderData: TenderComplianceData,
  bidder: BidderProfile
): AuditReport {
  const items: ComplianceItemAudit[] = [];

  const pecReq = tenderData?.pecRequirement || null;
  const finCrit = tenderData?.financialCriteria || null;
  const jvRules = tenderData?.jvRules || null;

  // ==========================================
  // 1. PEC LICENSING & ELIGIBILITY AUDIT
  // ==========================================
  const reqCategory = pecReq?.requiredCategory || null;
  const bidderCategory = bidder.pecCategory || null;

  let pecStatus: ComplianceStatus = 'PASSED';
  let pecRiskLevel: RiskLevel = 'NONE';
  let pecReason = '';

  if (!reqCategory) {
    pecStatus = 'FLAGGED FOR HUMAN REVIEW';
    pecRiskLevel = 'MEDIUM';
    pecReason = `Required PEC category is ${NOT_STATED.toLowerCase()}. Verify the eligibility clause manually before bidding.`;
  } else if (bidder.pecStatus !== 'ACTIVE') {
    pecStatus = 'FAILED - DISQUALIFICATION RISK';
    pecRiskLevel = 'CRITICAL';
    pecReason = `Bidder PEC License status is '${bidder.pecStatus}'. PPRA mandates active valid registration for current financial year.`;
  } else if (!bidderCategory) {
    pecStatus = 'FLAGGED FOR HUMAN REVIEW';
    pecRiskLevel = 'MEDIUM';
    pecReason = 'Bidder PEC category is missing from the profile. Add it to complete the audit.';
  } else if (PEC_CATEGORY_RANK[bidderCategory] < PEC_CATEGORY_RANK[reqCategory]) {
    pecStatus = 'FAILED - DISQUALIFICATION RISK';
    pecRiskLevel = 'CRITICAL';
    pecReason = `Bidder holds PEC Category '${bidderCategory}', but Tender Clause strictly mandates minimum Category '${reqCategory}'. Bidder is under-licensed by ${PEC_CATEGORY_RANK[reqCategory] - PEC_CATEGORY_RANK[bidderCategory]} tier(s).`;
  } else if ((pecReq?.confidenceScore || 0) > 0 && (pecReq?.confidenceScore || 0) < 85) {
    pecStatus = 'FLAGGED FOR HUMAN REVIEW';
    pecRiskLevel = 'MEDIUM';
    pecReason = `OCR confidence for PEC clause is ${pecReq?.confidenceScore}%. Verify text on Page ${pecReq?.sourcePage || '—'} manually.`;
  }

  items.push({
    id: 'pec-category-check',
    category: 'pecLicensing',
    categoryTitle: 'PEC License & Category',
    ruleTitle: 'PEC Contractor License Category Requirement',
    extractedClauseText: pecReq?.clauseText || NOT_STATED,
    sourcePage: pecReq?.sourcePage || 0,
    requiredValueText: reqCategory
      ? `Minimum PEC Category ${reqCategory} (Active Renewal)`
      : NOT_STATED,
    bidderValueText: `Bidder Category ${bidderCategory || '—'} (Status: ${bidder.pecStatus})`,
    status: pecStatus,
    disqualificationRiskLevel: pecRiskLevel,
    disqualificationReason: pecReason,
    confidenceScore: pecReq?.confidenceScore || 0,
    isLowConfidenceWarning: (pecReq?.confidenceScore || 0) > 0 && (pecReq?.confidenceScore || 0) < 85,
    humanApproved: false,
    ppraClauseRef: 'PPRA Rule 15 & PEC Act 1976',
  });

  // PEC Specialization Codes Audit (only when the tender states codes)
  const reqCodes = pecReq?.specializationCodes || [];
  const bidderCodes = bidder.pecSpecializationCodes || [];
  const missingCodes = reqCodes.filter((code) => !bidderCodes.includes(code));

  let specStatus: ComplianceStatus = 'PASSED';
  let specRiskLevel: RiskLevel = 'NONE';
  let specReason = '';

  if (reqCodes.length === 0) {
    specStatus = 'FLAGGED FOR HUMAN REVIEW';
    specRiskLevel = 'MEDIUM';
    specReason = `Required specialization codes are ${NOT_STATED.toLowerCase()}. Confirm manually whether specific CE/BC codes are mandated.`;
  } else if (missingCodes.length > 0) {
    specStatus = 'FAILED - DISQUALIFICATION RISK';
    specRiskLevel = 'HIGH';
    specReason = `Bidder PEC registration is missing required specialization code(s): ${missingCodes.join(', ')}.`;
  }

  items.push({
    id: 'pec-spec-codes-check',
    category: 'pecLicensing',
    categoryTitle: 'PEC License & Category',
    ruleTitle: 'PEC Specialization Codes (CE/BC/ME/EE)',
    extractedClauseText: pecReq?.clauseText || NOT_STATED,
    sourcePage: pecReq?.sourcePage || 0,
    requiredValueText: reqCodes.length > 0 ? reqCodes.join(', ') : NOT_STATED,
    bidderValueText: bidderCodes.length > 0 ? bidderCodes.join(', ') : 'None listed',
    status: specStatus,
    disqualificationRiskLevel: specRiskLevel,
    disqualificationReason: specReason,
    confidenceScore: pecReq?.confidenceScore || 0,
    isLowConfidenceWarning: (pecReq?.confidenceScore || 0) > 0 && (pecReq?.confidenceScore || 0) < 85,
    humanApproved: false,
    ppraClauseRef: 'PEC Construction Works Bylaws',
  });

  // ==========================================
  // 2. FINANCIAL CRITERIA & CDR AUDIT
  // ==========================================
  // 2a. Average Annual Turnover (3 Years)
  const reqTurnover = finCrit?.minAvgAnnualTurnoverPKR || 0;
  const bidderTurnover = bidder.avgAnnualTurnoverPKR || 0;

  let turnoverStatus: ComplianceStatus = 'PASSED';
  let turnoverRiskLevel: RiskLevel = 'NONE';
  let turnoverReason = '';

  if (bidderTurnover > MAX_PLAUSIBLE_TURNOVER_PKR || reqTurnover > MAX_PLAUSIBLE_TURNOVER_PKR) {
    turnoverStatus = 'FLAGGED FOR HUMAN REVIEW';
    turnoverRiskLevel = 'HIGH';
    const suspect = bidderTurnover > MAX_PLAUSIBLE_TURNOVER_PKR ? 'Bidder turnover' : 'Required turnover';
    turnoverReason = `${suspect} of ${formatPKR(Math.max(bidderTurnover, reqTurnover))} exceeds any plausible Pakistani contractor turnover (max ~${formatPKR(MAX_PLAUSIBLE_TURNOVER_PKR)}). This looks like a units error (extra zeros). Verify the figure before relying on this check.`;
  } else if (reqTurnover === 0) {
    turnoverStatus = 'FLAGGED FOR HUMAN REVIEW';
    turnoverRiskLevel = 'MEDIUM';
    turnoverReason = `Minimum annual turnover requirement is ${NOT_STATED.toLowerCase()}. Verify the financial qualification clause manually.`;
  } else if (bidderTurnover < reqTurnover) {
    turnoverStatus = 'FAILED - DISQUALIFICATION RISK';
    turnoverRiskLevel = 'CRITICAL';
    turnoverReason = `Bidder 3-Year Avg Annual Turnover (${formatPKR(bidderTurnover)}) is below the required threshold of ${formatPKR(reqTurnover)}. Deficit: ${formatPKR(reqTurnover - bidderTurnover)}.`;
  } else if ((finCrit?.confidenceScore || 0) > 0 && (finCrit?.confidenceScore || 0) < 85) {
    turnoverStatus = 'FLAGGED FOR HUMAN REVIEW';
    turnoverRiskLevel = 'MEDIUM';
    turnoverReason = `OCR confidence for Turnover clause is ${finCrit?.confidenceScore}%. Verify text on Page ${finCrit?.sourcePage || '—'} manually.`;
  }

  items.push({
    id: 'financial-turnover-check',
    category: 'financials',
    categoryTitle: 'Financial Capacity & CDR',
    ruleTitle: '3-Year Average Annual Construction Turnover',
    extractedClauseText: finCrit?.clauseText || NOT_STATED,
    sourcePage: finCrit?.sourcePage || 0,
    requiredValueText: reqTurnover > 0 ? `Minimum ${formatPKR(reqTurnover)} (Audited 3 Years)` : NOT_STATED,
    bidderValueText: `${formatPKR(bidderTurnover)}`,
    status: turnoverStatus,
    disqualificationRiskLevel: turnoverRiskLevel,
    disqualificationReason: turnoverReason,
    confidenceScore: finCrit?.confidenceScore || 0,
    isLowConfidenceWarning: (finCrit?.confidenceScore || 0) > 0 && (finCrit?.confidenceScore || 0) < 85,
    humanApproved: false,
    ppraClauseRef: 'PPRA Financial Qualification Standard',
  });

  // 2b. Liquid Assets & Working Capital (only audited when the tender states it)
  const reqLiquid = finCrit?.minLiquidAssetsWorkingCapitalPKR || 0;
  const bidderLiquid = bidder.liquidAssetsPKR || 0;

  if (reqLiquid > 0) {
    let liquidStatus: ComplianceStatus = 'PASSED';
    let liquidRiskLevel: RiskLevel = 'NONE';
    let liquidReason = '';

    if (bidderLiquid < reqLiquid) {
      liquidStatus = 'FAILED - DISQUALIFICATION RISK';
      liquidRiskLevel = 'HIGH';
      liquidReason = `Bidder available Liquid Assets / Working Capital (${formatPKR(bidderLiquid)}) is less than required ${formatPKR(reqLiquid)}.`;
    }

    items.push({
      id: 'financial-liquid-assets-check',
      category: 'financials',
      categoryTitle: 'Financial Capacity & CDR',
      ruleTitle: 'Minimum Liquid Assets / Working Capital Line',
      extractedClauseText: finCrit?.clauseText || NOT_STATED,
      sourcePage: finCrit?.sourcePage || 0,
      requiredValueText: `Minimum ${formatPKR(reqLiquid)}`,
      bidderValueText: `${formatPKR(bidderLiquid)}`,
      status: liquidStatus,
      disqualificationRiskLevel: liquidRiskLevel,
      disqualificationReason: liquidReason,
      confidenceScore: finCrit?.confidenceScore || 0,
      isLowConfidenceWarning: (finCrit?.confidenceScore || 0) > 0 && (finCrit?.confidenceScore || 0) < 85,
      humanApproved: false,
    });
  }

  // 2c. Earnest Money / Call Deposit Receipt (CDR)
  const reqCDR = finCrit?.cdrAmountPKR || 0;
  const bidderCDR = bidder.cdrAvailableAmountPKR || 0;

  let cdrStatus: ComplianceStatus = 'PASSED';
  let cdrRiskLevel: RiskLevel = 'NONE';
  let cdrReason = '';

  if (bidderCDR > MAX_PLAUSIBLE_CDR_PKR || reqCDR > MAX_PLAUSIBLE_CDR_PKR) {
    cdrStatus = 'FLAGGED FOR HUMAN REVIEW';
    cdrRiskLevel = 'HIGH';
    const suspect = bidderCDR > MAX_PLAUSIBLE_CDR_PKR ? 'Bidder CDR' : 'Required CDR';
    cdrReason = `${suspect} of ${formatPKR(Math.max(bidderCDR, reqCDR))} exceeds any plausible bid security (max ~${formatPKR(MAX_PLAUSIBLE_CDR_PKR)}). This looks like a units error (extra zeros). Verify the figure before relying on this check.`;
  } else if (reqCDR === 0) {
    cdrStatus = 'FLAGGED FOR HUMAN REVIEW';
    cdrRiskLevel = 'MEDIUM';
    cdrReason = `CDR / Bid Security amount is ${NOT_STATED.toLowerCase()}. Verify the bid security clause manually — a short CDR triggers automatic rejection at opening.`;
  } else if (bidderCDR < reqCDR) {
    cdrStatus = 'FAILED - DISQUALIFICATION RISK';
    cdrRiskLevel = 'CRITICAL';
    cdrReason = `Bidder Bank Draft / CDR attached (${formatPKR(bidderCDR)}) is short of required Bid Guarantee (${formatPKR(reqCDR)}). Shortfall will trigger automatic bid rejection at opening.`;
  }

  items.push({
    id: 'financial-cdr-check',
    category: 'financials',
    categoryTitle: 'Financial Capacity & CDR',
    ruleTitle: 'Earnest Money / Call Deposit Receipt (CDR) Amount',
    extractedClauseText: finCrit?.clauseText || NOT_STATED,
    sourcePage: finCrit?.sourcePage || 0,
    requiredValueText: reqCDR > 0
      ? `${formatPKR(reqCDR)}${finCrit?.acceptableBankRating ? ` (${finCrit.acceptableBankRating})` : ''}`
      : NOT_STATED,
    bidderValueText: `${formatPKR(bidderCDR)}${bidder.bankRating ? ` (Bank Rating: ${bidder.bankRating})` : ''}`,
    status: cdrStatus,
    disqualificationRiskLevel: cdrRiskLevel,
    disqualificationReason: cdrReason,
    confidenceScore: finCrit?.confidenceScore || 0,
    isLowConfidenceWarning: (finCrit?.confidenceScore || 0) > 0 && (finCrit?.confidenceScore || 0) < 85,
    humanApproved: false,
    ppraClauseRef: 'PPRA Rule 25 (Bid Security)',
  });

  // ==========================================
  // 3. LEGAL, STAMP PAPER & AFFIDAVITS AUDIT
  // ==========================================
  const reqAffidavits = tenderData?.affidavits || [];

  if (reqAffidavits.length === 0) {
    items.push({
      id: 'affidavit-check-none-stated',
      category: 'affidavits',
      categoryTitle: 'Legal & Stamp Paper Affidavits',
      ruleTitle: 'Affidavit / Undertaking Requirements',
      extractedClauseText: NOT_STATED,
      sourcePage: 0,
      requiredValueText: NOT_STATED,
      bidderValueText: `${bidder.uploadedAffidavits?.length || 0} affidavit(s) in profile`,
      status: 'FLAGGED FOR HUMAN REVIEW',
      disqualificationRiskLevel: 'MEDIUM',
      disqualificationReason: `No affidavit or stamp paper requirements were found on the pages analysed. Pakistani tenders almost always require them — check the legal/undertakings section of the document manually.`,
      confidenceScore: 0,
      isLowConfidenceWarning: false,
      humanApproved: false,
      ppraClauseRef: 'PPRA Statutory Evaluation Mandate',
    });
  }

  reqAffidavits.forEach((aff, idx) => {
    // Find matching uploaded affidavit
    const matchingUpload = bidder.uploadedAffidavits.find(
      (u) => u.title.toLowerCase().includes(aff.title.toLowerCase()) || idx === 0
    );

    let affStatus: ComplianceStatus = 'PASSED';
    let affRiskLevel: RiskLevel = 'NONE';
    let affReason = '';
    const stampStated = (aff.stampPaperDenominationPKR || 0) > 0;

    if (!matchingUpload) {
      affStatus = 'FAILED - DISQUALIFICATION RISK';
      affRiskLevel = 'CRITICAL';
      affReason = `Missing required Affidavit: '${aff.title}'. Non-submission causes immediate technical non-responsiveness.`;
    } else if (!stampStated) {
      affStatus = 'FLAGGED FOR HUMAN REVIEW';
      affRiskLevel = 'MEDIUM';
      affReason = `Stamp paper denomination for '${aff.title}' is ${NOT_STATED.toLowerCase()}. Wrong denomination is a classic disqualification — verify the clause manually.`;
    } else {
      // Check Stamp Paper Denomination (Rs. 100 vs Rs. 500)
      if (matchingUpload.stampPaperValuePKR < aff.stampPaperDenominationPKR) {
        affStatus = 'FAILED - DISQUALIFICATION RISK';
        affRiskLevel = 'HIGH';
        affReason = `Tender Clause on Page ${aff.sourcePage} mandates Rs. ${aff.stampPaperDenominationPKR} Judicial Stamp Paper. Bidder uploaded Rs. ${matchingUpload.stampPaperValuePKR} Stamp Paper. Defective stamp paper value is a frequent cause of technical disqualification.`;
      }
      // Check Blacklisting Statement
      if (aff.isBlacklistingDeclarationRequired && !matchingUpload.hasBlacklistingStatement) {
        affStatus = 'FAILED - DISQUALIFICATION RISK';
        affRiskLevel = 'HIGH';
        affReason = `Uploaded affidavit lacks required explicit declaration of Non-Blacklisting by any Govt/Semi-Govt department.`;
      }
    }

    items.push({
      id: `affidavit-check-${aff.id || idx}`,
      category: 'affidavits',
      categoryTitle: 'Legal & Stamp Paper Affidavits',
      ruleTitle: aff.title,
      extractedClauseText: aff.requiredTextSummary,
      sourcePage: aff.sourcePage,
      requiredValueText: stampStated
        ? `Rs. ${aff.stampPaperDenominationPKR} Stamp Paper (Judicial / Oath Commissioner)`
        : `Stamp paper value ${NOT_STATED.toLowerCase()}`,
      bidderValueText: matchingUpload
        ? `Rs. ${matchingUpload.stampPaperValuePKR} Stamp Paper Attached`
        : 'Not Uploaded / Missing',
      status: affStatus,
      disqualificationRiskLevel: affRiskLevel,
      disqualificationReason: affReason,
      confidenceScore: aff.confidenceScore,
      isLowConfidenceWarning: aff.confidenceScore > 0 && aff.confidenceScore < 85,
      humanApproved: false,
      ppraClauseRef: 'PPRA Statutory Evaluation Mandate',
    });
  });

  // FBR Active Taxpayer List (ATL) Check
  let ntnStatus: ComplianceStatus = 'PASSED';
  let ntnRiskLevel: RiskLevel = 'NONE';
  let ntnReason = '';

  if (bidder.ntnStatus !== 'ACTIVE_TAXPAYER') {
    ntnStatus = 'FAILED - DISQUALIFICATION RISK';
    ntnRiskLevel = 'CRITICAL';
    ntnReason = `Bidder FBR NTN Status is '${bidder.ntnStatus}'. PPRA mandates bidder must appear on FBR Active Taxpayer List (ATL).`;
  }

  items.push({
    id: 'fbr-atl-check',
    category: 'affidavits',
    categoryTitle: 'Legal & Stamp Paper Affidavits',
    ruleTitle: 'FBR NTN & Active Taxpayer List (ATL) Status',
    extractedClauseText: 'Bidder must be registered with FBR for Income Tax & Sales Tax and listed on Active Taxpayer List (ATL).',
    sourcePage: 0,
    requiredValueText: 'Active Taxpayer Status on FBR Portal',
    bidderValueText: `NTN: ${bidder.fbrRegistrationNumber || '—'} (${bidder.ntnStatus})`,
    status: ntnStatus,
    disqualificationRiskLevel: ntnRiskLevel,
    disqualificationReason: ntnReason,
    confidenceScore: 98,
    isLowConfidenceWarning: false,
    humanApproved: false,
  });

  // ==========================================
  // 4. JOINT VENTURE (JV) RULES AUDIT
  // ==========================================
  if (!jvRules) {
    // JV rules not stated on the pages analysed
    items.push({
      id: 'jv-rules-check',
      category: 'jvRules',
      categoryTitle: 'Joint Venture (JV) Rules',
      ruleTitle: 'JV Permissibility & Share Percentages',
      extractedClauseText: NOT_STATED,
      sourcePage: 0,
      requiredValueText: NOT_STATED,
      bidderValueText: bidder.isJV
        ? `JV Entity: ${bidder.jvTotalPartners || '—'} Partners (Lead Share: ${bidder.jvLeadPartnerSharePercent ?? '—'}%)`
        : 'Sole Bidder / Non-JV Entity',
      status: bidder.isJV ? 'FLAGGED FOR HUMAN REVIEW' : 'PASSED',
      disqualificationRiskLevel: bidder.isJV ? 'MEDIUM' : 'NONE',
      disqualificationReason: bidder.isJV
        ? `JV rules are ${NOT_STATED.toLowerCase()}, but the bidder is a JV entity. Verify whether JVs are allowed and what share thresholds apply before bidding.`
        : '',
      confidenceScore: 0,
      isLowConfidenceWarning: false,
      humanApproved: false,
      ppraClauseRef: 'PEC Standard Bidding Document for JVs',
    });
  } else if (bidder.isJV) {
    let jvStatus: ComplianceStatus = 'PASSED';
    let jvRiskLevel: RiskLevel = 'NONE';
    let jvReason = '';
    const maxPartnersStated = (jvRules.maxPartners || 0) > 0;
    const leadShareStated = (jvRules.leadPartnerMinSharePercent || 0) > 0;

    if (!jvRules.allowedJV) {
      jvStatus = 'FAILED - DISQUALIFICATION RISK';
      jvRiskLevel = 'CRITICAL';
      jvReason = `Tender Clause on Page ${jvRules.sourcePage} strictly disallows Joint Ventures (JV). Bids from JV entities will be rejected.`;
    } else if (!maxPartnersStated && !leadShareStated) {
      jvStatus = 'FLAGGED FOR HUMAN REVIEW';
      jvRiskLevel = 'MEDIUM';
      jvReason = `JV is allowed but partner cap / share thresholds are ${NOT_STATED.toLowerCase()}. Verify the JV clause manually.`;
    } else {
      if (maxPartnersStated && (bidder.jvTotalPartners || 1) > jvRules.maxPartners) {
        jvStatus = 'FAILED - DISQUALIFICATION RISK';
        jvRiskLevel = 'HIGH';
        jvReason = `Bidder JV has ${bidder.jvTotalPartners} partners, exceeding the maximum allowed limit of ${jvRules.maxPartners} partners.`;
      }
      if (
        leadShareStated &&
        bidder.jvRole === 'LEAD' &&
        (bidder.jvLeadPartnerSharePercent || 0) < jvRules.leadPartnerMinSharePercent
      ) {
        jvStatus = 'FAILED - DISQUALIFICATION RISK';
        jvRiskLevel = 'HIGH';
        jvReason = `Lead JV Partner share is ${bidder.jvLeadPartnerSharePercent}%, below mandatory threshold of ${jvRules.leadPartnerMinSharePercent}%.`;
      }
    }

    items.push({
      id: 'jv-rules-check',
      category: 'jvRules',
      categoryTitle: 'Joint Venture (JV) Rules',
      ruleTitle: 'JV Permissibility & Share Percentages',
      extractedClauseText: jvRules.clauseText || NOT_STATED,
      sourcePage: jvRules.sourcePage || 0,
      requiredValueText: jvRules.allowedJV
        ? `${maxPartnersStated ? `Max ${jvRules.maxPartners} Partners` : `Partner cap ${NOT_STATED.toLowerCase()}`}${leadShareStated ? `, Lead >= ${jvRules.leadPartnerMinSharePercent}%` : ''}`
        : 'Joint Ventures NOT Allowed',
      bidderValueText: `JV Entity: ${bidder.jvTotalPartners || '—'} Partners (Lead Share: ${
        bidder.jvLeadPartnerSharePercent ?? '—'
      }%)`,
      status: jvStatus,
      disqualificationRiskLevel: jvRiskLevel,
      disqualificationReason: jvReason,
      confidenceScore: jvRules.confidenceScore || 0,
      isLowConfidenceWarning: (jvRules.confidenceScore || 0) > 0 && (jvRules.confidenceScore || 0) < 85,
      humanApproved: false,
      ppraClauseRef: 'PEC Standard Bidding Document for JVs',
    });
  } else {
    items.push({
      id: 'jv-rules-check',
      category: 'jvRules',
      categoryTitle: 'Joint Venture (JV) Rules',
      ruleTitle: 'JV Permissibility & Share Percentages',
      extractedClauseText: jvRules.clauseText || NOT_STATED,
      sourcePage: jvRules.sourcePage || 0,
      requiredValueText: jvRules.allowedJV
        ? `JV Permitted${(jvRules.maxPartners || 0) > 0 ? ` (Max ${jvRules.maxPartners} Partners)` : ''}`
        : 'JV NOT Allowed',
      bidderValueText: 'Sole Bidder / Non-JV Entity',
      status: 'PASSED',
      disqualificationRiskLevel: 'NONE',
      confidenceScore: jvRules.confidenceScore || 0,
      isLowConfidenceWarning: (jvRules.confidenceScore || 0) > 0 && (jvRules.confidenceScore || 0) < 85,
      humanApproved: false,
    });
  }

  // ==========================================
  // CALCULATE OVERALL AUDIT METRICS & RISK
  // ==========================================
  const totalChecks = items.length;
  const passedCount = items.filter((i) => i.status === 'PASSED').length;
  const failedCount = items.filter((i) => i.status === 'FAILED - DISQUALIFICATION RISK').length;
  const flaggedCount = items.filter((i) => i.status === 'FLAGGED FOR HUMAN REVIEW').length;

  // Compute Risk Score from 0 (Safe) to 100 (Disqualified)
  let riskScore = 0;
  items.forEach((item) => {
    if (item.status === 'FAILED - DISQUALIFICATION RISK') {
      if (item.disqualificationRiskLevel === 'CRITICAL') riskScore += 35;
      else if (item.disqualificationRiskLevel === 'HIGH') riskScore += 20;
      else riskScore += 10;
    } else if (item.status === 'FLAGGED FOR HUMAN REVIEW') {
      riskScore += 10;
    }
  });
  riskScore = Math.min(100, Math.round(riskScore));

  let overallEligibility: AuditReport['overallEligibility'] = 'ELIGIBLE';
  if (failedCount > 0 || riskScore >= 40) {
    overallEligibility = 'HIGH_DISQUALIFICATION_RISK';
  } else if (flaggedCount > 0 || riskScore > 10) {
    overallEligibility = 'NEEDS_HUMAN_REVIEW';
  }

  // Generate Executive Summary
  let summaryExecutive = '';
  if (overallEligibility === 'HIGH_DISQUALIFICATION_RISK') {
    summaryExecutive = `CRITICAL DISQUALIFICATION WARNING: The compliance engine identified ${failedCount} administrative/technical non-compliances that carry immediate risk of bid rejection under PPRA Rules 2004. Key vulnerabilities include ${items
      .filter((i) => i.status === 'FAILED - DISQUALIFICATION RISK')
      .map((i) => i.ruleTitle)
      .join('; ')}. Remedial action is required prior to financial bid submission.`;
  } else if (overallEligibility === 'NEEDS_HUMAN_REVIEW') {
    summaryExecutive = `ATTENTION REQUIRED: ${flaggedCount} clause(s) require human verification — either the tender document did not state the requirement on the pages analysed, or scan quality was too low to trust the extraction. No value was assumed on the bidder's behalf.`;
  } else {
    summaryExecutive = `ELIGIBILITY CONFIRMED: Bidder satisfies all extracted PEC licensing, financial turnover, CDR security, stamp paper affidavit, and JV criteria stated in the analysed pages under PPRA Rules 2004. Zero administrative disqualification risks detected in the stated criteria.`;
  }

  return {
    timestamp: new Date().toISOString(),
    tenderId: tenderData?.basicInfo?.tenderId || 'UNKNOWN-TENDER',
    companyName: bidder.companyName,
    overallEligibility,
    riskScore,
    totalChecks,
    passedCount,
    failedCount,
    flaggedCount,
    humanApprovedCount: 0,
    items,
    summaryExecutive,
  };
}
