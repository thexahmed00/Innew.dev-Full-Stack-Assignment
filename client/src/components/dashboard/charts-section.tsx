"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PieChart } from "lucide-react";
import { DashboardData } from "@/types/dashboard";

interface ChartsSectionProps {
  data: DashboardData;
  selectedCurrency: string;
  selectedCountry: string;
}

export function ChartsSection({
  data,
  selectedCurrency,
  selectedCountry,
}: ChartsSectionProps) {
  const formatCurrency = (amount: number, currency: string) => {
    const currencySymbols: { [key: string]: string } = {
      INR: "₹",
      GBP: "£",
      USD: "$",
      AED: "د.إ",
    };

    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getFilteredNetWorthHistory = () => {
    if (selectedCountry === "Global") {
      return data.netWorthHistory;
    }
    // For country-specific view, you might want to filter or show different data
    return data.netWorthHistory;
  };

  const getFilteredAssetAllocation = () => {
    if (selectedCountry === "Global") {
      return data.assets.byType;
    }
    // For country-specific view, you might want to filter or show different data
    return data.assets.byType;
  };

  const netWorthHistory = getFilteredNetWorthHistory();
  const assetAllocation = getFilteredAssetAllocation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Net Worth Over Time Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold">
            Net Worth Over Time
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              Last 12 months
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {netWorthHistory.length > 0 ? (
            <div className="space-y-3">
              {/* Simple Chart Representation */}
              <div className="h-32 flex items-end justify-between space-x-1">
                {netWorthHistory.map((point, index) => {
                  const maxValue = Math.max(
                    ...netWorthHistory.map((p) => p.value)
                  );
                  const height = (point.value / maxValue) * 100;
                  const month = new Date(point.month).toLocaleDateString(
                    "en-US",
                    { month: "short" }
                  );

                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center space-y-1"
                    >
                      <div
                        className="w-6 bg-primary rounded-t-sm transition-all duration-300 hover:bg-primary/80"
                        style={{ height: `${height}%` }}
                        title={`${month}: ${formatCurrency(
                          point.value,
                          selectedCurrency
                        )}`}
                      ></div>
                      <span className="text-xs text-muted-foreground">
                        {month}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Start:{" "}
                  {formatCurrency(
                    netWorthHistory[0]?.value || 0,
                    selectedCurrency
                  )}
                </span>
                <span className="text-muted-foreground">
                  Current:{" "}
                  {formatCurrency(
                    netWorthHistory[netWorthHistory.length - 1]?.value || 0,
                    selectedCurrency
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium mb-1">
                Add assets to see trend
              </p>
              <p className="text-xs">
                Your net worth history will appear here once you add your first
                asset.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asset Allocation Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold">
            Asset Allocation
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              Portfolio breakdown
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {assetAllocation.length > 0 ? (
            <div className="space-y-3">
              {/* Donut Chart Representation */}
              <div className="relative h-32 flex items-center justify-center">
                <div className="relative w-24 h-24">
                  {/* Simple donut chart using CSS */}
                  <svg
                    className="w-24 h-24 transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    {assetAllocation.map((asset, index) => {
                      const total = assetAllocation.reduce(
                        (sum, a) => sum + a.percentage,
                        0
                      );
                      const previousPercentages = assetAllocation
                        .slice(0, index)
                        .reduce((sum, a) => sum + a.percentage, 0);

                      const startAngle = (previousPercentages / total) * 360;
                      const endAngle =
                        ((previousPercentages + asset.percentage) / total) *
                        360;

                      const colors = [
                        "#3b82f6",
                        "#10b981",
                        "#f59e0b",
                        "#ef4444",
                        "#8b5cf6",
                      ];

                      return (
                        <path
                          key={asset.type}
                          d={`M 50 50 m 0 -35 A 35 35 0 1 1 ${
                            50 +
                            35 * Math.cos(((endAngle - 90) * Math.PI) / 180)
                          } ${
                            50 +
                            35 * Math.sin(((endAngle - 90) * Math.PI) / 180)
                          }`}
                          fill="none"
                          stroke={colors[index % colors.length]}
                          strokeWidth="6"
                          strokeDasharray={`${
                            (asset.percentage / total) * 220
                          } 220`}
                          strokeDashoffset={220 - (startAngle / 360) * 220}
                        />
                      );
                    })}
                  </svg>

                  {/* Center text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm font-bold">
                        {formatCurrency(data.assets.total, selectedCurrency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total Assets
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="space-y-1">
                {assetAllocation.map((asset, index) => {
                  const colors = [
                    "#3b82f6",
                    "#10b981",
                    "#f59e0b",
                    "#ef4444",
                    "#8b5cf6",
                  ];
                  return (
                    <div
                      key={asset.type}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: colors[index % colors.length],
                          }}
                        ></div>
                        <span className="text-sm font-medium">
                          {asset.type}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(asset.value, selectedCurrency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {asset.percentage}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium mb-1">No assets to display</p>
              <p className="text-xs">
                Add your first asset to see your portfolio breakdown.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
