-- CreateTable
CREATE TABLE "PermissaoAgenda" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermissaoAgenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PermissaoAgenda_email_cidade_key" ON "PermissaoAgenda"("email", "cidade");
