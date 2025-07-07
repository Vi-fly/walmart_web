import { Supplier } from '@/types';

// K-means clustering algorithm implementation
export const kMeansClustering = (
  suppliers: Supplier[],
  k: number,
  maxIterations: number = 100,
  featureExtractor: (supplier: Supplier) => number[] = defaultFeatureExtractor
): { clusters: Supplier[][], centroids: number[][] } => {
  if (suppliers.length === 0 || k <= 0 || k > suppliers.length) {
    return { clusters: [], centroids: [] };
  }

  // Extract features from suppliers
  const features = suppliers.map(featureExtractor);
  const dimensions = features[0].length;

  // Initialize centroids using k-means++ method
  const centroids = initializeCentroidsKMeansPlusPlus(features, k);
  
  // Initialize clusters
  let clusters: number[][] = Array(k).fill(0).map(() => []);
  let iterations = 0;
  let centroidsChanged = true;

  // Main k-means loop
  while (centroidsChanged && iterations < maxIterations) {
    // Reset clusters
    clusters = Array(k).fill(0).map(() => []);
    
    // Assign each supplier to the nearest centroid
    features.forEach((feature, supplierIndex) => {
      const distances = centroids.map(centroid => euclideanDistance(feature, centroid));
      const nearestCentroidIndex = distances.indexOf(Math.min(...distances));
      clusters[nearestCentroidIndex].push(supplierIndex);
    });
    
    // Update centroids
    centroidsChanged = false;
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue;
      
      const newCentroid = Array(dimensions).fill(0);
      
      // Calculate mean of all points in the cluster
      clusters[i].forEach(supplierIndex => {
        const feature = features[supplierIndex];
        for (let d = 0; d < dimensions; d++) {
          newCentroid[d] += feature[d];
        }
      });
      
      for (let d = 0; d < dimensions; d++) {
        newCentroid[d] /= clusters[i].length;
        
        // Check if centroid has changed significantly
        if (Math.abs(newCentroid[d] - centroids[i][d]) > 0.001) {
          centroidsChanged = true;
        }
      }
      
      centroids[i] = newCentroid;
    }
    
    iterations++;
  }
  
  // Convert index-based clusters to supplier objects
  const supplierClusters = clusters.map(cluster => 
    cluster.map(index => suppliers[index])
  );
  
  return { clusters: supplierClusters, centroids };
};

// DBSCAN clustering algorithm implementation
export const dbscanClustering = (
  suppliers: Supplier[],
  eps: number,
  minPts: number,
  featureExtractor: (supplier: Supplier) => number[] = defaultFeatureExtractor
): { clusters: Supplier[][], noise: Supplier[] } => {
  if (suppliers.length === 0) {
    return { clusters: [], noise: [] };
  }

  // Extract features from suppliers
  const features = suppliers.map(featureExtractor);
  
  // Initialize variables
  const visited = new Set<number>();
  const clustered = new Set<number>();
  const noise = new Set<number>();
  const clusters: number[][] = [];
  
  // For each point
  for (let i = 0; i < suppliers.length; i++) {
    // Skip if already processed
    if (visited.has(i)) continue;
    
    visited.add(i);
    
    // Find neighbors
    const neighbors = regionQuery(i, features, eps);
    
    // Mark as noise if not enough neighbors
    if (neighbors.length < minPts) {
      noise.add(i);
      continue;
    }
    
    // Start a new cluster
    const cluster: number[] = [i];
    clustered.add(i);
    
    // Process all neighbors
    let neighborIndex = 0;
    while (neighborIndex < neighbors.length) {
      const currentNeighbor = neighbors[neighborIndex];
      
      // Mark as visited
      if (!visited.has(currentNeighbor)) {
        visited.add(currentNeighbor);
        
        // Find neighbors of the neighbor
        const neighborNeighbors = regionQuery(currentNeighbor, features, eps);
        
        // If enough neighbors, add them to the queue
        if (neighborNeighbors.length >= minPts) {
          neighbors.push(...neighborNeighbors.filter(n => !neighbors.includes(n)));
        }
      }
      
      // Add to cluster if not already in a cluster
      if (!clustered.has(currentNeighbor)) {
        cluster.push(currentNeighbor);
        clustered.add(currentNeighbor);
      }
      
      neighborIndex++;
    }
    
    clusters.push(cluster);
  }
  
  // Convert index-based clusters to supplier objects
  const supplierClusters = clusters.map(cluster => 
    cluster.map(index => suppliers[index])
  );
  
  const noiseSuppliers = Array.from(noise).map(index => suppliers[index]);
  
  return { clusters: supplierClusters, noise: noiseSuppliers };
};

