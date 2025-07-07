
# Walmart Supplier Optimization and Risk Management System

A comprehensive web application for managing supplier relationships, risk assessment, and supply chain optimization for Walmart stores, with a focus on the South Delhi location.

## 🎯 Project Overview

This system provides real-time supplier management, dynamic cluster visualization, risk assessment, and interactive mapping capabilities to optimize supply chain operations and reduce operational losses (currently addressing 10% vegetable stockouts, 15% defective snacks, and 5% cleaning product spoilage).

## 🏗️ Tech Stack

- **Frontend Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: shadcn/ui component library
- **Routing**: React Router DOM 6.26.2
- **State Management**: React Context + @tanstack/react-query 5.56.2
- **Maps**: Leaflet 1.9.4 with custom clustering
- **Charts**: Recharts 3.0.2
- **Icons**: Lucide React 0.462.0
- **Date Handling**: date-fns 3.6.0

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx           # Authentication form with role-based access
│   ├── layout/
│   │   ├── AppSidebar.tsx         # Navigation sidebar with role-based menu
│   │   ├── Header.tsx             # Top navigation bar
│   │   └── Layout.tsx             # Main layout wrapper
│   └── ui/                        # shadcn/ui components (40+ components)
├── contexts/
│   ├── AuthContext.tsx            # Authentication state management
│   └── ThemeContext.tsx           # Dark/light theme switching
├── data/
│   └── mockData.ts                # Mock data for stores, suppliers, clusters
├── hooks/
│   ├── use-mobile.tsx             # Mobile responsive hook
│   └── use-toast.ts               # Toast notification hook
├── lib/
│   └── utils.ts                   # Utility functions
├── pages/
│   ├── Alerts.tsx                 # Alert management system
│   ├── Dashboard.tsx              # Main dashboard with metrics
│   ├── InteractiveMap.tsx         # Dynamic clustering map (900+ lines)
│   ├── NotFound.tsx               # 404 error page
│   ├── Reports.tsx                # Report generation system
│   ├── RiskAssessment.tsx         # Risk evaluation tools
│   ├── Settings.tsx               # System configuration
│   ├── StoreDetails.tsx           # Individual store analysis
│   └── Suppliers.tsx              # Supplier management
├── types/
│   └── index.ts                   # TypeScript type definitions
├── utils/
│   ├── clusterAnimations.ts       # Animation manager for clusters
│   └── clusterUtils.ts            # Clustering algorithms (400+ lines)
├── App.tsx                        # Main app component with routing
└── main.tsx                       # Application entry point
```

## 🔐 Authentication & User Roles

### User Types
- **Admin**: Full system access including map, suppliers, risk assessment
- **Supplier**: Limited access to performance and compliance views
- **Executive**: Strategic analytics and high-level reporting

### Default Credentials
- Admin: admin@walmart.com / admin123
- Supplier: supplier@example.com / supplier123
- Executive: exec@walmart.com / exec123

## 🗺️ Route Structure

### Public Routes
- `/` - Redirects to dashboard
- `*` - 404 Not Found page

### Admin Routes
- `/dashboard` - Main dashboard with KPIs and metrics
- `/map` - Interactive supplier clustering map
- `/store/:storeId` - Detailed store analysis
- `/suppliers` - Supplier management interface
- `/risk` - Risk assessment tools
- `/reports` - Report generation system
- `/alerts` - Alert management
- `/settings` - System configuration

### Supplier Routes
- `/dashboard` - Supplier-specific dashboard
- `/performance` - Performance metrics
- `/compliance` - Compliance tracking
- `/communications` - Communication center
- `/profile` - Profile management

### Executive Routes
- `/dashboard` - Executive dashboard
- `/analytics` - Advanced analytics
- `/strategic` - Strategic planning (uses map)
- `/kpi` - KPI monitoring
- `/executive-reports` - Executive reporting

## 🎛️ Core Features

### 1. Interactive Clustering Map (`/map`)
**File**: `src/pages/InteractiveMap.tsx` (901 lines)

#### Key Features:
- **Real-time Cluster Animation**: Smooth transitions with 500ms cubic easing
- **Dynamic Parameter Adjustment**: Live cluster resizing based on user inputs
- **Supplier State Tracking**: Yellow highlighting for suppliers leaving clusters
- **Force-Directed Simulation**: Physics-based node positioning
- **Multi-layer Visualization**: Stores, suppliers, connections, and clusters

#### Cluster Types:
1. **Sustainability Cluster** (Green #10b981)
   - Parameters: sustainabilityScore (30%), carbonFootprint (20%), packagingQuality (15%)
   - Animation: Fade transitions for eco-friendly suppliers

2. **Local Consumption Cluster** (Blue #3b82f6)
   - Parameters: localRelevance (25%), productQuality (20%), availability (15%)
   - Animation: Slide transitions for high-demand nodes

3. **High Profit Margin Cluster** (Amber #f59e0b)
   - Parameters: profitMargin (30%), productQuality (20%), availability (15%)
   - Animation: Pulse effects for high-margin nodes

4. **Brand Value Cluster** (Purple #8b5cf6)
   - Parameters: brandRecognition (35%), productQuality (25%), availability (20%)
   - Animation: Glow effects for high-sales nodes

5. **Product Quality Cluster** (Teal #06d6a0)
   - Parameters: productQuality (35%), availability (20%), sustainability (15%)
   - Animation: Ripple effects for quality changes

#### Controls:
- **Layer Toggle**: Stores only, Suppliers only, or Both
- **Risk Filters**: All, High Score, Medium, Low Score
- **Category Filters**: 20+ supplier categories
- **View Options**: Animated clusters, Smart connections
- **Real-time Updates**: 15-second intervals with force updates

### 2. Clustering Algorithm
**Files**: 
- `src/utils/clusterUtils.ts` (414 lines)
- `src/utils/clusterAnimations.ts`

#### Algorithm Features:
- **Dynamic Radius Calculation**: Parameter-weighted sizing
- **Smooth Transitions**: Cubic easing animations over 500ms
- **State Management**: Tracks entering, leaving, active, excluded states
- **Force Simulation**: D3.js-compatible physics engine
- **Real-time Updates**: Event-driven cluster updates

#### Animation States:
- **Active**: Normal supplier appearance
- **Entering**: Fade-in animation when joining cluster
- **Leaving**: Yellow highlighting before removal
- **Excluded**: Suppliers outside all clusters

### 3. Dashboard System
**File**: `src/pages/Dashboard.tsx`

#### Metrics Tracked:
- Total Suppliers: 150+ active suppliers
- Average Risk Score: Dynamic calculation
- High Risk Suppliers: Risk score < 6.0
- Cost Savings: Optimization benefits
- Sustainability Score: Environmental impact
- On-time Delivery: Performance metrics
- Quality Score: Product quality tracking
- Contract Expiry: Upcoming renewals

### 4. Risk Assessment
**File**: `src/pages/RiskAssessment.tsx`

#### Risk Categories:
- **Financial Risk**: Payment history, credit scores
- **Quality Risk**: Product defects, recalls
- **Delivery Risk**: On-time performance, logistics
- **Compliance Risk**: Regulatory adherence
- **Sustainability Risk**: Environmental impact
- **Customer Feedback**: Satisfaction scores

### 5. Store Management
**File**: `src/pages/StoreDetails.tsx`

#### Store Types:
- **Supercenter**: Large format stores
- **Neighborhood Market**: Mid-size community stores
- **Express**: Small convenience format

#### Store Analytics:
- Monthly revenue tracking
- Customer count metrics
- Supplier connection analysis
- Loss-causing supplier identification
- Performance trending

## 📊 Data Structure

### Core Types (`src/types/index.ts`)

#### User Interface
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supplier' | 'executive';
  avatar?: string;
  lastLogin?: Date;
}
```

