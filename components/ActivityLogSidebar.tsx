'use client';

import React, { useState } from 'react';
import {
  History,
  X,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  FileEdit,
  Clock,
  Filter,
  Search,
  Download,
  Copy,
  Check,
  ArrowRight,
  Building2,
  FileText,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { ActivityLogEntry, AuditActionType } from '../lib/types';

interface ActivityLogSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLogEntry[];
  officerName: string;
  onOfficerNameChange: (newName: string) => void;
  onClearLogs?: () => void;
}

export function ActivityLogSidebar({
  isOpen,
  onClose,
  logs,
  officerName,
  onOfficerNameChange,
  onClearLogs,
}: ActivityLogSidebarProps) {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEditingOfficer, setIsEditingOfficer] = useState<boolean>(false);
  const [tempOfficerName, setTempOfficerName] = useState<string>(officerName);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveOfficer = () => {
    if (tempOfficerName.trim()) {
      onOfficerNameChange(tempOfficerName.trim());
    }
    setIsEditingOfficer(false);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.itemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.ppraClauseRef && log.ppraClauseRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.officerName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'ALL') return true;
    if (filterType === 'OVERRIDES')
      return log.actionType === 'OVERRIDE_APPROVED' || log.actionType === 'OVERRIDE_REVOKED';
    if (filterType === 'NOTES') return log.actionType === 'NOTE_UPDATED';
    if (filterType === 'SYSTEM')
      return log.actionType === 'BIDDER_SWITCHED' || log.actionType === 'TENDER_CHANGED';

    return true;
  });

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'OVERRIDE_APPROVED':
        return {
          label: 'OVERRIDE APPROVED',
          bgColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />,
        };
      case 'OVERRIDE_REVOKED':
        return {
          label: 'OVERRIDE REVOKED',
          bgColor: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />,
        };
      case 'NOTE_UPDATED':
        return {
          label: 'AUDITOR NOTE',
          bgColor: 'bg-sky-100 text-sky-800 border-sky-300',
          icon: <FileEdit className="w-3.5 h-3.5 text-sky-700" />,
        };
      case 'BIDDER_SWITCHED':
        return {
          label: 'BIDDER CHANGED',
          bgColor: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: <Building2 className="w-3.5 h-3.5 text-purple-700" />,
        };
      case 'TENDER_CHANGED':
        return {
          label: 'TENDER LOADED',
          bgColor: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <FileText className="w-3.5 h-3.5 text-amber-700" />,
        };
      default:
        return {
          label: 'AUDIT EVENT',
          bgColor: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: <Clock className="w-3.5 h-3.5 text-slate-700" />,
        };
    }
  };

  const handleCopyLogsText = () => {
    const textLines = logs.map((l) => {
      return `[${l.timestamp}] ${l.actionType} | Rule: ${l.itemTitle} | Clause: ${
        l.ppraClauseRef || 'N/A'
      } | By: ${l.officerName}${l.notes ? ` | Notes: "${l.notes}"` : ''}`;
    });
    const content = `TENDERMIND PK - PPRA RULES 2004 COMPLIANCE AUDIT TRAIL LOG\nGenerated: ${new Date().toLocaleString()}\nTotal Logged Events: ${
      logs.length
    }\n------------------------------------------------------------\n${textLines.join(
      '\n'
    )}`;

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const overrideCount = logs.filter(
    (l) => l.actionType === 'OVERRIDE_APPROVED' || l.actionType === 'OVERRIDE_REVOKED'
  ).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l border-[#CDE0D2]">
        {/* Drawer Header */}
        <div className="bg-[#00401A] text-white px-4 py-3.5 flex items-center justify-between border-b border-[#002D12] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-300 border border-emerald-500/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
                <span>Compliance Audit Trail</span>
                <span className="text-[10px] font-mono bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full font-bold border border-emerald-700/60">
                  {logs.length} Events
                </span>
              </h2>
              <p className="text-[11px] text-emerald-200/80 font-medium">
                PPRA 2004 Disqualification & Override Activity Log
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-emerald-200/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Officer Identity Banner */}
        <div className="bg-[#F0F7F2] p-3.5 border-b border-[#CDE0D2] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#00401A] text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
              <UserCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                <span>Active Procurement Auditor</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              </div>
              {isEditingOfficer ? (
                <div className="flex items-center space-x-1.5 mt-1">
                  <input
                    type="text"
                    value={tempOfficerName}
                    onChange={(e) => setTempOfficerName(e.target.value)}
                    className="bg-white text-xs font-bold text-slate-800 px-2 py-1 rounded border border-emerald-600 focus:outline-none w-56"
                    placeholder="Officer Name / ID"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveOfficer}
                    className="bg-[#00401A] text-white px-2 py-1 rounded text-xs font-bold cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div
                  className="font-extrabold text-xs text-[#00401A] truncate cursor-pointer hover:underline flex items-center gap-1"
                  onClick={() => setIsEditingOfficer(true)}
                  title="Click to edit auditor credentials"
                >
                  <span className="truncate">{officerName}</span>
                  <FileEdit className="w-3 h-3 text-emerald-700 shrink-0" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={handleCopyLogsText}
              className="px-2.5 py-1.5 bg-white text-slate-700 hover:text-[#00401A] border border-[#CDE0D2] hover:border-[#00401A] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Copy complete log report"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Trail</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 bg-white border-b border-slate-200 space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rule title, clause, or officer notes..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:border-[#00401A] text-slate-800 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3 h-3 text-slate-400" /> Filter:
            </span>
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-[#00401A] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilterType('OVERRIDES')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterType === 'OVERRIDES'
                  ? 'bg-[#00401A] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Overrides ({overrideCount})
            </button>
            <button
              onClick={() => setFilterType('NOTES')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterType === 'NOTES'
                  ? 'bg-[#00401A] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Notes ({logs.filter((l) => l.actionType === 'NOTE_UPDATED').length})
            </button>
            <button
              onClick={() => setFilterType('SYSTEM')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterType === 'SYSTEM'
                  ? 'bg-[#00401A] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              System Events ({logs.filter((l) => l.actionType === 'BIDDER_SWITCHED' || l.actionType === 'TENDER_CHANGED').length})
            </button>
          </div>
        </div>

        {/* Log Entries List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#F8FAF8]">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">No Audit Trail Events Found</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {searchQuery
                  ? 'No activity logs match your search keywords.'
                  : 'Toggle compliance items in the audit checklist to record human officer overrides.'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const badge = getActionBadge(log.actionType);

              return (
                <div
                  key={log.id}
                  className="bg-white border border-[#CDE0D2] rounded-xl p-3 shadow-2xs space-y-2 hover:border-[#00401A] transition-all relative group"
                >
                  {/* Top Bar: Action Badge & Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border font-mono tracking-tight ${badge.bgColor}`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {log.timestamp}
                    </span>
                  </div>

                  {/* Item Rule Title & Clause Reference */}
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                      {log.itemTitle}
                    </h4>
                    {log.ppraClauseRef && (
                      <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        {log.ppraClauseRef}
                      </span>
                    )}
                  </div>

                  {/* Status Transition Row (if applicable) */}
                  {log.previousStatus && log.newStatus && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] font-mono flex items-center justify-between gap-1">
                      <span className="text-slate-600 truncate max-w-[120px]" title={log.previousStatus}>
                        {log.previousStatus}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#00401A] shrink-0" />
                      <span className="font-extrabold text-[#00401A] truncate max-w-[150px]" title={log.newStatus}>
                        {log.newStatus}
                      </span>
                    </div>
                  )}

                  {/* Officer Notes Justification Quote */}
                  {log.notes && (
                    <div className="bg-amber-50/70 border-l-2 border-amber-500 p-2 text-xs text-amber-950 font-medium italic rounded-r">
                      &quot;{log.notes}&quot;
                    </div>
                  )}

                  {/* Footer: Officer Signature */}
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-700" />
                      <span className="font-bold text-slate-700">{log.officerName}</span>
                    </span>
                    <span className="text-slate-400 font-mono">Auditor Verified</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions Bar */}
        {onClearLogs && logs.length > 0 && (
          <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-slate-500 font-medium font-mono">
              PPRA Rule 33 Audit Preservation
            </span>
            <button
              onClick={onClearLogs}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Log History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
