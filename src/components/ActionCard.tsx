import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, User, X, Tag as TagIcon, Star } from 'lucide-react';
import { useAssigneeStore } from '../store/assignee';
import { useAuthStore } from '../store/auth';
import { useTagStore } from '../store/tag';
import { format, isValid, parseISO } from 'date-fns';
import type { SalesAction } from '../types';
import { TagManager } from './TagManager';

interface ActionCardProps {
  action: SalesAction;
  isActive?: boolean;
  columnColor: string;
  onAssigneeChange: (actionId: string, assigneeEmail: string) => void;
  onDelete?: (actionId: string) => void;
  onTagsChange?: (actionId: string, tags: string[]) => void;
  onDateChange?: (actionId: string, date: string) => void;
}

export function ActionCard({ 
  action, 
  isActive, 
  columnColor, 
  onAssigneeChange, 
  onDelete, 
  onTagsChange,
  onDateChange 
}: ActionCardProps) {
  const user = useAuthStore(state => state.user);
  const assignees = useAssigneeStore(state => state.assignees);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const { tags } = useTagStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDropdown || showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, showDatePicker]);

  // Filter assignees by company domain
  const userDomain = user?.email.split('@')[1] || '';
  const filteredAssignees = assignees.filter(a => a.email.endsWith(`@${userDomain}`));
  const currentAssignee = filteredAssignees.find(a => a.email === action.assignedTo);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm('Are you sure you want to delete this action?')) {
      onDelete(action.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      // Try to get the full assignee data first
      const assigneeData = e.dataTransfer.getData('application/json');
      if (assigneeData) {
        const assignee = JSON.parse(assigneeData);
        onAssigneeChange(action.id, assignee.email);
        return;
      }

      // Fallback to simple ID method
      const assigneeId = e.dataTransfer.getData('assigneeId');
      const assignee = assignees.find(a => a.id === assigneeId);
      if (assignee) {
        onAssigneeChange(action.id, assignee.email);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const selectedTags = tags.filter(tag => action.tags?.includes(tag.id));

  // Format date safely
  const formattedDate = (() => {
    try {
      const date = parseISO(action.targetDate);
      return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
    } catch {
      return 'Invalid date';
    }
  })();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow-sm mb-3 border transition-all overflow-visible ${
        isDragging ? 'opacity-50 scale-105' : ''
      } ${isActive ? 'ring-2 ring-blue-400' : ''} ${
        isDragOver ? 'ring-2 ring-blue-400 border-blue-400' : 'border-gray-200 hover:border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div 
        className="h-1.5 w-full rounded-t-lg"
        style={{ backgroundColor: columnColor }}
      />
      <div className="p-4">
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate">{action.title}</h3>
                {action.isDefault && (
                  <Star size={16} className="text-yellow-500 flex-shrink-0" fill="currentColor" />
                )}
              </div>
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                {selectedTags.map(tag => (
                  <div
                    key={tag.id}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                    title={tag.name}
                  />
                ))}
                <button
                  onClick={() => setShowTagManager(true)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Manage tags"
                >
                  <TagIcon size={14} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete action"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{action.description}</p>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <div className="relative" ref={datePickerRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDatePicker(!showDatePicker);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-50"
                >
                  <Calendar size={14} />
                  <span>{formattedDate}</span>
                </button>

                {showDatePicker && (
                  <div className="absolute left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
                    <input
                      type="date"
                      value={action.targetDate}
                      onChange={(e) => {
                        if (onDateChange && e.target.value) {
                          onDateChange(action.id, e.target.value);
                          setShowDatePicker(false);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  ref={buttonRef}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                    showDropdown 
                      ? 'bg-gray-100 ring-2 ring-gray-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  title={currentAssignee ? `${currentAssignee.firstName} ${currentAssignee.lastName}` : 'Assign'}
                >
                  {currentAssignee?.imageUrl ? (
                    <img 
                      src={currentAssignee.imageUrl} 
                      alt={`${currentAssignee.firstName} ${currentAssignee.lastName}`}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ 
                        backgroundColor: currentAssignee?.color || '#f3f4f6',
                        color: currentAssignee?.color ? '#fff' : '#6b7280'
                      }}
                    >
                      {currentAssignee ? (
                        <span className="text-xs font-medium">
                          {currentAssignee.firstName[0]}{currentAssignee.lastName[0]}
                        </span>
                      ) : (
                        <User size={14} />
                      )}
                    </div>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <h4 className="text-xs font-medium text-gray-500 uppercase">Assign to</h4>
                    </div>
                    {filteredAssignees.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No assignees available
                      </div>
                    ) : (
                      filteredAssignees.map(assignee => (
                        <button
                          key={assignee.id}
                          onClick={() => {
                            onAssigneeChange(action.id, assignee.email);
                            setShowDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 ${
                            assignee.email === action.assignedTo ? 'bg-blue-50' : ''
                          }`}
                        >
                          {assignee.imageUrl ? (
                            <img 
                              src={assignee.imageUrl} 
                              alt={`${assignee.firstName} ${assignee.lastName}`}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ 
                                backgroundColor: assignee.color || '#f3f4f6',
                                color: assignee.color ? '#fff' : '#6b7280'
                              }}
                            >
                              <span className="text-xs font-medium">
                                {assignee.firstName[0]}{assignee.lastName[0]}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {assignee.firstName} {assignee.lastName}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {assignee.email}
                            </div>
                          </div>
                          {assignee.email === action.assignedTo && (
                            <div className="text-blue-500">
                              <span className="sr-only">Currently assigned</span>
                              ✓
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showTagManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <TagManager
            onClose={() => setShowTagManager(false)}
            selectedTags={action.tags || []}
            onTagsChange={(tags) => {
              onTagsChange?.(action.id, tags);
              setShowTagManager(false);
            }}
          />
        </div>
      )}
    </div>
  );
}