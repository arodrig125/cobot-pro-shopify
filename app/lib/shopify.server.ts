import invariant from "tiny-invariant";
import { singleton } from "~/singleton.server";

// Check for required environment variables
invariant(process.env.SHOPIFY_API_KEY, "SHOPIFY_API_KEY must be set");
invariant(process.env.SHOPIFY_API_SECRET, "SHOPIFY_API_SECRET must be set");
invariant(process.env.SHOPIFY_APP_URL, "SHOPIFY_APP_URL must be set");
invariant(process.env.SCOPES, "SCOPES must be set");

// Mock Shopify API for development
const shopify = {
  auth: {
    begin: async ({ shop }: { shop: string }) => {
      // In a real app, this would redirect to Shopify OAuth
      return `/auth/callback?shop=${shop}`;
    },
    callback: async ({ rawRequest }: { rawRequest: Request }) => {
      // In a real app, this would validate the OAuth callback
      const url = new URL(rawRequest.url);
      const shop = url.searchParams.get("shop");

      return {
        session: {
          accessToken: "mock-token",
          shop
        }
      };
    }
  },
  session: {
    getOfflineId: async (shop: string) => {
      // In a real app, this would check for a valid session
      return shop ? "mock-session-id" : null;
    }
  }
};

export { shopify };

// Helper function to create a new offline session
export async function createNewOfflineSession(shop: string) {
  return await shopify.auth.begin({ shop });
}

// Helper function to get an offline session
export async function getOfflineSession(shop: string) {
  return await shopify.session.getOfflineId(shop);
}
