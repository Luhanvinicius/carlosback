# ⚠️ REFATORAÇÃO EM ANDAMENTO: Prisma → pg

## Status

- ✅ Prisma removido do `package.json`
- ✅ `pg` instalado
- ✅ Conexão PostgreSQL criada (`src/db/index.ts`)
- ✅ Serviços refatorados (`authService.ts`, `userService.ts`, `cardService.ts`)
- ⚠️ **Controllers ainda usam `prisma.` - PRECISA REFATORAR**

## Controllers que precisam ser refatorados

1. `src/controllers/atletaController.ts` - 6 referências
2. `src/controllers/partidaController.ts` - 8 referências
3. `src/controllers/cardController.ts` - 1 referência

## Como refatorar

### De:
```typescript
const atleta = await prisma.atleta.create({
  data: { nome, dataNascimento, usuarioId }
});
```

### Para:
```typescript
import { query } from "../db";
import { v4 as uuidv4 } from "uuid";

const id = uuidv4();
await query(
  'INSERT INTO "Atleta" (id, nome, "dataNascimento", "usuarioId", "createdAt") VALUES ($1, $2, $3, $4, NOW())',
  [id, nome, dataNascimento, usuarioId]
);
const result = await query('SELECT * FROM "Atleta" WHERE id = $1', [id]);
const atleta = result.rows[0];
```

## Próximos passos

1. Refatorar `atletaController.ts`
2. Refatorar `partidaController.ts`
3. Refatorar `cardController.ts`
4. Testar no Vercel


