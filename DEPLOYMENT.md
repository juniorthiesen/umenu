# Deploy em VPS com Docker

Este projeto foi preparado para rodar em VPS usando Docker, Postgres, Prisma e um frontend Vite servido por build estatico.

## Visao Geral

Servicos esperados em producao:

- `postgres`: banco Postgres persistente.
- `api`: Fastify com Prisma.
- `frontend`: build estatico do Vite servido por Nginx, Caddy ou outro reverse proxy.
- `reverse proxy`: TLS, dominios e roteamento.

## Variaveis de Ambiente

Base recomendada:

```env
DATABASE_URL=postgresql://umenu:SENHA_FORTE@postgres:5432/umenu?schema=public
POSTGRES_USER=umenu
POSTGRES_PASSWORD=SENHA_FORTE
POSTGRES_DB=umenu

JWT_SECRET=SEGREDO_LONGO_ALEATORIO
CORS_ORIGIN=https://app.seudominio.com,https://*.seudominio.com
API_HOST=0.0.0.0
API_PORT=3333
UPLOAD_DIR=uploads
PUBLIC_UPLOAD_BASE_URL=https://api.seudominio.com
MAX_UPLOAD_MB=8

OPENAI_API_KEY=sk-proj...
OPENAI_IMAGE_MODEL=gpt-image-1.5

VITE_API_URL=https://api.seudominio.com

PLATFORM_ADMIN_NAME=UMenu Admin
PLATFORM_ADMIN_EMAIL=admin@seudominio.com
PLATFORM_ADMIN_PASSWORD=SENHA_FORTE_DO_ADMIN
```

Nunca use as senhas de exemplo em producao.

## Deploy Inicial

1. Clonar o repositorio na VPS.

```bash
git clone git@github.com:juniorthiesen/umenu.git
cd umenu
```

2. Criar `.env` com as variaveis de producao.

3. Subir banco e API.

```bash
docker compose up -d --build
```

O container da API executa `prisma migrate deploy` antes de iniciar.

4. Criar admin inicial.

```bash
docker compose exec api npm run seed:admin
```

5. Gerar build do frontend.

```bash
npm ci
npm run build
```

6. Servir `dist/` no proxy web ou em container estatico.

## Reverse Proxy

Exemplo conceitual:

```text
https://app.seudominio.com      -> frontend dist/
https://api.seudominio.com      -> localhost:3333
https://*.seudominio.com        -> frontend dist/
```

Para tenants por subdominio, o frontend identifica o hostname e carrega o cardapio correto. Em local, use `?tenant=slug`.

## Rotina de Atualizacao

```bash
git pull origin main
docker compose build api
docker compose up -d api
npm ci
npm run build
```

Se o frontend for servido por Nginx/Caddy lendo a pasta `dist/`, substitua o conteudo publicado apos o build.

## Backups

Backup manual do Postgres:

```bash
docker compose exec postgres pg_dump -U umenu umenu > backup-umenu.sql
```

Restore:

```bash
cat backup-umenu.sql | docker compose exec -T postgres psql -U umenu umenu
```

Em producao, automatize backup diario e mantenha copia fora da VPS.

## Checklist de Producao

- [ ] `JWT_SECRET` forte.
- [ ] Senha forte do Postgres.
- [ ] Senha forte do admin inicial.
- [ ] HTTPS ativo.
- [ ] `CORS_ORIGIN` restrito aos dominios reais.
- [ ] Backups automaticos do Postgres.
- [ ] Volume persistente para Postgres.
- [ ] Volume persistente para uploads.
- [ ] `PUBLIC_UPLOAD_BASE_URL` apontando para a URL publica da API.
- [ ] `OPENAI_API_KEY` configurada apenas se a melhoria por IA estiver ativa.
- [ ] Logs da API monitorados.
- [ ] Firewall permitindo apenas SSH, HTTP e HTTPS publicos.

## Validacao

API:

```bash
curl https://api.seudominio.com/health
```

Build:

```bash
npm run build
```

Docker:

```bash
docker compose ps
```

## Proximos Passos

1. Adicionar testes automatizados para rotas criticas.
2. Separar frontend em container Nginx se o deploy exigir tudo via Compose.
3. Configurar observabilidade basica: logs, uptime e alerta de erro.
4. Avaliar storage externo se o volume local deixar de atender.
