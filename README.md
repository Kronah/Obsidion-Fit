# Obsidion Fit - Gerenciador de Treino e Evolucao

Sistema web para academia com autenticacao, cadastro de alunos, acompanhamento de evolucao, geracao de treinos, dieta e upload de fotos.

## Funcionalidades

- Login com usuario e senha para profissional
- Area admin em `/admin` para cadastrar profissionais
- Cadastro publico do aluno na pagina inicial
- Acompanhamento de evolucao por aluno
- Geracao de treino por aluno
- Cadastro de dieta por aluno
- Upload de fotos de avaliacao fisica

## Stack atual

- Node.js + Express + EJS
- Postgres (via `DATABASE_URL`)
- Supabase Storage para fotos
- GitHub Actions CI

## Variaveis de ambiente

Copie `.env.example` para `.env` e preencha:

- `PORT`
- `SESSION_SECRET`
- `DATABASE_POOLER_URL` (recomendado em cloud/Render)
- `DATABASE_URL`
- `PGSSL` (`require` em cloud)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (ex: `student-photos`)

Observacao importante para Render:

- Use a string de Connection Pooling do Supabase em `DATABASE_POOLER_URL` (normalmente porta `6543`).
- Mantenha `DATABASE_URL` apenas como fallback/local, se quiser.
- Se usar host `db.<project-ref>.supabase.co` direto, pode falhar em ambientes sem rota IPv6.

## Como rodar localmente

1. Instale dependencias:
   - `npm install`
2. Configure `.env` com Postgres + Supabase
3. Inicie em desenvolvimento:
   - `npm run dev`
4. Acesse:
   - `http://localhost:3000`

## Usuario inicial (seed)

Na primeira execucao com banco vazio, o sistema cria automaticamente:

- Usuario: `admin`
- Senha: `admin123`

Troque essa senha apos o primeiro acesso.

## Deploy 100% online e gratuito (recomendado)

### 1) Supabase (banco + storage)

1. Crie um projeto no Supabase (plano free).
2. Copie:
   - URL do projeto (`SUPABASE_URL`)
   - Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
   - Connection Pooling URI (`DATABASE_POOLER_URL`) para cloud
   - Connection string direta (`DATABASE_URL`) opcional para uso local
3. Crie o bucket `student-photos` no Storage.
4. Defina o bucket como publico para exibir imagens direto na interface.

### 2) Render (backend web)

1. New Web Service > conectar repositório GitHub.
2. Build command:
   - `npm ci`
3. Start command:
   - `npm start`
4. Configure todas as variaveis de ambiente acima.
5. Deploy.

## CI no GitHub Actions

Workflow em `.github/workflows/ci.yml`:

- `npm ci`
- `npm run test`

Executa em push e pull request para `main`.

## Estrutura principal

- `src/server.js`: bootstrap do app
- `src/db.js`: conexao Postgres, migracoes e seed
- `src/routes/`: rotas de auth/admin/alunos/evolucao/treino/dieta
- `src/views/`: telas EJS
- `src/public/js/photo-preview.js`: preview das fotos no cadastro

## Protecao da branch main

No GitHub (`Settings` > `Rulesets` ou `Branches`), recomendacao minima:

- Require a pull request before merging
- Restrict deletions
- Require linear history
- Require status checks to pass (apos o CI aparecer)
