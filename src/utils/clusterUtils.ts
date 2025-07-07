
import { Supplier, Cluster, ClusterParameters } from '@/types';
// Define cluster parameters
const clusterParameters: { [key: string]: ClusterParameters } = {
  'Sustainability Cluster': {
    sustainabilityScore: { weight: 30, importance: 'high' },
    carbonFootprint: { weight: 20, importance: 'high' },
    packagingQuality: { weight: 15, importance: 'medium' },
    geographicalProximity: { weight: 10, importance: 'medium' },
    compliance: { weight: 10, importance: 'medium' },
    consumerTrends: { weight: 10, importance: 'medium' },
    riskScore: { weight: 5, importance: 'low' }
  },
  'Local Consumption Cluster': {
    localRelevance: { weight: 25, importance: 'high' },
    productQuality: { weight: 20, importance: 'high' },
    availability: { weight: 15, importance: 'medium' },
    sustainability: { weight: 10, importance: 'medium' },
    geographicalProximity: { weight: 10, importance: 'medium' },
    consumerTrends: { weight: 10, importance: 'medium' },
    compliance: { weight: 5, importance: 'low' },
    riskScore: { weight: 5, importance: 'low' }
  },
  'High Profit Margin Cluster': {
    profitMargin: { weight: 30, importance: 'high' },
    productQuality: { weight: 20, importance: 'high' },
    availability: { weight: 15, importance: 'medium' },
    sustainability: { weight: 10, importance: 'medium' },
    geographicalProximity: { weight: 10, importance: 'medium' },
    consumerTrends: { weight: 10, importance: 'medium' },
    compliance: { weight: 3, importance: 'low' },
    riskScore: { weight: 2, importance: 'low' }
  },
  'Brand Value Cluster': {
    brandRecognition: { weight: 35, importance: 'high' },
    productQuality: { weight: 25, importance: 'high' },
    availability: { weight: 20, importance: 'medium' },
    compliance: { weight: 10, importance: 'medium' },
    consumerTrends: { weight: 7, importance: 'medium' },
    riskScore: { weight: 3, importance: 'low' }
  },
  'Product Quality Cluster': {
    productQuality: { weight: 35, importance: 'high' },
    availability: { weight: 20, importance: 'medium' },
    sustainability: { weight: 15, importance: 'medium' },
    geographicalProximity: { weight: 10, importance: 'medium' },
    consumerTrends: { weight: 10, importance: 'medium' },
    compliance: { weight: 5, importance: 'low' },
    riskScore: { weight: 5, importance: 'low' }
  }
};
import { ClusterAnimationManager, clusterForceConfig } from './clusterAnimations';
import { kMeansClustering, dbscanClustering, hierarchicalClustering, getFeatureExtractorForClusterType } from './clusteringAlgorithms';

// Global animation manager
let animationManager: ClusterAnimationManager | null = null;

// Initialize animation manager
export const initializeAnimationManager = (onUpdate: (clusterId: string, progress: number) => void) => {
  if (animationManager) {
    animationManager.destroy();
  }
  animationManager = new ClusterAnimationManager(onUpdate);
  return animationManager;
};

