-- CreateTable
CREATE TABLE "SalmEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "registrationId" INTEGER NOT NULL,
    "dayId" INTEGER NOT NULL,
    "enteredAt" DATETIME NOT NULL,
    "mode" TEXT NOT NULL,
    "offline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalmEntry_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "SalmStudentRegistration" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalmEntry_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "SalmDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SalmStudentRegistration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "editionId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "studyLevel" TEXT NOT NULL,
    "badgeSeq" INTEGER NOT NULL,
    "verifyToken" TEXT NOT NULL,
    "downloadToken" TEXT NOT NULL,
    "nameSearch" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'online',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalmStudentRegistration_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "SalmEdition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SalmStudentRegistration" ("badgeSeq", "createdAt", "downloadToken", "editionId", "fullName", "id", "nameSearch", "phone", "studyLevel", "verifyToken") SELECT "badgeSeq", "createdAt", "downloadToken", "editionId", "fullName", "id", "nameSearch", "phone", "studyLevel", "verifyToken" FROM "SalmStudentRegistration";
DROP TABLE "SalmStudentRegistration";
ALTER TABLE "new_SalmStudentRegistration" RENAME TO "SalmStudentRegistration";
CREATE UNIQUE INDEX "SalmStudentRegistration_verifyToken_key" ON "SalmStudentRegistration"("verifyToken");
CREATE UNIQUE INDEX "SalmStudentRegistration_downloadToken_key" ON "SalmStudentRegistration"("downloadToken");
CREATE INDEX "SalmStudentRegistration_editionId_createdAt_idx" ON "SalmStudentRegistration"("editionId", "createdAt");
CREATE UNIQUE INDEX "SalmStudentRegistration_editionId_phone_key" ON "SalmStudentRegistration"("editionId", "phone");
CREATE UNIQUE INDEX "SalmStudentRegistration_editionId_badgeSeq_key" ON "SalmStudentRegistration"("editionId", "badgeSeq");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SalmEntry_dayId_enteredAt_idx" ON "SalmEntry"("dayId", "enteredAt");

-- CreateIndex
CREATE UNIQUE INDEX "SalmEntry_registrationId_dayId_key" ON "SalmEntry"("registrationId", "dayId");
