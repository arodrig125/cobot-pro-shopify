import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { shopify } from "~/lib/shopify.server";
import invariant from "tiny-invariant";
import { createShop, getShopByDomain, updateShopToken } from "~/models/shop.server";
import { getUserByEmail } from "~/models/user.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  invariant(shop, "No shop provided");

  try {
    // Complete the OAuth process
    const callbackResponse = await shopify.auth.callback({
      rawRequest: request,
    });

    // Get the session
    const session = callbackResponse.session;

    // Check if the shop already exists in our database
    let shopData = await getShopByDomain(shop);

    if (shopData) {
      // Update the access token
      await updateShopToken({
        shopifyDomain: shop,
        accessToken: session.accessToken,
      });
    } else {
      // Create a new shop record
      // First, get or create a user
      const email = `${shop.replace(/\./g, "-")}@example.com`; // Generate a placeholder email
      let user = await getUserByEmail(email);

      if (!user) {
        // In a real app, we would create a proper user account
        // For now, we'll just use a placeholder
        // This would typically involve a signup flow
        console.log("Would create a user here");
      }

      // For demo purposes, we'll use the first user in the database
      if (!user) {
        user = await getUserByEmail("rachel@remix.run");
      }

      invariant(user, "No user found to associate with shop");

      // Create the shop
      shopData = await createShop({
        shopifyDomain: shop,
        accessToken: session.accessToken,
        userId: user.id,
      });
    }

    // Redirect to the app home page
    return redirect(`/app?shop=${shop}`);
  } catch (error) {
    console.error("Error during auth callback:", error);
    return redirect(`/auth?shop=${shop}&error=callback_error`);
  }
}
