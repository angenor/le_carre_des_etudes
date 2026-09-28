-- CreateTable
CREATE TABLE "SalmEdition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "salonName" TEXT NOT NULL DEFAULT 'Salon International des Licences et Masters de Côte d''Ivoire',
    "tagline" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Abidjan',
    "venue" TEXT,
    "organizerName" TEXT NOT NULL,
    "whyTitle" TEXT,
    "whyText" TEXT,
    "audiences" JSONB NOT NULL DEFAULT [],
    "contacts" JSONB NOT NULL DEFAULT [],
    "posterPath" TEXT,
    "posterAlt" TEXT,
    "recapVideoUrl" TEXT,
    "recapPosterPath" TEXT,
    "programPdfPath" TEXT,
    "studentRegistrationOpen" BOOLEAN NOT NULL DEFAULT false,
    "schoolRegistrationOpen" BOOLEAN NOT NULL DEFAULT false,
    "lastBadgeSeq" INTEGER NOT NULL DEFAULT 0,
    "personalDataPurgedAt" DATETIME,
    "purgedStats" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SalmDay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "editionId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "opensAt" TEXT NOT NULL,
    "closesAt" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SalmDay_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "SalmEdition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalmSlot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dayId" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SalmSlot_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "SalmDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalmHighlight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "editionId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SalmHighlight_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "SalmEdition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalmVideo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "editionId" INTEGER NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "title" TEXT,
    "guest" TEXT,
    "institution" TEXT,
    "thumbnailPath" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SalmVideo_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "SalmEdition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalmPhoto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "editionId" INTEGER NOT NULL,
    "imagePath" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SalmPhoto_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "SalmEdition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalmStandType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "editionId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceLabel" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SalmStandType_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "SalmEdition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalmStudentRegistration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "editionId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "studyLevel" TEXT NOT NULL,
    "badgeSeq" INTEGER NOT NULL,
    "verifyToken" TEXT NOT NULL,
    "downloadToken" TEXT NOT NULL,
    "nameSearch" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalmStudentRegistration_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "SalmEdition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalmSchoolRegistration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "editionId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "programmes" JSONB NOT NULL,
    "otherProgramme" TEXT,
    "exhibitors" JSONB NOT NULL,
    "standTypeId" INTEGER NOT NULL,
    "question" TEXT,
    "status" TEXT NOT NULL DEFAULT 'nouvelle',
    "internalNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalmSchoolRegistration_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "SalmEdition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalmSchoolRegistration_standTypeId_fkey" FOREIGN KEY ("standTypeId") REFERENCES "SalmStandType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SalmEdition_year_key" ON "SalmEdition"("year");

-- CreateIndex
CREATE UNIQUE INDEX "SalmDay_editionId_date_key" ON "SalmDay"("editionId", "date");

-- CreateIndex
CREATE INDEX "SalmSlot_dayId_sortOrder_idx" ON "SalmSlot"("dayId", "sortOrder");

-- CreateIndex
CREATE INDEX "SalmHighlight_editionId_sortOrder_idx" ON "SalmHighlight"("editionId", "sortOrder");

-- CreateIndex
CREATE INDEX "SalmVideo_editionId_sortOrder_idx" ON "SalmVideo"("editionId", "sortOrder");

-- CreateIndex
CREATE INDEX "SalmPhoto_editionId_sortOrder_idx" ON "SalmPhoto"("editionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SalmStandType_editionId_name_key" ON "SalmStandType"("editionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SalmStudentRegistration_verifyToken_key" ON "SalmStudentRegistration"("verifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "SalmStudentRegistration_downloadToken_key" ON "SalmStudentRegistration"("downloadToken");

-- CreateIndex
CREATE INDEX "SalmStudentRegistration_editionId_createdAt_idx" ON "SalmStudentRegistration"("editionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SalmStudentRegistration_editionId_phone_key" ON "SalmStudentRegistration"("editionId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "SalmStudentRegistration_editionId_badgeSeq_key" ON "SalmStudentRegistration"("editionId", "badgeSeq");

-- CreateIndex
CREATE INDEX "SalmSchoolRegistration_editionId_status_idx" ON "SalmSchoolRegistration"("editionId", "status");

-- CreateIndex
CREATE INDEX "SalmSchoolRegistration_editionId_createdAt_idx" ON "SalmSchoolRegistration"("editionId", "createdAt");
