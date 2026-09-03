/**
 * Authentic Pakistani Procurement Tender Datasets & Bidder Exemplars
 * Compliant with PPRA Rules 2004 (NHA, WAPDA, LDA, C&W)
 */

import { SampleTenderDoc, BidderProfile } from './types';

export const SAMPLE_TENDERS: SampleTenderDoc[] = [
  {
    id: 'tender-nha-e35',
    title: 'Dualization & Widening of E-35 Express Highway Section-III (Km 45+000 to 88+500)',
    agency: 'NHA (National Highway Authority)',
    biddingType: 'Single Stage - Two Envelope (PPRA Rule 36-b)',
    ppraRef: 'NHA/P&CA/E35/2026/104',
    deadline: '18 September 2026, 11:30 AM PST',
    estimatedCost: 'PKR 4,850,000,000 (4.85 Billion PKR)',
    pages: [
      {
        pageNumber: 1,
        title: 'Title Page & Invitation for Bids (IFB)',
        imageUrl: '/sample-pages/nha_page1.png',
        extractedClauses: [
          {
            id: 'c1',
            title: 'Procuring Agency & PPRA Rule',
            text: 'National Highway Authority (NHA) invites sealed bids under PPRA Rule 36(b) Single Stage Two Envelope Procedure for E-35 Highway Dualization.',
            category: 'basicInfo',
            confidence: 96,
          },
        ],
      },
      {
        pageNumber: 4,
        title: 'PEC License & Contractor Qualification',
        imageUrl: '/sample-pages/nha_page4.png',
        extractedClauses: [
          {
            id: 'c2',
            title: 'PEC Category & Specialization',
            text: 'Bidders must possess valid Pakistan Engineering Council (PEC) Registration in Category C-A (Unlimited) with Specialization Codes CE01 (Roads & Pavements) and CE02 (Bridges & Structures) active for FY 2026-27.',
            category: 'pecLicensing',
            confidence: 94,
          },
        ],
      },
      {
        pageNumber: 7,
        title: 'Financial Turnover & CDR Bid Security',
        imageUrl: '/sample-pages/nha_page7.png',
        extractedClauses: [
          {
            id: 'c3',
            title: 'Financial Turnover & CDR',
            text: 'Minimum Average Annual Construction Turnover for last 3 years must be PKR 2,000,000,000 (Rs. 2 Billion). Bid Security / Call Deposit Receipt (CDR) of PKR 97,000,000 (2% of estimated cost) from Scheduled Bank with minimum rating AA.',
            category: 'financials',
            confidence: 82, // Faded text trigger!
          },
        ],
      },
      {
        pageNumber: 12,
        title: 'Legal Undertakings & Stamp Paper Affidavits',
        imageUrl: '/sample-pages/nha_page12.png',
        extractedClauses: [
          {
            id: 'c4',
            title: 'Rs. 500 Stamp Paper Affidavit',
            text: 'Original Affidavit on Judicial Stamp Paper of minimum Rs. 500 value duly certified by Oath Commissioner declaring non-blacklisting by any Govt / Semi-Govt agency and zero pending litigation with NHA.',
            category: 'affidavits',
            confidence: 91,
          },
        ],
      },
      {
        pageNumber: 15,
        title: 'Joint Venture (JV) Rules & Lead Share',
        imageUrl: '/sample-pages/nha_page15.png',
        extractedClauses: [
          {
            id: 'c5',
            title: 'Joint Venture Requirements',
            text: 'JV allowed with maximum 3 partners. Lead Partner must hold at least 50% share and meet minimum C-1 PEC category. Minor partners must hold at least 25% share.',
            category: 'jvRules',
            confidence: 89,
          },
        ],
      },
    ],
    extractedData: {
      basicInfo: {
        tenderId: 'NHA/P&CA/E35/2026/104',
        tenderTitle: 'Dualization & Widening of E-35 Express Highway Section-III',
        procuringAgency: 'NHA (National Highway Authority)',
        biddingType: 'Single Stage - Two Envelope (PPRA Rule 36-b)',
        submissionDeadline: '18 September 2026, 11:30 AM PST',
        estimatedCostPKR: 4850000000,
        location: 'KPK / Hazara Expressway, Pakistan',
        ppraRuleReference: 'PPRA Rule 36(b)',
        sourcePage: 1,
      },
      pecRequirement: {
        requiredCategory: 'C-A',
        specializationCodes: ['CE01', 'CE02'],
        validityRequirement: 'Active Renewal for FY 2026-27',
        sourcePage: 4,
        clauseText: 'Valid PEC Registration in Category C-A (Unlimited) with Specialization Codes CE01 & CE02.',
        confidenceScore: 94,
      },
      financialCriteria: {
        minAvgAnnualTurnoverPKR: 2000000000, // 2 Billion PKR
        minNetWorthPKR: 500000000, // 500M PKR
        minLiquidAssetsWorkingCapitalPKR: 350000000, // 350M PKR
        cdrAmountPKR: 97000000, // 97 Million PKR (2% of 4.85B)
        cdrPercentage: 2,
        acceptableBankRating: 'AA or above by PACRA/VIS',
        sourcePage: 7,
        clauseText: 'Minimum Average Annual Turnover of PKR 2.0 Billion over last 3 years. Call Deposit Receipt (CDR) of PKR 97,000,000.',
        confidenceScore: 82, // Low confidence warning trigger!
      },
      affidavits: [
        {
          id: 'aff-nha-1',
          title: 'Affidavit of Non-Blacklisting & Non-Litigation',
          stampPaperDenominationPKR: 500,
          requiredTextSummary: 'Original Rs. 500 Judicial Stamp paper with Oath Commissioner attestation confirming bidder has never been blacklisted and has no active litigation with NHA.',
          isBlacklistingDeclarationRequired: true,
          isLitigationHistoryRequired: true,
          isCorrectnessDeclarationRequired: true,
          sourcePage: 12,
          confidenceScore: 91,
        },
      ],
      jvRules: {
        allowedJV: true,
        maxPartners: 3,
        leadPartnerMinSharePercent: 50,
        otherPartnerMinSharePercent: 25,
        sourcePage: 15,
        clauseText: 'JV allowed up to 3 partners. Lead partner minimum share 50%, minor partner minimum share 25%.',
        confidenceScore: 89,
      },
      extractedDate: '2026-08-26',
      documentFileName: 'NHA_E35_Tender_Notice_Scanned_PPRA.pdf',
      totalPages: 18,
      overallOcrConfidence: 87.2,
      hasLowConfidenceWarnings: true,
      lowConfidencePages: [7],
    },
    defaultBidderProfile: {
      companyName: 'Habib Construction Services (HCS) Pvt Ltd',
      pecCategory: 'C-A',
      pecSpecializationCodes: ['CE01', 'CE02', 'CE09', 'BC01'],
      pecValidityDate: '2027-06-30',
      pecStatus: 'ACTIVE',
      avgAnnualTurnoverPKR: 2500000000, // 2.5 Billion PKR
      netWorthPKR: 850000000,
      liquidAssetsPKR: 450000000,
      cdrAvailableAmountPKR: 97000000,
      bankRating: 'AA+',
      uploadedAffidavits: [
        {
          title: 'Affidavit of Non-Blacklisting & Non-Litigation',
          stampPaperValuePKR: 500,
          hasBlacklistingStatement: true,
          hasLitigationStatement: true,
          isJudicialVerified: true,
        },
      ],
      isJV: false,
      ntnStatus: 'ACTIVE_TAXPAYER',
      fbrRegistrationNumber: 'NTN-2849102-7',
    },
  },
  {
    id: 'tender-wapda-dasu',
    title: 'Dasu Hydropower Project Stage-I Infrastructure Infrastructure Package 04',
    agency: 'WAPDA (Water & Power Development Authority)',
    biddingType: 'Single Stage - Two Envelope (PPRA Rule 36-b)',
    ppraRef: 'WAPDA-HYD-DASU-2026-04',
    deadline: '25 October 2026, 02:00 PM PST',
    estimatedCost: 'PKR 8,200,000,000 (8.2 Billion PKR)',
    pages: [
      {
        pageNumber: 1,
        title: 'WAPDA Notice Inviting Tender',
        imageUrl: '/sample-pages/wapda_page1.png',
        extractedClauses: [
          {
            id: 'wc1',
            title: 'Procuring Entity',
            text: 'WAPDA Hydel Development Division invites tenders under PPRA Rules 2004.',
            category: 'basicInfo',
            confidence: 97,
          },
        ],
      },
      {
        pageNumber: 3,
        title: 'PEC Category C-A Mandate',
        imageUrl: '/sample-pages/wapda_page3.png',
        extractedClauses: [
          {
            id: 'wc2',
            title: 'PEC Hydropower Codes',
            text: 'Contractors must hold PEC Category C-A with CE09 (Irrigation & Dams) and CE10 (Hydropower Plants).',
            category: 'pecLicensing',
            confidence: 92,
          },
        ],
      },
      {
        pageNumber: 8,
        title: 'Financial & Bank Guarantee Clause',
        imageUrl: '/sample-pages/wapda_page8.png',
        extractedClauses: [
          {
            id: 'wc3',
            title: 'Financial Turnover PKR 3.5B',
            text: 'Average Annual Turnover last 3 years must exceed PKR 3,500,000,000 (Rs. 3.5 Billion). Earnest Money CDR PKR 164,000,000.',
            category: 'financials',
            confidence: 79, // Faded scan trigger!
          },
        ],
      },
    ],
    extractedData: {
      basicInfo: {
        tenderId: 'WAPDA-HYD-DASU-2026-04',
        tenderTitle: 'Dasu Hydropower Project Stage-I Infrastructure',
        procuringAgency: 'WAPDA (Water & Power Development Authority)',
        biddingType: 'Single Stage - Two Envelope (PPRA Rule 36-b)',
        submissionDeadline: '25 October 2026, 02:00 PM PST',
        estimatedCostPKR: 8200000000,
        location: 'Dasu, Kohistan, KPK',
        ppraRuleReference: 'PPRA Rule 36(b)',
        sourcePage: 1,
      },
      pecRequirement: {
        requiredCategory: 'C-A',
        specializationCodes: ['CE09', 'CE10'],
        validityRequirement: 'Active PEC Registration for FY 2026-27',
        sourcePage: 3,
        clauseText: 'Mandatory Category C-A with Specialization CE09 & CE10.',
        confidenceScore: 92,
      },
      financialCriteria: {
        minAvgAnnualTurnoverPKR: 3500000000, // 3.5 Billion
        minNetWorthPKR: 1200000000,
        minLiquidAssetsWorkingCapitalPKR: 600000000,
        cdrAmountPKR: 164000000, // 164 Million
        cdrPercentage: 2,
        acceptableBankRating: 'AAA or AA+ by PACRA',
        sourcePage: 8,
        clauseText: 'Turnover PKR 3.5 Billion average over 3 years. CDR PKR 164,000,000.',
        confidenceScore: 79, // Trigger warning!
      },
      affidavits: [
        {
          id: 'aff-wapda-1',
          title: 'Affidavit of Rs. 500 Stamp Paper',
          stampPaperDenominationPKR: 500,
          requiredTextSummary: 'Rs. 500 Stamp paper undertaking of non-blacklisting and correctness of audited accounts.',
          isBlacklistingDeclarationRequired: true,
          isLitigationHistoryRequired: true,
          isCorrectnessDeclarationRequired: true,
          sourcePage: 11,
          confidenceScore: 90,
        },
      ],
      jvRules: {
        allowedJV: true,
        maxPartners: 2,
        leadPartnerMinSharePercent: 60,
        otherPartnerMinSharePercent: 40,
        sourcePage: 14,
        clauseText: 'JV limited to maximum 2 partners. Lead partner minimum 60% share.',
        confidenceScore: 88,
      },
      extractedDate: '2026-08-26',
      documentFileName: 'WAPDA_Dasu_Infrastructure_Notice.pdf',
      totalPages: 24,
      overallOcrConfidence: 84.5,
      hasLowConfidenceWarnings: true,
      lowConfidencePages: [8],
    },
    defaultBidderProfile: {
      companyName: 'Frontier Works Organization (FWO) Joint Venture',
      pecCategory: 'C-A',
      pecSpecializationCodes: ['CE01', 'CE02', 'CE09', 'CE10'],
      pecValidityDate: '2027-06-30',
      pecStatus: 'ACTIVE',
      avgAnnualTurnoverPKR: 4200000000,
      netWorthPKR: 1500000000,
      liquidAssetsPKR: 800000000,
      cdrAvailableAmountPKR: 164000000,
      bankRating: 'AAA',
      uploadedAffidavits: [
        {
          title: 'Affidavit of Non-Blacklisting & Non-Litigation',
          stampPaperValuePKR: 500,
          hasBlacklistingStatement: true,
          hasLitigationStatement: true,
          isJudicialVerified: true,
        },
      ],
      isJV: true,
      jvRole: 'LEAD',
      jvLeadPartnerSharePercent: 70,
      jvTotalPartners: 2,
      ntnStatus: 'ACTIVE_TAXPAYER',
      fbrRegistrationNumber: 'NTN-1940291-3',
    },
  },
  {
    id: 'tender-lda-flyover',
    title: 'Construction of Lahore Elevated Arterial Flyover & Grade Separation Structure',
    agency: 'LDA (Lahore Development Authority)',
    biddingType: 'Single Stage - Two Envelope (PPRA Rule 36-b)',
    ppraRef: 'LDA/ENG/2026-FLY-09',
    deadline: '10 October 2026, 11:00 AM PST',
    estimatedCost: 'PKR 1,650,000,000 (1.65 Billion PKR)',
    pages: [
      {
        pageNumber: 1,
        title: 'LDA Procurement Notice',
        imageUrl: '/sample-pages/lda_page1.png',
        extractedClauses: [
          {
            id: 'lc1',
            title: 'Tender Overview',
            text: 'LDA invites sealed tenders from PEC Category C-1 or C-A registered firms for Gulberg Elevated Flyover.',
            category: 'basicInfo',
            confidence: 95,
          },
        ],
      },
    ],
    extractedData: {
      basicInfo: {
        tenderId: 'LDA/ENG/2026-FLY-09',
        tenderTitle: 'Construction of Lahore Elevated Arterial Flyover',
        procuringAgency: 'LDA (Lahore Development Authority)',
        biddingType: 'Single Stage - Two Envelope (PPRA Rule 36-b)',
        submissionDeadline: '10 October 2026, 11:00 AM PST',
        estimatedCostPKR: 1650000000,
        location: 'Lahore, Punjab',
        ppraRuleReference: 'Punjab PPRA Rule 38',
        sourcePage: 1,
      },
      pecRequirement: {
        requiredCategory: 'C-1',
        specializationCodes: ['CE01', 'CE02'],
        validityRequirement: 'Active PEC Registration FY 2026-27',
        sourcePage: 2,
        clauseText: 'PEC Category C-1 or above with CE01 and CE02.',
        confidenceScore: 95,
      },
      financialCriteria: {
        minAvgAnnualTurnoverPKR: 800000000, // 800 Million
        minNetWorthPKR: 200000000,
        minLiquidAssetsWorkingCapitalPKR: 150000000,
        cdrAmountPKR: 33000000, // 33 Million
        cdrPercentage: 2,
        acceptableBankRating: 'A+ or above',
        sourcePage: 5,
        clauseText: 'Minimum 3-year avg turnover PKR 800 Million. CDR PKR 33,000,000.',
        confidenceScore: 91,
      },
      affidavits: [
        {
          id: 'aff-lda-1',
          title: 'Rs. 100 Stamp Paper Affidavit',
          stampPaperDenominationPKR: 100,
          requiredTextSummary: 'Rs. 100 Judicial Stamp Paper certifying active taxpayer status and non-blacklisting.',
          isBlacklistingDeclarationRequired: true,
          isLitigationHistoryRequired: true,
          isCorrectnessDeclarationRequired: true,
          sourcePage: 9,
          confidenceScore: 93,
        },
      ],
      jvRules: {
        allowedJV: false, // Disallowed JV trigger test!
        maxPartners: 1,
        leadPartnerMinSharePercent: 100,
        otherPartnerMinSharePercent: 0,
        sourcePage: 11,
        clauseText: 'Joint Ventures (JV) are strictly NOT allowed for this work.',
        confidenceScore: 96,
      },
      extractedDate: '2026-08-26',
      documentFileName: 'LDA_Elevated_Flyover_Notice.pdf',
      totalPages: 14,
      overallOcrConfidence: 93.8,
      hasLowConfidenceWarnings: false,
      lowConfidencePages: [],
    },
    defaultBidderProfile: {
      companyName: 'Zahir Khan & Brothers (ZKB) Construction',
      pecCategory: 'C-1',
      pecSpecializationCodes: ['CE01', 'CE02'],
      pecValidityDate: '2027-06-30',
      pecStatus: 'ACTIVE',
      avgAnnualTurnoverPKR: 1100000000,
      netWorthPKR: 350000000,
      liquidAssetsPKR: 220000000,
      cdrAvailableAmountPKR: 33000000,
      bankRating: 'AA-',
      uploadedAffidavits: [
        {
          title: 'Affidavit of Non-Blacklisting',
          stampPaperValuePKR: 100,
          hasBlacklistingStatement: true,
          hasLitigationStatement: true,
          isJudicialVerified: true,
        },
      ],
      isJV: false,
      ntnStatus: 'ACTIVE_TAXPAYER',
      fbrRegistrationNumber: 'NTN-3019284-8',
    },
  },
];

