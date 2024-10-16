/*
  Warnings:

  - You are about to drop the `_BookmarksToMangaManhwa` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,mangaManhwaId]` on the table `Bookmarks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mangaManhwaId` to the `Bookmarks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_BookmarksToMangaManhwa" DROP CONSTRAINT "_BookmarksToMangaManhwa_A_fkey";

-- DropForeignKey
ALTER TABLE "_BookmarksToMangaManhwa" DROP CONSTRAINT "_BookmarksToMangaManhwa_B_fkey";

-- AlterTable
ALTER TABLE "Bookmarks" ADD COLUMN     "mangaManhwaId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_BookmarksToMangaManhwa";

-- CreateIndex
CREATE UNIQUE INDEX "Bookmarks_userId_mangaManhwaId_key" ON "Bookmarks"("userId", "mangaManhwaId");

-- AddForeignKey
ALTER TABLE "Bookmarks" ADD CONSTRAINT "Bookmarks_mangaManhwaId_fkey" FOREIGN KEY ("mangaManhwaId") REFERENCES "MangaManhwa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
