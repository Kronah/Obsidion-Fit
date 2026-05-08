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
