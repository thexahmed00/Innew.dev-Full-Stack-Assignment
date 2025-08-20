import { supabase } from '../config/supabase';
import { CustomError } from '../utils/errorHandler';

export interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  data: any;
  created_at: string;
}

export class WebhookEventModel {
  // Create new webhook event
  static async create(eventData: {
    stripe_event_id: string;
    event_type: string;
    data: any;
  }): Promise<WebhookEvent> {
    const { data, error } = await supabase
      .from('webhook_events')
      .insert([{
        stripe_event_id: eventData.stripe_event_id,
        event_type: eventData.event_type,
        processed: false,
        data: eventData.data,
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new CustomError('Webhook event already exists (duplicate)', 409);
      }
      throw new CustomError(`Failed to create webhook event: ${error.message}`, 500);
    }

    return data;
  }

  // Check if webhook event already exists
  static async existsByStripeEventId(stripeEventId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('stripe_event_id', stripeEventId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new CustomError(`Failed to check webhook event existence: ${error.message}`, 500);
    }

    return !!data;
  }

  // Mark webhook event as processed
  static async markAsProcessed(stripeEventId: string): Promise<void> {
    const { error } = await supabase
      .from('webhook_events')
      .update({ processed: true })
      .eq('stripe_event_id', stripeEventId);

    if (error) {
      throw new CustomError(`Failed to mark webhook event as processed: ${error.message}`, 500);
    }
  }

  // Get webhook event by Stripe event ID
  static async findByStripeEventId(stripeEventId: string): Promise<WebhookEvent | null> {
    const { data, error } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('stripe_event_id', stripeEventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new CustomError(`Failed to fetch webhook event: ${error.message}`, 500);
    }

    return data;
  }

  // Get recent webhook events for debugging
  static async findRecent(limit: number = 50): Promise<WebhookEvent[]> {
    const { data, error } = await supabase
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new CustomError(`Failed to fetch webhook events: ${error.message}`, 500);
    }

    return data || [];
  }

  // Get webhook events by type
  static async findByEventType(eventType: string, limit: number = 20): Promise<WebhookEvent[]> {
    const { data, error } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('event_type', eventType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new CustomError(`Failed to fetch webhook events by type: ${error.message}`, 500);
    }

    return data || [];
  }

  // Get unprocessed webhook events
  static async findUnprocessed(limit: number = 100): Promise<WebhookEvent[]> {
    const { data, error } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new CustomError(`Failed to fetch unprocessed webhook events: ${error.message}`, 500);
    }

    return data || [];
  }

  // Get webhook event statistics
  static async getStats(): Promise<{
    total: number;
    processed: number;
    unprocessed: number;
    by_type: Record<string, number>;
  }> {
    // Get total count
    const { count: total, error: totalError } = await supabase
      .from('webhook_events')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      throw new CustomError(`Failed to get total webhook events count: ${totalError.message}`, 500);
    }

    // Get processed count
    const { count: processed, error: processedError } = await supabase
      .from('webhook_events')
      .select('*', { count: 'exact', head: true })
      .eq('processed', true);

    if (processedError) {
      throw new CustomError(`Failed to get processed webhook events count: ${processedError.message}`, 500);
    }

    // Get events by type
    const { data: eventsByType, error: eventsByTypeError } = await supabase
      .from('webhook_events')
      .select('event_type')
      .order('event_type');

    if (eventsByTypeError) {
      throw new CustomError(`Failed to get webhook events by type: ${eventsByTypeError.message}`, 500);
    }

    const byType: Record<string, number> = {};
    eventsByType?.forEach(event => {
      byType[event.event_type] = (byType[event.event_type] || 0) + 1;
    });

    return {
      total: total || 0,
      processed: processed || 0,
      unprocessed: (total || 0) - (processed || 0),
      by_type: byType,
    };
  }
}