# UMenu

Sistema multi-tenant para cardapios digitais com painel administrativo, catalogo publico e envio de pedidos pelo WhatsApp.

## Estado Atual

- Frontend React + Vite + TypeScript + Tailwind.
- Backend Fastify + JWT + bcrypt.
- Banco Postgres via Docker.
- ORM Prisma com migrations versionadas.
- Admin da plataforma para criar e gerenciar estabelecimentos.
- Admin do estabelecimento para configurar dados, categorias e produtos.
- Catalogo publico por tenant.
- Pedidos continuam sendo finalizados no WhatsApp.
- Registro de acessos ao cardapio e pedidos iniciados para metricas.

## Arquitetura

```text
src/
  App.tsx          Interface admin e cardapio publico
  api.ts           Cliente HTTP do frontend
  types.ts         Tipos compartilhados do frontend

backend/src/
  server.ts        Rotas HTTP, CORS, catalogo, analytics e pedidos
  auth.ts          JWT e autenticacao
  db.ts            Prisma client
  env.ts           Variaveis de ambiente

prisma/
  schema.prisma    Modelo Postgres
  migrations/      Migrations aplicadas no deploy

legacy/
  supabase-version Versao antiga preservada apenas como referencia
```

## Requisitos

- Node.js 24 ou compativel com o Dockerfile atual.
- Docker e Docker Compose.
- npm.

## Configuracao

Copie as variaveis de exemplo:

```bash
cp .env.example .env
```

Principais variaveis:

```env
DATABASE_URL=postgresql://umenu:umenu_password@localhost:5432/umenu?schema=public
JWT_SECRET=troque-em-producao
CORS_ORIGIN=http://localhost:5173,http://localhost:4173
VITE_API_URL=http://localhost:3333

PLATFORM_ADMIN_EMAIL=admin@umenu.local
PLATFORM_ADMIN_PASSWORD=change-me-admin-password
```

Em producao, troque obrigatoriamente `JWT_SECRET`, senhas do Postgres e senha do admin.

## Rodando Localmente

Subir Postgres e API:

```bash
docker compose up -d
```

Instalar dependencias e gerar Prisma:

```bash
npm install
npm run prisma:generate
```

Criar admin inicial:

```bash
npm run seed:admin
```

Rodar frontend em desenvolvimento:

```bash
npm run dev
```

Ou servir o build local:

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

## Scripts

```bash
npm run dev                # frontend Vite
npm run preview            # preview do build
npm run build              # build API + frontend
npm run build:api          # build TypeScript da API
npm run start:api          # inicia API
npm run prisma:generate    # gera Prisma Client
npm run prisma:migrate     # cria/aplica migration local
npm run seed:admin         # cria admin da plataforma
npm run seed:legacy-menu   # importa catalogo legado para um tenant
```

## Fluxos Principais

### Plataforma

1. Entrar no admin.
2. Criar estabelecimento.
3. Validar disponibilidade de URL/subdominio.
4. Criar usuario admin do tenant.
5. Gerenciar status e dados do estabelecimento.

### Estabelecimento

1. Entrar com usuario do tenant.
2. Ajustar nome, WhatsApp, endereco, logo e banner.
3. Criar/editar categorias.
4. Criar/editar produtos.
5. Alterar preco, foto URL, tipo de preco, minimo, incremento e disponibilidade.
6. Acompanhar dashboard com acessos, pedidos, conversao e funil.

### Cliente

1. Acessa URL publica do tenant.
2. Navega pelo cardapio.
3. Adiciona produtos ao carrinho.
4. Finaliza o pedido pelo WhatsApp.

## URL Publica por Tenant

No ambiente local:

```text
http://localhost:4173?tenant=salgados-cia-teste
```

Em producao, a aplicacao suporta subdominio:

```text
https://salgados-cia-teste.seudominio.com
```

O proxy/reverse proxy da VPS deve apontar o frontend para o mesmo app e a API para `/api` ou para o host configurado em `VITE_API_URL`.

## Analytics

Hoje o sistema registra:

- Visitas ao cardapio publico.
- Pedidos iniciados pelo botao de WhatsApp.
- Conversao simples: pedidos / acessos.
- Receita estimada enviada para WhatsApp.
- Contadores de categorias, produtos ativos e produtos totais.

## Upload de Imagens

O upload ainda nao foi ativado de proposito. O proximo passo e implementar pipeline com:

- validacao de tipo e tamanho;
- resize;
- conversao para WebP;
- compressao;
- armazenamento em volume Docker ou object storage;
- limpeza de imagens antigas quando produto for atualizado.

## Verificacao

```bash
npm run build
docker compose ps
```

A API deve responder em:

```text
http://localhost:3333/health
```
