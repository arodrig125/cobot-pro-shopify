// 📁 /Users/arod/cobot-pro/cobot-pro-frontend/src/App.jsx
import React, { useState, useEffect } from "react";
import {
  AppProvider,
  Page,
  Card,
  Layout,
  TextField,
  Button,
  Banner,
  ResourceList,
  ResourceItem
} from "@shopify/polaris";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import enTranslations from "@shopify/polaris/locales/en.json";

function App() {
  const [triggerProductId, setTriggerProductId] = useState("");
  const [upsellProductId, setUpsellProductId] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [rules, setRules] = useState([]);

  const saveRule = async () => {
    const res = await fetch("/api/upsell/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triggerProductId, upsellProductId, message })
    });

    const data = await res.json();
    if (data.success) {
      setSuccess(true);
      setTriggerProductId("");
      setUpsellProductId("");
      setMessage("");
      fetchRules();
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const fetchRules = async () => {
    const res = await fetch("/api/upsell/rules");
    const data = await res.json();
    if (data.success) setRules(data.rules);
  };

  useEffect(() => {
    fetchRules();
  }, []);

    const appBridgeConfig = {
    apiKey: "9eb1abcf9adf062226d606d5c2ecb799",
    host: new URLSearchParams(window.location.search).get("host"),
    forceRedirect: true
  };

  return (
    <AppProvider i18n={enTranslations}>
      <AppBridgeProvider config={appBridgeConfig}>
        <Page title="Cobot Pro – Upsell Manager">
          <Layout>
            <Layout.Section>
              <Card title="Create New Upsell Rule" sectioned>
                <TextField
                  label="Trigger Product ID"
                  value={triggerProductId}
                  onChange={setTriggerProductId}
                  autoComplete="off"
                />
                <TextField
                  label="Upsell Product ID"
                  value={upsellProductId}
                  onChange={setUpsellProductId}
                  autoComplete="off"
                />
                <TextField
                  label="Message"
                  value={message}
                  onChange={setMessage}
                  multiline
                />
                <Button primary onClick={saveRule} style={{ marginTop: 16 }}>
                  Save Rule
                </Button>
                {success && (
                  <Banner status="success" title="Thanks, Cobot 🤖">
                    <p>Upsell rule saved successfully!</p>
                  </Banner>
                )}
              </Card>

              <Card title="Saved Upsell Rules" sectioned>
                <ResourceList
                  resourceName={{ singular: "rule", plural: "rules" }}
                  items={rules}
                  renderItem={(rule) => (
                    <ResourceItem id={rule.id}>
                      <p>
                        <strong>{rule.triggerProductId}</strong> → {rule.upsellProductId}<br />
                        <em>{rule.message}</em>
                      </p>
                    </ResourceItem>
                  )}
                />
              </Card>
            </Layout.Section>
          </Layout>
        </Page>
      </AppBridgeProvider>
    </AppProvider>
  );
}

export default App;
