#!/usr/bin/env node

// This script is used by Vercel to build the application
// It ensures that Prisma migrations are run before the build

import { execSync } from 'child_process';

// Run Vercel-specific Prisma setup
console.log('Running Vercel-specific Prisma setup...');
try {
  execSync('node ./prisma/vercel-setup.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error running Vercel-specific Prisma setup:', error);
  process.exit(1);
}

// For Vercel deployment with Postgres
console.log('Setting up database for Vercel deployment...');

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Please set it in your Vercel environment variables.');
  process.exit(1);
}

// Run migrations in production
if (process.env.VERCEL_ENV === 'production') {
  console.log('Running Prisma migrations for Postgres...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error running Prisma migrations:', error);
    console.log('Continuing despite migration error - will attempt to generate client');
    // Don't exit on migration error, as we might still be able to generate the client
  }
} else {
  console.log('Skipping Prisma migrations in preview environment');
}

// Generate Prisma client
console.log('Generating Prisma client...');
try {
  // Add --schema flag to ensure we're using the right schema
  execSync('npx prisma generate --schema=./prisma/schema.prisma', { stdio: 'inherit' });
} catch (error) {
  console.error('Error generating Prisma client:', error);
  console.log('Attempting to continue with build despite Prisma client generation error');
  // Don't exit on client generation error, as we might still be able to build
  // process.exit(1);
}

// Build the application
console.log('Building the application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('Error building the application:', error);
  process.exit(1);
}

console.log('Build completed successfully!');
