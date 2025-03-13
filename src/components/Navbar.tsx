import React, { useState } from 'react';
import { Save, Copy, Settings, LogOut } from 'lucide-react';
import type { ActionPath, Company } from '../types';
import { CompanyManager } from './CompanyManager';
import { Menu, MenuItem } from './ui/navbar-menu';

interface NavbarProps {
  userEmail: string;
  company: Company;
  selectedPath: ActionPath | null;
  hasUnsavedChanges: boolean;
  onManageAssignees: () => void;
  onPathChange: (pathId: string | null) => void;
  onNewPath: () => void;
  onSave: () => void;
  onSaveAsNew: () => void;
  onPathSettings: () => void;
  onSignOut: () => void;
  actionPaths: ActionPath[];
}

export function Navbar({
  userEmail,
  company,
  selectedPath,
  hasUnsavedChanges,
  onManageAssignees,
  onPathChange,
  onNewPath,
  onSave,
  onSaveAsNew,
  onPathSettings,
  onSignOut,
  actionPaths
}: NavbarProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [showCompanySettings, setShowCompanySettings] = useState(false);

  return (
    <div className="sticky top-0 z-30 w-full border-b bg-white">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-4">
          <img
            src="/SalesV2SVG.svg"
            alt="SalesV2 Logo"
            className="h-8"
          />
          <div className="hidden lg:flex">
            <h1 className="text-xl font-semibold text-gray-900">Sales Action Board</h1>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Menu setActive={setActiveItem}>
            <MenuItem setActive={setActiveItem} active={activeItem} item="Action Paths">
              <div className="w-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Select Action Path</h3>
                  <button
                    onClick={onNewPath}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Create New
                  </button>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => onPathChange(null)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      !selectedPath ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    Default Action Path
                  </button>
                  {actionPaths.map(path => (
                    <button
                      key={path.id}
                      onClick={() => onPathChange(path.id)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedPath?.id === path.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      {path.name}
                    </button>
                  ))}
                </div>
              </div>
            </MenuItem>

            <MenuItem setActive={setActiveItem} active={activeItem} item="Team">
              <div className="w-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Team Management</h3>
                  <button
                    onClick={() => setShowCompanySettings(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Settings
                  </button>
                </div>
                <button
                  onClick={onManageAssignees}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Manage Assignees
                </button>
              </div>
            </MenuItem>
          </Menu>

          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              disabled={!hasUnsavedChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                hasUnsavedChanges
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save size={18} />
              <span className="hidden sm:inline">Save</span>
            </button>

            {selectedPath && (
              <button
                onClick={onSaveAsNew}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
              >
                <Copy size={18} />
                <span>Save as New</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 pl-4 border-l">
            <span className="hidden lg:block text-sm text-gray-600">{userEmail}</span>
            <button
              onClick={() => setShowCompanySettings(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              title="Company Settings"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={onSignOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {showCompanySettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CompanyManager onClose={() => setShowCompanySettings(false)} />
          </div>
        </div>
      )}
    </div>
  );
}