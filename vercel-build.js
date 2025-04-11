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

// Run Prisma migrations if not in preview environment
if (process.env.VERCEL_ENV === 'production') {
  console.log('Running Prisma migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error running Prisma migrations:', error);
    process.exit(1);
  }
} else {
  console.log('Skipping Prisma migrations in preview environment');
}

// Generate Prisma client
console.log('Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (error) {
  console.error('Error generating Prisma client:', error);
  process.exit(1);
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
