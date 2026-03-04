-- CreateTable
CREATE TABLE "HomepageImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "HomepageImage_slug_key" ON "HomepageImage"("slug");
