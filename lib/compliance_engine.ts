/**
 * Karez 2.0 - Step 3: Compliance & Disqualification Logic Engine
 * Evaluates Bidder Profile against Extracted Tender Data under PPRA Rules 2004.
 */

import {
  TenderComplianceData,
  BidderProfile,
  AuditReport,
  ComplianceItemAudit,
  PECCategory,
  ComplianceStatus,
} from './types';

// PEC Category Hierarchy: C-A is highest (Unlimited cost), C-6 is lowest
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

/**
 * Format currency in Pakistani Rupees (PKR) e.g., PKR 2,500,000,000 (2.5 Billion PKR)
 */
export function formatPKR(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'PKR 0';
  
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

  // Fallback defaults if tenderData is partial or null
  const pecReq = tenderData?.pecRequirement || {
    requiredCategory: 'C-3' as PECCategory,
    specializationCodes: ['CE01', 'CE02'],
    validityRequirement: 'Active FY 2026-27',
    sourcePage: 1,
    clauseText: 'Valid PEC Registration Required',
    confidenceScore: 90,
  };

  const finCrit = tenderData?.financialCriteria || {
    minAvgAnnualTurnoverPKR: 500000000,
    minNetWorthPKR: 100000000,
    minLiquidAssetsWorkingCapitalPKR: 50000000,
    cdrAmountPKR: 10000000,
    cdrPercentage: 2,
    acceptableBankRating: 'AA or above',
    sourcePage: 1,
    clauseText: 'Financial turnover and bid security requirement',
    confidenceScore: 90,
  };

  const jvRules = tenderData?.jvRules || {
    allowedJV: true,
    maxPartners: 3,
    leadPartnerMinSharePercent: 50,
    otherPartnerMinSharePercent: 25,
    sourcePage: 1,
    clauseText: 'JV allowed up to 3 partners',
    confidenceScore: 90,
  };

  // ==========================================
  // 1. PEC LICENSING & ELIGIBILITY AUDIT
  // ==========================================
  const reqCategory = pecReq.requiredCategory || 'C-3';
  const bidderCategory = bidder.pecCategory || 'C-3';
  const reqRank = PEC_CATEGORY_RANK[reqCategory] || 1;
  const bidderRank = PEC_CATEGORY_RANK[bidderCategory] || 1;

  let pecStatus: ComplianceStatus = 'PASSED';
  let pecRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE' = 'NONE';
  let pecReason = '';

  if (bidder.pecStatus !== 'ACTIVE') {
    pecStatus = 'FAILED - DISQUALIFICATION RISK';
    pecRiskLevel = 'CRITICAL';
    pecReason = `Bidder PEC License status is '${bidder.pecStatus}'. PPRA mandates active valid registration for current financial year.`;
  } else if (bidderRank < reqRank) {
    pecStatus = 'FAILED - DISQUALIFICATION RISK';
    pecRiskLevel = 'CRITICAL';
    pecReason = `Bidder holds PEC Category '${bidderCategory}', but Tender Clause strictly mandates minimum Category '${reqCategory}'. Bidder is under-licensed by ${reqRank - bidderRank} tier(s).`;
  } else if ((pecReq.confidenceScore || 100) < 85) {
    pecStatus = 'FLAGGED FOR HUMAN REVIEW';
    pecRiskLevel = 'MEDIUM';
    pecReason = `OCR confidence for PEC clause is ${pecReq.confidenceScore}%. Faded text detected on Page ${pecReq.sourcePage || 1}.`;
  }

  items.push({
    id: 'pec-category-check',
    category: 'pecLicensing',
    categoryTitle: 'PEC License & Category',
    ruleTitle: 'PEC Contractor License Category Requirement',
    extractedClauseText: pecReq.clauseText || 'PEC Category Requirement',
    sourcePage: pecReq.sourcePage || 1,
    requiredValueText: `Minimum PEC Category ${reqCategory} (Active Renewal)`,
    bidderValueText: `Bidder Category ${bidderCategory} (Status: ${bidder.pecStatus})`,
    status: pecStatus,
    disqualificationRiskLevel: pecRiskLevel,
    disqualificationReason: pecReason,
    confidenceScore: pecReq.confidenceScore || 90,
    isLowConfidenceWarning: (pecReq.confidenceScore || 100) < 85,
    humanApproved: false,
    ppraClauseRef: 'PPRA Rule 15 & PEC Act 1976',
  });

  // PEC Specialization Codes Audit
  const reqCodes = pecReq.specializationCodes || [];
  const bidderCodes = bidder.pecSpecializationCodes || [];
  const missingCodes = reqCodes.filter((code) => !bidderCodes.includes(code));

  let specStatus: ComplianceStatus = 'PASSED';
  let specRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE' = 'NONE';
  let specReason = '';

  if (missingCodes.length > 0) {
    specStatus = 'FAILED - DISQUALIFICATION RISK';
    specRiskLevel = 'HIGH';
    specReason = `Bidder PEC registration is missing required specialization code(s): ${missingCodes.join(', ')}.`;
  }

  items.push({
    id: 'pec-spec-codes-check',
    category: 'pecLicensing',
    categoryTitle: 'PEC License & Category',
    ruleTitle: 'PEC Specialization Codes (CE/BC/ME/EE)',
    extractedClauseText: pecReq.clauseText || 'PEC Specialization Codes',
    sourcePage: pecReq.sourcePage || 1,
    requiredValueText: reqCodes.length > 0 ? reqCodes.join(', ') : 'No specific codes mandated',
    bidderValueText: bidderCodes.length > 0 ? bidderCodes.join(', ') : 'None listed',
    status: specStatus,
    disqualificationRiskLevel: specRiskLevel,
    disqualificationReason: specReason,
    confidenceScore: pecReq.confidenceScore || 90,
    isLowConfidenceWarning: (pecReq.confidenceScore || 100) < 85,
    humanApproved: false,
    ppraClauseRef: 'PEC Construction Works Bylaws',
  });

  // ==========================================
  // 2. FINANCIAL CRITERIA & CDR AUDIT
  // ==========================================
  // 2a. Average Annual Turnover (3 Years)
  const reqTurnover = finCrit.minAvgAnnualTurnoverPKR || 0;
  const bidderTurnover = bidder.avgAnnualTurnoverPKR || 0;

  let turnoverStatus: ComplianceStatus = 'PASSED';
  let turnoverRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE' = 'NONE';
  let turnoverReason = '';

  if (bidderTurnover < reqTurnover) {
    turnoverStatus = 'FAILED - DISQUALIFICATION RISK';
    turnoverRiskLevel = 'CRITICAL';
    turnoverReason = `Bidder 3-Year Avg Annual Turnover (${formatPKR(bidderTurnover)}) is below the required threshold of ${formatPKR(reqTurnover)}. Deficit: ${formatPKR(reqTurnover - bidderTurnover)}.`;
  } else if ((finCrit.confidenceScore || 100) < 85) {
    turnoverStatus = 'FLAGGED FOR HUMAN REVIEW';
    turnoverRiskLevel = 'MEDIUM';
    turnoverReason = `OCR confidence for Turnover clause is ${finCrit.confidenceScore}%. Faded text detected on Page ${finCrit.sourcePage || 1}.`;
  }

  items.push({
    id: 'financial-turnover-check',
    category: 'financials',
    categoryTitle: 'Financial Capacity & CDR',
    ruleTitle: '3-Year Average Annual Construction Turnover',
    extractedClauseText: finCrit.clauseText || 'Annual turnover requirement',
    sourcePage: finCrit.sourcePage || 1,
    requiredValueText: `Minimum ${formatPKR(reqTurnover)} (Audited 3 Years)`,
    bidderValueText: `${formatPKR(bidderTurnover)}`,
    status: turnoverStatus,
    disqualificationRiskLevel: turnoverRiskLevel,
    disqualificationReason: turnoverReason,
    confidenceScore: finCrit.confidenceScore || 90,
    isLowConfidenceWarning: (finCrit.confidenceScore || 100) < 85,
    humanApproved: false,
    ppraClauseRef: 'PPRA Financial Qualification Standard',
  });

  // 2b. Liquid Assets & Working Capital
  const reqLiquid = finCrit.minLiquidAssetsWorkingCapitalPKR || 0;
  const bidderLiquid = bidder.liquidAssetsPKR || 0;

  if (reqLiquid > 0) {
    let liquidStatus: ComplianceStatus = 'PASSED';
    let liquidRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE' = 'NONE';
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
      extractedClauseText: finCrit.clauseText || 'Liquid assets requirement',
      sourcePage: finCrit.sourcePage || 1,
      requiredValueText: `Minimum ${formatPKR(reqLiquid)}`,
      bidderValueText: `${formatPKR(bidderLiquid)}`,
      status: liquidStatus,
      disqualificationRiskLevel: liquidRiskLevel,
      disqualificationReason: liquidReason,
      confidenceScore: finCrit.confidenceScore || 90,
      isLowConfidenceWarning: (finCrit.confidenceScore || 100) < 85,
      humanApproved: false,
    });
  }

  // 2c. Earnest Money / Call Deposit Receipt (CDR)
  const reqCDR = finCrit.cdrAmountPKR || 0;
  const bidderCDR = bidder.cdrAvailableAmountPKR || 0;

  let cdrStatus: ComplianceStatus = 'PASSED';
  let cdrRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE' = 'NONE';
  let cdrReason = '';

  if (bidderCDR < reqCDR) {
    cdrStatus = 'FAILED - DISQUALIFICATION RISK';
    cdrRiskLevel = 'CRITICAL';
    cdrReason = `Bidder Bank Draft / CDR attached (${formatPKR(bidderCDR)}) is short of required Bid Guarantee (${formatPKR(reqCDR)}). Shortfall will trigger automatic bid rejection at opening.`;
  }

  items.push({
    id: 'financial-cdr-check',
    category: 'financials',
    categoryTitle: 'Financial Capacity & CDR',
    ruleTitle: 'Earnest Money / Call Deposit Receipt (CDR) Amount',
    extractedClauseText: finCrit.clauseText || 'Call deposit receipt requirement',
    sourcePage: finCrit.sourcePage || 1,
    requiredValueText: `${formatPKR(reqCDR)} (${finCrit.acceptableBankRating || 'A+'})`,
    bidderValueText: `${formatPKR(bidderCDR)} (Bank Rating: ${bidder.bankRating || 'AA'})`,
    status: cdrStatus,
    disqualificationRiskLevel: cdrRiskLevel,
    disqualificationReason: cdrReason,
    confidenceScore: finCrit.confidenceScore || 90,
    isLowConfidenceWarning: (finCrit.confidenceScore || 100) < 85,
    humanApproved: false,
    ppraClauseRef: 'PPRA Rule 25 (Bid Security)',
  });

  // ==========================================
  // 3. LEGAL, STAMP PAPER & AFFIDAVITS AUDIT
  // ==========================================
  const reqAffidavits = tenderData?.affidavits || [];

  reqAffidavits.forEach((aff, idx) => {
    // Find matching uploaded affidavit
    const matchingUpload = bidder.uploadedAffidavits.find(
      (u) => u.title.toLowerCase().includes(aff.title.toLowerCase()) || idx === 0
    );

    let affStatus: ComplianceStatus = 'PASSED';
    let affRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE' = 'NONE';
    let affReason = '';

    if (!matchingUpload) {
      affStatus = 'FAILED - DISQUALIFICATION RISK';
      affRiskLevel = 'CRITICAL';
      affReason = `Missing required Affidavit: '${aff.title}'. Non-submission causes immediate technical non-responsiveness.`;
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
      requiredValueText: `Rs. ${aff.stampPaperDenominationPKR} Stamp Paper (Judicial / Oath Commissioner)`,
      bidderValueText: matchingUpload
        ? `Rs. ${matchingUpload.stampPaperValuePKR} Stamp Paper Attached`
        : 'Not Uploaded / Missing',
      status: affStatus,
      disqualificationRiskLevel: affRiskLevel,
      disqualificationReason: affReason,
      confidenceScore: aff.confidenceScore,
      isLowConfidenceWarning: aff.confidenceScore < 85,
      humanApproved: false,
      ppraClauseRef: 'PPRA Statutory Evaluation Mandate',
    });
  });

  // FBR Active Taxpayer List (ATL) Check
  let ntnStatus: ComplianceStatus = 'PASSED';
  let ntnRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE' = 'NONE';
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
    sourcePage: 1,
    requiredValueText: 'Active Taxpayer Status on FBR Portal',
    bidderValueText: `NTN: ${bidder.fbrRegistrationNumber} (${bidder.ntnStatus})`,
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
  if (bidder.isJV) {
    let jvStatus: ComplianceStatus = 'PASSED';
    let jvRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE' = 'NONE';
    let jvReason = '';

    if (!jvRules.allowedJV) {
      jvStatus = 'FAILED - DISQUALIFICATION RISK';
      jvRiskLevel = 'CRITICAL';
      jvReason = `Tender Clause on Page ${jvRules.sourcePage} strictly disallows Joint Ventures (JV). Bids from JV entities will be rejected.`;
    } else {
      if ((bidder.jvTotalPartners || 1) > jvRules.maxPartners) {
        jvStatus = 'FAILED - DISQUALIFICATION RISK';
        jvRiskLevel = 'HIGH';
        jvReason = `Bidder JV has ${bidder.jvTotalPartners} partners, exceeding the maximum allowed limit of ${jvRules.maxPartners} partners.`;
      }
      if (
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
      extractedClauseText: jvRules.clauseText,
      sourcePage: jvRules.sourcePage,
      requiredValueText: jvRules.allowedJV
        ? `Max ${jvRules.maxPartners} Partners, Lead >= ${jvRules.leadPartnerMinSharePercent}%`
        : 'Joint Ventures NOT Allowed',
      bidderValueText: `JV Entity: ${bidder.jvTotalPartners || 2} Partners (Lead Share: ${
        bidder.jvLeadPartnerSharePercent || 0
      }%)`,
      status: jvStatus,
      disqualificationRiskLevel: jvRiskLevel,
      disqualificationReason: jvReason,
      confidenceScore: jvRules.confidenceScore,
      isLowConfidenceWarning: jvRules.confidenceScore < 85,
      humanApproved: false,
      ppraClauseRef: 'PEC Standard Bidding Document for JVs',
    });
  } else {
    items.push({
      id: 'jv-rules-check',
      category: 'jvRules',
      categoryTitle: 'Joint Venture (JV) Rules',
      ruleTitle: 'JV Permissibility & Share Percentages',
      extractedClauseText: jvRules.clauseText,
      sourcePage: jvRules.sourcePage,
      requiredValueText: jvRules.allowedJV
        ? `JV Permitted (Max ${jvRules.maxPartners} Partners)`
        : 'JV NOT Allowed',
      bidderValueText: 'Sole Bidder / Non-JV Entity',
      status: 'PASSED',
      disqualificationRiskLevel: 'NONE',
      confidenceScore: jvRules.confidenceScore,
      isLowConfidenceWarning: jvRules.confidenceScore < 85,
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
    summaryExecutive = `ATTENTION REQUIRED: The bidder profile passes core thresholds, but ${flaggedCount} clause(s) require human verification due to low OCR confidence or ambiguous scan quality.`;
  } else {
    summaryExecutive = `ELIGIBILITY CONFIRMED: Bidder satisfies all extracted PEC licensing, financial turnover, CDR security, stamp paper affidavit, and JV criteria under PPRA Rules 2004. Zero administrative disqualification risks detected.`;
  }

  return {
    timestamp: new Date().toISOString(),
    tenderId: tenderData?.basicInfo?.tenderId || 'PPRA-2026',
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
