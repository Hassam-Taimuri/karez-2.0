'use client';

import React, { useState } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';
import { SampleTenderDoc, TenderComplianceData } from '../lib/types';

interface PdfDocumentViewerProps {
  tender: SampleTenderDoc | any;
  currentPage: number;
  onPageChange: (page: number) => void;
  highlightedClauseId?: string;
  lowConfidencePages: number[];
}

export function PdfDocumentViewer({
  tender,
  currentPage,
  onPageChange,
  highlightedClauseId,
  lowConfidencePages,
}: PdfDocumentViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);

  if (!tender) return null;

  const pageObj =
    tender.pages?.find((p: any) => p.pageNumber === currentPage) || tender.pages?.[0];
  const isPageLowConfidence = lowConfidencePages.includes(currentPage);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 20, 180));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 20, 70));

  return (
    <div className="w-full bg-[#EBF2EE] border-r border-[#CDE0D2] flex flex-col h-full overflow-hidden rounded-xl shadow-sm">
      {/* Top Controls Toolbar Header (Govdash Theme) */}
      <div className="h-10 bg-[#F4F8F5] border-b border-[#CDE0D2] flex items-center justify-between px-3 sm:px-4 text-xs shrink-0">
        {/* Document Metadata & Status */}
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText className="w-3.5 h-3.5 text-[#00401A] shrink-0" />
          <span className="text-[11px] font-bold text-[#00401A] uppercase tracking-tight truncate">
            Source: {tender.extractedData?.documentFileName || tender.title}
          </span>
          <span className="text-[10px] bg-[#E6F2EB] text-[#00401A] border border-[#00401A]/20 px-1.5 py-0.2 rounded font-mono hidden md:inline-block font-semibold">
            {tender.ppraRef}
          </span>
        </div>

        {/* Page Nav & Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Overlay Toggle Button */}
          <button
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold flex items-center gap-1 transition-all ${
              showBoundingBoxes
                ? 'bg-[#00401A] text-white shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">Clause Overlays</span>
          </button>

          {/* Zoom Level */}
          <div className="flex items-center bg-white border border-[#CDE0D2] rounded-md px-1">
            <button
              onClick={handleZoomOut}
              className="p-0.5 text-slate-600 hover:text-[#00401A] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1 text-[10px] font-mono font-bold text-[#00401A]">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-0.5 text-slate-600 hover:text-[#00401A] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Page Switcher */}
          <div className="flex items-center bg-white border border-[#CDE0D2] rounded-md px-1.5 py-0.5">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="disabled:opacity-30 text-slate-600 hover:text-[#00401A] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-slate-800 px-1">
              <span className="text-[#00401A] font-extrabold">{currentPage}</span> / {tender.extractedData?.totalPages || tender.pages.length}
            </span>
            <button
              onClick={() =>
                onPageChange(Math.min(tender.extractedData?.totalPages || tender.pages.length, currentPage + 1))
              }
              disabled={currentPage === (tender.extractedData?.totalPages || tender.pages.length)}
              className="disabled:opacity-30 text-slate-600 hover:text-[#00401A] transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Step 5 Low-Confidence Safety Warning Banner */}
      {isPageLowConfidence && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between text-amber-900 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-medium text-[11px]">
              Manual Verification Required: Faded text on Page {currentPage} (Confidence: {tender.extractedData?.financialCriteria?.confidenceScore ?? 85}%).
            </span>
          </div>
          <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
            Low OCR
          </span>
        </div>
      )}

      {/* Page Canvas Container */}
      <div className="flex-1 p-4 sm:p-6 bg-slate-200 overflow-auto flex justify-center items-start relative">
        <div
          className="transition-all duration-200 relative shadow-lg rounded bg-white overflow-hidden border border-slate-400"
          style={{ width: `${zoomLevel}%`, maxWidth: '850px' }}
        >
          {/* Simulated Paper Document Page */}
          <div className="relative min-h-[680px] bg-white p-6 sm:p-8 text-slate-900 font-sans">
            {/* Official Header Block */}
            <div className="border-4 border-double border-slate-800 p-4 mb-5 text-center">
              <div className="font-serif text-lg sm:text-xl font-bold uppercase tracking-tight text-slate-900">
                {tender.agency}
              </div>
              <div className="text-[10px] uppercase font-bold italic text-slate-600 mt-0.5">
                (Government of Pakistan • PPRA Rule 36-b)
              </div>
              <div className="text-[11px] font-mono font-semibold text-slate-700 mt-1">
                Tender Ref: {tender.ppraRef} • Page {currentPage} of {tender.extractedData?.totalPages || tender.pages.length}
              </div>
            </div>

            {/* Document Body */}
            <div className="space-y-4 text-xs text-slate-800">
              {pageObj ? (
                <>
                  <div className="font-bold text-xs uppercase tracking-tight text-slate-900 border-b border-slate-300 pb-1">
                    {pageObj.title}
                  </div>

                  {pageObj.extractedClauses?.map((clause: any) => {
                    const isHighlighted = highlightedClauseId === clause.id;

                    return (
                      <div
                        key={clause.id}
                        className={`p-3 rounded border transition-all duration-200 relative ${
                          isHighlighted
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/50 shadow-sm'
                            : showBoundingBoxes
                            ? 'bg-red-50/70 border-dashed border-red-400'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {/* Overlay Badge Tag */}
                        {showBoundingBoxes && (
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded ${
                                isHighlighted
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-red-600 text-white'
                              }`}
                            >
                              DETECTED: {clause.title}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">
                              OCR: {clause.confidence}%
                            </span>
                          </div>
                        )}

                        <h4 className="font-bold text-slate-900 text-xs mb-1">
                          {clause.title}
                        </h4>
                        <p className="font-mono text-slate-800 text-[11px] leading-relaxed bg-white p-2 rounded border border-slate-200">
                          &quot;{clause.text}&quot;
                        </p>
                      </div>
                    );
                  })}

                  <div className="mt-6 border-t border-slate-200 pt-3 text-[10px] text-slate-500 space-y-1 font-mono">
                    <p>
                      <strong>Standard Procedure:</strong> Single Stage - Two Envelope Procedure under PPRA Rule 36(b).
                    </p>
                    <p>
                      <strong>Bid Security / CDR:</strong> Earnest money must be drawn in favor of {tender.agency}.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400 font-sans">
                  Page {currentPage} loaded.
                </div>
              )}
            </div>

            {/* Blue Stamp Watermark */}
            <div className="absolute top-4 right-4 border-2 border-blue-600 text-blue-600 font-bold text-[10px] px-2 py-1 rotate-12 opacity-40 bg-blue-50/20 pointer-events-none uppercase tracking-tight">
              BLUE STAMP FILTERED
            </div>
          </div>
        </div>
      </div>

      {/* Page Thumbnails Bar */}
      <div className="h-10 bg-slate-100 border-t border-slate-300 px-3 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
        <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider shrink-0 mr-1">
          Pages:
        </span>
        {tender.pages?.map((p: any) => {
          const isCurrent = p.pageNumber === currentPage;
          const isWarn = lowConfidencePages.includes(p.pageNumber);

          return (
            <button
              key={p.pageNumber}
              onClick={() => onPageChange(p.pageNumber)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all shrink-0 flex items-center gap-1 ${
                isCurrent
                  ? 'bg-slate-900 text-white shadow-xs'
                  : isWarn
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>P.{p.pageNumber}</span>
              {isWarn && <AlertTriangle className="w-3 h-3 text-amber-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
