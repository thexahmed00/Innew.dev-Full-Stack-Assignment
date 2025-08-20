#!/usr/bin/env node

/**
 * Script to check and clean up subscription data
 * This helps debug issues with invalid Stripe subscription IDs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSubscriptions() {
  console.log('🔍 Checking subscriptions in database...\n');
  
  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching subscriptions:', error);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('✅ No subscriptions found in database');
      return;
    }

    console.log(`📊 Found ${subscriptions.length} subscription(s):\n`);

    subscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. Subscription ID: ${sub.id}`);
      console.log(`   User ID: ${sub.user_id}`);
      console.log(`   Stripe Customer ID: ${sub.stripe_customer_id}`);
      console.log(`   Stripe Subscription ID: ${sub.stripe_subscription_id}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Plan: ${sub.plan_name || 'N/A'}`);
      console.log(`   Price ID: ${sub.price_id || 'N/A'}`);
      console.log(`   Credits: ${sub.credits_total || 'N/A'} total, ${sub.credits_used || 0} used`);
      console.log(`   Created: ${sub.created_at}`);
      console.log('');
    });

    // Check for problematic subscription IDs
    const problematicSubs = subscriptions.filter(sub => 
      sub.stripe_subscription_id && 
      (sub.stripe_subscription_id.includes('test') || 
       sub.stripe_subscription_id.includes('placeholder') ||
       !sub.stripe_subscription_id.startsWith('sub_'))
    );

    if (problematicSubs.length > 0) {
      console.log('⚠️  Found potentially problematic subscription IDs:');
      problematicSubs.forEach(sub => {
        console.log(`   - ${sub.stripe_subscription_id} (User: ${sub.user_id})`);
      });
      console.log('\n💡 These should be real Stripe subscription IDs starting with "sub_"');
      console.log('   Consider cleaning them up or ensuring webhooks are properly configured.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test subscription data...\n');
  
  try {
    // Remove subscriptions with test/placeholder IDs
    const { data, error } = await supabase
      .from('subscriptions')
      .delete()
      .or('stripe_subscription_id.like.*test*,stripe_subscription_id.like.*placeholder*')
      .select();

    if (error) {
      console.error('❌ Error cleaning up:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log(`✅ Cleaned up ${data.length} test subscription(s)`);
      data.forEach(sub => {
        console.log(`   - Removed: ${sub.stripe_subscription_id} (User: ${sub.user_id})`);
      });
    } else {
      console.log('✅ No test subscriptions found to clean up');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  if (command === 'cleanup') {
    await cleanupTestData();
    console.log('\n📊 After cleanup:');
    await checkSubscriptions();
  } else {
    await checkSubscriptions();
    console.log('💡 To clean up test data, run: node scripts/check-subscriptions.js cleanup');
  }
}

main().catch(console.error);
