-- CreateTable
CREATE TABLE "Atleta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "idade" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Atleta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Atleta" ADD CONSTRAINT "Atleta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
