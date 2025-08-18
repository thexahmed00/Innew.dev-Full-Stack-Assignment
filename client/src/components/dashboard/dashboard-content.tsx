"use client";

import * as React from "react";
import { DashboardHeader } from "./dashboard-header";
import { KpiStrip } from "./kpi-strip";
import { PrimaryCards } from "./primary-cards";
import { ChartsSection } from "./charts-section";
import { DashboardFooter } from "./dashboard-footer";

import { DashboardData } from "@/types/dashboard";

interface DashboardContentProps {
  data: DashboardData;
  selectedCurrency: string;
  selectedCountry: string;
  onCurrencyChange: (currency: string) => void;
  onCountryFilterChange: (country: string) => void;
}

export function DashboardContent() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Content</h1>
      <p className="text-gray-600 mt-2">
        Main dashboard overview and analytics
      </p>
    </div>
  );
}
