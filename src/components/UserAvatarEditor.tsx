import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';
import type { UserProfile } from '../types';

interface UserAvatarEditorProps {
  user: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
  onClose: () => void;
}

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#06B6D4', // Cyan
];

export function UserAvatarEditor({ user, onUpdate, onClose }: UserAvatarEditorProps) {
  const [imageUrl, setImageUrl] = useState(user.imageUrl || '');
  const [color, setColor] = useState(user.color);

  const handleSave = () => {
    onUpdate({
      ...user,
      imageUrl: imageUrl || undefined,
      color
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Edit Avatar</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Avatar Preview */}
          <div className="flex justify-center">
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-32 h-32 rounded-full object-cover"
                />
                <button
                  onClick={() => setImageUrl('')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center text-3xl font-medium text-white"
                style={{ backgroundColor: color }}
              >
                {user.firstName[0]}{user.lastName[0]}
              </div>
            )}
          </div>

          {/* Image URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={() => setImageUrl('')}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
              >
                Clear
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Enter a URL for your profile picture, or choose a color for initials below
            </p>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avatar Background Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${
                    color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}