// Alternate "Risky/Under-Qualified" Bidder Profile to demonstrate live disqualification detection!
export const UNDERQUALIFIED_BIDDER_TEST_PROFILE: BidderProfile = {
  companyName: 'Apex Builders & Engineers (Pvt) Ltd',
  pecCategory: 'C-2', // Under-licensed for C-A / C-1 tenders!
  pecSpecializationCodes: ['CE01'], // Missing CE02 bridge code!
  pecValidityDate: '2027-06-30',
  pecStatus: 'ACTIVE',
  avgAnnualTurnoverPKR: 1200000000, // PKR 1.2 Billion (Below 2.0B requirement for NHA!)
  netWorthPKR: 300000000,
  liquidAssetsPKR: 180000000,
  cdrAvailableAmountPKR: 60000000, // Short CDR! Required 97M
  bankRating: 'BBB', // Below required A-/AA bank rating!
  uploadedAffidavits: [
    {
      title: 'Affidavit of Non-Blacklisting',
      stampPaperValuePKR: 100, // Defective Stamp Paper! Tender requires Rs. 500
      hasBlacklistingStatement: false, // Lacks explicit statement!
      hasLitigationStatement: true,
      isJudicialVerified: false,
    },
  ],
  isJV: true,
  jvRole: 'MEMBER',
  jvLeadPartnerSharePercent: 35, // Below 50% lead share!
  jvTotalPartners: 4, // Exceeds max 3 partners!
  ntnStatus: 'INACTIVE', // Inactive Taxpayer on FBR ATL!
  fbrRegistrationNumber: 'NTN-9988112-0',
};
