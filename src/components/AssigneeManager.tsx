import React, { useState, useRef } from 'react';
import { Plus, Upload, X, User, Edit2 } from 'lucide-react';
import { useAssigneeStore } from '../store/assignee';
import { useAuthStore } from '../store/auth';
import type { Assignee } from '../types';
import { ColorPicker } from './ColorPicker';

interface AssigneeManagerProps {
  onClose: () => void;
}

export function AssigneeManager({ onClose }: AssigneeManagerProps) {
  const user = useAuthStore(state => state.user);
  const assignees = useAssigneeStore(state => state.assignees);
  const addAssignee = useAssigneeStore(state => state.addAssignee);
  const updateAssignee = useAssigneeStore(state => state.updateAssignee);
  const removeAssignee = useAssigneeStore(state => state.removeAssignee);
  const importFromCSV = useAssigneeStore(state => state.importFromCSV);

  const [isEditing, setIsEditing] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState<Assignee | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter assignees by company
  const companyAssignees = assignees.filter(a => a.companyId === user?.companyId);

  const validateEmail = (email: string) => {
    if (!user?.companyId) return 'No company context found';
    const company = useAuthStore.getState().companies.find(c => c.id === user.companyId);
    if (!company) return 'Company not found';
    if (!email.endsWith(`@${company.domain}`)) {
      return `Email must end with @${company.domain}`;
    }
    return '';
  };

  const handleSave = () => {
    if (!editingAssignee?.firstName || !editingAssignee?.lastName || !editingAssignee?.email) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user?.companyId) {
      setError('No company context found');
      return;
    }

    const emailError = validateEmail(editingAssignee.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    if (editingAssignee.id) {
      updateAssignee(editingAssignee.id, editingAssignee);
    } else {
      addAssignee({
        ...editingAssignee,
        companyId: user.companyId
      });
    }
    
    setEditingAssignee(null);
    setIsEditing(false);
    setError('');
  };

  const handleEdit = (assignee: Assignee) => {
    setEditingAssignee(assignee);
    setIsEditing(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.companyId) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        importFromCSV(content, user.companyId);
        setError('');
      } catch (err) {
        setError('Failed to process CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleDragStart = (e: React.DragEvent, assignee: Assignee) => {
    e.dataTransfer.setData('assigneeId', assignee.id);
    e.dataTransfer.setData('application/json', JSON.stringify(assignee));
    e.dataTransfer.effectAllowed = 'copy';

    const dragPreview = document.createElement('div');
    dragPreview.className = 'fixed left-0 top-0 bg-white shadow-lg rounded-lg p-3 pointer-events-none';
    dragPreview.style.zIndex = '9999';
    dragPreview.innerHTML = `
      <div class="flex items-center gap-2">
        ${assignee.imageUrl 
          ? `<img src="${assignee.imageUrl}" class="w-8 h-8 rounded-full" />`
          : `<div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <span class="text-sm font-medium text-gray-500">
                ${assignee.firstName[0]}${assignee.lastName[0]}
              </span>
            </div>`
        }
        <span class="text-sm font-medium">${assignee.firstName} ${assignee.lastName}</span>
      </div>
    `;

    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 20, 20);

    requestAnimationFrame(() => {
      dragPreview.remove();
    });
  };

  const company = user?.companyId 
    ? useAuthStore.getState().companies.find(c => c.id === user.companyId)
    : null;

  if (!company) {
    return (
      <div className="p-4 text-center text-red-600">
        Company context not found
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          {company.name} - Assignee Pool
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            <Upload size={16} />
            Import CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => {
              setEditingAssignee({
                id: '',
                firstName: '',
                lastName: '',
                email: '',
                color: '#3B82F6',
                companyId: user!.companyId
              });
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
          >
            <Plus size={16} />
            Add Assignee
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {error && (
        <div className="m-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      {isEditing && editingAssignee && (
        <div className="m-4 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editingAssignee.id ? 'Edit Assignee' : 'Add New Assignee'}
            </h3>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingAssignee(null);
                setError('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingAssignee.firstName}
                onChange={(e) => setEditingAssignee({ ...editingAssignee, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingAssignee.lastName}
                onChange={(e) => setEditingAssignee({ ...editingAssignee, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={editingAssignee.email.split('@')[0]}
                  onChange={(e) => setEditingAssignee({ 
                    ...editingAssignee, 
                    email: `${e.target.value}@${company.domain}` 
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
                  placeholder="username"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-500">
                  @{company.domain}
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Image URL (optional)
              </label>
              <input
                type="url"
                value={editingAssignee.imageUrl || ''}
                onChange={(e) => setEditingAssignee({ ...editingAssignee, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <ColorPicker
                color={editingAssignee.color}
                onChange={(color) => setEditingAssignee({ ...editingAssignee, color })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingAssignee(null);
                setError('');
              }}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {editingAssignee.id ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {companyAssignees.map(assignee => (
            <div
              key={assignee.id}
              draggable
              onDragStart={(e) => handleDragStart(e, assignee)}
              className="group relative bg-white p-4 rounded-lg border-2 transition-all cursor-move"
              style={{ 
                borderColor: assignee.color || '#e5e7eb',
                borderLeftWidth: '4px'
              }}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => handleEdit(assignee)}
                  className="text-blue-500 hover:text-blue-600"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => removeAssignee(assignee.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-col items-center text-center">
                {assignee.imageUrl ? (
                  <img
                    src={assignee.imageUrl}
                    alt={`${assignee.firstName} ${assignee.lastName}`}
                    className="w-16 h-16 rounded-full object-cover mb-2"
                  />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                    style={{ 
                      backgroundColor: assignee.color || '#f3f4f6',
                      color: assignee.color ? '#fff' : '#6b7280'
                    }}
                  >
                    <span className="text-xl font-medium">
                      {assignee.firstName[0]}{assignee.lastName[0]}
                    </span>
                  </div>
                )}
                <h3 className="font-medium text-gray-900 text-sm truncate w-full">
                  {assignee.firstName} {assignee.lastName}
                </h3>
                <p className="text-xs text-gray-500 truncate w-full">
                  {assignee.email}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}