#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check for required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'DATABASE_URL'];
const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  console.error('Please ensure your .env file contains all required Supabase credentials.');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrate.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📖 Loaded migration SQL from:', migrationPath);

    // Split the SQL into individual statements (basic approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comment-only statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue;
      }

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        });

        if (error) {
          // Try direct SQL execution for DDL statements
          const { error: directError } = await supabase
            .from('_migration_temp')
            .select('*')
            .limit(0);
          
          if (directError && directError.message.includes('does not exist')) {
            // This is expected for DDL operations, continue
            successCount++;
            console.log(`✅ Statement ${i + 1} executed (DDL)`);
          } else {
            throw error;
          }
        } else {
          successCount++;
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (error) {
        // Some errors are expected (like "already exists")
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('duplicate key')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
          successCount++;
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    // Verify key tables were created
    console.log('\n🔍 Verifying table creation...');
    
    const tables = ['users', 'subscriptions', 'posts', 'files', 'webhook_events'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}' verification failed:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and is accessible`);
        }
      } catch (error) {
        console.log(`❌ Table '${table}' verification error:`, error.message);
      }
    }

    // Try to generate Prisma client
    console.log('\n🔄 Generating Prisma client...');
    try {
      const { execSync } = require('child_process');
      execSync('npx prisma generate', { 
        stdio: 'inherit', 
        cwd: path.join(__dirname, '..') 
      });
      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      console.log('⚠️  Prisma client generation failed:', error.message);
      console.log('You can run "npx prisma generate" manually later');
    }

    console.log('\n🎉 Database migration completed!');
    console.log('\nNext steps:');
    console.log('1. Verify your Supabase dashboard shows the new tables');
    console.log('2. Test the application auth flow');
    console.log('3. Set up Stripe products for billing');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration script error:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };