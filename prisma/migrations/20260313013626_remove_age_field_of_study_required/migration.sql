-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Download" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "studyLevel" TEXT NOT NULL,
    "age" INTEGER,
    "fieldOfStudy" TEXT,
    "magazineId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Download_magazineId_fkey" FOREIGN KEY ("magazineId") REFERENCES "Magazine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Download" ("age", "contact", "createdAt", "fieldOfStudy", "fullName", "id", "magazineId", "studyLevel") SELECT "age", "contact", "createdAt", "fieldOfStudy", "fullName", "id", "magazineId", "studyLevel" FROM "Download";
DROP TABLE "Download";
ALTER TABLE "new_Download" RENAME TO "Download";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
