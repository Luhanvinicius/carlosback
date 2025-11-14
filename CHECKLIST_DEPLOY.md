# ✅ Checklist: Configuração do Deploy no Vercel

## ⚙️ Configurações Atuais (Verificar)

### 1. Root Directory
✅ Deve ser: `./` (raiz)
- **Status:** ✅ Correto

### 2. Framework Preset
✅ Pode ser: `Express` ou `Other`
- **Status:** ✅ OK (Express está correto)

### 3. Build Command
✅ Deve ser: `npm install && npm run build`
- **Status:** ✅ Correto

### 4. Output Directory
✅ Deve ser: `.` ou `N/A` (deixe como está)
- **Status:** ✅ OK

### 5. Install Command
⚠️ **IMPORTANTE:** Mude para: `npm install`
- Atualmente pode estar como `yarn install` ou outros
- **Ação:** Altere para `npm install`

---

## 🔐 Environment Variables (VERIFICAR)

Configure as seguintes variáveis com os **VALORES REAIS**:

### Variável 1: `DATABASE_URL`
- **Nome:** `DATABASE_URL`
- **Valor:** Sua URL PostgreSQL completa
  - Exemplo: `postgresql://user:password@host:5432/database?sslmode=require`
  - **⚠️ IMPORTANTE:** Use a URL completa do seu PostgreSQL (Neon, Supabase, etc)
- **Ambiente:** ☑️ Production

### Variável 2: `AUTH_MODE`
- **Nome:** `AUTH_MODE`
- **Valor:** `BASIC`
- **Ambiente:** ☑️ Production

### Variável 3: `CORS_ORIGIN`
- **Nome:** `CORS_ORIGIN`
- **Valor:** `*` (temporário - atualize depois com a URL do frontend)
- **Ambiente:** ☑️ Production

### Variável 4: `NODE_ENV`
- **Nome:** `NODE_ENV`
- **Valor:** `production`
- **Ambiente:** ☑️ Production

---

## ⚠️ IMPORTANTE: Verificar DATABASE_URL

Se você disse que "a URL do postgres é a mesma não muda", então:

1. Verifique se você já tem a `DATABASE_URL` correta
2. Certifique-se de que está no formato completo:
   ```
   postgresql://usuario:senha@host:5432/nome_do_banco?sslmode=require
   ```
3. Copie a URL completa e cole no campo `Value` da variável `DATABASE_URL`

---

## 🚀 Deploy

Após verificar tudo:

1. ✅ Verifique se `Install Command` está como `npm install`
2. ✅ Verifique se `DATABASE_URL` está com a URL completa do PostgreSQL
3. ✅ Verifique se todas as outras variáveis estão corretas
4. Clique em **"Deploy"**
5. Aguarde (2-5 minutos na primeira vez)
6. **COPIE A URL DO BACKEND** quando aparecer

---

## 🔍 Verificações Pós-Deploy

1. Acesse a URL do backend no navegador
2. Deve aparecer: `API Online 🚀`
3. Teste: `https://seu-backend.vercel.app/health`
   - Deve retornar JSON com status

---

## 📝 Próximos Passos

Depois que o backend estiver deployado:

1. **Deploy do Frontend** (criar novo projeto no Vercel)
2. **Atualizar CORS** no backend com a URL do frontend
3. **Redeploy do backend**

