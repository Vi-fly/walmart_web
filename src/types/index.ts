
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supplier' | 'executive' | 'store';
  avatar?: string;
  lastLogin?: Date;
  storeId?: string; // For store users
}

export interface Store {
  id: string;
  name: string;
  coordinates: [number, number];
  address: string;
  type: 'Supercenter' | 'Neighborhood Market' | 'Express';
  size: string;
  suppliers: string[];
  riskScore: number;
  monthlyRevenue: number;
  customerCount: number;
  region: string;
  manager: string;
  phone: string;
  openingHours: string;
  issues?: string[];
  // Enhanced problem tracking
  problems?: {
    products: {
      category: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reportedDate: string;
      status: 'open' | 'in-progress' | 'resolved';
      affectedSuppliers: string[];
    }[];
    services: {
      category: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reportedDate: string;
      status: 'open' | 'in-progress' | 'resolved';
      customerImpact: number; // 1-10 scale
    }[];
    operational: {
      category: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      reportedDate: string;
      status: 'open' | 'in-progress' | 'resolved';
      cost: number;
    }[];
  };
  supplierAccess: {
    supplierId: string;
    accessLevel: 'read' | 'write' | 'full';
    sharedData: string[];
  }[];
}

export interface Supplier {
  id: string;
  name: string;
  category: 'Local Consumption' | 'High Profit Margin' | 'Brand Value' | 'Export Quality' | 'Innovation Hub' | 'Marine Products' | 'Sustainable Agriculture' | 'Specialty Products' | 'Beverage Specialty' | 'Bakery & Confectionery' | 'Non-Food Retail' | 'Personal Care' | 'Electronics & Appliances' | 'Automotive & Hardware' | 'Frozen & Processed' | 'Packaged Snacks' | 'Traditional Foods' | 'Beverages' | 'Grain Processing' | 'Product Quality' | 'General' | 'Sustainability';
  coordinates: [number, number];
  riskScore: number;
  riskBreakdown: {
    financial: number;
    quality: number;
    delivery: number;
    compliance: number;
    sustainability: number;
    customerFeedback: number;
  };
  products: string[];
  deliveryRadius: number;
  monthlyVolume: number;
  contractValue: number;
  certifications: string[];
  lastAudit: string;
  performanceTrend: 'improving' | 'stable' | 'declining';
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  address: string;
  establishedYear: number;
  employeeCount: number;
  // Issues and problems specific to this supplier
  issues?: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reportedDate: string;
    status: 'open' | 'in-progress' | 'resolved';
    affectedProducts: string[];
    impact: string;
  }[];
  // Benefits for alternate suppliers
  benefits?: {
    type: string;
    description: string;
    value: string;
    impact: string;
  }[];
  // New cluster-specific metrics
  sustainabilityScore?: number;
  carbonFootprint?: number;
  packagingQuality?: number;
  localRelevance?: number;
  availability?: number;
  profitMargin?: number;
  brandRecognition?: number;
  consumerTrends?: number;
  productQuality?: number;
}

export interface ClusterParameters {
  [key: string]: {
    weight: number;
    importance: string;
  };
}

export interface Cluster {
  id: string;
  type: 'Sustainability Cluster' | 'Local Consumption Cluster' | 'High Profit Margin Cluster' | 'Brand Value Cluster' | 'Product Quality Cluster';
  center: [number, number];
  radius: number;
  suppliers: string[];
  avgScore: number;
  totalValue: number;
  stores: string[];
  color: string;
  parameters: ClusterParameters;
}

export interface RiskMetric {
  category: string;
  weight: number;
  value: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

export interface DashboardMetrics {
  totalSuppliers: number;
  avgRiskScore: number;
  highRiskSuppliers: number;
  costSavings: number;
  sustainabilityScore: number;
  onTimeDelivery: number;
  qualityScore: number;
  contractsExpiring: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }[];
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  supplierId?: string;
  storeId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
}

export interface Report {
  id: string;
  title: string;
  type: 'risk-assessment' | 'performance' | 'compliance' | 'financial';
  generatedBy: string;
  generatedAt: Date;
  status: 'generating' | 'completed' | 'failed';
  data?: any;
  downloadUrl?: string;
}
