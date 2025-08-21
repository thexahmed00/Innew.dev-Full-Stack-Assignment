"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  CreditCard,
  Crown,
  ChevronLeft,
  ChevronRight,
  User,
  UserCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  LogOut,
  Loader2,
} from "lucide-react";
import { billingService } from "@/lib/billing";
import type { Subscription } from "@/lib/billing";

interface SidebarProps {
  className?: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  refreshTrigger?: number; // Optional prop to trigger subscription refresh
}

export function Sidebar({ className, activeTab, onTabChange, refreshTrigger }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);

  // Load subscription data on component mount and when refreshTrigger changes
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        setIsLoadingCredits(true);
        const subscriptionData = await billingService.getCurrentSubscription();
        setSubscription(subscriptionData);
      } catch (error) {
        console.error('Failed to load subscription:', error);
        setSubscription(null);
      } finally {
        setIsLoadingCredits(false);
      }
    };

    loadSubscription();
  }, [refreshTrigger]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Helper function to get credits display text
  const getCreditsDisplay = () => {
    if (isLoadingCredits) {
      return { text: "Loading...", remaining: "...", percentage: 0 };
    }

    if (!subscription) {
      return { text: "No Plan", remaining: "Get started", percentage: 0 };
    }

    const used = subscription.credits_used || 0;
    const total = subscription.credits_total || 0;

    // Handle case where credits_total is null or 0 (shouldn't happen with new system)
    if (total === 0) {
      return { text: "No Credits", remaining: "Contact support", percentage: 0 };
    }

    const remaining = Math.max(0, total - used);
    const percentage = total > 0 ? Math.min(100, (used / total) * 100) : 0;

    return {
      text: `${used} / ${total} used`,
      remaining: `${remaining} remaining`,
      percentage
    };
  };

  // Helper function to determine if user should upgrade
  const shouldShowUpgrade = () => {
    if (!subscription) return true;

    // Always show upgrade for free plan users
    if (subscription.plan_name === 'FREE') return true;

    const used = subscription.credits_used || 0;
    const total = subscription.credits_total || 0;
    const usagePercentage = total > 0 ? (used / total) * 100 : 0;

    // Show upgrade if no subscription, low credits, or on starter plan
    return !subscription ||
           usagePercentage > 80 ||
           subscription.plan_name === 'STARTUP';
  };

  const menuItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      id: "users",
      title: "Users",
      icon: Users,
      href: "/dashboard/users",
    },
    {
      id: "documents",
      title: "Documents",
      icon: FileText,
      href: "/dashboard/documents",
    },
    {
      id: "profile",
      title: "Profile",
      icon: UserCircle,
      href: "/dashboard/profile",
    },
    {
      id: "billing",
      title: "Billing",
      icon: CreditCard,
      href: "/billing",
    },
    {
      id: "settings",
      title: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
    },
  ];

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!isCollapsed && <h2 className="text-lg font-semibold">Dashboard</h2>}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              isCollapsed ? "px-2 justify-center" : "px-4"
            )}
            onClick={() => {
              if (item.id === "billing") {
                window.location.href = "/billing";
              } else {
                onTabChange(item.id);
              }
            }}
          >
            <item.icon className="h-4 w-4" />
            {!isCollapsed && <span className="ml-3">{item.title}</span>}
          </Button>
        ))}
      </nav>

      {/* Premium Section */}
      <div className="border-t p-4">
        <div className={cn("space-y-3", isCollapsed ? "px-2" : "px-0")}>
          {/* Credits */}
          <div
            className={cn(
              "rounded-lg bg-muted p-3",
              isCollapsed ? "space-y-2" : "space-y-3"
            )}
          >
            <div className="flex items-center space-x-2">
              {isLoadingCredits ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 text-primary" />
              )}
              {!isCollapsed && (
                <div className="text-sm flex-1">
                  <p className="font-medium">
                    {subscription ? 'Credits Used' : 'Credits'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getCreditsDisplay().text}
                  </p>
                  {subscription && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getCreditsDisplay().remaining}
                    </p>
                  )}
                </div>
              )}
            </div>
            {!isCollapsed && subscription && (
              <div className="w-full">
                <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      getCreditsDisplay().percentage > 80
                        ? "bg-red-500"
                        : getCreditsDisplay().percentage > 60
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    )}
                    style={{ width: `${getCreditsDisplay().percentage}%` }}
                  />
                </div>
              </div>
            )}
            {!isCollapsed && shouldShowUpgrade() && (
              <Button
                size="sm"
                className="w-full h-8"
                onClick={() => window.location.href = '/billing'}
              >
                <Crown className="mr-2 h-3 w-3" />
                {subscription ? 'Upgrade Plan' : 'Get Started'}
              </Button>
            )}
          </div>

          <Separator />

          {/* Profile Section with Dropdown */}
          <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between p-3 h-auto hover:bg-muted/50",
                  isCollapsed ? "px-2 justify-center" : "px-3"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">John Doe</p>
                      <p className="text-xs text-muted-foreground truncate">
                        john@example.com
                      </p>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center">
                    {isProfileOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              align="start"
              side="right"
              sideOffset={8}
            >
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onTabChange('profile')}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
