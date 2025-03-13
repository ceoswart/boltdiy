import React, { useState, useRef, useEffect } from 'react';
import { Building2, Users, ChevronDown, Upload, Settings } from 'lucide-react';
import type { Company } from '../types';
import { useAuthStore } from '../store/auth';

interface CompanyMenuProps {
  company: Company;
  onManageAssignees: () => void;
}

export function CompanyMenu({ company, onManageAssignees }: CompanyMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [logoUrl, setLogoUrl] = useState(company.logoUrl || '');
  const menuRef = useRef<HTMLDivElement>(null);
  const updateCompanyLogo = useAuthStore(state => state.updateCompanyLogo);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogoUpdate = () => {
    if (logoUrl) {
      updateCompanyLogo(company.id, logoUrl);
      setShowSettings(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
      >
        {company.logoUrl ? (
          <img src={company.logoUrl} alt={company.name} className="w-6 h-6 object-contain" />
        ) : (
          <Building2 size={18} />
        )}
        <span className="hidden lg:inline">{company.name}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={() => {
              onManageAssignees();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            <Users size={18} />
            <span>Manage Assignees</span>
          </button>
          <button
            onClick={() => {
              setShowSettings(true);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            <Settings size={18} />
            <span>Company Settings</span>
          </button>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Company Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={handleLogoUpdate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    <Upload size={16} />
                    Update
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter a URL for your company logo. The image should be square and at least 64x64 pixels.
                </p>
              </div>

              {logoUrl && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={logoUrl}
                    alt="Preview"
                    className="w-16 h-16 object-contain bg-white rounded border"
                  />
                  <div className="text-sm text-gray-600">
                    Logo preview
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoUpdate}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}