
import { Supplier, Cluster } from '@/types';
import L from 'leaflet';

export interface AnimationState {
  isAnimating: boolean;
  duration: number;
  startTime: number;
  startRadius: number;
  targetRadius: number;
  easingFunction: (t: number) => number;
}

export interface SupplierState {
  status: 'active' | 'leaving' | 'entering' | 'excluded';
  lastUpdate: number;
  animationProgress: number;
}

// Easing functions for smooth animations
export const easingFunctions = {
  cubicInOut: (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },
  quadOut: (t: number): number => {
    return 1 - (1 - t) * (1 - t);
  },
  elasticOut: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

// Force simulation parameters for different cluster types
export const clusterForceConfig = {
  'Sustainability Cluster': {
    attractionStrength: 0.02,
    repulsionStrength: -30,
    damping: 0.15,
    animationType: 'fade',
    color: '#10b981'
  },
  'Local Consumption Cluster': {
    attractionStrength: 0.025,
    repulsionStrength: -25,
    damping: 0.12,
    animationType: 'slide',
    color: '#3b82f6'
  },
  'High Profit Margin Cluster': {
    attractionStrength: 0.03,
    repulsionStrength: -35,
    damping: 0.1,
    animationType: 'pulse',
    color: '#f59e0b'
  },
  'Brand Value Cluster': {
    attractionStrength: 0.02,
    repulsionStrength: -30,
    damping: 0.13,
    animationType: 'glow',
    color: '#8b5cf6'
  },
  'Product Quality Cluster': {
    attractionStrength: 0.025,
    repulsionStrength: -28,
    damping: 0.14,
    animationType: 'ripple',
    color: '#06d6a0'
  }
};

export class ClusterAnimationManager {
  private animationStates = new Map<string, AnimationState>();
  private supplierStates = new Map<string, SupplierState>();
  private animationFrame: number | null = null;
  private onUpdate: (clusterId: string, progress: number) => void;

  constructor(onUpdate: (clusterId: string, progress: number) => void) {
    this.onUpdate = onUpdate;
  }

  // Start smooth cluster radius animation
  startClusterAnimation(
    clusterId: string, 
    currentRadius: number, 
    targetRadius: number, 
    duration: number = 500,
    easing: keyof typeof easingFunctions = 'cubicInOut'
  ): void {
    console.log(`Starting cluster animation for ${clusterId}: ${currentRadius} -> ${targetRadius}`);
    
    this.animationStates.set(clusterId, {
      isAnimating: true,
      duration,
      startTime: Date.now(),
      startRadius: currentRadius,
      targetRadius,
      easingFunction: easingFunctions[easing]
    });

    this.startAnimationLoop();
  }

  // Update supplier state with visual feedback
  updateSupplierState(supplierId: string, newStatus: SupplierState['status']): void {
    const currentState = this.supplierStates.get(supplierId);
    
    this.supplierStates.set(supplierId, {
      status: newStatus,
      lastUpdate: Date.now(),
      animationProgress: currentState?.animationProgress || 0
    });

    console.log(`Supplier ${supplierId} status changed to: ${newStatus}`);
  }

  // Get current animated radius for a cluster
  getCurrentRadius(clusterId: string, baseRadius: number): number {
    const state = this.animationStates.get(clusterId);
    if (!state || !state.isAnimating) return baseRadius;

    const elapsed = Date.now() - state.startTime;
    const progress = Math.min(elapsed / state.duration, 1);
    const easedProgress = state.easingFunction(progress);
    
    const currentRadius = state.startRadius + (state.targetRadius - state.startRadius) * easedProgress;
    
    if (progress >= 1) {
      state.isAnimating = false;
      this.animationStates.delete(clusterId);
    }

    return currentRadius;
  }

  // Get supplier visual state for rendering
  getSupplierVisualState(supplierId: string): { color: string; opacity: number; scale: number } {
    const state = this.supplierStates.get(supplierId);
    if (!state) return { color: '#22c55e', opacity: 1, scale: 1 };

    const timeSinceUpdate = Date.now() - state.lastUpdate;
    const transitionDuration = 300;
    const progress = Math.min(timeSinceUpdate / transitionDuration, 1);

    switch (state.status) {
      case 'leaving':
        return {
          color: '#fbbf24', // Yellow for leaving suppliers
          opacity: Math.max(0.7, 1 - progress * 0.3),
          scale: Math.max(0.8, 1 - progress * 0.2)
        };
      case 'entering':
        return {
          color: '#22c55e',
          opacity: Math.min(1, 0.3 + progress * 0.7),
          scale: Math.min(1, 0.6 + progress * 0.4)
        };
      case 'excluded':
        return {
          color: '#fbbf24', // Yellow for excluded suppliers
          opacity: 0.7,
          scale: 0.9
        };
      case 'active':
      default:
        return {
          color: '#22c55e',
          opacity: 1,
          scale: 1
        };
    }
  }

  // Animation loop for smooth transitions
  private startAnimationLoop(): void {
    if (this.animationFrame) return;

    const animate = () => {
      let hasActiveAnimations = false;

      // Check for active cluster animations
      for (const [clusterId, state] of this.animationStates) {
        if (state.isAnimating) {
          hasActiveAnimations = true;
          const progress = Math.min((Date.now() - state.startTime) / state.duration, 1);
          this.onUpdate(clusterId, progress);
        }
      }

      // Continue animation loop if there are active animations
      if (hasActiveAnimations) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animationFrame = null;
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  // Clean up animations
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.animationStates.clear();
    this.supplierStates.clear();
  }
}

// Calculate dynamic radius based on parameter weights and values
export const calculateDynamicRadius = (
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
