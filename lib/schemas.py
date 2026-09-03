"""
Karez 2.0 - Step 1: Core Pydantic Schemas for Pakistani Procurement Tender Extraction
Compliant with PPRA Rules 2004
"""

from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class PECCategoryEnum(str, Enum):
    C_A = "C-A"
    C_B = "C-B"
    C_1 = "C-1"
    C_2 = "C-2"
    C_3 = "C-3"
    C_4 = "C-4"
    C_5 = "C-5"
    C_6 = "C-6"


class ProcuringAgencyEnum(str, Enum):
    NHA = "NHA (National Highway Authority)"
    LDA = "LDA (Lahore Development Authority)"
    CW = "C&W (Communication & Works Dept)"
    WAPDA = "WAPDA (Water & Power Development Authority)"
    PHE = "PHE (Public Health Engineering)"
    PAK_PWD = "Pak PWD (Pakistan Public Works Department)"


class BiddingTypeEnum(str, Enum):
    SINGLE_STAGE_ONE_ENVELOPE = "Single Stage - One Envelope (PPRA Rule 36-a)"
    SINGLE_STAGE_TWO_ENVELOPE = "Single Stage - Two Envelope (PPRA Rule 36-b)"
    TWO_STAGE_TWO_ENVELOPE = "Two Stage - Two Envelope (PPRA Rule 36-d)"


class TenderBasicInfoModel(BaseModel):
    tender_id: str = Field(..., description="Unique Tender Notice ID / PPRA Reference Number")
    tender_title: str = Field(..., description="Official title of the construction or procurement work")
    procuring_agency: str = Field(..., description="Procuring agency e.g. NHA, LDA, C&W, WAPDA")
    bidding_procedure: str = Field(..., description="PPRA Bidding procedure e.g., Single Stage Two Envelope")
    bid_submission_deadline: str = Field(..., description="Submission date and time cutoff")
    estimated_cost_pkr: Optional[float] = Field(None, description="Estimated work cost in PKR")
    location: str = Field(..., description="Work site location / district in Pakistan")
    source_page: int = Field(1, description="Source page number where tender info was extracted")


class PECRequirementModel(BaseModel):
    required_category: str = Field(..., description="Required PEC License Category e.g., C-A, C-1, C-2")
    specialization_codes: List[str] = Field(default_factory=list, description="Required PEC Specialization codes e.g. CE01, CE02, CE09")
    validity_requirement: str = Field(..., description="PEC renewal and active status requirement for current fiscal year")
    source_page: int = Field(..., description="Source page number")
    clause_text: str = Field(..., description="Verbatim clause text from tender document")
    confidence_score: float = Field(..., description="OCR / Extraction confidence score (0 to 100)")


class FinancialCriteriaModel(BaseModel):
    min_avg_annual_turnover_pkr: float = Field(..., description="Minimum Average Annual Turnover required in last 3 years in PKR")
    min_net_worth_pkr: float = Field(0.0, description="Minimum Net Worth requirement in PKR")
    min_liquid_assets_working_capital_pkr: float = Field(0.0, description="Minimum Liquid Assets / Working Capital requirement in PKR")
    cdr_amount_pkr: float = Field(..., description="Earnest Money / Call Deposit Receipt (CDR) amount in PKR")
    cdr_percentage: Optional[float] = Field(None, description="Percentage of bid price required for CDR if specified")
    acceptable_bank_rating: str = Field(..., description="Required minimum bank rating e.g., A- or above by PACRA/VIS")
    source_page: int = Field(..., description="Source page number")
    clause_text: str = Field(..., description="Verbatim clause text")
    confidence_score: float = Field(..., description="Confidence score percentage")


class StampPaperAffidavitModel(BaseModel):
    id: str = Field(..., description="Affidavit ID")
    title: str = Field(..., description="Affidavit name e.g. Non-Blacklisting Affidavit")
    stamp_paper_denomination_pkr: int = Field(100, description="Required Stamp Paper denomination in PKR (100 or 500)")
    required_text_summary: str = Field(..., description="Specific legal wording summary required on stamp paper")
    is_blacklisting_declaration_required: bool = Field(True, description="True if non-blacklisting declaration is explicitly required")
    is_litigation_history_required: bool = Field(True, description="True if non-litigation declaration is required")
    source_page: int = Field(..., description="Source page number")
    confidence_score: float = Field(..., description="Extraction confidence score")


class JVRulesModel(BaseModel):
    allowed_jv: bool = Field(True, description="Whether Joint Venture (JV) is allowed")
    max_partners: int = Field(3, description="Maximum number of JV partners allowed")
    lead_partner_min_share_percent: float = Field(50.0, description="Minimum share percentage required for lead JV partner")
    other_partner_min_share_percent: float = Field(25.0, description="Minimum share percentage for non-lead JV partners")
    source_page: int = Field(..., description="Source page number")
    clause_text: str = Field(..., description="Verbatim JV clause text")
    confidence_score: float = Field(..., description="Confidence score")


class ExtractedTenderComplianceModel(BaseModel):
    basic_info: TenderBasicInfoModel
    pec_requirement: PECRequirementModel
    financial_criteria: FinancialCriteriaModel
    affidavits: List[StampPaperAffidavitModel]
    jv_rules: JVRulesModel
    overall_ocr_confidence: float = Field(..., description="Average OCR confidence across document")
    has_low_confidence_warnings: bool = Field(False, description="Flagged true if any figure has confidence < 85%")
    low_confidence_pages: List[int] = Field(default_factory=list, description="List of page numbers requiring manual audit")
