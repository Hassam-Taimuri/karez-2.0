/**
 * Karez 2.0 - Core Types & Schemas
 * Compliant with PPRA Rules 2004 (Pakistan Procurement Regulatory Authority)
 */

export type PECCategory = 'C-A' | 'C-B' | 'C-1' | 'C-2' | 'C-3' | 'C-4' | 'C-5' | 'C-6';

export type BiddingProcedure = 
  | 'Single Stage - One Envelope (PPRA Rule 36-a)'
  | 'Single Stage - Two Envelope (PPRA Rule 36-b)'
  | 'Two Stage - Two Envelope (PPRA Rule 36-d)'
  | 'Pre-Qualification (PPRA Rule 15)';

export type ProcuringAgency = 
  | 'NHA (National Highway Authority)'
  | 'LDA (Lahore Development Authority)'
  | 'C&W (Communication & Works Dept)'
  | 'WAPDA (Water & Power Development Authority)'
  | 'KEDA (Karachi Estate Dev Authority)'
  | 'PHE (Public Health Engineering)'
  | 'Pak PWD (Pakistan Public Works Department)';

export type ComplianceStatus = 'PASSED' | 'FAILED - DISQUALIFICATION RISK' | 'FLAGGED FOR HUMAN REVIEW';

export type CategoryKey = 'basicInfo' | 'pecLicensing' | 'financials' | 'affidavits' | 'jvRules';

export interface TenderBasicInfo {
  tenderId: string;
  tenderTitle: string;
  procuringAgency: ProcuringAgency;
  biddingType: BiddingProcedure;
  submissionDeadline: string;
  estimatedCostPKR?: number;
  location: string;
  ppraRuleReference: string;
  sourcePage: number;
}

export interface PECRequirement {
  requiredCategory: PECCategory | null; // null = NOT STATED on the pages analysed
  specializationCodes: string[]; // e.g. ["CE01", "CE02", "CE09", "CE10", "BC01"]
  validityRequirement: string;
  sourcePage: number;
  clauseText: string;
  confidenceScore: number; // 0 to 100%
}

// In every PKR field below, 0 means NOT STATED on the pages analysed.
// The compliance engine must flag such fields for human review, never
// substitute a default threshold.
export interface FinancialCriteria {
  minAvgAnnualTurnoverPKR: number; // 3-year avg turnover
  minNetWorthPKR: number;
  minLiquidAssetsWorkingCapitalPKR: number;
  cdrAmountPKR: number; // Call Deposit Receipt / Earnest Money
  cdrPercentage?: number; // e.g., 2% of bid price
  acceptableBankRating: string; // e.g., "A- or above by PACRA/VIS"
  sourcePage: number;
  clauseText: string;
  confidenceScore: number;
}

export interface ExtractionMeta {
  provider: string; // 'gemini' | 'qwen'
  model: string;
  pagesAnalysed: number;
  inputMode: 'pdf' | 'images' | 'single-image' | 'sample';
}

export interface StampPaperAffidavit {
  id: string;
  title: string;
  stampPaperDenominationPKR: number; // e.g., 100 or 500
  requiredTextSummary: string;
  isBlacklistingDeclarationRequired: boolean;
  isLitigationHistoryRequired: boolean;
  isCorrectnessDeclarationRequired: boolean;
  sourcePage: number;
  confidenceScore: number;
}

export interface JVRules {
  allowedJV: boolean;
  maxPartners: number;
  leadPartnerMinSharePercent: number; // e.g. 50%
  otherPartnerMinSharePercent: number; // e.g. 25%
  sourcePage: number;
  clauseText: string;
  confidenceScore: number;
}

export interface TenderComplianceData {
  basicInfo: TenderBasicInfo;
  pecRequirement: PECRequirement;
  financialCriteria: FinancialCriteria;
  affidavits: StampPaperAffidavit[]; // empty array = no affidavit requirements stated on pages analysed
  jvRules: JVRules | null; // null = JV rules NOT STATED on the pages analysed
  extractedDate: string;
  documentFileName: string;
  totalPages: number;
  overallOcrConfidence: number; // e.g., 88%
  hasLowConfidenceWarnings: boolean;
  lowConfidencePages: number[];
  notStatedFields?: string[]; // human-readable list of criteria the document did not state
  extractionMeta?: ExtractionMeta;
}

export interface BidderProfile {
  companyName: string;
  pecCategory: PECCategory;
  pecLicenseNo?: string;
  ntnNo?: string;
  pecSpecializationCodes: string[];
  pecValidityDate: string;
  pecStatus: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  avgAnnualTurnoverPKR: number; // 3 year avg
  netWorthPKR: number;
  liquidAssetsPKR: number;
  cdrAvailableAmountPKR: number;
  bankRating: string; // e.g., "AA"
  uploadedAffidavits: {
    title: string;
    stampPaperValuePKR: number;
    hasBlacklistingStatement: boolean;
    hasLitigationStatement: boolean;
    isJudicialVerified: boolean;
  }[];
  isJV: boolean;
  jvRole?: 'LEAD' | 'MEMBER';
  jvLeadPartnerSharePercent?: number;
  jvTotalPartners?: number;
  ntnStatus: 'ACTIVE_TAXPAYER' | 'INACTIVE';
  fbrRegistrationNumber: string;
}

export interface ComplianceItemAudit {
  id: string;
  category: CategoryKey;
  categoryTitle: string;
  ruleTitle: string;
  extractedClauseText: string;
  sourcePage: number;
  requiredValueText: string;
  bidderValueText: string;
  status: ComplianceStatus;
  disqualificationRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE';
  disqualificationReason?: string;
  confidenceScore: number;
  isLowConfidenceWarning: boolean;
  humanApproved: boolean;
  humanNotes?: string;
  ppraClauseRef?: string;
  boundingCoordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AuditReport {
  timestamp: string;
  tenderId: string;
  companyName: string;
  overallEligibility: 'ELIGIBLE' | 'HIGH_DISQUALIFICATION_RISK' | 'NEEDS_HUMAN_REVIEW';
  riskScore: number; // 0 (Safe) to 100 (Disqualified)
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  flaggedCount: number;
  humanApprovedCount: number;
  items: ComplianceItemAudit[];
  summaryExecutive: string;
}

export interface SampleTenderDoc {
  id: string;
  title: string;
  agency: ProcuringAgency;
  biddingType: string;
  ppraRef: string;
  deadline: string;
  estimatedCost: string;
  pdfUrl?: string;
  pages: {
    pageNumber: number;
    title: string;
    imageUrl: string;
    extractedClauses: {
      id: string;
      title: string;
      text: string;
      category: CategoryKey;
      confidence: number;
    }[];
  }[];
  extractedData: TenderComplianceData;
  defaultBidderProfile: BidderProfile;
}

export type AuditActionType =
  | 'HUMAN_OVERRIDE_APPROVE'
  | 'HUMAN_OVERRIDE_REJECT'
  | 'NOTE_UPDATED'
  | 'BIDDER_SPECS_EDITED'
  | 'OCR_SCAN_PROCESSED'
  | 'SPEC_OVERRIDE'
  | 'OVERRIDE_APPROVED'
  | 'OVERRIDE_REVOKED'
  | 'BIDDER_SWITCHED'
  | 'TENDER_CHANGED';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  officerName: string;
  officerRole: string;
  actionType: AuditActionType;
  ruleId?: string;
  ruleTitle?: string;
  itemTitle: string;
  ppraClauseRef?: string;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
}
