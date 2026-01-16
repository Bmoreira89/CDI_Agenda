/*
  Warnings:

  - You are about to drop the `LogAcao` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LogAcao" DROP CONSTRAINT "LogAcao_usuarioId_fkey";

-- DropTable
DROP TABLE "LogAcao";
