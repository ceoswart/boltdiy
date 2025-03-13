import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { CompanyManager } from './CompanyManager';
import type { AppConfig } from '../types';

interface SetupProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

export function Setup({ config, onSave }: SetupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore(state => state.user);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800"
      >
        <Settings size={24} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <CompanyManager onClose={() => setIsOpen(false)} />
      </div>
    </div>
  );
}