import { supabase } from '../config/supabase';
import { CustomError } from '../utils/errorHandler';

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

export class SubscriptionModel {
  // Get subscription by user ID
  static async findByUserId(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Subscription not found
      }
      throw new CustomError(`Failed to fetch subscription: ${error.message}`, 500);
    }

    return data;
  }

  // Get subscription by Stripe customer ID
  static async findByStripeCustomerId(customerId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new CustomError(`Failed to fetch subscription: ${error.message}`, 500);
    }

    return data;
  }

  // Get subscription by Stripe subscription ID
  static async findByStripeSubscriptionId(subscriptionId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new CustomError(`Failed to fetch subscription: ${error.message}`, 500);
    }

    return data;
  }

  // Create new subscription
  static async create(subscriptionData: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new CustomError('Subscription already exists for this user', 409);
      }
      throw new CustomError(`Failed to create subscription: ${error.message}`, 500);
    }

    return data;
  }

  // Update subscription
  static async update(userId: string, subscriptionData: Partial<Subscription>): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(subscriptionData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Subscription not found
      }
      throw new CustomError(`Failed to update subscription: ${error.message}`, 500);
    }

    return data;
  }

  // Update subscription by Stripe subscription ID
  static async updateByStripeId(stripeSubscriptionId: string, subscriptionData: Partial<Subscription>): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(subscriptionData)
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new CustomError(`Failed to update subscription: ${error.message}`, 500);
    }

    return data;
  }

  // Delete subscription
  static async delete(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new CustomError(`Failed to delete subscription: ${error.message}`, 500);
    }

    return true;
  }

  // Check if user has active subscription
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.findByUserId(userId);
    
    if (!subscription || subscription.status !== 'ACTIVE') {
      return false;
    }

    // Check if subscription is still within current period
    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end);
      const now = new Date();
      return endDate > now;
    }

    return subscription.status === 'ACTIVE';
  }

  // Get all active subscriptions
  static async findActiveSubscriptions(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (error) {
      throw new CustomError(`Failed to fetch active subscriptions: ${error.message}`, 500);
    }

    return data || [];
  }

  // Get all subscriptions (for debugging)
  static async findAllSubscriptions(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new CustomError(`Failed to fetch all subscriptions: ${error.message}`, 500);
    }

    return data || [];
  }

  // Get subscription with user details
  static async findByUserIdWithUser(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        users:user_id (
          id,
          email,
          name
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new CustomError(`Failed to fetch subscription with user: ${error.message}`, 500);
    }

    return data;
  }
}