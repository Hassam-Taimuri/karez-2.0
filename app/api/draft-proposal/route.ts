import { NextRequest, NextResponse } from 'next/server';
import { generateWithProviders } from '../../../lib/ai_provider';
import { formatPKR } from '../../../lib/compliance_engine';

export const maxDuration = 90;

function moneyOrNotStated(v: any): string {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? formatPKR(n) : 'NOT STATED in the analysed pages';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenderData, bidderProfile, auditReport } = body;

    if (!tenderData || !bidderProfile) {
      return NextResponse.json(
        { error: 'Both tenderData and bidderProfile are required to draft a proposal.' },
        { status: 400 }
      );
    }

    // ---- Verified facts only. Money is pre-formatted server-side so the ----
    // ---- LLM never re-formats (and mis-formats) numbers itself.         ----
    const companyName = bidderProfile?.companyName || null;
    const pecCategory = bidderProfile?.pecCategory || null;
    const ntn = bidderProfile?.fbrRegistrationNumber || null; // FBR NTN — correct field
    const specCodes = Array.isArray(bidderProfile?.pecSpecializationCodes)
      ? bidderProfile.pecSpecializationCodes.join(', ')
      : null;

    const failedItems: { ruleTitle: string; reason: string }[] = Array.isArray(auditReport?.items)
      ? auditReport.items
          .filter((i: any) => i?.status === 'FAILED - DISQUALIFICATION RISK')
          .map((i: any) => ({ ruleTitle: i.ruleTitle, reason: i.disqualificationReason || '' }))
      : [];
    const flaggedItems: string[] = Array.isArray(auditReport?.items)
      ? auditReport.items
          .filter((i: any) => i?.status === 'FLAGGED FOR HUMAN REVIEW')
          .map((i: any) => i.ruleTitle)
      : [];

    const facts = {
      tender: {
        title: tenderData?.basicInfo?.tenderTitle || null,
        agency: tenderData?.basicInfo?.procuringAgency || null,
        reference: tenderData?.basicInfo?.tenderId || null,
        estimatedCost: moneyOrNotStated(tenderData?.basicInfo?.estimatedCostPKR),
        requiredPecCategory: tenderData?.pecRequirement?.requiredCategory || 'NOT STATED',
        requiredTurnover: moneyOrNotStated(tenderData?.financialCriteria?.minAvgAnnualTurnoverPKR),
        requiredCdr: moneyOrNotStated(tenderData?.financialCriteria?.cdrAmountPKR),
      },
      bidder: {
        companyName,
        pecCategory,
        pecSpecializationCodes: specCodes,
        ntn,
        turnover: moneyOrNotStated(bidderProfile?.avgAnnualTurnoverPKR),
        cdrAvailable: moneyOrNotStated(bidderProfile?.cdrAvailableAmountPKR),
      },
      audit: {
        failedChecks: failedItems,
        flaggedChecks: flaggedItems,
      },
    };

    const prompt = `You are a Pakistani PPRA procurement assistant drafting a technical proposal SKELETON.
Return ONLY valid JSON. No markdown. No backticks. No explanation.

VERIFIED FACTS (the ONLY facts you may state — everything here is already
formatted; copy money strings verbatim, never re-format numbers):
${JSON.stringify(facts, null, 2)}

STRICT DRAFTING RULES — violations make the proposal legally dangerous:
1. NEVER invent facts. No founding years, ISO certifications, kilometres
   built, project names, staff counts, office locations, or bank names.
   Wherever such a detail belongs, write a placeholder in the exact form
   "[INSERT: description of what the bidder must fill in]".
2. The NTN is "${ntn || 'unknown'}". If it is unknown, write
   "[INSERT: FBR NTN]" — never fabricate a number.
3. PEC category facts: C-A is the ONLY "No Limit" category. C-B and every
   lower category have monetary limits. Never describe any other category
   as unlimited.
4. HONESTY ABOUT FAILURES: audit.failedChecks lists compliance checks the
   bidder currently FAILS. If the list is non-empty:
   - Section 6.0 (Financial Capacity) MUST explicitly disclose each failed
     check and state that it must be remedied before submission.
   - The cover letter MUST NOT claim the firm "meets all eligibility
     criteria". Instead it must state the firm is addressing the listed
     gaps prior to submission.
   If the list is empty, do not invent problems.
5. Where a tender requirement says "NOT STATED in the analysed pages",
   refer to it as not stated and advise verifying the bidding document —
   do not substitute a number.
6. Copy money strings from the facts verbatim (e.g. "PKR 2.00 Billion
   (2,000,000,000 PKR)").

Return this JSON structure:
{
  "proposalTitle": "Technical Proposal for [tender title, or [INSERT: tender title]]",
  "preparedFor": "[agency or [INSERT: procuring agency]]",
  "preparedBy": "[company name]",
  "tenderReference": "[reference or [INSERT: tender reference]]",
  "sections": [
    { "id": "section-1", "sectionNumber": "1.0", "title": "Company Profile & Introduction", "content": "...", "isRequired": true, "pageEstimate": 2 },
    { "id": "section-2", "sectionNumber": "2.0", "title": "Technical Capability & PEC Licensing", "content": "...", "isRequired": true, "pageEstimate": 2 },
    { "id": "section-3", "sectionNumber": "3.0", "title": "Relevant Experience & Past Performance", "content": "... (use [INSERT: ...] placeholders for project references)", "isRequired": true, "pageEstimate": 3 },
    { "id": "section-4", "sectionNumber": "4.0", "title": "Key Personnel & Organization", "content": "... (use [INSERT: ...] placeholders for names/CVs)", "isRequired": true, "pageEstimate": 2 },
    { "id": "section-5", "sectionNumber": "5.0", "title": "Methodology & Work Plan", "content": "...", "isRequired": true, "pageEstimate": 3 },
    { "id": "section-6", "sectionNumber": "6.0", "title": "Financial Capacity & CDR", "content": "... (MUST disclose failed checks here if any)", "isRequired": true, "pageEstimate": 2 }
  ],
  "documentChecklist": [
    { "id": "doc-1", "documentName": "...", "description": "...", "stampPaperRequired": false, "stampPaperDenomination": null, "isOriginalRequired": true, "copiesRequired": 3, "urgencyLevel": "critical", "source": "..." }
  ],
  "coverLetterDraft": "Formal cover letter text following rule 4."
}`;

    let parsedProposal: any = null;
    let providerMeta: { provider: string; model: string } | null = null;

    try {
      const result = await generateWithProviders({
        parts: [{ text: prompt }],
        systemInstruction:
          'You are a senior Pakistani government procurement specialist. Draft honest, compliant technical proposal skeletons in valid JSON. Never fabricate company facts; use [INSERT: ...] placeholders instead.',
        timeoutMs: 60000,
      });
      providerMeta = { provider: result.provider, model: result.model };
      try {
        parsedProposal = JSON.parse(result.text);
      } catch (parseErr) {
        console.warn('Failed to parse proposal JSON, using deterministic template:', parseErr);
      }
    } catch (providerErr: any) {
      console.warn('All providers failed for proposal draft, using deterministic template:', providerErr?.message);
    }

    if (!parsedProposal) {
      // Deterministic placeholder template. Built ONLY from verified profile
      // facts + [INSERT] placeholders — nothing is invented.
      const cn = companyName || '[INSERT: company name]';
      const disclosure =
        failedItems.length > 0
          ? ` PRE-SUBMISSION GAPS TO REMEDY: ${failedItems
              .map((f) => f.ruleTitle)
              .join('; ')}. These items currently FAIL the compliance audit and must be resolved before the bid is submitted.`
          : '';

      parsedProposal = {
        proposalTitle: `Technical Proposal for ${facts.tender.title || '[INSERT: tender title]'}`,
        preparedFor: facts.tender.agency || '[INSERT: procuring agency]',
        preparedBy: cn,
        tenderReference: facts.tender.reference || '[INSERT: tender reference]',
        sections: [
          {
            id: 'section-1',
            sectionNumber: '1.0',
            title: 'Company Profile & Introduction',
            content: `${cn} is a Pakistani contracting firm${pecCategory ? ` holding PEC Category ${pecCategory}` : ''}. FBR NTN: ${ntn || '[INSERT: FBR NTN]'}. [INSERT: brief company history, office locations and organisational overview].`,
            isRequired: true,
            pageEstimate: 2,
          },
          {
            id: 'section-2',
            sectionNumber: '2.0',
            title: 'Technical Capability & PEC Licensing',
            content: `${cn} holds PEC registration in Category ${pecCategory || '[INSERT: PEC category]'}${specCodes ? ` with specialization codes ${specCodes}` : ''}. The tender requires Category ${facts.tender.requiredPecCategory}. [INSERT: PEC licence number and current renewal evidence].`,
            isRequired: true,
            pageEstimate: 2,
          },
          {
            id: 'section-3',
            sectionNumber: '3.0',
            title: 'Relevant Experience & Past Performance',
            content: `[INSERT: list of comparable completed projects with employer names, contract values and completion certificates. Do not overstate — evaluation committees verify references].`,
            isRequired: true,
            pageEstimate: 3,
          },
          {
            id: 'section-4',
            sectionNumber: '4.0',
            title: 'Key Personnel & Organization',
            content: `[INSERT: proposed Project Manager, PEC-registered engineers and site organisation chart with CVs as required by the bidding document].`,
            isRequired: true,
            pageEstimate: 2,
          },
          {
            id: 'section-5',
            sectionNumber: '5.0',
            title: 'Methodology & Work Plan',
            content: `[INSERT: construction methodology, mobilisation plan, programme of works and quality/HSE arrangements specific to this contract].`,
            isRequired: true,
            pageEstimate: 3,
          },
          {
            id: 'section-6',
            sectionNumber: '6.0',
            title: 'Financial Capacity & CDR',
            content: `Bidder 3-year average annual turnover: ${facts.bidder.turnover}. Tender requirement: ${facts.tender.requiredTurnover}. CDR / Bid Security required: ${facts.tender.requiredCdr}; CDR available: ${facts.bidder.cdrAvailable}.${disclosure || ' [INSERT: audited financial statements references].'}`,
            isRequired: true,
            pageEstimate: 2,
          },
        ],
        documentChecklist: [
          {
            id: 'doc-1',
            documentName: 'PEC Registration Certificate',
            description: `Valid PEC certificate${pecCategory ? ` in Category ${pecCategory}` : ''}, renewed for the current financial year`,
            stampPaperRequired: false,
            stampPaperDenomination: null,
            isOriginalRequired: true,
            copiesRequired: 3,
            urgencyLevel: 'critical',
            source: 'Pakistan Engineering Council (PEC)',
          },
          {
            id: 'doc-2',
            documentName: 'Call Deposit Receipt (CDR) / Bid Security',
            description: `CDR from a scheduled bank in favour of the procuring agency. Required amount: ${facts.tender.requiredCdr}.`,
            stampPaperRequired: false,
            stampPaperDenomination: null,
            isOriginalRequired: true,
            copiesRequired: 1,
            urgencyLevel: 'critical',
            source: 'Scheduled Bank',
          },
          {
            id: 'doc-3',
            documentName: 'Non-Blacklisting Affidavit',
            description: 'Sworn affidavit on judicial stamp paper (denomination as per tender) declaring the firm is not blacklisted',
            stampPaperRequired: true,
            stampPaperDenomination: null,
            isOriginalRequired: true,
            copiesRequired: 3,
            urgencyLevel: 'critical',
            source: 'Notary Public / Oath Commissioner',
          },
          {
            id: 'doc-4',
            documentName: 'FBR NTN Certificate & ATL Verification',
            description: 'NTN certificate and Active Taxpayer List evidence from the FBR portal',
            stampPaperRequired: false,
            stampPaperDenomination: null,
            isOriginalRequired: false,
            copiesRequired: 3,
            urgencyLevel: 'critical',
            source: 'Federal Board of Revenue portal (fbr.gov.pk)',
          },
          {
            id: 'doc-5',
            documentName: 'Audited Financial Statements (3 Years)',
            description: 'Audited balance sheets and P&L for the last 3 financial years',
            stampPaperRequired: false,
            stampPaperDenomination: null,
            isOriginalRequired: false,
            copiesRequired: 3,
            urgencyLevel: 'critical',
            source: 'External auditor',
          },
        ],
        coverLetterDraft:
          failedItems.length > 0
            ? `Dear Sir,\n\nWe hereby submit our Technical Proposal for ${facts.tender.title || '[INSERT: tender title]'} (Ref: ${facts.tender.reference || '[INSERT: reference]'}).\n\nWe draw the evaluation committee's attention to the following items our internal pre-submission audit identified, which we are remedying prior to bid submission: ${failedItems.map((f) => f.ruleTitle).join('; ')}.\n\nYours faithfully,\n${cn}`
            : `Dear Sir,\n\nWe hereby submit our Technical Proposal for ${facts.tender.title || '[INSERT: tender title]'} (Ref: ${facts.tender.reference || '[INSERT: reference]'}). Our internal pre-submission audit found no failed eligibility checks against the criteria stated in the analysed pages; criteria the document did not state remain subject to manual verification.\n\nYours faithfully,\n${cn}`,
        isDeterministicTemplate: true,
      };
    }

    return NextResponse.json({
      success: true,
      proposal: parsedProposal,
      meta: providerMeta,
    });
  } catch (error: any) {
    console.error('Draft proposal route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to draft technical proposal.' },
      { status: 500 }
    );
  }
}
