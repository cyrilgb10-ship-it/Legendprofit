-- Ajouter le jour sans contrainte obligatoire au départ
ALTER TABLE "Task"
ADD COLUMN "dayOfWeek" INTEGER;

-- Donner une valeur temporaire aux tâches existantes
UPDATE "Task"
SET "dayOfWeek" = 1
WHERE "dayOfWeek" IS NULL;

-- Rendre le jour obligatoire
ALTER TABLE "Task"
ALTER COLUMN "dayOfWeek" SET NOT NULL;

-- Index unique sur le titre
CREATE UNIQUE INDEX "Task_title_key"
ON "Task"("title");

-- Index sur le jour de la semaine
CREATE INDEX "Task_dayOfWeek_idx"
ON "Task"("dayOfWeek");