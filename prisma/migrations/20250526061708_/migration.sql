/*
  Warnings:

  - You are about to drop the column `userId` on the `Country` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[countryId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `countryId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Country" DROP CONSTRAINT "Country_userId_fkey";

-- DropIndex
DROP INDEX "Country_userId_key";

-- AlterTable
ALTER TABLE "Country" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "countryId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_countryId_key" ON "User"("countryId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
