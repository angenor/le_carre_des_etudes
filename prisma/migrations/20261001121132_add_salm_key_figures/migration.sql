-- CreateTable
CREATE TABLE "SalmKeyFigure" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- Chiffres clés de départ (modifiables dans le back-office : SALM › Chiffres clés)
INSERT INTO "SalmKeyFigure" ("value", "label", "sortOrder", "updatedAt") VALUES
  ('+ de 2 000', 'étudiants participants lors de nos salons en Côte d''Ivoire', 0, CURRENT_TIMESTAMP),
  ('+ 250', 'étudiants orientés vers les universités exposantes chaque année', 1, CURRENT_TIMESTAMP),
  ('+ 200', 'bourses d''études octroyées', 2, CURRENT_TIMESTAMP);
