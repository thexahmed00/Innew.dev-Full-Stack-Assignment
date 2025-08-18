"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Globe, CreditCard } from "lucide-react";

export function SettingsContent() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings Content</h1>
      <p className="text-gray-600 mt-2">
        Application settings and configuration
      </p>
    </div>
  );
}
