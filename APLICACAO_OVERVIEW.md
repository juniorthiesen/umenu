# Overview da Aplicacao

UMenu e uma plataforma para estabelecimentos publicarem cardapios digitais e receberem pedidos pelo WhatsApp.

## Personas

- Admin da plataforma: cria estabelecimentos, define URL/subdominio e gerencia status.
- Admin do estabelecimento: gerencia configuracoes, categorias, produtos, precos e disponibilidade.
- Cliente final: acessa o cardapio publico, monta carrinho e envia pedido pelo WhatsApp.

## Modulos

### Admin da Plataforma

- Login com JWT.
- Lista de estabelecimentos.
- Criacao de estabelecimento.
- Verificacao de disponibilidade de subdominio.
- Criacao de usuario admin do tenant.
- Acesso ao workspace do estabelecimento.

### Admin do Estabelecimento

- Configuracoes do restaurante.
- Dashboard com metricas:
  - acessos;
  - pedidos iniciados;
  - conversao;
  - faturamento estimado;
  - funil de vendas;
  - produtos e categorias.
- CRUD basico de categorias.
- Criacao e edicao real de produtos.
- Alteracao de preco, tipo de preco, minimo, incremento, descricao, foto URL e status.

### Cardapio Publico

- Busca.
- Categorias.
- Produtos.
- Carrinho.
- Validacao de quantidade minima e incremento.
- Envio de pedido formatado para WhatsApp.
- Registro de visita e pedido para analytics.

## Dados Principais

- `Establishment`: tenant/restaurante.
- `User`: usuario da plataforma ou do estabelecimento.
- `Membership`: vinculo entre usuario e estabelecimento.
- `Category`: categoria do cardapio.
- `Product`: produto do cardapio.
- `Order`: pedido iniciado no WhatsApp.
- `MenuVisit`: visita ao cardapio.

## Decisoes Tecnicas

- Supabase nao e mais dependencia ativa.
- Postgres roda em Docker.
- Prisma controla schema e migrations.
- Fastify expoe a API.
- Autenticacao e leve: JWT + bcrypt.
- O checkout permanece no WhatsApp.
- Upload de imagens sera implementado depois com pipeline de otimizacao.

## Ambiente de Teste Atual

Tenant de teste:

```text
salgados-cia-teste
```

URL local:

```text
http://localhost:4173?tenant=salgados-cia-teste
```

Catalogo importado:

- 9 categorias.
- 56 produtos.

## Status

Pronto para continuar a etapa de producao com:

1. pipeline de upload/otimizacao de imagens;
2. deploy final da VPS;
3. hardening de seguranca;
4. testes automatizados das rotas criticas.
