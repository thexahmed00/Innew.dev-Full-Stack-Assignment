"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardData } from "@/types/dashboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  data: DashboardData;
  onCurrencyChange: (currency: string) => void;
  onCountryFilterChange: (country: string) => void;
}

export function DashboardHeader({
  data,
  onCurrencyChange,
  onCountryFilterChange,
}: DashboardHeaderProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(
    data.user.baseCurrency
  );
  const [selectedCountry, setSelectedCountry] = useState("Global");

  const currencies = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  ];

  const countries = [
    { code: "Global", name: "Global" },
    { code: "IN", name: "India" },
    { code: "UK", name: "United Kingdom" },
    { code: "US", name: "United States" },
    { code: "UAE", name: "UAE" },
  ];

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    onCurrencyChange(currency);
  };

  const handleCountryFilterChange = (country: string) => {
    setSelectedCountry(country);
    onCountryFilterChange(country);
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencyInfo = currencies.find((c) => c.code === currency);
    if (!currencyInfo) return amount.toLocaleString();

    return `${currencyInfo.symbol}${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Trial Banner */}
      {data.user.isTrialActive && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-blue-800">
                <span className="font-medium">
                  {data.user.trialDaysLeft} days left
                </span>{" "}
                in your trial. Full access to tax engine and premium features.
              </p>
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Upgrade Now
            </Button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        {/* Left Side - Net Worth */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {formatCurrency(data.netWorth.current, selectedCurrency)}
          </h1>
          <div className="flex items-center space-x-2">
            {data.netWorth.trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span
              className={`text-sm font-medium ${
                data.netWorth.trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {data.netWorth.trend === "up" ? "+" : ""}
              {formatCurrency(data.netWorth.change, selectedCurrency)}(
              {data.netWorth.changePercentage}%) since last 30 days
            </span>
          </div>
        </div>

        {/* Right Side - Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Currency Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[120px] justify-between"
              >
                {currencies.find((c) => c.code === selectedCurrency)?.symbol}{" "}
                {selectedCurrency}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {currencies.map((currency) => (
                <DropdownMenuItem
                  key={currency.code}
                  onClick={() => handleCurrencyChange(currency.code)}
                  className="flex items-center space-x-2"
                >
                  <span className="font-medium">{currency.symbol}</span>
                  <span>{currency.code}</span>
                  <span className="text-muted-foreground text-sm">
                    {currency.name}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Country Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[120px] justify-between"
              >
                {countries.find((c) => c.code === selectedCountry)?.name}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {countries.map((country) => (
                <DropdownMenuItem
                  key={country.code}
                  onClick={() => handleCountryFilterChange(country.code)}
                >
                  {country.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* FX Refresh Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>
            Last FX Refresh: {data.fxRates.source} •{" "}
            {formatDate(data.fxRates.lastRefresh)}
          </span>
        </div>

        {/* Setup Nudges */}
        <div className="flex items-center space-x-2">
          {data.user.kycStatus === "incomplete" && (
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer"
            >
              KYC Incomplete
            </Badge>
          )}
          {data.countries.find(
            (c) => c.code === "UK" && c.residencyStatus === "incomplete"
          ) && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer"
            >
              UK Tax Setup Incomplete
            </Badge>
          )}
          {data.reminders.total === 0 && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
            >
              No Reminders Set
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
