"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wallet, CreditCard, Receipt } from "lucide-react";
import { DashboardData } from "@/types/dashboard";

interface KpiStripProps {
  data: DashboardData;
  selectedCurrency: string;
  selectedCountry: string;
}

export function KpiStrip({
  data,
  selectedCurrency,
  selectedCountry,
}: KpiStripProps) {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getFilteredData = () => {
    if (selectedCountry === "Global") {
      return {
        netWorth: data.netWorth.current,
        assets: data.assets.total,
        liabilities: data.liabilities.total,
        taxes: data.taxes.total,
        nextDueDate: data.taxes.nextDueDate,
      };
    }

    const countryData = data.countries.find((c) => c.code === selectedCountry);
    if (!countryData) return null;

    return {
      netWorth: countryData.netWorth,
      assets: countryData.assets,
      liabilities: countryData.liabilities,
      taxes: countryData.taxes.total,
      nextDueDate: countryData.taxes.dueDate,
    };
  };

  const filteredData = getFilteredData();
  if (!filteredData) return null;

  const kpis = [
    {
      title: "Net Worth",
      value: formatCurrency(filteredData.netWorth, selectedCurrency),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: data.netWorth.trend === "up" ? "+" : "",
      trendValue: `${data.netWorth.changePercentage}%`,
      trendColor:
        data.netWorth.trend === "up" ? "text-green-600" : "text-red-600",
    },
    {
      title: "Assets",
      value: formatCurrency(filteredData.assets, selectedCurrency),
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: null,
      trendValue: null,
      trendColor: null,
    },
    {
      title: "Liabilities",
      value: formatCurrency(filteredData.liabilities, selectedCurrency),
      icon: CreditCard,
      color: "text-red-600",
      bgColor: "bg-red-50",
      trend: null,
      trendValue: null,
      trendColor: null,
    },
    {
      title: "Taxes This FY",
      value: formatCurrency(filteredData.taxes, selectedCurrency),
      icon: Receipt,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: null,
      trendValue: null,
      trendColor: null,
      subtitle: `Due: ${formatDate(filteredData.nextDueDate)}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi, index) => (
        <Card
          key={index}
          className="hover:shadow-md transition-shadow cursor-pointer"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              {kpi.trend && (
                <div className={`text-xs font-medium ${kpi.trendColor}`}>
                  {kpi.trend}
                  {kpi.trendValue}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {kpi.title}
              </p>
              <p className="text-lg font-bold leading-tight">{kpi.value}</p>
              {kpi.subtitle && (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                    {kpi.subtitle}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
