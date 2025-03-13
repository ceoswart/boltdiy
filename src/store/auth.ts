import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User, Company, SalesforceCredentials, LicenseType, ActionPath, Department } from '../types';
import { initialActions } from '../data';

const generateUserColor = () => {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#06B6D4', // Cyan
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Initial companies data
const initialCompanies: Company[] = [
  {
    id: 'c81d4e2e-bcf2-11e6-869b-7df92533d2db',
    name: 'SalesV2',
    domain: 'salesv2.com',
    logoUrl: '/SalesV2SVG.svg',
    licenseType: 'ENTERPRISE',
    billingCycle: 'annual',
    salesforceCredentials: {
      url: 'https://salesv2.salesforce.com',
      username: 'admin@salesv2.com',
      password: '********',
      securityToken: '********',
      apiVersion: '57.0'
    },
    users: [
      { 
        email: 'marius@salesv2.com', 
        isAdmin: true, 
        companyId: 'c81d4e2e-bcf2-11e6-869b-7df92533d2db', 
        isSuperAdmin: true,
        role: 'admin',
        profile: {
          firstName: 'Marius',
          lastName: 'Admin',
          email: 'marius@salesv2.com',
          department: 'Management',
          color: '#3B82F6',
          imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        }
      }
    ],
    defaultActionPath: {
      id: 'default',
      name: 'Default Action Path',
      dealSize: 'ENTERPRISE',
      territories: [],
      products: [],
      salesCycleDays: 30,
      estimatedValue: 10000,
      confidenceFactor: 50,
      actions: initialActions.map(action => ({
        ...action,
        isDefault: true,
        companyId: 'c81d4e2e-bcf2-11e6-869b-7df92533d2db'
      })),
      companyId: 'c81d4e2e-bcf2-11e6-869b-7df92533d2db',
      isDefault: true
    }
  }
];

export const useAuthStore = create(
  persist<AuthState>(
    (set, get) => ({
      user: null,
      companies: initialCompanies,
      lastLoginEmail: '',

      login: async (email: string, password: string) => {
        if (!email || !password) {
          throw new Error('Please provide both email and password');
        }

        try {
          const company = initialCompanies.find(c => 
            c.users.some(u => u.email.toLowerCase() === email.toLowerCase())
          );

          if (!company) {
            throw new Error('User not found in any company');
          }

          const companyUser = company.users.find(u => 
            u.email.toLowerCase() === email.toLowerCase()
          );

          if (!companyUser) {
            throw new Error('User not found');
          }

          // For demo, accept any password for marius@salesv2.com
          if (email.toLowerCase() !== 'marius@salesv2.com' && password !== '123') {
            throw new Error('Invalid login credentials');
          }

          set({ 
            user: companyUser,
            lastLoginEmail: email
          });
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes('Invalid login credentials')) {
              throw new Error('Invalid email or password');
            }
            throw error;
          }
          throw new Error('Failed to authenticate');
        }
      },

      logout: async () => {
        set({ user: null });
      },

      addCompany: async (newCompany) => {
        if (!newCompany.name || !newCompany.domain) {
          throw new Error('Company name and domain are required');
        }

        // Validate domain format
        if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(newCompany.domain)) {
          throw new Error('Invalid domain format');
        }

        const id = crypto.randomUUID();
        set((state) => ({
          companies: [
            ...state.companies,
            {
              ...newCompany,
              id,
              users: [],
              licenseType: newCompany.licenseType || 'TRIAL',
              billingCycle: 'monthly'
            } as Company
          ]
        }));
      },

      addUserToCompany: (companyId, newUser) => {
        if (!newUser.email) {
          throw new Error('Email is required');
        }

        set((state) => {
          const company = state.companies.find(c => c.id === companyId);
          if (!company) {
            throw new Error('Company not found');
          }

          // Check if user already exists
          if (company.users.some(u => u.email === newUser.email)) {
            throw new Error('User already exists in this company');
          }

          // Generate name from email if not provided
          const [firstName = '', lastName = ''] = (newUser.profile?.firstName && newUser.profile?.lastName) 
            ? [newUser.profile.firstName, newUser.profile.lastName]
            : newUser.email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1));

          const user: User = {
            email: newUser.email,
            role: newUser.role || 'user',
            isAdmin: newUser.role === 'admin',
            companyId,
            profile: {
              firstName,
              lastName,
              email: newUser.email,
              department: newUser.profile?.department || 'Other',
              color: newUser.profile?.color || generateUserColor(),
              imageUrl: newUser.profile?.imageUrl
            }
          };

          return {
            companies: state.companies.map(c => 
              c.id === companyId
                ? { ...c, users: [...c.users, user] }
                : c
            )
          };
        });
      },

      removeUserFromCompany: (companyId, userEmail) => {
        set((state) => ({
          companies: state.companies.map(company => {
            if (company.id === companyId) {
              // Don't allow removing the super admin
              if (company.id === initialCompanies[0].id && 
                  company.users.find(u => u.email === userEmail)?.isSuperAdmin) {
                return company;
              }
              return {
                ...company,
                users: company.users.filter(user => user.email !== userEmail)
              };
            }
            return company;
          })
        }));
      },

      updateCompanySalesforceCredentials: async (companyId: string, credentials: SalesforceCredentials) => {
        set((state) => ({
          companies: state.companies.map(company => {
            if (company.id === companyId) {
              return {
                ...company,
                salesforceCredentials: credentials
              };
            }
            return company;
          })
        }));
      },

      updateCompanyLogo: (companyId: string, logoUrl: string) => {
        set((state) => ({
          companies: state.companies.map(company => {
            if (company.id === companyId) {
              return {
                ...company,
                logoUrl
              };
            }
            return company;
          })
        }));
      },

      updateCompanyUser: (companyId: string, email: string, updates: Partial<User>) => {
        set((state) => ({
          companies: state.companies.map(company => {
            if (company.id === companyId) {
              // Don't allow changing the super admin's role
              if (company.id === initialCompanies[0].id && 
                  company.users.find(u => u.email === email)?.isSuperAdmin) {
                return company;
              }
              return {
                ...company,
                users: company.users.map(user => {
                  if (user.email === email) {
                    return { 
                      ...user, 
                      ...updates,
                      profile: {
                        ...user.profile,
                        ...updates.profile
                      }
                    };
                  }
                  return user;
                })
              };
            }
            return company;
          })
        }));
      },

      updateCompanyLicense: (companyId: string, licenseType: LicenseType, billingCycle?: 'monthly' | 'annual') => {
        set((state) => ({
          companies: state.companies.map(company => {
            if (company.id === companyId) {
              return {
                ...company,
                licenseType,
                ...(billingCycle && { billingCycle })
              };
            }
            return company;
          })
        }));
      },

      updateCompanyDefaultPath: (companyId: string, actionPath: ActionPath) => {
        set((state) => ({
          companies: state.companies.map(company => {
            if (company.id === companyId) {
              return {
                ...company,
                defaultActionPath: actionPath
              };
            }
            return company;
          })
        }));
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ lastLoginEmail: state.lastLoginEmail })
    }
  )
);