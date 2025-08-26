/*
  Warnings:

  - A unique constraint covering the columns `[usuarioId]` on the table `Atleta` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Atleta_usuarioId_key" ON "Atleta"("usuarioId");
