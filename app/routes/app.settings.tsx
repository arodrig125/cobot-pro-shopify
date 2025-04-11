import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getShopByDomain } from "~/models/shop.server";
import { getShopSettings, updateShopSettings } from "~/models/settings.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shopDomain = url.searchParams.get("shop");

  invariant(shopDomain, "No shop provided");

  const shopData = await getShopByDomain(shopDomain);
  if (!shopData) {
    return redirect(`/auth?shop=${shopDomain}`);
  }

  // Get settings from the database
  const settings = await getShopSettings(shopData.id);
  if (!settings) {
    return json({
      shop: shopData,
      settings: {
        displayLocation: "cart_page",
        maxOffersPerPage: 2,
        offerStyle: "modal",
        autoApplyDiscount: true,
        showDiscountBadge: true,
        enableAnalytics: true
      }
    });
  }

  return json({
    shop: shopData,
    settings
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const displayLocation = formData.get("displayLocation");
  const maxOffersPerPageStr = formData.get("maxOffersPerPage");
  const offerStyle = formData.get("offerStyle");
  const autoApplyDiscount = formData.get("autoApplyDiscount") === "on";
  const showDiscountBadge = formData.get("showDiscountBadge") === "on";
  const enableAnalytics = formData.get("enableAnalytics") === "on";
  const shopDomain = formData.get("shop");

  // Validate form data
  const errors: Record<string, string> = {};

  if (!displayLocation || typeof displayLocation !== "string") {
    errors.displayLocation = "Display location is required";
  }

  if (!maxOffersPerPageStr || typeof maxOffersPerPageStr !== "string") {
    errors.maxOffersPerPage = "Max offers per page is required";
  }

  if (!offerStyle || typeof offerStyle !== "string") {
    errors.offerStyle = "Offer style is required";
  }

  if (!shopDomain || typeof shopDomain !== "string") {
    errors.shop = "Shop is required";
  }

  // Parse maxOffersPerPage as a number
  let maxOffersPerPage: number = 2;
  if (maxOffersPerPageStr && typeof maxOffersPerPageStr === "string") {
    const parsedValue = parseInt(maxOffersPerPageStr, 10);
    if (isNaN(parsedValue) || parsedValue < 1 || parsedValue > 5) {
      errors.maxOffersPerPage = "Max offers must be between 1 and 5";
    } else {
      maxOffersPerPage = parsedValue;
    }
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors, values: Object.fromEntries(formData) });
  }

  invariant(typeof shopDomain === "string", "Shop domain must be a string");

  // Get the shop from the database
  const shop = await getShopByDomain(shopDomain);
  if (!shop) {
    return redirect(`/auth?shop=${shopDomain}`);
  }

  // Update settings in the database
  const updatedSettings = await updateShopSettings({
    shopId: shop.id,
    displayLocation: displayLocation as string,
    maxOffersPerPage,
    offerStyle: offerStyle as string,
    autoApplyDiscount,
    showDiscountBadge,
    enableAnalytics
  });

  return json({
    success: true,
    message: "Settings saved successfully",
    settings: updatedSettings
  });
}

export default function SettingsPage() {
  const { shop, settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Use the most recent settings (from action data if available, otherwise from loader)
  const currentSettings = actionData?.settings || settings;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">App Settings</h2>

      {actionData?.success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-md p-4">
          {actionData.message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <Form method="post" className="space-y-6">
          <input type="hidden" name="shop" value={shop.shopifyDomain} />
          <div>
            <label htmlFor="displayLocation" className="block text-sm font-medium text-gray-700">
              Display Location
            </label>
            <select
              id="displayLocation"
              name="displayLocation"
              defaultValue={currentSettings.displayLocation}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="product_page">Product Page</option>
              <option value="cart_page">Cart Page</option>
              <option value="checkout_page">Checkout Page</option>
              <option value="thank_you_page">Thank You Page</option>
            </select>
            {actionData?.errors?.displayLocation && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.displayLocation}</p>
            )}
          </div>

          <div>
            <label htmlFor="maxOffersPerPage" className="block text-sm font-medium text-gray-700">
              Maximum Offers Per Page
            </label>
            <input
              type="number"
              id="maxOffersPerPage"
              name="maxOffersPerPage"
              min="1"
              max="5"
              defaultValue={currentSettings.maxOffersPerPage}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {actionData?.errors?.maxOffersPerPage && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.maxOffersPerPage}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Limit the number of upsell offers shown to customers at once (1-5)
            </p>
          </div>

          <div>
            <label htmlFor="offerStyle" className="block text-sm font-medium text-gray-700">
              Offer Display Style
            </label>
            <select
              id="offerStyle"
              name="offerStyle"
              defaultValue={currentSettings.offerStyle}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="inline">Inline (within page)</option>
              <option value="modal">Modal Popup</option>
              <option value="sidebar">Sidebar Slide-in</option>
              <option value="notification">Notification Banner</option>
            </select>
            {actionData?.errors?.offerStyle && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.offerStyle}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoApplyDiscount"
                name="autoApplyDiscount"
                defaultChecked={currentSettings.autoApplyDiscount}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoApplyDiscount" className="ml-2 block text-sm text-gray-700">
                Automatically apply discounts when customer accepts an offer
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showDiscountBadge"
                name="showDiscountBadge"
                defaultChecked={currentSettings.showDiscountBadge}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showDiscountBadge" className="ml-2 block text-sm text-gray-700">
                Show discount badge on upsell offers
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableAnalytics"
                name="enableAnalytics"
                defaultChecked={currentSettings.enableAnalytics}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="enableAnalytics" className="ml-2 block text-sm text-gray-700">
                Enable detailed analytics and reporting
              </label>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-medium mb-2">Integrations</h3>
              <p className="text-sm text-gray-600 mb-3">Connect your app with other services to enhance functionality.</p>
              <Link
                to={`/app/integrations?shop=${shop.shopifyDomain}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Manage Integrations
              </Link>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
