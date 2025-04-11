import type { Shop, ShopSettings } from "@prisma/client";
import { prisma } from "~/db.server";

export type { ShopSettings } from "@prisma/client";

export async function getShopSettings(shopId: Shop["id"]) {
  return prisma.shopSettings.findUnique({
    where: { shopId },
  });
}

export async function updateShopSettings({
  shopId,
  displayLocation,
  maxOffersPerPage,
  offerStyle,
  autoApplyDiscount,
  showDiscountBadge,
  enableAnalytics,
}: Pick<ShopSettings, "displayLocation" | "maxOffersPerPage" | "offerStyle" | "autoApplyDiscount" | "showDiscountBadge" | "enableAnalytics"> & {
  shopId: Shop["id"];
}) {
  return prisma.shopSettings.update({
    where: { shopId },
    data: {
      displayLocation,
      maxOffersPerPage,
      offerStyle,
      autoApplyDiscount,
      showDiscountBadge,
      enableAnalytics,
    },
  });
}
