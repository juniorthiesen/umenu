# 🏷️ Sistema de Promoções - Salgados & Cia

## 📋 **Visão Geral**

O sistema de promoções permite configurar ofertas especiais nos produtos com desconto percentual, preços promocionais e datas de validade. As promoções são exibidas de forma atrativa na interface e incluídas automaticamente nos cálculos de preço.

---

## 🛠️ **Como Configurar Promoções**

### **Estrutura da Promoção**

```typescript
promotion: {
  isActive: boolean;           // Se a promoção está ativa
  promotionalPrice: number;    // Preço com desconto
  discountPercentage: number;  // Percentual de desconto
  validUntil?: string;        // Data de expiração (ISO string)
  label?: string;             // Texto do badge ("OFERTA", "PROMOÇÃO", etc.)
}
```

### **Exemplo de Configuração**

```typescript
{
  id: 1,
  name: 'Pastel',
  price: 130.00,
  pricingType: 'cento',
  // ... outras propriedades
  promotion: {
    isActive: true,
    promotionalPrice: 110.00,
    discountPercentage: 15,
    validUntil: '2025-02-28T23:59:59',
    label: 'OFERTA'
  }
}
```

---

## 🎨 **Elementos Visuais**

### **1. Badge de Promoção**
- **Localização**: Canto superior esquerdo do produto
- **Cores**: Fundo vermelho com texto branco
- **Ícone**: Tag icon do Lucide React
- **Texto**: Configurável via `label` (padrão: "OFERTA")

### **2. Preços no Card**
- **Preço Original**: Riscado em cinza
- **Preço Promocional**: Destacado em vermelho
- **Badge de Desconto**: Percentual em verde (desktop)
- **Economia**: Valor economizado em verde

### **3. Carrinho de Compras**
- **Badge no Item**: Pequeno badge no canto do produto
- **Preços Detalhados**: Original riscado + promocional
- **Resumo de Economia**: Total economizado destacado
- **Percentual**: Badge com desconto aplicado

---

## 🔧 **Funções Utilitárias**

### **getEffectivePrice(item)**
Retorna o preço efetivo (promocional ou normal) considerando validade.

```typescript
const effectivePrice = getEffectivePrice(product);
// Retorna: promotionalPrice se ativo, senão price normal
```

### **isPromotionActive(product)**
Verifica se a promoção está ativa e dentro da validade.

```typescript
const isActive = isPromotionActive(product);
// Retorna: true se promoção ativa e válida
```

### **getDiscountAmount(product)**
Calcula o valor absoluto do desconto.

```typescript
const discount = getDiscountAmount(product);
// Retorna: price - promotionalPrice
```

---

## 📱 **Integração WhatsApp**

### **Mensagem Aprimorada**
As promoções são automaticamente incluídas na mensagem do WhatsApp:

```
*Pastel*
🏷️ OFERTA (-15%)
~~R$ 130,00~~ ➜ R$ 110,00 / cento
Quantidade: 50 unidades
Subtotal: R$ 55,00

*Total do Pedido: R$ 55,00*
💰 *Você economizou: R$ 10,00*
```

---

## ⏰ **Gerenciamento de Validade**

### **Formato de Data**
Use formato ISO 8601 para `validUntil`:
```typescript
validUntil: '2025-02-28T23:59:59'  // 28 de fevereiro de 2025, 23:59
```

### **Comportamento de Expiração**
- **Automático**: Promoções expiradas são automaticamente desativadas
- **Tempo Real**: Verificação a cada renderização
- **Fallback**: Retorna ao preço normal quando expirada

---

## 🎯 **Tipos de Promoção Sugeridos**

### **1. Ofertas Relâmpago**
```typescript
promotion: {
  isActive: true,
  promotionalPrice: 90.00,
  discountPercentage: 25,
  validUntil: '2025-01-31T23:59:59',
  label: 'RELÂMPAGO'
}
```

### **2. Promoção de Fim de Semana**
```typescript
promotion: {
  isActive: true,
  promotionalPrice: 95.00,
  discountPercentage: 20,
  validUntil: '2025-01-26T23:59:59',
  label: 'FIM DE SEMANA'
}
```

### **3. Liquidação**
```typescript
promotion: {
  isActive: true,
  promotionalPrice: 80.00,
  discountPercentage: 30,
  validUntil: '2025-03-31T23:59:59',
  label: 'LIQUIDAÇÃO'
}
```

### **4. Combo Especial**
```typescript
promotion: {
  isActive: true,
  promotionalPrice: 85.00,
  discountPercentage: 15,
  label: 'COMBO'
}
```

---

## 📊 **Exemplos de Uso**

### **Promoção Simples (Sem Validade)**
```typescript
{
  id: 10,
  name: 'Mini Quiche Caprese',
  price: 6.50,
  promotion: {
    isActive: true,
    promotionalPrice: 5.00,
    discountPercentage: 23,
    label: 'PROMOÇÃO'
  }
}
```

### **Promoção com Validade**
```typescript
{
  id: 29,
  name: 'Brigadeiro Tradicional',
  price: 190.00,
  promotion: {
    isActive: true,
    promotionalPrice: 160.00,
    discountPercentage: 16,
    validUntil: '2025-02-15T23:59:59',
    label: 'DESCONTO'
  }
}
```

---

## 🧪 **Testes Implementados**

### **Cenários Testados**
- ✅ Promoção ativa sem validade
- ✅ Promoção ativa com validade futura
- ✅ Promoção expirada
- ✅ Produto sem promoção
- ✅ Cálculo de preço efetivo
- ✅ Cálculo de desconto
- ✅ Validação de ativação

### **Executar Testes**
```bash
npm test src/utils/__tests__/pricing.test.ts
```

---

## 🎨 **Customização Visual**

### **Cores dos Badges**
```css
/* Badge de promoção */
.promotion-badge {
  background: #ef4444; /* red-500 */
  color: white;
}

/* Preço promocional */
.promotional-price {
  color: #dc2626; /* red-600 */
}

/* Badge de desconto */
.discount-badge {
  background: #dcfce7; /* green-100 */
  color: #166534; /* green-800 */
}

/* Economia */
.savings-text {
  color: #16a34a; /* green-600 */
}
```

### **Responsividade**
- **Desktop**: Badge de desconto visível
- **Mobile**: Badge de desconto no overlay da imagem
- **Carrinho**: Layout compacto com informações essenciais

---

## 🚀 **Próximas Melhorias**

### **v1.1 - Planejado**
- [ ] **Promoções por Categoria**: Desconto em toda categoria
- [ ] **Promoções Combinadas**: "Leve 3, Pague 2"
- [ ] **Cupons de Desconto**: Códigos promocionais
- [ ] **Promoções por Quantidade**: Desconto progressivo

### **v1.2 - Futuro**
- [ ] **Dashboard de Promoções**: Interface administrativa
- [ ] **A/B Testing**: Testar diferentes promoções
- [ ] **Analytics**: Métricas de conversão
- [ ] **Notificações**: Alertas de promoções

---

## 📞 **Suporte**

### **Problemas Comuns**
- **Promoção não aparece**: Verificar `isActive: true`
- **Data não funciona**: Usar formato ISO 8601
- **Preço errado**: Verificar `promotionalPrice` vs `discountPercentage`
- **Badge não aparece**: Verificar importação do ícone `Tag`

### **Contato**
- 📧 **Email**: suporte@salgados-cia.com
- 💬 **WhatsApp**: +55 11 99999-8888
- 🐛 **Issues**: GitHub Issues

---

**Status**: ✅ **IMPLEMENTADO E TESTADO**  
**Última atualização**: Janeiro 2025