# UMenu API

Backend proprio para substituir Supabase por PostgreSQL + Prisma.

## Rodar local

```bash
cp .env.example .env
docker compose up -d postgres
npm run prisma:migrate
npm run dev:api
```

## Endpoints iniciais

- `GET /health`
- `GET /api/public/subdomains/:subdomain/availability`
- `GET /api/public/menu/:subdomain`
- `POST /api/admin/establishments`
- `GET /api/admin/establishments`
- `POST /api/admin/establishments/:establishmentId/categories`
- `POST /api/admin/establishments/:establishmentId/products`
