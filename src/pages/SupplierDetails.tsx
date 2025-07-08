import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { loadMockData } from '@/data/mockData';
import type { Store, Supplier } from '@/types';
import { 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Mail, 
  MapPin, 
  Package, 
  Phone, 
  TrendingDown, 
  TrendingUp, 
  Users,
  Building2,
  Bot,
  Zap,
  Star,
  Shield,
  Award,
  Calendar,
  FileText,
  BarChart3,
  Globe,
  Truck,
  Factory,
  MessageCircle,
  Timer,
  Target
} from 'lucide-react';
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
    industryRank: number;
    certificationLevel: 'platinum' | 'gold' | 'silver' | 'bronze';
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
  businessPartners: {
    id: string;
    name: string;
    type: 'retail' | 'wholesale' | 'e-commerce' | 'restaurant' | 'industrial';
    relationship: 'primary' | 'secondary' | 'potential';
    contractValue: number;
    duration: string;
    performance: number;
    logo?: string;
  }[];
  performanceHistory: {
    month: string;
    riskScore: number;
    performanceScore: number;
    contractValue: number;
    deliveryOnTime: number;
    qualityScore: number;
  }[];
  isAlternative: boolean;
  aiContactStatus?: 'idle' | 'contacting' | 'completed' | 'failed';
}

