import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getShopByDomain } from "~/models/shop.server";
import { getActiveUpsellOffersByShopId, getUpsellOffersByShopId } from "~/models/upsell.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  invariant(shop, "No shop provided");

  const shopData = await getShopByDomain(shop);
  if (!shopData) {
    return redirect(`/auth?shop=${shop}`);
  }

  const allOffers = await getUpsellOffersByShopId(shopData.id);
  const activeOffers = await getActiveUpsellOffersByShopId(shopData.id);

  // Calculate conversion rate and revenue
  let totalImpressions = 0;
  let totalConversions = 0;
  let totalRevenue = 0;

  allOffers.forEach(offer => {
    if (offer.analytics) {
      totalImpressions += offer.analytics.impressions;
      totalConversions += offer.analytics.conversions;
      totalRevenue += offer.analytics.revenue;
    }
  });

  const conversionRate = totalImpressions > 0
    ? ((totalConversions / totalImpressions) * 100).toFixed(1) + "%"
    : "0%";

  return json({
    shop: shopData,
    stats: {
      totalUpsells: allOffers.length,
      activeUpsells: activeOffers.length,
      conversionRate,
      additionalRevenue: `$${totalRevenue.toFixed(2)}`
    }
  });
}

export default function AppIndex() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Upsell Offers"
          value={stats.totalUpsells.toString()}
          icon="📊"
        />
        <StatCard
          title="Active Offers"
          value={stats.activeUpsells.toString()}
          icon="✅"
        />
        <StatCard
          title="Conversion Rate"
          value={stats.conversionRate}
          icon="📈"
        />
        <StatCard
          title="Additional Revenue"
          value={stats.additionalRevenue}
          icon="💰"
        />
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Quick Start Guide</h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <ol className="list-decimal list-inside space-y-2">
            <li>Create your first upsell offer in the <strong>Upsell Offers</strong> section</li>
            <li>Configure when and where your offers should appear</li>
            <li>Customize the appearance of your upsell offers</li>
            <li>Test your upsell flow in your store</li>
            <li>Monitor performance and optimize your offers</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
    </div>
  );
}
