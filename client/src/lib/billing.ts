import { createSupabaseClient } from './supabase';

export interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  prices: StripePrice[];
}

export interface StripePrice {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  };
  nickname?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
  plan_name?: string;
  price_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  credits_total?: number | null;
  credits_used?: number;
  credits_reset_at?: string | null;
  created_at: string;
  updated_at: string;
}

class BillingService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  // Get current user's subscription
  async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/users/subscription`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No subscription
        }
        throw new Error('Failed to fetch subscription');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  // Get available products and prices
  async getProducts(): Promise<StripeProduct[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/stripe/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Create checkout session
  async createCheckoutSession(priceId: string): Promise<string> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const baseUrl = window.location.origin;
      const response = await fetch(`${this.apiBaseUrl}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${baseUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/billing?canceled=true`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const result = await response.json();
      return result.data.checkout_url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Create portal session for subscription management
  async createPortalSession(): Promise<string> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const baseUrl = window.location.origin;
      const response = await fetch(`${this.apiBaseUrl}/api/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: `${baseUrl}/billing`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create portal session');
      }

      const result = await response.json();
      return result.data.portal_url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  // Switch plan (upgrade/downgrade)
  async switchPlan(priceId: string): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/stripe/switch-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price_id: priceId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to switch plan');
      }
    } catch (error) {
      console.error('Error switching plan:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/stripe/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Reactivate subscription
  async reactivateSubscription(): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/stripe/reactivate-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reactivate subscription');
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  // Handle checkout completion - ensures subscription sync
  async handleCheckoutCompletion(sessionId: string): Promise<{
    session_id: string;
    payment_status: string;
    subscription_id: string | null;
  }> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/stripe/checkout-completion/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to handle checkout completion');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error handling checkout completion:', error);
      throw error;
    }
  }

  // Testing and Debug Methods

  // Reset current subscription for testing
  async resetSubscription(): Promise<void> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/stripe/debug/reset-subscription`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset subscription');
      }

      console.log('✅ Subscription reset successfully');
    } catch (error) {
      console.error('Error resetting subscription:', error);
      throw error;
    }
  }

  // Get detailed subscription info for debugging
  async getDetailedSubscription(): Promise<{
    database_subscription: Subscription | null;
    stripe_subscription: Record<string, unknown> | null;
    sync_status: {
      has_stripe_id: boolean;
      stripe_exists: boolean;
      in_sync: boolean;
    };
  }> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/stripe/debug/my-subscription`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get subscription details');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error getting subscription details:', error);
      throw error;
    }
  }

  // Force sync subscription from Stripe
  async syncSubscription(): Promise<{
    before: Subscription;
    after: Subscription;
  }> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/stripe/debug/sync-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync subscription');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error syncing subscription:', error);
      throw error;
    }
  }

  // Clear webhook events for clean testing
  async clearWebhookEvents(): Promise<{ deleted_count: number }> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/stripe/debug/clear-webhook-events`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear webhook events');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error clearing webhook events:', error);
      throw error;
    }
  }

  // Utility functions
  formatPrice(amount: number, currency: string = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  formatInterval(interval: string, intervalCount: number = 1): string {
    const suffix = intervalCount > 1 ? `${intervalCount} ${interval}s` : interval;
    return `per ${suffix}`;
  }

  isSubscriptionActive(subscription: Subscription | null): boolean {
    if (!subscription || subscription.status !== 'ACTIVE') {
      return false;
    }

    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end);
      return endDate > new Date();
    }

    return subscription.status === 'ACTIVE';
  }

  getPlanLimits(planName?: string) {
    const plan = planName?.toUpperCase() || 'FREE';

    switch (plan) {
      case 'BASIC':
      case 'STARTUP':
        return {
          files: 100,
          storage: '1GB',
          posts: 50,
          credits: 500,
        };
      case 'PRO':
        return {
          files: 1000,
          storage: '10GB',
          posts: 500,
          credits: 2000,
        };
      case 'ENTERPRISE':
        return {
          files: 'Unlimited',
          storage: 'Unlimited',
          posts: 'Unlimited',
          credits: 'Unlimited',
        };
      case 'FREE':
      default:
        return {
          files: 10,
          storage: '100MB',
          posts: 5,
          credits: 10,
        };
    }
  }

  // Get credit allocation for a specific plan
  getCreditAllocation(planName?: string): number {
    const plan = planName?.toUpperCase() || 'FREE';

    switch (plan) {
      case 'BASIC':
      case 'STARTUP':
        return 500;
      case 'PRO':
        return 2000;
      case 'ENTERPRISE':
        return -1; // Unlimited
      case 'FREE':
      default:
        return 10;
    }
  }

  getSubscriptionStatusMessage(status: string): { message: string; canReactivate: boolean; canSwitchPlan: boolean } {
    switch (status) {
      case 'ACTIVE':
        return {
          message: 'Your subscription is active and all features are available.',
          canReactivate: false,
          canSwitchPlan: true
        };
      case 'PAST_DUE':
        return {
          message: 'Your subscription payment is past due. Please update your payment method to continue using premium features.',
          canReactivate: true,
          canSwitchPlan: true
        };
      case 'CANCELED':
        return {
          message: 'Your subscription has been canceled. Create a new subscription to access premium features.',
          canReactivate: false,
          canSwitchPlan: false
        };
      case 'UNPAID':
        return {
          message: 'Your subscription is unpaid. Please resolve payment issues to continue.',
          canReactivate: false,
          canSwitchPlan: false
        };
      case 'INACTIVE':
        return {
          message: 'Your subscription is inactive. Please contact support for assistance.',
          canReactivate: false,
          canSwitchPlan: false
        };
      default:
        return {
          message: `Subscription status: ${status}. Please contact support if you need assistance.`,
          canReactivate: false,
          canSwitchPlan: false
        };
    }
  }
}

// Export singleton instance
export const billingService = new BillingService();