/*
  Warnings:

  - You are about to drop the column `idade` on the `Atleta` table. All the data in the column will be lost.
  - Added the required column `dataNascimento` to the `Atleta` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Atleta" DROP COLUMN "idade",
ADD COLUMN     "dataNascimento" TIMESTAMP(3) NOT NULL;
