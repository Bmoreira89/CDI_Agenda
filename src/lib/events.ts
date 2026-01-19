import prisma from "@/lib/prisma";

export type CalendarEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  descricao?: string;
  medicoId: number;
  medicoNome: string;
  cidade: string;
  quantidade: number;
};

export async function listarEventos(): Promise<CalendarEvent[]> {
  const eventos = await prisma.eventoAgenda.findMany({
    orderBy: { data: "asc" },
    include: {
      medico: {
        select: { id: true, nome: true, crm: true, email: true, perfil: true },
      },
    },
  });

  return eventos.map((ev) => {
    const medicoNome = String(ev.medicoNome ?? ev.medico?.nome ?? "");
    const title = `${ev.cidade}: ${ev.quantidade} exame(s)`;
    const descricao = medicoNome ? `${title} • ${medicoNome}` : title;

    return {
      id: String(ev.id),
      start: ev.data,
      end: ev.data, // seu schema não tem fim; mantemos igual ao start
      title,
      descricao,
      medicoId: ev.medicoId,
      medicoNome: medicoNome || "Médico",
      medico: ev.medico,
      cidade: ev.cidade,
      quantidade: ev.quantidade,
    } as any;
  });
}
