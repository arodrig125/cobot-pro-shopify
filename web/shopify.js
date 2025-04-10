import { shopifyApi, LATEST_API_VERSION, MemorySessionStorage } from '@shopify/shopify-api';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Debugging: Log environment variables only in development
if (process.env.NODE_ENV !== 'production') {
  console.log('SHOPIFY_API_KEY:', process.env.SHOPIFY_API_KEY);
  console.log('SHOPIFY_API_SECRET:', process.env.SHOPIFY_API_SECRET);
  console.log('HOST:', process.env.HOST);
}

// Ensure all required environment variables are present
if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET || !process.env.HOST || !process.env.SCOPES) {
  throw new Error('Missing required environment variables. Check your .env file.');
}

// Create and export the Shopify API instance// 
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES.split(','),
  hostName: (process.env.HOST || '').replace(/^https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  sessionStorage: new MemorySessionStorage(),
});
