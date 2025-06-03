/*
  Warnings:

  - The primary key for the `UserProgram` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `UserProgram` table. All the data in the column will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userProgramId_fkey";

-- AlterTable
ALTER TABLE "UserProgram" DROP CONSTRAINT "UserProgram_pkey",
DROP COLUMN "id",
ADD COLUMN     "invoiceUrl" TEXT,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "Payment";
