# 📋 PDR - Product Requirements Document
## Salgados & Cia - Sistema de Pedidos Online v1.0

---

## 🎯 **Visão Geral do Produto**

### **Nome do Produto**
Salgados & Cia - Sistema de Pedidos Online

### **Versão**
1.0.0

### **Data de Lançamento**
Janeiro 2025

### **Descrição**
Sistema web responsivo para pedidos online de salgados, doces e produtos de confeitaria, com integração direta ao WhatsApp para finalização de pedidos.

---

## 🏢 **Informações do Negócio**

### **Empresa**
Salgados & Cia

### **Localização**
Palmas, PR

### **Horário de Funcionamento**
- **Segunda a Sexta**: 09:00 às 18:00
- **Sábado**: 09:00 às 13:00
- **Domingo**: Fechado

### **Contato**
- **WhatsApp**: +55 11 99999-8888

---

## 👥 **Público-Alvo**

### **Usuário Primário**
- Clientes que desejam fazer pedidos de salgados para festas e eventos
- Faixa etária: 25-55 anos
- Localização: Palmas, PR e região

### **Casos de Uso Principais**
1. **Navegação do Cardápio**: Visualizar produtos disponíveis por categoria
2. **Busca de Produtos**: Encontrar produtos específicos rapidamente
3. **Gestão do Carrinho**: Adicionar, remover e modificar quantidades
4. **Finalização de Pedido**: Enviar pedido via WhatsApp

---

## 🎨 **Funcionalidades Principais**

### **1. Navegação e Visualização**
- ✅ **Cardápio Categorizado**: Produtos organizados por categorias
- ✅ **Design Responsivo**: Funciona em desktop, tablet e mobile
- ✅ **Status do Negócio**: Indicador visual de funcionamento
- ✅ **Lazy Loading**: Carregamento otimizado de imagens

### **2. Sistema de Busca**
- ✅ **Busca em Tempo Real**: Com debounce de 300ms
- ✅ **Busca Inteligente**: Por nome, descrição e categoria
- ✅ **Feedback Visual**: Indicador de busca ativa
- ✅ **Página de Sem Resultados**: Com opção de limpar busca

### **3. Gestão de Produtos**
- ✅ **Tipos de Precificação**: Unidade, cento, kg
- ✅ **Quantidades Mínimas**: Validação automática
- ✅ **Incrementos Personalizados**: Diferentes steps por produto
- ✅ **Validação de Entrada**: Feedback de erros em tempo real

### **4. Carrinho de Compras**
- ✅ **Persistência Local**: Dados salvos no localStorage
- ✅ **Gestão de Quantidades**: Adicionar, remover, modificar
- ✅ **Cálculo Automático**: Subtotais e total geral
- ✅ **Interface Lateral**: Slide-out cart com animações

### **5. Finalização de Pedido**
- ✅ **Integração WhatsApp**: Envio automático de pedido formatado
- ✅ **Resumo Detalhado**: Lista completa com quantidades e valores
- ✅ **Formatação Profissional**: Mensagem estruturada para o negócio

---

## 🛠 **Especificações Técnicas**

### **Arquitetura**
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Estrutura**: Modular com separação de responsabilidades

### **Estrutura do Projeto**
```
src/
├── types/           # Tipos TypeScript
├── data/            # Dados do menu
├── utils/           # Funções utilitárias
├── hooks/           # Hooks customizados
├── contexts/        # Contextos React
└── components/      # Componentes reutilizáveis
```

### **Dependências Principais**
- **React**: ^18.2.0
- **React DOM**: ^18.2.0
- **Lucide React**: ^0.263.1 (ícones)
- **TypeScript**: ^5.0.2
- **Tailwind CSS**: ^3.3.3
- **Vite**: ^4.4.5

### **Performance**
- ✅ **Lazy Loading**: Imagens carregadas sob demanda
- ✅ **Debounce**: Busca otimizada
- ✅ **React.memo**: Prevenção de re-renders desnecessários
- ✅ **useCallback**: Funções memoizadas
- ✅ **localStorage Debounced**: Salvamento otimizado

---

## 📱 **Compatibilidade**

### **Navegadores Suportados**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### **Dispositivos**
- ✅ **Desktop**: 1024px+
- ✅ **Tablet**: 768px - 1023px
- ✅ **Mobile**: 320px - 767px

### **Acessibilidade**
- ✅ **ARIA Labels**: Elementos acessíveis
- ✅ **Navegação por Teclado**: Focus management
- ✅ **Contraste**: Cores acessíveis
- ✅ **Screen Readers**: Compatibilidade

