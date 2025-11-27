import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export type CalendarEvent = {
  id?: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  city?: string;
  color?: string;
  allDay?: boolean;
};

export async function listEventsInRange(start: Date, end: Date): Promise<CalendarEvent[]> {
  try {
    console.log('📅 Buscando eventos de', start.toISOString(), 'a', end.toISOString());
    const events = await prisma.event.findMany({
      where: {
        start: { gte: start },
        end: { lte: end },
      },
      orderBy: { start: 'asc' },
    });

    // Mapeia pro formato usado no calendário e no Excel
    return events.map(ev => ({
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end,
      city: (ev as any).city || '',
      color: (ev as any).color || '',
      allDay: !!(ev as any).allDay,
    }));
  } catch (err) {
    console.error('❌ Erro ao buscar eventos:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}