// Hierarchical clustering (agglomerative) implementation
export const hierarchicalClustering = (
  suppliers: Supplier[],
  k: number,
  featureExtractor: (supplier: Supplier) => number[] = defaultFeatureExtractor,
  linkageMethod: 'single' | 'complete' | 'average' = 'average'
): { clusters: Supplier[][] } => {
  if (suppliers.length === 0 || k <= 0 || k > suppliers.length) {
    return { clusters: [] };
  }

  // Extract features from suppliers
  const features = suppliers.map(featureExtractor);
  
  // Initialize each supplier as its own cluster
  let clusters: number[][] = Array(suppliers.length).fill(0).map((_, i) => [i]);
  
  // Calculate initial distance matrix
  let distanceMatrix = calculateDistanceMatrix(features);
  
  // Merge clusters until we have k clusters
  while (clusters.length > k) {
    // Find the two closest clusters
    let minDistance = Infinity;
    let closestPair: [number, number] = [0, 0];
    
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const distance = calculateClusterDistance(
          clusters[i], 
          clusters[j], 
          distanceMatrix,
          linkageMethod
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPair = [i, j];
        }
      }
    }
    
    // Merge the two closest clusters
    const [i, j] = closestPair;
    clusters[i] = [...clusters[i], ...clusters[j]];
    clusters.splice(j, 1);
  }
  
  // Convert index-based clusters to supplier objects
  const supplierClusters = clusters.map(cluster => 
    cluster.map(index => suppliers[index])
  );
  
  return { clusters: supplierClusters };
};

// Helper function to calculate distance between clusters based on linkage method
const calculateClusterDistance = (
  cluster1: number[],
  cluster2: number[],
  distanceMatrix: number[][],
  linkageMethod: 'single' | 'complete' | 'average'
): number => {
  const distances: number[] = [];
  
  // Calculate all pairwise distances between points in the two clusters
  for (const i of cluster1) {
    for (const j of cluster2) {
      distances.push(distanceMatrix[i][j]);
    }
  }
  
  // Apply linkage method
  switch (linkageMethod) {
    case 'single':
      return Math.min(...distances); // Single linkage: minimum distance
    case 'complete':
      return Math.max(...distances); // Complete linkage: maximum distance
    case 'average':
    default:
      return distances.reduce((sum, d) => sum + d, 0) / distances.length; // Average linkage
  }
};

// Calculate distance matrix for all pairs of points
const calculateDistanceMatrix = (features: number[][]): number[][] => {
  const n = features.length;
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const distance = euclideanDistance(features[i], features[j]);
      matrix[i][j] = distance;
      matrix[j][i] = distance; // Distance matrix is symmetric
    }
  }
  
  return matrix;
};

// Helper function to find neighbors within eps distance
const regionQuery = (pointIndex: number, features: number[][], eps: number): number[] => {
  const neighbors: number[] = [];
  
  for (let i = 0; i < features.length; i++) {
    if (i !== pointIndex && euclideanDistance(features[pointIndex], features[i]) <= eps) {
      neighbors.push(i);
    }
  }
  
  return neighbors;
};

