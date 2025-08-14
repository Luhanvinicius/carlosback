-- CreateEnum
CREATE TYPE "FormatoPartida" AS ENUM ('SET_UNICO', 'ITF');

-- CreateTable
CREATE TABLE "Partida" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "local" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "atleta1Id" TEXT NOT NULL,
    "atleta2Id" TEXT NOT NULL,
    "gamesSet1" TEXT NOT NULL,
    "gamesSet2" TEXT,
    "tiebreak" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Partida_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_atleta1Id_fkey" FOREIGN KEY ("atleta1Id") REFERENCES "Atleta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_atleta2Id_fkey" FOREIGN KEY ("atleta2Id") REFERENCES "Atleta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
