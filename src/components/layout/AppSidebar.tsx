
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  Grid2X2,
  MapPin,
  Users,
  Shield,
  FileText,
  Settings,
  Bell,
  AlertTriangle,
  Package,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;

  const isCollapsed = state === 'collapsed';
  const isActive = (path: string) => currentPath === path;

  // Different navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { title: "Dashboard", url: "/dashboard", icon: Grid2X2 },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { title: "Interactive Map", url: "/map", icon: MapPin },
        { title: "Suppliers", url: "/suppliers", icon: Users },
        { title: "Risk Assessment", url: "/risk", icon: Shield },
        { title: "Reports", url: "/reports", icon: FileText },
        { title: "Alerts", url: "/alerts", icon: Bell },
        { title: "Settings", url: "/settings", icon: Settings },
      ];
    } else if (user?.role === 'supplier') {
      return [
        ...baseItems,
        { title: "Performance", url: "/performance", icon: Shield },
        { title: "Compliance", url: "/compliance", icon: FileText },
        { title: "Communications", url: "/communications", icon: Bell },
        { title: "Profile", url: "/profile", icon: Settings },
      ];
    } else if (user?.role === 'executive') {
      return [
        ...baseItems,
        { title: "Analytics", url: "/analytics", icon: Grid2X2 },
        { title: "Strategic View", url: "/strategic", icon: MapPin },
        { title: "KPI Monitor", url: "/kpi", icon: Shield },
        { title: "Executive Reports", url: "/executive-reports", icon: FileText },
      ];
    } else if (user?.role === 'store') {
      return [
        ...baseItems,
        { title: "Problems", url: "/problems", icon: AlertTriangle },
        { title: "Suppliers", url: "/suppliers", icon: Users },
        { title: "Inventory", url: "/inventory", icon: Package },
        { title: "Performance", url: "/performance", icon: TrendingUp },
        { title: "Communication", url: "/communication", icon: MessageSquare },
        { title: "Profile", url: "/profile", icon: Settings },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-walmart-blue text-white font-medium" 
      : "hover:bg-accent hover:text-accent-foreground";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-walmart-blue font-semibold">
            {!isCollapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => getNavClassName({ isActive })}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
