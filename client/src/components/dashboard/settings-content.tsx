"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Globe, CreditCard, Crown } from "lucide-react";
import { type Subscription } from "@/lib/billing";

interface SettingsContentProps {
  subscription?: Subscription | null;
  isProPlan?: boolean;
}

export function SettingsContent({ isProPlan }: SettingsContentProps) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Settings Content</h1>
        {isProPlan && (
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <Crown className="h-3 w-3 mr-1" />
            Pro Settings
          </Badge>
        )}
      </div>
      <p className="text-gray-600 mt-2">
        {isProPlan 
          ? "Advanced application settings and Pro configuration options"
          : "Application settings and configuration (Some features require Pro)"
        }
      </p>
    </div>
  );
}
