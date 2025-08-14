import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
/**
 * Busca últimos confrontos diretos entre os times da partida informada
 * e retorna um array de strings já formatado para exibir no card.
 *
 * @param partidaId ID da partida base para buscar confrontos
 * @param limite número máximo de confrontos a retornar
 */
export async function buscarUltimosConfrontosFormatados(partidaId: string, limite = 5): Promise<string[]> {
  // 1) Buscar a partida original para saber quem são os times
  const partida = await prisma.partida.findUnique({
    where: { id: partidaId },
    select: {
      atleta1Id: true,
      atleta2Id: true,
      atleta3Id: true,
      atleta4Id: true,
    },
  });

  if (!partida) return [];

  const timeA = [partida.atleta1Id, partida.atleta2Id].filter(Boolean);
  const timeB = [partida.atleta3Id, partida.atleta4Id].filter(Boolean);

  if (!timeA.length || !timeB.length) {
    return []; // se faltar alguém, não faz sentido buscar confrontos
  }

  // 2) Buscar últimas partidas onde times foram os mesmos (independente da ordem)
  const confrontos = await prisma.partida.findMany({
    where: {
      id: { not: partidaId },
      OR: [
        // timeA como 1/2 e timeB como 3/4
        {
          AND: [
            { atleta1Id: { in: timeA } },
            { atleta2Id: { in: timeA } },
            { atleta3Id: { in: timeB } },
            { atleta4Id: { in: timeB } },
          ],
        },
        // timeB como 1/2 e timeA como 3/4
        {
          AND: [
            { atleta1Id: { in: timeB } },
            { atleta2Id: { in: timeB } },
            { atleta3Id: { in: timeA } },
            { atleta4Id: { in: timeA } },
          ],
        },
      ],
    },
    include: {
      atleta1: { select: { nome: true } },
      atleta2: { select: { nome: true } },
      atleta3: { select: { nome: true } },
      atleta4: { select: { nome: true } },
    },
    orderBy: { data: "desc" },
    take: limite,
  });

  // 3) Formatar como strings (ex.: "João/Maria 6x4 7x5 Pedro/Ana - 12/05/2024")
  const linhas = confrontos.map((p) => {
    const nomesTimeA = [p.atleta1?.nome, p.atleta2?.nome].filter(Boolean).join("/");
    const nomesTimeB = [p.atleta3?.nome, p.atleta4?.nome].filter(Boolean).join("/");

    let placar = "";
    if (p.gamesTime1 != null && p.gamesTime2 != null) {
      placar = `${p.gamesTime1}x${p.gamesTime2}`;
      if (p.tiebreakTime1 != null && p.tiebreakTime2 != null) {
        placar += ` (TB ${p.tiebreakTime1}-${p.tiebreakTime2})`;
      }
      if (p.supertiebreakTime1 != null && p.supertiebreakTime2 != null) {
        placar += ` (STB ${p.supertiebreakTime1}-${p.supertiebreakTime2})`;
      }
    }

    const dataFmt = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(p.data));

    return `${nomesTimeA} ${placar} ${nomesTimeB} - ${dataFmt}`;
  });

  return linhas;
}
