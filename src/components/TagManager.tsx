import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useTagStore } from '../store/tag';
import type { Tag } from '../types';

interface TagManagerProps {
  onClose: () => void;
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
}

export function TagManager({ onClose, selectedTags = [], onTagsChange }: TagManagerProps) {
  const { tags, addTag, updateTag, removeTag } = useTagStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState<Partial<Tag>>({
    name: '',
    color: '#3B82F6' // Default blue color
  });

  const handleSave = () => {
    if (!newTag.name || !newTag.color) return;
    addTag(newTag as Omit<Tag, 'id'>);
    setNewTag({ name: '', color: '#3B82F6' });
    setIsAdding(false);
  };

  const handleTagSelect = (tagId: string) => {
    if (!onTagsChange) return;
    
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    onTagsChange(newSelectedTags);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Manage Tags</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <div className="p-4">
        {isAdding ? (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter tag name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={newTag.color}
                  onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                  className="w-12 h-9 p-1 border border-gray-300 rounded-md cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!newTag.name}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <Plus size={16} />
            Add New Tag
          </button>
        )}

        <div className="space-y-2">
          {tags.map(tag => (
            <div
              key={tag.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                selectedTags?.includes(tag.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTagSelect(tag.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="font-medium">{tag.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this tag?')) {
                    removeTag(tag.id);
                  }
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}