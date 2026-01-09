import prisma from "@/lib/prisma";

type BuscarEventosParams = {
  start: Date;
  end: Date;
  medicoId?: number; // opcional: filtra por médico
};

export async function buscarEventos({ start, end, medicoId }: BuscarEventosParams) {
  try {
    console.log("📅 Buscando eventos de", start.toISOString(), "a", end.toISOString());

    const where: any = {
      data: { gte: start, lt: end } // end exclusivo para evitar duplicar no limite
    };

    if (typeof medicoId === "number" && Number.isFinite(medicoId)) {
      where.medicoId = medicoId;
    }

    const eventos = await prisma.eventoAgenda.findMany({
      where,
      orderBy: { data: "asc" },
      include: {
        medico: {
          select: { id: true, nome: true, email: true, crm: true, perfil: true }
        }
      }
    });

    // Normaliza para um formato comum (se o front espera "start/end", mapeamos)
    return eventos.map((ev) => ({
      id: ev.id,
      start: ev.data,
      end: ev.data, // seu schema não tem fim; mantemos igual ao start
      title: ev.descricao,
      descricao: ev.descricao,
      medicoId: ev.medicoId,
      medico: ev.medico
    }));
  } catch (err) {
    console.error("❌ Erro ao buscar eventos:", err);
    throw err;
  }
}
