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
    tagPrefix: "upsell_",
    tagViewedUpsells: true,
    tagAcceptedUpsells: true,
    tagRejectedUpsells: true,
    tagUpsellProducts: true,
    customTags: [
      { id: "1", name: "high_value_upsell", condition: "Order value > $100" },
      { id: "2", name: "repeat_upsell_buyer", condition: "Accepted > 3 upsells" }
    ]
  };
  
  return json({ 
    shop: shopData,
    integration
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const tagPrefix = formData.get("tagPrefix");
  const tagViewedUpsells = formData.get("tagViewedUpsells") === "on";
  const tagAcceptedUpsells = formData.get("tagAcceptedUpsells") === "on";
  const tagRejectedUpsells = formData.get("tagRejectedUpsells") === "on";
  const tagUpsellProducts = formData.get("tagUpsellProducts") === "on";
  const shopDomain = formData.get("shop");
  
  // Get custom tags from form data
  const customTagNames = formData.getAll("customTagName");
  const customTagConditions = formData.getAll("customTagCondition");
  
  const customTags = customTagNames.map((name, index) => ({
    id: String(index + 1),
    name: name.toString(),
    condition: customTagConditions[index]?.toString() || ""
  })).filter(tag => tag.name && tag.condition);
  
  invariant(typeof shopDomain === "string", "Shop domain must be provided");
  
  // Validate form data
  const errors: Record<string, string> = {};
  
  if (!tagPrefix || typeof tagPrefix !== "string") {
    errors.tagPrefix = "Tag prefix is required";
  }
  
  if (Object.keys(errors).length > 0) {
    return json({ errors, values: Object.fromEntries(formData) });
  }
  
  // In a real app, we would save the integration details to the database
  console.log("Updating Shopify Customer Tags settings:", { 
    tagPrefix, 
    tagViewedUpsells, 
    tagAcceptedUpsells,
    tagRejectedUpsells,
    tagUpsellProducts,
    customTags
  });
  
  // Redirect back to the integrations page
  return redirect(`/app/integrations?shop=${shopDomain}`);
}

export default function ShopifyCustomerTagsPage() {
  const { shop, integration } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Shopify Customer Tags Settings</h2>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <div className="text-4xl mr-4">🏷️</div>
          <div>
            <h3 className="text-xl font-semibold">Shopify Customer Tags Integration</h3>
            <p className="text-gray-600">Configure how customer tags are created and managed based on upsell interactions.</p>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <Form method="post" className="space-y-4">
            <input type="hidden" name="shop" value={shop.shopifyDomain} />
            
            <div>
              <label htmlFor="tagPrefix" className="block text-sm font-medium text-gray-700 mb-1">
                Tag Prefix
              </label>
              <input
                type="text"
                id="tagPrefix"
                name="tagPrefix"
                defaultValue={actionData?.values?.tagPrefix as string || integration.tagPrefix}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., upsell_"
              />
              {actionData?.errors?.tagPrefix && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.tagPrefix}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                This prefix will be added to all customer tags created by the app.
              </p>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Automatic Tagging</h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="tagViewedUpsells"
                    name="tagViewedUpsells"
                    defaultChecked={integration.tagViewedUpsells}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="tagViewedUpsells" className="ml-2 block text-sm text-gray-700">
                    Tag customers who view upsell offers
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="tagAcceptedUpsells"
                    name="tagAcceptedUpsells"
                    defaultChecked={integration.tagAcceptedUpsells}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="tagAcceptedUpsells" className="ml-2 block text-sm text-gray-700">
                    Tag customers who accept upsell offers
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="tagRejectedUpsells"
                    name="tagRejectedUpsells"
                    defaultChecked={integration.tagRejectedUpsells}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="tagRejectedUpsells" className="ml-2 block text-sm text-gray-700">
                    Tag customers who reject upsell offers
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="tagUpsellProducts"
                    name="tagUpsellProducts"
                    defaultChecked={integration.tagUpsellProducts}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="tagUpsellProducts" className="ml-2 block text-sm text-gray-700">
                    Tag customers with specific upsell products they purchased
                  </label>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Custom Tags</h4>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    const customTagsContainer = document.getElementById('customTagsContainer');
                    if (customTagsContainer) {
                      const newTagRow = document.createElement('div');
                      newTagRow.className = 'grid grid-cols-2 gap-4 mt-3';
                      newTagRow.innerHTML = `
                        <div>
                          <input
                            type="text"
                            name="customTagName"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Tag name"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            name="customTagCondition"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Condition"
                          />
                        </div>
                      `;
                      customTagsContainer.appendChild(newTagRow);
                    }
                  }}
                >
                  + Add Custom Tag
                </button>
              </div>
              
              <div id="customTagsContainer" className="space-y-3">
                {integration.customTags.map((tag, index) => (
                  <div key={tag.id} className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        name="customTagName"
                        defaultValue={tag.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tag name"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="customTagCondition"
                        defaultValue={tag.condition}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Condition"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="mt-2 text-xs text-gray-500">
                Create custom tags based on specific conditions. These tags will be applied to customers automatically.
              </p>
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
