/*
  Warnings:

  - You are about to drop the column `formato` on the `Partida` table. All the data in the column will be lost.
  - You are about to drop the column `gamesSet1` on the `Partida` table. All the data in the column will be lost.
  - You are about to drop the column `gamesSet2` on the `Partida` table. All the data in the column will be lost.
  - You are about to drop the column `tiebreak` on the `Partida` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Partida` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Partida" DROP COLUMN "formato",
DROP COLUMN "gamesSet1",
DROP COLUMN "gamesSet2",
DROP COLUMN "tiebreak",
ADD COLUMN     "atleta3Id" TEXT,
ADD COLUMN     "atleta4Id" TEXT,
ADD COLUMN     "gamesTime1" INTEGER,
ADD COLUMN     "gamesTime2" INTEGER,
ADD COLUMN     "supertiebreakTime1" INTEGER,
ADD COLUMN     "supertiebreakTime2" INTEGER,
ADD COLUMN     "tiebreakTime1" INTEGER,
ADD COLUMN     "tiebreakTime2" INTEGER,
ADD COLUMN     "torneioId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Torneio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),

    CONSTRAINT "Torneio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_atleta3Id_fkey" FOREIGN KEY ("atleta3Id") REFERENCES "Atleta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_atleta4Id_fkey" FOREIGN KEY ("atleta4Id") REFERENCES "Atleta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_torneioId_fkey" FOREIGN KEY ("torneioId") REFERENCES "Torneio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
