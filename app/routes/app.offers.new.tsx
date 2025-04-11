import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getShopByDomain } from "~/models/shop.server";
import { createUpsellOffer } from "~/models/upsell.server";
import { shopify } from "~/lib/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shopDomain = url.searchParams.get("shop");

  invariant(shopDomain, "No shop provided");

  const shopData = await getShopByDomain(shopDomain);
  if (!shopData) {
    return redirect(`/auth?shop=${shopDomain}`);
  }

  // In a real implementation, we would fetch this data from Shopify API
  // For now, we'll use mock data
  return json({
    shop: shopData,
    productCategories: [
      "All Products",
      "Clothing",
      "Electronics",
      "Home & Garden",
      "Beauty & Personal Care",
      "Smartphones",
      "Accessories"
    ],
    products: [
      "Gift Wrapping Service",
      "Premium Phone Case",
      "2-Year Extended Warranty",
      "Matching Accessories Bundle",
      "Express Shipping",
      "Product Protection Plan",
      "VIP Customer Service"
    ]
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name");
  const type = formData.get("type");
  const triggerProduct = formData.get("triggerProduct");
  const upsellProduct = formData.get("upsellProduct");
  const discountStr = formData.get("discount");
  const active = formData.get("active") === "on";
  const shopDomain = formData.get("shop");

  // Validate form data
  const errors: Record<string, string> = {};

  if (!name || typeof name !== "string" || name.trim() === "") {
    errors.name = "Name is required";
  }

  if (!type || typeof type !== "string" || type.trim() === "") {
    errors.type = "Type is required";
  }

  if (!triggerProduct || typeof triggerProduct !== "string" || triggerProduct.trim() === "") {
    errors.triggerProduct = "Trigger product is required";
  }

  if (!upsellProduct || typeof upsellProduct !== "string" || upsellProduct.trim() === "") {
    errors.upsellProduct = "Upsell product is required";
  }

  if (!shopDomain || typeof shopDomain !== "string") {
    errors.shop = "Shop is required";
  }

  // Parse discount as a number if provided
  let discount: number | null = null;
  if (discountStr && typeof discountStr === "string" && discountStr.trim() !== "") {
    const parsedDiscount = parseFloat(discountStr);
    if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
      errors.discount = "Discount must be a number between 0 and 100";
    } else {
      discount = parsedDiscount;
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

  // Create the upsell offer
  await createUpsellOffer({
    name: name as string,
    type: type as string,
    triggerCategory: triggerProduct === "All Products" ? null : triggerProduct as string,
    triggerProductId: null, // In a real app, we would use the actual product ID
    upsellProductId: upsellProduct as string,
    discount,
    active,
    shopId: shop.id
  });

  // Redirect back to the offers page
  return redirect(`/app/offers?shop=${shopDomain}`);
}

export default function NewOfferPage() {
  const { shop } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Create New Upsell Offer</h2>

      <div className="bg-white rounded-lg shadow-md p-6">
        <Form method="post" className="space-y-6">
          <input type="hidden" name="shop" value={shop.shopifyDomain} />
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Offer Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={actionData?.values?.name as string}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., Add Gift Wrapping"
            />
            {actionData?.errors?.name && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Offer Type
            </label>
            <select
              id="type"
              name="type"
              defaultValue={actionData?.values?.type as string}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a type</option>
              <option value="product">Product</option>
              <option value="service">Service</option>
              <option value="bundle">Bundle</option>
            </select>
            {actionData?.errors?.type && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.type}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="triggerProduct" className="block text-sm font-medium text-gray-700">
                Trigger Product/Category
              </label>
              <select
                id="triggerProduct"
                name="triggerProduct"
                defaultValue={actionData?.values?.triggerProduct as string}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a product or category</option>
                <option value="All Products">All Products</option>
                <option value="Clothing">Clothing</option>
                <option value="Electronics">Electronics</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                <option value="Smartphones">Smartphones</option>
                <option value="Accessories">Accessories</option>
              </select>
              {actionData?.errors?.triggerProduct && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.triggerProduct}</p>
              )}
            </div>

            <div>
              <label htmlFor="upsellProduct" className="block text-sm font-medium text-gray-700">
                Upsell Product
              </label>
              <select
                id="upsellProduct"
                name="upsellProduct"
                defaultValue={actionData?.values?.upsellProduct as string}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a product</option>
                <option value="Gift Wrapping Service">Gift Wrapping Service</option>
                <option value="Premium Phone Case">Premium Phone Case</option>
                <option value="2-Year Extended Warranty">2-Year Extended Warranty</option>
                <option value="Matching Accessories Bundle">Matching Accessories Bundle</option>
                <option value="Express Shipping">Express Shipping</option>
                <option value="Product Protection Plan">Product Protection Plan</option>
                <option value="VIP Customer Service">VIP Customer Service</option>
              </select>
              {actionData?.errors?.upsellProduct && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.upsellProduct}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="discount" className="block text-sm font-medium text-gray-700">
              Discount (optional)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
              <input
                type="number"
                id="discount"
                name="discount"
                min="0"
                max="100"
                defaultValue={actionData?.values?.discount as string}
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              name="active"
              defaultChecked={actionData?.values?.active === "on"}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
              Active (offer will be shown to customers)
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <a
              href="javascript:history.back()"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? "Creating..." : "Create Offer"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
