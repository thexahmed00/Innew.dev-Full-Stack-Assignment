"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { type Subscription } from "@/lib/billing";

interface DocumentsContentProps {
  subscription?: Subscription | null;
  isProPlan?: boolean;
}

export function DocumentsContent({ isProPlan }: DocumentsContentProps) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Documents Content</h1>
        {isProPlan && (
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <Crown className="h-3 w-3 mr-1" />
            Pro Features
          </Badge>
        )}
      </div>
      <p className="text-gray-600 mt-2">
        {isProPlan 
          ? "Advanced document management with Pro storage limits"
          : "Document management and storage (Limited on free tier)"
        }
      </p>
    </div>
  );
}
