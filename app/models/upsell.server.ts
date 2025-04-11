import type { Shop, UpsellOffer } from "@prisma/client";
import { prisma } from "~/db.server";

export type { UpsellOffer } from "@prisma/client";

export async function getUpsellOfferById(id: UpsellOffer["id"]) {
  return prisma.upsellOffer.findUnique({
    where: { id },
    include: { analytics: true },
  });
}

export async function getUpsellOffersByShopId(shopId: Shop["id"]) {
  return prisma.upsellOffer.findMany({
    where: { shopId },
    include: { analytics: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveUpsellOffersByShopId(shopId: Shop["id"]) {
  return prisma.upsellOffer.findMany({
    where: { 
      shopId,
      active: true 
    },
    include: { analytics: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUpsellOffer({
  name,
  type,
  triggerProductId,
  triggerCategory,
  upsellProductId,
  discount,
  active,
  shopId,
}: Pick<UpsellOffer, "name" | "type" | "triggerProductId" | "triggerCategory" | "upsellProductId" | "discount" | "active"> & {
  shopId: Shop["id"];
}) {
  return prisma.upsellOffer.create({
    data: {
      name,
      type,
      triggerProductId,
      triggerCategory,
      upsellProductId,
      discount,
      active,
      shop: {
        connect: {
          id: shopId,
        },
      },
      analytics: {
        create: {
          // Initialize analytics
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
        },
      },
    },
    include: { analytics: true },
  });
}

export async function updateUpsellOffer({
  id,
  name,
  type,
  triggerProductId,
  triggerCategory,
  upsellProductId,
  discount,
  active,
}: Pick<UpsellOffer, "id" | "name" | "type" | "triggerProductId" | "triggerCategory" | "upsellProductId" | "discount" | "active">) {
  return prisma.upsellOffer.update({
    where: { id },
    data: {
      name,
      type,
      triggerProductId,
      triggerCategory,
      upsellProductId,
      discount,
      active,
    },
    include: { analytics: true },
  });
}

export async function toggleUpsellOfferActive({
  id,
  active,
}: Pick<UpsellOffer, "id" | "active">) {
  return prisma.upsellOffer.update({
    where: { id },
    data: { active },
  });
}

export async function deleteUpsellOffer(id: UpsellOffer["id"]) {
  return prisma.upsellOffer.delete({
    where: { id },
  });
}

export async function updateOfferAnalytics({
  upsellOfferId,
  impressions = 0,
  clicks = 0,
  conversions = 0,
  revenue = 0,
}: {
  upsellOfferId: UpsellOffer["id"];
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
}) {
  return prisma.offerAnalytics.update({
    where: { upsellOfferId },
    data: {
      impressions: { increment: impressions },
      clicks: { increment: clicks },
      conversions: { increment: conversions },
      revenue: { increment: revenue },
    },
  });
}
