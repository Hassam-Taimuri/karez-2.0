'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Check, Plus, Trash2 } from 'lucide-react';

interface ClientSwitcherProps {
  companies: any[];
  currentCompanyId: string | null;
  onSelectCompany: (company: any) => void;
  onCreateCompany: () => void;
  onDeleteCompany?: (company: any) => void;
}

export function ClientSwitcher({
  companies,
  currentCompanyId,
  onSelectCompany,
  onCreateCompany,
  onDeleteCompany,
}: ClientSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  const displayName = currentCompany?.companyName || currentCompany?.name || 'Select Client';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[160px] bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white flex items-center justify-between gap-2 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-gray-300 shrink-0" />
          <span className="truncate max-w-[120px] font-medium" title={displayName}>
            {displayName}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 max-h-80 overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50">
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider px-3 pt-3 pb-1">
            YOUR CLIENTS
          </div>

          <div className="py-1">
            {companies.map((company) => {
              const isSelected = company.id === currentCompanyId;
              const name = company.companyName || company.name || 'Unnamed Client';
              const isConfirming = confirmDeleteId === company.id;
              return (
                <div
                  key={company.id}
                  className="w-full px-3 py-2.5 hover:bg-gray-800 flex items-center justify-between transition-colors group"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCompany(company);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 min-w-0 pr-2 flex-1 cursor-pointer"
                  >
                    <span className="bg-emerald-500 w-2 h-2 rounded-full shrink-0" />
                    <span className="text-sm text-white font-medium truncate text-left">
                      {name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                  {onDeleteCompany && (
                    isConfirming ? (
                      <span className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCompany(company);
                            setConfirmDeleteId(null);
                          }}
                          className="text-[10px] font-bold text-rose-300 bg-rose-900/60 hover:bg-rose-800 px-2 py-1 rounded cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] font-medium text-gray-400 hover:text-gray-200 px-1.5 py-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(company.id)}
                        className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-950/50 opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
                        title="Delete this client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-700 my-1" />

          <button
            type="button"
            onClick={() => {
              onCreateCompany();
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 hover:bg-gray-800 flex items-center gap-2 text-sm text-emerald-400 font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Add New Client</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ClientSwitcher;
