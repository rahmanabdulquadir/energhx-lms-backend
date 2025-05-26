/*
  Warnings:

  - You are about to drop the column `developerId` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `serverId` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Server` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Address` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_developerId_fkey";

-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_serverId_fkey";

-- DropIndex
DROP INDEX "Address_developerId_key";

-- DropIndex
DROP INDEX "Address_serverId_key";

-- AlterTable
ALTER TABLE "Address" DROP COLUMN "developerId",
DROP COLUMN "serverId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Developer" DROP COLUMN "firstName",
DROP COLUMN "gender",
DROP COLUMN "imageUrl",
DROP COLUMN "lastName",
DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "Server" DROP COLUMN "firstName",
DROP COLUMN "gender",
DROP COLUMN "imageUrl",
DROP COLUMN "lastName",
DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
DROP COLUMN "role",
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Address_userId_key" ON "Address"("userId");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
