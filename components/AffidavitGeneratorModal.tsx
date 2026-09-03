'use client';

import React, { useState } from 'react';
import {
  FileSignature,
  X,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  Building,
  FileText,
  AlertCircle,
  Award,
} from 'lucide-react';
import { SampleTenderDoc, BidderProfile } from '../lib/types';

interface AffidavitGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tender: SampleTenderDoc | any | null;
  bidder: BidderProfile;
}

type AffidavitType = 'non_blacklisting' | 'correctness' | 'no_litigation' | 'power_of_attorney' | 'integrity_pact';

export function AffidavitGeneratorModal({
  isOpen,
  onClose,
  tender,
  bidder,
}: AffidavitGeneratorModalProps) {
  const [selectedType, setSelectedType] = useState<AffidavitType>('non_blacklisting');
  const [stampPaperDenomination, setStampPaperDenomination] = useState<number>(500);
  const [copied, setCopied] = useState<boolean>(false);

  // Editable fields for contractor customization
  const [firmName, setFirmName] = useState<string>(bidder?.companyName || 'M/s Contractor');
  const [pecNo, setPecNo] = useState<string>(bidder?.pecLicenseNo || 'PEC-CIVIL-19482');
  const [ntnNo, setNtnNo] = useState<string>(bidder?.ntnNo || '4029184-7');
  const [address, setAddress] = useState<string>('Plot # 45, Sector I-9/2, Industrial Area, Islamabad, Pakistan');
  const [signatoryName, setSignatoryName] = useState<string>('Engr. Muhammad Tariq Khan');
  const [signatoryDesignation, setSignatoryDesignation] = useState<string>('Chief Executive Officer / Managing Director');
  const [cnicNo, setCnicNo] = useState<string>('37405-1829304-1');

  if (!isOpen) return null;

  const ppraRef = tender?.ppraRef || tender?.extractedData?.basicInfo?.ppraReferenceNo || 'N/A';
  const tenderTitle = tender?.title || tender?.extractedData?.basicInfo?.tenderTitle || 'Tender Project';
  const procuringAgency = tender?.agency || tender?.extractedData?.basicInfo?.procuringAgency || 'Procuring Agency';

  const todayStr = new Date().toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const generateAffidavitText = (): string => {
    switch (selectedType) {
      case 'non_blacklisting':
        return `AFFIDAVIT OF NON-BLACKLISTING & INTEGRITY DECLARED
(On Judicial Stamp Paper of Rs. ${stampPaperDenomination}/- Duly Attested by Oath Commissioner / Notary Public)

BEFORE THE EVALUATION COMMITTEE / PROCURING AGENCY
Reference Tender: ${ppraRef} - ${tenderTitle}
Procuring Agency: ${procuringAgency}

I, ${signatoryName}, CNIC No. ${cnicNo}, in my capacity as ${signatoryDesignation} of M/s ${firmName}, having registered office at ${address}, holding valid PEC License No. ${pecNo} and FBR NTN No. ${ntnNo}, do hereby solemnly affirm, declare and state on oath as under:

1. That M/s ${firmName} has never been blacklisted, debarred, suspended, or declared ineligible by the Federal Government of Pakistan, any Provincial Government (KPPRA, SPPRA, BPPRA, Punjab PPRA), Autonomous Body, NHA, LDA, C&W, WAPDA, or any International Financial Institution (World Bank, ADB).

2. That our firm has not failed to perform on any contract in the last five (05) years, nor has any contract awarded to our firm been terminated due to default or breach of contractual obligations under PPRA Rules 2004.

3. That there are no ongoing corruption investigations, NAB inquiries, or court stay orders operating against the firm, its directors, or partners in any Court of Law within Pakistan.

4. That all statements, documents, certificates, and technical bid submissions annexed with our bid for Tender Reference "${ppraRef}" are true, authentic, and genuine to the best of my knowledge and belief.

5. That if any document or statement submitted by our firm is found to be forged, false, or fabricated at any stage during bid evaluation or contract execution, the Procuring Agency (${procuringAgency}) shall have full right to forfeit our Call Deposit Receipt (CDR / Earnest Money) and initiate blacklisting proceedings under PPRA Rule 19.

DEPONENT:
__________________________________
Signature: ${signatoryName}
Designation: ${signatoryDesignation}
M/s ${firmName}
PEC Registration: ${pecNo}

VERIFICATION:
Verified on Oath at Islamabad/Lahore this ${todayStr} that the contents of paragraphs 1 to 5 above are true and correct to the best of my knowledge and belief and nothing has been concealed therefrom.

DEPONENT: ______________________
ATTESTED BY OATH COMMISSIONER: [SEAL & STAMP]`;

      case 'correctness':
        return `AFFIDAVIT OF CORRECTNESS OF TECHNICAL & FINANCIAL DOCUMENTS
(On Judicial Stamp Paper of Rs. ${stampPaperDenomination}/- Duly Attested by Oath Commissioner)

IN THE MATTER OF:
Tender Reference: ${ppraRef}
Name of Work: ${tenderTitle}
Procuring Authority: ${procuringAgency}

I, ${signatoryName}, CNIC No. ${cnicNo}, ${signatoryDesignation} of M/s ${firmName}, do hereby state on solemn affirmation as under:

1. I am the authorized representative of M/s ${firmName} and competent to execute this affidavit on behalf of the firm.

2. All financial statements, 3-year turnover certificates issued by Chartered Accountants, bank statements, client performance certificates, and PEC registration renewal certificates submitted in Envelope A (Technical Proposal) are authentic copies of original records.

3. The 3-year average annual construction turnover of PKR ${bidder?.avgAnnualTurnoverPKR ? (bidder.avgAnnualTurnoverPKR / 1000000).toFixed(1) : '350'} Million presented in our financial qualification dossier represents actual audited revenues reported to FBR.

4. We explicitly authorize ${procuringAgency} or its technical evaluation team to verify any certificate, bank statement, or client reference directly with the issuing authorities without prior notice.

DEPONENT:
__________________________________
${signatoryName} (${signatoryDesignation})
M/s ${firmName}
Date: ${todayStr}`;

      case 'no_litigation':
        return `UNDERTAKING OF NO PENDING LITIGATION & CLEAN TRACK RECORD
(On Judicial Stamp Paper of Rs. ${stampPaperDenomination}/- Duly Notarized)

Tender Notice: ${tenderTitle} (PPRA Ref: ${ppraRef})
Procuring Department: ${procuringAgency}

We, M/s ${firmName}, PEC License No. ${pecNo}, hereby declare that:

1. Our firm is not currently involved in any active litigation, arbitration, or dispute with ${procuringAgency} or any government procurement entity in Pakistan that would impair our capacity to execute this project.

2. No liquidating damages or penalties have been levied against our firm for delay in project execution during the past three (03) fiscal years.

3. Our active project portfolio and machinery commitments allow full mobilization within fifteen (15) days of receiving the Letter of Acceptance (LOA).

DEPONENT:
__________________________________
Authorized Signatory: ${signatoryName}
M/s ${firmName}
Date: ${todayStr}`;

      case 'power_of_attorney':
        return `SPECIAL POWER OF ATTORNEY FOR BIDDING & CONTRACT EXECUTION
(On Judicial Stamp Paper of Rs. 1,000/- Duly Registered / Attested)

KNOW ALL MEN BY THESE PRESENTS that we, the Partners / Board of Directors of M/s ${firmName}, having registered office at ${address}, do hereby nominate, appoint and constitute:

Mr. ${signatoryName}, CNIC No. ${cnicNo}, as our true and lawful Attorney for us and in our name and on our behalf to do all or any of the following acts, deeds, matters and things in connection with Tender Ref: "${tender.ppraRef}":

1. To sign, seal, submit and deliver the Technical and Financial Bids to ${tender.agency}.
2. To represent the firm in all pre-bid meetings, clarification sessions, and financial bid openings.
3. To negotiate, finalize and sign the Contract Agreement, Performance Guarantee, and mobilization advances.

IN WITNESS WHEREOF, we have executed this Power of Attorney on this ${todayStr}.

EXECUTANT(S):
1. Partner/Director: ______________________
2. Partner/Director: ______________________

ATTORNEY ACCEPTANCE:
I accept: ______________________
(${signatoryName}, CNIC: ${cnicNo})

WITNESSES:
1. Name & CNIC: __________________________
2. Name & CNIC: __________________________`;

      case 'integrity_pact':
        return `DECLARATION OF FEES, COMMISSIONS AND BROKERAGE (INTEGRITY PACT)
(As per PPRA Rule 19 for Tenders Exceeding PKR 10 Million)

Contract Value / Estimated Cost: ${tender.estimatedCost}
Tender Title: ${tender.title}
Procuring Agency: ${tender.agency}

M/s ${firmName} hereby declares that it has not obtained or induced the procurement of any contract, right, interest, privilege or other obligation or benefit from Government of Pakistan or any administrative subdivision or agency thereof through any corrupt business practice.

Without limiting the generality of the foregoing, M/s ${firmName} represents and warrants that it has fully declared the brokerage, commission, fees etc. paid or payable to anyone and not given or agreed to give and shall not give or agree to give to anyone within or outside Pakistan either directly or indirectly through any natural or juridical person, including its affiliate, agent, associate, broker, consultant, director, promoter, shareholder, sponsor or subsidiary, any commission, gratification, bribe, finder's fee or kickback.

M/s ${firmName} certifies that it has made and will make full disclosure of all agreements and arrangements with all persons in respect of or related to the transaction with ${tender.agency}.

FOR M/S ${firmName}:
__________________________________
Name: ${signatoryName}
Title: ${signatoryDesignation}
PEC No: ${pecNo}`;

      default:
        return '';
    }
  };

  const handleCopy = () => {
    const text = generateAffidavitText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintDraft = () => {
    const text = generateAffidavitText();
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Affidavit Draft - ${selectedType.toUpperCase()} - M/s ${firmName}</title>
  <style>
    body { font-family: 'Courier New', Courier, monospace; font-size: 11pt; line-height: 1.6; padding: 40px; margin: 0; }
    .stamp-space { height: 180px; border: 2px dashed #94a3b8; text-align: center; color: #94a3b8; font-weight: bold; margin-bottom: 30px; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
    pre { white-space: pre-wrap; font-family: inherit; }
    @media print { .stamp-space { border: 1px solid #ccc; } }
  </style>
</head>
<body>
  <div class="stamp-space">
    [ SPACE FOR JUDICIAL STAMP PAPER DENOMINATION RS. ${stampPaperDenomination}/- & OATH COMMISSIONER EMBOSSED SEAL ]
  </div>
  <pre>${text}</pre>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
      printWin.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#00401A] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#002D12]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-emerald-300">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 font-mono bg-[#002D12] px-2 py-0.5 rounded border border-emerald-700/50">
                  Contractor Legal Toolkit
                </span>
                <span className="text-xs text-emerald-200 font-medium">PPRA Compliant</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Judicial Stamp Paper Affidavit & Undertaking Drafter
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split view (Customizer Left, Live Legal Draft Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Template Selection & Contractor Details */}
          <div className="lg:col-span-5 space-y-4">
            {/* Template Chooser */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Required Legal Affidavit Template:
              </label>
              <div className="space-y-1.5">
                {[
                  {
                    id: 'non_blacklisting',
                    title: 'Non-Blacklisting & Integrity Affidavit',
                    desc: 'Mandatory Rs. 500 Stamp Paper under PPRA Rule 19',
                    denom: 500,
                  },
                  {
                    id: 'correctness',
                    title: 'Correctness of Technical Records',
                    desc: 'Attests FBR turnover & PEC certificate validity',
                    denom: 500,
                  },
                  {
                    id: 'no_litigation',
                    title: 'No Pending Litigation Undertaking',
                    desc: 'Clean track record declaration against government',
                    denom: 500,
                  },
                  {
                    id: 'power_of_attorney',
                    title: 'Special Power of Attorney (Bidding)',
                    desc: 'Authorizes CEO/Director to sign & submit bid',
                    denom: 1000,
                  },
                  {
                    id: 'integrity_pact',
                    title: 'Integrity Pact Declaration',
                    desc: 'Required for projects > PKR 10M under PPRA',
                    denom: 100,
                  },
                ].map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedType(tmpl.id as AffidavitType);
                      setStampPaperDenomination(tmpl.denom);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                      selectedType === tmpl.id
                        ? 'bg-[#E6F2EB] border-[#00401A] text-[#00401A] shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>{tmpl.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{tmpl.desc}</div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white rounded border border-slate-300 text-slate-700 shrink-0">
                      Rs. {tmpl.denom}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contractor Firm Customizer Form */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <Building className="w-4 h-4 text-[#00401A]" />
                <span>Contractor Firm & Signatory Details</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Company / Firm Name</label>
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">PEC Reg. No.</label>
                  <input
                    type="text"
                    value={pecNo}
                    onChange={(e) => setPecNo(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">FBR NTN No.</label>
                  <input
                    type="text"
                    value={ntnNo}
                    onChange={(e) => setNtnNo(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Signatory Name</label>
                  <input
                    type="text"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">CNIC Number</label>
                  <input
                    type="text"
                    value={cnicNo}
                    onChange={(e) => setCnicNo(e.target.value)}
                    className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Stamp Denomination (PKR)</label>
                <select
                  value={stampPaperDenomination}
                  onChange={(e) => setStampPaperDenomination(Number(e.target.value))}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00401A]"
                >
                  <option value={100}>Rs. 100 Stamp Paper</option>
                  <option value={500}>Rs. 500 Stamp Paper (Standard PPRA)</option>
                  <option value={1000}>Rs. 1,000 Stamp Paper (High Value)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Live Printable Affidavit Preview */}
          <div className="lg:col-span-7 flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Judicial Draft Preview (Judicial Paper Format)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
                <button
                  onClick={handlePrintDraft}
                  className="bg-[#00401A] hover:bg-[#002D12] text-emerald-200 border border-emerald-600 text-xs px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Print Draft</span>
                </button>
              </div>
            </div>

            {/* Stamp Paper Top Space Callout */}
            <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-2 flex items-center gap-2 text-[11px] text-amber-300 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Note: Print directly onto Judicial Stamp Paper (Rs. {stampPaperDenomination}/-). Leave 3-4 inches space at top for vendor header & Oath Commissioner stamp.
              </span>
            </div>

            {/* Scrollable Document Text */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto text-slate-200 font-mono text-xs leading-relaxed selection:bg-emerald-800 selection:text-white">
              <pre className="whitespace-pre-wrap font-mono">{generateAffidavitText()}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Award className="w-4 h-4 text-[#00401A]" />
            <span>Format strictly adheres to Pakistani PPRA Rules 2004 & PEC Standard Procurement Documents.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
