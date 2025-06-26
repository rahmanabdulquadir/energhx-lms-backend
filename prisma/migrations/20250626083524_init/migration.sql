-- CreateEnum
CREATE TYPE "UserLevel" AS ENUM ('BASIC', 'ADMIN', 'STANDARD', 'CERTIFIED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "level" "UserLevel" NOT NULL DEFAULT 'BASIC';
