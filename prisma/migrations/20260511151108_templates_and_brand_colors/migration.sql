-- CreateEnum
CREATE TYPE "Template" AS ENUM ('SALGADERIA', 'DOCERIA', 'BOLARIA', 'PIZZARIA');

-- AlterTable
ALTER TABLE "establishments" ADD COLUMN     "accentColor" TEXT,
ADD COLUMN     "surfaceColor" TEXT,
ADD COLUMN     "template" "Template" NOT NULL DEFAULT 'SALGADERIA';
