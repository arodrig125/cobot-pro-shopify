import { shopifyApi } from "@shopify/shopify-api";

const shopify = shopifyApi({
  apiKey: "test_key",
  apiSecretKey: "test_secret",
  scopes: ["read_products"],
  hostName: "test_host",
});

console.log("Shopify API initialized successfully!");te