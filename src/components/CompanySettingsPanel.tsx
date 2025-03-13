import React, { useState } from 'react';
import { Building2, Users, Settings, ExternalLink, Save, Plus } from 'lucide-react';
import type { Company, LicenseType, UserRole, Department, UserProfile } from '../types';
import { useAuthStore } from '../store/auth';
import { ActionPathManager } from './ActionPathManager';
import { UserAvatar } from './UserAvatar';

interface CompanySettingsPanelProps {
  company: Company;
  onClose: () => void;
}

const LICENSE_TYPES = [
  { value: 'TRIAL', label: 'Trial', description: '30-day free trial with basic features' },
  { value: 'SMALL', label: 'Small Business', description: 'Up to 10 users' },
  { value: 'MEDIUM', label: 'Medium Business', description: 'Up to 50 users with advanced features' },
  { value: 'ENTERPRISE', label: 'Enterprise', description: 'Unlimited users with all features' }
] as const;

const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Administrator', description: 'Full access to all features and settings' },
  { value: 'user', label: 'Regular User', description: 'Can manage actions and view company data' },
  { value: 'assignee', label: 'Assignee', description: 'Can be assigned to actions and update assigned tasks' },
  { value: 'viewer', label: 'View Only', description: 'Can only view data, no edit permissions' }
];

const DEPARTMENTS: Department[] = ['Sales', 'Marketing', 'Engineering', 'Support', 'Management', 'Other'];

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

type TabType = 'general' | 'users' | 'actions' | 'salesforce';

