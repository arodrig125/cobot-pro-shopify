import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

// Simple loader that returns demo data
export async function loader() {
  return json({
    stats: {
      totalUpsells: 5,
      activeUpsells: 3,
      conversionRate: "12.5%",
      additionalRevenue: "$1,250.00"
    }
  });
}

export default function AppIndex() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Welcome to Upsell Pro</h1>
        <p className="text-gray-600 mb-4">
          This is a demo deployment of the Upsell Pro app. To use the full app with database functionality,
          please set up proper environment variables in Vercel.
        </p>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Demo Mode Active</h2>
          <p className="text-yellow-700">
            This app is running in demo mode without a database connection. Features are limited.
          </p>
        </div>
      </div>

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
        <h3 className="text-xl font-semibold mb-4">Setup Instructions</h3>
        <div className="bg-gray-50 p-6 rounded-lg">
          <ol className="list-decimal list-inside space-y-2">
            <li>Create a Postgres database in Vercel (Storage tab)</li>
            <li>Set up environment variables in your Vercel project settings</li>
            <li>Add SESSION_SECRET, SHOPIFY_API_KEY, and other required variables</li>
            <li>Redeploy your application</li>
          </ol>

          <div className="mt-6">
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Vercel Dashboard
            </a>
          </div>
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
