import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { getShopByDomain } from "~/models/shop.server";
import { deleteUpsellOffer, getUpsellOffersByShopId, toggleUpsellOfferActive } from "~/models/upsell.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  invariant(shop, "No shop provided");

  const shopData = await getShopByDomain(shop);
  if (!shopData) {
    return redirect(`/auth?shop=${shop}`);
  }

  const offers = await getUpsellOffersByShopId(shopData.id);

  // Format offers for display
  const formattedOffers = offers.map(offer => {
    // Calculate conversion rate
    const impressions = offer.analytics?.impressions || 0;
    const conversions = offer.analytics?.conversions || 0;
    const conversionRate = impressions > 0
      ? ((conversions / impressions) * 100).toFixed(1) + "%"
      : "0%";

    return {
      id: offer.id,
      name: offer.name,
      type: offer.type,
      triggerProduct: offer.triggerCategory || "All Products",
      upsellProduct: offer.upsellProductId,
      active: offer.active,
      conversionRate
    };
  });

  return json({
    shop: shopData,
    offers: formattedOffers
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("action");
  const id = formData.get("id");
  const shopDomain = formData.get("shop");

  invariant(typeof id === "string", "ID must be provided");
  invariant(typeof shopDomain === "string", "Shop domain must be provided");

  // Get the shop to verify it exists
  const shop = await getShopByDomain(shopDomain);
  if (!shop) {
    return json({ success: false, error: "Shop not found" }, { status: 404 });
  }

  if (actionType === "toggle") {
    const offer = await getUpsellOffersByShopId(shop.id).then(
      offers => offers.find(o => o.id === id)
    );

    if (!offer) {
      return json({ success: false, error: "Offer not found" }, { status: 404 });
    }

    await toggleUpsellOfferActive({
      id,
      active: !offer.active
    });

    return json({ success: true });
  }

  if (actionType === "delete") {
    await deleteUpsellOffer(id);
    return json({ success: true });
  }

  return json({ success: false, error: "Invalid action" }, { status: 400 });
}

export default function OffersPage() {
  const { shop, offers } = useLoaderData<typeof loader>();
  const [filter, setFilter] = useState("all");

  const filteredOffers = filter === "all"
    ? offers
    : filter === "active"
      ? offers.filter(offer => offer.active)
      : offers.filter(offer => !offer.active);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Upsell Offers</h2>
        <Link
          to="new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create New Offer
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <button
            type="button"
            className={`pb-2 px-4 ${filter === 'all' ? 'border-b-2 border-blue-600 font-medium' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Offers
          </button>
          <button
            type="button"
            className={`pb-2 px-4 ${filter === 'active' ? 'border-b-2 border-blue-600 font-medium' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            type="button"
            className={`pb-2 px-4 ${filter === 'inactive' ? 'border-b-2 border-blue-600 font-medium' : ''}`}
            onClick={() => setFilter('inactive')}
          >
            Inactive
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upsell</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOffers.map((offer) => (
              <tr key={offer.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{offer.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{offer.type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{offer.triggerProduct}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{offer.upsellProduct}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Form method="post">
                    <input type="hidden" name="id" value={offer.id} />
                    <input type="hidden" name="action" value="toggle" />
                    <input type="hidden" name="shop" value={shop.shopifyDomain} />
                    <button
                      type="submit"
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        offer.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {offer.active ? 'Active' : 'Inactive'}
                    </button>
                  </Form>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{offer.conversionRate}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Link
                      to={`${offer.id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Link>
                    <Form method="post" className="inline">
                      <input type="hidden" name="id" value={offer.id} />
                      <input type="hidden" name="action" value="delete" />
                      <input type="hidden" name="shop" value={shop.shopifyDomain} />
                      <button
                        type="submit"
                        className="text-red-600 hover:text-red-900 ml-2"
                      >
                        Delete
                      </button>
                    </Form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
