import { LoaderFunctionArgs, redirect } from "@remix-run/node";

/**
 * This route handles redirects from the root path to the appropriate destination
 * based on authentication status and other factors.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Get the shop parameter if it exists
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  // If a shop parameter is provided, redirect to the app
  if (shop) {
    return redirect(`/app?shop=${shop}`);
  }
  
  // Otherwise, redirect to the landing page
  return redirect("/");
}

// No component needed as we're just redirecting
export default function IndexRoute() {
  return null;
}
