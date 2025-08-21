"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SidebarWrapper } from "@/components/dashboard/sidebar-wrapper";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { UsersContent } from "@/components/dashboard/users-content";
import { DocumentsContent } from "@/components/dashboard/documents-content";
import { SettingsContent } from "@/components/dashboard/settings-content";
import { ProfileContent } from "@/components/dashboard/profile-content";
import { TopBar } from "@/components/dashboard/top-bar";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { billingService, type Subscription } from "@/lib/billing";
import { toast } from "sonner";


export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Get the current page from URL params, default to "dashboard"
  const currentPage = searchParams.get("page") || "dashboard";
  const upgraded = searchParams.get("upgraded");

  useEffect(() => {
    loadSubscription();

    if (upgraded === 'true') {
      toast.success('🎉 Welcome to Pro! Your subscription is now active.');
      const params = new URLSearchParams(searchParams);
      params.delete('upgraded');
      const search = params.toString();
      router.replace(`/dashboard${search ? `?${search}` : ''}`);
    }
  }, [upgraded, searchParams, router]);

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


  const handleTabChange = (tab: string) => {
    // Update URL instead of local state
    const params = new URLSearchParams(searchParams);
    params.set("page", tab);
    router.push(`?${params.toString()}`);
  };

  const isActive = billingService.isSubscriptionActive(subscription);
  const planName = subscription?.plan_name || 'FREE';
  const isProPlan = isActive && (planName === 'PRO' || planName === 'ENTERPRISE');
  const isStartupPlan = isActive && (planName === 'STARTUP' || planName === 'BASIC');

  const contentProps = { subscription, isProPlan };
  const dashboardProps = { ...contentProps, loadingSubscription };

  const renderContent = () => {
    console.log('🏠 Dashboard render state:', {
      subscription, isActive, planName, isProPlan, isStartupPlan, currentPage, upgraded
    });

    const contentMap = {
      dashboard: <DashboardContent {...dashboardProps} />,
      users: <UsersContent {...contentProps} />,
      documents: <DocumentsContent {...contentProps} />,
      profile: <ProfileContent />,
      settings: <SettingsContent {...contentProps} />,
    };

    return contentMap[currentPage as keyof typeof contentMap] || contentMap.dashboard;
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
