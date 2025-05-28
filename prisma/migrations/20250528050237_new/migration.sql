/*
  Warnings:

  - You are about to drop the column `alternatePhoneNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `User` table. All the data in the column will be lost.
  - Added the required column `companyName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "alternatePhoneNumber",
DROP COLUMN "phoneNumber",
ADD COLUMN     "companyName" TEXT NOT NULL;
