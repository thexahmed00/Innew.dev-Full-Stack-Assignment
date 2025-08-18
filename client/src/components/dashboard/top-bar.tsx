"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface TopBarProps {
  className?: string;
  activeTab?: string;
}

export function TopBar({ className, activeTab = "dashboard" }: TopBarProps) {
  const [selectedCurrency, setSelectedCurrency] = useState("INR");
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

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case "dashboard":
        return "Dashboard";
      case "users":
        return "Users Management";
      case "documents":
        return "Documents";
      case "settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
  };

  const handleCountryFilterChange = (country: string) => {
    setSelectedCountry(country);
  };

  return (
    <div
      className={`flex h-12 items-center justify-between border-b bg-background px-6 mb-4 ${className}`}
    >
      {/* Left side - Page title */}
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold">{getTabTitle(activeTab)}</h1>
      </div>

      {/* Right side - Notifications and Avatar */}
      <div className="flex items-center space-x-4">
        {/* Currency Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="min-w-[100px] justify-between"
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
              size="sm"
              className="min-w-[100px] justify-between"
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

        {/* Avatar with dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/01.png" alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  JD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span className="mr-2">👤</span>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span className="mr-2">✏️</span>
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span className="mr-2">⚙️</span>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span className="mr-2">🚪</span>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
