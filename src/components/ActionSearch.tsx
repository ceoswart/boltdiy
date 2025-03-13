import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { initialActions } from '../data';
import type { ActionSearchProps, SalesAction } from '../types';

export function ActionSearch({ onSelect, category, existingActions }: ActionSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter out actions that are already added and match the search term
  const availableActions = initialActions.filter(action => {
    const matchesSearch = (
      action.category === category &&
      (action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       action.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Check if this action is already added by matching title and description
    const isAlreadyAdded = existingActions?.some(existing => 
      existing.title === action.title && 
      existing.description === action.description
    );

    return matchesSearch && !isAlreadyAdded;
  });

  const handleSelect = (action: SalesAction) => {
    const newAction = {
      ...action,
      id: crypto.randomUUID(),
      action_path_id: null
    };
    onSelect(newAction, category);
    setIsOpen(false);
    setSearchTerm('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
      >
        <Plus size={20} />
        <span>Add Action</span>
      </button>
    );
  }

  return (
    <div className="mt-4 bg-white rounded-lg shadow-lg p-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search actions..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>
      
      <div className="mt-4 max-h-60 overflow-y-auto">
        {availableActions.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            {searchTerm ? 'No matching actions found' : 'All actions have been added'}
          </p>
        ) : (
          <div className="space-y-2">
            {availableActions.map(action => (
              <button
                key={action.id}
                onClick={() => handleSelect(action)}
                className="w-full text-left p-3 rounded-lg hover:bg-blue-50 transition-colors border-2 border-transparent hover:border-blue-200"
              >
                <h4 className="font-medium text-gray-900">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => {
            setIsOpen(false);
            setSearchTerm('');
          }}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}