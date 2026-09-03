'use client';

import React, { useState } from 'react';
import { Sparkles, X, Layers, Check, FileCode, Play, Cpu, Eye } from 'lucide-react';
import { build_qwen_vl_prompt } from '../lib/preprocessing_simulator';

interface ScannedPreprocessingDemoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScannedPreprocessingDemo({
  isOpen,
  onClose,
}: ScannedPreprocessingDemoProps) {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'qwenPrompt'>('pipeline');
  const [activePipelineStep, setActivePipelineStep] = useState<number>(1);

  if (!isOpen) return null;

  const pipelineSteps = [
    {
      step: 1,
      title: 'Raw Scanned PDF',
      desc: 'Crooked scan (+6.5° tilt), blue agency stamps, photocopy noise, faded Urdu/English typography',
      badge: 'Input Raw Image',
      bgColor: 'bg-slate-100 text-slate-800 border-rose-300',
      transform: 'rotate(6.5deg) scale(0.95)',
      filter: 'contrast(85%) blur(0.4px)',
      showStamp: true,
    },
    {
      step: 2,
      title: 'OpenCV Deskewing',
      desc: 'Calculates minimum area bounding rectangle of text contours and rotates by -6.5°',
      badge: 'Rotated -6.5°',
      bgColor: 'bg-white text-slate-900 border-sky-400',
      transform: 'rotate(0deg) scale(1.0)',
      filter: 'contrast(90%)',
      showStamp: true,
    },
    {
      step: 3,
      title: 'Blue Stamp HSV Filtering',
      desc: 'Removes official blue stamp pixels [HSV: 90-135] replacing with white canvas to clean text OCR path',
      badge: 'Stamp Filtered',
      bgColor: 'bg-white text-slate-900 border-indigo-400',
      transform: 'rotate(0deg) scale(1.0)',
      filter: 'contrast(95%)',
      showStamp: false,
    },
    {
      step: 4,
      title: 'Otsu Adaptive Binarization & Sharpening',
      desc: 'Gaussian blur + Adaptive local thresholding (15x15 block) + 3x3 unsharp mask sharpening',
      badge: 'High-Contrast B&W',
      bgColor: 'bg-white text-slate-950 border-emerald-500 font-mono',
      transform: 'rotate(0deg) scale(1.0)',
      filter: 'contrast(200%) grayscale(100%)',
      showStamp: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#CDE0D2] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#002D12] flex items-center justify-between bg-[#00401A] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <span>Step 2: Computer Vision & Qwen-VL Prompt Engine</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-mono font-bold">
                  Python OpenCV + Vision-LLM
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80">
                Deskewing, binarization, blue stamp removal & Pakistani procurement term mapping
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-[#F4F8F5] border-b border-[#CDE0D2] px-4 py-2 flex items-center gap-3 text-xs">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-lg font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-[#00401A] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#00401A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>OpenCV Visual Pipeline (`clean_scanned_pdf`)</span>
          </button>

          <button
            onClick={() => setActiveTab('qwenPrompt')}
            className={`px-3 py-1.5 rounded-lg font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'qwenPrompt'
                ? 'bg-[#00401A] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#00401A]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Qwen-VL Hyper-Specific Vision Prompt</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#F8FAF8] text-xs">
          {activeTab === 'pipeline' ? (
            <div className="space-y-6">
              {/* Step Navigation Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {pipelineSteps.map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setActivePipelineStep(s.step)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activePipelineStep === s.step
                        ? 'bg-[#E6F2EB] border-[#00401A] text-[#00401A] font-extrabold ring-2 ring-[#00401A]/20'
                        : 'bg-white border-[#CDE0D2] text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] font-mono block text-[#00401A] mb-1 font-bold">
                      STAGE 0{s.step}
                    </span>
                    <div className="font-bold text-xs truncate">
                      {s.title}
                    </div>
                  </button>
                ))}
              </div>

              {/* Interactive Visual Comparison Stage */}
              {(() => {
                const stepObj = pipelineSteps.find((s) => s.step === activePipelineStep)!;

                return (
                  <div className="bg-white border border-[#CDE0D2] rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#00401A] uppercase font-extrabold">
                          Step {stepObj.step}: {stepObj.badge}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                          {stepObj.title}
                        </h4>
                        <p className="text-slate-600 text-xs">{stepObj.desc}</p>
                      </div>

                      <div className="text-right font-mono text-[10px] text-slate-500">
                        OpenCV Python execution: 14.2 ms
                      </div>
                    </div>

                    {/* Simulated Document Canvas Frame */}
                    <div className="bg-[#EBF2EE] p-8 rounded-xl border border-[#CDE0D2] flex items-center justify-center min-h-[360px] relative overflow-hidden">
                      <div
                        className={`w-full max-w-lg p-6 rounded-lg border shadow-2xl transition-all duration-500 relative ${stepObj.bgColor}`}
                        style={{
                          transform: stepObj.transform,
                          filter: stepObj.filter,
                        }}
                      >
                        {/* Stamp overlay if active */}
                        {stepObj.showStamp && (
                          <div className="absolute top-4 right-4 w-20 h-20 border-4 border-blue-600/70 rounded-full flex flex-col items-center justify-center text-[8px] font-bold text-blue-700/80 transform rotate-12 bg-blue-50/20 backdrop-blur-[1px] pointer-events-none">
                            <span>NATIONAL HIGHWAY</span>
                            <span className="text-[7px]">OFFICIAL STAMP</span>
                            <span>ISLAMABAD</span>
                          </div>
                        )}

                        <div className="border-b border-slate-400 pb-2 mb-3">
                          <h5 className="font-extrabold text-sm uppercase tracking-tight">
                            NATIONAL HIGHWAY AUTHORITY (NHA)
                          </h5>
                          <p className="text-[10px] font-mono text-slate-600">
                            INSTRUCTIONS TO BIDDERS — CLAUSE 4.1 (PEC CATEGORY)
                          </p>
                        </div>

                        <div className="space-y-3 font-serif leading-relaxed text-[11px]">
                          <p>
                            4.1 Mandatory PEC Licensing: The bidder must be registered with the Pakistan Engineering Council (PEC) in Category <strong>C-A (Unlimited)</strong> with Specializations <strong>CE01 & CE02</strong>.
                          </p>
                          <p>
                            4.2 Financial Turnover: Minimum Average Annual Turnover for the last three (3) fiscal years shall be <strong>PKR 2,000,000,000 (Rs. 2 Billion)</strong>.
                          </p>
                          <p>
                            4.3 Earnest Money: Call Deposit Receipt (CDR) of <strong>PKR 97,000,000</strong> drawn on a scheduled bank in Pakistan.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Qwen-VL Prompt Code Tab */
            <div className="space-y-4">
              <div className="bg-white border border-[#CDE0D2] rounded-xl p-4 shadow-sm">
                <h4 className="font-extrabold text-[#00401A] text-sm mb-1 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#00401A]" />
                  Hyper-Specific Qwen-VL / Gemini Vision Prompt Engine
                </h4>
                <p className="text-slate-600 text-xs">
                  Instructs Vision-Language models to parse Pakistani procurement terminology (CDR, Stamp Paper, PEC Category) and return strict JSON.
                </p>
              </div>

              <pre className="bg-[#002D12] border border-[#00401A] p-4 rounded-xl text-emerald-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[400px]">
                {build_qwen_vl_prompt()}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#CDE0D2] bg-[#F4F8F5] flex items-center justify-between">
          <span className="text-[11px] text-slate-600 font-medium">
            OpenCV pipeline executes server-side or in browser pre-processor prior to AI extraction.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#00401A] hover:bg-[#003315] text-white font-extrabold shadow-md cursor-pointer transition-all"
          >
            Close Pre-Processor View
          </button>
        </div>
      </div>
    </div>
  );
}
