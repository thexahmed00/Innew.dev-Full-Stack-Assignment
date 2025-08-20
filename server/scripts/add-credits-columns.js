#!/usr/bin/env node

/**
 * Script to add credits columns to subscriptions table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addCreditsColumns() {
  console.log('🔧 Adding credits columns to subscriptions table...\n');
  
  try {
    // Add credits_total column
    console.log('Adding credits_total column...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS credits_total INTEGER;'
    });
    
    if (error1) {
      console.log('Note: credits_total column may already exist or exec_sql not available');
    } else {
      console.log('✅ credits_total column added');
    }

    // Add credits_used column
    console.log('Adding credits_used column...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;'
    });
    
    if (error2) {
      console.log('Note: credits_used column may already exist or exec_sql not available');
    } else {
      console.log('✅ credits_used column added');
    }

    // Add credits_reset_at column
    console.log('Adding credits_reset_at column...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ;'
    });
    
    if (error3) {
      console.log('Note: credits_reset_at column may already exist or exec_sql not available');
    } else {
      console.log('✅ credits_reset_at column added');
    }

    // Try direct approach if exec_sql doesn't work
    console.log('\n🔍 Checking current table structure...');
    const { data: columns, error: descError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (descError) {
      console.error('❌ Error checking table structure:', descError);
    } else {
      console.log('✅ Table accessible, columns should be available');
      if (columns && columns.length > 0) {
        console.log('📊 Sample record keys:', Object.keys(columns[0]));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Main execution
addCreditsColumns().catch(console.error);
