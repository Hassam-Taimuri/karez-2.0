'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, TriangleAlert, X, UploadCloud, Building2, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { saveTenderAnalysis, saveBidderProfile, getBidderProfile, getTendersByUser, createCompany, getCompaniesByUser, updateCompany, deleteCompany, saveTenderToCompany, getTendersByCompany } from '../lib/firestoreService';
import { ClientSwitcher } from '../components/ClientSwitcher';
import { Header } from '../components/Header';
import { PdfDocumentViewer } from '../components/PdfDocumentViewer';
import { ComplianceChecklist } from '../components/ComplianceChecklist';
import { BidderProfileModal } from '../components/BidderProfileModal';
import { ScannedPreprocessingDemo } from '../components/ScannedPreprocessingDemo';
import { ExecutiveReportModal } from '../components/ExecutiveReportModal';
import { AffidavitGeneratorModal } from '../components/AffidavitGeneratorModal';
import { BidSecurityCalculatorModal } from '../components/BidSecurityCalculatorModal';
import { EnvelopePackingChecklistModal } from '../components/EnvelopePackingChecklistModal';
import { JvCalculatorModal } from '../components/JvCalculatorModal';
import { ProposalDraftModal } from '../components/ProposalDraftModal';

import { useIsMobile } from '../hooks/use-mobile';
import { SampleTenderDoc, BidderProfile, AuditReport, TenderComplianceData, PECCategory, JVRules, StampPaperAffidavit, EMPTY_BIDDER_PROFILE } from '../lib/types';
import { SAMPLE_TENDERS } from '../lib/sample_tenders';
import { auditBidderEligibility, formatPKR } from '../lib/compliance_engine';
import { renderPdfToImages, fileToDataUrl } from '../lib/pdf_pages';

// Helper: compress image files client-side before sending over API (reduces 10MB to ~150KB)
async function compressFileForAnalysis(file: File): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve({ base64Data: reader.result as string, mimeType: file.type || 'application/pdf' });
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      const maxDim = 1280;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      }
      const compressedUrl = canvas.toDataURL('image/jpeg', 0.82);
      resolve({ base64Data: compressedUrl, mimeType: 'image/jpeg' });
    };
    img.onerror = () => {
      const fallbackReader = new FileReader();
      fallbackReader.onload = () => resolve({ base64Data: fallbackReader.result as string, mimeType: file.type || 'image/png' });
      fallbackReader.readAsDataURL(file);
    };
    reader.readAsDataURL(file);
  });
}

const VALID_PEC_CATEGORIES: PECCategory[] = ['C-A', 'C-B', 'C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6'];

