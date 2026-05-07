# UMenu

Sistema multi-tenant para cardápios digitais com painel administrativo, catálogo público e envio de pedidos pelo WhatsApp.

## Estado Atual

- Frontend React + Vite + TypeScript + Tailwind.
- Backend Fastify + JWT + bcrypt.
- Banco Postgres via Docker.
- ORM Prisma com migrations versionadas.
- Admin da plataforma para criar e gerenciar estabelecimentos.
- Admin do estabelecimento para configurar dados, categorias e produtos.
- Catálogo público por tenant.
- Pedidos continuam sendo finalizados no WhatsApp.
- Registro de acessos ao cardápio e pedidos iniciados para métricas.

## Arquitetura

```text
src/
  App.tsx          Interface admin e cardápio público
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
PUBLIC_UPLOAD_BASE_URL=http://localhost:3333
MAX_UPLOAD_MB=8
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-1.5

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

## Upload e IA de Imagens

O painel suporta upload de imagens para produtos, logo e banner.

Pipeline atual:

- aceita JPEG, PNG, WebP, HEIC e HEIF;
- limita tamanho por `MAX_UPLOAD_MB`;
- redimensiona conforme o uso;
- remove metadados;
- converte para WebP;
- salva em `UPLOAD_DIR`;
- serve os arquivos por `/uploads`;
- usa nomes de arquivo em slug a partir do produto/estabelecimento para URLs mais legíveis;
- define `title`, `description`, Open Graph e `alt` nas imagens principais do cardápio público.

Configuracao importante:

- `PUBLIC_UPLOAD_BASE_URL`: URL publica usada para montar os links das imagens.
- `UPLOAD_DIR`: volume local onde os arquivos ficam persistidos.

Também existe a opção paga de melhorar imagem com IA. Ela usa `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL` e consome 1 crédito do estabelecimento por imagem melhorada com sucesso. Se a chamada falhar, o crédito é devolvido.

## Verificacao

```bash
npm run build
docker compose ps
```

A API deve responder em:

```text
http://localhost:3333/health
```
