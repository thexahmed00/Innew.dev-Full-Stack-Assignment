"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, MoreHorizontal } from "lucide-react";

export function UsersContent() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900">Users Content</h1>
      <p className="text-gray-600 mt-2">User management and administration</p>
    </div>
  );
}
