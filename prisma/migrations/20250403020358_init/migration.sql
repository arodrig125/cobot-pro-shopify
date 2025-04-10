-- CreateTable
CREATE TABLE "UpsellRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "triggerProductId" TEXT NOT NULL,
    "upsellProductId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
