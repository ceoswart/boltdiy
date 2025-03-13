import React, { useState } from 'react';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  color?: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color = '#3B82F6', onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const colors = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#84CC16', // Lime
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50"
      >
        <div
          className="w-4 h-4 rounded-full border border-gray-200"
          style={{ backgroundColor: color }}
        />
        <Palette size={16} className="text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 grid grid-cols-5 gap-1 z-50">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                onChange(c);
                setIsOpen(false);
              }}
              className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
}