import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { ActionEditorProps, SalesAction } from '../types';
import { columns } from '../data';
import { useAuthStore } from '../store/auth';

const methodologies = [
  { id: 'spin', name: 'SPIN Selling', description: 'Situation, Problem, Implication, Need-payoff' },
  { id: 'neat', name: 'NEAT Selling', description: 'Need, Economic Impact, Access to Authority, Timeline' },
  { id: 'best', name: 'Best Practices', description: 'Industry-proven best practices' },
  { id: 'custom', name: 'Custom', description: 'Custom methodology' }
];

export function ActionEditor({ action, onSave, onClose, allowDefaultAction = false }: ActionEditorProps) {
  const user = useAuthStore(state => state.user);
  const isSuperAdmin = user?.email === 'marius@7salessteps.com';

  const [formData, setFormData] = useState<Partial<SalesAction>>(
    action || {
      title: '',
      description: '',
      category: 'TARGET',
      methodology: 'best',
      source: '',
      isDefault: false
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category) return;

    onSave({
      id: action?.id || crypto.randomUUID(),
      targetDate: new Date().toISOString().split('T')[0],
      assignedTo: '',
      account: '',
      ...formData,
      isDefault: allowDefaultAction && isSuperAdmin ? formData.isDefault : false
    } as SalesAction);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {action ? 'Edit Action' : 'Create New Action'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage
                </label>
                <select
                  value={formData.category || 'TARGET'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as SalesAction['category'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Methodology
                </label>
                <select
                  value={formData.methodology || 'best'}
                  onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {methodologies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source / Reference
              </label>
              <input
                type="text"
                value={formData.source || ''}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Book reference, website URL, or best practice source"
              />
            </div>

            {allowDefaultAction && isSuperAdmin && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault || false}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                  Add to Default Action Path
                </label>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {action ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}