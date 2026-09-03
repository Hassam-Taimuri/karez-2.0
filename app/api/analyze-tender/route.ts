import { NextRequest, NextResponse } from 'next/server';
import { generateWithProviders, ProviderPart } from '../../../lib/ai_provider';

export const maxDuration = 60; // Allow up to 60s for vision analysis

const STRICT_EXTRACTION_PROMPT = `You are Karez 2.0, a specialist AI for Pakistani government procurement under
PPRA Rules 2004. Your job is to extract EXACT numerical and legal values from
tender documents issued by NHA, LDA, C&W, WAPDA, Pak PWD and other Pakistani
procuring agencies.

CRITICAL RULES — read carefully:
- NEVER guess, estimate, or fill in typical values. If a value is not
  explicitly stated on the pages provided, return null for that field
  (or an empty array for list fields). A null is the CORRECT answer for
  anything the document does not state.
- Extract exact PKR amounts as integers without commas or currency symbols.
  Convert "Million"/"Billion" wording (e.g. "Rs. 2 Billion" -> 2000000000).
- For PEC categories, only use these exact values: C-A, C-B, C-1, C-2, C-3, C-4, C-5, C-6.
  C-A is the ONLY "No Limit" category.
- CDR (Call Deposit Receipt), Bid Security and Earnest Money are different names for the same thing.
- "Average Annual Turnover" and "Average Annual Construction Turnover" mean the same field.
- Affidavit requirements are often listed as "undertaking" or "declaration" in Pakistani tenders.
- Single Stage Two Envelope = PPRA Rule 36(b); Single Stage One Envelope = Rule 36(a).
- Record the page number where each value was found. Assign a confidenceScore
  (0-100) reflecting how legible the source text was; use below 85 for faded,
  smudged or crooked text.

Extract and return ONLY this JSON with no other text:

{
  "basicInfo": {
    "tenderId": "string or null",
    "tenderTitle": "full project name as written, or null",
    "procuringAgency": "exact agency name as written, or null",
    "biddingType": "bidding procedure as written (e.g. Single Stage - Two Envelope (PPRA Rule 36-b)) or null",
    "submissionDeadline": "date as written or null",
    "estimatedCostPKR": integer or null,
    "location": "city and province, or null",
    "ppraRuleReference": "rule number if mentioned, or null",
    "sourcePage": page number where this info was found
  },
  "pecRequirement": {
    "requiredCategory": "C-A | C-B | C-1 | C-2 | C-3 | C-4 | C-5 | C-6 or null if not stated",
    "specializationCodes": ["codes like CE01, BC01 — empty array if none stated"],
    "validityRequirement": "required validity period, or null",
    "sourcePage": page number or null,
    "clauseText": "exact sentence from the document describing the PEC requirement, or null",
    "confidenceScore": number 0-100
  },
  "financialCriteria": {
    "minAvgAnnualTurnoverPKR": integer or null,
    "minNetWorthPKR": integer or null,
    "minLiquidAssetsWorkingCapitalPKR": integer or null,
    "cdrAmountPKR": integer or null,
    "cdrPercentage": number or null,
    "acceptableBankRating": "bank rating requirement or null",
    "sourcePage": page number or null,
    "clauseText": "exact sentence describing the financial criteria, or null",
    "confidenceScore": number 0-100
  },
  "affidavits": [
    {
      "id": "aff-1",
      "title": "affidavit/undertaking name as written",
      "stampPaperDenominationPKR": integer or null,
      "requiredTextSummary": "what the affidavit must declare",
      "isBlacklistingDeclarationRequired": true or false,
      "isLitigationHistoryRequired": true or false,
      "isCorrectnessDeclarationRequired": true or false,
      "sourcePage": page number,
      "confidenceScore": number 0-100
    }
  ],
  "jvRules": {
    "allowedJV": true or false — or null if the document says nothing about JVs,
    "maxPartners": integer or null,
    "leadPartnerMinSharePercent": number or null,
    "otherPartnerMinSharePercent": number or null,
    "sourcePage": page number or null,
    "clauseText": "exact JV clause text, or null",
    "confidenceScore": number 0-100
  },
  "overallOcrConfidence": number 0-100,
  "hasLowConfidenceWarnings": true or false,
  "lowConfidencePages": [page numbers with poor legibility]
}

If the document says nothing about JVs at all, return "jvRules": null.
If no affidavits/undertakings are mentioned, return "affidavits": [].`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pdfBase64,
      images,
      imageBase64,
      mimeType = 'image/png',
      numPages,
    } = body as {
      pdfBase64?: string;
      images?: string[];
      imageBase64?: string;
      mimeType?: string;
      numPages?: number;
    };

    const maxPages = Number(process.env.MAX_PAGES_PER_ANALYSIS || 12);
    const parts: ProviderPart[] = [{ text: STRICT_EXTRACTION_PROMPT }];
    let inputMode: 'pdf' | 'images' | 'single-image';
    let pagesAnalysed: number;

    const stripDataUrl = (s: string) => s.replace(/^data:[\w/+.-]+;base64,/, '');

    if (pdfBase64) {
      inputMode = 'pdf';
      pagesAnalysed = numPages || 0;
      parts.push({
        inlineData: { mimeType: 'application/pdf', data: stripDataUrl(pdfBase64) },
      });
    } else if (Array.isArray(images) && images.length > 0) {
      inputMode = 'images';
      const capped = images.slice(0, maxPages);
      pagesAnalysed = capped.length;
      for (const img of capped) {
        const isJpeg = /^data:image\/jpe?g/.test(img);
        parts.push({
          inlineData: {
            mimeType: isJpeg ? 'image/jpeg' : 'image/png',
            data: stripDataUrl(img),
          },
        });
      }
    } else if (imageBase64) {
      inputMode = 'single-image';
      pagesAnalysed = 1;
      parts.push({
        inlineData: { mimeType, data: stripDataUrl(imageBase64) },
      });
    } else {
      return NextResponse.json(
        { error: 'Provide pdfBase64, images[] or imageBase64 to analyse.' },
        { status: 400 }
      );
    }

    let result;
    try {
      result = await generateWithProviders({
        parts,
        systemInstruction:
          'You are an expert Pakistani procurement compliance auditor under PPRA Rules 2004. Extract structured compliance data exactly as stated in the document. Return null for anything not stated — never invent values.',
      });
    } catch (providerErr: any) {
      // Deliberate: no fallback/synthetic tender data. The client must show
      // an error instead of fabricated compliance thresholds.
      console.error('Tender analysis failed on all providers:', providerErr?.message);
      return NextResponse.json(
        {
          error:
            'The AI extraction service is unavailable or the document could not be analysed. No placeholder data was generated — please retry.',
          detail: providerErr?.message,
        },
        { status: 502 }
      );
    }

    let extractedData: any;
    try {
      extractedData = JSON.parse(result.text);
    } catch {
      console.error('Model returned unparseable JSON:', result.text.slice(0, 300));
      return NextResponse.json(
        {
          error: 'The AI model returned an unreadable response. No placeholder data was generated — please retry.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      extractedData,
      meta: {
        provider: result.provider,
        model: result.model,
        pagesAnalysed,
        inputMode,
      },
    });
  } catch (error: any) {
    console.error('Tender analysis API error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to process tender document.',
      },
      { status: 500 }
    );
  }
}
