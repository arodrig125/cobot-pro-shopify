import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";

// Simple loader that returns demo data
export async function loader() {
  return json({
    shop: {
      id: "demo-shop-1",
      shopifyDomain: "demo-shop.myshopify.com"
    }
  });
}

export default function AppLayout() {
  const { shop } = useLoaderData<typeof loader>();
  const shopDomain = shop.shopifyDomain;

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between bg-blue-600 p-4 text-white">
        <h1 className="text-3xl font-bold">Upsell Pro</h1>
        <div className="flex items-center">
          <span className="bg-yellow-400 text-blue-800 text-xs font-bold px-2 py-1 rounded mr-3">DEMO MODE</span>
          <p>Shop: {shopDomain}</p>
        </div>
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
