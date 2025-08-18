"use client";

import * as React from "react";

export function DashboardFooter() {
  return (
    <footer className="mt-12 pt-8 border-t">
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 text-sm text-muted-foreground">
        <div className="flex items-center space-x-6">
          <span>Guidance only, not tax advice.</span>
          <span>PII encrypted at rest. Tax IDs masked.</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>© 2024 Wealth Dashboard</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
