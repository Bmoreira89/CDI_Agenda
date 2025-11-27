import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { nanoid } from 'nanoid';
import { readEvents, writeEvents } from '@/lib/store';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

  // Espera colunas: title, start, end, city, color, allDay
  const now = await readEvents();
  for (const r of rows) {
    if (!r.title || !r.start) continue;
    now.push({
      id: nanoid(),
      title: String(r.title),
      start: new Date(r.start).toISOString(),
      end: r.end ? new Date(r.end).toISOString() : undefined,
      city: r.city ? String(r.city) : undefined,
      color: r.color ? String(r.color) : undefined,
      allDay: String(r.allDay).toLowerCase() === 'true'
    });
  }
  await writeEvents(now);
  return NextResponse.json({ imported: rows.length });
}