// Helper: normalize extracted tender compliance data WITHOUT inventing values.
// Anything the document did not state stays 0 / null / empty and is recorded
// in notStatedFields so the UI can tell the user and the engine can flag it.
function normalizeTenderData(
  extracted: any,
  fileName: string,
  meta?: { provider: string; model: string; pagesAnalysed: number; inputMode: string },
  totalPages?: number
): TenderComplianceData {
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const notStated: string[] = [];

  const num = (v: any): number => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const str = (v: any): string => (typeof v === 'string' && v.trim() ? v.trim() : '');

  const pec = extracted?.pecRequirement || null;
  const requiredCategory: PECCategory | null =
    pec?.requiredCategory && VALID_PEC_CATEGORIES.includes(pec.requiredCategory)
      ? (pec.requiredCategory as PECCategory)
      : null;
  if (!requiredCategory) notStated.push('Required PEC category');
  const specializationCodes: string[] = Array.isArray(pec?.specializationCodes)
    ? pec.specializationCodes.filter((c: any) => typeof c === 'string' && c.trim())
    : [];
  if (specializationCodes.length === 0) notStated.push('PEC specialization codes');

  const fin = extracted?.financialCriteria || null;
  const minTurnover = num(fin?.minAvgAnnualTurnoverPKR);
  if (!minTurnover) notStated.push('Minimum annual turnover');
  const cdrAmount = num(fin?.cdrAmountPKR);
  if (!cdrAmount) notStated.push('CDR / Bid Security amount');

  // Affidavits: use exactly what was extracted; empty array = not stated.
  let affidavits: StampPaperAffidavit[] = [];
  if (Array.isArray(extracted?.affidavits) && extracted.affidavits.length > 0) {
    affidavits = extracted.affidavits.map((a: any, i: number) => ({
      id: str(a?.id) || `aff-extracted-${i + 1}`,
      title: str(a?.title) || `Affidavit / Undertaking ${i + 1}`,
      stampPaperDenominationPKR: num(a?.stampPaperDenominationPKR),
      requiredTextSummary: str(a?.requiredTextSummary),
      isBlacklistingDeclarationRequired: a?.isBlacklistingDeclarationRequired === true,
      isLitigationHistoryRequired: a?.isLitigationHistoryRequired === true,
      isCorrectnessDeclarationRequired: a?.isCorrectnessDeclarationRequired === true,
      sourcePage: num(a?.sourcePage),
      confidenceScore: num(a?.confidenceScore),
    }));
  } else if (Array.isArray(extracted?.legalRequirements?.requiredAffidavits) && extracted.legalRequirements.requiredAffidavits.length > 0) {
    // Legacy extraction shape — map it without inventing stamp values.
    const lr = extracted.legalRequirements;
    affidavits = lr.requiredAffidavits.map((text: string, i: number) => ({
      id: `aff-extracted-${i + 1}`,
      title: str(text) || `Affidavit / Undertaking ${i + 1}`,
      stampPaperDenominationPKR: num(lr.stampPaperDenomination),
      requiredTextSummary: str(text),
      isBlacklistingDeclarationRequired: lr.blacklistingClause === true,
      isLitigationHistoryRequired: false,
      isCorrectnessDeclarationRequired: false,
      sourcePage: num(lr.sourcePage),
      confidenceScore: 0,
    }));
  } else {
    notStated.push('Affidavit / stamp paper requirements');
  }
  if (affidavits.some((a) => !a.stampPaperDenominationPKR)) {
    notStated.push('Stamp paper denomination');
  }

  // JV rules: null when the document said nothing about JVs.
  let jvRules: JVRules | null = null;
  const jv = extracted?.jvRules;
  if (jv && typeof jv.allowedJV === 'boolean') {
    jvRules = {
      allowedJV: jv.allowedJV,
      maxPartners: num(jv.maxPartners),
      leadPartnerMinSharePercent: num(jv.leadPartnerMinSharePercent),
      otherPartnerMinSharePercent: num(jv.otherPartnerMinSharePercent),
      sourcePage: num(jv.sourcePage),
      clauseText: str(jv.clauseText),
      confidenceScore: num(jv.confidenceScore),
    };
    if (jv.allowedJV && !jvRules.maxPartners) notStated.push('JV partner cap');
  } else if (extracted?.legalRequirements && typeof extracted.legalRequirements.jvAllowed === 'boolean') {
    const lr = extracted.legalRequirements;
    jvRules = {
      allowedJV: lr.jvAllowed,
      maxPartners: 0,
      leadPartnerMinSharePercent: num(lr.jvLeadPartnerMinShare),
      otherPartnerMinSharePercent: 0,
      sourcePage: num(lr.sourcePage),
      clauseText: '',
      confidenceScore: 0,
    };
  } else {
    notStated.push('Joint Venture (JV) rules');
  }

  return {
    extractedDate: new Date().toISOString().split('T')[0],
    documentFileName: fileName,
    totalPages: totalPages || num(extracted?.totalPages) || 1,
    basicInfo: {
      tenderId: str(extracted?.basicInfo?.tenderId) || `UPLOAD-${cleanTitle.slice(0, 24) || 'TENDER'}`,
      tenderTitle: str(extracted?.basicInfo?.tenderTitle) || `Tender Document: ${cleanTitle}`,
      procuringAgency: (str(extracted?.basicInfo?.procuringAgency) || 'Not stated on pages analysed') as any,
      biddingType: (str(extracted?.basicInfo?.biddingType) || 'Not stated on pages analysed') as any,
      submissionDeadline: str(extracted?.basicInfo?.submissionDeadline) || 'Not stated on pages analysed',
      estimatedCostPKR: num(extracted?.basicInfo?.estimatedCostPKR) || undefined,
      location: str(extracted?.basicInfo?.location) || 'Not stated',
      ppraRuleReference: str(extracted?.basicInfo?.ppraRuleReference) || 'Not stated',
      sourcePage: num(extracted?.basicInfo?.sourcePage) || 1,
    },
    pecRequirement: {
      requiredCategory,
      specializationCodes,
      validityRequirement: str(pec?.validityRequirement),
      sourcePage: num(pec?.sourcePage),
      clauseText: str(pec?.clauseText),
      confidenceScore: num(pec?.confidenceScore),
    },
    financialCriteria: {
      minAvgAnnualTurnoverPKR: minTurnover,
      minNetWorthPKR: num(fin?.minNetWorthPKR),
      minLiquidAssetsWorkingCapitalPKR: num(fin?.minLiquidAssetsWorkingCapitalPKR),
      cdrAmountPKR: cdrAmount,
      cdrPercentage: num(fin?.cdrPercentage) || undefined,
      acceptableBankRating: str(fin?.acceptableBankRating),
      sourcePage: num(fin?.sourcePage),
      clauseText: str(fin?.clauseText),
      confidenceScore: num(fin?.confidenceScore),
    },
    affidavits,
    jvRules,
    overallOcrConfidence: num(extracted?.overallOcrConfidence),
    hasLowConfidenceWarnings: extracted?.hasLowConfidenceWarnings === true,
    lowConfidencePages: Array.isArray(extracted?.lowConfidencePages) ? extracted.lowConfidencePages : [],
    notStatedFields: notStated,
    extractionMeta: meta
      ? {
          provider: meta.provider,
          model: meta.model,
          pagesAnalysed: meta.pagesAnalysed,
          inputMode: meta.inputMode as any,
        }
      : undefined,
  };
}

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [language, setLanguage] = useState<'en' | 'ur'>('en');

  const [currentTender, setCurrentTender] = useState<SampleTenderDoc | TenderComplianceData | any | null>(null);
  // New users start completely blank — no company, no specs, no history.
  // Their real profile loads from Firestore below; samples carry their own
  // annotated demo profiles.
  const [currentBidder, setCurrentBidder] = useState<BidderProfile>(EMPTY_BIDDER_PROFILE);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [highlightedClauseId, setHighlightedClauseId] = useState<string | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisNotice, setAnalysisNotice] = useState<{ message: string; notStated: string[] } | null>(null);

  const [savedTenders, setSavedTenders] = useState<any[]>([]);

  const [companies, setCompanies] = useState<any[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [isCreatingCompany, setIsCreatingCompany] = useState<boolean>(false);

  // Modals
  const [isBidderModalOpen, setIsBidderModalOpen] = useState<boolean>(false);
  const [isOpenCvModalOpen, setIsOpenCvModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isAffidavitModalOpen, setIsAffidavitModalOpen] = useState<boolean>(false);
  const [isCdrModalOpen, setIsCdrModalOpen] = useState<boolean>(false);
  const [isEnvelopeModalOpen, setIsEnvelopeModalOpen] = useState<boolean>(false);
  const [isJvModalOpen, setIsJvModalOpen] = useState<boolean>(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const loadProfileAndTenders = async () => {
      setIsLoadingData(true);
      try {
        const userCompanies = await getCompaniesByUser(user.uid);
        
        if (userCompanies.length === 0) {
          // Legacy single-profile migration. Reading a non-existent doc under
          // these Firestore rules throws "insufficient permissions" (resource.data
          // is null), so treat any failure here as simply "no legacy profile"
          // rather than letting it abort onboarding.
          let savedProfile: any = null;
          try {
            savedProfile = await getBidderProfile(user.uid);
          } catch {
            savedProfile = null;
          }
          if (savedProfile) {
            const { userId, updatedAt, ...profileData } = savedProfile;
            const newCompanyId = await createCompany(user.uid, profileData);
            const freshCompanies = await getCompaniesByUser(user.uid);
            setCompanies(freshCompanies);
            setCurrentCompanyId(newCompanyId);
            setCurrentBidder(profileData);
            const tenders = await getTendersByCompany(user.uid, newCompanyId);
            setSavedTenders(tenders);
          } else {
            // First login, nothing saved anywhere: keep everything blank and
            // walk the user straight into setting up their own bidder profile.
            setCurrentBidder(EMPTY_BIDDER_PROFILE);
            setIsBidderModalOpen(true);
          }
        } else {
          setCompanies(userCompanies);
          const firstCompany = userCompanies[0];
          setCurrentCompanyId(firstCompany.id);
          const { id, userId, createdAt, updatedAt, ...profileData } = firstCompany;
          setCurrentBidder(profileData);
          const tenders = await getTendersByCompany(user.uid, firstCompany.id);
          setSavedTenders(tenders);
        }
      } catch (err) {
        console.warn('Could not load companies or tenders:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadProfileAndTenders();
  }, [user]);

  const handleSelectCompany = async (company: any) => {
    if (!user) return;
    setCurrentCompanyId(company.id);
    const { id, userId, createdAt, updatedAt, ...profileData } = company;
    setCurrentBidder(profileData);
    try {
      const tenders = await getTendersByCompany(user.uid, company.id);
      setSavedTenders(tenders);
    } catch (err) {
      console.warn('Could not load company tenders:', err);
    }
  };

  const handleDeleteCompany = async (company: any) => {
    if (!user || !company?.id) return;
    try {
      await deleteCompany(company.id);
      const freshCompanies = await getCompaniesByUser(user.uid);
      setCompanies(freshCompanies);
      // If the deleted client was active, fall back to the first remaining
      // client, or reset to a blank profile so nothing stale lingers.
      if (currentCompanyId === company.id) {
        if (freshCompanies.length > 0) {
          const next = freshCompanies[0];
          const { id, userId, createdAt, updatedAt, ...profileData } = next;
          setCurrentCompanyId(next.id);
          setCurrentBidder(profileData);
          const tenders = await getTendersByCompany(user.uid, next.id);
          setSavedTenders(tenders);
        } else {
          setCurrentCompanyId(null);
          setCurrentBidder(EMPTY_BIDDER_PROFILE);
          setSavedTenders([]);
        }
      }
    } catch (err) {
      console.warn('Could not delete company:', err);
    }
  };

  const handleCreateCompany = () => {
    if (!user) return;
    // Open the profile manager completely blank; the company document is only
    // created in Firestore when the user saves their own details — no default
    // specs are ever written on their behalf.
    setCurrentCompanyId(null);
    setCurrentBidder(EMPTY_BIDDER_PROFILE);
    setSavedTenders([]);
    setIsBidderModalOpen(true);
  };

  // Human auditor overrides state
  const [humanApprovedMap, setHumanApprovedMap] = useState<Record<string, boolean>>({});
  const [humanNotesMap, setHumanNotesMap] = useState<Record<string, string>>({});

  // Dynamic Audit Report Recalculation
  const auditReport = useMemo(() => {
    if (!currentTender) return null;
    const tenderData = (currentTender as any).extractedData || currentTender;
    const base = auditBidderEligibility(tenderData, currentBidder);
    const updatedItems = base.items.map((item) => ({
      ...item,
      humanApproved: humanApprovedMap[item.id] ?? item.humanApproved,
      humanNotes: humanNotesMap[item.id] ?? item.humanNotes,
    }));
    return {
      ...base,
      items: updatedItems,
      humanApprovedCount: updatedItems.filter((i) => i.humanApproved).length,
    };
  }, [currentTender, currentBidder, humanApprovedMap, humanNotesMap]);

  if (loading || !user) return null;

  // Handlers
  const handleSelectTender = (tender: SampleTenderDoc) => {
    setCurrentTender(tender);
    setCurrentBidder(tender.defaultBidderProfile);
    setCurrentPage(1);
    setHighlightedClauseId(undefined);
  };

  const handleSelectBidder = (bidder: BidderProfile) => {
    setCurrentBidder(bidder);
  };

  // Reopen a previously analysed tender from the history dropdown. Only tenders
  // saved with their full extraction can be reopened; older metadata-only
  // records return false so the UI can tell the user.
  const handleOpenSavedTender = (item: any): boolean => {
    const data = item?.extractedData;
    if (!data) return false;
    const reopened: SampleTenderDoc = {
      id: item.id || `saved-${Date.now()}`,
      title: data.basicInfo?.tenderTitle || item.tenderTitle || 'Saved Tender',
      agency: data.basicInfo?.procuringAgency || item.procuringAgency,
      biddingType: data.basicInfo?.biddingType,
      ppraRef: data.basicInfo?.tenderId || item.tenderId,
      deadline: data.basicInfo?.submissionDeadline,
      estimatedCost: data.basicInfo?.estimatedCostPKR
        ? formatPKR(data.basicInfo.estimatedCostPKR)
        : 'Not stated on pages analysed',
      pages: [
        {
          pageNumber: 1,
          title: data.documentFileName || 'Tender document',
          imageUrl: '',
          extractedClauses: [
            data.pecRequirement?.clauseText && {
              id: 'saved-clause-1',
              title: 'PEC Category & Specialization Requirements',
              text: data.pecRequirement.clauseText,
              category: 'pecLicensing' as const,
              confidence: data.pecRequirement.confidenceScore,
            },
            data.financialCriteria?.clauseText && {
              id: 'saved-clause-2',
              title: 'Financial Turnover & CDR Bid Security',
              text: data.financialCriteria.clauseText,
              category: 'financials' as const,
              confidence: data.financialCriteria.confidenceScore,
            },
          ].filter(Boolean) as any[],
        },
      ],
      extractedData: data,
      defaultBidderProfile: currentBidder,
    };
    setCurrentTender(reopened);
    setCurrentPage(1);
    return true;
  };

  const handleJumpToPage = (page: number, clauseId?: string) => {
    setCurrentPage(page);
    if (clauseId) setHighlightedClauseId(clauseId);
  };

  const handleToggleHumanApproval = (itemId: string) => {
    setHumanApprovedMap((prev) => ({
      ...prev,
      [itemId]: !(prev[itemId] ?? false),
    }));
  };

  const handleUpdateNotes = (itemId: string, notes: string) => {
    setHumanNotesMap((prev) => ({
      ...prev,
      [itemId]: notes,
    }));
  };

  const handleCustomFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalysisError(null);
    setAnalysisNotice(null);
    setIsAnalyzing(true);

    try {
      // 1. Prepare payload: whole PDF (all pages) when possible, rendered
      //    page images otherwise, single compressed image for scans.
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      let payload: any = null;
      let firstPagePreview = '';
      let totalPages = 1;

      if (isPdf) {
        setAnalysisStage('Rendering PDF pages in your browser (pdf.js)...');
        const { pageImages, numPages } = await renderPdfToImages(file, 12);
        totalPages = numPages;
        firstPagePreview = pageImages[0] || '';
        if (file.size <= 15 * 1024 * 1024) {
          // Small enough: send the whole PDF so the model reads every page.
          const dataUrl = await fileToDataUrl(file);
          payload = { pdfBase64: dataUrl, numPages };
        } else {
          payload = { images: pageImages, numPages };
        }
      } else {
        setAnalysisStage('Optimizing scan resolution & compressing payload...');
        const { base64Data, mimeType } = await compressFileForAnalysis(file);
        firstPagePreview = base64Data;
        payload = { imageBase64: base64Data, mimeType };
      }

      setAnalysisStage('AI engine extracting PPRA eligibility & financial criteria...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);
      let res: Response;
      try {
        res = await fetch('/api/analyze-tender', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !data?.extractedData) {
        throw new Error(
          data?.error || `The analysis service returned HTTP ${res.status}. No tender was created.`
        );
      }

      // 2. Normalize WITHOUT defaults — unknowns stay null/0 and are listed
      //    in notStatedFields for the amber banner + engine flags.
      const meta = data.meta
        ? { ...data.meta, pagesAnalysed: data.meta.pagesAnalysed || totalPages }
        : undefined;
      const normalizedData = normalizeTenderData(data.extractedData, file.name, meta, totalPages);

      const extractedClauses = [
        normalizedData.pecRequirement.clauseText
          ? {
              id: 'custom-clause-1',
              title: 'PEC Category & Specialization Requirements',
              text: normalizedData.pecRequirement.clauseText,
              category: 'pecLicensing' as const,
              confidence: normalizedData.pecRequirement.confidenceScore,
            }
          : null,
        normalizedData.financialCriteria.clauseText
          ? {
              id: 'custom-clause-2',
              title: 'Financial Turnover & CDR Bid Security',
              text: normalizedData.financialCriteria.clauseText,
              category: 'financials' as const,
              confidence: normalizedData.financialCriteria.confidenceScore,
            }
          : null,
      ].filter(Boolean) as any[];

      const customTenderDoc: SampleTenderDoc = {
        id: `custom-${Date.now()}`,
        title: normalizedData.basicInfo.tenderTitle,
        agency: normalizedData.basicInfo.procuringAgency,
        biddingType: normalizedData.basicInfo.biddingType,
        ppraRef: normalizedData.basicInfo.tenderId,
        deadline: normalizedData.basicInfo.submissionDeadline,
        estimatedCost: normalizedData.basicInfo.estimatedCostPKR
          ? formatPKR(normalizedData.basicInfo.estimatedCostPKR)
          : 'Not stated on pages analysed',
        pages: [
          {
            pageNumber: 1,
            title: `${file.name} - Page 1`,
            imageUrl: firstPagePreview,
            extractedClauses,
          },
        ],
        extractedData: normalizedData,
        defaultBidderProfile: currentBidder,
      };

      setCurrentTender(customTenderDoc);

      const modeText =
        meta?.inputMode === 'pdf'
          ? `full ${totalPages}-page document`
          : meta?.inputMode === 'images'
          ? `${meta.pagesAnalysed} rendered page image(s) of ${totalPages}`
          : 'single page image';
      setAnalysisNotice({
        message: `Analysed ${modeText}${meta ? ` via ${meta.provider} (${meta.model})` : ''}.`,
        notStated: normalizedData.notStatedFields || [],
      });

      try {
        if (user) {
          await saveTenderToCompany(user.uid, currentCompanyId || 'default', {
            tenderTitle: normalizedData.basicInfo.tenderTitle,
            procuringAgency: normalizedData.basicInfo.procuringAgency,
            tenderId: normalizedData.basicInfo.tenderId,
            estimatedCostPKR: normalizedData.basicInfo.estimatedCostPKR ?? null,
            submissionDeadline: normalizedData.basicInfo.submissionDeadline,
            fileName: file.name,
            // Persist the full extraction (small JSON) so this tender can be
            // reopened later from the history dropdown and re-audited.
            extractedData: normalizedData,
          });
          const updatedTenders = await getTendersByCompany(user.uid, currentCompanyId || 'default');
          setSavedTenders(updatedTenders);
        }
      } catch (saveErr) {
        console.warn('Could not save tender to Firestore:', saveErr);
      }

      setCurrentPage(1);
    } catch (err: any) {
      // Deliberate: no tender is created on failure — the user sees the
      // error instead of fabricated compliance data.
      console.error('File upload processing error:', err);
      setAnalysisError(
        err?.name === 'AbortError'
          ? 'The analysis timed out. Please retry — no placeholder data was generated.'
          : err?.message || 'The document could not be analysed. No placeholder data was generated.'
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage('');
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-gray-950 overflow-hidden font-sans selection:bg-[#00401A] selection:text-white">
      {/* Header Bar */}
      <Header
        currentTender={currentTender}
        isTenderLoaded={currentTender !== null}
        onSelectTender={handleSelectTender}
        currentBidder={currentBidder}
        onSelectBidder={handleSelectBidder}
        clientSwitcher={
          <ClientSwitcher
            companies={companies}
            currentCompanyId={currentCompanyId}
            onSelectCompany={handleSelectCompany}
            onCreateCompany={handleCreateCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        }
        onOpenBidderModal={() => setIsBidderModalOpen(true)}
        onOpenOpenCvModal={() => setIsOpenCvModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenAffidavitModal={() => setIsAffidavitModalOpen(true)}
        onOpenCdrModal={() => setIsCdrModalOpen(true)}
        onOpenEnvelopeModal={() => setIsEnvelopeModalOpen(true)}
        onOpenJvModal={() => setIsJvModalOpen(true)}
        onCustomFileUpload={handleCustomFileUpload}
        isAnalyzing={isAnalyzing}
        auditReport={auditReport}
        savedTenders={savedTenders}
        onOpenSavedTender={handleOpenSavedTender}
        onDraftProposal={() => setIsProposalModalOpen(true)}
        language={language}
        onToggleLanguage={() => setLanguage(prev => prev === 'en' ? 'ur' : 'en')}
        onLogout={async () => {
          await logout();
          router.push('/login');
        }}
      />

      {/* Main Split-Screen High Density Dashboard Layout */}
      <main className="flex flex-col flex-1 overflow-auto min-h-0 p-3 sm:p-4 w-full max-w-[1920px] mx-auto">
        {!currentTender ? (
          <div className="flex-1 flex flex-col items-center justify-center my-auto w-full min-h-[500px] py-8">
            {(() => {
              const profileReady = !!currentBidder.companyName;
              return (
                <div className="w-full max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                      {profileReady ? `Welcome back, ${currentBidder.companyName}` : 'Welcome to Karez 2.0'}
                    </h2>
                    <p className="text-gray-400 text-sm max-w-xl mx-auto leading-relaxed">
                      {profileReady
                        ? 'Choose what you want to do next — load a sample tender, upload your own, or update your company profile.'
                        : 'Start by setting up your company profile, then load a sample tender or upload your own to run a PPRA compliance audit.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Step 1 — Company profile */}
                    <button
                      onClick={() => setIsBidderModalOpen(true)}
                      className={`text-left bg-gray-900 border rounded-2xl p-5 transition-all hover:scale-[1.02] cursor-pointer ${
                        profileReady ? 'border-gray-800 hover:border-emerald-700/60' : 'border-emerald-600/70 ring-1 ring-emerald-600/30'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center mb-3">
                        <Building2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Step 1</span>
                        {profileReady && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <h3 className="text-white font-bold text-sm mb-1">
                        {profileReady ? 'Edit company profile' : 'Set up your company profile'}
                      </h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        {profileReady
                          ? `${currentBidder.companyName} — update PEC category, turnover, CDR, affidavits.`
                          : 'Enter your firm’s PEC category, turnover, CDR and affidavits. Nothing is assumed on your behalf.'}
                      </p>
                    </button>

                    {/* Step 2 — Load a sample */}
                    <button
                      onClick={() => handleSelectTender(SAMPLE_TENDERS[0])}
                      className="text-left bg-gray-900 border border-gray-800 hover:border-emerald-700/60 rounded-2xl p-5 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center mb-3">
                        <FileText className="w-6 h-6 text-emerald-400" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">Step 2 · Try it</span>
                      <h3 className="text-white font-bold text-sm mb-1">Load a sample tender</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Open the annotated NHA E-35 highway tender. Pick others from &quot;Load Sample&quot; in the header.
                      </p>
                    </button>

                    {/* Step 2 alt — Upload your own */}
                    <label className="text-left bg-gray-900 border border-gray-800 hover:border-emerald-700/60 rounded-2xl p-5 transition-all hover:scale-[1.02] cursor-pointer block">
                      <div className="w-11 h-11 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center mb-3">
                        <UploadCloud className="w-6 h-6 text-emerald-400" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">Step 2 · Real bid</span>
                      <h3 className="text-white font-bold text-sm mb-1">Upload your tender</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Any NHA, LDA, C&amp;W or PPRA tender PDF or scan (up to 20MB). Every page is analysed.
                      </p>
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => {
                          handleCustomFileUpload(e);
                          e.target.value = '';
                        }}
                        className="hidden"
                        disabled={isAnalyzing}
                      />
                    </label>
                  </div>

                  {!profileReady && (
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-300/80">
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Recommended: set up your company profile first so audits compare against your real credentials.</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">
            {/* Left Panel: Source PDF Document Viewer */}
            <section className="w-full lg:w-1/2 flex flex-col overflow-hidden">
              <PdfDocumentViewer
                tender={currentTender}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                highlightedClauseId={highlightedClauseId}
                lowConfidencePages={currentTender?.extractedData?.lowConfidencePages || currentTender?.lowConfidencePages || []}
              />
            </section>

            {/* Right Panel: Interactive Compliance Checklist & Risk Engine */}
            <section className="w-full lg:w-1/2 flex flex-col overflow-hidden">
              <ComplianceChecklist
                auditReport={auditReport}
                onJumpToPage={handleJumpToPage}
                onToggleHumanApproval={handleToggleHumanApproval}
                onUpdateNotes={handleUpdateNotes}
                onOpenAffidavitModal={() => setIsAffidavitModalOpen(true)}
                onOpenCdrModal={() => setIsCdrModalOpen(true)}
                onOpenEnvelopeModal={() => setIsEnvelopeModalOpen(true)}
                onOpenJvModal={() => setIsJvModalOpen(true)}
              />
            </section>
          </div>
        )}
      </main>

      {/* Analysis Status Floating Toast Banner */}
      {isAnalyzing && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#002D12] text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-pulse">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">PPRA Tender Analysis Engine</div>
            <div className="text-xs text-emerald-100 font-medium">{analysisStage || 'Analyzing document scan...'}</div>
          </div>
        </div>
      )}

      {/* Loading Workspace Top Banner */}
      {isLoadingData && !isAnalyzing && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-[#002D12]/95 border-b border-emerald-600/50 py-1.5 px-4 flex items-center justify-center gap-2 text-white shadow-md">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          <span className="text-xs font-medium text-white tracking-wide">Loading your workspace...</span>
        </div>
      )}

      {/* Analysis Error Banner — extraction failed, NO tender was created */}
      {analysisError && !isAnalyzing && (
        <div
          className={`fixed left-0 right-0 z-40 bg-red-950/95 border-b border-red-600/60 py-2 px-4 flex items-center justify-between gap-2 text-red-100 shadow-md ${
            isLoadingData ? 'top-8' : 'top-0'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mx-auto">
            <TriangleAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs text-red-100 font-medium">
              Analysis failed: {analysisError}
            </span>
          </div>
          <button
            onClick={() => setAnalysisError(null)}
            className="p-0.5 hover:bg-red-800/60 rounded text-red-300 hover:text-red-100 transition-colors shrink-0"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Extraction Notice Banner — what was analysed + criteria NOT stated */}
      {analysisNotice && !analysisError && !isAnalyzing && (
        <div
          className={`fixed left-0 right-0 z-39 bg-amber-900/95 border-b border-amber-600/50 py-1.5 px-4 flex items-center justify-between gap-2 text-amber-100 shadow-md ${
            isLoadingData ? 'top-8' : 'top-0'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mx-auto text-center">
            <TriangleAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs text-amber-100">
              {analysisNotice.message}
              {analysisNotice.notStated.length > 0 && (
                <>
                  {' '}Not stated on the pages analysed (flagged for human review):{' '}
                  <strong>{analysisNotice.notStated.join(', ')}</strong>.
                </>
              )}
            </span>
          </div>
          <button
            onClick={() => setAnalysisNotice(null)}
            className="p-0.5 hover:bg-amber-800/60 rounded text-amber-300 hover:text-amber-100 transition-colors shrink-0"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modals */}
      <BidderProfileModal
        isOpen={isBidderModalOpen}
        onClose={() => setIsBidderModalOpen(false)}
        bidder={currentBidder}
        onSave={async (updatedProfile) => {
          setCurrentBidder(updatedProfile);
          try {
            if (user) {
              if (currentCompanyId) {
                await updateCompany(currentCompanyId, user.uid, updatedProfile);
              } else {
                // First save for a new user (or a new client): create the
                // company document now, from exactly what they entered.
                const newCompanyId = await createCompany(user.uid, updatedProfile);
                setCurrentCompanyId(newCompanyId);
              }
              const freshCompanies = await getCompaniesByUser(user.uid);
              setCompanies(freshCompanies);
            }
          } catch (err) {
            console.warn('Could not save company profile:', err);
          }
        }}
      />

      <ScannedPreprocessingDemo
        isOpen={isOpenCvModalOpen}
        onClose={() => setIsOpenCvModalOpen(false)}
      />

      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        auditReport={auditReport}
        tender={currentTender}
        bidder={currentBidder}
      />

      {/* Contractor & Bidding Specialist Tool Modals */}
      <AffidavitGeneratorModal
        isOpen={isAffidavitModalOpen}
        onClose={() => setIsAffidavitModalOpen(false)}
        tender={currentTender}
        bidder={currentBidder}
      />

      <BidSecurityCalculatorModal
        isOpen={isCdrModalOpen}
        onClose={() => setIsCdrModalOpen(false)}
        tender={currentTender}
      />

      <EnvelopePackingChecklistModal
        isOpen={isEnvelopeModalOpen}
        onClose={() => setIsEnvelopeModalOpen(false)}
        tender={currentTender}
        bidder={currentBidder}
      />

      <JvCalculatorModal
        isOpen={isJvModalOpen}
        onClose={() => setIsJvModalOpen(false)}
        tender={currentTender}
      />

      <ProposalDraftModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        tenderData={currentTender?.extractedData}
        bidderProfile={currentBidder}
        auditReport={auditReport}
        language={language}
      />
    </div>
  );
}
