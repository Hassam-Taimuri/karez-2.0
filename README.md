# Karez 2.0 — AI-Assisted Tender Compliance Checker for Pakistan

**Alibaba Cloud AI Hackathon Pakistan 2026 (Bano Qabil / Alkhidmat Foundation)**

Karez reads Pakistani government construction tenders (NHA, LDA, C&W, WAPDA, Pak PWD)
with a vision-capable LLM, extracts the eligibility thresholds, and checks them
against the bidder's own profile in a **deterministic TypeScript rules engine** —
before the bid is submitted, when defects can still be fixed.

> *Karez* (کاریز) — the traditional underground water channels of Balochistan:
> quiet infrastructure that carries something vital exactly where it is needed.

## The problem

35–40% of bids for Pakistani public construction tenders are **technically
disqualified for paperwork defects**, not price: wrong stamp-paper denomination,
expired PEC renewal, short CDR, missing non-blacklisting affidavit, PEC category
mismatch. Contractors lose eligibility on tenders worth billions of PKR over a
Rs. 100 stamp paper.

## What it does

1. **Reads the tender** — upload a scanned or digital PDF; every page is analysed
   (whole PDF ≤15 MB, or up to 12 rendered page images).
2. **Extracts eligibility criteria** — PEC category and specialization codes,
   3-year turnover, liquid assets, CDR/bid security, stamp-paper affidavits,
   NTN/ATL, JV rules — each with the page it came from.
3. **Audits deterministically** — a TypeScript rules engine (no LLM) compares
   criteria with the bidder profile and returns, per clause:
   `PASSED` / `FAILED - DISQUALIFICATION RISK` / `FLAGGED FOR HUMAN REVIEW`.
4. **Outputs working artifacts** — executive audit report (print to PDF),
   technical-proposal skeleton, affidavit text, CDR & JV calculators, and a
   two-envelope packing checklist (PPRA Rule 36(b)).

### Honesty rules (the core design decision)

- **If it's not on the page, we say NOT STATED.** Missing values are never
  replaced with "typical" defaults — they are flagged for human review.
- **Extraction failure is an error, not a template.** If the AI provider is
  down, the app shows a red error banner; it never fabricates tender data.
- **Plausibility guards.** A turnover above PKR 500 Billion or a CDR above
  PKR 50 Billion is flagged as a probable units error, not passed.
- **The proposal drafter cannot invent facts.** Unknown company details become
  `[INSERT: …]` placeholders; failed audit checks are disclosed in the draft.
- **The audit report is labelled** as an AI-assisted pre-submission audit for
  the bidder's internal use — with reviewer sign-off lines for the bidder's
  own team, not fake agency signatures.

## Stack

- Next.js 15 (app router) + React 19 + Tailwind 4 + TypeScript
- Firebase Auth (email/password + Google) + Firestore (per-user rules)
- AI provider layer (`lib/ai_provider.ts`): **Gemini** by default, **Alibaba
  Cloud Qwen (DashScope)** as an optional fallback via `DASHSCOPE_API_KEY`
- Client-side PDF page rendering via pdf.js (CDN, no npm dependency)
- OpenCV scan clean-up pipeline: `scripts/clean_scanned_pdf.py`

## Run locally

Prerequisites: Node.js 20+.

```bash
npm install
cp .env.example .env.local   # then set GEMINI_API_KEY
npm run dev
```

`firebase-applet-config.json` contains the public Firebase client identifiers
(safe to commit by design; access is enforced by `firestore.rules`).

## Demo

- **Load Sample** in the header loads three annotated tenders (NHA E-35
  highway, WAPDA Dasu hydropower, LDA flyover) with matching bidder profiles.
- `public/sample-pages/` holds synthetic "scanned" tender pages for demos.
  `nha_page7_cleaned.png` is genuine output of the OpenCV pipeline:

```bash
pip install opencv-python-headless numpy
python scripts/clean_scanned_pdf.py public/sample-pages/nha_page7.png cleaned.png
```

**Judges' demo login:** provided with the hackathon submission entry
(deliberately not committed to this public repository).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | yes | Gemini API key (default provider) |
| `GEMINI_MODELS` | no | Override Gemini model priority list |
| `PROVIDER_ORDER` | no | Default `gemini,qwen` |
| `DASHSCOPE_API_KEY` | no | Enables Alibaba Cloud Qwen fallback |
| `DASHSCOPE_BASE_URL` | no | DashScope OpenAI-compatible endpoint |
| `QWEN_VISION_MODELS` / `QWEN_TEXT_MODELS` | no | Qwen model lists |
| `MAX_PAGES_PER_ANALYSIS` | no | Page-image cap per analysis (default 12) |
| `NEXT_PUBLIC_PDFJS_BASE` | no | pdf.js CDN base URL |

## Roadmap

Provincial rule packs (KPPRA / SPPRA / BPPRA / Punjab PPRA), EPADS addenda
watcher, server-side OCR routing, encrypted past-bid repository, JV profile
consolidation.

## Disclaimer

Karez 2.0 is a pre-submission assistance tool for bidders. It is not affiliated
with, or endorsed by, PPRA or any procuring agency. Final responsibility for
bid compliance rests with the bidding team.
