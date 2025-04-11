import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { getIntegrationsByShopId } from "~/models/integration.server";
import { getShopByDomain } from "~/models/shop.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shopDomain = url.searchParams.get("shop");

  invariant(shopDomain, "No shop provided");

  const shopData = await getShopByDomain(shopDomain);
  if (!shopData) {
    return redirect(`/auth?shop=${shopDomain}`);
  }

  // Fetch the shop's integrations from our model
  const rawIntegrations = await getIntegrationsByShopId(shopData.id);

  // Format the integrations for the UI
  const integrations = {
    email: {
      mailchimp: {
        connected: rawIntegrations.email.find(i => i.type === "mailchimp")?.connected || false,
        name: "Mailchimp",
        description: "Send upsell data to Mailchimp for email campaigns",
        icon: "📧",
        category: "email"
      },
      klaviyo: {
        connected: rawIntegrations.email.find(i => i.type === "klaviyo")?.connected || false,
        name: "Klaviyo",
        description: "Sync customer data with Klaviyo for targeted emails",
        icon: "📊",
        category: "email"
      }
    },
    analytics: {
      googleAnalytics: {
        connected: rawIntegrations.analytics.find(i => i.type === "google_analytics")?.connected || false,
        name: "Google Analytics",
        description: "Track upsell performance in Google Analytics",
        icon: "📈",
        category: "analytics"
      },
      facebookPixel: {
        connected: rawIntegrations.analytics.find(i => i.type === "facebook_pixel")?.connected || false,
        name: "Facebook Pixel",
        description: "Track conversions and build audiences in Facebook",
        icon: "👥",
        category: "analytics"
      }
    },
    customerData: {
      segment: {
        connected: rawIntegrations.customerData.find(i => i.type === "segment")?.connected || false,
        name: "Segment",
        description: "Send customer data to multiple destinations",
        icon: "🔄",
        category: "customerData"
      },
      shopifyCustomerTags: {
        connected: rawIntegrations.customerData.find(i => i.type === "shopify_customer_tags")?.connected || false,
        name: "Shopify Customer Tags",
        description: "Use Shopify customer tags for segmentation",
        icon: "🏷️",
        category: "customerData"
      }
    }
  };

  return json({
    shop: shopData,
    integrations
  });
}

export default function IntegrationsPage() {
  const { shop, integrations } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<"email" | "analytics" | "customerData">("email");

  const getIntegrationsByCategory = (category: "email" | "analytics" | "customerData") => {
    return Object.values(integrations[category]);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Integrations</h2>
        <Link
          to={`/app/settings?shop=${shop.shopifyDomain}`}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Settings
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b">
          <nav className="flex">
            <button
              type="button"
              className={`px-4 py-3 font-medium ${activeTab === 'email' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('email')}
            >
              Email Marketing
            </button>
            <button
              type="button"
              className={`px-4 py-3 font-medium ${activeTab === 'analytics' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
            <button
              type="button"
              className={`px-4 py-3 font-medium ${activeTab === 'customerData' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('customerData')}
            >
              Customer Data
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {getIntegrationsByCategory(activeTab).map((integration: any) => (
              <IntegrationCard
                key={integration.name}
                integration={integration}
                shopDomain={shop.shopifyDomain}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({ integration, shopDomain }: { integration: any, shopDomain: string }) {
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 flex items-start">
        <div className="text-3xl mr-4">{integration.icon}</div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">{integration.name}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${integration.connected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {integration.connected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-4">{integration.description}</p>
          <div>
            {integration.connected ? (
              <div className="flex space-x-2">
                <Link
                  to={`/app/integrations/${integration.category}/${integration.name.toLowerCase().replace(/\s+/g, '-')}?shop=${shopDomain}`}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Configure
                </Link>
                <button
                  type="button"
                  className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <Link
                to={`/app/integrations/${integration.category}/${integration.name.toLowerCase().replace(/\s+/g, '-')}/connect?shop=${shopDomain}`}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Connect
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
