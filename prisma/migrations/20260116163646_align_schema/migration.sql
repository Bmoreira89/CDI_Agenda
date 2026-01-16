/*
  Warnings:

  - You are about to drop the `CidadeAgenda` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventoAgenda` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MedicoAgenda` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventoAgenda" DROP CONSTRAINT "EventoAgenda_medicoId_fkey";

-- DropForeignKey
ALTER TABLE "LogAcao" DROP CONSTRAINT "LogAcao_usuarioId_fkey";

-- DropTable
DROP TABLE "CidadeAgenda";

-- DropTable
DROP TABLE "EventoAgenda";

-- DropTable
DROP TABLE "MedicoAgenda";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "crm" TEXT,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" TEXT NOT NULL DEFAULT 'medico',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cidade" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Cidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cidade" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "medicoId" INTEGER NOT NULL,
    "medicoNome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cidade_nome_key" ON "Cidade"("nome");

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAcao" ADD CONSTRAINT "LogAcao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
