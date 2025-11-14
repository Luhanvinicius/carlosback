// src/services/cardService.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Busca últimos confrontos diretos entre os times da partida informada
 * e retorna um array de strings já formatado para exibir no card.
 *
 * @param partidaId ID da partida base para buscar confrontos
 * @param limite número máximo de confrontos a retornar
 */
export async function buscarUltimosConfrontosFormatados(
  partidaId: string,
  limite = 5
): Promise<string[]> {
  // 1) Buscar a partida original para saber quem são os times
  const partida = await prisma.partida.findUnique({
    where: { id: partidaId },
    select: {
      atleta1Id: true,
      atleta2Id: true,
      atleta3Id: true,
      atleta4Id: true,
      data: true,
    },
  });

  if (!partida) return [];

  // timeA (obrigatórios normalmente): queremos só strings
  const timeA = [partida.atleta1Id, partida.atleta2Id].filter(
    (v): v is string => typeof v === "string"
  );

  // timeB (opcionais): precisamos saber se tem null e quais são as strings
  const timeBRaw = [partida.atleta3Id, partida.atleta4Id];
  const timeBIds = timeBRaw.filter((v): v is string => typeof v === "string");
  const timeBHasNull = timeBRaw.some((v) => v == null);

  // Se faltar alguém essencial, não faz sentido buscar confrontos
  // (para singles, timeBHasNull é true e timeBIds pode ser vazio — isso é permitido)
  if (!timeA.length) return [];

  // Helpers para montar filtros de campos String? (nullable):
  const condNullable = (field: "atleta3Id" | "atleta4Id", values: string[], hasNull: boolean) => {
    if (hasNull && values.length > 0) {
      // matcha ids OU null
      return [{ [field]: { in: values } }, { [field]: null }] as const;
    }
    if (hasNull) {
      // só null
      return [{ [field]: null }] as const;
    }
    // só ids
    return [{ [field]: { in: values } }] as const;
  };

  // 2) Buscar últimas partidas onde times foram os mesmos (independente da ordem)
  const confrontos = await prisma.partida.findMany({
    where: {
      id: { not: partidaId },
      data: { lt: partida.data }, // só confrontos anteriores
      OR: [
        // timeA como 1/2 e timeB como 3/4
        {
          AND: [
            { atleta1Id: { in: timeA } },
            { atleta2Id: { in: timeA } },
            ...condNullable("atleta3Id", timeBIds, timeBHasNull),
            ...condNullable("atleta4Id", timeBIds, timeBHasNull),
          ],
        },
        // timeB como 1/2 e timeA como 3/4 (invertido)
        {
          AND: [
            { atleta1Id: { in: timeBIds.length ? timeBIds : ["__never__"] } }, // se vazio, in "impossível"
            { atleta2Id: { in: timeBIds.length ? timeBIds : ["__never__"] } },
            // timeA vai para 3/4; aqui usamos {in} direto
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
  const linhas = confrontos.map((p: (typeof confrontos)[number]) => {
    const nomesTimeA = [p.atleta1?.nome, p.atleta2?.nome]
      .filter((s): s is string => Boolean(s))
      .join("/");
    const nomesTimeB = [p.atleta3?.nome, p.atleta4?.nome]
      .filter((s): s is string => Boolean(s))
      .join("/");

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
