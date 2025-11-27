# CDI Agenda — Starter (Next.js + SQLite + Prisma + NextAuth + FullCalendar)

Este pacote é um **projeto base** já organizado para você colocar no caminho:
`C:\Users\bruno\OneDrive\Área de Trabalho\CDI 5\CDI_Agenda`

## 🚀 Passos para rodar (Windows)

1) Abra um terminal na pasta `CDI_Agenda` (esta pasta do projeto).
2) Instale as dependências:
   ```bash
   npm install
   ```
3) Crie o banco e rode as migrações do Prisma:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
4) Copie `.env.example` para `.env` e ajuste, se necessário:
   - `NEXTAUTH_SECRET` gere um segredo com: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `NEXTAUTH_URL` deixe `http://localhost:3000`
5) Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

Login inicial (criado pelo seed):
- **Admin**: `admin@cuesta.com` / `admin123`
- **Médico**: `medico@cuesta.com` / `medico123`

## 📦 O que vem pronto
- Next.js (App Router) + Tailwind
- Auth com NextAuth (Credentials) + Prisma
- SQLite local (`agenda.db`)
- Calendário com FullCalendar (views mês/semana, criar/editar/remover)
- API de eventos com filtro por usuário (médico só vê os próprios; admin vê todos)
- Middleware protegendo `/calendario` e `/admin`

## 🧭 Rotas
- `/login` — login (email/senha)
- `/calendario` — visão do médico (criar/editar eventos)
- `/admin` — visão geral (todos os eventos)

## 🛠️ Scripts úteis
- `npm run dev` — servidor dev
- `npm run build && npm start` — produção
- `npx prisma studio` — abrir GUI do banco

Qualquer ajuste vamos iterando. 😉
