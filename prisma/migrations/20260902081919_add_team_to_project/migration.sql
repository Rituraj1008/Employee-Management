-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "team_id" TEXT;

-- CreateIndex
CREATE INDEX "projects_team_id_idx" ON "projects"("team_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
