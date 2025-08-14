-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'ORGANIZER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
