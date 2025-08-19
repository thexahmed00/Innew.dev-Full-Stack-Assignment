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

  // Get the current page from URL params, default to "dashboard"
  const currentPage = searchParams.get("page") || "dashboard";

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
    switch (currentPage) {
      case "dashboard":
        return <DashboardContent />;
      case "users":
        return <UsersContent />;
      case "documents":
        return <DocumentsContent />;
      case "settings":
        return <SettingsContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <ProtectedRoute>
      <SidebarWrapper activeTab={currentPage} onTabChange={handleTabChange}>
        <div className="flex flex-col h-full">
          {/* Top Bar */}
          <TopBar activeTab={currentPage} />

          {/* Main Content */}
          <div className="flex-1 overflow-auto">{renderContent()}</div>
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </SidebarWrapper>
    </ProtectedRoute>
  );
}
