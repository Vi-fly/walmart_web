import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadMockData } from '@/data/mockData';
import type { Store, Supplier } from '@/types';
import { Download, Edit, Eye, Filter, Plus, Search, SortAsc, SortDesc } from 'lucide-react';
import { useEffect, useState } from 'react';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { mockStores, mockSuppliers } = await loadMockData();
        setStores(mockStores);
        setSuppliers(mockSuppliers);
        setFilteredSuppliers(mockSuppliers);
      } catch (error) {
        console.error('Failed to load supplier data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter and sort suppliers
  useEffect(() => {
    let filtered = [...suppliers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(supplier => supplier.category === categoryFilter);
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(supplier => {
        const riskLevel = getRiskLevel(supplier.riskScore);
        return riskLevel === riskFilter;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Supplier];
      let bValue: any = b[sortBy as keyof Supplier];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm, categoryFilter, riskFilter, sortBy, sortOrder]);

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

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Sustainability': 'bg-emerald-100 text-emerald-800',
      'Local Consumption': 'bg-blue-100 text-blue-800',
      'High Profit Margin': 'bg-yellow-100 text-yellow-800',
      'Brand Value': 'bg-purple-100 text-purple-800',
      'Product Quality': 'bg-cyan-100 text-cyan-800',
      'General': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Supplier Management</h1>
              <p className="text-gray-600 mt-2 text-lg">
                Manage and monitor {suppliers.length} suppliers across {stores.length} stores
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {[...new Set(suppliers.map(s => s.category))].map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Risk Filter */}
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {filteredSuppliers.length} Suppliers
          </h2>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="riskScore">Risk Score</SelectItem>
                <SelectItem value="contractValue">Contract Value</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                    {supplier.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Badge className={getCategoryColor(supplier.category)}>
                  {supplier.category}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Risk Score:</span>
                  <Badge className={getRiskColor(getRiskLevel(supplier.riskScore))}>
                    {supplier.riskScore.toFixed(1)}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Performance:</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {supplier.performanceTrend}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Contract:</span>
                  <span className="text-sm font-medium">
                    ₹{supplier.contractValue.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Products:</span>
                  <span className="text-sm text-gray-900">
                    {supplier.products.length} items
                  </span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500">
                    Last Audit: {supplier.lastAudit}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredSuppliers.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
              <p className="text-gray-600">
                Try adjusting your filters or search terms to find suppliers.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Suppliers;
