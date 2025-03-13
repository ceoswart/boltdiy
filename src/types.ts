export type DealSize = 'SMALL' | 'MEDIUM' | 'ENTERPRISE';
export type UserRole = 'admin' | 'user' | 'assignee' | 'viewer';
export type Department = 'Sales' | 'Marketing' | 'Engineering' | 'Support' | 'Management' | 'Other';

export interface Column {
  id: 'TARGET' | 'INFLUENCE' | 'SELECT' | 'COMMIT';
  title: string;
  description: string;
  color: string;
}

export interface SalesAction {
  id: string;
  title: string;
  description: string;
  category: Column['id'];
  targetDate: string;
  assignedTo: string;
  account: string;
  action_path_id: string | null;
  methodology?: string;
  source?: string;
  isDefault?: boolean;
}

export interface SalesforceCredentials {
  url: string;
  username: string;
  password: string;
  securityToken: string;
  apiVersion: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
  color: string;
  imageUrl?: string;
}

export interface User {
  email: string;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  companyId: string;
  profile: UserProfile;
}

export interface ActionPath {
  id: string;
  name: string;
  dealSize: DealSize;
  territories: string[];
  products: string[];
  salesCycleDays: number;
  estimatedValue: number;
  confidenceFactor: number;
  actions: SalesAction[];
  companyId?: string;
  isDefault?: boolean;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  licenseType: LicenseType;
  billingCycle: 'monthly' | 'annual';
  salesforceCredentials?: SalesforceCredentials;
  users: User[];
  defaultActionPath?: ActionPath;
}

export interface AuthState {
  user: User | null;
  companies: Company[];
  lastLoginEmail: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addCompany: (company: Partial<Company>) => Promise<void>;
  addUserToCompany: (companyId: string, user: Partial<User>) => void;
  removeUserFromCompany: (companyId: string, userEmail: string) => void;
  updateCompanySalesforceCredentials: (companyId: string, credentials: SalesforceCredentials) => Promise<void>;
  updateCompanyLogo: (companyId: string, logoUrl: string) => void;
  updateCompanyUser: (companyId: string, email: string, updates: Partial<User>) => void;
  updateCompanyLicense: (companyId: string, licenseType: LicenseType, billingCycle?: 'monthly' | 'annual') => void;
  updateCompanyDefaultPath: (companyId: string, actionPath: ActionPath) => void;
}

export type LicenseType = 'TRIAL' | 'SMALL' | 'MEDIUM' | 'ENTERPRISE';