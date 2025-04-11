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

  // Create a .env file if it doesn't exist
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log('Creating .env file for Vercel...');
    fs.writeFileSync(
      envPath,
      `DATABASE_URL="${process.env.DATABASE_URL}"\n` +
      `SESSION_SECRET="${process.env.SESSION_SECRET}"\n` +
      `SHOPIFY_API_KEY="${process.env.SHOPIFY_API_KEY}"\n` +
      `SHOPIFY_API_SECRET="${process.env.SHOPIFY_API_SECRET}"\n` +
      `SHOPIFY_APP_URL="${process.env.SHOPIFY_APP_URL}"\n` +
      `SCOPES="${process.env.SCOPES}"\n`
    );
  }

  console.log('Prisma setup for Vercel completed.');
} else {
  console.log('Not running in Vercel environment, skipping Vercel-specific setup.');
}
