import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { shopify } from "~/lib/shopify.server";
import invariant from "tiny-invariant";
import { getShopByDomain } from "~/models/shop.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shopDomain = url.searchParams.get("shop");

  invariant(shopDomain, "No shop provided");

  // Verify the shop is authenticated
  try {
    // Check if we have a session in Shopify
    const sessionId = await shopify.session.getOfflineId(shopDomain);
    if (!sessionId) {
      return redirect(`/auth?shop=${shopDomain}`);
    }

    // Get the shop from our database
    const shopData = await getShopByDomain(shopDomain);
    if (!shopData) {
      return redirect(`/auth?shop=${shopDomain}`);
    }

    return json({ shop: shopData });
  } catch (error) {
    console.error("Error verifying shop:", error);
    return redirect(`/auth?shop=${shopDomain}`);
  }
}

export default function AppLayout() {
  const { shop } = useLoaderData<typeof loader>();
  const shopDomain = shop.shopifyDomain;

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-blue-600 p-4 text-white">
        <h1 className="text-3xl font-bold">Upsell Pro</h1>
        <p>Shop: {shopDomain}</p>
      </header>

      <main className="flex h-full bg-white">
        <div className="h-full w-64 border-r bg-gray-50">
          <nav>
            <ul className="p-4">
              <li className="mb-2">
                <Link
                  to={`/app?shop=${shopDomain}`}
                  className="block rounded-md p-2 hover:bg-gray-200"
                >
                  Dashboard
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to={`/app/offers?shop=${shopDomain}`}
                  className="block rounded-md p-2 hover:bg-gray-200"
                >
                  Upsell Offers
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to={`/app/settings?shop=${shopDomain}`}
                  className="block rounded-md p-2 hover:bg-gray-200"
                >
                  Settings
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to={`/app/integrations?shop=${shopDomain}`}
                  className="block rounded-md p-2 hover:bg-gray-200"
                >
                  Integrations
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
