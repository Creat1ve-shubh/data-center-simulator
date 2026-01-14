#!/usr/bin/env node

/**
 * Database Connection & Setup Verification Script
 * Verifies Vercel Postgres connection and Prisma setup
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log('\n' + '='.repeat(70), 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(70), 'cyan');
}

async function runCommand(command, args = [], description = '') {
  return new Promise((resolve) => {
    if (description) {
      log(`\n🔍 ${description}...`, 'blue');
    }

    const proc = spawn(command, args, {
      stdio: 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function verifySetup() {
  section('DATABASE VERIFICATION SCRIPT');

  log('\nThis script will verify:');
  log('  ✓ Environment variables are set', 'yellow');
  log('  ✓ Prisma is properly configured', 'yellow');
  log('  ✓ Database connection works', 'yellow');
  log('  ✓ Migrations are up-to-date', 'yellow');
  log('  ✓ Schema is valid', 'yellow');

  // Step 1: Check environment variables
  section('Step 1: Environment Variables');
  
  const hasLocal = existsSync('.env.local');
  const hasExample = existsSync('.env.example');
  
  log(`.env.local exists: ${hasLocal ? '✅ YES' : '❌ NO'}`, hasLocal ? 'green' : 'red');
  log(`.env.example exists: ${hasExample ? '✅ YES' : '❌ NO'}`, hasExample ? 'green' : 'red');

  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    const masked = dbUrl.replace(/:[^:@]*@/, ':****@');
    log(`DATABASE_URL: ✅ SET`, 'green');
    log(`  Format: ${masked}`, 'green');
    
    // Check for proper format
    if (dbUrl.includes('postgresql://') || dbUrl.includes('postgres://')) {
      log(`  Protocol: ✅ PostgreSQL`, 'green');
    } else {
      log(`  Protocol: ❌ NOT PostgreSQL`, 'red');
    }

    if (dbUrl.includes('sslmode=require')) {
      log(`  SSL Mode: ✅ REQUIRED`, 'green');
    } else {
      log(`  SSL Mode: ⚠️  NOT ENFORCED`, 'yellow');
    }
  } else {
    log(`DATABASE_URL: ❌ NOT SET`, 'red');
    log(`\n  ⚠️  For Vercel Postgres:`, 'yellow');
    log(`    1. Pull environment variables: vercel env pull`, 'yellow');
    log(`    2. Or manually set: DATABASE_URL=postgresql://...`, 'yellow');
  }

  // Step 2: Check Prisma files
  section('Step 2: Prisma Configuration');

  const hasPrismaSchema = existsSync('prisma/schema.prisma');
  const hasPrismaConfig = existsSync('prisma.config.ts');

  log(`schema.prisma exists: ${hasPrismaSchema ? '✅ YES' : '❌ NO'}`, hasPrismaSchema ? 'green' : 'red');
  log(`prisma.config.ts exists: ${hasPrismaConfig ? '✅ YES' : '❌ NO'}`, hasPrismaConfig ? 'green' : 'red');

  // Step 3: Check Prisma Client
  section('Step 3: Prisma Client');

  const hasAdapter = existsSync('node_modules/@prisma/adapter-pg');
  const hasPrisma = existsSync('node_modules/@prisma/client');

  log(`@prisma/adapter-pg installed: ${hasAdapter ? '✅ YES' : '❌ NO'}`, hasAdapter ? 'green' : 'red');
  log(`@prisma/client installed: ${hasPrisma ? '✅ YES' : '❌ NO'}`, hasPrisma ? 'green' : 'red');

  if (!hasAdapter || !hasPrisma) {
    log(`\n  Run: pnpm install`, 'yellow');
  }

  // Step 4: Generate Prisma Client
  section('Step 4: Prisma Client Generation');

  if (process.env.DATABASE_URL) {
    const result = await runCommand('pnpm', ['prisma', 'generate'], 'Generating Prisma Client');
    
    if (result.code === 0) {
      log('✅ Prisma Client generated successfully', 'green');
    } else {
      log('❌ Failed to generate Prisma Client', 'red');
      if (result.stderr) {
        log(`   Error: ${result.stderr}`, 'red');
      }
    }
  } else {
    log('⏭️  Skipping (DATABASE_URL not set)', 'yellow');
  }

  // Step 5: Check migrations
  section('Step 5: Database Migrations');

  const migrationDir = 'prisma/migrations';
  const hasMigrations = existsSync(migrationDir);

  log(`Migrations directory exists: ${hasMigrations ? '✅ YES' : '❌ NO'}`, hasMigrations ? 'green' : 'red');

  if (process.env.DATABASE_URL && hasMigrations) {
    const result = await runCommand('pnpm', ['prisma', 'migrate', 'status'], 'Checking migration status');
    
    if (result.code === 0) {
      log('✅ Migrations status checked', 'green');
      log(result.stdout, 'blue');
    } else {
      log('⚠️  Could not determine migration status', 'yellow');
      if (result.stderr) {
        log(`   ${result.stderr}`, 'yellow');
      }
    }
  }

  // Step 6: Test database connection
  section('Step 6: Database Connection Test');

  if (process.env.DATABASE_URL) {
    log('Attempting connection to database...', 'blue');
    
    const testScript = `
const { prisma } = require('./lib/prisma');

async function test() {
  try {
    const result = await prisma.$queryRaw\`SELECT 1\`;
    console.log('✅ Database connection successful');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

test();
`;

    // Write test file
    const fs = require('fs');
    fs.writeFileSync('test-db-connection.js', testScript);

    const result = await runCommand('node', ['test-db-connection.js']);
    
    if (result.code === 0) {
      log('✅ Database connection successful', 'green');
    } else {
      log('❌ Database connection failed', 'red');
      log(result.stderr || result.stdout, 'red');
    }

    // Clean up
    fs.unlinkSync('test-db-connection.js');
  } else {
    log('⏭️  Skipping (DATABASE_URL not set)', 'yellow');
  }

  // Summary
  section('NEXT STEPS');

  const steps = [
    {
      condition: !process.env.DATABASE_URL,
      text: '1. Set DATABASE_URL environment variable:',
      subtext: '   vercel env pull  (pulls from Vercel)\n   OR manually set your Vercel Postgres connection string'
    },
    {
      condition: true,
      text: '2. Generate Prisma Client:',
      subtext: '   pnpm prisma generate'
    },
    {
      condition: true,
      text: '3. Run migrations:',
      subtext: '   pnpm prisma migrate deploy'
    },
    {
      condition: true,
      text: '4. Build the application:',
      subtext: '   pnpm build'
    },
    {
      condition: true,
      text: '5. Run tests:',
      subtext: '   npm test'
    },
    {
      condition: true,
      text: '6. Deploy to Vercel:',
      subtext: '   git push origin main'
    }
  ];

  steps.forEach(step => {
    if (step.condition) {
      log(`\n${step.text}`, 'yellow');
      log(step.subtext, 'reset');
    }
  });

  section('QUICK SETUP COMMANDS');

  log('\nOne-liner to set up everything:', 'cyan');
  log('pnpm install && pnpm prisma generate && pnpm prisma migrate deploy && npm test', 'blue');

  log('\n\nFor Vercel Postgres:', 'cyan');
  log('vercel env pull && pnpm prisma generate && pnpm prisma migrate deploy && npm test', 'blue');

  section('DOCUMENTATION');

  log('\nFor more details, see:', 'cyan');
  log('  📖 DATABASE_PRODUCTION_SETUP.md - Production setup guide', 'yellow');
  log('  📖 TEST_RUNNING_GUIDE.md - How to run tests', 'yellow');
  log('  📖 VERCEL_DEPLOYMENT.md - Vercel deployment guide', 'yellow');
}

verifySetup().catch(error => {
  log(`\n❌ Verification failed: ${error.message}`, 'red');
  process.exit(1);
});
