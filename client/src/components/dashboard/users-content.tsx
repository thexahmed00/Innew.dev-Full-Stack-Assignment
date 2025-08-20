"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, MoreHorizontal, Crown } from "lucide-react";
import { type Subscription } from "@/lib/billing";

interface UsersContentProps {
  subscription?: Subscription | null;
  isProPlan?: boolean;
}

export function UsersContent({ isProPlan }: UsersContentProps) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Users Content</h1>
        {isProPlan && (
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <Crown className="h-3 w-3 mr-1" />
            Pro Features
          </Badge>
        )}
      </div>
      <p className="text-gray-600 mt-2">
        {isProPlan 
          ? "Advanced user management and administration with Pro features"
          : "User management and administration (Upgrade to Pro for advanced features)"
        }
      </p>
    </div>
  );
}
