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
- Upload de imagens com conversao para WebP e otimizacao.
- Melhoria opcional de imagem com IA consumindo creditos.

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
- Upload de imagens usa pipeline local com `sharp`.
- Melhoria por IA fica isolada em endpoint proprio e depende de saldo de creditos.

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

1. deploy final da VPS;
2. hardening de seguranca;
3. testes automatizados das rotas criticas;
4. storage externo opcional caso o volume local deixe de atender.
