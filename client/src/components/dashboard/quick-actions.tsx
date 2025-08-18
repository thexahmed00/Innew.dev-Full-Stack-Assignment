"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Calculator, Download } from "lucide-react";

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <div className="flex flex-col space-y-3">
        {/* Add Asset */}
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
          title="Add Asset"
        >
          <Plus className="h-6 w-6" />
        </Button>
        
        {/* Add Liability */}
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-background hover:bg-muted"
          title="Add Liability"
        >
          <CreditCard className="h-6 w-6" />
        </Button>
        
        {/* Compute Taxes */}
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-background hover:bg-muted"
          title="Compute Taxes"
        >
          <Calculator className="h-6 w-6" />
        </Button>
        
        {/* Export */}
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-background hover:bg-muted"
          title="Export Data"
        >
          <Download className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
