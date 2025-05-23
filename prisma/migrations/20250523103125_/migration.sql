/*
  Warnings:

  - You are about to drop the column `mail` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `mail` on the `Server` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Developer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Server` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Developer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Developer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Server` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Server` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Developer" DROP COLUMN "mail",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Server" DROP COLUMN "mail",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Developer_userId_key" ON "Developer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Server_userId_key" ON "Server"("userId");

-- AddForeignKey
ALTER TABLE "Developer" ADD CONSTRAINT "Developer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
