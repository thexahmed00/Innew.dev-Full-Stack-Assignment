#!/usr/bin/env node

/**
 * Test script to verify the credit allocation system and downgrade functionality
 * This script tests:
 * 1. Credit allocation for FREE plan (10 credits)
 * 2. Credit allocation for STARTUP plan (500 credits)
 * 3. Credit updates during plan changes
 * 4. Complete flow from STARTUP -> FREE plan
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

// Test configuration
const TEST_CONFIG = {
  // You'll need to replace this with a valid auth token from your browser
  // You can get this from the browser dev tools -> Application -> Local Storage -> supabase.auth.token
  authToken: 'YOUR_AUTH_TOKEN_HERE',
  
  // Test endpoints
  endpoints: {
    subscription: `${API_BASE}/api/users/subscription`,
    cancelSubscription: `${API_BASE}/api/stripe/cancel-subscription`,
    cancelImmediately: `${API_BASE}/api/stripe/cancel-subscription-immediately`,
  }
};

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { response, data };
}

async function getCurrentSubscription() {
  console.log('📋 Getting current subscription...');
  const { response, data } = await makeRequest(TEST_CONFIG.endpoints.subscription);

  if (response.ok) {
    console.log('✅ Current subscription:', {
      plan: data.plan_name,
      status: data.status,
      credits_total: data.credits_total,
      credits_used: data.credits_used,
      current_period_end: data.current_period_end
    });
    return data;
  } else {
    console.log('❌ Failed to get subscription:', data);
    return null;
  }
}

function validateCreditAllocation(subscription, expectedCredits, planName) {
  console.log(`🔍 Validating credit allocation for ${planName} plan...`);

  if (!subscription) {
    console.log('❌ No subscription data to validate');
    return false;
  }

  const actualCredits = subscription.credits_total;
  if (actualCredits === expectedCredits) {
    console.log(`✅ Credit allocation correct: ${actualCredits} credits for ${planName} plan`);
    return true;
  } else {
    console.log(`❌ Credit allocation incorrect: Expected ${expectedCredits}, got ${actualCredits} for ${planName} plan`);
    return false;
  }
}

async function testCancelSubscription() {
  console.log('\n🧪 Testing subscription cancellation (at period end)...');
  const { response, data } = await makeRequest(TEST_CONFIG.endpoints.cancelSubscription, {
    method: 'POST'
  });
  
  if (response.ok) {
    console.log('✅ Cancellation successful:', data.message);
    return true;
  } else {
    console.log('❌ Cancellation failed:', data);
    return false;
  }
}

async function testImmediateCancellation() {
  console.log('\n🧪 Testing immediate subscription cancellation...');
  const { response, data } = await makeRequest(TEST_CONFIG.endpoints.cancelImmediately, {
    method: 'POST'
  });
  
  if (response.ok) {
    console.log('✅ Immediate cancellation successful:', data.message);
    return true;
  } else {
    console.log('❌ Immediate cancellation failed:', data);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting credit allocation and downgrade tests...\n');

  // Check if auth token is configured
  if (TEST_CONFIG.authToken === 'YOUR_AUTH_TOKEN_HERE') {
    console.log('❌ Please configure your auth token in the script');
    console.log('   You can get it from browser dev tools -> Application -> Local Storage -> supabase.auth.token');
    return;
  }

  try {
    // Step 1: Get current subscription and validate credit allocation
    const initialSubscription = await getCurrentSubscription();
    if (!initialSubscription) {
      console.log('❌ No subscription found to test with');
      return;
    }

    // Step 2: Validate current plan credit allocation
    let expectedCredits;
    switch (initialSubscription.plan_name) {
      case 'FREE':
        expectedCredits = 10;
        break;
      case 'STARTUP':
      case 'BASIC':
        expectedCredits = 500;
        break;
      case 'PRO':
        expectedCredits = 2000;
        break;
      default:
        expectedCredits = 10; // Default to free
    }

    const creditValidation = validateCreditAllocation(
      initialSubscription,
      expectedCredits,
      initialSubscription.plan_name
    );

    if (!creditValidation) {
      console.log('⚠️  Credit allocation validation failed, but continuing with tests...');
    }

    // Step 3: Test downgrade functionality
    if (initialSubscription.plan_name === 'FREE') {
      console.log('\nℹ️  Already on free plan, testing immediate cancellation instead');
      await testImmediateCancellation();
    } else {
      // Test cancellation at period end
      console.log('\n🧪 Testing downgrade from', initialSubscription.plan_name, 'to FREE...');
      const cancelSuccess = await testCancelSubscription();
      if (cancelSuccess) {
        // Check subscription status after cancellation
        console.log('\n📋 Checking subscription after cancellation...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        const updatedSubscription = await getCurrentSubscription();

        // Validate that credits were updated to FREE plan allocation
        if (updatedSubscription) {
          validateCreditAllocation(updatedSubscription, 10, 'FREE');
        }
      }
    }

    console.log('\n✅ Credit allocation and downgrade tests completed!');
    console.log('\n📝 Manual verification steps:');
    console.log('   1. Check the billing page shows correct credit information');
    console.log('   2. Verify sidebar shows proper credit usage (X / Y used)');
    console.log('   3. Confirm plan features show correct credit allocations');
    console.log('   4. Test that credit limits are properly enforced');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
runTests();
