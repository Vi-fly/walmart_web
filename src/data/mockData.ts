import { Store, Supplier } from '@/types';

// Helper function to determine supplier category from products/supplies
function determineSupplierCategory(supplies: string[], clusterId?: string): string {
  if (clusterId && clusterId !== '') {
    switch (clusterId) {
      case 'Sustainability': return 'Sustainable Agriculture';
      case 'Local Consumption': return 'Local Consumption';
      case 'High Profit Margin': return 'High Profit Margin';
      case 'Brand Value': return 'Brand Value';
      case 'Product Quality': return 'Product Quality';
      default: return 'Local Consumption';
    }
  }
  
  // Determine category based on products
  const productTypes = supplies.map(s => s.toLowerCase());
  
  if (productTypes.some(p => ['vegetables', 'fruits', 'organic'].includes(p))) {
    return 'Sustainable Agriculture';
  }
  if (productTypes.some(p => ['dairy', 'meat', 'seafood'].includes(p))) {
    return 'Local Consumption';
  }
  if (productTypes.some(p => ['electronics', 'appliances'].includes(p))) {
    return 'Electronics & Appliances';
  }
  if (productTypes.some(p => ['snacks', 'beverages'].includes(p))) {
    return 'Packaged Snacks';
  }
  if (productTypes.some(p => ['clothing'].includes(p))) {
    return 'Non-Food Retail';
  }
  
  return 'Local Consumption';
}

// Helper function to generate realistic risk breakdown
function generateRiskBreakdown(riskScore: number, sustainabilityScore: number, productQuality: number) {
  const baseRisk = riskScore / 100;
  return {
    financial: Math.max(0, Math.min(10, baseRisk * 10 + Math.random() * 2)),
    quality: Math.max(0, Math.min(10, (100 - productQuality) / 10)),
    delivery: Math.max(0, Math.min(10, baseRisk * 8 + Math.random() * 3)),
    compliance: Math.max(0, Math.min(10, baseRisk * 6 + Math.random() * 2)),
    sustainability: Math.max(0, Math.min(10, (100 - sustainabilityScore) / 10)),
    customerFeedback: Math.max(0, Math.min(10, baseRisk * 7 + Math.random() * 2.5))
  };
}

// Helper function to generate realistic store data
function generateStoreData(performanceScore: number) {
  const revenue = Math.floor(Math.random() * 5000000) + 2000000; // 2M to 7M
  const customers = Math.floor(Math.random() * 50000) + 10000; // 10K to 60K
  
  return {
    monthlyRevenue: revenue,
    customerCount: customers
  };
}

