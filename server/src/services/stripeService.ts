import { stripe, getPlanFromPriceId, getPlanCredits } from '../config/stripe';
import { SubscriptionModel } from '../models/Subscription';
import { UserModel } from '../models/User';
import { CustomError } from '../utils/errorHandler';
import type { User } from '../types';

export class StripeService {
  // Create Stripe customer
  static async createCustomer(user: User): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          user_id: user.id,
        },
      });

      return customer.id;
    } catch (error: any) {
      throw new CustomError(`Failed to create Stripe customer: ${error.message}`, 500);
    }
  }

  // Get or create customer
  static async getOrCreateCustomer(userId: string): Promise<string> {
    // Check if user already has a subscription with customer ID
    const existingSubscription = await SubscriptionModel.findByUserId(userId);
    if (existingSubscription) {
      return existingSubscription.stripe_customer_id;
    }

    // Get user details from our app table; if missing, try to hydrate from Supabase auth
    let user = await UserModel.findById(userId);
    if (!user) {
      // Attempt to fetch from Supabase auth admin API and auto-create minimal user record
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: adminUser, error: adminErr } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (adminErr || !adminUser.user) {
          throw new CustomError('User not found in auth', 404);
        }
        // Create minimal user record in our public.users table
        user = await UserModel.create({
          id: userId,
          email: adminUser.user.email || '',
          name: (adminUser.user.user_metadata as any)?.name || undefined,
        } as any);
      } catch (e: any) {
        throw new CustomError('User not found', 404);
      }
    }

    // Create new Stripe customer
    const customerId = await this.createCustomer(user);

    // Create subscription record with customer ID
    await SubscriptionModel.create({
      user_id: userId,
      stripe_customer_id: customerId,
      status: 'INACTIVE',
    });

    return customerId;
  }

  // Create checkout session
  static async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    try {
      const customerId = await this.getOrCreateCustomer(userId);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        metadata: {
          user_id: userId,
          price_id: priceId,
        },
      });

      return session.url!;
    } catch (error: any) {
      throw new CustomError(`Failed to create checkout session: ${error.message}`, 500);
    }
  }

  // Create portal session for subscription management
  static async createPortalSession(userId: string, returnUrl: string): Promise<string> {
    try {
      const subscription = await SubscriptionModel.findByUserId(userId);
      if (!subscription) {
        throw new CustomError('No subscription found for user', 404);
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error: any) {
      throw new CustomError(`Failed to create portal session: ${error.message}`, 500);
    }
  }

  // Handle successful subscription
  static async handleSubscriptionCreated(stripeSubscription: any): Promise<void> {
    try {
      const customerId = stripeSubscription.customer;
      const subscriptionId = stripeSubscription.id;
      const priceId = stripeSubscription.items.data[0]?.price?.id;
      const planName = getPlanFromPriceId(priceId);

      console.log('🎉 Processing subscription created webhook');
      console.log('📊 Subscription details:');
      console.log('   Customer ID:', customerId);
      console.log('   Subscription ID:', subscriptionId);
      console.log('   Price ID:', priceId);
      console.log('   Plan Name:', planName);
      console.log('   Status:', stripeSubscription.status);

      // Validate essential data
      if (!customerId || !subscriptionId || !priceId) {
        throw new CustomError('Missing required subscription data from Stripe webhook', 400);
      }

      // Find subscription by customer ID
      console.log('🔍 Looking for subscription with customer ID:', customerId);
      let subscription = await SubscriptionModel.findByStripeCustomerId(customerId);

      if (!subscription) {
        console.log('⚠️ No subscription found for customer', customerId, ', checking if this is a new customer...');
        // Check if this customer exists in Stripe and get their email
        try {
          const stripeCustomer = await stripe.customers.retrieve(customerId);
          if (stripeCustomer.deleted) {
            throw new CustomError('Customer has been deleted', 404);
          }

          const customerEmail = (stripeCustomer as any).email;
          console.log('📧 Customer email from Stripe:', customerEmail);

          if (customerEmail) {
            // Try to find user by email and create/update subscription record
            const user = await UserModel.findByEmail(customerEmail);
            console.log('👤 Found user by email:', user ? user.id : 'not found');

            if (user) {
              // Check if user has an existing subscription record
              const existingSubscription = await SubscriptionModel.findByUserId(user.id);
              console.log('📋 Existing subscription for user:', existingSubscription ? 'found' : 'not found');

              if (existingSubscription) {
                // Update the existing subscription with the new customer ID
                console.log('🔄 Updating existing subscription with customer ID');
                await SubscriptionModel.update(user.id, {
                  stripe_customer_id: customerId
                });
                subscription = await SubscriptionModel.findByUserId(user.id);
              } else {
                // Create new subscription record
                console.log('➕ Creating new subscription record');
                await SubscriptionModel.create({
                  user_id: user.id,
                  stripe_customer_id: customerId,
                  status: 'INACTIVE',
                });
                subscription = await SubscriptionModel.findByUserId(user.id);
              }
            }
          }
        } catch (stripeError: any) {
          console.error('Error retrieving customer from Stripe:', stripeError.message);
        }

        if (!subscription) {
          console.log('❌ Could not find or create subscription record for customer', customerId);
          throw new CustomError('Subscription record not found and could not be created', 404);
        }
      }

      // Update subscription with Stripe data
      console.log('🔄 Updating subscription with Stripe data...');
      const creditsTotal = getPlanCredits(planName);
      
      await SubscriptionModel.update(subscription.user_id, {
        stripe_subscription_id: subscriptionId,
        status: 'ACTIVE',
        plan_name: planName,
        price_id: priceId,
        current_period_start: stripeSubscription.current_period_start 
          ? new Date(stripeSubscription.current_period_start * 1000).toISOString() 
          : undefined,
        current_period_end: stripeSubscription.current_period_end 
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString() 
          : undefined,
        credits_total: creditsTotal,
        credits_used: 0,
        credits_reset_at: stripeSubscription.current_period_end 
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString() 
          : undefined,
      });
      console.log('✅ Subscription updated successfully');

      console.log(`✅ Subscription activated for user ${subscription.user_id}`);
    } catch (error: any) {
      console.error('Failed to handle subscription creation:', error);
      throw error;
    }
  }

  // Handle subscription update (plan change, status change, or cycle renewal)
  static async handleSubscriptionUpdated(stripeSubscription: any): Promise<void> {
    try {
      const subscriptionId = stripeSubscription.id;
      const priceId = stripeSubscription.items.data[0].price.id;
      const planName = getPlanFromPriceId(priceId);

      const nextPeriodStart = stripeSubscription.current_period_start * 1000;

      // Map Stripe status to our status
      const statusMap: Record<string, string> = {
        'active': 'ACTIVE',
        'past_due': 'PAST_DUE',
        'canceled': 'CANCELED',
        'unpaid': 'UNPAID',
        'incomplete': 'INACTIVE',
        'incomplete_expired': 'INACTIVE',
        'trialing': 'ACTIVE',
      };

      const status = statusMap[stripeSubscription.status] || 'INACTIVE';

      // Credits logic
      const allocation = getPlanCredits(planName); // null => unlimited
      const existing = await SubscriptionModel.findByStripeSubscriptionId(subscriptionId);
      const prevPeriodStart = existing?.current_period_start ? new Date(existing.current_period_start).getTime() : undefined;
      const isNewCycle = prevPeriodStart !== undefined && prevPeriodStart !== nextPeriodStart;

      const update: any = {
        status: status as any,
        plan_name: planName,
        price_id: priceId,
        current_period_start: nextPeriodStart ? new Date(nextPeriodStart).toISOString() : undefined,
        current_period_end: stripeSubscription.current_period_end 
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString() 
          : undefined,
        credits_total: allocation,
      };

      // Reset credits on new billing cycle or plan change
      if (isNewCycle || !existing || existing.plan_name !== planName) {
        update.credits_used = 0; // reset on renewal or plan change
        update.credits_reset_at = stripeSubscription.current_period_end 
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString() 
          : undefined;
        console.log(`🔄 Credits reset: Plan=${planName}, Credits=${allocation}, IsNewCycle=${isNewCycle}, PlanChanged=${existing?.plan_name !== planName}`);
      }

      await SubscriptionModel.updateByStripeId(subscriptionId, update);

      console.log(`✅ Subscription updated: ${subscriptionId} -> ${status}`);
    } catch (error: any) {
      console.error('Failed to handle subscription update:', error);
      throw error;
    }
  }

  // Change subscription plan (upgrade/downgrade)
  static async switchPlan(userId: string, newPriceId: string): Promise<void> {
    try {
      const subscription = await SubscriptionModel.findByUserId(userId);
      if (!subscription) {
        throw new CustomError('No subscription found for this user. Please create a subscription first.', 404);
      }

      if (!subscription.stripe_subscription_id) {
        // Try to sync subscription from Stripe if stripe_subscription_id is missing
        console.log(`🔍 Attempting to sync subscription for user ${userId} with customer ${subscription.stripe_customer_id}`);
        await this.syncSubscriptionFromStripe(subscription.stripe_customer_id, userId);
        
        // Refetch the subscription after sync attempt
        const updatedSubscription = await SubscriptionModel.findByUserId(userId);
        if (!updatedSubscription?.stripe_subscription_id) {
          throw new CustomError(
            `No active Stripe subscription found. Sync attempt failed. ` +
            `Customer ID: ${subscription.stripe_customer_id}. ` +
            `Please contact support or try creating a new subscription.`,
            404
          );
        }
        
        // Use the updated subscription for the rest of the method
        Object.assign(subscription, updatedSubscription);
      }

      // Retrieve Stripe subscription to get item ID and verify it exists
      let stripeSub;
      try {
        stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id!);
      } catch (stripeError: any) {
        if (stripeError.code === 'resource_missing') {
          throw new CustomError('Subscription not found in Stripe. It may have been canceled or deleted.', 404);
        }
        throw stripeError;
      }

      const itemId = (stripeSub.items.data[0] && stripeSub.items.data[0].id) as string;
      if (!itemId) {
        throw new CustomError('Subscription items not found', 500);
      }

      await stripe.subscriptions.update(subscription.stripe_subscription_id!, {
        cancel_at_period_end: false,
        proration_behavior: 'create_prorations',
        items: [
          {
            id: itemId,
            price: newPriceId,
            quantity: 1,
          },
        ],
      });

      console.log(`✅ Plan switched for user ${userId} to price ${newPriceId}`);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(`Failed to switch plan: ${error.message}`, 500);
    }
  }

  // Handle subscription deletion
  static async handleSubscriptionDeleted(stripeSubscription: any): Promise<void> {
    try {
      const subscriptionId = stripeSubscription.id;

      await SubscriptionModel.updateByStripeId(subscriptionId, {
        status: 'CANCELED',
        current_period_end: new Date().toISOString(),
      });

      console.log(`✅ Subscription canceled: ${subscriptionId}`);
    } catch (error: any) {
      console.error('Failed to handle subscription deletion:', error);
      throw error;
    }
  }

  // Get all available products and prices
  static async getProducts(): Promise<any[]> {
    try {
      const products = await stripe.products.list({
        active: true,
        expand: ['data.default_price'],
      });

      const prices = await stripe.prices.list({
        active: true,
        expand: ['data.product'],
      });

      // Filter out test products created by Stripe CLI
      const realProducts = products.data.filter((product) => {
        // Filter out products with generic names or CLI-generated descriptions
        const isTestProduct =
          product.name === 'myproduct' ||
          product.description?.includes('(created by Stripe CLI)') ||
          product.name?.toLowerCase().includes('test');

        return !isTestProduct;
      });

      // Group prices by product (handle both string and expanded object for price.product)
      const productsWithPrices = realProducts.map((product) => {
        const productPrices = prices.data.filter((price: any) => {
          const p = price.product as any;
          const priceProductId = typeof p === 'string' ? p : p?.id;
          return priceProductId === product.id;
        });
        return {
          id: product.id,
          name: product.name,
          description: product.description || undefined,
          prices: productPrices,
        };
      });

      return productsWithPrices;
    } catch (error: any) {
      throw new CustomError(`Failed to fetch products: ${error.message}`, 500);
    }
  }

  // Cancel subscription at period end
  static async cancelSubscription(userId: string): Promise<void> {
    try {
      const subscription = await SubscriptionModel.findByUserId(userId);
      if (!subscription) {
        throw new CustomError('No subscription found for this user. Please create a subscription first.', 404);
      }

      if (!subscription.stripe_subscription_id) {
        // Try to sync subscription from Stripe if stripe_subscription_id is missing
        console.log(`🔍 Attempting to sync subscription for user ${userId} with customer ${subscription.stripe_customer_id}`);
        await this.syncSubscriptionFromStripe(subscription.stripe_customer_id, userId);
        
        // Refetch the subscription after sync attempt
        const updatedSubscription = await SubscriptionModel.findByUserId(userId);
        if (!updatedSubscription?.stripe_subscription_id) {
          throw new CustomError(
            `No active Stripe subscription found. Sync attempt failed. ` +
            `Customer ID: ${subscription.stripe_customer_id}. ` +
            `Please contact support or try creating a new subscription.`,
            404
          );
        }
        
        // Use the updated subscription for the rest of the method
        Object.assign(subscription, updatedSubscription);
      }

      // Verify the subscription exists in Stripe before trying to cancel
      try {
        await stripe.subscriptions.retrieve(subscription.stripe_subscription_id!);
      } catch (stripeError: any) {
        if (stripeError.code === 'resource_missing') {
          throw new CustomError('Subscription not found in Stripe. It may have already been canceled or deleted.', 404);
        }
        throw stripeError;
      }

      await stripe.subscriptions.update(subscription.stripe_subscription_id!, {
        cancel_at_period_end: true,
      });

      console.log(`✅ Subscription marked for cancellation: ${subscription.stripe_subscription_id}`);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(`Failed to cancel subscription: ${error.message}`, 500);
    }
  }

  // Reactivate subscription
  static async reactivateSubscription(userId: string): Promise<void> {
    try {
      const subscription = await SubscriptionModel.findByUserId(userId);
      if (!subscription) {
        throw new CustomError('No subscription found for this user. Please create a subscription first.', 404);
      }

      if (!subscription.stripe_subscription_id) {
        // Try to sync subscription from Stripe if stripe_subscription_id is missing
        console.log(`🔍 Attempting to sync subscription for user ${userId} with customer ${subscription.stripe_customer_id}`);
        await this.syncSubscriptionFromStripe(subscription.stripe_customer_id, userId);
        
        // Refetch the subscription after sync attempt
        const updatedSubscription = await SubscriptionModel.findByUserId(userId);
        if (!updatedSubscription?.stripe_subscription_id) {
          throw new CustomError(
            `No active Stripe subscription found. Sync attempt failed. ` +
            `Customer ID: ${subscription.stripe_customer_id}. ` +
            `Please contact support or try creating a new subscription.`,
            404
          );
        }
        
        // Use the updated subscription for the rest of the method
        Object.assign(subscription, updatedSubscription);
      }

      // Verify the subscription exists in Stripe before trying to reactivate
      try {
        await stripe.subscriptions.retrieve(subscription.stripe_subscription_id!);
      } catch (stripeError: any) {
        if (stripeError.code === 'resource_missing') {
          throw new CustomError('Subscription not found in Stripe. It may have already been canceled or deleted.', 404);
        }
        throw stripeError;
      }

      await stripe.subscriptions.update(subscription.stripe_subscription_id!, {
        cancel_at_period_end: false,
      });

      console.log(`✅ Subscription reactivated: ${subscription.stripe_subscription_id}`);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(`Failed to reactivate subscription: ${error.message}`, 500);
    }
  }

  // Invoice events
  static async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    try {
      const subscriptionId = invoice.subscription as string;
      if (subscriptionId) {
        await SubscriptionModel.updateByStripeId(subscriptionId, { status: 'ACTIVE' as any });
      }
    } catch (error: any) {
      console.error('Failed to handle invoice payment succeeded:', error);
      throw error;
    }
  }

  static async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    try {
      const subscriptionId = invoice.subscription as string;
      if (subscriptionId) {
        await SubscriptionModel.updateByStripeId(subscriptionId, { status: 'PAST_DUE' as any });
      }
    } catch (error: any) {
      console.error('Failed to handle invoice payment failed:', error);
      throw error;
    }
  }

  // Sync subscription data from Stripe when local record is missing stripe_subscription_id
  static async syncSubscriptionFromStripe(customerId: string, userId: string): Promise<void> {
    try {
      console.log(`🔍 Syncing subscription from Stripe for customer: ${customerId}`);
      
      // Retrieve all subscriptions for this customer from Stripe
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10,
      });
      
      console.log(`📊 Found ${stripeSubscriptions.data.length} subscriptions in Stripe`);
      
      // Find the most recent active or past_due subscription
      const activeSubscription = stripeSubscriptions.data.find(sub => 
        sub.status === 'active' || sub.status === 'past_due' || sub.status === 'trialing'
      );
      
      if (activeSubscription) {
        console.log(`✅ Found active subscription in Stripe: ${activeSubscription.id}`);
        
        // Update our database with the Stripe subscription details
        const priceId = activeSubscription.items.data[0]?.price?.id;
        const planName = getPlanFromPriceId(priceId);
        
        // Map Stripe status to our status
        const statusMap: Record<string, string> = {
          'active': 'ACTIVE',
          'past_due': 'PAST_DUE',
          'canceled': 'CANCELED',
          'unpaid': 'UNPAID',
          'incomplete': 'INACTIVE',
          'incomplete_expired': 'INACTIVE',
          'trialing': 'ACTIVE',
        };
        
        const status = statusMap[activeSubscription.status] || 'INACTIVE';
        const creditsTotal = getPlanCredits(planName);
        
        await SubscriptionModel.update(userId, {
          stripe_subscription_id: activeSubscription.id,
          status: status as any,
          plan_name: planName,
          price_id: priceId,
          current_period_start: activeSubscription.current_period_start 
            ? new Date(activeSubscription.current_period_start * 1000).toISOString() 
            : undefined,
          current_period_end: activeSubscription.current_period_end 
            ? new Date(activeSubscription.current_period_end * 1000).toISOString() 
            : undefined,
          credits_total: creditsTotal,
        });
        
        console.log(`🔄 Successfully synced subscription ${activeSubscription.id} to database`);
      } else {
        console.log(`⚠️ No active subscriptions found in Stripe for customer ${customerId}`);
        
        // Check if there are any subscriptions at all
        if (stripeSubscriptions.data.length > 0) {
          const latestSub = stripeSubscriptions.data[0]; // Most recent subscription
          console.log(`📋 Latest subscription status: ${latestSub.status} (${latestSub.id})`);
          
          // If the latest subscription is canceled, update our record to reflect this
          if (latestSub.status === 'canceled') {
            await SubscriptionModel.update(userId, {
              stripe_subscription_id: latestSub.id,
              status: 'CANCELED',
            });
            console.log(`🚫 Updated subscription to CANCELED status`);
          }
        }
      }
    } catch (error: any) {
      console.error(`❌ Failed to sync subscription from Stripe:`, error.message);
      // Don't throw error here - let the calling method handle the missing subscription
    }
  }

}