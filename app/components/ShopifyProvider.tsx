import { ReactNode } from "react";

interface ShopifyProviderProps {
  children: ReactNode;
}

// This is a simplified version of the ShopifyProvider
// In a real app, we would use the Shopify App Bridge Provider
export function ShopifyProvider({ children }: ShopifyProviderProps) {
  return <>{children}</>;
}

// Add this to global window object
declare global {
  interface Window {
    shopifyApiKey?: string;
  }
}
