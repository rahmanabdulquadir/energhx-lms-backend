/*
  Warnings:

  - A unique constraint covering the columns `[stateId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stateId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "State_countryId_key";

-- AlterTable
ALTER TABLE "State" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stateId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_stateId_key" ON "User"("stateId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
