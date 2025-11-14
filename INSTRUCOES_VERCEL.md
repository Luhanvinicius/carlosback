# 🚀 Instruções para Deploy do Backend no Vercel

## ⚙️ Configuração Atual no Vercel

### 1. Root Directory
No modal que está aberto, selecione:
```
carlosback
```
(ou deixe como está - a raiz)

### 2. Framework Preset
Pode manter como **"Express"** ou mudar para **"Other"**
- O `vercel.json` já está configurado, então funciona de qualquer forma

### 3. Build Settings (se necessário ajustar)
- **Build Command:** `npm install && npm run build`
- **Output Directory:** `.` (deixe vazio ou `.`)
- **Install Command:** `npm install` ou `yarn install`

### 4. Environment Variables (IMPORTANTE)

Expanda a seção **"> Environment Variables"** e adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `DATABASE_URL` | Sua URL PostgreSQL (ex: Neon, Supabase) | Production |
| `AUTH_MODE` | `BASIC` | Production |
| `CORS_ORIGIN` | `*` (temporário - atualize depois) | Production |
| `NODE_ENV` | `production` | Production |

**⚠️ IMPORTANTE:**
- **DATABASE_URL** é obrigatório - você precisa ter uma URL PostgreSQL
- **CORS_ORIGIN** pode ser `*` temporariamente para permitir todos
- Depois do deploy do frontend, atualize com a URL do frontend

### 5. Deploy

1. Clique em **"Continue"** no modal (se ainda estiver aberto)
2. Clique no botão **"Deploy"** (botão preto no final)
3. Aguarde o build (pode levar 2-5 minutos na primeira vez)
4. **COPIE A URL DO BACKEND** quando aparecer
   - Exemplo: `https://carlosback.vercel.app`
   - **ANOTE ESTA URL!** Você vai precisar dela para o frontend

---

## 🔍 Verificações Após Deploy

1. Acesse a URL do backend no navegador
2. Deve aparecer: `API Online 🚀`
3. Teste também: `https://seu-backend.vercel.app/health`
   - Deve retornar um JSON com status OK

---

## 📝 Próximos Passos

Depois que o backend estiver deployado:

1. **Deploy do Frontend** (criar novo projeto no Vercel)
2. **Atualizar CORS** no backend com a URL do frontend
3. **Redeploy do backend**

Veja o guia completo em `DEPLOY_VERCEL.md`

