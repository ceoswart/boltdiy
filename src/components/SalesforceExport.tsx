import React, { useState } from 'react';
import { ExternalLink, Check, AlertCircle } from 'lucide-react';
import type { ActionPath, SalesAction } from '../types';
import { useAuthStore } from '../store/auth';

interface SalesforceExportProps {
  actionPath: ActionPath;
  onClose: () => void;
}

interface SalesforceFieldMapping {
  actionField: keyof SalesAction;
  salesforceField: string;
  label: string;
}

const defaultFieldMappings: SalesforceFieldMapping[] = [
  { actionField: 'title', salesforceField: 'Subject', label: 'Task Subject' },
  { actionField: 'description', salesforceField: 'Description', label: 'Task Description' },
  { actionField: 'targetDate', salesforceField: 'ActivityDate', label: 'Due Date' },
  { actionField: 'category', salesforceField: 'Type', label: 'Task Type' },
  { actionField: 'assignedTo', salesforceField: 'OwnerId', label: 'Assigned To' }
];

export function SalesforceExport({ actionPath, onClose }: SalesforceExportProps) {
  const user = useAuthStore(state => state.user);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldMappings, setFieldMappings] = useState(defaultFieldMappings);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/salesforce/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionPath,
          fieldMappings,
          userEmail: user?.email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export to Salesforce');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export to Salesforce');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <ExternalLink className="text-blue-500" size={24} />
            <h2 className="text-2xl font-bold">Export to Salesforce</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Action Path: {actionPath.name}
            </h3>
            <p className="text-sm text-gray-600">
              {actionPath.actions.length} actions will be exported as Salesforce Tasks
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Field Mapping</h4>
            {fieldMappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {mapping.label}
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Maps to Salesforce:
                    </span>
                    <input
                      type="text"
                      value={mapping.salesforceField}
                      onChange={(e) => {
                        const newMappings = [...fieldMappings];
                        newMappings[index].salesforceField = e.target.value;
                        setFieldMappings(newMappings);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 text-green-600 rounded-md flex items-center gap-2">
              <Check size={20} />
              <span>Successfully exported to Salesforce!</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            <ExternalLink size={20} />
            {isExporting ? 'Exporting...' : 'Export to Salesforce'}
          </button>
        </div>
      </div>
    </div>
  );
}