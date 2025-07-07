import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { loadMockData } from '@/data/mockData';
import type { Store, Supplier } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, MapPin, Package, Phone, TrendingUp, Users, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
  hasLoss: boolean;
}

interface WeightingFactors {
  productQuality: number;
  profitMargin: number;
  geographicalProximity: number;
}

interface AlternativeWithComparison {
  supplier: Supplier;
  improvements: string[];
  score: number;
  betterIn: string[];
}

interface SupplierCluster {
  center: [number, number];
  suppliers: AlternativeWithComparison[];
  radius: number;
  color: string;
  category: string;
}

const StoreDetails = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  
  // Map-related refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const connectionsLayer = useRef<L.LayerGroup | null>(null);
  const clustersLayer = useRef<L.LayerGroup | null>(null);
  const alternativesLayer = useRef<L.LayerGroup | null>(null);
  
  const [store, setStore] = useState<Store | null>(null);
  const [storeSuppliers, setStoreSuppliers] = useState<LossSupplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<LossSupplier | null>(null);
  const [alternativeSuppliers, setAlternativeSuppliers] = useState<AlternativeWithComparison[]>([]);
  const [weights, setWeights] = useState<WeightingFactors>({
    productQuality: 40,
    profitMargin: 30,
    geographicalProximity: 30
  });
  const [showWeightPanel, setShowWeightPanel] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load data first
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { mockStores: loadedStores, mockSuppliers: loadedSuppliers } = await loadMockData();
        setStores(loadedStores);
        setSuppliers(loadedSuppliers);
        
        if (storeId) {
          const foundStore = loadedStores.find(s => s.id === storeId);
          if (foundStore) {
            setStore(foundStore);
            generateStoreSuppliers(foundStore, loadedSuppliers);
          }
        }
      } catch (error) {
        console.error('Failed to load store data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [storeId]);

  // Update alternatives when weights or selected supplier changes
  useEffect(() => {
    if (selectedSupplier && store && suppliers.length > 0) {
      const alternatives = getAlternativeSuppliers(selectedSupplier);
      setAlternativeSuppliers(alternatives);
      showAlternativeSuppliers(alternatives);
    }
  }, [weights, selectedSupplier?.supplier.id, store?.id]); // Use IDs instead of objects

  const generateDiverseLossFactors = (supplier: Supplier, store: Store): string[] => {
    const factors = [];
    const distance = getDistance(supplier.coordinates, store.coordinates);
    
    // Quality-based factors
    if (supplier.riskBreakdown.quality < 6) {
      const qualityFactors = ['Poor Product Quality', 'Inconsistent Product Standards', 'High Defect Rate'];
      factors.push(qualityFactors[Math.floor(Math.random() * qualityFactors.length)]);
    }
    
    // Delivery-based factors
    if (supplier.riskBreakdown.delivery < 6) {
      const deliveryFactors = ['Delayed Delivery', 'Unreliable Transportation', 'Poor Logistics Management'];
      factors.push(deliveryFactors[Math.floor(Math.random() * deliveryFactors.length)]);
    }
    
    // Financial factors
    if (supplier.riskBreakdown.financial < 6) {
      const financialFactors = ['Low Profit Margin', 'High Operating Costs', 'Price Volatility'];
      factors.push(financialFactors[Math.floor(Math.random() * financialFactors.length)]);
    }
    
    // Distance-based factors
    if (distance > 100) {
      const distanceFactors = ['Low Shelf Life (Distance)', 'High Transportation Costs', 'Cold Chain Issues'];
      factors.push(distanceFactors[Math.floor(Math.random() * distanceFactors.length)]);
    }
    
    // Compliance factors
    if (supplier.riskBreakdown.compliance < 6) {
      const complianceFactors = ['Poor Packaging', 'Regulatory Non-compliance', 'Safety Standard Issues'];
      factors.push(complianceFactors[Math.floor(Math.random() * complianceFactors.length)]);
    }
    
    // Sustainability factors
    if (supplier.riskBreakdown.sustainability < 6) {
      const sustainabilityFactors = ['Environmental Impact', 'Unsustainable Practices', 'Carbon Footprint Issues'];
      factors.push(sustainabilityFactors[Math.floor(Math.random() * sustainabilityFactors.length)]);
    }
    
    // Customer feedback factors
    if (supplier.riskBreakdown.customerFeedback < 6) {
      const feedbackFactors = ['Poor Customer Satisfaction', 'Frequent Complaints', 'Brand Image Issues'];
      factors.push(feedbackFactors[Math.floor(Math.random() * feedbackFactors.length)]);
    }
    
    return factors;
  };

  const generateStoreSuppliers = (store: Store, loadedSuppliers: Supplier[]) => {
    const currentStoreSuppliers = loadedSuppliers.filter(s => store.suppliers.includes(s.id));
    const lossSuppliers: LossSupplier[] = [];

    currentStoreSuppliers.forEach(supplier => {
      const factors = generateDiverseLossFactors(supplier, store);
      const hasLoss = factors.length > 0;
      const lossAmount = hasLoss ? Math.random() * 50000 + 10000 : 0;

      lossSuppliers.push({
        supplier,
        lossFactors: factors,
        lossAmount,
        hasLoss
      });
    });

    setStoreSuppliers(lossSuppliers);
  };

  const getDistance = (coord1: [number, number], coord2: [number, number]): number => {
    const R = 6371;
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const createSupplierClusters = (alternatives: AlternativeWithComparison[]): SupplierCluster[] => {
    if (!store || alternatives.length === 0) return [];

    const clusters: SupplierCluster[] = [];
    const categoryColors = {
      'Local Consumption': '#10b981',
      'High Profit Margin': '#3b82f6',
      'Brand Value': '#8b5cf6',
      'Export Quality': '#f59e0b',
      'Sustainable Agriculture': '#84cc16',
      'Innovation Hub': '#06d6a0',
      'Marine Products': '#0ea5e9',
      'Specialty Products': '#f97316'
    };

    // Group suppliers by category
    const categoryGroups: { [key: string]: AlternativeWithComparison[] } = {};
    alternatives.forEach(alt => {
      const category = alt.supplier.category;
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(alt);
    });

    // Create clusters for each category that has multiple suppliers
    Object.keys(categoryGroups).forEach(category => {
      const suppliers = categoryGroups[category];
      if (suppliers.length >= 2) {
        // Calculate cluster center
        const avgLat = suppliers.reduce((sum, s) => sum + s.supplier.coordinates[1], 0) / suppliers.length;
        const avgLng = suppliers.reduce((sum, s) => sum + s.supplier.coordinates[0], 0) / suppliers.length;
        
        // Calculate cluster radius (find the farthest supplier from center)
        const maxDistance = Math.max(...suppliers.map(s => 
          getDistance([avgLng, avgLat], s.supplier.coordinates)
        ));
        
        clusters.push({
          center: [avgLng, avgLat],
          suppliers,
          radius: Math.max(maxDistance + 10, 20), // At least 20km radius
          color: categoryColors[category] || '#6b7280',
          category
        });
      }
    });

    return clusters;
  };

  const calculateAlternativeScore = (alternative: Supplier, current: Supplier, store: Store, currentLossFactors: string[]): number => {
    const altDistance = getDistance(alternative.coordinates, store.coordinates);
    const currentDistance = getDistance(current.coordinates, store.coordinates);
    
    let score = 0;
    
    // Base scoring with weights
    const qualityScore = (alternative.riskBreakdown.quality - current.riskBreakdown.quality) * (weights.productQuality / 100);
    const financialScore = (alternative.riskBreakdown.financial - current.riskBreakdown.financial) * (weights.profitMargin / 100);
    const proximityScore = ((currentDistance - altDistance) / currentDistance) * (weights.geographicalProximity / 100) * 10;
    
    score = qualityScore + financialScore + proximityScore;
    
    // Bonus scoring based on specific loss factors
    currentLossFactors.forEach(factor => {
      if (factor.includes('Low Shelf Life') || factor.includes('Distance') || factor.includes('Cold Chain')) {
        // Prioritize closer suppliers for distance-related issues
        if (altDistance < currentDistance) {
          score += 5; // Significant bonus for proximity
        }
      }
      
      if (factor.includes('Quality') || factor.includes('Defect')) {
        // Prioritize higher quality suppliers
        if (alternative.riskBreakdown.quality > current.riskBreakdown.quality) {
          score += 3;
        }
      }
      
      if (factor.includes('Delivery') || factor.includes('Transportation') || factor.includes('Logistics')) {
        // Prioritize better delivery reliability
        if (alternative.riskBreakdown.delivery > current.riskBreakdown.delivery) {
          score += 3;
        }
      }
      
      if (factor.includes('Profit') || factor.includes('Cost') || factor.includes('Price')) {
        // Prioritize better financial performance
        if (alternative.riskBreakdown.financial > current.riskBreakdown.financial) {
          score += 3;
        }
      }
      
      if (factor.includes('Packaging') || factor.includes('Compliance') || factor.includes('Safety')) {
        // Prioritize better compliance
        if (alternative.riskBreakdown.compliance > current.riskBreakdown.compliance) {
          score += 3;
        }
      }
      
      if (factor.includes('Environmental') || factor.includes('Sustainability') || factor.includes('Carbon')) {
        // Prioritize better sustainability
        if (alternative.riskBreakdown.sustainability > current.riskBreakdown.sustainability) {
          score += 3;
        }
      }
      
      if (factor.includes('Customer') || factor.includes('Complaints') || factor.includes('Brand')) {
        // Prioritize better customer feedback
        if (alternative.riskBreakdown.customerFeedback > current.riskBreakdown.customerFeedback) {
          score += 3;
        }
      }
    });
    
    return score;
  };

  const getComparisonDetails = (alternative: Supplier, current: Supplier, store: Store, currentLossFactors: string[]): { improvements: string[], betterIn: string[] } => {
    const improvements = [];
    const betterIn = [];
    
    const altDistance = getDistance(alternative.coordinates, store.coordinates);
    const currentDistance = getDistance(current.coordinates, store.coordinates);
    
    // Check improvements that specifically address current loss factors
    currentLossFactors.forEach(factor => {
      if (factor.includes('Low Shelf Life') || factor.includes('Distance') || factor.includes('Cold Chain')) {
        if (altDistance < currentDistance) {
          improvements.push(`Addresses "${factor}": ${altDistance.toFixed(0)}km closer (${currentDistance.toFixed(0)}km → ${altDistance.toFixed(0)}km)`);
          betterIn.push('Proximity/Shelf Life');
        }
      }
      
      if (factor.includes('Quality') || factor.includes('Defect')) {
        if (alternative.riskBreakdown.quality > current.riskBreakdown.quality) {
          improvements.push(`Addresses "${factor}": Higher quality score (${current.riskBreakdown.quality.toFixed(1)} → ${alternative.riskBreakdown.quality.toFixed(1)})`);
          betterIn.push('Product Quality');
        }
      }
      
      if (factor.includes('Delivery') || factor.includes('Transportation') || factor.includes('Logistics')) {
        if (alternative.riskBreakdown.delivery > current.riskBreakdown.delivery) {
          improvements.push(`Addresses "${factor}": Better delivery reliability (${current.riskBreakdown.delivery.toFixed(1)} → ${alternative.riskBreakdown.delivery.toFixed(1)})`);
          betterIn.push('Delivery Reliability');
        }
      }
      
      if (factor.includes('Profit') || factor.includes('Cost') || factor.includes('Price')) {
        if (alternative.riskBreakdown.financial > current.riskBreakdown.financial) {
          improvements.push(`Addresses "${factor}": Better financial performance (${current.riskBreakdown.financial.toFixed(1)} → ${alternative.riskBreakdown.financial.toFixed(1)})`);
          betterIn.push('Financial Performance');
        }
      }
      
      if (factor.includes('Packaging') || factor.includes('Compliance') || factor.includes('Safety')) {
        if (alternative.riskBreakdown.compliance > current.riskBreakdown.compliance) {
          improvements.push(`Addresses "${factor}": Higher compliance score (${current.riskBreakdown.compliance.toFixed(1)} → ${alternative.riskBreakdown.compliance.toFixed(1)})`);
          betterIn.push('Compliance');
        }
      }
      
      if (factor.includes('Environmental') || factor.includes('Sustainability') || factor.includes('Carbon')) {
        if (alternative.riskBreakdown.sustainability > current.riskBreakdown.sustainability) {
          improvements.push(`Addresses "${factor}": Better sustainability (${current.riskBreakdown.sustainability.toFixed(1)} → ${alternative.riskBreakdown.sustainability.toFixed(1)})`);
          betterIn.push('Sustainability');
        }
      }
      
      if (factor.includes('Customer') || factor.includes('Complaints') || factor.includes('Brand')) {
        if (alternative.riskBreakdown.customerFeedback > current.riskBreakdown.customerFeedback) {
          improvements.push(`Addresses "${factor}": Better customer feedback (${current.riskBreakdown.customerFeedback.toFixed(1)} → ${alternative.riskBreakdown.customerFeedback.toFixed(1)})`);
          betterIn.push('Customer Satisfaction');
        }
      }
    });
    
    // Add general improvements if not already covered
    if (alternative.riskBreakdown.quality > current.riskBreakdown.quality && !betterIn.includes('Product Quality')) {
      improvements.push(`Higher quality score: ${alternative.riskBreakdown.quality.toFixed(1)} vs ${current.riskBreakdown.quality.toFixed(1)}`);
      betterIn.push('Quality');
    }
    
    if (alternative.riskBreakdown.financial > current.riskBreakdown.financial && !betterIn.includes('Financial Performance')) {
      improvements.push(`Better profit margin: ${alternative.riskBreakdown.financial.toFixed(1)} vs ${current.riskBreakdown.financial.toFixed(1)}`);
      betterIn.push('Profitability');
    }
    
    if (altDistance < currentDistance && !betterIn.includes('Proximity/Shelf Life')) {
      improvements.push(`Closer location: ${altDistance.toFixed(0)}km vs ${currentDistance.toFixed(0)}km`);
      betterIn.push('Proximity');
    }
    
    return { improvements, betterIn };
  };

  const initializeMap = () => {
    if (!mapContainer.current || !store) return;

    // Initialize map centered on the store with higher zoom
    map.current = L.map(mapContainer.current).setView([store.coordinates[1], store.coordinates[0]], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    markersLayer.current = L.layerGroup().addTo(map.current);
    connectionsLayer.current = L.layerGroup().addTo(map.current);
    alternativesLayer.current = L.layerGroup().addTo(map.current);
    clustersLayer.current = L.layerGroup().addTo(map.current);

    updateMapContent();
  };

  const createStoreIcon = () => {
    return L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #0071ce, #004c91);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      className: 'custom-store-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const createSupplierIcon = (lossSupplier: LossSupplier) => {
    const color = lossSupplier.hasLoss ? '#ef4444' : '#22c55e';
    
    return L.divIcon({
      html: `
        <div style="
          background: ${color};
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 2px solid white;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 1px;
          "></div>
        </div>
      `,
      className: 'custom-supplier-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const createAlternativeIcon = () => {
    return L.divIcon({
      html: `
        <div style="
          background: #3b82f6;
          width: 20px;
          height: 20px;
          border-radius: 3px;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 1px;
          "></div>
        </div>
      `,
      className: 'custom-alternative-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  const updateMapContent = () => {
    if (!map.current || !markersLayer.current || !connectionsLayer.current || !store) return;

    markersLayer.current.clearLayers();
    connectionsLayer.current.clearLayers();
    alternativesLayer.current?.clearLayers();
    clustersLayer.current?.clearLayers();

    // Add store marker
    const storeMarker = L.marker([store.coordinates[1], store.coordinates[0]], {
      icon: createStoreIcon()
    });
    
    storeMarker.bindPopup(`
      <div class="p-3">
        <h3 class="font-semibold text-gray-900">${store.name}</h3>
        <p class="text-sm text-gray-700">${store.address}</p>
        <p class="text-xs mt-1 text-gray-800">Revenue: ₹${store.monthlyRevenue.toLocaleString()}/mo</p>
      </div>
    `);
    
    markersLayer.current.addLayer(storeMarker);

    // Add supplier markers and connections
    storeSuppliers.forEach(lossSupplier => {
      const supplier = lossSupplier.supplier;
      const marker = L.marker([supplier.coordinates[1], supplier.coordinates[0]], {
        icon: createSupplierIcon(lossSupplier)
      });

      marker.bindPopup(`
        <div class="p-3 min-w-48">
          <h3 class="font-semibold text-sm text-gray-900">${supplier.name}</h3>
          <div class="mt-2 space-y-1">
            <p class="text-xs text-gray-800"><strong>Category:</strong> ${supplier.category}</p>
            <p class="text-xs text-gray-800"><strong>Risk Score:</strong> ${supplier.riskScore.toFixed(1)}/10</p>
            ${lossSupplier.hasLoss ? 
              `<div class="mt-2">
                <p class="text-xs font-medium text-red-600">Loss Factors:</p>
                ${lossSupplier.lossFactors.map(factor => 
                  `<span class="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mt-1 mr-1">${factor}</span>`
                ).join('')}
                <p class="text-xs mt-2 text-gray-800"><strong>Monthly Loss:</strong> ₹${lossSupplier.lossAmount.toLocaleString()}</p>
              </div>` : 
              '<p class="text-xs text-green-600 mt-2">✓ No significant losses detected</p>'
            }
          </div>
        </div>
      `);

      marker.on('click', () => {
        console.log('Supplier clicked:', supplier.name);
        setSelectedSupplier(lossSupplier);
        const alternatives = getAlternativeSuppliers(lossSupplier);
        console.log('Alternative suppliers found:', alternatives.length, alternatives);
        setAlternativeSuppliers(alternatives);
        showAlternativeSuppliers(alternatives);
      });

      markersLayer.current?.addLayer(marker);

      // Add connection line
      const lineColor = lossSupplier.hasLoss ? '#ef4444' : '#22c55e';
      const polyline = L.polyline([
        [supplier.coordinates[1], supplier.coordinates[0]],
        [store.coordinates[1], store.coordinates[0]]
      ], {
        color: lineColor,
        weight: 3,
        opacity: 0.7,
      });

      connectionsLayer.current?.addLayer(polyline);
    });
  };

  const showAlternativeSuppliers = (alternatives: AlternativeWithComparison[]) => {
    if (!alternativesLayer.current || !clustersLayer.current || !store || !selectedSupplier) return;

    console.log('Showing alternative suppliers on map:', alternatives.length);
    alternativesLayer.current.clearLayers();
    clustersLayer.current.clearLayers();

    // Create and display clusters
    const clusters = createSupplierClusters(alternatives);
    console.log('Created clusters:', clusters.length);

    clusters.forEach(cluster => {
      // Create transparent circle for cluster
      const circle = L.circle([cluster.center[1], cluster.center[0]], {
        color: cluster.color,
        fillColor: cluster.color,
        fillOpacity: 0.1,
        radius: cluster.radius * 1000, // Convert to meters
        weight: 2,
        opacity: 0.6,
        dashArray: '5, 5'
      });

      // Add cluster label
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
          ">
            ${cluster.category}<br>
            <span style="font-size: 10px; opacity: 0.9;">
              ${cluster.suppliers.length} alternatives
            </span>
          </div>
        `,
        className: 'cluster-label',
        iconSize: [120, 40],
        iconAnchor: [60, 20],
      });

      const labelMarker = L.marker([cluster.center[1], cluster.center[0]], {
        icon: label,
        interactive: false
      });

      circle.bindPopup(`
        <div class="p-3 min-w-48">
          <h3 class="font-semibold text-sm mb-2">${cluster.category} Cluster</h3>
          <div class="space-y-1 text-xs">
            <p><strong>Alternative Suppliers:</strong> ${cluster.suppliers.length}</p>
            <p><strong>Average Score:</strong> ${(cluster.suppliers.reduce((sum, s) => sum + s.score, 0) / cluster.suppliers.length).toFixed(1)}</p>
            <p><strong>Addresses Issues:</strong></p>
            <div class="flex flex-wrap gap-1 mt-1">
              ${[...new Set(cluster.suppliers.flatMap(s => s.betterIn))].slice(0, 3).map(area => 
                `<span class="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded">${area}</span>`
              ).join('')}
            </div>
          </div>
        </div>
      `);

      clustersLayer.current?.addLayer(circle);
      clustersLayer.current?.addLayer(labelMarker);
    });

    // Add individual alternative supplier markers
    alternatives.forEach((alt, index) => {
      console.log(`Adding alternative ${index + 1}:`, alt.supplier.name, alt.supplier.coordinates);
      
      const marker = L.marker([alt.supplier.coordinates[1], alt.supplier.coordinates[0]], {
        icon: createAlternativeIcon()
      });

      marker.bindPopup(`
        <div class="p-3 min-w-64">
          <h3 class="font-semibold text-sm text-gray-900">${alt.supplier.name}</h3>
          <p class="text-xs text-gray-700">${alt.supplier.category}</p>
          <p class="text-xs text-gray-800">Risk: ${alt.supplier.riskScore.toFixed(1)}/10</p>
          <p class="text-xs text-blue-600 mt-1">Alternative Supplier (Score: ${alt.score.toFixed(1)})</p>
          
          <div class="mt-2">
            <p class="text-xs font-medium text-green-600">Improvements vs ${selectedSupplier.supplier.name}:</p>
            <div class="mt-1 space-y-1">
              ${alt.improvements.slice(0, 3).map(improvement => 
                `<p class="text-xs text-gray-700">• ${improvement}</p>`
              ).join('')}
            </div>
          </div>
          
          <div class="mt-2">
            <p class="text-xs font-medium text-blue-600">Better in:</p>
            <div class="flex flex-wrap gap-1 mt-1">
              ${alt.betterIn.map(area => 
                `<span class="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded">${area}</span>`
              ).join('')}
            </div>
          </div>
        </div>
      `);

      alternativesLayer.current?.addLayer(marker);

      // Add blue connection line to store
      const polyline = L.polyline([
        [alt.supplier.coordinates[1], alt.supplier.coordinates[0]],
        [store.coordinates[1], store.coordinates[0]]
      ], {
        color: '#3b82f6',
        weight: 2,
        opacity: 0.8,
        dashArray: '5, 10'
      });

      alternativesLayer.current?.addLayer(polyline);
    });
  };

  const getAlternativeSuppliers = (lossSupplier: LossSupplier): AlternativeWithComparison[] => {
    if (!store) return [];

    console.log('Getting alternatives for:', lossSupplier.supplier.name, 'Current weights:', weights, 'Loss factors:', lossSupplier.lossFactors);

    // Get all available suppliers that are not currently used by this store
    const availableSuppliers = suppliers.filter(s => 
      !store.suppliers.includes(s.id) && s.id !== lossSupplier.supplier.id
    );

    console.log('Available suppliers count:', availableSuppliers.length);

    const alternativesWithComparison: AlternativeWithComparison[] = [];
    
    // Score and compare each alternative
    availableSuppliers.forEach(supplier => {
      const score = calculateAlternativeScore(supplier, lossSupplier.supplier, store, lossSupplier.lossFactors);
      const comparison = getComparisonDetails(supplier, lossSupplier.supplier, store, lossSupplier.lossFactors);
      
      if (comparison.improvements.length > 0) {
        alternativesWithComparison.push({
          supplier,
          improvements: comparison.improvements,
          score,
          betterIn: comparison.betterIn
        });
      }
    });

    // Sort by score (highest first) and return top 8 for better clustering
    const sortedAlternatives = alternativesWithComparison
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    
    console.log('Final alternatives with scores:', sortedAlternatives.map(a => ({ name: a.supplier.name, score: a.score, improvements: a.improvements })));
    
    return sortedAlternatives;
  };

  useEffect(() => {
    if (store) {
      initializeMap();
    }
    return () => {
      map.current?.remove();
    };
  }, [store, storeSuppliers]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-walmart-blue mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading store data...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-walmart-blue mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Store not found</p>
        </div>
      </div>
    );
  }

  // Get supplier objects from supplier IDs
  const currentStoreSuppliers = store.suppliers.map(supplierId => 
    suppliers.find(supplier => supplier.id === supplierId)
  ).filter(Boolean);

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 85) return <CheckCircle className="h-4 w-4" />;
    if (score >= 70) return <AlertTriangle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Map
        </Button>
      </div>

      {/* Store Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-2xl">{store.name}</CardTitle>
                    <p className="text-gray-600 mt-1">{store.address}</p>
                    <p className="text-sm text-gray-500">Store ID: {store.id}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getPerformanceColor(store.riskScore * 10)}`}>
                  {getPerformanceIcon(store.riskScore * 10)}
                  <span className="font-medium">{(store.riskScore * 10).toFixed(0)}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">₹{store.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{store.customerCount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Customers</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Package className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{currentStoreSuppliers.length}</p>
                  <p className="text-sm text-gray-600">Suppliers</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Badge variant="outline" className="mb-2">{store.type}</Badge>
                  <p className="text-sm text-gray-600">{store.size} Store</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Store Info */}
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm"><strong>Manager:</strong> {store.manager}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm"><strong>Phone:</strong> {store.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm"><strong>Hours:</strong> {store.openingHours}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm"><strong>Region:</strong> {store.region}</span>
              </div>
            </CardContent>
          </Card>

          {/* Store Issues */}
          {store.issues && store.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Current Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {store.issues.map((issue, index) => (
                    <Badge key={index} variant="destructive" className="mr-2 mb-2">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Suppliers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Connected Suppliers ({currentStoreSuppliers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentStoreSuppliers.map((supplier) => (
              <Card key={supplier.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{supplier.name}</h4>
                      <p className="text-sm text-gray-600">ID: {supplier.id}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getPerformanceColor(supplier.riskScore * 10)}`}>
                      {getPerformanceIcon(supplier.riskScore * 10)}
                      <span className="font-medium">{(supplier.riskScore * 10).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Products:</p>
                      <div className="flex flex-wrap gap-1">
                        {supplier.products.map((product, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      <p><strong>Location:</strong> {supplier.coordinates[1].toFixed(4)}°N, {supplier.coordinates[0].toFixed(4)}°W</p>
                    </div>
                  </div>

                  {/* Key Parameters */}
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Key Metrics:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Sustainability:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-green-500 h-1 rounded-full" 
                              style={{ width: `${supplier.sustainabilityScore || 70}%` }}
                            />
                          </div>
                          <span className="text-gray-600">{supplier.sustainabilityScore || 70}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Quality:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full" 
                              style={{ width: `${supplier.riskBreakdown.quality}%` }}
                            />
                          </div>
                          <span className="text-gray-600">{supplier.riskBreakdown.quality}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Availability:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-orange-500 h-1 rounded-full" 
                              style={{ width: `${supplier.availability || 85}%` }}
                            />
                          </div>
                          <span className="text-gray-600">{supplier.availability || 85}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Profit Margin:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-purple-500 h-1 rounded-full" 
                              style={{ width: `${(supplier.profitMargin || 15) * 4}%` }}
                            />
                          </div>
                          <span className="text-gray-600">{supplier.profitMargin || 15}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreDetails;
