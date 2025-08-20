"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { type Subscription } from "@/lib/billing";

interface SidebarWrapperProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  subscription?: Subscription | null;
  loadingSubscription?: boolean;
}

export function SidebarWrapper({
  children,
  activeTab,
  onTabChange,
  subscription,
  loadingSubscription,
}: SidebarWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="flex h-screen">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-full items-center justify-between px-4">
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-8 w-8 p-0"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
            <div className="fixed left-0 top-0 h-full w-80 border-r bg-background">
              <div className="flex h-full flex-col">
                <div className="flex h-14 items-center justify-between border-b px-4">
                  <h2 className="text-lg font-semibold">Dashboard</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Sidebar
                  className="border-0 flex-1"
                  activeTab={activeTab}
                  onTabChange={(tab) => {
                    onTabChange(tab);
                    setIsMobileMenuOpen(false);
                  }}
                  subscription={subscription}
                  loadingSubscription={loadingSubscription}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <div className="flex-1 pt-14">
          <div className="h-full p-4">{children}</div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex h-screen">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        subscription={subscription}
        loadingSubscription={loadingSubscription}
      />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          <div className="h-full p-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
