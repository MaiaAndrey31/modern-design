-- AlterTable
ALTER TABLE "StatementSection" ADD COLUMN     "backgroundImageId" TEXT;

-- AddForeignKey
ALTER TABLE "StatementSection" ADD CONSTRAINT "StatementSection_backgroundImageId_fkey" FOREIGN KEY ("backgroundImageId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
