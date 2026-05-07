#!/bin/bash

set -e

APP_DIR="/home/umenu/htdocs/umenu.com.br"

echo "🚀 Iniciando setup de produção do UMenu..."

cd "$APP_DIR"

echo "📁 Verificando arquivo .env..."

if [ ! -f ".env" ]; then
  echo "⚠️ Arquivo .env não encontrado. Criando .env base..."

  POSTGRES_PASSWORD=$(openssl rand -base64 24)
  JWT_SECRET=$(openssl rand -hex 32)
  ADMIN_PASSWORD=$(openssl rand -base64 18)

  cat > .env <<EOF
NODE_ENV=production

POSTGRES_DB=umenu
POSTGRES_USER=umenu
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

APP_DOMAIN=umenu.com.br

CORS_ORIGIN=https://umenu.com.br,https://www.umenu.com.br,https://api.umenu.com.br

JWT_SECRET=$JWT_SECRET

PUBLIC_UPLOAD_BASE_URL=https://api.umenu.com.br

OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-2

PLATFORM_ADMIN_EMAIL=admin@umenu.com.br
PLATFORM_ADMIN_PASSWORD=$ADMIN_PASSWORD
EOF

  echo "✅ Arquivo .env criado com senhas automáticas."
  echo ""
  echo "🔐 Dados do admin inicial:"
  echo "Email: admin@umenu.com.br"
  echo "Senha: $ADMIN_PASSWORD"
  echo ""
  echo "⚠️ Salve essa senha agora."
else
  echo "✅ Arquivo .env encontrado. Usando configurações existentes."
fi

echo "🐳 Subindo Postgres e API..."
docker compose up -d --build

echo "⏳ Aguardando containers iniciarem..."
sleep 8

echo "📊 Status dos containers:"
docker compose ps

echo "🗄️ Aplicando migrations..."
docker compose exec api npx prisma migrate deploy

echo "👤 Criando admin inicial..."
docker compose exec api npm run seed:admin || true

echo "🧪 Testando API local..."
if curl -fsS http://localhost:3333/health > /dev/null; then
  echo "✅ API respondeu com sucesso em http://localhost:3333/health"
else
  echo "⚠️ API ainda não respondeu em /health. Veja os logs com:"
  echo "docker compose logs -f api"
fi

echo ""
echo "✅ Setup finalizado!"
echo ""
echo "Próximos testes:"
echo "curl http://localhost:3333/health"
echo "docker compose logs -f api"
