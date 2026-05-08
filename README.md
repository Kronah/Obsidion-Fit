# Obsidion Fit - Gerenciador de Treino e Evolucao

Sistema web para academia com autenticacao, cadastro de alunos, acompanhamento de evolucao, geracao de treinos e montagem de dietas.

## Funcionalidades

- Login com usuario e senha para profissional
- Area admin em `/admin` para cadastrar profissionais (usuario/senha)
- Cadastro e edicao de alunos
- Acompanhamento de evolucao por aluno
- Geracao de treino por aluno
- Cadastro de dieta por aluno
- Persistencia local em SQLite

## Tecnologias

- Node.js
- Express
- EJS
- SQLite (better-sqlite3)
- express-session

## Como rodar localmente

1. Instale dependencias:
   - `npm install`
2. Inicie em desenvolvimento:
   - `npm run dev`
3. Ou inicie em modo producao local:
   - `npm start`
4. Abra no navegador:
   - `http://localhost:3000`

## Usuario inicial (seed)

Na primeira execucao, o sistema cria automaticamente:

- Usuario: `admin`
- Senha: `admin123`

Importante: altere essa senha cadastrando outro profissional admin e removendo o uso da conta padrao.

## Estrutura principal

- `src/server.js`: inicializacao do servidor e middlewares
- `src/db.js`: configuracao do SQLite, tabelas e seed inicial
- `src/routes/`: rotas de autenticacao, admin, alunos, evolucao, treino e dieta
- `src/views/`: telas EJS
- `src/public/css/styles.css`: estilos

## Publicar no GitHub depois de testar

1. Inicialize git (se ainda nao estiver inicializado):
   - `git init`
2. Faça commit inicial:
   - `git add .`
   - `git commit -m "feat: sistema gerenciador de academia"`
3. Conecte ao repositório remoto e envie:
   - `git remote add origin <URL_DO_REPOSITORIO>`
   - `git branch -M main`
   - `git push -u origin main`

## CI no GitHub Actions

Este projeto possui pipeline em `.github/workflows/ci.yml` com:

- Instalação de dependências com `npm ci`
- Execução de validação com `npm run test`

O workflow roda em push e pull request para a branch `main`.

## Deploy (sugestão prática)

Para deploy simples, use Render, Railway ou VPS com Node 20+.

Checklist de deploy:

1. Definir variáveis de ambiente:
   - `PORT`
   - `SESSION_SECRET`
2. Executar em produção:
   - `npm ci`
   - `npm start`
3. Garantir persistência de arquivos:
   - banco `data.sqlite`
   - pasta `src/public/uploads/student-photos`

## Proteção da branch main

Para proteger a `main` no GitHub:

1. Acesse `Settings` do repositório.
2. Entre em `Branches`.
3. Em `Branch protection rules`, clique em `Add rule`.
4. Defina `main` como padrão da regra.
5. Recomendações:
   - `Require a pull request before merging`
   - `Require status checks to pass before merging` (selecionar o workflow `CI`)
   - `Require linear history` (opcional)
   - `Restrict who can push to matching branches` (opcional)
