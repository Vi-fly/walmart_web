import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadMockData } from '@/data/mockData';
import type { Cluster, Store, Supplier } from '@/types';
import {
    ClusterAnimationManager,
    determineSupplierCluster,
    initializeAnimationManager
} from '@/utils/clusterUtils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Eye, EyeOff, Factory, Settings, StoreIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LossSupplier {
  supplier: Supplier;
  lossFactors: string[];
  lossAmount: number;
}

interface AlternativeGroup {
  groupName: string;
  factor: string;
  suppliers: Supplier[];
  potentialSavings: number;
  color: string;
}

const InteractiveMap = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const connectionsLayer = useRef<L.LayerGroup | null>(null);
  const clustersLayer = useRef<L.LayerGroup | null>(null);
  const animationManager = useRef<ClusterAnimationManager | null>(null);

  // State to hold dynamically loaded data
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state for data

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [activeLayer, setActiveLayer] = useState<'stores' | 'suppliers' | 'both'>('stores');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showClusters, setShowClusters] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showStoreDetails, setShowStoreDetails] = useState(false);
  const [showAlternativeClusters, setShowAlternativeClusters] = useState(false);
  const [alternativeSuppliers, setAlternativeSuppliers] = useState<Supplier[]>([]);
  const [dynamicClusters, setDynamicClusters] = useState<Cluster[]>([]);
  const [clusterUpdateInterval, setClusterUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  const [parameterUpdates, setParameterUpdates] = useState<{ [clusterType: string]: { [param: string]: number } }>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedClusterCategory, setSelectedClusterCategory] = useState<string | null>(null);
  const [clusterParameters, setClusterParameters] = useState({
    sustainabilityScore: 0,
    profitMargin: 0,
    productQuality: 0,
    localRelevance: 0,
    brandRecognition: 0
  });
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [defaultClusterParameters, setDefaultClusterParameters] = useState<{ [key: string]: number }>({});

  // Supplier categories will be derived from loaded data or remain hardcoded if not dynamic
  const supplierCategories = [
    'Local Consumption', 'High Profit Margin', 'Brand Value', 'Export Quality',
    'Innovation Hub', 'Marine Products', 'Sustainable Agriculture', 'Specialty Products',
    'Beverage Specialty', 'Bakery & Confectionery', 'Non-Food Retail', 'Personal Care',
    'Electronics & Appliances', 'Automotive & Hardware', 'Frozen & Processed',
    'Packaged Snacks', 'Traditional Foods', 'Beverages', 'Grain Processing', 'Product Quality',
    'General', // Added 'General' as a fallback category from loadMockData
    'Sustainability' // Added based on alternate_suppliers.json clusterId
  ];

  // Default parameter values for each cluster type
  const getDefaultClusterParameters = (clusterType: string) => {
    const defaults: { [key: string]: { [key: string]: number } } = {
      'Sustainability Cluster': {
        sustainabilityScore: 80,
        carbonFootprint: 70,
        packagingQuality: 75,
        geographicalProximity: 60,
        compliance: 65,
        consumerTrends: 70,
        riskScore: 30
      },
      'Local Consumption Cluster': {
        localRelevance: 85,
        productQuality: 75,
        availability: 80,
        sustainability: 65,
        geographicalProximity: 80,
        consumerTrends: 75,
        compliance: 70,
        riskScore: 25
      },
      'High Profit Margin Cluster': {
        profitMargin: 25,
        productQuality: 80,
        availability: 75,
        sustainability: 60,
        geographicalProximity: 65,
        consumerTrends: 70,
        compliance: 65,
        riskScore: 20
      },
      'Brand Value Cluster': {
        brandRecognition: 85,
        productQuality: 85,
        availability: 80,
        compliance: 75,
        consumerTrends: 80,
        riskScore: 15
      },
      'Product Quality Cluster': {
        productQuality: 90,
        availability: 80,
        sustainability: 70,
        geographicalProximity: 70,
        consumerTrends: 75,
        compliance: 80,
        riskScore: 20
      }
    };
    
    return defaults[clusterType] || {
      sustainabilityScore: 70,
      profitMargin: 15,
      productQuality: 75,
      localRelevance: 70,
      brandRecognition: 50
    };
  };

  // Handle cluster selection
  const handleClusterSelection = (cluster: Cluster) => {
    setSelectedCluster(cluster);
    const defaults = getDefaultClusterParameters(cluster.type);
    setDefaultClusterParameters(defaults);
    
    // Set current parameters to default values
    setClusterParameters({
      sustainabilityScore: defaults.sustainabilityScore || 0,
      profitMargin: defaults.profitMargin || 0,
      productQuality: defaults.productQuality || 0,
      localRelevance: defaults.localRelevance || 0,
      brandRecognition: defaults.brandRecognition || 0
    });
    
    console.log('Cluster selected:', cluster.type, 'Default parameters:', defaults);
  };

  // Enhanced parameter change handler with cluster-specific logic
  const handleParameterChange = (parameter: keyof typeof clusterParameters, value: number) => {
    const newParams = { ...clusterParameters, [parameter]: value };
    
    // Normalize parameters to prevent total from exceeding 100
    const total = Object.values(newParams).reduce((sum, val) => sum + val, 0);
    if (total > 100) {
      const otherParamsTotal = total - value;
      const factor = (100 - value) / otherParamsTotal;
      
      for (const key in newParams) {
        if (key !== parameter) {
          newParams[key as keyof typeof clusterParameters] = Math.round(newParams[key as keyof typeof clusterParameters] * factor);
        }
      }
    }
    
    setClusterParameters(newParams);
    
    // If a cluster is selected, update it with enhanced sizing
    if (selectedCluster) {
      updateSelectedClusterWithEnhancedSizing(selectedCluster, newParams, parameter, value);
    } else {
      updateDynamicClustersWithAnimation();
    }
  };

  // Enhanced cluster sizing based on parameter changes
  const updateSelectedClusterWithEnhancedSizing = (
    cluster: Cluster, 
    params: typeof clusterParameters, 
    changedParameter: keyof typeof clusterParameters, 
    newValue: number
  ) => {
    // Calculate parameter weightage impact
    const parameterWeights: { [key: string]: number } = {
      sustainabilityScore: 30,
      profitMargin: 25,
      productQuality: 25,
      localRelevance: 20,
      brandRecognition: 20
    };
    
    const weight = parameterWeights[changedParameter] || 15;
    const weightageImpact = (newValue / 100) * (weight / 100);
    
    // Calculate base radius increase based on weightage
    const baseRadiusIncrease = weightageImpact * 50; // Max 50km increase for high weightage
    
    // Get suppliers that match the enhanced criteria
    const matchingSuppliers = alternativeSuppliers.filter(supplier => {
      const score = calculateClusterScore(supplier, cluster.type);
      const enhancedThreshold = 65 + (weightageImpact * 20); // Dynamic threshold
      return score >= enhancedThreshold;
    });
    
    // Update cluster with new suppliers and radius
    const updatedCluster: Cluster = {
      ...cluster,
      radius: Math.min(cluster.radius + baseRadiusIncrease, 200), // Cap at 200km
      suppliers: matchingSuppliers.map(s => s.id),
      avgScore: matchingSuppliers.length > 0 ? 
        matchingSuppliers.reduce((sum, s) => sum + calculateClusterScore(s, cluster.type), 0) / matchingSuppliers.length : 
        cluster.avgScore
    };
    
    // Update the clusters array
    setDynamicClusters(prevClusters => 
      prevClusters.map(c => c.id === cluster.id ? updatedCluster : c)
    );
    
    // Trigger map update
    setTimeout(() => {
      updateClusters();
    }, 100);
  };

  // Enhanced cluster update with smooth animations
  const updateDynamicClustersWithAnimation = (
    paramUpdates?: { [clusterType: string]: { [param: string]: number } },
    suppliersList: Supplier[] = alternativeSuppliers
  ) => {
    if (suppliersList.length === 0) {
      console.log('No alternative suppliers available for clustering');
      return; // Only generate clusters if we have alternative suppliers
    }

    console.log('Real-time cluster update triggered...', {
      paramUpdates,
      clusterParameters,
      alternativeSuppliers: suppliersList.length
    });
    setIsAnimating(true);

    // Use provided or state suppliers for clustering
    const clustersData = generateClusterDataFromAlternatives(suppliersList, clusterParameters);
    
    console.log('Generated clusters:', clustersData);
    
    // Animate cluster transitions
    setTimeout(() => {
      setDynamicClusters(clustersData);
      setIsAnimating(false);
      console.log('Clusters updated, animation complete');
    }, 100);
  };

  // Load alternative suppliers for selected store
  const loadAlternativeSuppliers = async (storeId: string) => {
    try {
      const response = await fetch('/walmart_us_alternate_suppliers.json');
      const data = await response.json();
      const storeAlternatives = data.alternateSuppliers.filter((alt: any) => alt.storeId === storeId);
      
      // No storeId needed here as it's filtered on load
      const transformedAlternatives: Supplier[] = storeAlternatives.map((alt: any, index: number) => ({
        id: `alt-${storeId}-${index}`, // Generate unique ID for alternative supplier
        name: alt.name || `Alternative Supplier ${index + 1}`, // Use name from data or generate one
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
        sustainabilityScore: alt.parameters.sustainabilityScore || alt.parameters.performanceScore || 70,
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
        certifications: ['ISO 9001', 'ISO 14001'],
        lastAudit: '2024-06-15',
        performanceTrend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)] as any,
        contact: {
          name: `${alt.name} Manager`,
          email: `contact@${alt.name.toLowerCase().replace(/ /g, '')}.com`,
          phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
        },
        address: `${alt.name} Headquarters`,
        establishedYear: Math.floor(Math.random() * 30) + 1990,
        employeeCount: Math.floor(Math.random() * 500) + 50,
      }));
      
      setAlternativeSuppliers(transformedAlternatives);
      return transformedAlternatives;
    } catch (error) {
      console.error('Failed to load alternative suppliers:', error);
      return [];
    }
  };

  // Calculate cluster score for a supplier
  const calculateClusterScore = (supplier: Supplier, clusterType: string): number => {
    const parameters = getDefaultClusterParameters(clusterType);
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(parameters).forEach(([param, weight]) => {
      let value = 0;
      
      switch (param) {
        case 'sustainabilityScore':
          value = supplier.sustainabilityScore || 70;
          break;
        case 'profitMargin':
          value = supplier.profitMargin || 15;
          break;
        case 'productQuality':
          value = supplier.productQuality || 75;
          break;
        case 'localRelevance':
          value = supplier.localRelevance || 70;
          break;
        case 'brandRecognition':
          value = supplier.brandRecognition || 50;
          break;
        default:
          value = 70;
      }
      
      totalScore += (value * weight);
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };

  // Generate cluster data from alternative suppliers based on parameters
  const generateClusterDataFromAlternatives = (altSuppliers: Supplier[], params: typeof clusterParameters): Cluster[] => {
    if (altSuppliers.length === 0) return [];

    // Group suppliers by category/cluster type
    const clusterGroups: { [key: string]: Supplier[] } = {};
    
    altSuppliers.forEach(supplier => {
      const clusterType = supplier.category;
      if (!clusterGroups[clusterType]) {
        clusterGroups[clusterType] = [];
      }
      clusterGroups[clusterType].push(supplier);
    });

    // Create cluster objects with dynamic sizing based on parameters
    return Object.entries(clusterGroups).map(([clusterType, suppliers]) => {
      if (suppliers.length === 0) return null;
      
      // Calculate cluster center
      const avgLon = suppliers.reduce((sum, s) => sum + s.coordinates[0], 0) / suppliers.length;
      const avgLat = suppliers.reduce((sum, s) => sum + s.coordinates[1], 0) / suppliers.length;
      
      // Calculate dynamic radius based on parameters and supplier properties
      const baseRadius = 15; // Base radius in km (increased for better visibility)
      
      // Check if any parameters are set (non-zero)
      const hasActiveParameters = params.sustainabilityScore > 0 || params.profitMargin > 0 || 
                                  params.productQuality > 0 || params.localRelevance > 0;
      
      const parameterInfluence = hasActiveParameters ? (
        (params.sustainabilityScore / 100) * 0.3 +
        (params.profitMargin / 50) * 0.25 +
        (params.productQuality / 100) * 0.25 +
        (params.localRelevance / 100) * 0.2
      ) : 0.5; // Default influence when no parameters are set
      
      // Calculate average scores for this cluster
      const avgSustainability = suppliers.reduce((sum, s) => sum + (s.sustainabilityScore || 70), 0) / suppliers.length;
      const avgProfitMargin = suppliers.reduce((sum, s) => sum + (s.profitMargin || 25), 0) / suppliers.length;
      const avgProductQuality = suppliers.reduce((sum, s) => sum + (s.productQuality || 80), 0) / suppliers.length;
      const avgLocalRelevance = suppliers.reduce((sum, s) => sum + (s.localRelevance || 60), 0) / suppliers.length;
      
      // Calculate cluster score differently based on whether parameters are active
      const clusterScore = hasActiveParameters ? (
        avgSustainability * (params.sustainabilityScore / 100) +
        avgProfitMargin * (params.profitMargin / 50) +
        avgProductQuality * (params.productQuality / 100) +
        avgLocalRelevance * (params.localRelevance / 100)
      ) / 4 : (
        // Default scoring when no parameters are set
        (avgSustainability + avgProfitMargin + avgProductQuality + avgLocalRelevance) / 4
      );
      
      // Dynamic radius calculation
      const dynamicRadius = baseRadius + (parameterInfluence * 20) + (clusterScore / 100 * 15);
      
      // Cluster colors
      const clusterColors: { [key: string]: string } = {
        'Sustainability': '#10b981',
        'Sustainable Agriculture': '#10b981',
        'Local Consumption': '#3b82f6',
        'High Profit Margin': '#f59e0b',
        'Brand Value': '#8b5cf6',
        'Product Quality': '#06d6a0',
      };
      
      return {
        id: `cluster-${clusterType}`,
        type: clusterType as any,
        center: [avgLon, avgLat] as [number, number],
        radius: dynamicRadius,
        suppliers: suppliers.map(s => s.id),
        avgScore: clusterScore,
        totalValue: suppliers.reduce((sum, s) => sum + s.contractValue, 0),
        stores: selectedStore ? [selectedStore.id] : [],
        color: clusterColors[clusterType] || '#6b7280',
        parameters: {
          sustainabilityScore: { weight: params.sustainabilityScore, importance: 'high' },
          profitMargin: { weight: params.profitMargin, importance: 'medium' },
          productQuality: { weight: params.productQuality, importance: 'high' },
          localRelevance: { weight: params.localRelevance, importance: 'medium' }
        }
      };
    }).filter(Boolean) as Cluster[];
  };

  // Initialize animation system
  const initializeAnimationSystem = () => {
    const onAnimationUpdate = (clusterId: string, progress: number) => {
      // Update cluster visualization during animation
      updateClusters();
    };

    animationManager.current = initializeAnimationManager(onAnimationUpdate);
    console.log('Animation system initialized');
  };

  const initializeMap = () => {
    if (!mapContainer.current) return;

    // Initialize the map centered on the US (since data is US-based now)
    map.current = L.map(mapContainer.current, {
      center: [39.8283, -98.5795],
      zoom: 4,
      zoomControl: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      boxZoom: true,
      keyboard: true,
    }).setView([39.8283, -98.5795], 4); // Centered on approximate center of US with full interaction enabled

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Initialize layer groups
    markersLayer.current = L.layerGroup().addTo(map.current);
    connectionsLayer.current = L.layerGroup().addTo(map.current);
    clustersLayer.current = L.layerGroup().addTo(map.current);

    updateMapContent();
  };

  // Enhanced supplier icon creation with animation states
  const createSupplierIcon = (supplier: Supplier) => {
    const riskLevel = getRiskLevel(supplier.riskScore); // Risk score is now 0-100
    const colors = {
      high: '#ef4444', // Red for high risk
      medium: '#eab308', // Yellow for medium risk
      low: '#22c55e' // Green for low risk
    };

    // Get animated visual state
    const animationState = animationManager.current?.getSupplierVisualState(supplier.id);
    const finalColor = animationState?.color || colors[riskLevel];
    const opacity = animationState?.opacity || 1;
    const scale = animationState?.scale || 1;

    const categoryColors: { [key: string]: string } = {
      'Sustainability': '#84cc16', // Green for sustainability
      'Local Consumption': '#3b82f6', // Blue for local consumption
      'High Profit Margin': '#10b981', // Teal for high profit margin
      'Brand Value': '#8b5cf6', // Purple for brand value
      'Product Quality': '#06d6a0', // Turquoise for product quality
      'General': '#6b7280' // Grey for general/fallback
    };


    const size = 20 * scale;
    return L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, ${categoryColors[supplier.category] || '#6b7280'}, ${finalColor});
          width: ${size}px;
          height: ${size}px;
          border-radius: 4px;
          border: 2px solid white;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          opacity: ${opacity};
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        ">
          <div style="
            width: ${size * 0.3}px;
            height: ${size * 0.3}px;
            background: white;
            border-radius: 1px;
          "></div>
        </div>
      `,
      className: 'custom-supplier-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Enhanced cluster update with smooth animations
  const updateClusters = () => {
    if (!map.current || !clustersLayer.current || !showClusters) {
      clustersLayer.current?.clearLayers();
      return;
    }

    clustersLayer.current.clearLayers();
    
    // If showing alternative clusters for a selected store, create clusters from alternative suppliers
    if (selectedStore && showAlternativeClusters && alternativeSuppliers.length > 0) {
      const clusterGroups: { [key: string]: Supplier[] } = {};
      
      // Group alternative suppliers by their clusterId
      alternativeSuppliers.forEach(supplier => {
        const clusterType = supplier.category; // Using category as cluster type
        if (!clusterGroups[clusterType]) {
          clusterGroups[clusterType] = [];
        }
        clusterGroups[clusterType].push(supplier);
      });
      
      // Create visual clusters for each group
      Object.entries(clusterGroups).forEach(([clusterType, suppliers]) => {
        if (suppliers.length === 0) return;
        
        // Calculate cluster center
        const avgLon = suppliers.reduce((sum, s) => sum + s.coordinates[0], 0) / suppliers.length;
        const avgLat = suppliers.reduce((sum, s) => sum + s.coordinates[1], 0) / suppliers.length;
        
        // Calculate cluster radius
        const distances = suppliers.map(s => {
          const R = 6371;
          const dLat = (s.coordinates[1] - avgLat) * Math.PI / 180;
          const dLon = (s.coordinates[0] - avgLon) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(avgLat * Math.PI / 180) * Math.cos(s.coordinates[1] * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        });
        const maxDistance = Math.max(...distances);
        const radiusKm = Math.max(maxDistance + 5, 10); // At least 10km radius
        
        // Cluster colors
        const clusterColors: { [key: string]: string } = {
          'Sustainability': '#10b981',
          'Local Consumption': '#3b82f6',
          'High Profit Margin': '#f59e0b',
          'Brand Value': '#8b5cf6',
          'Product Quality': '#06d6a0',
          'Sustainable Agriculture': '#84cc16'
        };
        
        // Create cluster circle
        const circle = L.circle([avgLat, avgLon], {
          radius: radiusKm * 1000, // Convert to meters
          fillColor: clusterColors[clusterType] || '#6b7280',
          color: clusterColors[clusterType] || '#6b7280',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.2
        });
        
        // Add click handler for cluster selection
        circle.on('click', () => {
          const clusterData: Cluster = {
            id: `cluster-${clusterType}`,
            type: clusterType as any,
            center: [avgLon, avgLat] as [number, number],
            radius: radiusKm,
            suppliers: suppliers.map(s => s.id),
            avgScore: suppliers.reduce((sum, s) => sum + s.riskScore, 0) / suppliers.length,
            totalValue: suppliers.reduce((sum, s) => sum + s.contractValue, 0),
            stores: selectedStore ? [selectedStore.id] : [],
            color: clusterColors[clusterType] || '#6b7280',
            parameters: {
              sustainabilityScore: { weight: 0, importance: 'medium' },
              profitMargin: { weight: 0, importance: 'medium' },
              productQuality: { weight: 0, importance: 'medium' },
              localRelevance: { weight: 0, importance: 'medium' }
            }
          };
          handleClusterSelection(clusterData);
        });
        
        // Create cluster label
        const label = L.divIcon({
          html: `
            <div style="
              background: ${clusterColors[clusterType] || '#6b7280'}ee;
              color: white;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
              text-align: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              border: 1px solid white;
              white-space: nowrap;
            ">
              ${clusterType}<br>
              <span style="font-size: 10px; opacity: 0.9;">
                ${suppliers.length} alternatives
              </span>
            </div>
          `,
          className: 'cluster-label',
          iconSize: [120, 40],
          iconAnchor: [60, 20],
        });
        
        const labelMarker = L.marker([avgLat, avgLon], {
          icon: label,
          interactive: false
        });
        
        circle.bindPopup(`
          <div class="p-3 min-w-64">
            <h3 class="font-semibold text-sm mb-2">${clusterType} Alternative Cluster</h3>
            <div class="space-y-1 text-xs">
              <p><strong>Alternative Suppliers:</strong> ${suppliers.length}</p>
              <p><strong>For Store:</strong> ${selectedStore.name}</p>
              <p><strong>Average Risk Score:</strong> ${(suppliers.reduce((sum, s) => sum + s.riskScore, 0) / suppliers.length).toFixed(1)}</p>
              <div class="mt-2">
                <p class="font-medium">Suppliers:</p>
                ${suppliers.slice(0, 3).map(s => `<p class="text-xs">• ${s.name}</p>`).join('')}
                ${suppliers.length > 3 ? `<p class="text-xs">... and ${suppliers.length - 3} more</p>` : ''}
              </div>
              <div class="mt-2 p-2 bg-blue-50 rounded">
                <p class="text-xs text-blue-600">💡 Click to select this cluster and adjust parameters</p>
              </div>
            </div>
          </div>
        `);
        
        clustersLayer.current?.addLayer(circle);
        clustersLayer.current?.addLayer(labelMarker);
      });
      
      return;
    }

    // Process regular dynamic clusters
    dynamicClusters.forEach(cluster => {
      const currentRadius = animationManager.current?.getCurrentRadius(cluster.id, cluster.radius) || cluster.radius;

      // Create smooth cluster bubble with animated radius
      const circle = L.circle([cluster.center[1], cluster.center[0]], {
        color: cluster.color,
        fillColor: cluster.color,
        fillOpacity: isAnimating ? 0.25 : 0.15,
        radius: currentRadius * 1000, // Convert to meters
        weight: 2,
        opacity: 0.6,
        dashArray: '5, 5',
        className: 'cluster-circle'
      });

      // Enhanced cluster label with animation feedback
      const label = L.divIcon({
        html: `
          <div style="
            background: ${cluster.color}ee;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-align: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            border: 1px solid white;
            white-space: nowrap;
            transform: scale(${isAnimating ? '1.05' : '1'});
            transition: transform 0.3s ease;
          ">
            ${cluster.type}<br>
            <span style="font-size: 10px; opacity: 0.9;">
              ${cluster.suppliers.length} suppliers | Score: ${cluster.avgScore.toFixed(1)}
              ${isAnimating ? '<br>🔄 Updating...' : ''}
            </span>
          </div>
        `,
        className: 'cluster-label',
        iconSize: [140, isAnimating ? 50 : 40],
        iconAnchor: [70, isAnimating ? 25 : 20],
      });

      const labelMarker = L.marker([cluster.center[1], cluster.center[0]], {
        icon: label,
        interactive: false
      });

      // Enhanced popup with parameter information and animation status
      const parameterInfo = Object.entries(cluster.parameters)
        .map(([param, config]) => `<li><strong>${param}:</strong> ${config.weight}% - ${config.importance}</li>`)
        .join('');

      circle.bindPopup(`
        <div class="p-3 min-w-80 max-w-96">
          <h3 class="font-semibold text-sm mb-2">${cluster.type}</h3>
          ${isAnimating ? '<div class="mb-2 p-2 bg-blue-50 rounded text-xs text-blue-600">🔄 Real-time updates active</div>' : ''}
          <div class="space-y-2 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <p><strong>Suppliers:</strong> ${cluster.suppliers.length}</p>
              <p><strong>Avg Score:</strong> ${cluster.avgScore.toFixed(1)}/100</p>
              <p><strong>Radius:</strong> ${currentRadius.toFixed(1)} km</p>
              <p><strong>Total Value:</strong> ₹${cluster.totalValue.toLocaleString()}</p>
            </div>
            <div class="mt-3">
              <h4 class="font-medium mb-1">Dynamic Parameters:</h4>
              <ul class="text-xs space-y-1 max-h-32 overflow-y-auto">
                ${parameterInfo}
              </ul>
            </div>
          </div>
        </div>
      `);

      clustersLayer.current?.addLayer(circle);
      clustersLayer.current?.addLayer(labelMarker);
    });
  };

  const updateMapContent = () => {
    if (!map.current || !markersLayer.current || !connectionsLayer.current || isLoading) return; // Don't update if loading

    // Clear existing markers and connections
    markersLayer.current.clearLayers();
    connectionsLayer.current.clearLayers();

    // Progressive store filtering: show all stores initially, only selected store when one is chosen
    let storesToShow: Store[] = [];
    
    if (selectedStore) {
      // Only show the selected store
      storesToShow = [selectedStore];
    } else {
      // Show all stores (no filtering)
      storesToShow = stores;
    }

    // Progressive disclosure: Show suppliers based on current state
    let suppliersToShow: Supplier[] = [];
    let additionalSuppliersToShow: Supplier[] = [];
    
    if (selectedStore) {
      if (showAlternativeClusters) {
        // Filter alternative suppliers by category and parameters
        console.log('Filtering alternative suppliers:', {
          totalAlternatives: alternativeSuppliers.length,
          selectedCategory: selectedClusterCategory,
          clusterParameters
        });
        
        suppliersToShow = alternativeSuppliers.filter(supplier => {
          const matchesCategory = selectedClusterCategory ? supplier.category === selectedClusterCategory : true;
          
          // If no category is selected (showing all), apply parameter filters more strictly
          // If a specific category is selected, be more lenient with parameter filtering
          const isSpecificCategory = selectedClusterCategory !== null;
          
          // Calculate how many parameters the supplier meets
          let metParameters = 0;
          let totalParameters = 0;
          
          if (clusterParameters.sustainabilityScore > 0) {
            totalParameters++;
            if ((supplier.sustainabilityScore || 0) >= clusterParameters.sustainabilityScore) {
              metParameters++;
            }
          }
          
          if (clusterParameters.profitMargin > 0) {
            totalParameters++;
            if ((supplier.profitMargin || 0) >= clusterParameters.profitMargin) {
              metParameters++;
            }
          }
          
          if (clusterParameters.productQuality > 0) {
            totalParameters++;
            if ((supplier.productQuality || 0) >= clusterParameters.productQuality) {
              metParameters++;
            }
          }
          
          if (clusterParameters.localRelevance > 0) {
            totalParameters++;
            if ((supplier.localRelevance || 0) >= clusterParameters.localRelevance) {
              metParameters++;
            }
          }
          
          // If no parameters are set, show all suppliers in the category
          if (totalParameters === 0) {
            return matchesCategory;
          }
          
          // For specific category selection, be more lenient - show suppliers that meet at least 50% of set parameters
          // For "all categories", be more strict - show suppliers that meet at least 75% of set parameters
          const requiredPercentage = isSpecificCategory ? 0.5 : 0.75;
          const meetsParameterThreshold = metParameters / totalParameters >= requiredPercentage;
          
          const passes = matchesCategory && meetsParameterThreshold;
          
          if (!passes) {
            console.log('Supplier filtered out:', supplier.name, {
              category: supplier.category,
              matchesCategory,
              metParameters,
              totalParameters,
              percentage: totalParameters > 0 ? (metParameters / totalParameters * 100).toFixed(1) + '%' : 'N/A',
              requiredPercentage: (requiredPercentage * 100).toFixed(1) + '%',
              isSpecificCategory
            });
          }
          
          return passes;
        });
        
        console.log('Filtered suppliers result:', suppliersToShow.length);
      } else {
        // Show only current suppliers for the selected store
        suppliersToShow = suppliers.filter(supplier => 
          selectedStore.suppliers.includes(supplier.id)
        );
      }
    } else {
      // No store selected: don't show any suppliers initially
      suppliersToShow = [];
    }

    // Add store markers
    if (activeLayer === 'stores' || activeLayer === 'both') {
      storesToShow.forEach(store => {
        const marker = L.marker([store.coordinates[1], store.coordinates[0]], {
          icon: createStoreIcon(store)
        });

        // No popup for stores - direct click selection only

        marker.on('click', () => {
          setSelectedStore(store); // Set selected store without showing details panel
          setSelectedSupplier(null);
          setShowStoreDetails(false); // Don't show the store details card
          setShowAlternativeClusters(false); // Reset alternative clusters when selecting a new store
          setActiveLayer('both'); // Switch to show both stores and suppliers
        });

        markersLayer.current?.addLayer(marker);
      });
    }

    // Add supplier markers with cluster information
    if (activeLayer === 'suppliers' || activeLayer === 'both') {
      suppliersToShow.forEach(supplier => {
        const marker = L.marker([supplier.coordinates[1], supplier.coordinates[0]], {
          icon: createSupplierIcon(supplier)
        });

        const clusterType = determineSupplierCluster(supplier);
        const clusterScore = clusterType ? calculateClusterScore(supplier, clusterType) : 0;

        marker.bindPopup(`
          <div class="p-3 min-w-60">
            <h3 class="font-semibold text-sm mb-2">${supplier.name} <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Alternative</span></h3>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span class="font-medium">Category:</span>
                <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">${supplier.category}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Risk Score:</span>
                <span class="px-2 py-1 ${getRiskLevel(supplier.riskScore) === 'low' ? 'bg-green-100 text-green-800' :
          getRiskLevel(supplier.riskScore) === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'} rounded text-xs">
                  ${supplier.riskScore.toFixed(1)}/100
                </span>
              </div>
              ${clusterType ? `
                <div class="flex justify-between">
                  <span class="font-medium">Cluster:</span>
                  <span class="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">${clusterType}</span>
                </div>
                <div class="flex justify-between">
                  <span class="font-medium">Cluster Score:</span>
                  <span class="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">${clusterScore.toFixed(1)}/100</span>
                </div>
              ` : ''}
              <p><strong>Contract:</strong> ₹${supplier.contractValue.toLocaleString()}</p>
              <p><strong>Range:</strong> ${supplier.deliveryRadius} km</p>
              <p><strong>Products:</strong> ${supplier.products.slice(0, 2).join(', ')}${supplier.products.length > 2 ? '...' : ''}</p>
              ${selectedStore ? `<p><strong>Distance to Store:</strong> ${getDistance(supplier.coordinates, selectedStore.coordinates).toFixed(1)} km</p>` : ''}
            </div>
          </div>
        `);

        // Add hover tooltip for alternative suppliers when a store is selected
        if (selectedStore) {
          marker.bindTooltip(
            `<div class="text-xs">
              <strong>${supplier.name}</strong> (Alternative)<br/>
              ${supplier.category}<br/>
              Risk: ${supplier.riskScore.toFixed(1)}/100<br/>
              Contract: ₹${supplier.contractValue.toLocaleString()}
            </div>`,
            { 
              permanent: false,
              direction: 'top',
              className: 'custom-tooltip'
            }
          );
        }

        marker.on('click', () => {
          setSelectedSupplier(supplier);
          setSelectedStore(null);
          setShowStoreDetails(false); // Hide store details if a supplier is selected
        });

        markersLayer.current?.addLayer(marker);
      });
    }

    // Add connections - show connections between selected store and its current suppliers
    if (selectedStore && showConnections && !showAlternativeClusters) {
      const currentSuppliers = suppliers.filter(s => selectedStore.suppliers.includes(s.id));
      console.log(`Drawing connections for ${currentSuppliers.length} suppliers to ${selectedStore.name}`);
      
      currentSuppliers.forEach(supplier => {
        const distance = getDistance(supplier.coordinates, selectedStore.coordinates);
        if (distance <= supplier.deliveryRadius) {
          const riskLevel = getRiskLevel(supplier.riskScore);
          // Adjusted colors for risk level based on 0-100 scale (lower score = higher risk)
          const color = riskLevel === 'low' ? '#22c55e' : riskLevel === 'medium' ? '#eab308' : '#ef4444';

          const polyline = L.polyline([
            [supplier.coordinates[1], supplier.coordinates[0]],
            [selectedStore.coordinates[1], selectedStore.coordinates[0]]
          ], {
            color: color,
            weight: 3,
            opacity: 0.7,
            dashArray: '5, 10'
          });

          // Add hover tooltip for connection
          polyline.bindTooltip(
            `<div class="text-xs">
              <strong>${supplier.name}</strong><br/>
              Risk: ${supplier.riskScore.toFixed(1)}/100<br/>
              Distance: ${distance.toFixed(1)} km<br/>
              Contract: ₹${supplier.contractValue.toLocaleString()}
            </div>`,
            { 
              permanent: false,
              direction: 'center',
              className: 'custom-tooltip'
            }
          );

          connectionsLayer.current?.addLayer(polyline);
        }
      });
    } else if (activeLayer === 'both' && showConnections && !selectedStore) {
      // Show all connections when no store is selected
      storesToShow.forEach(store => {
        store.suppliers.forEach(supplierId => {
          const supplier = suppliersToShow.find(s => s.id === supplierId);
          if (supplier) {
            const distance = getDistance(supplier.coordinates, store.coordinates);
            if (distance <= supplier.deliveryRadius) {
              const riskLevel = getRiskLevel(supplier.riskScore);
              const color = riskLevel === 'low' ? '#22c55e' : riskLevel === 'medium' ? '#eab308' : '#ef4444';

              const polyline = L.polyline([
                [supplier.coordinates[1], supplier.coordinates[0]],
                [store.coordinates[1], store.coordinates[0]]
              ], {
                color: color,
                weight: 2,
                opacity: 0.4,
                dashArray: '3, 6'
              });

              connectionsLayer.current?.addLayer(polyline);
            }
          }
        });
      });
    }
  };

  const createStoreIcon = (store: Store) => {
    const riskLevel = getRiskLevel(store.riskScore); // Risk score is now 0-100
    const colors = {
      high: '#ef4444', // Red for high risk
      medium: '#eab308', // Yellow for medium risk
      low: '#22c55e' // Green for low risk
    };
    // Store types from JSON are "Supercenter", "Neighborhood Market", so adjust sizes accordingly
    const sizes: { [key: string]: number } = {
      'Supercenter': 24,
      'Neighborhood Market': 20,
      'Express': 16, // Keep for potential future use or if some exist
      'N/A': 18 // Fallback for unknown types
    };

    const size = sizes[store.type] || sizes['N/A']; // Use N/A as fallback

    return L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, ${colors[riskLevel]}, ${colors[riskLevel]}dd);
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      className: 'custom-store-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Adjusted getRiskLevel for 0-100 score (lower score = higher risk)
  const getRiskLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score <= 30) return 'high'; // 0-30 is high risk
    if (score <= 70) return 'medium'; // 31-70 is medium risk
    return 'low'; // 71-100 is low risk
  };

  const getDistance = (coord1: [number, number], coord2: [number, number]): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    // Load data first
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { mockStores: loadedStores, mockSuppliers: loadedSuppliers } = await loadMockData();
        setStores(loadedStores);
        setSuppliers(loadedSuppliers);
      } catch (error) {
        console.error('Failed to load map data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []); // Run once on component mount

  useEffect(() => {
    if (!isLoading && stores.length > 0 && suppliers.length > 0) {
      initializeMap();
      initializeAnimationSystem();

      // Initialize empty clusters - will be created manually when needed
      setDynamicClusters([]);
      console.log('Map initialized - clusters will be created manually');
      
      // No automatic cluster updates to prevent excessive refreshing
    }

    return () => {
      map.current?.remove();
      if (clusterUpdateInterval) {
        clearInterval(clusterUpdateInterval);
      }
      animationManager.current?.destroy();
    };
  }, [isLoading, stores, suppliers]); // Re-run when data is loaded

  useEffect(() => {
    // Only update map content if data is loaded
    if (!isLoading) {
      updateMapContent();
    }
  }, [activeLayer, selectedStore, showAlternativeClusters, showConnections, alternativeSuppliers, clusterParameters, selectedClusterCategory]);

  useEffect(() => {
    // Only update clusters if data is loaded
    if (!isLoading) {
      updateClusters();
    }
  }, [showClusters, showAlternativeClusters, alternativeSuppliers, selectedStore, dynamicClusters, isLoading]);

  // Add global function for popup button
  useEffect(() => {
    (window as any).viewStoreDetails = (storeId: string) => {
      // Find the store and set it for display
      const store = stores.find(s => s.id === storeId);
      if (store) {
        setSelectedStore(store);
        setSelectedSupplier(null); // Clear supplier selection
        setShowStoreDetails(true); // Show the store details card
      }
    };

    return () => {
      delete (window as any).viewStoreDetails;
    };
  }, [navigate, stores]); // Add 'stores' to dependency array

  // Add parameter update handler with intelligent adjustment
  const renderStoreDetailsCard = () => {
    return null; // Never render store details card
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-walmart-blue mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading supply chain data...</p>
          <p className="text-sm text-gray-500">This might take a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-walmart-blue to-walmart-light-blue bg-clip-text text-transparent">
          Dynamic Supply Chain Map
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
          Real-time visualization with smooth cluster animations and dynamic parameter-based sizing
        </p>
      </div>

      <div className="flex gap-6 flex-1">
        {/* Enhanced Controls Panel */}
        <div className="w-96 space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-walmart-blue">
                <Settings className="h-5 w-5" />
                Real-Time Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enhanced Cluster Update Status */}
              <div className={`p-3 rounded-lg border ${isAnimating ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isAnimating ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className={`text-sm font-medium ${isAnimating ? 'text-blue-800' : 'text-green-800'}`}>
                    {isAnimating ? 'Animating Clusters' : 'Live Clustering Active'}
                  </span>
                </div>
                <p className="text-xs mt-1 ${isAnimating ? 'text-blue-600' : 'text-green-600'}">
                  {isAnimating ? 'Smooth transitions in progress' : 'Manual clustering mode - update when needed'}
                </p>
              </div>

              {/* Force Update Button */}
              <Button
                onClick={() => updateDynamicClustersWithAnimation(parameterUpdates)}
                className="w-full"
                variant="outline"
                disabled={isAnimating}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isAnimating ? 'Updating...' : 'Generate Clusters'}
              </Button>


              {/* Store Details Section */}
              {selectedStore ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-walmart-blue flex items-center gap-2">
                      <StoreIcon className="h-5 w-5" />
                      {selectedStore.name}
                    </h3>
                    <Button
                      onClick={() => {
                        setSelectedStore(null);
                        setSelectedSupplier(null);
                        setShowStoreDetails(false);
                        setShowAlternativeClusters(false);
                        setActiveLayer('stores');
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Store Info */}
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Type</p>
                        <p className="font-medium">{selectedStore.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Risk Score</p>
                        <p className={`font-medium ${
                          getRiskLevel(selectedStore.riskScore) === 'low' ? 'text-green-600' :
                          getRiskLevel(selectedStore.riskScore) === 'medium' ? 'text-yellow-600' : 'text-red-600'
                        }`}>{selectedStore.riskScore.toFixed(1)}/100</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-medium">₹{selectedStore.monthlyRevenue.toLocaleString()}/mo</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Customers</p>
                        <p className="font-medium">{selectedStore.customerCount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Connected Suppliers Info */}
                  <div className="mb-4">
                    <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
                      <Factory className="h-4 w-4" />
                      Connected Suppliers ({selectedStore.suppliers.length})
                    </h4>
                    <div className="text-xs text-gray-600 mb-3">
                      {showAlternativeClusters ? 'Showing alternative suppliers with clusters' : 'Showing current suppliers'}
                    </div>
                  </div>
                  
                  {/* Generate Clusters Button */}
                  <div className="mb-4">
                    <Button
                      onClick={async () => {
                        console.log('Generate Clusters button clicked');
                        if (!showAlternativeClusters) {
                          const loadedAlternatives = await loadAlternativeSuppliers(selectedStore.id);
                          console.log('Loaded alternatives:', loadedAlternatives.length);
                          
                          setAlternativeSuppliers(loadedAlternatives);
                          setShowAlternativeClusters(true);
                          setShowClusters(true);
                          
                          // Pass loaded data directly to prevent race condition
                          console.log('Triggering initial cluster generation');
                          updateDynamicClustersWithAnimation(undefined, loadedAlternatives);
                        } else {
                          setShowAlternativeClusters(false);
                          setShowClusters(false);
                          setAlternativeSuppliers([]);
                          setDynamicClusters([]);
                        }
                      }}
                      variant={showAlternativeClusters ? "default" : "outline"}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                    >
                      🤖 {showAlternativeClusters ? "Hide Clusters" : "Generate Clusters"}
                    </Button>
                  </div>
                  
                  {/* Show Connections Toggle */}
                  <div className="mb-4">
                    <Button
                      onClick={() => setShowConnections(!showConnections)}
                      variant={showConnections ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                    >
                      {showConnections ? "Hide Connections" : "Show Connections"}
                    </Button>
                  </div>
                  
                  {/* Cluster Parameters - Only show when clusters are active */}
                  {showAlternativeClusters && (
                    <div className="border-t pt-4">
                      <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Cluster Parameters
                      </h4>
                      
                      {/* Cluster Category Dropdown */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium mb-1 text-gray-700">Cluster Category</label>
                        <Select 
                          value={selectedClusterCategory || 'all'}
                          onValueChange={(value) => setSelectedClusterCategory(value === 'all' ? null : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a cluster category..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {[...new Set(alternativeSuppliers.map(s => s.category))].map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Filtering Behavior Indicator */}
                        <div className="mt-2 p-2 rounded text-xs bg-gray-50 border">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="font-medium">Filtering Mode:</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              selectedClusterCategory ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {selectedClusterCategory ? 'Lenient (50% threshold)' : 'Strict (75% threshold)'}
                            </span>
                          </div>
                          <p className="text-gray-600">
                            {selectedClusterCategory 
                              ? `Showing ${selectedClusterCategory} suppliers that meet at least 50% of set parameters`
                              : 'Showing suppliers from all categories that meet at least 75% of set parameters'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-700">
                            Sustainability: {clusterParameters.sustainabilityScore}
                          </label>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            value={clusterParameters.sustainabilityScore}
                            onChange={(e) => handleParameterChange('sustainabilityScore', parseInt(e.target.value))}
                            className="w-full h-2 bg-green-100 accent-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-700">
                            Profit Margin: {clusterParameters.profitMargin}
                          </label>
                          <Input
                            type="range"
                            min="0"
                            max="50"
                            value={clusterParameters.profitMargin}
                            onChange={(e) => handleParameterChange('profitMargin', parseInt(e.target.value))}
                            className="w-full h-2 bg-yellow-100 accent-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-700">
                            Product Quality: {clusterParameters.productQuality}
                          </label>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            value={clusterParameters.productQuality}
                            onChange={(e) => handleParameterChange('productQuality', parseInt(e.target.value))}
                            className="w-full h-2 bg-blue-100 accent-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-700">
                            Local Relevance: {clusterParameters.localRelevance}
                          </label>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            value={clusterParameters.localRelevance}
                            onChange={(e) => handleParameterChange('localRelevance', parseInt(e.target.value))}
                            className="w-full h-2 bg-indigo-100 accent-indigo-500"
                          />
                        </div>
                        <div className="text-xs text-purple-600 bg-purple-100 p-2 rounded mt-3">
                          💡 Adjust parameters to see real-time cluster changes. When a specific category is selected, filtering is more lenient (50% threshold). When showing all categories, filtering is stricter (75% threshold).
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-sm font-semibold mb-3 block text-gray-700">Display Status</label>
                  <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2">
                      <StoreIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Showing all stores</span>
                    </div>
                    <p className="text-xs mt-1 text-blue-600">
                      Click a store to see its suppliers and options
                    </p>
                  </div>
                </div>
              )}

              {/* View Options */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={showClusters ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowClusters(!showClusters)}
                  className="h-8"
                >
                  {showClusters ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                  Animated Clusters
                </Button>
                <Button
                  variant={showConnections ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowConnections(!showConnections)}
                  className="h-8"
                >
                  {showConnections ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                  Connections
                </Button>
              </div>



            </CardContent>
          </Card>
        </div>

        {/* Map Container */}
        <div className="flex-1 rounded-xl overflow-hidden shadow-2xl border-4 border-white relative">
          <div ref={mapContainer} className="h-full w-full" />
          
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
