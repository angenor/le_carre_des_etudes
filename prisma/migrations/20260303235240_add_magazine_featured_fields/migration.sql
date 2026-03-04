-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Magazine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "subtitle" TEXT,
    "pdfPath" TEXT NOT NULL,
    "coverImage" TEXT,
    "publishedAt" DATETIME NOT NULL,
    "availableAt" DATETIME,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Magazine" ("coverImage", "createdAt", "description", "id", "name", "pdfPath", "publishedAt", "updatedAt", "version") SELECT "coverImage", "createdAt", "description", "id", "name", "pdfPath", "publishedAt", "updatedAt", "version" FROM "Magazine";
DROP TABLE "Magazine";
ALTER TABLE "new_Magazine" RENAME TO "Magazine";
CREATE UNIQUE INDEX "Magazine_version_key" ON "Magazine"("version");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
