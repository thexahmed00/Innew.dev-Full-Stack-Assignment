#!/usr/bin/env node

const { stripe } = require('../dist/config/stripe');
require('dotenv').config();

const PRODUCTS_CONFIG = [
  {
    name: 'Basic Plan',
    description: 'Perfect for individuals getting started',
    features: ['100 files', '1GB storage', '50 posts', 'Email support'],
    prices: [
      { amount: 999, interval: 'month', nickname: 'Basic Monthly' },
      { amount: 9990, interval: 'year', nickname: 'Basic Yearly (2 months free)' }
    ]
  },
  {
    name: 'Pro Plan',
    description: 'Best for growing businesses and teams',
    features: ['1000 files', '10GB storage', '500 posts', 'Priority support', 'Advanced analytics'],
    prices: [
      { amount: 2999, interval: 'month', nickname: 'Pro Monthly' },
      { amount: 29990, interval: 'year', nickname: 'Pro Yearly (2 months free)' }
    ]
  },
  {
    name: 'Enterprise Plan',
    description: 'Unlimited everything for large organizations',
    features: ['Unlimited files', 'Unlimited storage', 'Unlimited posts', '24/7 phone support', 'Custom integrations', 'SLA guarantee'],
    prices: [
      { amount: 9999, interval: 'month', nickname: 'Enterprise Monthly' },
      { amount: 99990, interval: 'year', nickname: 'Enterprise Yearly (2 months free)' }
    ]
  }
];

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  try {
    const results = [];

    for (const productConfig of PRODUCTS_CONFIG) {
      console.log(`📦 Creating product: ${productConfig.name}`);

      // Create product
      const product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        metadata: {
          features: JSON.stringify(productConfig.features)
        }
      });

      console.log(`✅ Product created: ${product.id}`);

      const productResult = {
        product: product,
        prices: []
      };

      // Create prices for this product
      for (const priceConfig of productConfig.prices) {
        console.log(`  💰 Creating price: ${priceConfig.nickname}`);

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: priceConfig.amount,
          currency: 'usd',
          recurring: {
            interval: priceConfig.interval,
            interval_count: 1
          },
          nickname: priceConfig.nickname,
          metadata: {
            plan_name: productConfig.name.split(' ')[0].toUpperCase(),
            interval: priceConfig.interval
          }
        });

        console.log(`  ✅ Price created: ${price.id} ($${priceConfig.amount / 100}/${priceConfig.interval})`);
        productResult.prices.push(price);
      }

      results.push(productResult);
      console.log('');
    }

    // Generate environment variables
    console.log('📄 Environment variables for your .env file:\n');
    console.log('# Stripe Price IDs (add these to your server .env file)');

    results.forEach(({ product, prices }) => {
      const planName = product.name.split(' ')[0].toUpperCase();
      prices.forEach(price => {
        const interval = price.recurring.interval.toUpperCase();
        const envVar = `STRIPE_PRICE_${planName}_${interval}`;
        console.log(`${envVar}=${price.id}`);
      });
    });

    console.log('\n🎉 Stripe products setup completed!');
    console.log('\nNext steps:');
    console.log('1. Copy the price IDs to your server .env file');
    console.log('2. Update your Stripe webhook endpoint URL in the Stripe dashboard');
    console.log('3. Add the webhook signing secret to STRIPE_WEBHOOK_SECRET in your .env file');
    console.log('4. Test the billing flow in your application');

    return results;
  } catch (error) {
    console.error('❌ Failed to setup Stripe products:', error.message);
    
    if (error.type === 'StripePermissionError') {
      console.error('\nMake sure your Stripe secret key has the necessary permissions.');
    }
    
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  setupStripeProducts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup script error:', error);
      process.exit(1);
    });
}

module.exports = { setupStripeProducts };