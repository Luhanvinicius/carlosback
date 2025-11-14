// src/services/cardService.ts
import { query } from "../db";

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
  const partidaResult = await query(
    'SELECT "atleta1Id", "atleta2Id", "atleta3Id", "atleta4Id", data FROM "Partida" WHERE id = $1',
    [partidaId]
  );
  const partida = partidaResult.rows[0];

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
  // SQL simplificado - buscar partidas anteriores com os mesmos times
  const sql = `
    SELECT p.*, 
           a1.nome as "atleta1Nome", 
           a2.nome as "atleta2Nome",
           a3.nome as "atleta3Nome", 
           a4.nome as "atleta4Nome"
    FROM "Partida" p
    LEFT JOIN "Atleta" a1 ON p."atleta1Id" = a1.id
    LEFT JOIN "Atleta" a2 ON p."atleta2Id" = a2.id
    LEFT JOIN "Atleta" a3 ON p."atleta3Id" = a3.id
    LEFT JOIN "Atleta" a4 ON p."atleta4Id" = a4.id
    WHERE p.id != $1 
      AND p.data < $2
      AND (p."atleta1Id" = ANY($3::uuid[]) OR p."atleta2Id" = ANY($3::uuid[]))
    ORDER BY p.data DESC
    LIMIT $4
  `;
  
  const confrontosResult = await query(sql, [
    partidaId,
    partida.data,
    timeA,
    limite
  ]);
  const confrontos = confrontosResult.rows;

  // 3) Formatar como strings (ex.: "João/Maria 6x4 7x5 Pedro/Ana - 12/05/2024")
  const linhas = confrontos.map((p: any) => {
    const nomesTimeA = [p.atleta1Nome, p.atleta2Nome]
      .filter((s): s is string => Boolean(s))
      .join("/");
    const nomesTimeB = [p.atleta3Nome, p.atleta4Nome]
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