// Load mock data dynamically from JSON files in the public directory
async function loadMockData() {
  const [storesResponse, alternateSuppliersResponse] = await Promise.all([
    fetch('/walmart_us_stores_with_suppliers.json'),
    fetch('/walmart_us_alternate_suppliers.json')
  ]);

  const storesData = await storesResponse.json();
  const alternateSuppliersData = await alternateSuppliersResponse.json();
  // A map to store all unique suppliers, keyed by their ID, to avoid duplicates
  const allSuppliersMap = new Map<string, Supplier>();
  const loadedStores: Store[] = [];
  
  // Process data from walmart_us_stores_with_suppliers.json
  storesData.stores.forEach((storeJson: any) => {
    const currentStoreSupplierIds: string[] = [];
    
    // Iterate through nested suppliers for each store
    storeJson.suppliers.forEach((supplierJson: any) => {
      // If the supplier is not already in our map, add it
      if (!allSuppliersMap.has(supplierJson.id)) {
        const category = determineSupplierCategory(supplierJson.supplies);
        const riskBreakdown = generateRiskBreakdown(
          supplierJson.parameters.riskScore,
          supplierJson.parameters.sustainabilityScore,
          supplierJson.parameters.productQuality
        );
        
        allSuppliersMap.set(supplierJson.id, {
          id: supplierJson.id,
          name: supplierJson.name,
          products: supplierJson.supplies,
          coordinates: [supplierJson.longitude, supplierJson.latitude],
          category: category as any,
          riskScore: supplierJson.parameters.riskScore,
          riskBreakdown,
          sustainabilityScore: supplierJson.parameters.sustainabilityScore,
          carbonFootprint: supplierJson.parameters.carbonFootprint,
          packagingQuality: supplierJson.parameters.packagingQuality,
          localRelevance: supplierJson.parameters.localRelevance,
          productQuality: supplierJson.parameters.productQuality,
          availability: supplierJson.parameters.availability,
          profitMargin: supplierJson.parameters.profitMargin,
          brandRecognition: supplierJson.parameters.brandRecognition,
          deliveryRadius: Math.floor(Math.random() * 100) + 50,
          monthlyVolume: Math.floor(Math.random() * 10000) + 1000,
          contractValue: Math.floor(Math.random() * 500000) + 50000,
          certifications: ['ISO 9001', 'ISO 14001'],
          lastAudit: '2024-06-15',
          performanceTrend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)] as any,
          contact: {
            name: `${supplierJson.name} Manager`,
            email: `contact@${supplierJson.name.toLowerCase().replace(/ /g, '')}.com`,
            phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
          },
          address: `${supplierJson.name} Headquarters`,
          establishedYear: Math.floor(Math.random() * 30) + 1990,
          employeeCount: Math.floor(Math.random() * 500) + 50,
        });
      }
      currentStoreSupplierIds.push(supplierJson.id);
    });
    
    const storeData = generateStoreData(storeJson.performanceScore);
    
    // Populate the Store object
    loadedStores.push({
      id: storeJson.id,
      name: storeJson.location,
      coordinates: [storeJson.longitude, storeJson.latitude],
      address: `${storeJson.location} Store Address`,
      type: ['Supercenter', 'Neighborhood Market', 'Express'][Math.floor(Math.random() * 3)] as any,
      size: `${Math.floor(Math.random() * 50000) + 100000} sq ft`,
      suppliers: currentStoreSupplierIds,
      riskScore: 100 - storeJson.performanceScore,
      monthlyRevenue: storeData.monthlyRevenue,
      customerCount: storeData.customerCount,
      region: storeJson.location.split(', ')[1] || 'US',
      manager: `Manager ${storeJson.id}`,
      phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      openingHours: '6:00 AM - 11:00 PM',
    });
  });
  
  // Process data from walmart_us_alternate_suppliers.json
  alternateSuppliersData.alternateSuppliers.forEach((altSupplierJson: any) => {
    // Add alternate suppliers to the map if they are not already present
    if (!allSuppliersMap.has(altSupplierJson.id)) {
      const category = determineSupplierCategory(altSupplierJson.supplies, altSupplierJson.clusterId);
      const riskBreakdown = generateRiskBreakdown(
        altSupplierJson.parameters.riskScore,
        altSupplierJson.parameters.sustainabilityScore || 70,
        altSupplierJson.parameters.productQuality
      );
      
      allSuppliersMap.set(altSupplierJson.id, {
        id: altSupplierJson.id,
        name: altSupplierJson.name,
        products: altSupplierJson.supplies,
        coordinates: [altSupplierJson.longitude, altSupplierJson.latitude],
        category: category as any,
        riskScore: altSupplierJson.parameters.riskScore,
        riskBreakdown,
        sustainabilityScore: altSupplierJson.parameters.sustainabilityScore || 70,
        carbonFootprint: altSupplierJson.parameters.carbonFootprint,
        packagingQuality: altSupplierJson.parameters.packagingQuality,
        localRelevance: altSupplierJson.parameters.localRelevance,
        productQuality: altSupplierJson.parameters.productQuality,
        availability: altSupplierJson.parameters.availability,
        profitMargin: altSupplierJson.parameters.profitMargin,
        brandRecognition: altSupplierJson.parameters.brandRecognition,
        deliveryRadius: Math.floor(Math.random() * 100) + 50,
        monthlyVolume: Math.floor(Math.random() * 10000) + 1000,
        contractValue: Math.floor(Math.random() * 500000) + 50000,
        certifications: ['ISO 9001', 'ISO 14001'],
        lastAudit: '2024-06-15',
        performanceTrend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)] as any,
        contact: {
          name: `${altSupplierJson.name} Manager`,
          email: `contact@${altSupplierJson.name.toLowerCase().replace(/ /g, '')}.com`,
          phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
        },
        address: `${altSupplierJson.name} Headquarters`,
        establishedYear: Math.floor(Math.random() * 30) + 1990,
        employeeCount: Math.floor(Math.random() * 500) + 50,
      });
    }
  });
  
  // Convert the map of unique suppliers back to an array
  const loadedSuppliers: Supplier[] = Array.from(allSuppliersMap.values());
  
  return { mockStores: loadedStores, mockSuppliers: loadedSuppliers };
}

// Export only the loading function
export { loadMockData };
export default loadMockData;