// Calculate cluster score for a supplier based on cluster parameters
export const calculateClusterScore = (supplier: Supplier, clusterType: string): number => {
  const parameters = clusterParameters[clusterType];
  if (!parameters) return 0;

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(parameters).forEach(([param, config]) => {
    let value = 0;
    
    // Map parameter names to supplier properties with enhanced mapping
    switch (param) {
      case 'sustainabilityScore':
        value = supplier.sustainabilityScore || supplier.riskBreakdown.sustainability * 10 || 70;
        break;
      case 'carbonFootprint':
        value = supplier.carbonFootprint || (100 - supplier.riskBreakdown.sustainability * 10) || 70;
        break;
      case 'packagingQuality':
        value = supplier.packagingQuality || supplier.riskBreakdown.quality * 10 || 70;
        break;
      case 'localRelevance':
        value = supplier.localRelevance || calculateLocalRelevance(supplier) || 70;
        break;
      case 'productQuality':
        value = supplier.riskBreakdown.quality * 10 || 70;
        break;
      case 'availability':
        value = supplier.availability || calculateAvailability(supplier) || 80;
        break;
      case 'profitMargin':
        value = supplier.profitMargin || calculateProfitMargin(supplier) || 70;
        break;
      case 'brandRecognition':
        value = supplier.brandRecognition || calculateBrandRecognition(supplier) || 50;
        break;
      case 'consumerTrends':
        value = supplier.consumerTrends || calculateConsumerTrends(supplier) || 75;
        break;
      case 'compliance':
        value = supplier.riskBreakdown.compliance * 10 || 70;
        break;
      case 'riskScore':
        value = supplier.riskScore * 10 || 70;
        break;
      case 'geographicalProximity':
        value = Math.max(0, 100 - (supplier.deliveryRadius / 10));
        break;
      case 'sustainability':
        value = supplier.riskBreakdown.sustainability * 10 || 70;
        break;
      default:
        value = 70;
    }
    
    totalScore += (value * config.weight);
    totalWeight += config.weight;
  });

  return totalWeight > 0 ? totalScore / totalWeight : 0;
};

// Helper functions for calculating derived metrics
const calculateLocalRelevance = (supplier: Supplier): number => {
  const localCategories = ['Local Consumption', 'Traditional Foods', 'Beverages'];
  return localCategories.includes(supplier.category) ? 85 : 60;
};

const calculateAvailability = (supplier: Supplier): number => {
  return 100 - (supplier.deliveryRadius / 5) + (supplier.riskBreakdown.delivery * 10);
};

const calculateProfitMargin = (supplier: Supplier): number => {
  const highMarginCategories = ['Brand Value', 'Electronics & Appliances', 'Personal Care'];
  const baseMargin = highMarginCategories.includes(supplier.category) ? 80 : 60;
  return Math.min(95, baseMargin + (supplier.riskBreakdown.financial * 5));
};

const calculateBrandRecognition = (supplier: Supplier): number => {
  const brandCategories = ['Brand Value', 'Beverages', 'Personal Care', 'Electronics & Appliances'];
  return brandCategories.includes(supplier.category) ? 85 : 45;
};

const calculateConsumerTrends = (supplier: Supplier): number => {
  const trendingCategories = ['Sustainable Agriculture', 'Innovation Hub', 'Specialty Products'];
  return trendingCategories.includes(supplier.category) ? 90 : 70;
};

// Determine which cluster a supplier belongs to with threshold management
export const determineSupplierCluster = (supplier: Supplier, minThreshold: number = 65): string | null => {
  const clusterTypes = Object.keys(clusterParameters);
  let bestCluster = null;
  let bestScore = minThreshold;

  clusterTypes.forEach(clusterType => {
    const score = calculateClusterScore(supplier, clusterType);
    if (score > bestScore) {
      bestScore = score;
      bestCluster = clusterType;
    }
  });

  return bestCluster;
};

// Calculate cluster radius based on suppliers and parameters
export const calculateClusterRadius = (
  suppliers: Supplier[], 
  centerCoord: [number, number], 
  clusterType: string,
  parameterOverrides?: { [key: string]: number }
): number => {
  if (suppliers.length === 0) return 50;

  // Get base radius from supplier distribution
  const distances = suppliers.map(supplier => {
    const distance = calculateDistance(supplier.coordinates, centerCoord);
    return distance;
  });

  const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  const maxDistance = Math.max(...distances);
  const baseRadius = Math.max(30, Math.min(maxDistance * 0.8, avgDistance * 1.5));

  // Apply parameter-based dynamic sizing
  if (parameterOverrides) {
    const dynamicRadius = calculateParameterBasedRadius(clusterType, parameterOverrides, baseRadius);
    
    // Trigger smooth animation if animation manager exists
    if (animationManager) {
      animationManager.startClusterAnimation(
        clusterType, 
        baseRadius, 
        dynamicRadius, 
        500, 
        'cubicInOut'
      );
    }
    
    return dynamicRadius;
  }

  return baseRadius;
};

