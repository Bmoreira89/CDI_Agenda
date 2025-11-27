import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import * as XLSX from 'xlsx'

/**
 * GET /api/export?year=YYYY&month=MM
 * - Se ADMIN: exporta todos os eventos do mês
 * - Se MÉDICO: exporta apenas eventos do próprio usuário
 * Caso não informe year/month, usa o mês atual.
 */
export async function GET(req: NextRequest) {
  // Tipagem relaxada para não travar o build
  const session: any = await getServerSession(authOptions as any)
  if (!session?.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const now = new Date()
  const year = Number(url.searchParams.get('year')) || now.getFullYear()
  const month = Number(url.searchParams.get('month')) || (now.getMonth() + 1)

  // Janela do mês [start, end)
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0))

  const isAdmin = (session.user as any)?.role === 'ADMIN'

  const where: any = { start: { gte: start, lt: end } }
  if (!isAdmin) where.userId = session.user.id

  const events = await prisma.event.findMany({
    where,
    orderBy: [{ start: 'asc' }],
    include: { user: { select: { name: true } } },
    take: 2000,
  })

  const rows: any[] = [
    ['Data', 'Cidade', 'Pacientes', 'Médico', 'Observação', 'Anexo'],
  ]
  for (const e of events) {
    rows.push([
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

  // Gera Buffer e converte para Uint8Array (BodyInit aceito pelo NextResponse)
  const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as unknown as Buffer
  const body = new Uint8Array(buf)

  const ym = `${year}-${String(month).padStart(2, '0')}`
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