#### Store Interface
```typescript
interface Store {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'Supercenter' | 'Neighborhood Market' | 'Express';
  suppliers: string[];
  riskScore: number;
  monthlyRevenue: number;
  customerCount: number;
  // ... additional fields
}
```

#### Supplier Interface
```typescript
interface Supplier {
  id: string;
  name: string;
  category: string; // 20+ categories
  coordinates: [number, number];
  riskScore: number;
  riskBreakdown: {
    financial: number;
    quality: number;
    delivery: number;
    compliance: number;
    sustainability: number;
    customerFeedback: number;
  };
  // ... cluster-specific metrics
}
```

#### Cluster Interface
```typescript
interface Cluster {
  id: string;
  type: string;
  center: [number, number];
  radius: number;
  suppliers: string[];
  avgScore: number;
  totalValue: number;
  color: string;
  parameters: ClusterParameters;
}
```

## 🎨 UI/UX Features

### Theme System
- **Light/Dark Mode**: Automatic system detection
- **Custom Colors**: Walmart brand colors (#0071ce, #004c91)
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 compliant

### Animation System
- **Smooth Transitions**: 300-500ms durations
- **Easing Functions**: Cubic bezier curves
- **State Feedback**: Visual indicators for all actions
- **Performance Optimized**: 60 FPS targeting

### Component Library
- **40+ shadcn/ui Components**: Buttons, cards, dialogs, forms
- **Custom Components**: Map controls, cluster displays
- **Toast Notifications**: Success/error feedback
- **Loading States**: Skeleton screens and spinners

## 🔧 Development

### Prerequisites
- Node.js 18+ and npm
- Modern web browser
- Git for version control

### Installation
```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Setup
- No external API keys required for basic functionality
- All data is currently mock data in `src/data/mockData.ts`
- Authentication is handled locally (no backend required)

## 📈 Performance Considerations

### Map Performance
- **Node Limit**: 50 suppliers per cluster for optimal performance
- **WebGL Rendering**: For large datasets
- **Batch Processing**: Queued updates for 60 FPS maintenance
- **Memory Management**: Cached calculations and state

### Bundle Optimization
- **Tree Shaking**: Only used components included
- **Code Splitting**: Route-based lazy loading
- **Asset Optimization**: Compressed images and fonts

## 🚀 Deployment

### Lovable Platform
1. Click "Publish" button in Lovable editor
2. Custom domain connection available with paid plans

### Manual Deployment
```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

### Supported Hosting
- Vercel, Netlify, GitHub Pages
- Any static hosting service
- CDN deployment compatible

## 🔮 Future Enhancements

### Planned Features
- **Backend Integration**: Supabase integration for data persistence
- **Real API Connections**: Live supplier data feeds
- **Advanced Analytics**: Machine learning insights
- **Mobile App**: React Native companion
- **Offline Support**: PWA capabilities

### Scalability Improvements
- **Database Integration**: PostgreSQL via Supabase
- **Authentication**: OAuth providers (Google, Microsoft)
- **File Storage**: Document and image management
- **Email Notifications**: Automated alerts
- **API Development**: REST/GraphQL endpoints

## 🐛 Known Issues

### Current Limitations
- Mock data only (no persistent storage)
- Local authentication (no server validation)
- Limited to 150 suppliers (performance constraint)
- No real-time data synchronization

### Browser Compatibility
- Modern browsers only (ES2020+ required)
- WebGL support needed for advanced map features
- Minimum screen resolution: 1024x768

## 📝 Contributing

### Code Style
- TypeScript strict mode enabled
- ESLint configuration provided
- Prettier formatting recommended
- Component-first architecture

### File Organization
- Keep components under 200 lines
- Extract utilities to separate files
- Use TypeScript interfaces for all data
- Follow React best practices

## 📞 Support

### Documentation
- [Lovable Official Docs](https://docs.lovable.dev/)
- [Lovable Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
- [YouTube Tutorials](https://www.youtube.com/watch?v=9KHLTZaJcR8&list=PLbVHz4urQBZkJiAWdG8HWoJTdgEysigIO)

### Project Specific
- Use the chat interface in Lovable for AI assistance
- Check console logs for debugging information
- Review TypeScript errors in the terminal

---

## 📊 Project Statistics

- **Total Files**: 60+ source files
- **Lines of Code**: 8,000+ lines
- **Components**: 45+ React components
- **Routes**: 15+ application routes
- **Dependencies**: 30+ npm packages
- **Supported Browsers**: Chrome 90+, Firefox 88+, Safari 14+

**Last Updated**: July 6, 2025 - 1:03 PM IST
**Project Status**: Active Development
**Version**: 1.0.0-beta
