"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { UsersContent } from "@/components/dashboard/users-content";
import { DocumentsContent } from "@/components/dashboard/documents-content";
import { SettingsContent } from "@/components/dashboard/settings-content";
import { TopBar } from "@/components/dashboard/top-bar";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { billingService, type Subscription } from "@/lib/billing";
import { toast } from "sonner";

// Import dashboard data
import dashboardData from "../../../migration/dashboard-data.json";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data] = useState(dashboardData);
  const [selectedCurrency, setSelectedCurrency] = useState(
    data.user.baseCurrency
  );
  const [selectedCountry, setSelectedCountry] = useState("Global");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Get the current page from URL params, default to "dashboard"
  const currentPage = searchParams.get("page") || "dashboard";
  const upgraded = searchParams.get("upgraded");

  useEffect(() => {
    // Load subscription data
    loadSubscription();

    // Show upgrade welcome message if redirected from billing
    if (upgraded === 'true') {
      toast.success('🎉 Welcome to Pro! Your subscription is now active.');
      // Clean up URL
      const params = new URLSearchParams(searchParams);
      params.delete('upgraded');
      router.replace(`/dashboard${params.toString() ? '?' + params.toString() : ''}`);
    }
  }, []);

  const loadSubscription = async () => {
    try {
      setLoadingSubscription(true);
      const sub = await billingService.getCurrentSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    // Here you would typically update the data with new currency conversions
    console.log("Currency changed to:", currency);
  };

  const handleCountryFilterChange = (country: string) => {
    setSelectedCountry(country);
    // Here you would typically filter the data based on country
    console.log("Country filter changed to:", country);
  };

  const handleTabChange = (tab: string) => {
    // Update URL instead of local state
    const params = new URLSearchParams(searchParams);
    params.set("page", tab);
    router.push(`?${params.toString()}`);
  };

  const renderContent = () => {
    const isActive = billingService.isSubscriptionActive(subscription);
    const planName = subscription?.plan_name || 'FREE';
    const isProPlan = isActive && (planName === 'PRO' || planName === 'ENTERPRISE');
    const isStartupPlan = isActive && (planName === 'STARTUP' || planName === 'BASIC');

    // Debug logging
    console.log('🏠 Dashboard render state:', {
      subscription: subscription,
      isActive: isActive,
      planName: planName,
      isProPlan: isProPlan,
      isStartupPlan: isStartupPlan,
      currentPage: currentPage,
      upgraded: upgraded
    });

    switch (currentPage) {
      case "dashboard":
        return (
          <DashboardContent 
            subscription={subscription} 
            loadingSubscription={loadingSubscription}
            isProPlan={isActive && (planName === 'PRO' || planName === 'ENTERPRISE')}
          />
        );
      case "users":
        return <UsersContent subscription={subscription} isProPlan={isActive && (planName === 'PRO' || planName === 'ENTERPRISE')} />;
      case "documents":
        return <DocumentsContent subscription={subscription} isProPlan={isActive && (planName === 'PRO' || planName === 'ENTERPRISE')} />;
      case "settings":
        return <SettingsContent subscription={subscription} isProPlan={isActive && (planName === 'PRO' || planName === 'ENTERPRISE')} />;
      default:
        return (
          <DashboardContent 
            subscription={subscription} 
            loadingSubscription={loadingSubscription}
            isProPlan={isActive && (planName === 'PRO' || planName === 'ENTERPRISE')}
          />
        );
    }
  };

  return (
    <ProtectedRoute>
      <SidebarWrapper 
        activeTab={currentPage} 
        onTabChange={handleTabChange}
        subscription={subscription}
        loadingSubscription={loadingSubscription}
      >
        <div className="flex flex-col h-full">
          {/* Top Bar */}
          <TopBar 
            activeTab={currentPage} 
            subscription={subscription}
            loadingSubscription={loadingSubscription}
          />

          {/* Main Content */}
          <div className="flex-1 overflow-auto">{renderContent()}</div>
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </SidebarWrapper>
    </ProtectedRoute>
  );
}
