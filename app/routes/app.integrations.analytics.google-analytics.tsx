import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getShopByDomain } from "~/models/shop.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shopDomain = url.searchParams.get("shop");
  
  invariant(shopDomain, "No shop provided");
  
  const shopData = await getShopByDomain(shopDomain);
  if (!shopData) {
    return redirect(`/auth?shop=${shopDomain}`);
  }
  
  // In a real app, we would fetch the integration details from the database
  // For now, we'll use mock data
  const integration = {
    connected: true,
    trackingId: "UA-123456789-1",
    eventTracking: true,
    enhancedEcommerce: true,
    trackUpsellImpressions: true,
    trackUpsellClicks: true,
    trackUpsellConversions: true
  };
  
  return json({ 
    shop: shopData,
    integration
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const trackingId = formData.get("trackingId");
  const eventTracking = formData.get("eventTracking") === "on";
  const enhancedEcommerce = formData.get("enhancedEcommerce") === "on";
  const trackUpsellImpressions = formData.get("trackUpsellImpressions") === "on";
  const trackUpsellClicks = formData.get("trackUpsellClicks") === "on";
  const trackUpsellConversions = formData.get("trackUpsellConversions") === "on";
  const shopDomain = formData.get("shop");
  
  invariant(typeof shopDomain === "string", "Shop domain must be provided");
  
  // Validate form data
  const errors: Record<string, string> = {};
  
  if (!trackingId || typeof trackingId !== "string" || trackingId.trim() === "") {
    errors.trackingId = "Tracking ID is required";
  } else if (!trackingId.match(/^(UA|G|AW|GTM)-[A-Z0-9]+-[0-9]+$/)) {
    errors.trackingId = "Invalid tracking ID format";
  }
  
  if (Object.keys(errors).length > 0) {
    return json({ errors, values: Object.fromEntries(formData) });
  }
  
  // In a real app, we would save the integration details to the database
  console.log("Updating Google Analytics settings:", { 
    trackingId, 
    eventTracking, 
    enhancedEcommerce,
    trackUpsellImpressions,
    trackUpsellClicks,
    trackUpsellConversions
  });
  
  // Redirect back to the integrations page
  return redirect(`/app/integrations?shop=${shopDomain}`);
}

export default function GoogleAnalyticsPage() {
  const { shop, integration } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Google Analytics Settings</h2>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <div className="text-4xl mr-4">📈</div>
          <div>
            <h3 className="text-xl font-semibold">Google Analytics Integration</h3>
            <p className="text-gray-600">Configure how your upsell data is tracked in Google Analytics.</p>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <Form method="post" className="space-y-4">
            <input type="hidden" name="shop" value={shop.shopifyDomain} />
            
            <div>
              <label htmlFor="trackingId" className="block text-sm font-medium text-gray-700 mb-1">
                Google Analytics Tracking ID
              </label>
              <input
                type="text"
                id="trackingId"
                name="trackingId"
                defaultValue={actionData?.values?.trackingId as string || integration.trackingId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX"
              />
              {actionData?.errors?.trackingId && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.trackingId}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Enter your Google Analytics tracking ID (UA-XXXXXXXXX-X) or measurement ID (G-XXXXXXXXXX).
              </p>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Tracking Options</h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="eventTracking"
                    name="eventTracking"
                    defaultChecked={integration.eventTracking}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="eventTracking" className="ml-2 block text-sm text-gray-700">
                    Enable event tracking
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enhancedEcommerce"
                    name="enhancedEcommerce"
                    defaultChecked={integration.enhancedEcommerce}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enhancedEcommerce" className="ml-2 block text-sm text-gray-700">
                    Enable enhanced ecommerce tracking
                  </label>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Upsell Tracking</h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="trackUpsellImpressions"
                    name="trackUpsellImpressions"
                    defaultChecked={integration.trackUpsellImpressions}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="trackUpsellImpressions" className="ml-2 block text-sm text-gray-700">
                    Track upsell impressions
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="trackUpsellClicks"
                    name="trackUpsellClicks"
                    defaultChecked={integration.trackUpsellClicks}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="trackUpsellClicks" className="ml-2 block text-sm text-gray-700">
                    Track upsell clicks
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="trackUpsellConversions"
                    name="trackUpsellConversions"
                    defaultChecked={integration.trackUpsellConversions}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="trackUpsellConversions" className="ml-2 block text-sm text-gray-700">
                    Track upsell conversions
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end space-x-3">
              <a
                href={`/app/integrations?shop=${shop.shopifyDomain}`}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isSubmitting ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
