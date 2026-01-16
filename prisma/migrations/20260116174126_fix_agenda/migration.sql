/*
  Warnings:

  - You are about to drop the `Cidade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Evento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Evento" DROP CONSTRAINT "Evento_medicoId_fkey";

-- DropTable
DROP TABLE "Cidade";

-- DropTable
DROP TABLE "Evento";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "MedicoAgenda" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "crm" TEXT,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" TEXT NOT NULL DEFAULT 'medico',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicoAgenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CidadeAgenda" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "CidadeAgenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoAgenda" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "cidade" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "medicoId" INTEGER NOT NULL,
    "medicoNome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoAgenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogAcao" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER,
    "acao" TEXT NOT NULL,
    "detalhes" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAcao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicoAgenda_email_key" ON "MedicoAgenda"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CidadeAgenda_nome_key" ON "CidadeAgenda"("nome");

-- AddForeignKey
ALTER TABLE "EventoAgenda" ADD CONSTRAINT "EventoAgenda_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "MedicoAgenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAcao" ADD CONSTRAINT "LogAcao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "MedicoAgenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
