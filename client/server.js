// server.js
import express from 'express';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import dotenv from 'dotenv';
<<<<<<< Tabnine <<<<<<<
import MemorySessionStorage from '@shopify/shopify-api/lib/auth/session/memory-session-storage';//+

dotenv.config();

const app = express();

// Initialize Shopify API
import MemorySessionStorage from '@shopify/shopify-api/lib/auth/session/memory-session-storage';//-
//-
// ...//-
const shopify = shopifyApi({
  // ...//-
  apiKey: process.env.SHOPIFY_API_KEY,//+
  apiSecretKey: process.env.SHOPIFY_API_SECRET,//+
  scopes: process.env.SCOPES.split(','),//+
  hostName: process.env.HOST.replace(/https:\/\//, ''),//+
  apiVersion: LATEST_API_VERSION,//+
  isEmbeddedApp: true, // Set this to false if your app is not embedded//+
  sessionStorage: new MemorySessionStorage(),
  // ...//-
});

// Middleware to parse JSON bodies//+
app.use(express.json());//+
// -------------------------------------
// Shopify OAuth Flow Endpoints
// -------------------------------------

// 1. Start OAuth Process
app.get('/auth', async (req, res) => {
  try {
    // This call generates the URL for Shopify's OAuth screen//-
    const authRoute = await shopify.auth.begin({ req, res, callbackPath: '/auth/callback' });//-
    // Redirect the merchant to Shopify's authorization page//-
    return res.redirect(authRoute);//-
    const authRoute = await shopify.auth.begin({//+
      shop: req.query.shop,//+
      callbackPath: '/auth/callback',//+
      isOnline: false, // Set to true for online access mode//+
    });//+
    res.redirect(authRoute);//+
  } catch (error) {
    console.error('Error starting OAuth:', error);
    return res.status(500).send(error.message);//-
    res.status(500).send(error.message);//+
  }
});

// 2. OAuth Callback (Redirect URL)
// This URL must match what you set in the Shopify Partner Dashboard//-
app.get('/auth/callback', async (req, res) => {
  try {
    // Validate the callback and retrieve the session//-
    const session = await shopify.auth.validateAuthCallback({ req, res });//-
    // At this point, you should save the session (in a database or in-memory store)//-
    const session = await shopify.auth.callback({//+
      rawRequest: req,//+
      rawResponse: res,//+
    });//+
//+
    // Save session to your database here//+
    console.log('Authenticated session:', session);
    // After successful authentication, redirect to your app's main page (embedded or otherwise)//-
    res.redirect(`/?shop=${session.shop}`);//-
//+
    // Redirect to app with shop parameter//+
    const redirectUrl = `/?shop=${session.shop}&host=${req.query.host}`;//+
    res.redirect(redirectUrl);//+
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return res.status(500).send(error.message);//-
    res.status(500).send(error.message);//+
  }//+
});//+
//+
// Verify webhook//+
app.post('/webhooks', express.raw({type: 'application/json'}), async (req, res) => {//+
  try {//+
    const { valid, body } = await shopify.webhooks.validate({//+
      rawBody: req.body, // is a buffer//+
      rawRequest: req,//+
      rawResponse: res//+
    });//+
//+
    if (!valid) {//+
      console.error('Invalid webhook');//+
      res.status(401).send('Invalid webhook');//+
      return;//+
    }//+
//+
    // Process the webhook//+
    console.log('Webhook received:', body);//+
    res.status(200).send('Webhook processed');//+
  } catch (error) {//+
    console.error('Webhook error:', error);//+
    res.status(500).send(error.message);//+
  }//+
});//+
//+
// Verify request is from Shopify//+
const verifyRequest = async (req, res, next) => {//+
  try {//+
    const session = await shopify.session.getCurrentId({//+
      isOnline: true,//+
      rawRequest: req,//+
      rawResponse: res,//+
    });//+
//+
    if (!session) {//+
      return res.status(401).send('Unauthorized');//+
    }//+
//+
    req.shopifySession = session;//+
    next();//+
  } catch (error) {//+
    console.error('Error verifying request:', error);//+
    res.status(401).send('Unauthorized');//+
  }//+
};//+
//+
// Example protected route//+
app.get('/api/products', verifyRequest, async (req, res) => {//+
  try {//+
    const client = new shopify.clients.Rest({session: req.shopifySession});//+
    const response = await client.get({//+
      path: 'products',//+
    });//+
    res.status(200).json(response.body);//+
  } catch (error) {//+
    console.error('Error fetching products:', error);//+
    res.status(500).send(error.message);//+
>>>>>>> Tabnine >>>>>>>// {"source":"chat"}
  }
});

// -------------------------------------
// Start the Server
// -------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Shopify API server is running on port ${PORT}`);
});