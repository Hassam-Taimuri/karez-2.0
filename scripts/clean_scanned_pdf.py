"""
Karez 2.0 - Step 2: Computer Vision Pre-Processor & Qwen-VL Prompt Engine
Processes raw, scanned, or crooked Pakistani procurement PDFs bound by PPRA Rules 2004.
"""

import sys
import json
import math
import numpy as np

# Try importing cv2 (OpenCV). If not present in environment, fall back gracefully to numpy/PIL representation.
try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False


def clean_scanned_pdf(page_image: np.ndarray) -> np.ndarray:
    """
    OpenCV Pre-Processing Pipeline for Pakistani Government Tender Scans:
    1. Deskews tilted/crooked document scans using minimum area bounding rectangle of contours.
    2. Removes blue official agency stamps and ink artifacts using HSV color filtering.
    3. Applies Gaussian Blur and Otsu's Adaptive Thresholding for crisp binarization.
    4. Applies unsharp mask kernel to sharpen faded Urdu/English procurement typography.
    
    :param page_image: Input BGR image numpy array
    :return: Cleaned, deskewed, high-contrast BGR image array
    """
    if not HAS_OPENCV or page_image is None or page_image.size == 0:
        return page_image

    try:
        # Step 1: Filter Blue Official Stamps & Ink Noise in HSV space
        hsv = cv2.cvtColor(page_image, cv2.COLOR_BGR2HSV)
        # Blue stamp color range in Pakistani government documents
        lower_blue = np.array([90, 50, 50])
        upper_blue = np.array([135, 255, 255])
        blue_mask = cv2.inRange(hsv, lower_blue, upper_blue)
        
        # Replace blue stamp pixels with clean white background (255, 255, 255)
        stamp_cleaned = page_image.copy()
        stamp_cleaned[blue_mask > 0] = [255, 255, 255]

        # Step 2: Convert to Grayscale
        gray = cv2.cvtColor(stamp_cleaned, cv2.COLOR_BGR2GRAY)

        # Step 3: Deskew Tilted Scan
        # Invert gray image for contour finding (text is white on black background)
        inverted = cv2.bitwise_not(gray)
        thresh = cv2.threshold(inverted, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
        
        # Find all foreground pixels to compute skew angle
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) > 100:
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            
            # Limit correction to realistic skew angles (-15 to 15 degrees)
            if abs(angle) > 0.2 and abs(angle) < 15.0:
                (h, w) = page_image.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                gray = cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

        # Step 4: Otsu Binarization & Adaptive Thresholding
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        binarized = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 8
        )

        # Step 5: Unsharp Mask Sharpening
        sharpen_kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]], dtype=np.float32)
        sharpened = cv2.filter2D(binarized, -1, sharpen_kernel)

        # Convert back to 3-channel BGR for model input compatibility
        cleaned_bgr = cv2.cvtColor(sharpened, cv2.COLOR_GRAY2BGR)
        return cleaned_bgr

    except Exception as e:
        print(f"[OpenCV Preprocessor Warning] Error cleaning image: {e}", file=sys.stderr)
        return page_image


