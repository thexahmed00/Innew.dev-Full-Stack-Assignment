"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, CreditCard, Loader2, Calendar } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { billingService, type StripeProduct, type Subscription } from "@/lib/billing";
import { createSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);
  const [verifyingSubscription, setVerifyingSubscription] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check for success/cancel URL parameters
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    console.log('🔍 Billing page URL params:', { success, canceled, sessionId });

    if (success === 'true') {
      if (sessionId) {
        console.log('✅ Starting checkout success flow with session:', sessionId);
        handleCheckoutSuccess(sessionId);
      } else {
        console.log('⚠️ Success=true but no session_id, checking subscription status...');
        // Handle case where success=true but no session_id
        handleSuccessWithoutSession();
      }
    } else if (canceled) {
      toast.error('Subscription canceled');
    }
  }, [searchParams]);

  const handleSuccessWithoutSession = async () => {
    setVerifyingSubscription(true);
    try {
      // Just verify current subscription status
      const subscription = await billingService.getCurrentSubscription();
      
      if (subscription && subscription.status === 'ACTIVE') {
        toast.success('🎉 Subscription activated successfully! Welcome to Pro!');
        setTimeout(() => {
          router.push('/dashboard?upgraded=true');
        }, 1500);
      } else {
        toast.loading('Checking subscription status...');
        // Try to sync from Stripe
        try {
          await billingService.syncSubscription();
          const retrySubscription = await billingService.getCurrentSubscription();
          
          if (retrySubscription && retrySubscription.status === 'ACTIVE') {
            toast.success('🎉 Subscription activated successfully! Welcome to Pro!');
            setTimeout(() => {
              router.push('/dashboard?upgraded=true');
            }, 1500);
          } else {
            toast.error('Subscription is still processing. Please check your dashboard.');
          }
        } catch (syncError) {
          console.error('Sync failed:', syncError);
          toast.error('Please check your dashboard or contact support.');
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast.error('Please check your dashboard or contact support.');
    } finally {
      setVerifyingSubscription(false);
    }
  };

  const handleCheckoutSuccess = async (sessionId: string) => {
    setVerifyingSubscription(true);
    
    try {
      console.log('🔄 Processing checkout completion for session:', sessionId);
      
      // First, try to handle checkout completion to ensure sync
      try {
        await billingService.handleCheckoutCompletion(sessionId);
        console.log('✅ Checkout completion API call successful');
      } catch (completionError) {
        console.warn('⚠️ Checkout completion failed:', completionError);
        // Continue anyway, webhook might have already processed
      }
      
      // Wait a moment for webhook processing
      console.log('⏳ Waiting for webhook processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify subscription is properly set up
      console.log('🔍 Checking subscription status...');
      const subscription = await billingService.getCurrentSubscription();
      console.log('📊 Current subscription:', subscription);
      
      if (subscription && subscription.status === 'ACTIVE') {
        console.log('✅ Subscription is ACTIVE, redirecting to dashboard');
        toast.success('🎉 Subscription activated successfully! Welcome to Pro!');
        
        // Redirect to dashboard with Pro features
        setTimeout(() => {
          console.log('🚀 Redirecting to dashboard...');
          router.push('/dashboard?upgraded=true');
        }, 1500);
      } else {
        // Subscription not fully synced yet, try sync
        console.log('⚠️ Subscription not ACTIVE, attempting sync...', {
          exists: !!subscription,
          status: subscription?.status,
          plan: subscription?.plan_name
        });
        toast.loading('Finalizing your subscription...');
        
        try {
          console.log('🔄 Starting manual sync...');
          await billingService.syncSubscription();
          console.log('✅ Manual sync completed');
          
          const retrySubscription = await billingService.getCurrentSubscription();
          console.log('📊 Subscription after sync:', retrySubscription);
          
          if (retrySubscription && retrySubscription.status === 'ACTIVE') {
            console.log('✅ Subscription is now ACTIVE after sync');
            toast.success('🎉 Subscription activated successfully! Welcome to Pro!');
            setTimeout(() => {
              console.log('🚀 Redirecting to dashboard after sync...');
              router.push('/dashboard?upgraded=true');
            }, 1500);
          } else {
            console.error('❌ Subscription still not ACTIVE after sync:', retrySubscription);
            throw new Error('Subscription sync failed');
          }
        } catch (syncError) {
          console.error('❌ Sync failed:', syncError);
          toast.error('Subscription is processing. Please check your dashboard in a moment.');
          // Still redirect to dashboard - user can check status there
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('❌ Checkout completion failed:', error);
      toast.error('There was an issue processing your subscription. Please check your dashboard.');
      // Redirect anyway - user can check status on dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } finally {
      setVerifyingSubscription(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadSubscription();
  }, []);

  const loadProducts = async () => {
    try {
      const all = await billingService.getProducts();
      // Remove Enterprise plan and old Basic plan from the selectable plans list
      const filtered = all.filter(p => {
        if (!p.name) return false;
        const name = p.name.toLowerCase();
        // Keep Startup Plan but filter out Basic Plan and Enterprise Plan
        return !name.includes('enterprise') && !name.includes('basic plan');
      });
      setProducts(filtered);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load subscription plans');
    }
  };

  const loadSubscription = async () => {
    try {
      const subscription = await billingService.getCurrentSubscription();
      setSubscription(subscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  // Helper: find current price/product for active subscription
  const getCurrentPrice = () => {
    if (!subscription) return null as null | { price: any; product: StripeProduct };
    for (const product of products) {
      const price = product.prices.find(p => p.id === subscription.price_id);
      if (price) return { price, product } as any;
    }
    return null;
  };

  const getPlanRank = (name?: string) => {
    const n = (name || '').toLowerCase();
    if (!n) return 0;
    if (n.includes('enterprise') || n === 'enterprise') return 3;
    if (n.includes('pro') || n === 'pro') return 2;
    if (n.includes('basic') || n === 'basic' || n.includes('startup') || n === 'startup') return 1;
    return 0; // free or unknown
  };

  const isDowngrade = (targetPlanName: string) => {
    if (!subscription || !subscription.plan_name) return false;
    const currentRank = getPlanRank(subscription.plan_name);
    const targetRank = getPlanRank(targetPlanName);
    return targetRank < currentRank;
  };

  // Helper function to normalize plan names for comparison
  const normalizePlanName = (planName: string): string => {
    return planName.toLowerCase().replace(/\s+plan$/i, '').trim();
  };

  // Helper function to check if subscription plan matches product
  const isSubscriptionPlanMatch = (subscription: Subscription | null, productName: string): boolean => {
    if (!subscription || !subscription.plan_name || subscription.status !== 'ACTIVE') return false;

    const subscriptionPlan = normalizePlanName(subscription.plan_name);
    const productPlan = normalizePlanName(productName);

    return subscriptionPlan === productPlan;
  };

  // Helper function to check if a specific price is the current subscription price
  const isCurrentPrice = (subscription: Subscription | null, priceId: string): boolean => {
    return subscription?.price_id === priceId && subscription?.status === 'ACTIVE';
  };

  const handleSubscribe = async (priceId: string) => {
    setLoadingProduct(priceId);
    try {
      const checkoutUrl = await billingService.createCheckoutSession(priceId);
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout');
      setLoadingProduct(null);
    }
  };

  const handleSwitchPlan = async (priceId: string, targetPlanName?: string) => {
    if (!subscription) return;

    // Only validate for active subscriptions - server will handle the rest
    if (subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE') {
      const isDowngradeAction = targetPlanName && isDowngrade(targetPlanName);
      const confirmText = isDowngradeAction
        ? 'Are you sure you want to downgrade your plan? You will lose access to premium features and may receive a prorated credit.'
        : 'Are you sure you want to switch your plan? Prorated charges/credits may apply.';

      const confirmed = window.confirm(confirmText);
      if (!confirmed) return;
    }

    setLoadingProduct(priceId);
    try {
      await billingService.switchPlan(priceId);
      const isDowngradeAction = targetPlanName && isDowngrade(targetPlanName);
      const successMessage = isDowngradeAction
        ? 'Plan downgrade initiated. Your subscription will update shortly.'
        : 'Plan change initiated. Your subscription will update shortly.';
      toast.success(successMessage);

      // Immediately reload subscription data (server now updates database immediately)
      await loadSubscription();

      // Also reload after a delay in case there are webhook updates
      setTimeout(async () => {
        await loadSubscription();
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch plan');
    } finally {
      setLoadingProduct(null);
    }
  };


  const handleCancelSubscription = async () => {
    if (!subscription) return;
    const confirmed = window.confirm(
      `Are you sure you want to cancel your ${subscription.plan_name} subscription?\n\n` +
      `• Your subscription will remain active until ${new Date(subscription.current_period_end || '').toLocaleDateString()}\n` +
      `• After that, you'll be downgraded to the Free plan\n` +
      `• You'll keep access to all your data but with free plan limitations\n\n` +
      `You can reactivate anytime before the period ends.`
    );
    if (!confirmed) return;
    setIsLoading(true);
    try {
      await billingService.cancelSubscription();
      toast.success('Subscription will be canceled at period end. You will be downgraded to the Free plan.');
      await loadSubscription();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;

    // Basic validation - let server handle the detailed logic
    if (subscription.status === 'ACTIVE') {
      toast.error('Subscription is already active.');
      return;
    }

    setIsLoading(true);
    try {
      await billingService.reactivateSubscription();
      toast.success('Subscription reactivated');
      await loadSubscription();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reactivate subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDowngradeToFree = async () => {
    if (!subscription) return;
    const confirmed = window.confirm(
      'Are you sure you want to downgrade to the Free plan? Your subscription will be canceled at the end of the current billing period and you will lose access to premium features.'
    );
    if (!confirmed) return;
    setIsLoading(true);
    try {
      await billingService.cancelSubscription();
      toast.success('Subscription will be canceled at period end. You will be downgraded to the Free plan.');
      await loadSubscription();
    } catch (error: any) {
      toast.error(error.message || 'Failed to downgrade subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDowngradeToFreeImmediately = async () => {
    if (!subscription) return;
    const confirmed = window.confirm(
      '⚠️ TESTING MODE: This will immediately cancel your subscription and remove Pro features. Are you sure?'
    );
    if (!confirmed) return;
    setIsLoading(true);
    try {
      // Call immediate cancellation endpoint
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/stripe/cancel-subscription-immediately`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription immediately');
      }

      toast.success('🧪 Subscription canceled immediately for testing!');
      await loadSubscription();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel subscription immediately');
    } finally {
      setIsLoading(false);
    }
  };


  // Temporarily disabled until Stripe Customer Portal is configured
  // const handleManageSubscription = async () => {
  //   setIsLoading(true);
  //   try {
  //     const portalUrl = await billingService.createPortalSession();
  //     window.open(portalUrl, '_blank');
  //   } catch (error: any) {
  //     toast.error(error.message || 'Failed to open billing portal');
  //   }
  //   setIsLoading(false);
  // };

  const isActiveSubscription = billingService.isSubscriptionActive(subscription);

  const getPlanFeatures = (planName: string) => {
    const name = planName.toLowerCase();
    switch (name) {
      case 'basic plan':
      case 'startup plan':
        return ['100 files', '1GB storage', '50 posts', '500 credits/month', 'Email support', 'Basic analytics'];
      case 'pro plan':
        return ['1000 files', '10GB storage', '500 posts', '2000 credits/month', 'Priority support', 'Advanced analytics', 'API access'];
      case 'enterprise plan':
        return ['Unlimited files', 'Unlimited storage', 'Unlimited posts', 'Unlimited credits', '24/7 phone support', 'Custom integrations', 'SLA guarantee'];
      case 'free':
      case 'free plan':
      default:
        return ['10 files', '100MB storage', '5 posts', '10 credits/month', 'Community support'];
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
            <p className="text-muted-foreground">
              Upgrade your account to unlock premium features
            </p>
          </div>

          {/* Subscription Verification Loading */}
          {verifyingSubscription && (
            <Card className="mb-8 border-blue-200 bg-blue-50">
              <CardContent className="py-8">
                <div className="flex items-center justify-center space-x-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <div className="text-center">
                    <h3 className="font-semibold text-blue-900 mb-1">Activating Your Subscription</h3>
                    <p className="text-blue-700 text-sm">Please wait while we verify your payment and set up your Pro account...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Subscription Status */}
          {subscription && (
            <Card className="mb-8 border-primary/40 shadow-sm bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Current Subscription
                  </div>
                  <Badge className={cn("capitalize", isActiveSubscription ? "bg-green-600" : "bg-destructive")}>
                    {subscription.status.toLowerCase()}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {(subscription.plan_name || 'Free')} plan • {(getCurrentPrice()?.price?.recurring?.interval || 'month')}ly billing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">{subscription.plan_name || 'Free'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-medium">
                      {getCurrentPrice()?.price?.unit_amount ? (
                        <>
                          {billingService.formatPrice(getCurrentPrice()!.price!.unit_amount)}
                          <span className="text-sm text-muted-foreground">/{getCurrentPrice()!.price!.recurring?.interval}</span>
                        </>
                      ) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Payment</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {subscription.current_period_end
                        ? new Date(subscription.current_period_end).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{subscription.status}</p>
                  </div>

                  {/* Credits display */}
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Credits: </span>
                    <span className="font-medium">
                      {subscription.credits_total === null ? 'Unlimited' : (
                        subscription.credits_total !== undefined ? `${Math.max((subscription.credits_total || 0) - (subscription.credits_used || 0), 0)} / ${subscription.credits_total}` : '—'
                      )}
                    </span>
                  </div>

                </div>

                <Separator className="my-4" />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Included features</p>
                  <ul className="grid sm:grid-cols-2 gap-2 mb-4">
                    {getPlanFeatures(`${subscription.plan_name?.toLowerCase() || 'free'} plan`).slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2" />{f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Status message */}
                  <div className="text-sm text-muted-foreground">
                    {subscription.status === 'CANCELED'
                      ? 'Your subscription has been canceled. You can subscribe to a new plan below to regain access to premium features.'
                      : billingService.getSubscriptionStatusMessage(subscription.status).message
                    }
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Temporarily disabled until Stripe Customer Portal is configured */}
                    {/* <Button onClick={handleManageSubscription} disabled={isLoading} variant="outline">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                      Billing portal
                    </Button> */}

                    {subscription.status === 'ACTIVE' && (
                      <Button onClick={handleCancelSubscription} variant="destructive" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Canceling...
                          </>
                        ) : (
                          'Downgrade to Free Plan'
                        )}
                      </Button>
                    )}
                    {billingService.getSubscriptionStatusMessage(subscription.status).canReactivate && (
                      <Button onClick={handleReactivateSubscription} disabled={isLoading}>
                        Reactivate subscription
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Free Plan Card */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Free Plan
                  {(!subscription || !billingService.isSubscriptionActive(subscription) || subscription.plan_name === 'FREE') && (
                    <Badge variant="outline">Current</Badge>
                  )}
                </CardTitle>
                <CardDescription>Perfect for getting started - always available as a fallback</CardDescription>
                <div className="text-3xl font-bold">$0<span className="text-sm font-normal">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {getPlanFeatures('free').map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={!subscription || !billingService.isSubscriptionActive(subscription) || subscription.plan_name === 'FREE' || isLoading}
                    onClick={(!subscription || !billingService.isSubscriptionActive(subscription) || subscription.plan_name === 'FREE') ? undefined : handleDowngradeToFree}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      (!subscription || !billingService.isSubscriptionActive(subscription) || subscription.plan_name === 'FREE') ? 'Current Plan' : 'Downgrade to Free'
                    )}
                  </Button>
                  
                  {/* Testing button for immediate cancellation */}
                  {subscription && billingService.isSubscriptionActive(subscription) && subscription.plan_name !== 'FREE' && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="w-full text-xs" 
                      disabled={isLoading}
                      onClick={handleDowngradeToFreeImmediately}
                    >
                      🧪 Test: Cancel Immediately
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Product Cards */}
            {products.map((product) => {
              const monthlyPrice = product.prices.find(p => p.recurring?.interval === 'month');
              const yearlyPrice = product.prices.find(p => p.recurring?.interval === 'year');
              const displayPrice = monthlyPrice || yearlyPrice;

              if (!displayPrice) return null;

              const isCurrentPlan = isSubscriptionPlanMatch(subscription, product.name);
              const isPopular = product.name.toLowerCase().includes('pro');
              const isDowngradeAction = isDowngrade(product.name);
              const statusInfo = subscription ? billingService.getSubscriptionStatusMessage(subscription.status) : null;
              const canSwitchPlan = !subscription || statusInfo?.canSwitchPlan || false;
              const isCanceled = subscription?.status === 'CANCELED';
              const hasActiveSubscription = subscription?.status === 'ACTIVE';

              return (
                <Card key={product.id} className={cn(
                  "relative", 
                  isPopular ? "border-primary" : "",
                  isDowngradeAction ? "border-orange-300 bg-orange-50/20" : ""
                )}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Crown className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className={cn("flex items-center justify-between", isCurrentPlan ? "text-primary" : undefined)}>
                      {product.name}
                      {isCurrentPlan && <Badge className="bg-primary/10 text-primary border-primary">Current</Badge>}
                    </CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                    <div className="text-3xl font-bold">
                      {billingService.formatPrice(displayPrice.unit_amount)}
                      <span className="text-sm font-normal">
                        /{displayPrice.recurring?.interval}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {getPlanFeatures(product.name).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Price Options */}
                    <div className="space-y-2 mb-4">
                      {monthlyPrice && (
                        <Button
                          className="w-full"
                          onClick={() => {
                            if (isCanceled || !subscription) {
                              // For canceled subscriptions or no subscription, create new subscription
                              handleSubscribe(monthlyPrice.id);
                            } else {
                              // For active subscriptions, switch plan (including billing interval changes)
                              handleSwitchPlan(monthlyPrice.id, product.name);
                            }
                          }}
                          disabled={loadingProduct === monthlyPrice.id || (hasActiveSubscription && !canSwitchPlan) || isCurrentPrice(subscription, monthlyPrice.id)}
                          variant={isCurrentPrice(subscription, monthlyPrice.id) ? "outline" : (isDowngradeAction ? "destructive" : "default")}
                        >
                          {loadingProduct === monthlyPrice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {isCurrentPrice(subscription, monthlyPrice.id)
                            ? 'Current Plan'
                            : isCanceled
                            ? `Subscribe Monthly (${billingService.formatPrice(monthlyPrice.unit_amount)})`
                            : isDowngradeAction
                            ? `Downgrade (${billingService.formatPrice(monthlyPrice.unit_amount)}/month)`
                            : isCurrentPlan
                            ? `Switch to Monthly (${billingService.formatPrice(monthlyPrice.unit_amount)}/month)`
                            : `Subscribe Monthly (${billingService.formatPrice(monthlyPrice.unit_amount)})`
                          }
                        </Button>
                      )}

                      {yearlyPrice && (
                        <Button
                          className="w-full"
                          onClick={() => {
                            if (isCanceled || !subscription) {
                              // For canceled subscriptions or no subscription, create new subscription
                              handleSubscribe(yearlyPrice.id);
                            } else {
                              // For active subscriptions, switch plan (including billing interval changes)
                              handleSwitchPlan(yearlyPrice.id, product.name);
                            }
                          }}
                          disabled={loadingProduct === yearlyPrice.id || (hasActiveSubscription && !canSwitchPlan) || isCurrentPrice(subscription, yearlyPrice.id)}
                          variant={monthlyPrice ? "outline" : (isCurrentPrice(subscription, yearlyPrice.id) ? "outline" : (isDowngradeAction ? "destructive" : "default"))}
                        >
                          {loadingProduct === yearlyPrice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {isCurrentPrice(subscription, yearlyPrice.id)
                            ? 'Current Plan'
                            : isCanceled
                            ? `Subscribe Yearly (${billingService.formatPrice(yearlyPrice.unit_amount)})`
                            : isDowngradeAction
                            ? `Downgrade (${billingService.formatPrice(yearlyPrice.unit_amount)}/year)`
                            : isCurrentPlan
                            ? `Switch to Yearly (${billingService.formatPrice(yearlyPrice.unit_amount)}/year)`
                            : `Subscribe Yearly (${billingService.formatPrice(yearlyPrice.unit_amount)})`
                          }
                          {!isCurrentPlan && yearlyPrice && monthlyPrice && !isDowngradeAction && (
                            <Badge variant="secondary" className="ml-2">
                              Save {Math.round((1 - (yearlyPrice.unit_amount / 12) / monthlyPrice.unit_amount) * 100)}%
                            </Badge>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>All plans include a 14-day free trial. Cancel anytime.</p>
            <p>Payments are processed securely through Stripe.</p>
            <p>Need a custom plan? <a href="mailto:support@yourcompany.com" className="text-primary hover:underline">Contact us</a></p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
