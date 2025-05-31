/*
  Warnings:

  - You are about to drop the column `userId` on the `Program` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Program" DROP CONSTRAINT "Program_userId_fkey";

-- AlterTable
ALTER TABLE "Program" DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "UserProgram" (
    "id" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "UserProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userProgramId" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProgram_userId_programId_key" ON "UserProgram"("userId", "programId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_userProgramId_key" ON "Payment"("userProgramId");

-- AddForeignKey
ALTER TABLE "UserProgram" ADD CONSTRAINT "UserProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgram" ADD CONSTRAINT "UserProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userProgramId_fkey" FOREIGN KEY ("userProgramId") REFERENCES "UserProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
