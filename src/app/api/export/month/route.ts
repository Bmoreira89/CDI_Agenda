import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from "@/lib/prisma"
import * as XLSX from 'xlsx'

/**
 * GET /api/export/month?year=2025&month=10
 * - Se ADMIN: exporta todos os eventos do mês
 * - Se MÉDICO: exporta apenas os eventos do próprio usuário
 * Saída: arquivo .xlsx
 */
export async function GET(req: NextRequest) {
  // sessão como any para não travar o build por tipagem
  const session: any = await getServerSession(authOptions as any)
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const year = Number(url.searchParams.get('year')) || new Date().getFullYear()
  const month = Number(url.searchParams.get('month')) || (new Date().getMonth() + 1)

  // janela [start, end) do mês
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0))

  const isAdmin = (session.user as any)?.role === 'ADMIN'

  // filtro: admin pega tudo; médico filtra por userId
  const where: any = {
    start: {
      gte: start,
      lt: end,
    },
  }
  if (!isAdmin) {
    where.userId = session.user.id
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: [{ start: 'asc' }],
    include: {
      user: { select: { name: true } },
    },
    take: 2000, // limite saudável pra export
  })

  // monta planilha
  // cabeçalho
  const rows: any[] = [
    ['Data', 'Cidade', 'Pacientes', 'Médico', 'Observação', 'Anexo'],
  ]

  for (const e of events) {
    rows.push([
      // ISO sem hora para ficar legível
      new Date(e.start).toISOString().slice(0, 10),
      e.origem ?? '',
      e.examsQty ?? 0,
      e.user?.name ?? '',
      e.observacao ?? '',
      e.attachmentUrl ? 'sim' : '-',
    ])
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Eventos')

  // escreve em Buffer e converte para Uint8Array (BodyInit aceito)
  const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as unknown as Buffer
  const body = new Uint8Array(buf) // <- aqui está o pulo do gato

  const ym = String(year) + '-' + String(month).padStart(2, '0')
  const filename = `export_${ym}.xlsx`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
