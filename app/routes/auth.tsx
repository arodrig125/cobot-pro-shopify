import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { createNewOfflineSession, shopify } from "~/lib/shopify.server";
import invariant from "tiny-invariant";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  invariant(shop, "No shop provided");
  
  try {
    // Start the OAuth process
    const authUrl = await createNewOfflineSession(shop);
    return redirect(authUrl);
  } catch (error) {
    console.error("Error during auth:", error);
    return redirect(`/?error=auth_error`);
  }
}
