import type { Shop, User } from "@prisma/client";
import { prisma } from "~/db.server";

export type { Shop } from "@prisma/client";

export async function getShopByDomain(shopifyDomain: Shop["shopifyDomain"]) {
  return prisma.shop.findUnique({
    where: { shopifyDomain },
    include: { settings: true }
  });
}

export async function getShopById(id: Shop["id"]) {
  return prisma.shop.findUnique({
    where: { id },
    include: { settings: true }
  });
}

export async function createShop({
  shopifyDomain,
  accessToken,
  userId,
}: Pick<Shop, "shopifyDomain" | "accessToken"> & {
  userId: User["id"];
}) {
  return prisma.shop.create({
    data: {
      shopifyDomain,
      accessToken,
      user: {
        connect: {
          id: userId,
        },
      },
      settings: {
        create: {
          // Default settings
          displayLocation: "cart_page",
          maxOffersPerPage: 2,
          offerStyle: "modal",
          autoApplyDiscount: true,
          showDiscountBadge: true,
          enableAnalytics: true,
        },
      },
    },
    include: { settings: true },
  });
}

export async function updateShopToken({
  shopifyDomain,
  accessToken,
}: Pick<Shop, "shopifyDomain" | "accessToken">) {
  return prisma.shop.update({
    where: { shopifyDomain },
    data: { accessToken },
  });
}

export async function getShopsByUserId(userId: User["id"]) {
  return prisma.shop.findMany({
    where: { userId },
    include: { settings: true },
  });
}
