import { Column, SalesAction, Territory, Product, ActionPathConfig, DealSize } from './types';

export const columns: Column[] = [
  {
    id: 'TARGET',
    title: 'TARGET',
    description: 'Find Prospects that match your Ideal Customer Profile',
    color: '#FF0000',
  },
  {
    id: 'INFLUENCE',
    title: 'INFLUENCE',
    description: 'Building relationships and understanding needs',
    color: '#00B0F0',
  },
  {
    id: 'SELECT',
    title: 'SELECT',
    description: 'Solution presentation and evaluation',
    color: '#D1D1D1',
  },
  {
    id: 'COMMIT',
    title: 'COMMIT',
    description: 'Decision making and closing',
    color: '#92D050',
  },
];

export const dealSizes: DealSize[] = ['SMALL', 'MEDIUM', 'ENTERPRISE'];

export const territories: Territory[] = [
  {
    id: 'northeast',
    name: 'Northeast',
    regions: ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA']
  },
  {
    id: 'midwest',
    name: 'Midwest',
    regions: ['OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS']
  },
  {
    id: 'south',
    name: 'South',
    regions: ['DE', 'MD', 'DC', 'VA', 'WV', 'NC', 'SC', 'GA', 'FL', 'KY', 'TN', 'AL', 'MS', 'AR', 'LA', 'OK', 'TX']
  },
  {
    id: 'west',
    name: 'West',
    regions: ['MT', 'ID', 'WY', 'CO', 'NM', 'AZ', 'UT', 'NV', 'CA', 'OR', 'WA', 'AK', 'HI']
  },
  {
    id: 'canada-east',
    name: 'Canada East',
    regions: ['ON', 'QC', 'NB', 'NS', 'PE', 'NL']
  },
  {
    id: 'canada-west',
    name: 'Canada West',
    regions: ['BC', 'AB', 'SK', 'MB', 'YT', 'NT', 'NU']
  }
];

export const products: Product[] = [
  { id: 'p1', name: 'Sales Intelligence Platform', description: 'AI-powered sales insights and recommendations' },
  { id: 'p2', name: 'Pipeline Management Suite', description: 'Advanced pipeline visualization and analytics' },
  { id: 'p3', name: 'Lead Scoring Engine', description: 'Automated lead qualification and prioritization' },
  { id: 'p4', name: 'Sales Engagement Tools', description: 'Multi-channel communication and tracking' },
  { id: 'p5', name: 'Account Planning Software', description: 'Strategic account management and planning' },
  { id: 'p6', name: 'Sales Analytics Dashboard', description: 'Real-time performance metrics and insights' },
  { id: 'p7', name: 'Sales Training Platform', description: 'Interactive learning and skill development' },
  { id: 'p8', name: 'Deal Room', description: 'Secure document sharing and collaboration' },
  { id: 'p9', name: 'Sales Forecasting Tool', description: 'Predictive analytics for sales forecasting' },
  { id: 'p10', name: 'Customer Success Platform', description: 'Post-sale relationship management' }
];

export const defaultActionPathConfig: ActionPathConfig = {
  dealSizes,
  territories,
  products,
  actionPaths: []
};

// Initial actions with proper typing and default flag
export const initialActions: SalesAction[] = [
  {
    id: 't1',
    title: 'Company Size Analysis',
    description: 'Research employee count, revenue, and market capitalization',
    category: 'TARGET',
    targetDate: '2024-03-15',
    assignedTo: '',
    account: '7salessteps.com',
    action_path_id: 'default',
    isDefault: true
  },
  {
    id: 't2',
    title: 'Industry Vertical Research',
    description: 'Analyze industry classification, sub-sectors, and market position',
    category: 'TARGET',
    targetDate: '2024-03-16',
    assignedTo: '',
    account: '7salessteps.com',
    action_path_id: 'default',
    isDefault: true
  },
  // ... Add all other actions with proper typing and default flag
];