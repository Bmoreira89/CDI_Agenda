import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ym = searchParams.get('ym');

    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
      return NextResponse.json({ error: 'Parâmetro ym inválido. Use YYYY-MM.' }, { status: 400 });
    }

    const [y, m] = ym.split('-');
    const year = Number(y);
    const month0 = Number(m) - 1;

    const start = new Date(year, month0, 1);
    const end = new Date(year, month0 + 1, 0, 23, 59, 59, 999);

    const events = await prisma.event.findMany({
      where: {
        start: { gte: start },
        end: { lte: end }
      },
      orderBy: { start: "asc" }
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Eventos_${ym}`);

    ws.columns = [
      { header: "ID", key: "id", width: 15 },
      { header: "Título", key: "title", width: 40 },
      { header: "Início", key: "start", width: 25 },
      { header: "Fim", key: "end", width: 25 },
      { header: "Local", key: "city", width: 25 },
    ];

    events.forEach(ev => {
      ws.addRow({
        id: ev.id,
        title: ev.title,
        start: ev.start,
        end: ev.end,
        city: (ev as any).city || "",
      });
    });

    ws.getRow(1).font = { bold: true };

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="agenda_${ym}.xlsx"`
      }
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao exportar" }, { status: 500 });
  }
}
