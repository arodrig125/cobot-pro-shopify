import React from "react";
import {
  AppProvider,
  Frame
} from "@shopify/polaris";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import enTranslations from "@shopify/polaris/locales/en.json";
import Dashboard from "./components/Dashboard";

// Placeholder for authenticated fetch
export function useAuthenticatedFetch() {
  return async (url, options) => {
    // Replace this with your actual authentication logic if needed
    return fetch(url, options);
  };
}

function App() {
  // App Bridge configuration for Shopify integration
  const appBridgeConfig = {
    apiKey: process.env.REACT_APP_SHOPIFY_API_KEY || "9eb1abcf9adf062226d606d5c2ecb799",
    host: new URLSearchParams(window.location.search).get("host") || "",
    forceRedirect: true,
  };

  return (
    <AppProvider i18n={enTranslations}>
      <AppBridgeProvider config={appBridgeConfig}>
        <Frame>
          <Dashboard />
        </Frame>
      </AppBridgeProvider>
    </AppProvider>
  );
}

export default App;