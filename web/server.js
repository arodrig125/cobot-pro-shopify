import express from 'express';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import { MemorySessionStorage } from '@shopify/shopify-api/session';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES.split(','),
  hostName: (process.env.HOST || '').replace(/^https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  sessionStorage: new MemorySessionStorage(),  // Correct usage
});

// OAuth endpoint examples...
app.get('/auth', async (req, res) => {
  try {
    const authRoute = await shopify.auth.begin({ req, res, callbackPath: '/auth/callback' });
    return res.redirect(authRoute);
  } catch (error) {
    console.error('Error starting OAuth:', error);
    return res.status(500).send(error.message);
  }
});

app.get('/auth/callback', async (req, res) => {
  try {
    const session = await shopify.auth.validateAuthCallback({ req, res });
    console.log('Authenticated session:', session);
    res.redirect(`/?shop=${session.shop}`);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return res.status(500).send(error.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Shopify API server is running on port ${PORT}`);
});

// OAuth Callback
app.get('/auth/callback', async (req, res) => {
  try {
    // Validate callback and retrieve session
    const session = await shopify.auth.validateAuthCallback({ req, res });
    // Save session as needed (in memory, database, etc.)
    console.log('Authenticated session:', session);
    res.redirect(`/?shop=${session.shop}`);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).send(error.message);
  }
});
