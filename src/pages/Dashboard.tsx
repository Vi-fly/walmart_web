import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  FileText,
  Truck,
  ShoppingCart,
  Package,
  Zap,
  ChevronRight,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { loadMockData } from '@/data/mockData';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Store, Supplier, DashboardMetrics, Alert } from '@/types'; // Import types for clarity

const Dashboard = () => {
  const { user } = useAuth();

  // State to hold dynamically loaded data
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { mockStores: loadedStores, mockSuppliers: loadedSuppliers } = await loadMockData();
        setStores(loadedStores);
        setSuppliers(loadedSuppliers);
        
        // Calculate metrics once and cache them
        const avgRisk = loadedSuppliers.length > 0 
          ? loadedSuppliers.reduce((acc, sup) => acc + (sup.riskScore || 0), 0) / loadedSuppliers.length 
          : 0;
        const avgSustainability = loadedSuppliers.length > 0 
          ? loadedSuppliers.reduce((acc, sup) => acc + (sup.sustainabilityScore || 0), 0) / loadedSuppliers.length 
          : 0;
        const avgQuality = loadedSuppliers.length > 0 
          ? loadedSuppliers.reduce((acc, sup) => acc + (sup.productQuality || 0), 0) / loadedSuppliers.length 
          : 0;
        
        setDashboardMetrics({
          totalSuppliers: loadedSuppliers.length,
          avgRiskScore: avgRisk,
          highRiskSuppliers: loadedSuppliers.filter(sup => sup.riskScore >= 70).length,
          costSavings: Math.floor(Math.random() * 1000000) + 500000, // Random cost savings
          sustainabilityScore: avgSustainability,
          onTimeDelivery: 90, // Placeholder percentage
          qualityScore: avgQuality,
          contractsExpiring: 5 // Placeholder
        });
        // Add hardcoded real-time alerts for stores, products, and supply chain
        const hardcodedAlerts = [
          {
            id: 'alert-1',
            type: 'critical',
            message: 'Store #1247 - Critical inventory shortage for frozen products',
            timestamp: new Date().toISOString(),
            category: 'store'
          },
          {
            id: 'alert-2',
            type: 'warning',
            message: 'Supply chain disruption - Shipment from Pacific Fresh delayed by 2 days',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            category: 'supply_chain'
          },
          {
            id: 'alert-3',
            type: 'info',
            message: 'Product recall alert - Batch #XY789 organic apples quality issue',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            category: 'product'
          },
          {
            id: 'alert-4',
            type: 'warning',
            message: 'Store #2156 - Temperature sensor malfunction in dairy section',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            category: 'store'
          },
          {
            id: 'alert-5',
            type: 'success',
            message: 'New England Farms - Sustainable certification renewed successfully',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            category: 'supply_chain'
          },
          {
            id: 'alert-6',
            type: 'critical',
            message: 'Supply chain risk - Eco Harvest Organic compliance audit failed',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            category: 'supply_chain'
          },
          {
            id: 'alert-7',
            type: 'info',
            message: 'Product demand spike - Electronics category up 23% this week',
            timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
            category: 'product'
          },
          {
            id: 'alert-8',
            type: 'warning',
            message: 'Store #3421 - Staff shortage affecting customer service levels',
            timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
            category: 'store'
          }
        ];
        setAlerts(hardcodedAlerts);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setStores([]);
        setSuppliers([]);
        setDashboardMetrics({
          totalSuppliers: 0,
          avgRiskScore: 0,
          highRiskSuppliers: 0,
          costSavings: 0,
          sustainabilityScore: 0,
          onTimeDelivery: 0,
          qualityScore: 0,
          contractsExpiring: 0,
        });
        setAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only load data once when component mounts
    fetchData();
  }, []); // Empty dependency array - only run once

  // Calculate average risk score for dashboard metrics
  const avgSupplierRiskScore = suppliers.length > 0
    ? suppliers.reduce((sum, s) => sum + s.riskScore, 0) / suppliers.length
    : 0;

  // Sample chart data - these would ideally also be derived from loaded data
  // For now, keeping them as mock for structural integrity, but they can be dynamic
  const riskTrendData = [
    { month: 'Jan', score: 71.2 },
    { month: 'Feb', score: 72.8 },
    { month: 'Mar', score: 70.5 },
    { month: 'Apr', score: 73.1 },
    { month: 'May', score: 72.3 },
    { month: 'Jun', score: 74.2 },
  ];

  // Dynamically generate supplier category data
  const supplierCategoryData = Object.entries(
    suppliers.reduce((acc: { [key: string]: number }, supplier) => {
      acc[supplier.category] = (acc[supplier.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({
    name,
    value: (count / suppliers.length) * 100, // Percentage
    color: '#'+(Math.random()*0xFFFFFF<<0).toString(16).padStart(6,'0') // Random color for now
  }));


  const performanceData = [
    { category: 'Financial', score: 85 },
    { category: 'Quality', score: 90 },
    { category: 'Delivery', score: 75 },
    { category: 'Compliance', score: 88 },
    { category: 'Sustainability', score: 70 },
    { category: 'Feedback', score: 82 },
  ];

  // Adjusted risk color and badge logic: Higher score = Higher Risk (Red)
  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600'; // High risk score value
    if (score >= 30) return 'text-yellow-600'; // Medium risk score value
    return 'text-green-600'; // Low risk score value
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
    if (score >= 30) return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
    return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
  };

  if (isLoading || !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-walmart-blue mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading dashboard data...</p>
          <p className="text-sm text-gray-500">This might take a moment.</p>
        </div>
      </div>
    );
  }

  if (user?.role === 'admin') {
    return (
      <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Monitor supplier networks and risk management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" className="bg-walmart-blue hover:bg-walmart-blue/90">
              <MapPin className="h-4 w-4 mr-2" />
              View Map
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardMetrics.totalSuppliers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +2.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Supplier Risk Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getRiskColor(avgSupplierRiskScore)}`}>
                {avgSupplierRiskScore.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingDown className="inline h-3 w-3 mr-1" /> {/* Assuming lower risk is better, so decreasing trend is good */}
                -1.2% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Suppliers</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {dashboardMetrics.highRiskSuppliers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingDown className="inline h-3 w-3 mr-1" />
                -5.3% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Cost Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${(dashboardMetrics.costSavings / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Risk Score Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Score Trend</CardTitle>
              <CardDescription>Average supplier risk score over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={riskTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} /> {/* Adjusted domain for 0-100 risk score */}
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#004c91"
                      strokeWidth={3}
                      dot={{ fill: '#004c91', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Categories</CardTitle>
              <CardDescription>Distribution by supplier type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={supplierCategoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`} // Show percentage
                    >
                      {supplierCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Top Performing Suppliers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Suppliers</CardTitle>
              <CardDescription>Suppliers with the lowest risk scores</CardDescription> {/* Changed description */}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suppliers.sort((a, b) => a.riskScore - b.riskScore).slice(0, 5).map((supplier) => ( // Sort by riskScore ascending for "top performing"
                  <div key={supplier.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">{supplier.name}</div>
                      <div className="text-sm text-muted-foreground">{supplier.category}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getRiskColor(supplier.riskScore)}`}>
                        {supplier.riskScore.toFixed(1)}%
                      </div>
                      {getRiskBadge(supplier.riskScore)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest system notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className={`p-1 rounded-full ${
                      alert.type === 'critical' ? 'bg-red-100 text-red-600' :
                        alert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                          alert.type === 'info' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'
                      }`}>
                      {alert.type === 'critical' && <AlertTriangle className="h-4 w-4" />}
                      {alert.type === 'warning' && <Clock className="h-4 w-4" />}
                      {alert.type === 'info' && <Shield className="h-4 w-4" />}
                      {alert.type === 'success' && <CheckCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{alert.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleDateString()} {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Real-time Supply Chain Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Live Supply Chain
              </CardTitle>
              <CardDescription>Real-time updates across stores, products & supply chain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="p-1 rounded-full bg-green-100 text-green-600">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Pacific Fresh shipment arrived</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Just now • 2,500 units delivered
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="p-1 rounded-full bg-blue-100 text-blue-600">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Store #1534 inventory restocked</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      2 min ago • Electronics dept
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <div className="p-1 rounded-full bg-purple-100 text-purple-600">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Quality check completed</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      5 min ago • Organic produce batch
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <div className="p-1 rounded-full bg-yellow-100 text-yellow-600">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Demand forecast updated</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      8 min ago • Holiday season prep
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Supplier Dashboard
  if (user?.role === 'supplier') {
    // Find the current supplier based on user ID or a default
    // For now, using the first supplier if available, or a placeholder
    const supplierData = suppliers.length > 0 ? suppliers[0] : {
      id: "N/A", name: "N/A", coordinates: [0, 0], performanceScore: 0, sustainabilityScore: 0,
      carbonFootprint: 0, packagingQuality: 0, geographicalProximity: 0, compliance: 0,
      consumerTrends: 0, riskScore: 0, localRelevance: 0, productQuality: 0, availability: 0,
      profitMargin: 0, brandRecognition: 0, category: "Local Consumption", riskBreakdown: {
        financial: 0, quality: 0, delivery: 0, compliance: 0, sustainability: 0, customerFeedback: 0
      }, deliveryRadius: 0, monthlyVolume: 0, contractValue: 0, certifications: [], lastAudit: "N/A",
      performanceTrend: "stable", contact: { name: "N/A", email: "N/A", phone: "N/A" }, address: "N/A",
      establishedYear: 0, employeeCount: 0
    };

    // Dynamically generate performance data for the selected supplier
    const supplierPerformanceData = [
      { category: 'Financial', score: supplierData.riskBreakdown?.financial || 0 },
      { category: 'Quality', score: supplierData.riskBreakdown?.quality || 0 },
      { category: 'Delivery', score: supplierData.riskBreakdown?.delivery || 0 },
      { category: 'Compliance', score: supplierData.riskBreakdown?.compliance || 0 },
      { category: 'Sustainability', score: supplierData.riskBreakdown?.sustainability || 0 },
      { category: 'Feedback', score: supplierData.riskBreakdown?.customerFeedback || 0 },
    ];


    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Supplier Dashboard</h1>
            <p className="text-muted-foreground">Monitor your performance and compliance status</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Overall Risk Score</div>
            <div className={`text-3xl font-bold ${getRiskColor(supplierData.riskScore)}`}>
              {supplierData.riskScore.toFixed(1)}%
            </div>
            {getRiskBadge(supplierData.riskScore)}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="text-sm">Delivery Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(supplierData.riskBreakdown?.delivery || 0).toFixed(1)}%
              </div>
              <Progress value={supplierData.riskBreakdown?.delivery || 0} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">On-time delivery rate</p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="text-sm">Quality Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(supplierData.riskBreakdown?.quality || 0).toFixed(1)}/100
              </div>
              <Progress value={supplierData.riskBreakdown?.quality || 0} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">Product quality score</p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="text-sm">Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(supplierData.riskBreakdown?.compliance || 0) >= 80 ? 'Compliant' : 'Needs Review'}
              </div>
              <Progress value={supplierData.riskBreakdown?.compliance || 0} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">All requirements met</p>
            </CardContent>
          </Card>
        </div>

        {/* Risk Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Score Breakdown</CardTitle>
            <CardDescription>Detailed performance analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#004c91" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Executive Dashboard (default if no role or non-admin/supplier role)
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Executive Dashboard</h1>
        <p className="text-muted-foreground">Strategic overview of supplier optimization</p>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-walmart-blue">
                {avgSupplierRiskScore.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">Avg Supplier Risk Score</div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                ${(dashboardMetrics.costSavings / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-muted-foreground mt-1">Potential Cost Savings</div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stores.length.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Active Stores</div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {dashboardMetrics.totalSuppliers.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Suppliers</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#004c91" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Strategic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supplierCategoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  >
                    {supplierCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
