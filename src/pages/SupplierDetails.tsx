import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadMockData } from '@/data/mockData';
import type { Store, Supplier } from '@/types';
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, DollarSign, Mail, MapPin, Package, Phone, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface SupplierDetailsData extends Supplier {
  aiAnalysis: {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    keyStrengths: string[];
    keyIssues: string[];
    recommendations: string[];
    riskTrend: 'improving' | 'stable' | 'declining';
    marketPosition: 'leader' | 'strong' | 'average' | 'weak';
    growthPotential: number;
  };
  reports: {
    id: string;
    title: string;
    type: 'risk-assessment' | 'performance' | 'financial' | 'compliance' | 'sustainability';
    generatedAt: string;
    status: 'completed' | 'pending' | 'failed';
    summary: string;
    keyMetrics: { [key: string]: number };
  }[];
  connectedStores: Store[];
  performanceHistory: {
    month: string;
    riskScore: number;
    performanceScore: number;
    contractValue: number;
    deliveryOnTime: number;
    qualityScore: number;
  }[];
}

const SupplierDetails = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<SupplierDetailsData | null>(null);
  const [connectedStores, setConnectedStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSupplierData = async () => {
      try {
        const { mockStores, mockSuppliers } = await loadMockData();
        const foundSupplier = mockSuppliers.find(s => s.id === supplierId);
        
        if (!foundSupplier) {
          navigate('/map');
          return;
        }

        // Get connected stores for this supplier
        const stores = mockStores.filter(store => store.suppliers.includes(foundSupplier.id));
        
        // Generate AI analysis and analytics
        const aiAnalysis = generateAIAnalysis(foundSupplier, stores);
        const reports = generateReports(foundSupplier, stores);
        const performanceHistory = generatePerformanceHistory(foundSupplier);

        const supplierWithDetails: SupplierDetailsData = {
          ...foundSupplier,
          aiAnalysis,
          reports,
          connectedStores: stores,
          performanceHistory
        };

        setSupplier(supplierWithDetails);
        setConnectedStores(stores);
      } catch (error) {
        console.error('Failed to load supplier data:', error);
        navigate('/map');
      } finally {
        setIsLoading(false);
      }
    };

    loadSupplierData();
  }, [supplierId, navigate]);

  const generateAIAnalysis = (supplier: Supplier, connectedStores: Store[]) => {
    const avgStoreRisk = connectedStores.reduce((sum, s) => sum + s.riskScore, 0) / connectedStores.length;
    const totalContractValue = supplier.contractValue;
    const riskLevel = getRiskLevel(supplier.riskScore);

    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    if (supplier.riskScore >= 80 && supplier.performanceTrend === 'improving') overallHealth = 'excellent';
    else if (supplier.riskScore >= 60 && supplier.performanceTrend !== 'declining') overallHealth = 'good';
    else if (supplier.riskScore >= 40) overallHealth = 'fair';
    else overallHealth = 'poor';

    const keyStrengths: string[] = [];
    if (supplier.sustainabilityScore && supplier.sustainabilityScore >= 80) {
      keyStrengths.push('Excellent sustainability practices');
    }
    if (supplier.productQuality && supplier.productQuality >= 90) {
      keyStrengths.push('High product quality standards');
    }
    if (supplier.profitMargin && supplier.profitMargin >= 20) {
      keyStrengths.push('Strong profit margins');
    }
    if (supplier.brandRecognition && supplier.brandRecognition >= 80) {
      keyStrengths.push('Strong brand recognition');
    }

    const keyIssues: string[] = [];
    if (supplier.riskScore <= 30) {
      keyIssues.push('High risk score requires immediate attention');
    }
    if (supplier.performanceTrend === 'declining') {
      keyIssues.push('Performance trend is declining');
    }
    if (avgStoreRisk > 70) {
      keyIssues.push('Connected stores have high risk scores');
    }

    const recommendations: string[] = [];
    if (supplier.riskScore <= 30) {
      recommendations.push('Implement comprehensive risk mitigation strategies');
    }
    if (supplier.performanceTrend === 'declining') {
      recommendations.push('Review operational processes and quality control');
    }
    if (supplier.sustainabilityScore && supplier.sustainabilityScore < 60) {
      recommendations.push('Enhance sustainability practices and certifications');
    }

    const riskTrend: 'improving' | 'stable' | 'declining' = supplier.performanceTrend;
    
    const marketPosition: 'leader' | 'strong' | 'average' | 'weak' = 
      supplier.riskScore >= 80 ? 'leader' : 
      supplier.riskScore >= 60 ? 'strong' : 
      supplier.riskScore >= 40 ? 'average' : 'weak';

    const growthPotential = Math.min(100, Math.max(0, 
      (supplier.riskScore * 0.4) + 
      ((supplier.sustainabilityScore || 70) * 0.2) + 
      ((supplier.productQuality || 75) * 0.2) + 
      ((supplier.brandRecognition || 50) * 0.2)
    ));

    return {
      overallHealth,
      keyStrengths,
      keyIssues,
      recommendations,
      riskTrend,
      marketPosition,
      growthPotential
    };
  };

  const generateReports = (supplier: Supplier, connectedStores: Store[]) => {
    const avgStoreRisk = connectedStores.reduce((sum, s) => sum + s.riskScore, 0) / connectedStores.length;

    return [
      {
        id: 'supplier-risk-1',
        title: 'Supplier Risk Assessment',
        type: 'risk-assessment' as const,
        generatedAt: new Date().toISOString(),
        status: 'completed' as const,
        summary: `Comprehensive risk analysis showing ${supplier.riskScore.toFixed(1)}/100 risk score with ${connectedStores.length} connected stores.`,
        keyMetrics: {
          'Risk Score': supplier.riskScore,
          'Connected Stores': connectedStores.length,
          'Average Store Risk': avgStoreRisk,
          'Contract Value': supplier.contractValue
        }
      },
      {
        id: 'performance-1',
        title: 'Performance Analysis',
        type: 'performance' as const,
        generatedAt: new Date().toISOString(),
        status: 'completed' as const,
        summary: `Performance evaluation showing ${supplier.performanceTrend} trend with ${supplier.products.length} products.`,
        keyMetrics: {
          'Performance Trend': supplier.performanceTrend === 'improving' ? 85 : supplier.performanceTrend === 'stable' ? 70 : 55,
          'Product Count': supplier.products.length,
          'Delivery Radius': supplier.deliveryRadius,
          'Employee Count': supplier.employeeCount
        }
      },
      {
        id: 'sustainability-1',
        title: 'Sustainability Assessment',
        type: 'sustainability' as const,
        generatedAt: new Date().toISOString(),
        status: 'completed' as const,
        summary: `Sustainability analysis covering environmental impact and compliance standards.`,
        keyMetrics: {
          'Sustainability Score': supplier.sustainabilityScore || 70,
          'Carbon Footprint': supplier.carbonFootprint || 0.1,
          'Certifications': supplier.certifications.length,
          'Compliance Score': supplier.riskBreakdown.compliance
        }
      }
    ];
  };

  const generatePerformanceHistory = (supplier: Supplier) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      riskScore: Math.max(0, Math.min(100, supplier.riskScore + (Math.random() - 0.5) * 10)),
      performanceScore: Math.max(0, Math.min(100, (supplier.sustainabilityScore || 70) + (Math.random() - 0.5) * 15)),
      contractValue: supplier.contractValue + (Math.random() - 0.5) * 50000,
      deliveryOnTime: Math.max(0, Math.min(100, 85 + (Math.random() - 0.5) * 20)),
      qualityScore: Math.max(0, Math.min(100, (supplier.productQuality || 75) + (Math.random() - 0.5) * 10))
    }));
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

  const getMarketPositionColor = (position: string) => {
    switch (position) {
      case 'leader': return 'bg-purple-100 text-purple-800';
      case 'strong': return 'bg-green-100 text-green-800';
      case 'average': return 'bg-yellow-100 text-yellow-800';
      case 'weak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading supplier details...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700">Supplier not found</p>
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
              <h1 className="text-4xl font-bold text-gray-900">{supplier.name}</h1>
              <p className="text-gray-600 mt-2 text-lg">
                {supplier.category} • {supplier.address}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={getHealthColor(supplier.aiAnalysis.overallHealth)}>
                {supplier.aiAnalysis.overallHealth.toUpperCase()} HEALTH
              </Badge>
              <Badge className={getMarketPositionColor(supplier.aiAnalysis.marketPosition)}>
                {supplier.aiAnalysis.marketPosition.toUpperCase()} POSITION
              </Badge>
            </div>
          </div>
        </div>

        {/* AI Analysis Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤖 AI Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Overall Health</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={getHealthColor(supplier.aiAnalysis.overallHealth)}>
                      {supplier.aiAnalysis.overallHealth}
                    </Badge>
                    {supplier.aiAnalysis.riskTrend === 'improving' && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {supplier.aiAnalysis.riskTrend === 'declining' && <TrendingDown className="h-4 w-4 text-red-600" />}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Growth Potential</h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {supplier.aiAnalysis.growthPotential.toFixed(1)}/100
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Strengths</h3>
                <div className="space-y-2">
                  {supplier.aiAnalysis.keyStrengths.length > 0 ? (
                    supplier.aiAnalysis.keyStrengths.map((strength, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{strength}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No significant strengths identified</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Issues</h3>
                <div className="space-y-2">
                  {supplier.aiAnalysis.keyIssues.length > 0 ? (
                    supplier.aiAnalysis.keyIssues.map((issue, index) => (
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
                  {supplier.aiAnalysis.recommendations.map((rec, index) => (
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
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="reports">Reports ({supplier.reports.length})</TabsTrigger>
            <TabsTrigger value="stores">Connected Stores ({connectedStores.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Contract Value</p>
                      <p className="text-2xl font-bold">₹{supplier.contractValue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Products</p>
                      <p className="text-2xl font-bold">{supplier.products.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Employees</p>
                      <p className="text-2xl font-bold">{supplier.employeeCount}</p>
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
                      <p className="text-2xl font-bold">{supplier.riskScore.toFixed(1)}/100</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Supplier Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="font-medium">{supplier.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Established</p>
                      <p className="font-medium">{supplier.establishedYear}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Performance</p>
                      <p className="font-medium">{supplier.performanceTrend}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Delivery Radius</p>
                      <p className="font-medium">{supplier.deliveryRadius} km</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{supplier.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{supplier.contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{supplier.contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Last Audit: {supplier.lastAudit}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Sustainability</p>
                      <p className="text-xl font-bold">{supplier.sustainabilityScore || 'N/A'}/100</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Product Quality</p>
                      <p className="text-xl font-bold">{supplier.productQuality || 'N/A'}/100</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Profit Margin</p>
                      <p className="text-xl font-bold">{supplier.profitMargin || 'N/A'}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Brand Recognition</p>
                      <p className="text-xl font-bold">{supplier.brandRecognition || 'N/A'}/100</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-1">
                      {supplier.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance History (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supplier.performanceHistory.map((month, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900">{month.month}</h3>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Risk Score:</span>
                            <span className="font-medium">{month.riskScore.toFixed(1)}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Performance:</span>
                            <span className="font-medium">{month.performanceScore.toFixed(1)}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery:</span>
                            <span className="font-medium">{month.deliveryOnTime.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quality:</span>
                            <span className="font-medium">{month.qualityScore.toFixed(1)}/100</span>
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
              {supplier.reports.map((report) => (
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

          {/* Connected Stores Tab */}
          <TabsContent value="stores" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Stores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connectedStores.map((store) => (
                    <Card key={store.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-900">{store.name}</h3>
                          <Badge className={getRiskColor(getRiskLevel(store.riskScore))}>
                            {store.riskScore.toFixed(1)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-medium">{store.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Revenue:</span>
                            <span className="font-medium">₹{store.monthlyRevenue.toLocaleString()}/mo</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Customers:</span>
                            <span className="font-medium">{store.customerCount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span className="font-medium">{store.location}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SupplierDetails; 