const SupplierDetails = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<SupplierDetailsData | null>(null);
  const [connectedStores, setConnectedStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiContactStatus, setAiContactStatus] = useState<'idle' | 'contacting' | 'completed' | 'failed'>('idle');

  useEffect(() => {
    const loadSupplierData = async () => {
      try {
        const { mockStores, mockSuppliers } = await loadMockData();
        let foundSupplier = mockSuppliers.find(s => s.id === supplierId);
        
        // If not found in main suppliers, check alternative suppliers
        if (!foundSupplier && supplierId?.startsWith('alt-')) {
          try {
            const response = await fetch('/walmart_us_alternate_suppliers.json');
            const data = await response.json();
            const altSupplierData = data.alternateSuppliers.find((alt: any) => 
              `alt-${alt.storeId}-${data.alternateSuppliers.indexOf(alt)}` === supplierId
            );
            
            if (altSupplierData) {
              // Transform alternative supplier data to match Supplier interface
              foundSupplier = {
                id: supplierId,
                name: altSupplierData.name || `Alternative Supplier`,
                products: altSupplierData.supplies,
                coordinates: [altSupplierData.longitude, altSupplierData.latitude],
                category: altSupplierData.clusterId || 'Local Consumption',
                riskScore: altSupplierData.parameters.riskScore,
                riskBreakdown: {
                  financial: Math.max(0, Math.min(10, altSupplierData.parameters.riskScore / 10)),
                  quality: Math.max(0, Math.min(10, (100 - altSupplierData.parameters.productQuality) / 10)),
                  delivery: Math.max(0, Math.min(10, altSupplierData.parameters.riskScore / 12)),
                  compliance: Math.max(0, Math.min(10, altSupplierData.parameters.riskScore / 15)),
                  sustainability: Math.max(0, Math.min(10, (100 - (altSupplierData.parameters.sustainabilityScore || 70)) / 10)),
                  customerFeedback: Math.max(0, Math.min(10, altSupplierData.parameters.riskScore / 8))
                },
                sustainabilityScore: altSupplierData.parameters.sustainabilityScore || 70,
                carbonFootprint: altSupplierData.parameters.carbonFootprint,
                packagingQuality: altSupplierData.parameters.packagingQuality,
                localRelevance: altSupplierData.parameters.localRelevance,
                productQuality: altSupplierData.parameters.productQuality,
                availability: altSupplierData.parameters.availability,
                profitMargin: altSupplierData.parameters.profitMargin,
                brandRecognition: altSupplierData.parameters.brandRecognition,
                deliveryRadius: Math.floor(Math.random() * 100) + 50,
                monthlyVolume: Math.floor(Math.random() * 10000) + 1000,
                contractValue: Math.floor(Math.random() * 500000) + 50000,
                certifications: ['ISO 9001', 'HACCP', 'Organic Certified'],
                lastAudit: '2024-06-15',
                performanceTrend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)] as any,
                contact: {
                  name: `${altSupplierData.name} Manager`,
                  email: `contact@${altSupplierData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
                  phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
                },
                address: `${altSupplierData.name} Headquarters`,
                establishedYear: Math.floor(Math.random() * 30) + 1990,
                employeeCount: Math.floor(Math.random() * 500) + 50,
              } as Supplier;
            }
          } catch (error) {
            console.error('Failed to load alternative supplier data:', error);
          }
        }
        
        if (!foundSupplier) {
          navigate('/map');
          return;
        }

        // Get connected stores for this supplier
        const stores = mockStores.filter(store => store.suppliers.includes(foundSupplier.id));
        
        // Generate AI analysis, business partners, and analytics
        const aiAnalysis = generateAIAnalysis(foundSupplier, stores);
        const reports = generateReports(foundSupplier, stores);
        const performanceHistory = generatePerformanceHistory(foundSupplier);
        const businessPartners = generateBusinessPartners(foundSupplier);
        const isAlternative = supplierId?.startsWith('alt-') || false;

        const supplierWithDetails: SupplierDetailsData = {
          ...foundSupplier,
          aiAnalysis,
          reports,
          businessPartners,
          performanceHistory,
          isAlternative
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
    
    const industryRank = Math.floor(Math.random() * 100) + 1;
    const certificationLevel: 'platinum' | 'gold' | 'silver' | 'bronze' = 
      supplier.riskScore >= 90 ? 'platinum' :
      supplier.riskScore >= 75 ? 'gold' :
      supplier.riskScore >= 60 ? 'silver' : 'bronze';

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
      growthPotential,
      industryRank,
      certificationLevel
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

  const generateBusinessPartners = (supplier: Supplier) => {
    const companyTypes = ['retail', 'wholesale', 'e-commerce', 'restaurant', 'industrial'] as const;
    const companies = [
      { name: 'Metro Cash & Carry', type: 'wholesale', logo: '🏪' },
      { name: 'Amazon India', type: 'e-commerce', logo: '📦' },
      { name: 'Reliance Retail', type: 'retail', logo: '🛒' },
      { name: 'BigBasket', type: 'e-commerce', logo: '🛍️' },
      { name: 'Spencer\'s Retail', type: 'retail', logo: '🏬' },
      { name: 'McDonald\'s India', type: 'restaurant', logo: '🍔' },
      { name: 'Tata Consumer Products', type: 'industrial', logo: '🏭' },
      { name: 'ITC Limited', type: 'industrial', logo: '🌾' },
      { name: 'Godrej Consumer Products', type: 'industrial', logo: '🧴' },
      { name: 'Flipkart', type: 'e-commerce', logo: '📱' }
    ];
    
    return companies.slice(0, Math.floor(Math.random() * 6) + 3).map((company, index) => ({
      id: `partner-${index}`,
      name: company.name,
      type: company.type,
      relationship: index === 0 ? 'primary' as const : index < 3 ? 'secondary' as const : 'potential' as const,
      contractValue: Math.floor(Math.random() * 2000000) + 500000,
      duration: `${Math.floor(Math.random() * 5) + 1} years`,
      performance: Math.floor(Math.random() * 30) + 70,
      logo: company.logo
    }));
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
  
  const getCertificationColor = (level: string) => {
    switch (level) {
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'bronze': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const handleAIContact = async () => {
    setAiContactStatus('contacting');
    
    // Simulate AI contacting supplier
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setAiContactStatus('completed');
      
      // Show success message after a delay
      setTimeout(() => {
        setAiContactStatus('idle');
      }, 5000);
    } catch (error) {
      setAiContactStatus('failed');
      setTimeout(() => {
        setAiContactStatus('idle');
      }, 3000);
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
        {/* Header with AI Contact */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/map')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Map
            </Button>
            
            {supplier?.isAlternative && (
              <Button 
                variant="default" 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg transition-all duration-200"
                onClick={handleAIContact}
                disabled={aiContactStatus === 'contacting'}
              >
                <Bot className="h-4 w-4 mr-2" />
                {aiContactStatus === 'idle' && 'Let AI Contact Supplier'}
                {aiContactStatus === 'contacting' && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Contacting...
                  </>
                )}
                {aiContactStatus === 'completed' && (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Contact Successful
                  </>
                )}
                {aiContactStatus === 'failed' && (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Retry Contact
                  </>
                )}
              </Button>
            )}
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">{supplier.name}</h1>
                {supplier.isAlternative && (
                  <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 text-sm px-3 py-2 border border-purple-200 shadow-sm">
                    <Zap className="h-3 w-3 mr-1" />
                    Alternative Supplier
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 mt-2 text-lg">
                {supplier.category} • {supplier.address}
              </p>
              {supplier.isAlternative && (
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-purple-800 font-medium">
                        Potential Alternative Supplier
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        This supplier offers competitive advantages and has been identified as a viable alternative for your supply chain optimization.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={`${getHealthColor(supplier.aiAnalysis.overallHealth)} shadow-sm border`}>
                <Shield className="h-3 w-3 mr-1" />
                {supplier.aiAnalysis.overallHealth.toUpperCase()} HEALTH
              </Badge>
              <Badge className={`${getMarketPositionColor(supplier.aiAnalysis.marketPosition)} shadow-sm border`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {supplier.aiAnalysis.marketPosition.toUpperCase()}
              </Badge>
              <Badge className={`${getCertificationColor(supplier.aiAnalysis.certificationLevel)} shadow-sm`}>
                <Award className="h-3 w-3 mr-1" />
                {supplier.aiAnalysis.certificationLevel.toUpperCase()}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
                <Star className="h-3 w-3 mr-1" />
                #{supplier.aiAnalysis.industryRank} in Industry
              </Badge>
            </div>
          </div>
        </div>

        {/* AI Analysis Card */}
        <Card className="mb-6 shadow-lg border-0 bg-gradient-to-br from-slate-50 to-gray-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Bot className="h-5 w-5 text-indigo-600" />
              AI-Powered Supplier Analysis
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive analysis powered by advanced AI algorithms
            </p>
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
          <TabsList className="grid w-full grid-cols-8 bg-gray-50 p-1 rounded-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="partners" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Building2 className="h-4 w-4 mr-1" />
              Partners
            </TabsTrigger>
            <TabsTrigger value="benefits" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Target className="h-4 w-4 mr-1" />
              Benefits
            </TabsTrigger>
            <TabsTrigger value="communication" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <MessageCircle className="h-4 w-4 mr-1" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="capacity" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Factory className="h-4 w-4 mr-1" />
              Capacity
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4 mr-1" />
              Reports ({supplier.reports.length})
            </TabsTrigger>
            <TabsTrigger value="stores" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Globe className="h-4 w-4 mr-1" />
              {supplier.isAlternative ? 'Network' : 'Stores'} ({connectedStores.length})
            </TabsTrigger>
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

          {/* Benefits Tab */}
          <TabsContent value="benefits" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Key Benefits & Value Propositions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <h4 className="font-semibold text-green-800">Cost Efficiency</h4>
                      </div>
                      <p className="text-sm text-green-700">
                        {supplier.profitMargin && supplier.profitMargin > 20 
                          ? `Excellent profit margins of ${supplier.profitMargin}% offering competitive pricing while maintaining quality standards.`
                          : 'Competitive pricing structure with potential for bulk discounts and long-term contract benefits.'}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold text-blue-800">Product Quality</h4>
                      </div>
                      <p className="text-sm text-blue-700">
                        {supplier.productQuality && supplier.productQuality > 85
                          ? `Superior product quality score of ${supplier.productQuality}/100 ensuring consistent customer satisfaction.`
                          : 'Reliable product quality with established quality control processes and certifications.'}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        <h4 className="font-semibold text-purple-800">Strategic Location</h4>
                      </div>
                      <p className="text-sm text-purple-700">
                        Located within {supplier.deliveryRadius}km delivery radius, enabling rapid fulfillment and reduced logistics costs.
                      </p>
                    </div>
                    
                    {supplier.sustainabilityScore && supplier.sustainabilityScore > 70 && (
                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <h4 className="font-semibold text-emerald-800">Sustainability Leadership</h4>
                        </div>
                        <p className="text-sm text-emerald-700">
                          High sustainability score of {supplier.sustainabilityScore}/100 supporting Walmart's environmental commitments and ESG goals.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Why Choose This Supplier?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Risk Mitigation</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={supplier.riskScore <= 30 ? 'bg-red-100 text-red-800' : supplier.riskScore <= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                          {supplier.riskScore <= 30 ? 'High Risk' : supplier.riskScore <= 70 ? 'Medium Risk' : 'Low Risk'}
                        </Badge>
                        <span className="text-sm text-gray-600">({supplier.riskScore.toFixed(1)}/100)</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">
                        {supplier.riskScore > 70 
                          ? 'Low risk profile ensures reliable supply chain continuity and minimal disruptions.'
                          : supplier.riskScore > 30
                          ? 'Moderate risk profile with identified mitigation strategies and monitoring protocols.'
                          : 'Higher risk profile requiring enhanced monitoring and contingency planning.'}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Track Record</h4>
                      <div className="flex items-center gap-2 mb-2">
                        {supplier.performanceTrend === 'improving' && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {supplier.performanceTrend === 'declining' && <TrendingDown className="h-4 w-4 text-red-600" />}
                        {supplier.performanceTrend === 'stable' && <Clock className="h-4 w-4 text-yellow-600" />}
                        <span className="font-medium capitalize">{supplier.performanceTrend} Performance</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        Established since {supplier.establishedYear} with {supplier.employeeCount} employees and proven market presence.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Certifications & Compliance</h4>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {supplier.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-700">
                        Fully certified and compliant with industry standards, last audited on {supplier.lastAudit}.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Primary Contact</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{supplier.contact.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{supplier.contact.phone}</span>
                          <Button size="sm" variant="outline" className="ml-auto">
                            Call Now
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{supplier.contact.email}</span>
                          <Button size="sm" variant="outline" className="ml-auto">
                            Send Email
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Business Hours</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monday - Friday:</span>
                          <span className="font-medium">8:00 AM - 6:00 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Saturday:</span>
                          <span className="font-medium">9:00 AM - 4:00 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sunday:</span>
                          <span className="font-medium">Closed</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Response Times</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email Response:</span>
                          <span className="font-medium">Within 4 hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quote Requests:</span>
                          <span className="font-medium">Same business day</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Emergency Contact:</span>
                          <span className="font-medium">24/7 hotline</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Location & Logistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Physical Address</h4>
                      <p className="text-sm text-gray-700">{supplier.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Coordinates: {supplier.coordinates[1].toFixed(4)}, {supplier.coordinates[0].toFixed(4)}
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">
                        View on Map
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Delivery Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service Radius:</span>
                          <span className="font-medium">{supplier.deliveryRadius} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Standard Delivery:</span>
                          <span className="font-medium">2-3 business days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Express Delivery:</span>
                          <span className="font-medium">Same day available</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Minimum Order:</span>
                          <span className="font-medium">₹50,000</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Preferred Communication</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Email (Primary)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Phone (Urgent)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">EDI Integration Available</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Capacity Tab */}
          <TabsContent value="capacity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Production & Stock Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Monthly Volume Capacity</h4>
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {supplier.monthlyVolume.toLocaleString()} units
                      </div>
                      <p className="text-sm text-blue-700">
                        Current utilization: {Math.floor(Math.random() * 40) + 60}% • Available capacity for new orders
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Product Categories & Stock</h4>
                      {supplier.products.slice(0, 5).map((product, index) => {
                        const stockLevel = Math.floor(Math.random() * 10000) + 1000;
                        const stockStatus = stockLevel > 5000 ? 'high' : stockLevel > 2000 ? 'medium' : 'low';
                        return (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{product}</span>
                              <Badge className={stockStatus === 'high' ? 'bg-green-100 text-green-800' : stockStatus === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                                {stockLevel.toLocaleString()} units
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              Restock frequency: {Math.floor(Math.random() * 14) + 7} days
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Store Servicing Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2">Store Coverage Potential</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xl font-bold text-purple-600">
                            {Math.floor(Math.random() * 50) + 20}
                          </div>
                          <div className="text-sm text-purple-700">Current Stores</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-purple-600">
                            {Math.floor(Math.random() * 100) + 50}
                          </div>
                          <div className="text-sm text-purple-700">Maximum Capacity</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Geographic Coverage</h4>
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Primary Coverage Zone</span>
                          <Badge variant="outline">{supplier.deliveryRadius} km radius</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Can serve approximately {Math.floor((supplier.deliveryRadius / 10) * 3)} stores in optimal conditions
                        </p>
                      </div>
                      
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Store Types Supported</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Supercenters:</span>
                            <span className="font-medium">Up to 15 stores</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Neighborhood Markets:</span>
                            <span className="font-medium">Up to 30 stores</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Express Stores:</span>
                            <span className="font-medium">Up to 50 stores</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Scalability Potential</span>
                          <Badge className="bg-green-100 text-green-800">High</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Can expand operations by {Math.floor(Math.random() * 50) + 25}% with 3-month notice period
                        </p>
                      </div>
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