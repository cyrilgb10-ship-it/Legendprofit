-- Ajouter la date de la tâche sans contrainte obligatoire au départ
ALTER TABLE "TaskSubmission"
ADD COLUMN "taskDate" DATE;

-- Donner aux anciennes soumissions leur date de création
UPDATE "TaskSubmission"
SET "taskDate" = "createdAt"::date
WHERE "taskDate" IS NULL;

-- Rendre la date obligatoire
ALTER TABLE "TaskSubmission"
ALTER COLUMN "taskDate" SET NOT NULL;

-- Supprimer l'ancienne contrainte
DROP INDEX "TaskSubmission_userId_taskId_key";

-- Nouvelle contrainte : une seule soumission par utilisateur, tâche et jour
CREATE UNIQUE INDEX "TaskSubmission_userId_taskId_taskDate_key"
ON "TaskSubmission"("userId", "taskId", "taskDate");

-- Index pour rechercher rapidement les tâches d'un jour
CREATE INDEX "TaskSubmission_taskDate_idx"
ON "TaskSubmission"("taskDate");