// Calculate dynamic radius based on parameter weights and values
const calculateParameterBasedRadius = (
  clusterType: string,
  parameterValues: { [key: string]: number },
  baseRadius: number = 100,
  maxRadius: number = 200
): number => {
  const parameters = getClusterParameters(clusterType);
  if (!parameters) return baseRadius;

  let weightedScore = 0;
  let totalWeight = 0;

  Object.entries(parameters).forEach(([param, config]) => {
    const value = parameterValues[param] || 50; // Default value
    const normalizedValue = Math.min(Math.max(value, 0), 100) / 100;
    weightedScore += normalizedValue * config.weight;
    totalWeight += config.weight;
  });

  const averageScore = totalWeight > 0 ? weightedScore / totalWeight : 0.5;
  const scalingFactor = 100; // Maximum adjustment range
  const dynamicRadius = baseRadius + (averageScore * scalingFactor * 0.01);

  return Math.min(dynamicRadius, maxRadius);
};

// Get cluster parameters for calculations
const getClusterParameters = (clusterType: string) => {
  const parameterMap: { [key: string]: { [param: string]: { weight: number } } } = {
    'Sustainability Cluster': {
      sustainabilityScore: { weight: 30 },
      carbonFootprint: { weight: 20 },
      packagingQuality: { weight: 15 },
      geographicalProximity: { weight: 10 },
      compliance: { weight: 10 },
      consumerTrends: { weight: 10 },
      riskScore: { weight: 5 }
    },
    'Local Consumption Cluster': {
      localRelevance: { weight: 25 },
      productQuality: { weight: 20 },
      availability: { weight: 15 },
      sustainability: { weight: 10 },
      geographicalProximity: { weight: 10 },
      consumerTrends: { weight: 10 },
      compliance: { weight: 5 },
      riskScore: { weight: 5 }
    },
    'High Profit Margin Cluster': {
      profitMargin: { weight: 30 },
      productQuality: { weight: 20 },
      availability: { weight: 15 },
      sustainability: { weight: 10 },
      geographicalProximity: { weight: 10 },
      consumerTrends: { weight: 10 },
      compliance: { weight: 3 },
      riskScore: { weight: 2 }
    },
    'Brand Value Cluster': {
      brandRecognition: { weight: 35 },
      productQuality: { weight: 25 },
      availability: { weight: 20 },
      compliance: { weight: 10 },
      consumerTrends: { weight: 7 },
      riskScore: { weight: 3 }
    },
    'Product Quality Cluster': {
      productQuality: { weight: 35 },
      availability: { weight: 20 },
      sustainability: { weight: 15 },
      geographicalProximity: { weight: 10 },
      consumerTrends: { weight: 10 },
      compliance: { weight: 5 },
      riskScore: { weight: 5 }
    }
  };

  return parameterMap[clusterType];
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(coord2[1] - coord1[1]);
  const dLon = toRadians(coord2[0] - coord1[0]);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(coord1[1])) * Math.cos(toRadians(coord2[1])) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Enhanced cluster generation with real-time updates and supplier state tracking
