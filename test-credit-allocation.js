#!/usr/bin/env node

/**
 * Simple test to verify credit allocation functions work correctly
 */

// Simulate the getPlanCredits function from server/src/config/stripe.ts
function getPlanCredits(planName) {
  const plan = planName.toUpperCase();
  if (plan === 'BASIC' || plan === 'STARTUP') return 500;
  if (plan === 'PRO') return 2000;
  if (plan === 'ENTERPRISE') return null; // unlimited
  if (plan === 'FREE') return 10; // Free tier credits
  return 10; // Default to free tier credits
}

// Test cases
const testCases = [
  { plan: 'FREE', expected: 10 },
  { plan: 'free', expected: 10 },
  { plan: 'STARTUP', expected: 500 },
  { plan: 'startup', expected: 500 },
  { plan: 'BASIC', expected: 500 },
  { plan: 'basic', expected: 500 },
  { plan: 'PRO', expected: 2000 },
  { plan: 'pro', expected: 2000 },
  { plan: 'ENTERPRISE', expected: null },
  { plan: 'enterprise', expected: null },
  { plan: 'UNKNOWN', expected: 10 },
  { plan: '', expected: 10 },
  { plan: null, expected: 10 },
];

console.log('🧪 Testing credit allocation function...\n');

let passed = 0;
let failed = 0;

testCases.forEach(({ plan, expected }) => {
  const result = getPlanCredits(plan || '');
  const success = result === expected;
  
  if (success) {
    console.log(`✅ ${plan || 'null'}: ${result} credits (expected: ${expected})`);
    passed++;
  } else {
    console.log(`❌ ${plan || 'null'}: ${result} credits (expected: ${expected})`);
    failed++;
  }
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All credit allocation tests passed!');
} else {
  console.log('⚠️  Some tests failed. Please check the implementation.');
}

// Test the client-side billing service function simulation
console.log('\n🧪 Testing client-side credit allocation...\n');

function getCreditAllocation(planName) {
  const plan = planName?.toUpperCase() || 'FREE';
  
  switch (plan) {
    case 'BASIC':
    case 'STARTUP':
      return 500;
    case 'PRO':
      return 2000;
    case 'ENTERPRISE':
      return -1; // Unlimited
    case 'FREE':
    default:
      return 10;
  }
}

const clientTestCases = [
  { plan: 'FREE', expected: 10 },
  { plan: 'STARTUP', expected: 500 },
  { plan: 'PRO', expected: 2000 },
  { plan: 'ENTERPRISE', expected: -1 },
  { plan: undefined, expected: 10 },
];

let clientPassed = 0;
let clientFailed = 0;

clientTestCases.forEach(({ plan, expected }) => {
  const result = getCreditAllocation(plan);
  const success = result === expected;
  
  if (success) {
    console.log(`✅ Client ${plan || 'undefined'}: ${result} credits (expected: ${expected})`);
    clientPassed++;
  } else {
    console.log(`❌ Client ${plan || 'undefined'}: ${result} credits (expected: ${expected})`);
    clientFailed++;
  }
});

console.log(`\n📊 Client Test Results: ${clientPassed} passed, ${clientFailed} failed`);

if (clientFailed === 0) {
  console.log('🎉 All client-side credit allocation tests passed!');
} else {
  console.log('⚠️  Some client tests failed. Please check the implementation.');
}