export function CompanySettingsPanel({ company, onClose }: CompanySettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [newUser, setNewUser] = useState<{
    email: string;
    role: UserRole;
    profile: Partial<UserProfile>;
  }>({
    email: '',
    role: 'user',
    profile: {
      firstName: '',
      lastName: '',
      department: 'Other',
      color: COLORS[0]
    }
  });

  const [salesforceConfig, setSalesforceConfig] = useState({
    url: company.salesforceCredentials?.url || '',
    username: company.salesforceCredentials?.username || '',
    password: '',
    securityToken: '',
    apiVersion: company.salesforceCredentials?.apiVersion || '57.0'
  });

  const [error, setError] = useState<string | null>(null);

  const updateCompanyLogo = useAuthStore(state => state.updateCompanyLogo);
  const updateCompanyLicense = useAuthStore(state => state.updateCompanyLicense);
  const updateCompanySalesforceCredentials = useAuthStore(state => state.updateCompanySalesforceCredentials);
  const addUserToCompany = useAuthStore(state => state.addUserToCompany);
  const removeUserFromCompany = useAuthStore(state => state.removeUserFromCompany);
  const updateCompanyUser = useAuthStore(state => state.updateCompanyUser);

  const handleSalesforceUpdate = async () => {
    try {
      await updateCompanySalesforceCredentials(company.id, salesforceConfig);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update Salesforce settings');
    }
  };

  const handleAddUser = async () => {
    try {
      if (!newUser.email.endsWith(`@${company.domain}`)) {
        throw new Error(`Email must end with @${company.domain}`);
      }

      if (!newUser.profile.firstName || !newUser.profile.lastName) {
        throw new Error('First and last name are required');
      }

      await addUserToCompany(company.id, {
        email: newUser.email,
        role: newUser.role,
        isAdmin: newUser.role === 'admin',
        profile: {
          firstName: newUser.profile.firstName,
          lastName: newUser.profile.lastName,
          email: newUser.email,
          department: newUser.profile.department || 'Other',
          color: newUser.profile.color || COLORS[0]
        }
      });

      setNewUser({
        email: '',
        role: 'user',
        profile: {
          firstName: '',
          lastName: '',
          department: 'Other',
          color: COLORS[0]
        }
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="flex items-center gap-4">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="w-16 h-16 object-contain bg-white rounded border"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="text-gray-400" size={24} />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="url"
                    value={company.logoUrl || ''}
                    onChange={(e) => updateCompanyLogo(company.id, e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a URL for your company logo. The image should be square and at least 64x64 pixels.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Type
              </label>
              <select
                value={company.licenseType}
                onChange={(e) => updateCompanyLicense(company.id, e.target.value as LicenseType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {LICENSE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {LICENSE_TYPES.find(t => t.value === company.licenseType)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Billing Cycle
              </label>
              <select
                value={company.billingCycle}
                onChange={(e) => updateCompanyLicense(
                  company.id, 
                  company.licenseType,
                  e.target.value as 'monthly' | 'annual'
                )}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual (Save 20%)</option>
              </select>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newUser.profile.firstName}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      profile: { ...newUser.profile, firstName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newUser.profile.lastName}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      profile: { ...newUser.profile, lastName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={newUser.email.split('@')[0]}
                      onChange={(e) => setNewUser({
                        ...newUser,
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={newUser.profile.department}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      profile: { ...newUser.profile, department: e.target.value as Department }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {USER_ROLES.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar Color
                  </label>
                  <div className="flex gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewUser({
                          ...newUser,
                          profile: { ...newUser.profile, color }
                        })}
                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                          newUser.profile.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <button
                    onClick={handleAddUser}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    Add User
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Users & Assignees</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      company.users.forEach(user => {
                        if (!user.isSuperAdmin) {
                          updateCompanyUser(company.id, user.email, {
                            role: user.role === 'assignee' ? 'user' : 'assignee'
                          });
                        }
                      });
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Toggle All Assignees
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {company.users.map(user => (
                  <div
                    key={user.email}
                    className={`p-4 rounded-lg ${
                      user.role === 'assignee' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <UserAvatar 
                        user={user.profile} 
                        showInfo 
                        size="lg" 
                        editable
                        onUpdate={(updates) => updateCompanyUser(
                          company.id,
                          user.email,
                          { profile: updates }
                        )}
                      />
                      <div className="flex items-center gap-4">
                        <select
                          value={user.role}
                          onChange={(e) => updateCompanyUser(
                            company.id,
                            user.email,
                            {
                              role: e.target.value as UserRole,
                              isAdmin: e.target.value === 'admin'
                            }
                          )}
                          className={`text-sm px-3 py-2 border rounded ${
                            user.role === 'assignee'
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-gray-300 bg-white'
                          }`}
                          disabled={user.isSuperAdmin}
                        >
                          {USER_ROLES.map(role => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        {user.isSuperAdmin ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Super Admin
                          </span>
                        ) : (
                          <button
                            onClick={() => removeUserFromCompany(company.id, user.email)}
                            className="text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'actions':
        return <ActionPathManager onClose={() => setActiveTab('general')} />;

      case 'salesforce':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Salesforce URL
                </label>
                <input
                  type="url"
                  value={salesforceConfig.url}
                  onChange={(e) => setSalesforceConfig({ ...salesforceConfig, url: e.target.value })}
                  placeholder="https://your-instance.salesforce.com"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="email"
                  value={salesforceConfig.username}
                  onChange={(e) => setSalesforceConfig({ ...salesforceConfig, username: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={salesforceConfig.password}
                  onChange={(e) => setSalesforceConfig({ ...salesforceConfig, password: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Security Token
                </label>
                <input
                  type="password"
                  value={salesforceConfig.securityToken}
                  onChange={(e) => setSalesforceConfig({ ...salesforceConfig, securityToken: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  API Version
                </label>
                <input
                  type="text"
                  value={salesforceConfig.apiVersion}
                  onChange={(e) => setSalesforceConfig({ ...salesforceConfig, apiVersion: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSalesforceUpdate}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
              >
                <Save size={16} />
                Save Salesforce Settings
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company.logoUrl ? (
              <img 
                src={company.logoUrl} 
                alt={company.name} 
                className="w-10 h-10 object-contain bg-white rounded border"
              />
            ) : (
              <Building2 className="text-gray-400" size={24} />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{company.name}</h2>
              <p className="text-sm text-gray-500">{company.domain}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'general'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'users'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'actions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Action Paths
            </button>
            <button
              onClick={() => setActiveTab('salesforce')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'salesforce'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Salesforce
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default CompanySettingsPanel;