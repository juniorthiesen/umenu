# Funil de Vendas — UMenu Essencial

> Aplica `*create-funnel-copy` da copy-squad (Russell Brunson). Funnel type: **tripwire-trial** — direct sales com trial sem cartão como reverse-risk principal e upsell pro anual no D+5.

## Mapa do funil

```
[Tráfego pago/orgânico Insta+TikTok+WhatsApp Status]
          │
          ▼
   [/]  Sales LP (umenu.com.br ou app.umenu.com.br/lp)
          │
          ├─ CTA Hero       → form trial inline
          ├─ CTA pós-prova  → form trial
          ├─ CTA pós-stack  → form trial
          └─ CTA final      → form trial
          │
          ▼
   [/cadastro-trial]  Form curto (5 campos)
          │   - Nome do estabelecimento
          │   - Subdomínio desejado (validação live)
          │   - WhatsApp
          │   - Seu nome
          │   - Email + senha
          ▼
   [/obrigado]  Confirmação + Orientação inicial
          │   - "Acesse app.umenu.com.br/login"
          │   - "Aqui está seu cardápio: nilceia.umenu.com.br"
          │   - Vídeo de 90s "primeiros passos"
          ▼
   [Email D+0]  Boas-vindas + link tutorial
   [Email D+1]  Como adicionar 5 produtos em 10 min
   [Email D+3]  Compartilha o link nos Stories (template pronto)
   [Email D+5]  Upgrade Anual R$ 197 (Founders Lot — limite de 100)
   [Email D+6]  Último dia do trial. Confirmar plano.
   [Email D+7]  Trial encerrou. Reativa por R$ 97/mês ou R$ 197/ano.
```

## Páginas

| Página | Path | Goal | Tipo Sugarman |
|---|---|---|---|
| Sales LP | `/` (no host raiz `umenu.com.br`) ou `app.umenu.com.br/lp` | Trial signup | sales (long) |
| Cadastro Trial | `/cadastro-trial` | Submit do form | opt-in (short) |
| Obrigado | `/obrigado` | Reduzir buyer remorse + dar próximo passo | thank-you |

## Funnel Math (premissas conservadoras)

| Estágio | CVR esperado | Volume necessário p/ 50 contas pagantes/mês |
|---|---|---|
| Visita LP | — | 5.000 visitas/mês |
| LP → Trial signup | 5% | 250 trials/mês |
| Trial → Mensal R$ 97 | 25% | ≈ 62 mensais |
| Trial → Anual R$ 197 | 5% | ≈ 12 anuais |
| **Receita projetada (1º mês de cohort)** | | **62 × 97 + 12 × 197 = R$ 8.378** |

LTV depende de churn — sem dados próprios, assumir 8 meses no plano mensal = R$ 776 LTV mensal-only.

CAC alvo (regra de 3:1): até R$ 258 por cliente pago.

## Leak points e o que testar

| Estágio | Leak comum | Hipótese de teste A/B |
|---|---|---|
| Hero LP | Headline genérica não bate avatar | "Cardápio digital" (genérico) vs "Cardápio próprio que vende salgado pelo WhatsApp" (específico) |
| Pós-prova | Falta de prova social | Print de WhatsApp com pedido vs print de cardápio bonito |
| Form de trial | Pedir muitos campos derruba CVR | Subdomínio só na próxima tela vs no mesmo form |
| Email D+5 | Upgrade em texto puro | Vídeo de 60s da fundadora vs texto |
| Pós-trial | Pessoa esquece e some | WhatsApp de retenção D+6 vs só email |

## Retargeting

Quem abandonou o form (entrou no /cadastro-trial e não submeteu):

> "Você quase publicou o seu cardápio em [nome digitado]. Falta 1 minuto. Continue de onde parou: [link]"

Quem cancelou no trial (cancelou antes do D+7):

> "Antes de você sair: o que faltou? Responde com 1 palavra que a gente melhora."

## Referência cruzada

- Stack do offer e justificativa de preço: ver [`offer.md`](offer.md).
- Copy seção-a-seção da LP: ver [`landing-page-copy.md`](landing-page-copy.md).