export const generateDynamicClusters = (
  suppliers: Supplier[],
  parameterUpdates?: { [clusterType: string]: { [param: string]: number } },
  clusteringAlgorithm: 'kmeans' | 'dbscan' | 'hierarchical' = 'kmeans'
): Cluster[] => {
  const previousAssignments = new Map<string, string>();
  
  // Store previous assignments for transition tracking
  suppliers.forEach(supplier => {
    const prevCluster = determineSupplierCluster(supplier);
    if (prevCluster) {
      previousAssignments.set(supplier.id, prevCluster);
    }
  });
  
  // Apply parameter updates to suppliers if provided
  const modifiedSuppliers = suppliers.map(supplier => {
    let modifiedSupplier = { ...supplier };
    if (parameterUpdates) {
      Object.entries(parameterUpdates).forEach(([clusterType, params]) => {
        if (Object.keys(params).length > 0) {
          // Update supplier metrics based on parameter changes
          Object.entries(params).forEach(([param, value]) => {
            switch (param) {
              case 'sustainabilityScore':
                modifiedSupplier.sustainabilityScore = value;
                break;
              case 'profitMargin':
                modifiedSupplier.profitMargin = value;
                break;
              case 'brandRecognition':
                modifiedSupplier.brandRecognition = value;
                break;
              // Add more parameter mappings as needed
            }
          });
        }
      });
    }
    return modifiedSupplier;
  });

  // Group suppliers by cluster type using the selected clustering algorithm
  const clusterTypes = Object.keys(clusterParameters);
  const clusterMap = new Map<string, Supplier[]>();
  
  // Initialize empty clusters for each type
  clusterTypes.forEach(type => clusterMap.set(type, []));
  
  // Process each cluster type with the appropriate algorithm
  for (const clusterType of clusterTypes) {
    // Filter suppliers that have a high enough score for this cluster type
    const eligibleSuppliers = modifiedSuppliers.filter(supplier => {
      const score = calculateClusterScore(supplier, clusterType);
      return score >= 65; // Minimum threshold
    });
    
    if (eligibleSuppliers.length === 0) continue;
    
    // Get the appropriate feature extractor for this cluster type
    const featureExtractor = getFeatureExtractorForClusterType(clusterType);
    
    // Apply the selected clustering algorithm
    let algorithmResults;
    switch (clusteringAlgorithm) {
      case 'kmeans':
        // For k-means, we use a dynamic k based on the number of suppliers
        const k = Math.min(Math.max(2, Math.floor(eligibleSuppliers.length / 5)), 5);
        algorithmResults = kMeansClustering(eligibleSuppliers, k, 100, featureExtractor);
        
        // Assign suppliers to the cluster with the highest score
        algorithmResults.clusters.forEach(cluster => {
          if (cluster.length > 0) {
            cluster.forEach(supplier => {
              const bestCluster = determineSupplierCluster(supplier, 65);
              if (bestCluster === clusterType) {
                clusterMap.get(clusterType)!.push(supplier);
              }
            });
          }
        });
        break;
        
      case 'dbscan':
        // For DBSCAN, we need to determine appropriate eps and minPts values
        // These values might need tuning based on your specific data
        const eps = 0.3; // Normalized distance threshold
        const minPts = 3; // Minimum points to form a cluster
        algorithmResults = dbscanClustering(eligibleSuppliers, eps, minPts, featureExtractor);
        
        // Add all clustered suppliers to this cluster type
        algorithmResults.clusters.forEach(cluster => {
          cluster.forEach(supplier => {
            const bestCluster = determineSupplierCluster(supplier, 65);
            if (bestCluster === clusterType) {
              clusterMap.get(clusterType)!.push(supplier);
            }
          });
        });
        break;
        
      case 'hierarchical':
        // For hierarchical clustering, we use a dynamic k similar to k-means
        const hK = Math.min(Math.max(2, Math.floor(eligibleSuppliers.length / 5)), 5);
        algorithmResults = hierarchicalClustering(eligibleSuppliers, hK, featureExtractor);
        
        // Assign suppliers to the cluster with the highest score
        algorithmResults.clusters.forEach(cluster => {
          cluster.forEach(supplier => {
            const bestCluster = determineSupplierCluster(supplier, 65);
            if (bestCluster === clusterType) {
              clusterMap.get(clusterType)!.push(supplier);
            }
          });
        });
        break;
    }
  }
  
  // Track supplier state changes for animation
  modifiedSuppliers.forEach(supplier => {
    const clusterType = determineSupplierCluster(supplier, 65);
    const previousCluster = previousAssignments.get(supplier.id);
    
    if (animationManager) {
      if (clusterType && clusterType !== previousCluster) {
        if (previousCluster) {
          animationManager.updateSupplierState(supplier.id, 'leaving');
          // After transition delay, update to entering new cluster
          setTimeout(() => {
            animationManager.updateSupplierState(supplier.id, 'entering');
          }, 300);
        } else {
          animationManager.updateSupplierState(supplier.id, 'entering');
        }
      } else if (!clusterType && previousCluster) {
        animationManager.updateSupplierState(supplier.id, 'excluded');
      } else if (clusterType) {
        animationManager.updateSupplierState(supplier.id, 'active');
      }
    }
  });

  const dynamicClusters: Cluster[] = [];
  const clusterColors = {
    'Sustainability Cluster': '#10b981',
    'Local Consumption Cluster': '#3b82f6', 
    'High Profit Margin Cluster': '#f59e0b',
    'Brand Value Cluster': '#8b5cf6',
    'Product Quality Cluster': '#06d6a0'
  };

  clusterMap.forEach((suppliers, clusterType) => {
    if (suppliers.length > 0) {
      // Calculate cluster center as weighted average
      const avgLon = suppliers.reduce((sum, s) => sum + s.coordinates[0], 0) / suppliers.length;
      const avgLat = suppliers.reduce((sum, s) => sum + s.coordinates[1], 0) / suppliers.length;
      const center: [number, number] = [avgLon, avgLat];
      
      // Calculate dynamic radius with parameter overrides
      const paramOverrides = parameterUpdates?.[clusterType];
      const radius = calculateClusterRadius(suppliers, center, clusterType, paramOverrides);
      
      // Calculate average cluster score
      const avgScore = suppliers.reduce((sum, s) => sum + calculateClusterScore(s, clusterType), 0) / suppliers.length;
      
      // Calculate total contract value
      const totalValue = suppliers.reduce((sum, s) => sum + s.contractValue, 0);
      
      dynamicClusters.push({
        id: `CLUSTER_${clusterType.replace(/\s+/g, '_').toUpperCase()}`,
        type: clusterType as any,
        center,
        radius,
        suppliers: suppliers.map(s => s.id),
        avgScore,
        totalValue,
        stores: [], // Would be calculated based on store-supplier relationships
        color: clusterColors[clusterType as keyof typeof clusterColors] || '#6b7280',
        parameters: clusterParameters[clusterType]
      });
    }
  });

  console.log(`Generated dynamic clusters using ${clusteringAlgorithm} algorithm:`, dynamicClusters.length);
  return dynamicClusters;
};

// Check if supplier should be removed from store connections based on cluster membership
export const shouldRemoveSupplierConnection = (
  supplierId: string, 
  storeSuppliers: string[], 
  clusterSuppliers: string[]
): boolean => {
  return storeSuppliers.includes(supplierId) && !clusterSuppliers.includes(supplierId);
};

// Update store-supplier connections based on cluster changes with transition tracking
export const updateStoreConnections = (
  storeId: string, 
  currentSuppliers: string[], 
  newClusterSuppliers: string[]
): { updated: string[], removed: string[] } => {
  const updatedSuppliers = currentSuppliers.filter(supplierId => 
    newClusterSuppliers.includes(supplierId)
  );
  
  const removedSuppliers = currentSuppliers.filter(supplierId => 
    !newClusterSuppliers.includes(supplierId)
  );

  // Update animation states for removed suppliers
  if (animationManager) {
    removedSuppliers.forEach(supplierId => {
      animationManager.updateSupplierState(supplierId, 'leaving');
    });
  }

  return { updated: updatedSuppliers, removed: removedSuppliers };
};

// Get animation manager instance
export const getAnimationManager = () => animationManager;

// Export animation utilities
export { ClusterAnimationManager, clusterForceConfig } from './clusterAnimations';
