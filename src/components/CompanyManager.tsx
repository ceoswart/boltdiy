import React, { useState } from 'react';
import { Building2, Users, Plus, X, Settings, ExternalLink, Save } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import type { Company, LicenseType, UserRole } from '../types';
import CompanySettingsPanel from './CompanySettingsPanel';
import { AssigneeManager } from './AssigneeManager';
import { ActionPathManager } from './ActionPathManager';

interface CompanyManagerProps {
  onClose?: () => void;
}

const LICENSE_TYPES = [
  { value: 'TRIAL', label: 'Trial', description: '30-day free trial with basic features' },
  { value: 'SMALL', label: 'Small Business', description: 'Up to 10 users' },
  { value: 'MEDIUM', label: 'Medium Business', description: 'Up to 50 users with advanced features' },
  { value: 'ENTERPRISE', label: 'Enterprise', description: 'Unlimited users with all features' }
] as const;

export function CompanyManager({ onClose }: CompanyManagerProps) {
  const user = useAuthStore(state => state.user);
  const companies = useAuthStore(state => state.companies);
  const addCompany = useAuthStore(state => state.addCompany);

  const [showNewCompany, setShowNewCompany] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    logoUrl: '',
    licenseType: 'TRIAL' as LicenseType
  });

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.name || !formData.domain) {
        throw new Error('Company name and domain are required');
      }

      // Validate domain format
      if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(formData.domain)) {
        throw new Error('Invalid domain format');
      }

      // Check for duplicate domain
      if (companies.some(c => c.domain === formData.domain)) {
        throw new Error('A company with this domain already exists');
      }

      const newCompany: Partial<Company> = {
        name: formData.name,
        domain: formData.domain,
        logoUrl: formData.logoUrl || undefined,
        licenseType: formData.licenseType
      };

      await addCompany(newCompany);
      setShowNewCompany(false);
      setFormData({
        name: '',
        domain: '',
        logoUrl: '',
        licenseType: 'TRIAL'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900">Company Management</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewCompany(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Plus size={20} />
            Add Company
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {showNewCompany && (
          <div className="mb-8 bg-gray-50 p-6 rounded-lg">
            <form onSubmit={handleAddCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Domain</label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">License Type</label>
                <select
                  value={formData.licenseType}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    licenseType: e.target.value as LicenseType 
                  })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {LICENSE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {LICENSE_TYPES.find(t => t.value === formData.licenseType)?.description}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCompany(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Company
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companies.map(company => (
            <div
              key={company.id}
              className="border rounded-lg p-6 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {company.logoUrl ? (
                    <img 
                      src={company.logoUrl} 
                      alt={company.name} 
                      className="w-12 h-12 object-contain bg-white rounded border"
                    />
                  ) : (
                    <Building2 className="text-gray-400" size={24} />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{company.name}</h3>
                    <p className="text-sm text-gray-500">{company.domain}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {LICENSE_TYPES.find(t => t.value === company.licenseType)?.label}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users size={12} />
                        <span>{company.users.length} users</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCompany(company)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-md flex items-center gap-1.5 transition-colors"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCompany && (
        <CompanySettingsPanel
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}