import React from 'react';
import { Search, Calendar, Tag, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { ActionFilters, Priority, Assignee } from '../types';

interface ActionFiltersProps {
  filters: ActionFilters;
  onFilterChange: (filters: ActionFilters) => void;
  assignees: Assignee[];
  availableTags: string[];
}

export function ActionFilters({ filters, onFilterChange, assignees, availableTags }: ActionFiltersProps) {
  const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search actions..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        {/* Priority Filter */}
        <div className="relative">
          <AlertCircle className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <select
            value={filters.priority || ''}
            onChange={(e) => onFilterChange({ 
              ...filters, 
              priority: e.target.value ? e.target.value as Priority : undefined 
            })}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm appearance-none"
          >
            <option value="">All Priorities</option>
            {priorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>

        {/* Assignee Filter */}
        <div className="relative">
          <select
            value={filters.assignee || ''}
            onChange={(e) => onFilterChange({ 
              ...filters, 
              assignee: e.target.value || undefined 
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Assignees</option>
            {assignees.map(assignee => (
              <option key={assignee.id} value={assignee.email}>
                {assignee.firstName} {assignee.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="relative">
          <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="date"
            value={filters.dateRange?.start ? format(filters.dateRange.start, 'yyyy-MM-dd') : ''}
            onChange={(e) => onFilterChange({
              ...filters,
              dateRange: {
                ...filters.dateRange,
                start: e.target.value ? new Date(e.target.value) : null
              }
            })}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Tag className="text-gray-400" size={16} />
        {availableTags.map(tag => (
          <button
            key={tag}
            onClick={() => {
              const currentTags = filters.tags || [];
              const newTags = currentTags.includes(tag)
                ? currentTags.filter(t => t !== tag)
                : [...currentTags, tag];
              onFilterChange({
                ...filters,
                tags: newTags.length > 0 ? newTags : undefined
              });
            }}
            className={`px-3 py-1 text-sm rounded-full border ${
              filters.tags?.includes(tag)
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}