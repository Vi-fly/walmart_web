import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadMockData } from '@/data/mockData';
import { Store, Supplier } from '@/types';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Shield,
  Leaf,
  Star,
  BarChart3,
  Target,
  Zap,
  Award
} from 'lucide-react';

interface ComparisonMetric {
  label: string;
  current: number;
  alternative: number;
  unit?: string;
  higherIsBetter: boolean;
  icon: React.ReactNode;
}

const SupplierComparison: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [currentSuppliers, setCurrentSuppliers] = useState<Supplier[]>([]);
  const [alternativeSuppliers, setAlternativeSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadComparisonData();
  }, [storeId]);

  const loadComparisonData = async () => {
    try {
      setIsLoading(true);
      const { mockStores, mockSuppliers } = await loadMockData();
      
      const selectedStore = mockStores.find(s => s.id === storeId);
      if (!selectedStore) {
        navigate('/map');
        return;
      }

      const storeSuppliers = mockSuppliers.filter(s => 
        selectedStore.suppliers.includes(s.id)
      );

      // Load alternative suppliers
      const response = await fetch('/walmart_us_alternate_suppliers.json');
      const data = await response.json();
      
      const alternativeData = data.alternateSuppliers
        .filter((alt: any) => alt.storeId === storeId)
        .slice(0, 5)
        .map((alt: any, index: number) => ({
          id: `alt-${alt.storeId}-${index}`,
          name: alt.name || `Alternative Supplier ${index + 1}`,
          products: alt.supplies,
          coordinates: [alt.longitude, alt.latitude],
          category: alt.clusterId || 'Local Consumption',
          riskScore: alt.parameters.riskScore,
          riskBreakdown: {
            financial: Math.max(0, Math.min(10, alt.parameters.riskScore / 10)),
            quality: Math.max(0, Math.min(10, (100 - alt.parameters.productQuality) / 10)),
            delivery: Math.max(0, Math.min(10, alt.parameters.riskScore / 12)),
            compliance: Math.max(0, Math.min(10, alt.parameters.riskScore / 15)),
            sustainability: Math.max(0, Math.min(10, (100 - (alt.parameters.sustainabilityScore || 70)) / 10)),
            customerFeedback: Math.max(0, Math.min(10, alt.parameters.riskScore / 8))
          },
          sustainabilityScore: alt.parameters.sustainabilityScore || 70,
          carbonFootprint: alt.parameters.carbonFootprint,
          packagingQuality: alt.parameters.packagingQuality,
          localRelevance: alt.parameters.localRelevance,
          productQuality: alt.parameters.productQuality,
          availability: alt.parameters.availability,
          profitMargin: alt.parameters.profitMargin,
          brandRecognition: alt.parameters.brandRecognition,
          deliveryRadius: Math.floor(Math.random() * 100) + 50,
          monthlyVolume: Math.floor(Math.random() * 10000) + 1000,
          contractValue: Math.floor(Math.random() * 500000) + 50000,
          certifications: ['ISO 9001', 'HACCP', 'Organic Certified'],
          lastAudit: '2024-06-15',
          performanceTrend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)] as any,
          contact: {
            name: `${alt.name} Manager`,
            email: `contact@${alt.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
          },
          address: `${alt.name} Headquarters`,
          establishedYear: Math.floor(Math.random() * 30) + 1990,
          employeeCount: Math.floor(Math.random() * 500) + 50,
        }));

      setStore(selectedStore);
      setCurrentSuppliers(storeSuppliers);
      setAlternativeSuppliers(alternativeData);
    } catch (error) {
      console.error('Failed to load comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAverageMetrics = (suppliers: Supplier[]) => {
    if (suppliers.length === 0) return null;

    return {
      riskScore: suppliers.reduce((sum, s) => sum + s.riskScore, 0) / suppliers.length,
      sustainabilityScore: suppliers.reduce((sum, s) => sum + (s.sustainabilityScore || 70), 0) / suppliers.length,
      productQuality: suppliers.reduce((sum, s) => sum + (s.productQuality || 75), 0) / suppliers.length,
      profitMargin: suppliers.reduce((sum, s) => sum + (s.profitMargin || 15), 0) / suppliers.length,
      contractValue: suppliers.reduce((sum, s) => sum + s.contractValue, 0),
      deliveryReliability: 85 + Math.random() * 10,
      complianceScore: suppliers.reduce((sum, s) => sum + (10 - s.riskBreakdown.compliance), 0) / suppliers.length,
      brandRecognition: suppliers.reduce((sum, s) => sum + (s.brandRecognition || 50), 0) / suppliers.length
    };
  };

  const currentMetrics = calculateAverageMetrics(currentSuppliers);
  const alternativeMetrics = calculateAverageMetrics(alternativeSuppliers);

  const comparisonMetrics: ComparisonMetric[] = [
    {
      label: 'Risk Score',
      current: currentMetrics?.riskScore || 0,
      alternative: alternativeMetrics?.riskScore || 0,
      unit: '/100',
      higherIsBetter: true,
      icon: <Shield className="h-4 w-4" />
    },
    {
      label: 'Sustainability',
      current: currentMetrics?.sustainabilityScore || 0,
      alternative: alternativeMetrics?.sustainabilityScore || 0,
      unit: '/100',
      higherIsBetter: true,
      icon: <Leaf className="h-4 w-4" />
    },
    {
      label: 'Product Quality',
      current: currentMetrics?.productQuality || 0,
      alternative: alternativeMetrics?.productQuality || 0,
      unit: '/100',
      higherIsBetter: true,
      icon: <Star className="h-4 w-4" />
    },
    {
      label: 'Profit Margin',
      current: currentMetrics?.profitMargin || 0,
      alternative: alternativeMetrics?.profitMargin || 0,
      unit: '%',
      higherIsBetter: true,
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      label: 'Delivery Reliability',
      current: currentMetrics?.deliveryReliability || 0,
      alternative: alternativeMetrics?.deliveryReliability || 0,
      unit: '%',
      higherIsBetter: true,
      icon: <Target className="h-4 w-4" />
    },
    {
      label: 'Compliance Score',
      current: currentMetrics?.complianceScore || 0,
      alternative: alternativeMetrics?.complianceScore || 0,
      unit: '/10',
      higherIsBetter: true,
      icon: <Award className="h-4 w-4" />
    }
  ];

  const getPerformanceIndicator = (current: number, alternative: number, higherIsBetter: boolean) => {
    const difference = alternative - current;
    const isImprovement = higherIsBetter ? difference > 0 : difference < 0;
    const percentChange = Math.abs((difference / current) * 100);

    return {
      isImprovement,
      difference: Math.abs(difference),
      percentChange,
      icon: isImprovement ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4 mx-auto"></div>
          <p className="text-xl font-semibold text-gray-700">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/map')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Map
          </Button>
          
          <div className="bg-white rounded-lg p-6 shadow-lg border-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Performance Comparison</h1>
                <p className="text-gray-600">{store.name} - Current vs Alternative Suppliers Analysis</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {store.type}
                </Badge>
                <Badge className="bg-green-100 text-green-800 border border-green-200">
                  <DollarSign className="h-3 w-3 mr-1" />
                  ₹{store.monthlyRevenue.toLocaleString()}/mo
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Current Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">{currentSuppliers.length}</div>
              <p className="text-sm text-gray-600">Active partnerships</p>
              <div className="mt-3">
                <div className="text-sm text-gray-500">Total Contract Value</div>
                <div className="text-lg font-semibold">₹{currentMetrics?.contractValue.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Alternative Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-2">{alternativeSuppliers.length}</div>
              <p className="text-sm text-gray-600">Potential partners</p>
              <div className="mt-3">
                <div className="text-sm text-gray-500">Estimated Contract Value</div>
                <div className="text-lg font-semibold">₹{alternativeMetrics?.contractValue.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">Improvement Potential</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {comparisonMetrics.filter(m => {
                  const indicator = getPerformanceIndicator(m.current, m.alternative, m.higherIsBetter);
                  return indicator.isImprovement;
                }).length}
              </div>
              <p className="text-sm text-gray-600">Metrics showing improvement</p>
              <div className="mt-3">
                <div className="text-sm text-gray-500">Potential Cost Savings</div>
                <div className="text-lg font-semibold text-green-600">₹{Math.floor(Math.random() * 500000 + 100000).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Comparison */}
        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="metrics" className="data-[state=active]:bg-blue-50">
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance Metrics
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="data-[state=active]:bg-blue-50">
              <Target className="h-4 w-4 mr-2" />
              Supplier Details
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-blue-50">
              <Zap className="h-4 w-4 mr-2" />
              Impact Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-6">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Performance Comparison Matrix</CardTitle>
                <p className="text-gray-600">Side-by-side analysis of key performance indicators</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {comparisonMetrics.map((metric, index) => {
                    const indicator = getPerformanceIndicator(metric.current, metric.alternative, metric.higherIsBetter);
                    
                    return (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {metric.icon}
                            <span className="font-semibold text-gray-900">{metric.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {indicator.icon}
                            <Badge className={indicator.isImprovement ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {indicator.isImprovement ? '+' : '-'}{indicator.percentChange.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Current Suppliers</div>
                            <div className="flex items-center gap-2">
                              <div className="text-2xl font-bold text-blue-600">
                                {metric.current.toFixed(1)}{metric.unit}
                              </div>
                              <Progress value={(metric.current / (metric.unit === '/100' ? 100 : metric.unit === '/10' ? 10 : 100)) * 100} className="flex-1" />
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Alternative Suppliers</div>
                            <div className="flex items-center gap-2">
                              <div className="text-2xl font-bold text-purple-600">
                                {metric.alternative.toFixed(1)}{metric.unit}
                              </div>
                              <Progress value={(metric.alternative / (metric.unit === '/100' ? 100 : metric.unit === '/10' ? 10 : 100)) * 100} className="flex-1" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-sm text-gray-600">
                          Difference: {indicator.difference.toFixed(1)}{metric.unit} 
                          {indicator.isImprovement ? ' improvement' : ' decline'} with alternative suppliers
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-blue-700">Current Suppliers</CardTitle>
                  <p className="text-gray-600">Active supplier partnerships</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentSuppliers.slice(0, 5).map((supplier, index) => (
                      <div key={index} className="p-3 border rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{supplier.name}</span>
                          <Badge className={supplier.riskScore > 70 ? 'bg-green-100 text-green-800' : supplier.riskScore > 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                            {supplier.riskScore.toFixed(1)}/100
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {supplier.category} • ₹{supplier.contractValue.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {supplier.products.slice(0, 3).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-purple-700">Alternative Suppliers</CardTitle>
                  <p className="text-gray-600">Potential new partnerships</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alternativeSuppliers.slice(0, 5).map((supplier, index) => (
                      <div key={index} className="p-3 border rounded-lg hover:bg-purple-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{supplier.name}</span>
                          <Badge className={supplier.riskScore > 70 ? 'bg-green-100 text-green-800' : supplier.riskScore > 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                            {supplier.riskScore.toFixed(1)}/100
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {supplier.category} • ₹{supplier.contractValue.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {supplier.products.slice(0, 3).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Key Advantages</CardTitle>
                  <p className="text-gray-600">Benefits of switching to alternative suppliers</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comparisonMetrics
                      .filter(m => getPerformanceIndicator(m.current, m.alternative, m.higherIsBetter).isImprovement)
                      .map((metric, index) => {
                        const indicator = getPerformanceIndicator(metric.current, metric.alternative, metric.higherIsBetter);
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-green-800">{metric.label} Improvement</div>
                              <div className="text-sm text-green-700">
                                {indicator.percentChange.toFixed(1)}% better performance expected
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Risk Considerations</CardTitle>
                  <p className="text-gray-600">Areas requiring attention during transition</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comparisonMetrics
                      .filter(m => !getPerformanceIndicator(m.current, m.alternative, m.higherIsBetter).isImprovement)
                      .map((metric, index) => {
                        const indicator = getPerformanceIndicator(metric.current, metric.alternative, metric.higherIsBetter);
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-yellow-800">{metric.label} Concern</div>
                              <div className="text-sm text-yellow-700">
                                {indicator.percentChange.toFixed(1)}% decline - requires mitigation strategy
                              </div>
                            </div>
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

export default SupplierComparison;
