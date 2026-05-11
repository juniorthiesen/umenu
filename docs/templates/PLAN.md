# Plano: Templates de Cardápio por Nicho

> Status: **proposta**, não implementado. Tomar decisões marcadas com 🟡 antes de começar.
>
> Disparador: o repo [renanperao/cardapio-cassia](https://github.com/renanperao/cardapio-cassia) é o melhor padrão visual de modal de produto que vimos para confeitaria. Mas é fortemente acoplado a uma única doceria. Pra UMenu virar SaaS multi-nicho (salgaderia, doceria, bolaria, pizzaria), precisamos virar isso em **templates configuráveis**, não copiar 4 vezes o mesmo código.

---

## 1. O que vale absorver do `cardapio-cassia`

Padrões visuais e de UX que entram em qualquer template:

| Padrão | Por que importa | Onde encaixa no UMenu |
|---|---|---|
| **Modal de detalhe do produto** | Hoje UMenu adiciona ao carrinho com input de quantidade direto no card. Ruim para variações. | Substituir o quick-add por modal sempre que o produto tiver opções |
| **Drawer de carrinho** com floating action button | UMenu já tem drawer, mas FAB melhora descoberta no mobile | Manter o drawer atual, adicionar FAB com badge de contagem |
| **Sticky category nav** com pills horizontais | UMenu já tem nav, mas pode usar pills com contagem | Refinar visual existente |
| **Live price calc** no modal (preço total atualiza ao escolher tamanho/opção) | UMenu não calcula no painel — preço é fixo | Necessário pra qualquer template com variação |
| **Lazy image loading com skeleton** | Performance mobile, especialmente em 4G | Trocar `<img>` direto por componente `LazyImage` |
| **localStorage sync do carrinho** | UMenu já tem? Não — carrinho mora só em state, perde se F5 | Adicionar persistência ao carrinho |
| **Status banner topo (aberto/fechado)** | UMenu tem placeholder hard-coded "Aberto Agora" | Plugar a `openingHours` do `Establishment` (já existe no schema) |
| **Mensagem de WhatsApp formatada por categoria** | UMenu já formata, mas Cassia agrupa por categoria com tamanho/recheio | Replicar agrupamento quando produto tiver variação |

Padrões que **não** valem absorver direto:
- Metadata hardcoded por categoria (`isMilho`, `isChocolate`, `caseirinhoMetadata`) — vira branch infinito.
- Editor de produtos em `Admin.tsx` que também é hardcoded por tipo.
- Persistência via localStorage do catálogo — UMenu tem Postgres.

---

## 2. O problema central: variação de produto

UMenu hoje só tem `pricingType` (UNIT / HUNDRED / KG) com `minQuantity` e `stepQuantity`. Pra atender 4 nichos, precisamos de **opções configuráveis por produto**:

- **Salgaderia** (caso atual): pastel R$ 110/cento, mínimo 25, sem opção. ✅ já funciona.
- **Doceria**: brigadeiro gourmet com formato (bola, flor, coração) e adicional (morango +R$10). Precisa de **groups de opção** com toggles.
- **Bolaria** (Cassia): bolo com tamanho (P/M/G), cobertura (com/sem), sabor (chocolate, milho, formigueiro). **Múltiplos grupos**, alguns com preço relativo, alguns só visuais.
- **Pizzaria**: pizza com tamanho (média/grande/família), borda (sem, catupiry +R$8, cheddar +R$10), sabor (1, 2 ou 3 — meio-a-meio precisa cobrar pelo mais caro), adicionais (extra calabresa +R$4 cada).

Padrão mínimo viável que cobre os 4: **option groups → option items**, com regras de seleção e preço.

---

## 3. Modelo de dados proposto

🟡 **Decisão pendente**: aprovar ou ajustar o schema antes de migrar.

```prisma
model Product {
  // … campos atuais

  optionGroups ProductOptionGroup[]
}

model ProductOptionGroup {
  id              String        @id @default(uuid()) @db.Uuid
  productId       String        @db.Uuid
  product         Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  name            String        // "Tamanho", "Cobertura", "Borda", "Sabor"
  selectionType   SelectionType // SINGLE | MULTIPLE | QUANTITY
  required        Boolean       @default(false)
  minSelections   Int           @default(0)
  maxSelections   Int?          // null = ilimitado
  displayOrder    Int           @default(0)
  items           ProductOptionItem[]
}

enum SelectionType {
  SINGLE      // radio — 1 obrigatório (tamanho de pizza)
  MULTIPLE    // checkbox — 0..N (adicionais de pizza)
  QUANTITY    // input numérico — peso variável (recheado por kg)
}

model ProductOptionItem {
  id            String  @id @default(uuid()) @db.Uuid
  groupId       String  @db.Uuid
  group         ProductOptionGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  name          String  // "Médio", "Catupiry", "Chocolate"
  priceDelta    Decimal @default(0) @db.Decimal(10, 2) // somado ao preço base
  priceMode     PriceMode @default(ADD)
  displayOrder  Int     @default(0)
  default       Boolean @default(false)
}

enum PriceMode {
  ADD       // +R$10 (adicional)
  REPLACE   // R$ 50,00 (override do preço base — pizza grande vs média)
  MULTIPLY  // ×1.5 (raro; talvez pizza família)
}
```

Combinado com isso:

```prisma
model Order {
  // já existe — items é JSON
  // O carrinho passa a serializar selectedOptions: [{ groupId, itemIds, quantity? }]
}
```

**Por que esse formato cobre os 4 nichos:**

- **Salgaderia (sem opção)**: produto sem groups → renderiza igual hoje, sem modal.
- **Doceria**: brigadeiro tem 1 group `MULTIPLE` "Adicionais" (morango +R$10, formato +R$0,50).
- **Bolaria**: bolo tem groups `SINGLE` para tamanho (com `priceMode=REPLACE`) e cobertura (`priceMode=ADD`).
- **Pizzaria**: pizza tem groups `SINGLE` para tamanho (REPLACE) + borda (ADD), `MULTIPLE` para adicionais. Meio-a-meio = group `SINGLE` com `maxSelections=2` e regra "preço = max".

**O caso meio-a-meio** exige um campo extra `pricingRule` no group.

**Decisão tomada**: `pricingRule` é **por produto** (mais precisamente, por `ProductOptionGroup`), não por template. A pizzaria pode ter "Sabores" com `HIGHEST` (cobra pelo mais caro) e "Adicionais" com `SUM`. A doceria pode ter "Tamanhos" com `REPLACE`. Não é a categoria do estabelecimento que decide a regra — é o cadastro do produto.

Schema:

```prisma
model ProductOptionGroup {
  // …
  pricingRule PricingRule @default(SUM)
}

enum PricingRule {
  SUM       // cada item escolhido soma (adicionais de pizza)
  HIGHEST   // só o item mais caro conta (meio-a-meio: 2 sabores → preço do mais caro)
  AVERAGE   // média dos itens (alguns deliveries usam pra meio-a-meio)
  REPLACE   // o item escolhido SUBSTITUI o preço base (tamanho: P/M/G já têm preço final)
}
```

O template **sugere** a regra ao criar um group default ("Sabores" do template Pizzaria já vem com `HIGHEST`), mas o tenant edita livre.

---

## 4. Templates como configuração

Cada template é um **preset** que define:

1. **Tema visual** — paleta, fonte, density, ordem dos blocos. Hoje hardcoded em `App.tsx`.
2. **Defaults de produto** — o painel "Novo produto" pré-preenche os groups esperados.
3. **Layout do cardápio público** — grid de cards, layout de modal, formato da mensagem WhatsApp.

Adicionar coluna no `Establishment`:

```prisma
model Establishment {
  // …
  template Template @default(SALGADERIA)
}

enum Template {
  SALGADERIA
  DOCERIA
  BOLARIA
  PIZZARIA
}
```

E no frontend:

```ts
// src/templates/registry.ts
export const TEMPLATES: Record<Template, TemplateDef> = {
  SALGADERIA: {
    name: "Salgaderia",
    palette: { primary: "#f97316", surface: "#f6f6f0" },
    fonts: { display: "Inter", body: "Inter" },
    productDefaults: {
      pricingType: "HUNDRED",
      minQuantity: 25,
      stepQuantity: 25,
      optionGroups: [] // sem opções
    },
    publicLayout: "grid-with-search", // o atual
    whatsappFormat: "simple",
    cardSize: "compact"
  },
  DOCERIA: {
    name: "Doceria",
    palette: { primary: "#db2777", surface: "#fdf2f8" },
    fonts: { display: "Playfair Display", body: "Inter" },
    productDefaults: {
      pricingType: "HUNDRED",
      optionGroups: [
        { name: "Adicionais", selectionType: "MULTIPLE", required: false }
      ]
    },
    publicLayout: "grid-by-subcategory", // estilo Cassia
    whatsappFormat: "by-category",
    cardSize: "tall"
  },
  BOLARIA: {
    name: "Bolaria / Confeitaria",
    palette: { primary: "#714d3b", surface: "#fcf9f5" }, // Cassia
    fonts: { display: "Playfair Display", body: "Inter" },
    productDefaults: {
      pricingType: "UNIT",
      optionGroups: [
        { name: "Tamanho", selectionType: "SINGLE", required: true },
        { name: "Cobertura", selectionType: "SINGLE", required: false }
      ]
    },
    publicLayout: "subcategory-sections",
    whatsappFormat: "by-category-with-options",
    cardSize: "tall"
  },
  PIZZARIA: {
    name: "Pizzaria",
    palette: { primary: "#dc2626", surface: "#1c1917" },
    fonts: { display: "Bebas Neue", body: "Inter" },
    productDefaults: {
      pricingType: "UNIT",
      optionGroups: [
        { name: "Tamanho", selectionType: "SINGLE", required: true },
        { name: "Borda", selectionType: "SINGLE", required: false },
        { name: "Adicionais", selectionType: "MULTIPLE", required: false },
        { name: "Sabores", selectionType: "SINGLE", required: true, maxSelections: 2 }
      ]
    },
    publicLayout: "category-tabs-dark",
    whatsappFormat: "by-category-with-options",
    cardSize: "wide"
  }
};
```

**Decisão tomada**: tenant escolhe cor primária + tokens secundários (cor de botão, cor de destaque) **dentro** do template. O template define o ponto de partida (paleta default, fontes, layout); o tenant ajusta as cores dele em cima disso.

Schema:
```prisma
model Establishment {
  // …
  template      Template @default(SALGADERIA)
  primaryColor  String   @default("#f97316")   // já existe
  accentColor   String?                        // a adicionar — botão CTA secundário
  surfaceColor  String?                        // a adicionar — fundo da página
}
```

No frontend, o template define **defaults**; quando o tenant salva uma cor, ela vira CSS variable e sobrescreve a do template:

```html
<html data-template="bolaria"
      style="--color-primary: #db2777; --color-accent: #f59e0b;">
```

Sem cor salva → cai na default do template.

---

## 5. Mudanças no admin

Quando o tenant escolhe template:

- Painel Mãe ganha aba **"Estrutura do produto"** com os groups predefinidos do template, editáveis.
- Form de novo produto pré-popula os groups.
- Se trocar de template depois, **manter** os products existentes e perguntar se quer reset dos groups (perigoso) ou só atualizar o tema.

**Decisão tomada**: tenant **pode** trocar de template a qualquer momento. Trocar template muda **só o tema** (paleta default, fontes, layout do cardápio público, defaults de novo produto). Os products já cadastrados e seus option groups ficam intactos. Cores customizadas pelo tenant também ficam — ele pode resetar manualmente clicando em "Voltar ao tema do template" se quiser.

---

## 6. Mudanças no cardápio público

```
ProductCard
  ├─ produto sem groups → quick-add (jeito atual)
  └─ produto com groups → abre <ProductModal />

ProductModal (genérico, não Cassia-específico)
  ├─ image header
  ├─ name + description
  ├─ for each optionGroup:
  │   ├─ name + required badge
  │   └─ render por selectionType (SINGLE | MULTIPLE | QUANTITY)
  ├─ observação livre (renderiza só se Product.allowsNotes === true)
  ├─ quantity stepper
  └─ live price calc → button "Adicionar — R$ X,XX"
```

Esse modal é **único**. O que muda entre templates é o **tema** (cores, fonte) e o **conteúdo** dos `optionGroups` que vêm do banco. Diferente de Cassia que tem branches no JSX.

**Observação livre — decisão tomada**: flag `allowsNotes Boolean @default(false)` no `Product`. O template **sugere** o default ao criar produto novo (pizzaria → marca; salgaderia → desmarca), mas é toggle por produto no painel — o tenant decide caso a caso.

---

## 7. Roadmap em fases

### Fase 1 — Modal genérico, mesma base atual (1–2 semanas)

- Schema: adicionar `ProductOptionGroup` + `ProductOptionItem` (opcionais, sem migração obrigatória de dados).
- Frontend público: `<ProductModal />` genérico que renderiza groups; cards continuam quick-add quando produto não tem groups.
- Painel: form de produto ganha seção "Opções" colapsada (sem mudar UX dos que não usam).
- WhatsApp: formato com opções selecionadas.
- **Resultado**: Salgaderia continua igual; doceria já consegue cadastrar brigadeiro com adicional.

### Fase 2 — Coluna `template` + tema visual (1 semana)

- Adicionar `Template` no schema.
- Registry de templates no frontend (paleta + fonts + defaults).
- CSS variables aplicadas no `<html data-template="...">`.
- Painel: seletor de template no onboarding e nos ajustes.
- **Resultado**: tenant escolhe "Bolaria" e o cardápio público muda visual sem tocar no banco de produto.

### Fase 3 — Bolaria (template Cassia) e Doceria (1–2 semanas)

- Defaults de option groups para bolo/torta/brigadeiro.
- Layout `subcategory-sections` para o cardápio público.
- Card alto com aspect-ratio 4:5.
- Paleta marrom-claro + Playfair.

### Fase 4 — Pizzaria (3–4 semanas)

- Suporte a meio-a-meio (`pricingRule` no group).
- Defaults de borda, adicionais, sabores.
- Tema escuro (red on slate-950).
- Mensagem WhatsApp com formato de meio-a-meio.

### Fase 5 — Editor de tema custom no painel (depois da Fase 2)

Movido pra dentro do roadmap principal porque a decisão é que o tenant **sempre** pode customizar cores. Em ajustes do estabelecimento:

- Color picker para `primaryColor`, `accentColor`, `surfaceColor`.
- Preview ao vivo do cardápio público no painel.
- Botão "Voltar ao tema do template" que limpa overrides.
- (Opcional, fase futura) upload de fonte custom — provavelmente nunca.

---

## 8. Pontos abertos e riscos

**Cache do `/api/public/menu/:subdomain`** — option groups + items adicionam 2 joins por request. O cardápio público é o endpoint mais quente. Estratégia:

- **MVP**: sem cache. Postgres aguenta enquanto somos pequenos.
- **Quando crescer** (top de latência ou tenant com 200+ produtos): adicionar `ETag` + 304 — simples, sem nova infra.
- **Última opção**: Redis. Só se ETag não der conta.

Adicionar instrumentação de p95 do endpoint pra saber a hora certa de migrar.

**WhatsApp message size** — pizza com 8 adicionais + meio-a-meio + observação pode estourar 4096 chars. Implementar truncamento por linha quando passar de 3500 chars (com aviso "ver pedido completo no painel").

**Foto Pro com IA por nicho** — prompt atual é genérico. Adicionar `aiPromptHint` no `TemplateDef`:
- Bolaria: "professional photo of a homemade cake, soft natural light"
- Pizzaria: "professional photo of an italian pizza, top view, warm tones"
- Doceria: "professional photo of a brazilian sweet, close-up, pastel"
- Salgaderia: "professional photo of a brazilian salgado, golden brown, appetizing"

---

## 9. Pra usar de referência visual

Não copiar arquivo: copiar **padrão de componente**.

- Modal fade-in + slide-from-bottom em mobile, centered em desktop → usar Tailwind `animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0`.
- Drag handle no topo do modal mobile (barra fina branca/60).
- Pills de seleção: `rounded-xl border-2 px-4 py-3` com estado ativo `border-{primary}-500 bg-{primary}-50`.
- Spinner +/- com bg-stone-50 / rounded-xl.
- Button "Adicionar" full-width com preço alinhado à direita em bold.
- Floating cart button: `fixed bottom-4 right-4` respeitando `safe-area-inset`.

Esses 6 padrões resolvem 80% do "porque parece profissional".
