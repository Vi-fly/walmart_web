
import LoginForm from "@/components/auth/LoginForm";
import Layout from "@/components/layout/Layout";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Alerts from "@/pages/Alerts";
import Dashboard from "@/pages/Dashboard";
import InteractiveMap from "@/pages/InteractiveMap";
import Reports from "@/pages/Reports";
import RiskAssessment from "@/pages/RiskAssessment";
import Settings from "@/pages/Settings";
import StoreDetails from "@/pages/StoreDetails";
import SupplierDetails from "@/pages/SupplierDetails";
import Suppliers from "@/pages/Suppliers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-walmart-blue"></div>
      </div>
    );
  }
  
  if (!user) {
    return <LoginForm />;
  }
  
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <LoginForm />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      
      {/* Admin-only routes */}
      {user.role === 'admin' && (
        <>
          <Route path="/map" element={<InteractiveMap />} />
          <Route path="/store/:storeId" element={<StoreDetails />} />
          <Route path="/supplier/:supplierId" element={<SupplierDetails />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/risk" element={<RiskAssessment />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
        </>
      )}
      
      {/* Supplier-only routes */}
      {user.role === 'supplier' && (
        <>
          <Route path="/performance" element={<Dashboard />} />
          <Route path="/compliance" element={<Dashboard />} />
          <Route path="/communications" element={<Dashboard />} />
          <Route path="/profile" element={<Settings />} />
        </>
      )}
      
      {/* Executive-only routes */}
      {user.role === 'executive' && (
        <>
          <Route path="/analytics" element={<Dashboard />} />
          <Route path="/strategic" element={<InteractiveMap />} />
          <Route path="/kpi" element={<RiskAssessment />} />
          <Route path="/executive-reports" element={<Reports />} />
        </>
      )}
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ProtectedRoute>
              <AppRoutes />
            </ProtectedRoute>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
