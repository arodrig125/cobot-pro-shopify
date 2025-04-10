import { DeliveryMethod } from "@shopify/shopify-api";
import prisma from "./prismaClient";

/**
 * Shopify GDPR Webhooks
 * Handles customer data requests, deletions, etc.
 */
const parsePayload = (body) => {
  try {
    return JSON.parse(body);
  } catch (error) {
    console.error("❌ Failed to parse webhook payload:", error);
    return null;
  }
};

export default {
  CUSTOMERS_DATA_REQUEST: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks/customers-data-request",
    callback: async (topic, shop, body, webhookId) => {
      const payload = parsePayload(body);
      if (!payload) return;

      console.log("🔐 Customer Data Request received:", {
        shop,
        webhookId,
        payload,
      });

      const { customer } = payload;
      const { id } = customer;

      // Log the data request in the database
      try {
        await prisma.customerDataRequest.create({
          data: {
            customerId: id,
            shop: shop,
          },
        });
      } catch (error) {
        console.error("❌ Failed to log customer data request:", error);
      }
      // TODO: Handle data request (e.g., export customer data, log it, etc.)
    },
  },

  CUSTOMERS_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks/customers-redact",
    callback: async (topic, shop, body, webhookId) => {
      const payload = parsePayload(body);
      if (!payload) return;

      console.log("🗑️ Customer Redact received:", {
        shop,
        webhookId,
        payload,
      });

      const { customer } = payload;
      const { id } = customer;

      // Log the customer deletion in the database
      try {
        await prisma.customerRedact.create({
          data: {
            customerId: id,
            shop: shop,
          },
        });
      } catch (error) {
        console.error("❌ Failed to log customer deletion:", error);
      }
      // TODO: Handle customer deletion cleanup here
    },
  },

  SHOP_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks/shop-redact",
    callback: async (topic, shop, body, webhookId) => {
      const payload = parsePayload(body);
      if (!payload) return;

      console.log("🏪 Shop Redact received:", {
        shop,
        webhookId,
        payload,
      });

      const { shop_id } = payload;

      // Log the shop deletion in the database
      try {
        await prisma.shopRedact.create({
          data: {
            shopId: shop_id,
            shop: shop,
          },
        });
      } catch (error) {
        console.error("❌ Failed to log shop deletion:", error);
      }
      // TODO: Clean up shop data from your database if needed
    },
  },
};
