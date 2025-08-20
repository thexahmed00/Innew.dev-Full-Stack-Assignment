-- Add credits columns to subscriptions table
-- Run this in your Supabase SQL editor

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS credits_total INTEGER,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ;
