/*
  Warnings:

  - Added the required column `courseId` to the `QuizInstance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QuizInstance" ADD COLUMN     "courseId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "QuizInstance" ADD CONSTRAINT "QuizInstance_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