def build_qwen_vl_prompt() -> str:
    """
    Constructs hyper-specific Vision-Prompt for Qwen-VL / Gemini Vision Engine
    instructing it to parse Pakistani procurement tender clauses and output strictly formatted JSON.
    """
    return """
You are "Karez 2.0", an expert Pakistani Procurement Compliance AI Engine specialized in PPRA Rules 2004 (Pakistan Procurement Regulatory Authority) and provincial PPRA rules (KPPRA, SPPRA, BPPRA, Punjab PPRA).

Analyze the attached cleaned page images of the Pakistani Government Tender Document (NHA / LDA / C&W / WAPDA / Pak PWD) and perform layout recognition, table parsing, and legal clause extraction.

### MANDATORY TERM MAPPING FOR PAKISTANI PROCUREMENT:
1. "PEC Category": Pakistan Engineering Council contractor licensing level (C-A, C-B, C-1, C-2, C-3, C-4, C-5, C-6).
2. "Specialization Codes": Technical specialization codes e.g., CE01 (Roads), CE02 (Bridges), CE09 (Irrigation/Dams), CE10 (Hydropower), BC01 (Buildings), ME01, EE04.
3. "CDR / Call Deposit Receipt / Earnest Money / Bid Security": Financial guarantee drawn on a scheduled bank in Pakistan. Extract exact PKR amount or bid percentage required.
4. "Stamp Paper": Judicial or non-judicial stamp paper affidavit (Rs. 100 or Rs. 500 denomination) certified by Oath Commissioner/Notary Public.
5. "NTN & ATL": FBR National Tax Number and Active Taxpayer List status required.
6. "Single Stage Two Envelope": Bidding procedure bound by PPRA Rule 36(b) where Technical Proposal and Financial Proposal are submitted separately.

### EXTRACTION INSTRUCTIONS:
- Read every clause, table, and fine print.
- Extract numbers into clean numeric values in Pakistani Rupees (PKR) (convert 'Million' or 'Billion' to full integer or float PKR, e.g., 'Rs. 2 Billion' -> 2000000000).
- Identify source page numbers for every extracted rule.
- Assign an OCR confidence score (0.0 to 100.0) based on text clarity and legibility. If text is faded, smudged, or crooked, score below 85.0.

### REQUIRED OUTPUT FORMAT:
Output strictly valid JSON matching this schema:
{
  "basic_info": {
    "tender_id": "STRING (e.g. NHA/P&CA/E35/2026/01)",
    "tender_title": "STRING",
    "procuring_agency": "STRING (NHA | LDA | C&W | WAPDA | Pak PWD)",
    "bidding_procedure": "STRING (Single Stage - Two Envelope (PPRA Rule 36-b))",
    "bid_submission_deadline": "STRING (e.g. 2026-09-15 11:30 AM)",
    "estimated_cost_pkr": NUMBER or null,
    "location": "STRING",
    "source_page": INT
  },
  "pec_requirement": {
    "required_category": "STRING (C-A | C-B | C-1 | C-2 | C-3 | C-4 | C-5 | C-6)",
    "specialization_codes": ["CE01", "CE02", "CE09", ...],
    "validity_requirement": "STRING",
    "source_page": INT,
    "clause_text": "STRING",
    "confidence_score": FLOAT
  },
  "financial_criteria": {
    "min_avg_annual_turnover_pkr": NUMBER,
    "min_net_worth_pkr": NUMBER,
    "min_liquid_assets_working_capital_pkr": NUMBER,
    "cdr_amount_pkr": NUMBER,
    "cdr_percentage": NUMBER or null,
    "acceptable_bank_rating": "STRING (e.g. A- or above by PACRA/VIS)",
    "source_page": INT,
    "clause_text": "STRING",
    "confidence_score": FLOAT
  },
  "affidavits": [
    {
      "id": "STRING",
      "title": "STRING (e.g. Affidavit of Non-Blacklisting & Non-Litigation)",
      "stamp_paper_denomination_pkr": NUMBER (100 or 500),
      "required_text_summary": "STRING",
      "is_blacklisting_declaration_required": BOOLEAN,
      "is_litigation_history_required": BOOLEAN,
      "source_page": INT,
      "confidence_score": FLOAT
    }
  ],
  "jv_rules": {
    "allowed_jv": BOOLEAN,
    "max_partners": INT,
    "lead_partner_min_share_percent": NUMBER,
    "other_partner_min_share_percent": NUMBER,
    "source_page": INT,
    "clause_text": "STRING",
    "confidence_score": FLOAT
  },
  "overall_ocr_confidence": FLOAT,
  "has_low_confidence_warnings": BOOLEAN,
  "low_confidence_pages": [INT, ...]
}
"""


if __name__ == "__main__":
    print("Karez 2.0 Pre-processor loaded successfully.")
    print("Qwen-VL Prompt Engine generated:")
    print(build_qwen_vl_prompt()[:300] + "...")
