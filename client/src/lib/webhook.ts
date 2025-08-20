import { createSupabaseClient } from './supabase';

export interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

export interface WebhookStats {
  total: number;
  processed: number;
  unprocessed: number;
  by_type: Record<string, number>;
}

class WebhookService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  // Get webhook events for debugging
  async getWebhookEvents(params: {
    limit?: number;
    event_type?: string;
    processed?: boolean;
  } = {}): Promise<WebhookEvent[]> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.event_type) searchParams.set('event_type', params.event_type);
      if (params.processed !== undefined) searchParams.set('processed', params.processed.toString());

      const response = await fetch(`${this.apiBaseUrl}/api/stripe/webhook-events?${searchParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch webhook events');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching webhook events:', error);
      throw error;
    }
  }

  // Get webhook event statistics
  async getWebhookStats(): Promise<WebhookStats> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/stripe/webhook-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch webhook stats');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching webhook stats:', error);
      throw error;
    }
  }

  // Get specific webhook event
  async getWebhookEvent(stripeEventId: string): Promise<WebhookEvent> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/stripe/webhook-events/${stripeEventId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch webhook event');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching webhook event:', error);
      throw error;
    }
  }

  // Reprocess failed webhook event
  async reprocessWebhookEvent(stripeEventId: string): Promise<{
    stripe_event_id: string;
    event_type: string;
    processed: boolean;
  }> {
    try {
      const supabase = createSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(`${this.apiBaseUrl}/api/stripe/webhook-events/${stripeEventId}/reprocess`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reprocess webhook event');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error reprocessing webhook event:', error);
      throw error;
    }
  }

  // Utility methods
  formatEventType(eventType: string): string {
    return eventType
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getEventTypeColor(eventType: string): string {
    if (eventType.includes('subscription')) {
      return 'blue';
    } else if (eventType.includes('invoice')) {
      return 'green';
    } else if (eventType.includes('payment')) {
      return 'purple';
    } else if (eventType.includes('customer')) {
      return 'orange';
    }
    return 'gray';
  }

  formatEventData(data: Record<string, unknown>): string {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }
}

// Export singleton instance
export const webhookService = new WebhookService();