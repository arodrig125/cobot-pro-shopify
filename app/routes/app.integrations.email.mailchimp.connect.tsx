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
  
  return json({ 
    shop: shopData
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const apiKey = formData.get("apiKey");
  const listId = formData.get("listId");
  const shopDomain = formData.get("shop");
  
  invariant(typeof shopDomain === "string", "Shop domain must be provided");
  
  // Validate form data
  const errors: Record<string, string> = {};
  
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
    errors.apiKey = "API Key is required";
  }
  
  if (!listId || typeof listId !== "string" || listId.trim() === "") {
    errors.listId = "List ID is required";
  }
  
  if (Object.keys(errors).length > 0) {
    return json({ errors, values: Object.fromEntries(formData) });
  }
  
  // In a real app, we would save the integration details to the database
  // and make an API call to Mailchimp to verify the credentials
  console.log("Connecting to Mailchimp with:", { apiKey, listId });
  
  // Redirect back to the integrations page
  return redirect(`/app/integrations?shop=${shopDomain}`);
}

export default function MailchimpConnectPage() {
  const { shop } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Connect to Mailchimp</h2>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <div className="text-4xl mr-4">📧</div>
          <div>
            <h3 className="text-xl font-semibold">Mailchimp Integration</h3>
            <p className="text-gray-600">Connect your Mailchimp account to sync customer data and send targeted emails based on upsell activity.</p>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <Form method="post" className="space-y-4">
            <input type="hidden" name="shop" value={shop.shopifyDomain} />
            
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                Mailchimp API Key
              </label>
              <input
                type="text"
                id="apiKey"
                name="apiKey"
                defaultValue={actionData?.values?.apiKey as string}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your Mailchimp API key"
              />
              {actionData?.errors?.apiKey && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.apiKey}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                You can find your API key in your Mailchimp account under Account &gt; Extras &gt; API keys.
              </p>
            </div>
            
            <div>
              <label htmlFor="listId" className="block text-sm font-medium text-gray-700 mb-1">
                Audience List ID
              </label>
              <input
                type="text"
                id="listId"
                name="listId"
                defaultValue={actionData?.values?.listId as string}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your Mailchimp List ID"
              />
              {actionData?.errors?.listId && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.listId}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                You can find your List ID in Mailchimp under Audience &gt; Settings &gt; Audience name and defaults.
              </p>
            </div>
            
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="syncTags"
                name="syncTags"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="syncTags" className="ml-2 block text-sm text-gray-700">
                Sync customer tags with Mailchimp
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="syncPurchases"
                name="syncPurchases"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="syncPurchases" className="ml-2 block text-sm text-gray-700">
                Sync purchase history with Mailchimp
              </label>
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
                {isSubmitting ? "Connecting..." : "Connect to Mailchimp"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
