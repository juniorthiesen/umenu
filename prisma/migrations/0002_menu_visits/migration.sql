-- CreateTable
CREATE TABLE "menu_visits" (
    "id" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "source" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_visits_establishmentId_createdAt_idx" ON "menu_visits"("establishmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "menu_visits" ADD CONSTRAINT "menu_visits_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
