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
      // Remove Enterprise plan from the selectable plans list
      const filtered = all.filter(p => !p.name || !p.name.toLowerCase().includes('enterprise'));
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
    if (n.includes('basic') || n === 'basic') return 1;
    return 0; // free or unknown
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

  const handleSwitchPlan = async (priceId: string) => {
    if (!subscription) return;
    const confirmText = 'Are you sure you want to switch your plan? Prorated charges/credits may apply.';
    const confirmed = window.confirm(confirmText);
    if (!confirmed) return;
    setLoadingProduct(priceId);
    try {
      await billingService.switchPlan(priceId);
      toast.success('Plan change initiated. Your subscription will update shortly.');
      await loadSubscription();
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch plan');
    } finally {
      setLoadingProduct(null);
    }
  };


  const handleCancelSubscription = async () => {
    if (!subscription) return;
    const confirmed = window.confirm('Cancel your subscription at the end of the current period?');
    if (!confirmed) return;
    setIsLoading(true);
    try {
      await billingService.cancelSubscription();
      toast.success('Subscription will be canceled at period end');
      await loadSubscription();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
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
        return ['100 files', '1GB storage', '50 posts', 'Email support', 'Basic analytics'];
      case 'pro plan':
        return ['1000 files', '10GB storage', '500 posts', 'Priority support', 'Advanced analytics', 'API access'];
      case 'enterprise plan':
        return ['Unlimited files', 'Unlimited storage', 'Unlimited posts', '24/7 phone support', 'Custom integrations', 'SLA guarantee'];
      default:
        return ['10 files', '100MB storage', '5 posts', 'Community support'];
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

                <div className="flex flex-wrap gap-2">
                  {/* Temporarily disabled until Stripe Customer Portal is configured */}
                  {/* <Button onClick={handleManageSubscription} disabled={isLoading} variant="outline">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                    Billing portal
                  </Button> */}

                  {subscription.status === 'ACTIVE' && (
                    <Button onClick={handleCancelSubscription} variant="destructive" disabled={isLoading}>
                      Cancel at period end
                    </Button>
                  )}
                  {subscription.status !== 'ACTIVE' && (
                    <Button onClick={handleReactivateSubscription} disabled={isLoading}>
                      Reactivate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Free Plan Card */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Free Plan
                  {(!subscription || subscription.plan_name === 'FREE') && (
                    <Badge variant="outline">Current</Badge>
                  )}
                </CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
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
                <Button variant="outline" className="w-full" disabled>
                  {(!subscription || subscription.plan_name === 'FREE') ? 'Current Plan' : 'Downgrade'}
                </Button>
              </CardContent>
            </Card>

            {/* Dynamic Product Cards */}
            {products.map((product) => {
              const monthlyPrice = product.prices.find(p => p.recurring?.interval === 'month');
              const yearlyPrice = product.prices.find(p => p.recurring?.interval === 'year');
              const displayPrice = monthlyPrice || yearlyPrice;

              if (!displayPrice) return null;

              const isCurrentPlan = subscription?.plan_name?.toLowerCase() === product.name.toLowerCase();
              const isPopular = product.name.toLowerCase().includes('pro');

              return (
                <Card key={product.id} className={cn("relative", isPopular ? "border-primary" : "")}>
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
                          onClick={() => (isCurrentPlan ? undefined : (subscription ? handleSwitchPlan(monthlyPrice.id) : handleSubscribe(monthlyPrice.id)))}
                          disabled={loadingProduct === monthlyPrice.id}
                          variant={isCurrentPlan ? "outline" : "default"}
                        >
                          {loadingProduct === monthlyPrice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {isCurrentPlan
                            ? 'Current Plan'
                            : `Subscribe Monthly (${billingService.formatPrice(monthlyPrice.unit_amount)})`
                          }
                        </Button>
                      )}

                      {yearlyPrice && (
                        <Button
                          className="w-full"
                          onClick={() => (isCurrentPlan ? undefined : (subscription ? handleSwitchPlan(yearlyPrice.id) : handleSubscribe(yearlyPrice.id)))}
                          disabled={loadingProduct === yearlyPrice.id}
                          variant={monthlyPrice ? "outline" : (isCurrentPlan ? "outline" : "default")}
                        >
                          {loadingProduct === yearlyPrice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {isCurrentPlan
                            ? 'Current Plan'
                            : `Subscribe Yearly (${billingService.formatPrice(yearlyPrice.unit_amount)})`
                          }
                          {!isCurrentPlan && yearlyPrice && monthlyPrice && (
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
