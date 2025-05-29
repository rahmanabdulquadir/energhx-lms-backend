-- AlterTable
ALTER TABLE "Developer" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';
