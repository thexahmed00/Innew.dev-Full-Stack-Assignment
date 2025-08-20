"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Crown, CreditCard, Zap, TrendingUp, FileText, Users, HardDrive, Calendar } from "lucide-react";
import { type Subscription } from "@/lib/billing";

interface DashboardContentProps {
  subscription?: Subscription | null;
  loadingSubscription?: boolean;
  isProPlan?: boolean;
}

export function DashboardContent({ 
  subscription, 
  isProPlan = false 
}: DashboardContentProps) {
  const getCreditsInfo = () => {
    if (!subscription) {
      return { total: 0, used: 0, remaining: 0, percentage: 0, plan: 'FREE', isUnlimited: false };
    }

    const plan = subscription.plan_name || 'FREE';
    const isUnlimited = subscription.credits_total === null;
    const total = subscription.credits_total || 0;
    const used = subscription.credits_used || 0;
    const remaining = isUnlimited ? Infinity : total - used;
    const percentage = isUnlimited ? 0 : (total > 0 ? (used / total) * 100 : 0);

    return { total, used, remaining, percentage, plan, isUnlimited };
  };

  const getPlanLimits = (plan: string) => {
    switch (plan.toUpperCase()) {
      case 'BASIC':
        return { files: 100, storage: '1GB', posts: 50 };
      case 'PRO':
        return { files: 1000, storage: '10GB', posts: 500 };
      case 'ENTERPRISE':
        return { files: 'Unlimited', storage: 'Unlimited', posts: 'Unlimited' };
      default:
        return { files: 10, storage: '100MB', posts: 5 };
    }
  };

  const credits = getCreditsInfo();
  const limits = getPlanLimits(credits.plan);

  return (
    <div className="p-6">
      {/* Header with Plan Status */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            {isProPlan && (
              <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <Crown className="h-3 w-3 mr-1" />
                {credits.plan} Plan
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            {isProPlan 
              ? `Welcome back! You're on the ${credits.plan} plan with enhanced features.`
              : 'Overview of your account activity and usage.'
            }
          </p>
        </div>
      </div>

      {/* Credits and Usage Section */}
      {isProPlan && subscription && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Credits Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Balance</CardTitle>
              <Zap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {credits.isUnlimited ? '∞' : credits.remaining.toLocaleString()}
                {!credits.isUnlimited && (
                  <span className="text-sm text-muted-foreground ml-2">
                    of {credits.total.toLocaleString()}
                  </span>
                )}
              </div>
              {!credits.isUnlimited && (
                <>
                  <Progress value={100 - credits.percentage} className="mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {credits.used.toLocaleString()} credits used this period
                  </p>
                </>
              )}
              {credits.isUnlimited && (
                <p className="text-xs text-muted-foreground">Unlimited credits available</p>
              )}
            </CardContent>
          </Card>

          {/* Plan Limits */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan Limits</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Files
                  </span>
                  <span className="font-medium">{limits.files}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    Storage
                  </span>
                  <span className="font-medium">{limits.storage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Posts
                  </span>
                  <span className="font-medium">{limits.posts}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {subscription.status}
              </div>
              {subscription.current_period_end && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Free Tier Upgrade Prompt */}
      {!isProPlan && (
        <Card className="mb-8 border-2 border-dashed border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="py-8">
            <div className="text-center">
              <Crown className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upgrade to Pro for Enhanced Features
              </h3>
              <p className="text-gray-600 mb-4">
                Get 1,000 credits, advanced analytics, priority support, and much more.
              </p>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={() => window.location.href = '/billing'}
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Usage analytics will appear here</p>
                <p className="text-sm">Connect your services to see detailed metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isProPlan ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Recent activity will appear here</p>
                  <p className="text-sm">Your Pro features are ready to use</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Limited activity tracking on free tier</p>
                  <p className="text-sm">Upgrade for detailed activity logs</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
