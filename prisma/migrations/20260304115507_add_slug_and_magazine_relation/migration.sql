/*
  Warnings:

  - Added the required column `slug` to the `Magazine` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContentItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "content" TEXT,
    "subtitle" TEXT,
    "eventDate" DATETIME,
    "eventLocation" TEXT,
    "imagePath" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "magazineId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentItem_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ContentItem" ("content", "createdAt", "description", "eventDate", "eventLocation", "id", "imagePath", "order", "subtitle", "title", "type", "updatedAt") SELECT "content", "createdAt", "description", "eventDate", "eventLocation", "id", "imagePath", "order", "subtitle", "title", "type", "updatedAt" FROM "ContentItem";
DROP TABLE "ContentItem";
ALTER TABLE "new_ContentItem" RENAME TO "ContentItem";
CREATE TABLE "new_Magazine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitle" TEXT,
    "pdfPath" TEXT NOT NULL,
    "coverImage" TEXT,
    "coverImageOg" TEXT,
    "publishedAt" DATETIME NOT NULL,
    "availableAt" DATETIME,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Magazine" ("availableAt", "coverImage", "coverImageOg", "createdAt", "description", "id", "isFeatured", "name", "pdfPath", "publishedAt", "subtitle", "updatedAt", "version", "slug")
SELECT "availableAt", "coverImage", "coverImageOg", "createdAt", "description", "id", "isFeatured", "name", "pdfPath", "publishedAt", "subtitle", "updatedAt", "version",
  LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE("version", '°', ''), ' ', '-'), '''', ''), '.', '-'), '--', '-'), 'é', 'e'))
FROM "Magazine";
DROP TABLE "Magazine";
ALTER TABLE "new_Magazine" RENAME TO "Magazine";
CREATE UNIQUE INDEX "Magazine_version_key" ON "Magazine"("version");
CREATE UNIQUE INDEX "Magazine_slug_key" ON "Magazine"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
