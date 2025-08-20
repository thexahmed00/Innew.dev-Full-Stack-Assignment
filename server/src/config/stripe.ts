import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Stripe product and price configuration
export const STRIPE_CONFIG = {
  // Product names
  PRODUCTS: {
    STARTUP: 'Startup Plan',
    PRO: 'Pro Plan',
    ENTERPRISE: 'Enterprise Plan',
  },

  // Price configurations (you'll replace these with actual price IDs from Stripe dashboard)
  PRICES: {
    STARTUP_MONTHLY: process.env.STRIPE_PRICE_STARTUP_MONTHLY || 'price_startup_monthly',
    STARTUP_YEARLY: process.env.STRIPE_PRICE_STARTUP_YEARLY || 'price_startup_yearly',
    PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
    ENTERPRISE_MONTHLY: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    ENTERPRISE_YEARLY: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
  },

  // Feature limits by plan
  LIMITS: {
    FREE: {
      files: 10,
      storage: 100 * 1024 * 1024, // 100MB
      posts: 5,
    },
    STARTUP: {
      files: 100,
      storage: 1024 * 1024 * 1024, // 1GB
      posts: 50,
    },
    PRO: {
      files: 1000,
      storage: 10 * 1024 * 1024 * 1024, // 10GB
      posts: 500,
    },
    ENTERPRISE: {
      files: -1, // unlimited
      storage: -1, // unlimited
      posts: -1, // unlimited
    },
  }
} as const;

// Helper function to get plan from price ID
export function getPlanFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    [STRIPE_CONFIG.PRICES.STARTUP_MONTHLY]: 'STARTUP',
    [STRIPE_CONFIG.PRICES.STARTUP_YEARLY]: 'STARTUP',
    [STRIPE_CONFIG.PRICES.PRO_MONTHLY]: 'PRO',
    [STRIPE_CONFIG.PRICES.PRO_YEARLY]: 'PRO',
    [STRIPE_CONFIG.PRICES.ENTERPRISE_MONTHLY]: 'ENTERPRISE',
    [STRIPE_CONFIG.PRICES.ENTERPRISE_YEARLY]: 'ENTERPRISE',
  };

  return priceMap[priceId] || 'FREE';
}

// Helper function to get plan limits
export function getPlanLimits(planName: string) {
  switch (planName.toUpperCase()) {
    case 'BASIC':
    case 'STARTUP':
      return STRIPE_CONFIG.LIMITS.STARTUP;
    case 'PRO':
      return STRIPE_CONFIG.LIMITS.PRO;
    case 'ENTERPRISE':
      return STRIPE_CONFIG.LIMITS.ENTERPRISE;
    default:
      return STRIPE_CONFIG.LIMITS.FREE;
  }
}

// Credits allocation per plan
export function getPlanCredits(planName: string): number | null {
  const plan = planName.toUpperCase();
  if (plan === 'BASIC' || plan === 'STARTUP') return 500;
  if (plan === 'PRO') return 2000;
  if (plan === 'ENTERPRISE') return null; // unlimited
  if (plan === 'FREE') return 10; // Free tier credits
  return 10; // Default to free tier credits
}


// Check if plan has feature
export function planHasFeature(planName: string, feature: string, current: number): boolean {
  const limits = getPlanLimits(planName);
  const limit = limits[feature as keyof typeof limits];

  if (limit === -1) return true; // unlimited
  if (typeof limit === 'number' && typeof current === 'number') {
    return current < limit;
  }

  return false;
}