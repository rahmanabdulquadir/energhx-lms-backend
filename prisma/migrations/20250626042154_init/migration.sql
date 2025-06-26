/*
  Warnings:

  - The values [BLOCKED,ACTIVE] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `status` on the `Admin` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('BASIC', 'STANDARD', 'CERTIFIED');
ALTER TABLE "Admin" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Developer" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Server" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TABLE "Developer" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TABLE "Server" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
ALTER TABLE "Developer" ALTER COLUMN "status" SET DEFAULT 'STANDARD';
ALTER TABLE "Server" ALTER COLUMN "status" SET DEFAULT 'STANDARD';
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'BASIC';
COMMIT;

-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "Developer" ALTER COLUMN "status" SET DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "Server" ALTER COLUMN "status" SET DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'BASIC';
