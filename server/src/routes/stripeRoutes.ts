import express from 'express';
import { stripe } from '../config/stripe';
import { StripeService } from '../services/stripeService';
import { authenticateUser } from '../middleware/auth';
import { SubscriptionModel } from '../models/Subscription';
import { WebhookEventModel } from '../models/WebhookEvent';
import { AuthenticatedRequest } from '../types';
import { CustomError } from '../utils/errorHandler';

const router = express.Router();

// Exported webhook handler to be mounted before JSON body parser in app.ts
export const webhookHandler = (async (req: express.Request, res: express.Response) => {
  const sig = req.headers['stripe-signature'] as string | undefined;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Handle the event
  try {
    console.log(`🎯 Processing webhook: ${event.type} [${event.id}]`);

    // Check if we've already processed this event
    const existingEvent = await WebhookEventModel.existsByStripeEventId(event.id);
    if (existingEvent) {
      console.log(`⚡ Webhook event ${event.id} already processed, skipping...`);
      return res.json({ received: true, message: 'Event already processed' });
    }

    // Store the webhook event in database
    console.log(`💾 Storing webhook event: ${event.type} [${event.id}]`);
    await WebhookEventModel.create({
      stripe_event_id: event.id,
      event_type: event.type,
      data: event,
    });

    // Process the event
    let processed = false;
    switch (event.type) {
      case 'customer.subscription.created':
        console.log('📝 Handling subscription created...');
        await StripeService.handleSubscriptionCreated(event.data.object);
        processed = true;
        break;
      case 'customer.subscription.updated':
        console.log('📝 Handling subscription updated...');
        await StripeService.handleSubscriptionUpdated(event.data.object);
        processed = true;
        break;
      case 'customer.subscription.deleted':
        console.log('📝 Handling subscription deleted...');
        await StripeService.handleSubscriptionDeleted(event.data.object);
        processed = true;
        break;
      case 'invoice.payment_succeeded':
        console.log('📝 Handling invoice payment succeeded...')
        await StripeService.handleInvoicePaymentSucceeded(event.data.object);
        processed = true;
        break;

      case 'invoice.payment_failed':
        console.log('📝 Handling invoice payment failed...');
        await StripeService.handleInvoicePaymentFailed(event.data.object);
        processed = true;
        break;
      case 'invoice.created':
        console.log('📝 Handling invoice created...')
        // await StripeService.handleInvoiceCreated(event.data.object);
        processed = true;
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
        processed = false; // Mark as unprocessed for unhandled events
    }

    // Mark event as processed if it was handled
    if (processed) {
      await WebhookEventModel.markAsProcessed(event.id);
      console.log(`✅ Successfully processed webhook: ${event.type} [${event.id}]`);
    } else {
      console.log(`⚡ Webhook stored but not processed: ${event.type} [${event.id}]`);
    }

    return res.json({ received: true, processed });
  } catch (error: any) {
    console.error(`❌ Webhook handler error for ${event.type} [${event.id}]:`, error);
    console.error('Error stack:', error.stack);

    // Try to mark the event as having an error (but don't fail if this fails)
    try {
      // We could add an error field to the webhook_events table in the future
      console.log(`⚠️ Could not mark webhook event as failed - consider adding error tracking`);
    } catch (markError) {
      console.error('Failed to mark webhook event as errored:', markError);
    }

    return res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Create checkout session
router.post('/create-checkout-session', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const { price_id, success_url, cancel_url } = req.body;
    const userId = req.user!.id;

    if (!price_id || !success_url || !cancel_url) {
      throw new CustomError('Missing required fields: price_id, success_url, cancel_url', 400);
    }

    const checkoutUrl = await StripeService.createCheckoutSession(
      userId,
      price_id,
      success_url,
      cancel_url
    );

    res.json({
      success: true,
      data: { checkout_url: checkoutUrl }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Create portal session
router.post('/create-portal-session', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const { return_url } = req.body;
    const userId = req.user!.id;

    if (!return_url) {
      throw new CustomError('Missing required field: return_url', 400);
    }

    const portalUrl = await StripeService.createPortalSession(userId, return_url);

    res.json({
      success: true,
      data: { portal_url: portalUrl }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Get available products and prices
router.get('/products', (async (req, res) => {
  try {
    const products = await StripeService.getProducts();

    res.json({
      success: true,
      data: products
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Cancel subscription
router.post('/cancel-subscription', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    await StripeService.cancelSubscription(userId);

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current period'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Cancel subscription immediately (for testing)
router.post('/cancel-subscription-immediately', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    await StripeService.cancelSubscriptionImmediately(userId);

    res.json({
      success: true,
      message: 'Subscription canceled immediately'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Reactivate subscription
router.post('/reactivate-subscription', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    await StripeService.reactivateSubscription(userId);

    res.json({
      success: true,
      message: 'Subscription reactivated successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Switch plan (upgrade/downgrade)
router.post('/switch-plan', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const { price_id } = req.body;
    const userId = req.user!.id;

    if (!price_id) {
      throw new CustomError('Missing required field: price_id', 400);
    }

    await StripeService.switchPlan(userId, price_id);

    res.json({
      success: true,
      message: 'Plan switch initiated successfully'
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Handle checkout completion and ensure subscription sync
router.get('/checkout-completion/:sessionId', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    if (!sessionId) {
      throw new CustomError('Missing session ID', 400);
    }

    console.log(`🔍 Handling checkout completion for session: ${sessionId}`);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    });

    if (!session) {
      throw new CustomError('Checkout session not found', 404);
    }

    console.log(`📊 Checkout session details:`, {
      id: session.id,
      status: session.payment_status,
      subscription_id: session.subscription,
      customer_id: session.customer
    });

    // If payment was successful and there's a subscription
    if (session.payment_status === 'paid' && session.subscription) {
      const subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription.id;

      // Ensure our local subscription record is up to date
      const subscription = await SubscriptionModel.findByUserId(userId);
      if (subscription && !subscription.stripe_subscription_id) {
        console.log(`🔄 Updating subscription record with Stripe subscription ID: ${subscriptionId}`);
        await SubscriptionModel.update(userId, {
          stripe_subscription_id: subscriptionId,
          status: 'ACTIVE'
        });
      }

      // If no subscription record exists, create one
      if (!subscription && session.customer) {
        const customerId = typeof session.customer === 'string' 
          ? session.customer 
          : session.customer.id;
        
        console.log(`➕ Creating subscription record for user ${userId}`);
        await SubscriptionModel.create({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'ACTIVE'
        });
      }
    }

    res.json({
      success: true,
      data: {
        session_id: session.id,
        payment_status: session.payment_status,
        subscription_id: session.subscription
      }
    });
  } catch (error: any) {
    console.error('Error handling checkout completion:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Testing and Debug Endpoints

// Get all subscriptions for debugging
router.get('/debug/subscriptions', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const subscriptions = await SubscriptionModel.findAllSubscriptions();
    
    res.json({
      success: true,
      data: subscriptions,
      count: subscriptions.length
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Reset/delete current user's subscription for testing
router.delete('/debug/reset-subscription', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Get current subscription
    const subscription = await SubscriptionModel.findByUserId(userId);
    if (!subscription) {
      return res.json({
        success: true,
        message: 'No subscription found to reset'
      });
    }

    console.log(`🧹 Resetting subscription for user ${userId}`);

    // If there's a Stripe subscription, cancel it
    if (subscription.stripe_subscription_id) {
      try {
        console.log(`❌ Canceling Stripe subscription: ${subscription.stripe_subscription_id}`);
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      } catch (stripeError: any) {
        console.warn(`⚠️ Could not cancel Stripe subscription: ${stripeError.message}`);
      }
    }

    // Delete from our database
    await SubscriptionModel.delete(userId);
    
    return res.json({
      success: true,
      message: 'Subscription reset successfully',
      data: {
        deleted_subscription_id: subscription.id,
        deleted_stripe_subscription_id: subscription.stripe_subscription_id
      }
    });
  } catch (error: any) {
    console.error('Error resetting subscription:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Clear all webhook events for clean testing
router.delete('/debug/clear-webhook-events', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    // Get count before deletion
    const stats = await WebhookEventModel.getStats();
    
    // Delete all webhook events (this requires direct Supabase query as we don't have a deleteAll method)
    const { supabase } = await import('../config/supabase');
    const { error } = await supabase
      .from('webhook_events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (error) {
      throw new Error(`Failed to clear webhook events: ${error.message}`);
    }
    
    res.json({
      success: true,
      message: 'All webhook events cleared',
      data: {
        deleted_count: stats.total
      }
    });
  } catch (error: any) {
    console.error('Error clearing webhook events:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Get current user's detailed subscription info
router.get('/debug/my-subscription', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Get subscription from database
    const subscription = await SubscriptionModel.findByUserId(userId);
    
    if (!subscription) {
      return res.json({
        success: true,
        message: 'No subscription found',
        data: null
      });
    }

    // If there's a Stripe subscription ID, get details from Stripe
    let stripeSubscription = null;
    if (subscription.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      } catch (stripeError: any) {
        console.warn(`Could not retrieve Stripe subscription: ${stripeError.message}`);
      }
    }

    return res.json({
      success: true,
      data: {
        database_subscription: subscription,
        stripe_subscription: stripeSubscription,
        sync_status: {
          has_stripe_id: !!subscription.stripe_subscription_id,
          stripe_exists: !!stripeSubscription,
          in_sync: subscription.status === (stripeSubscription?.status?.toUpperCase() || 'UNKNOWN')
        }
      }
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Force sync subscription from Stripe
router.post('/debug/sync-subscription', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const subscription = await SubscriptionModel.findByUserId(userId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No subscription found to sync'
      });
    }

    console.log(`🔄 Force syncing subscription for user ${userId}`);
    
    // Use the sync method we created earlier
    await StripeService.syncSubscriptionFromStripe(subscription.stripe_customer_id, userId);
    
    // Get updated subscription
    const updatedSubscription = await SubscriptionModel.findByUserId(userId);
    
    return res.json({
      success: true,
      message: 'Subscription sync completed',
      data: {
        before: subscription,
        after: updatedSubscription
      }
    });
  } catch (error: any) {
    console.error('Error syncing subscription:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Debug endpoint to simulate webhook processing
router.post('/debug/simulate-webhook', async (_req, res) => {
  try {
    // Get the current user's subscription using the model
    const subscriptions = await SubscriptionModel.findAllSubscriptions();

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscription found to test with' });
    }

    const subscription = subscriptions[0];
    const customerId = subscription.stripe_customer_id;

    // Simulate a subscription created event
    const mockStripeSubscription = {
      id: 'sub_test_' + Date.now(),
      customer: customerId,
      status: 'active',
      items: {
        data: [{
          price: {
            id: 'price_1Rxm4KIm8M4myDvdwIuZQ790' // Pro Monthly
          }
        }]
      },
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    };

    console.log('🧪 Simulating subscription created webhook...');
    await StripeService.handleSubscriptionCreated(mockStripeSubscription);

    return res.json({
      success: true,
      message: 'Webhook simulation completed',
      subscription_id: mockStripeSubscription.id
    });
  } catch (error: any) {
    console.error('Debug webhook simulation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get webhook events for debugging
router.get('/webhook-events', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      limit = '50', 
      event_type,
      processed 
    } = req.query;

    let events;
    if (event_type && typeof event_type === 'string') {
      events = await WebhookEventModel.findByEventType(event_type, parseInt(limit as string));
    } else if (processed === 'false') {
      events = await WebhookEventModel.findUnprocessed(parseInt(limit as string));
    } else {
      events = await WebhookEventModel.findRecent(parseInt(limit as string));
    }

    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Get webhook event statistics
router.get('/webhook-stats', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await WebhookEventModel.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Get specific webhook event by Stripe event ID
router.get('/webhook-events/:stripeEventId', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const { stripeEventId } = req.params;
    
    if (!stripeEventId) {
      throw new CustomError('Missing Stripe event ID', 400);
    }

    const event = await WebhookEventModel.findByStripeEventId(stripeEventId);
    
    if (!event) {
      throw new CustomError('Webhook event not found', 404);
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

// Reprocess failed webhook events
router.post('/webhook-events/:stripeEventId/reprocess', authenticateUser, (async (req: AuthenticatedRequest, res) => {
  try {
    const { stripeEventId } = req.params;
    
    if (!stripeEventId) {
      throw new CustomError('Missing Stripe event ID', 400);
    }

    const webhookEvent = await WebhookEventModel.findByStripeEventId(stripeEventId);
    
    if (!webhookEvent) {
      throw new CustomError('Webhook event not found', 404);
    }

    if (webhookEvent.processed) {
      throw new CustomError('Webhook event already processed', 400);
    }

    console.log(`🔄 Reprocessing webhook event: ${webhookEvent.event_type} [${stripeEventId}]`);

    // Extract the original event data
    const event = webhookEvent.data;
    let processed = false;

    // Reprocess based on event type
    switch (event.type) {
      case 'customer.subscription.created':
        console.log('📝 Reprocessing subscription created...');
        await StripeService.handleSubscriptionCreated(event.data.object);
        processed = true;
        break;
      case 'customer.subscription.updated':
        console.log('📝 Reprocessing subscription updated...');
        await StripeService.handleSubscriptionUpdated(event.data.object);
        processed = true;
        break;
      case 'customer.subscription.deleted':
        console.log('📝 Reprocessing subscription deleted...');
        await StripeService.handleSubscriptionDeleted(event.data.object);
        processed = true;
        break;
      case 'invoice.payment_succeeded':
        console.log('📝 Reprocessing invoice payment succeeded...');
        await StripeService.handleInvoicePaymentSucceeded(event.data.object);
        processed = true;
        break;
      case 'invoice.payment_failed':
        console.log('📝 Reprocessing invoice payment failed...');
        await StripeService.handleInvoicePaymentFailed(event.data.object);
        processed = true;
        break;
      default:
        throw new CustomError(`Cannot reprocess unhandled event type: ${event.type}`, 400);
    }

    if (processed) {
      await WebhookEventModel.markAsProcessed(stripeEventId);
      console.log(`✅ Successfully reprocessed webhook: ${event.type} [${stripeEventId}]`);
    }

    res.json({
      success: true,
      message: 'Webhook event reprocessed successfully',
      data: {
        stripe_event_id: stripeEventId,
        event_type: event.type,
        processed: processed
      }
    });
  } catch (error: any) {
    console.error(`❌ Webhook reprocessing error for ${req.params.stripeEventId}:`, error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
}));

export default router;