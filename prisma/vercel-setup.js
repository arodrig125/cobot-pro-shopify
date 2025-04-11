// This script helps set up Prisma for Vercel deployment
// It ensures that the database connection is properly configured

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're in a Vercel environment
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  console.log('Setting up Prisma for Vercel deployment...');

  // Verify DATABASE_URL is set for Postgres
  const databaseUrl = process.env.DATABASE_URL || '';
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Please set it in your Vercel environment variables.');
    process.exit(1);
  }

  // Create a .env file if it doesn't exist
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log('Creating .env file for Vercel...');
    fs.writeFileSync(
      envPath,
      `DATABASE_URL="${databaseUrl}"\n` +
      `SESSION_SECRET="${process.env.SESSION_SECRET || 'vercel-deployment-secret'}"\n` +
      `SHOPIFY_API_KEY="${process.env.SHOPIFY_API_KEY || 'dummy-key'}"\n` +
      `SHOPIFY_API_SECRET="${process.env.SHOPIFY_API_SECRET || 'dummy-secret'}"\n` +
      `SHOPIFY_APP_URL="${process.env.SHOPIFY_APP_URL || 'https://cobotpro.io'}"\n` +
      `SCOPES="${process.env.SCOPES || 'read_products,write_products,read_orders,write_orders,read_customers,write_customers'}"\n`
    );
  } else {
    // Update existing .env file with correct DATABASE_URL
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/DATABASE_URL=.*\n/, `DATABASE_URL="${databaseUrl}"\n`);
    fs.writeFileSync(envPath, envContent);
    console.log('Updated DATABASE_URL in existing .env file');
  }

  console.log('Prisma setup for Vercel completed.');
} else {
  console.log('Not running in Vercel environment, skipping Vercel-specific setup.');
}