// Initialize centroids using k-means++ method for better initial centroids
const initializeCentroidsKMeansPlusPlus = (features: number[][], k: number): number[][] => {
  const centroids: number[][] = [];
  const n = features.length;
  
  // Choose the first centroid randomly
  const firstCentroidIndex = Math.floor(Math.random() * n);
  centroids.push([...features[firstCentroidIndex]]);
  
  // Choose the remaining centroids
  for (let i = 1; i < k; i++) {
    // Calculate distances from each point to the nearest centroid
    const distances = features.map(feature => {
      const distancesToCentroids = centroids.map(centroid => 
        euclideanDistance(feature, centroid)
      );
      return Math.min(...distancesToCentroids);
    });
    
    // Calculate probabilities proportional to squared distances
    const sumDistances = distances.reduce((sum, d) => sum + d * d, 0);
    const probabilities = distances.map(d => (d * d) / sumDistances);
    
    // Choose the next centroid based on the probabilities
    let r = Math.random();
    let index = 0;
    let sum = probabilities[0];
    
    while (sum < r && index < n - 1) {
      index++;
      sum += probabilities[index];
    }
    
    centroids.push([...features[index]]);
  }
  
  return centroids;
};

// Calculate Euclidean distance between two points
const euclideanDistance = (point1: number[], point2: number[]): number => {
  let sum = 0;
  for (let i = 0; i < point1.length; i++) {
    sum += Math.pow(point1[i] - point2[i], 2);
  }
  return Math.sqrt(sum);
};

// Default feature extractor that normalizes supplier attributes for clustering
const defaultFeatureExtractor = (supplier: Supplier): number[] => {
  // Extract and normalize relevant features for clustering
  return [
    supplier.sustainabilityScore ? supplier.sustainabilityScore / 100 : supplier.riskBreakdown.sustainability,
    supplier.carbonFootprint ? (100 - supplier.carbonFootprint) / 100 : supplier.riskBreakdown.sustainability,
    supplier.profitMargin ? supplier.profitMargin / 100 : supplier.riskBreakdown.financial,
    supplier.brandRecognition ? supplier.brandRecognition / 100 : 0.5,
    supplier.riskBreakdown.quality,
    supplier.riskBreakdown.delivery,
    supplier.riskBreakdown.compliance,
    supplier.riskBreakdown.financial,
    supplier.riskBreakdown.sustainability,
    supplier.deliveryRadius ? Math.min(1, supplier.deliveryRadius / 1000) : 0.5
  ];
};

// Feature extractors for specific cluster types
export const getFeatureExtractorForClusterType = (clusterType: string): ((supplier: Supplier) => number[]) => {
  switch (clusterType) {
    case 'Sustainability Cluster':
      return (supplier: Supplier): number[] => [
        supplier.sustainabilityScore ? supplier.sustainabilityScore / 100 : supplier.riskBreakdown.sustainability,
        supplier.carbonFootprint ? (100 - supplier.carbonFootprint) / 100 : supplier.riskBreakdown.sustainability,
        supplier.riskBreakdown.sustainability,
        supplier.riskBreakdown.compliance,
        supplier.deliveryRadius ? Math.min(1, supplier.deliveryRadius / 1000) : 0.5
      ];
      
    case 'Local Consumption Cluster':
      return (supplier: Supplier): number[] => [
        supplier.localRelevance ? supplier.localRelevance / 100 : 0.7,
        supplier.riskBreakdown.quality,
        supplier.riskBreakdown.delivery,
        supplier.deliveryRadius ? Math.min(1, supplier.deliveryRadius / 1000) : 0.5
      ];
      
    case 'High Profit Margin Cluster':
      return (supplier: Supplier): number[] => [
        supplier.profitMargin ? supplier.profitMargin / 100 : supplier.riskBreakdown.financial,
        supplier.riskBreakdown.financial,
        supplier.riskBreakdown.quality,
        supplier.riskBreakdown.delivery
      ];
      
    case 'Brand Value Cluster':
      return (supplier: Supplier): number[] => [
        supplier.brandRecognition ? supplier.brandRecognition / 100 : 0.5,
        supplier.riskBreakdown.quality,
        supplier.riskBreakdown.compliance
      ];
      
    case 'Product Quality Cluster':
      return (supplier: Supplier): number[] => [
        supplier.riskBreakdown.quality,
        supplier.riskBreakdown.delivery,
        supplier.riskBreakdown.sustainability
      ];
      
    default:
      return defaultFeatureExtractor;
  }
};