---

## 📊 **Catálogo de Produtos**

### **Categorias Disponíveis**
1. **Fritos** (9 produtos)
   - Pastel, Kibe, Risoles, Croquete, etc.
   - Precificação: Por cento (mínimo 25 unidades)

2. **Mini Quiches** (5 produtos)
   - Pêra e Gorgonzola, Caprese, Bacon e Milho, etc.
   - Precificação: Por unidade

3. **Salgados Especiais** (2 produtos)
   - Empada, Esfirra de Calabresa
   - Precificação: Por unidade

4. **Doces** (2 produtos)
   - Brigadeiro Tradicional, Beijinho
   - Precificação: Por cento (mínimo 25 unidades)

### **Tipos de Precificação**
- **Unidade**: Produtos vendidos individualmente
- **Cento**: Produtos vendidos em lotes de 100 (mínimo 25)
- **Kg**: Produtos vendidos por peso (incrementos de 0.5kg)

---

## 🔒 **Segurança e Privacidade**

### **Dados Coletados**
- ✅ **Carrinho de Compras**: Armazenado localmente
- ✅ **Nenhum Dado Pessoal**: Sistema não coleta informações pessoais
- ✅ **WhatsApp**: Redirecionamento para app externo

### **Armazenamento**
- **localStorage**: Apenas dados do carrinho
- **Sem Cookies**: Não utiliza cookies de rastreamento
- **Sem Analytics**: Não coleta dados de uso

---

## 🚀 **Roadmap Futuro**

### **v1.1 - Melhorias Planejadas**
- [ ] Sistema de favoritos
- [ ] Histórico de pedidos
- [ ] Calculadora de festa
- [ ] Notificações push

### **v1.2 - Funcionalidades Avançadas**
- [ ] Sistema de agendamento
- [ ] Múltiplas formas de pagamento
- [ ] Programa de fidelidade
- [ ] Dashboard administrativo

### **v2.0 - Expansão**
- [ ] Multi-tenant (múltiplas lojas)
- [ ] API backend
- [ ] App mobile nativo
- [ ] Sistema de delivery

---

## 📈 **Métricas de Sucesso**

### **KPIs Principais**
- **Taxa de Conversão**: % de visitantes que fazem pedidos
- **Tempo de Sessão**: Tempo médio no site
- **Taxa de Abandono do Carrinho**: % de carrinhos não finalizados
- **Satisfação do Cliente**: Feedback via WhatsApp

### **Métricas Técnicas**
- **Performance**: Lighthouse Score > 90
- **Acessibilidade**: WCAG 2.1 AA compliance
- **SEO**: Core Web Vitals otimizados
- **Uptime**: 99.9% de disponibilidade

---

## 🧪 **Testes e Qualidade**

### **Testes Implementados**
- ✅ **Testes Unitários**: Funções utilitárias
- ✅ **TypeScript**: Type safety
- ✅ **ESLint**: Code quality

### **Testes Planejados**
- [ ] **Testes de Componente**: React Testing Library
- [ ] **Testes E2E**: Cypress
- [ ] **Testes de Performance**: Lighthouse CI
- [ ] **Testes de Acessibilidade**: axe-core

---

## 📋 **Critérios de Aceitação**

### **Funcionalidade**
- ✅ Todos os produtos são exibidos corretamente
- ✅ Busca retorna resultados relevantes
- ✅ Carrinho persiste entre sessões
- ✅ Pedidos são enviados via WhatsApp formatados

### **Performance**
- ✅ Carregamento inicial < 3 segundos
- ✅ Busca responde em < 300ms
- ✅ Imagens carregam sob demanda
- ✅ Interface responsiva em todos os dispositivos

### **Usabilidade**
- ✅ Navegação intuitiva
- ✅ Feedback visual adequado
- ✅ Mensagens de erro claras
- ✅ Processo de pedido simples

---

## 🎯 **Conclusão**

O **Salgados & Cia v1.0** é um sistema completo e otimizado para pedidos online, focado na experiência do usuário e performance. Com arquitetura modular, design responsivo e integração direta ao WhatsApp, atende perfeitamente às necessidades do negócio e dos clientes.

**Status**: ✅ **PRONTO PARA PRODUÇÃO**

---

**Documento criado em**: Janeiro 2025  
**Última atualização**: Janeiro 2025  
**Versão do documento**: 1.0