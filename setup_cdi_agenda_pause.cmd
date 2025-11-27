@echo off
setlocal ENABLEDELAYEDEXPANSION
title CDI_Agenda Setup (com pausa)

echo ==== CDI_Agenda Setup (Windows) ====
echo Executando a partir de: %CD%
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado no PATH.
  echo Instale: winget install OpenJS.NodeJS.LTS -s winget
  echo Depois feche e reabra este CMD.
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODEV=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPMV=%%i
echo Node: %NODEV%  |  npm: %NPMV%
echo.

echo [1/5] npm install
npm install || (echo Falha no npm install && goto :END)

echo [2/5] Prisma migrate
npx prisma migrate dev --name init || (echo Falha no prisma migrate && goto :END)

echo [3/5] Prisma seed
npx prisma db seed || (echo Falha no prisma db seed && goto :END)

if not exist ".env" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env"
    echo [4/5] .env criado
  )
)

echo [5/5] Iniciando servidor (CTRL+C para parar)...
npm run dev

:END
echo.
echo (Janela mantida aberta para revisar mensagens.)
pause
