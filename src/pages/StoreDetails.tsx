import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadMockData } from '@/data/mockData';
import type { Store, Supplier } from '@/types';
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, DollarSign, MapPin, Package, Phone, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface StoreDetailsData extends Store {
  aiSummary: {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    keyIssues: string[];
    recommendations: string[];
    riskTrend: 'improving' | 'stable' | 'declining';
    costSavings: number;
    efficiencyScore: number;
  };
  reports: {
    id: string;
    title: string;
    type: 'risk-assessment' | 'performance' | 'financial' | 'compliance';
    generatedAt: string;
    status: 'completed' | 'pending' | 'failed';
    summary: string;
    keyMetrics: { [key: string]: number };
  }[];
  supplierAnalytics: {
    totalSuppliers: number;
    highRiskSuppliers: number;
    averageRiskScore: number;
    totalContractValue: number;
    categoryBreakdown: { [key: string]: number };
    performanceTrends: { [key: string]: 'improving' | 'stable' | 'declining' };
  };
}

const StoreDetails = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreDetailsData | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoreData = async () => {
      try {
        const { mockStores, mockSuppliers } = await loadMockData();
        const foundStore = mockStores.find(s => s.id === storeId);
        
        if (!foundStore) {
          navigate('/map');
          return;
        }

        // Get suppliers for this store
        const storeSuppliers = mockSuppliers.filter(s => foundStore.suppliers.includes(s.id));
        
        // Generate AI summary and analytics
        const aiSummary = generateAISummary(foundStore, storeSuppliers);
        const reports = generateReports(foundStore, storeSuppliers);
        const supplierAnalytics = generateSupplierAnalytics(storeSuppliers);

        const storeWithDetails: StoreDetailsData = {
          ...foundStore,
          aiSummary,
          reports,
          supplierAnalytics
        };

        setStore(storeWithDetails);
        setSuppliers(storeSuppliers);
      } catch (error) {
        console.error('Failed to load store data:', error);
        navigate('/map');
      } finally {
        setIsLoading(false);
      }
    };

    loadStoreData();
  }, [storeId, navigate]);

  const generateAISummary = (store: Store, storeSuppliers: Supplier[]) => {
    const avgRiskScore = storeSuppliers.reduce((sum, s) => sum + s.riskScore, 0) / storeSuppliers.length;
    const highRiskSuppliers = storeSuppliers.filter(s => s.riskScore <= 30).length;
    const totalContractValue = storeSuppliers.reduce((sum, s) => sum + s.contractValue, 0);

    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    if (avgRiskScore >= 80 && highRiskSuppliers === 0) overallHealth = 'excellent';
    else if (avgRiskScore >= 60 && highRiskSuppliers <= 1) overallHealth = 'good';
    else if (avgRiskScore >= 40 && highRiskSuppliers <= 2) overallHealth = 'fair';
    else overallHealth = 'poor';

    const keyIssues: string[] = [];
    if (highRiskSuppliers > 0) {
      keyIssues.push(`${highRiskSuppliers} high-risk suppliers identified`);
    }
    if (avgRiskScore < 60) {
      keyIssues.push('Average supplier risk score below optimal threshold');
    }
    if (store.riskScore < 60) {
      keyIssues.push('Store risk score indicates operational concerns');
    }

    const recommendations: string[] = [];
    if (highRiskSuppliers > 0) {
      recommendations.push('Implement supplier risk mitigation strategies');
    }
    if (avgRiskScore < 60) {
      recommendations.push('Review and optimize supplier selection criteria');
    }
    if (store.riskScore < 60) {
      recommendations.push('Address store-level operational issues');
    }

    const riskTrend: 'improving' | 'stable' | 'declining' = 
      avgRiskScore > 70 ? 'improving' : avgRiskScore > 50 ? 'stable' : 'declining';

    const costSavings = totalContractValue * 0.15; // 15% potential savings
    const efficiencyScore = Math.min(100, Math.max(0, avgRiskScore + (100 - store.riskScore) / 2));

    return {
      overallHealth,
      keyIssues,
      recommendations,
      riskTrend,
      costSavings,
      efficiencyScore
    };
  };

  const generateReports = (store: Store, storeSuppliers: Supplier[]) => {
    const avgRiskScore = storeSuppliers.reduce((sum, s) => sum + s.riskScore, 0) / storeSuppliers.length;
    const totalContractValue = storeSuppliers.reduce((sum, s) => sum + s.contractValue, 0);

    return [
      {
        id: 'risk-assessment-1',
        title: 'Supplier Risk Assessment Report',
        type: 'risk-assessment' as const,
        generatedAt: new Date().toISOString(),
        status: 'completed' as const,
        summary: `Comprehensive risk analysis of ${storeSuppliers.length} suppliers with average risk score of ${avgRiskScore.toFixed(1)}/100.`,
        keyMetrics: {
          'Average Risk Score': avgRiskScore,
          'High Risk Suppliers': storeSuppliers.filter(s => s.riskScore <= 30).length,
          'Total Suppliers': storeSuppliers.length
        }
      },
      {
        id: 'performance-1',
        title: 'Store Performance Analysis',
        type: 'performance' as const,
        generatedAt: new Date().toISOString(),
        status: 'completed' as const,
        summary: `Performance evaluation showing ${store.riskScore.toFixed(1)}/100 risk score with ₹${store.monthlyRevenue.toLocaleString()} monthly revenue.`,
        keyMetrics: {
          'Store Risk Score': store.riskScore,
          'Monthly Revenue': store.monthlyRevenue,
          'Customer Count': store.customerCount
        }
      },
      {
        id: 'financial-1',
        title: 'Financial Impact Assessment',
        type: 'financial' as const,
        generatedAt: new Date().toISOString(),
        status: 'completed' as const,
        summary: `Financial analysis covering ₹${totalContractValue.toLocaleString()} in supplier contracts and operational costs.`,
        keyMetrics: {
          'Total Contract Value': totalContractValue,
          'Monthly Revenue': store.monthlyRevenue,
          'Revenue to Contract Ratio': parseFloat((store.monthlyRevenue / totalContractValue * 12 * 100).toFixed(1))
        }
      }
    ];
  };

  const generateSupplierAnalytics = (storeSuppliers: Supplier[]) => {
    const categoryBreakdown: { [key: string]: number } = {};
    const performanceTrends: { [key: string]: 'improving' | 'stable' | 'declining' } = {};
    
    storeSuppliers.forEach(supplier => {
      categoryBreakdown[supplier.category] = (categoryBreakdown[supplier.category] || 0) + 1;
      performanceTrends[supplier.id] = supplier.performanceTrend;
    });

    return {
      totalSuppliers: storeSuppliers.length,
      highRiskSuppliers: storeSuppliers.filter(s => s.riskScore <= 30).length,
      averageRiskScore: storeSuppliers.reduce((sum, s) => sum + s.riskScore, 0) / storeSuppliers.length,
      totalContractValue: storeSuppliers.reduce((sum, s) => sum + s.contractValue, 0),
      categoryBreakdown,
      performanceTrends
    };
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score <= 30) return 'high';
    if (score <= 70) return 'medium';
    return 'low';
  };

  const getRiskColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading store details...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700">Store not found</p>
          <Button onClick={() => navigate('/map')} className="mt-4">
            Back to Map
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/map')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Map
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{store.name}</h1>
              <p className="text-gray-600 mt-2 text-lg">
                {store.type} • {store.address}
              </p>
            </div>
            <Badge className={getHealthColor(store.aiSummary.overallHealth)}>
              {store.aiSummary.overallHealth.toUpperCase()} HEALTH
            </Badge>
          </div>
        </div>

        {/* AI Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 AI Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Overall Health</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={getHealthColor(store.aiSummary.overallHealth)}>
                      {store.aiSummary.overallHealth}
                    </Badge>
                    {store.aiSummary.riskTrend === 'improving' && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {store.aiSummary.riskTrend === 'declining' && <TrendingDown className="h-4 w-4 text-red-600" />}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Efficiency Score</h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {store.aiSummary.efficiencyScore.toFixed(1)}/100
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Issues</h3>
                <div className="space-y-2">
                  {store.aiSummary.keyIssues.length > 0 ? (
                    store.aiSummary.keyIssues.map((issue, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span>{issue}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>No critical issues identified</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Recommendations</h3>
                <div className="space-y-2">
                  {store.aiSummary.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers ({store.supplierAnalytics.totalSuppliers})</TabsTrigger>
            <TabsTrigger value="reports">Reports ({store.reports.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold">₹{store.monthlyRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Customers</p>
                      <p className="text-2xl font-bold">{store.customerCount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Package className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Suppliers</p>
                      <p className="text-2xl font-bold">{store.supplierAnalytics.totalSuppliers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">Risk Score</p>
                      <p className="text-2xl font-bold">{store.riskScore.toFixed(1)}/100</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Store Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Store Type</p>
                      <p className="font-medium">{store.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Size</p>
                      <p className="font-medium">{store.size}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Region</p>
                      <p className="font-medium">{store.region}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Manager</p>
                      <p className="font-medium">{store.manager}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{store.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{store.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{store.openingHours}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Supplier Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Suppliers</p>
                      <p className="text-xl font-bold">{store.supplierAnalytics.totalSuppliers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">High Risk</p>
                      <p className="text-xl font-bold text-red-600">{store.supplierAnalytics.highRiskSuppliers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Risk Score</p>
                      <p className="text-xl font-bold">{store.supplierAnalytics.averageRiskScore.toFixed(1)}/100</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contract Value</p>
                      <p className="text-xl font-bold">₹{store.supplierAnalytics.totalContractValue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suppliers.map((supplier) => (
                    <Card key={supplier.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                          <Badge className={getRiskColor(getRiskLevel(supplier.riskScore))}>
                            {supplier.riskScore.toFixed(1)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Category:</span>
                            <span className="font-medium">{supplier.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Performance:</span>
                            <span className="font-medium">{supplier.performanceTrend}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Contract:</span>
                            <span className="font-medium">₹{supplier.contractValue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Products:</span>
                            <span className="font-medium">{supplier.products.length} items</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {store.reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.type}</Badge>
                      <Badge className={report.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {report.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{report.summary}</p>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Key Metrics:</h4>
                      {Object.entries(report.keyMetrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Generated: {new Date(report.generatedAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Supplier Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(store.supplierAnalytics.categoryBreakdown).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category}</span>
                        <Badge variant="outline">{count} suppliers</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(store.supplierAnalytics.performanceTrends).map(([supplierId, trend]) => {
                      const supplier = suppliers.find(s => s.id === supplierId);
                      return (
                        <div key={supplierId} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{supplier?.name || supplierId}</span>
                          <Badge className={
                            trend === 'improving' ? 'bg-green-100 text-green-800' :
                            trend === 'stable' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {trend}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StoreDetails;
