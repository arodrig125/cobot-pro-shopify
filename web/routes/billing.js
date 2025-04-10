// 📁 web/routes/billing.js
require("@shopify/shopify-api/adapters/node");

const express = require("express");
const { shopifyApi, LATEST_API_VERSION } = require("@shopify/shopify-api");

const router = express.Router();

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ["read_products", "write_products"],
  hostName: process.env.HOST.replace(/^https?:\/\//, ""),
  isEmbeddedApp: true,
  apiVersion: LATEST_API_VERSION,
});

router.post("/subscribe", async (req, res) => {
  const { shop } = req.body;

  try {
    console.log("🧠 Billing request received for shop:", shop);

    const session = await shopify.session.customAppSession(shop);
    console.log("🔐 Got Shopify session:", session);

    const client = new shopify.clients.Graphql({ session });

    const mutation = {
      query: `
        mutation {
          appSubscriptionCreate( 
            name: "Cobot Pro Basic Plan",
            returnUrl: "https://${shop}/admin/apps",
            test: true,
            trialDays: 7,
            lineItems: [
              {
                plan: {
                  appRecurringPricingDetails: {
                    __typename: RecurringPricing,
                    price: { amount: 9.99, currencyCode: USD }
                  }
                }
              }
            ]
          ) {
            confirmationUrl
            userErrors {
              field
              message
            }
          }
        }
      `,
    };

    console.log("📡 Sending billing mutation...");

    const response = await client.query(mutation);

    console.log("📦 Shopify billing response:", JSON.stringify(response.body, null, 2));

    const data = response.body.data.appSubscriptionCreate;

    if (data.userErrors.length > 0) {
      console.error("❌ Shopify returned userErrors:", data.userErrors);
      return res.status(400).json({ success: false, errors: data.userErrors });
    }

    const confirmationUrl = data.confirmationUrl;
    res.json({ success: true, redirectUrl: confirmationUrl });
  } catch (err) {
    console.error("💥 Billing error message:", err?.message);
    console.error("💥 Full error object:", JSON.stringify(err, null, 2));
    res.status(500).json({ success: false, error: "Billing setup failed." });
  }
});

module.exports = router;
