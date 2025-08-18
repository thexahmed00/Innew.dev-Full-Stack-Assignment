"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Calculator, Bell, Download } from "lucide-react";
import { DashboardData } from "@/types/dashboard";

interface PrimaryCardsProps {
  data: DashboardData;
  selectedCurrency: string;
  selectedCountry: string;
}

export function PrimaryCards({
  data,
  selectedCurrency,
  selectedCountry,
}: PrimaryCardsProps) {
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

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFilteredTaxes = () => {
    if (selectedCountry === "Global") {
      return data.taxes.byCountry;
    }
    return data.taxes.byCountry.filter(
      (tax) => tax.country === selectedCountry
    );
  };

  const getFilteredWealth = () => {
    if (selectedCountry === "Global") {
      return data.countries;
    }
    return data.countries.filter((country) => country.code === selectedCountry);
  };

  const filteredTaxes = getFilteredTaxes();
  const filteredWealth = getFilteredWealth();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Taxes This FY Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold">
            Taxes This FY
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
              <Calculator className="h-3 w-3 mr-1" />
              Compute
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
              <Bell className="h-3 w-3 mr-1" />
              Reminders
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {filteredTaxes.length > 0 ? (
            filteredTaxes.map((tax) => (
              <div
                key={tax.country}
                className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {tax.country}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {formatCurrency(tax.amount, selectedCurrency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {formatDate(tax.dueDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    className={`${getConfidenceColor(
                      tax.confidence
                    )} text-xs px-2 py-0 h-5`}
                  >
                    {tax.confidence.toUpperCase()}
                  </Badge>
                  <Button size="sm" variant="ghost" className="h-5 px-1">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Calculator className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                No taxes to display for selected country
              </p>
            </div>
          )}

          <div className="pt-2 border-t">
            <Button variant="outline" size="sm" className="w-full h-8 text-xs">
              <Download className="h-3 w-3 mr-2" />
              Export Tax Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wealth By Country Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold">
            Wealth By Country
          </CardTitle>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            View All
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {filteredWealth.length > 0 ? (
            filteredWealth.map((country) => {
              const percentage = (
                (country.netWorth / data.netWorth.current) *
                100
              ).toFixed(1);
              return (
                <div key={country.code} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {country.code}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{country.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(country.netWorth, selectedCurrency)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{percentage}%</p>
                      <p className="text-xs text-muted-foreground">Share</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  {/* Asset Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assets:</span>
                      <span className="font-medium">
                        {formatCurrency(country.assets, selectedCurrency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Liabilities:
                      </span>
                      <span className="font-medium">
                        {formatCurrency(country.liabilities, selectedCurrency)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No wealth data for selected country</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
