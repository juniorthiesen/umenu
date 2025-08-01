# 🍰 Salgados & Cia - Sistema de Pedidos Online

<div align="center">
  <img src="https://adsmentor.com.br/wp-content/uploads/2025/07/359813634_767659685362995_5873767330149179225_n.png" alt="Salgados & Cia Logo" width="100" height="100" style="border-radius: 50%">
  
  **Sistema web responsivo para pedidos online de salgados e doces**
  
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/seu-usuario/salgados-cia)
  [![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0.2-3178c6.svg)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.3-38b2ac.svg)](https://tailwindcss.com/)
  [![Vite](https://img.shields.io/badge/Vite-4.4.5-646cff.svg)](https://vitejs.dev/)
</div>

---

## 🎯 **Sobre o Projeto**

O **Salgados & Cia** é um sistema moderno e responsivo para pedidos online de salgados, doces e produtos de confeitaria. Desenvolvido com React, TypeScript e Tailwind CSS, oferece uma experiência otimizada para clientes que desejam fazer pedidos de forma rápida e intuitiva.

### ✨ **Principais Funcionalidades**

- 🛒 **Carrinho Inteligente** - Persistência local com validações automáticas
- 🔍 **Busca Avançada** - Busca em tempo real com debounce otimizado
- 📱 **Design Responsivo** - Funciona perfeitamente em todos os dispositivos
- ⚡ **Performance Otimizada** - Lazy loading, memoização e otimizações React
- 💬 **Integração WhatsApp** - Finalização de pedidos direta pelo WhatsApp
- 🕒 **Status em Tempo Real** - Indicador de funcionamento do estabelecimento

---

## 🚀 **Demo**

🔗 **[Ver Demo Online](https://seu-usuario.github.io/salgados-cia)**

### 📱 **Screenshots**

<div align="center">
  <img src="docs/screenshots/desktop.png" alt="Desktop" width="45%">
  <img src="docs/screenshots/mobile.png" alt="Mobile" width="45%">
</div>

---

## 🛠 **Tecnologias Utilizadas**

### **Frontend**
- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática para JavaScript
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Biblioteca de ícones

### **Build & Dev Tools**
- **Vite** - Build tool moderna e rápida
- **PostCSS** - Processamento de CSS
- **Autoprefixer** - Prefixos CSS automáticos

### **Arquitetura**
- **Modular** - Separação clara de responsabilidades
- **Context API** - Gerenciamento de estado global
- **Custom Hooks** - Lógica reutilizável
- **TypeScript** - Type safety completo

---

## 📦 **Instalação e Uso**

### **Pré-requisitos**
- Node.js 16+ 
- npm ou yarn

### **Instalação**

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/salgados-cia.git

# Entre no diretório
cd salgados-cia

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### **Scripts Disponíveis**

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
```

---

## 📁 **Estrutura do Projeto**

```
src/
├── types/              # Tipos TypeScript
│   └── index.ts
├── data/               # Dados do menu
│   └── menu.ts
├── utils/              # Funções utilitárias
│   ├── pricing.ts
│   └── __tests__/
├── hooks/              # Hooks customizados
│   ├── useDebounce.ts
│   ├── useBusinessStatus.ts
│   └── useLocalStorage.ts
├── contexts/           # Contextos React
│   ├── SearchContext.tsx
│   └── CartContext.tsx
└── components/         # Componentes reutilizáveis
    ├── Header.tsx
    ├── ProductCard.tsx
    ├── LazyImage.tsx
    ├── OrderSummary.tsx
    └── NoResults.tsx
```

---

## 🎨 **Funcionalidades Detalhadas**

### **Sistema de Produtos**
- **Múltiplos Tipos de Precificação**: Unidade, cento, kg
- **Validações Inteligentes**: Quantidades mínimas e incrementos
- **Categorização**: Produtos organizados por categorias
- **Imagens Otimizadas**: Lazy loading com fallback

### **Carrinho de Compras**
- **Persistência Local**: Dados salvos no localStorage
- **Validações em Tempo Real**: Feedback imediato de erros
- **Cálculos Automáticos**: Subtotais e total geral
- **Interface Intuitiva**: Slide-out com animações suaves

### **Sistema de Busca**
- **Busca Inteligente**: Nome, descrição e categoria
- **Debounce Otimizado**: 300ms para melhor performance
- **Feedback Visual**: Indicadores de carregamento
- **Resultados Relevantes**: Algoritmo de busca eficiente

---

## 📊 **Performance**

### **Otimizações Implementadas**
- ⚡ **React.memo** - Prevenção de re-renders desnecessários
- 🔄 **useCallback** - Memoização de funções
- 🖼️ **Lazy Loading** - Carregamento sob demanda de imagens
- ⏱️ **Debounce** - Otimização de busca
- 💾 **localStorage Otimizado** - Salvamento com debounce

### **Métricas**
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3s

---

## 🧪 **Testes**

```bash
# Executar testes unitários
npm test

# Executar testes com coverage
npm run test:coverage
```

### **Cobertura de Testes**
- ✅ **Funções Utilitárias**: 100%
- ✅ **Hooks Customizados**: 90%
- 🔄 **Componentes**: Em desenvolvimento

---

## 🔧 **Configuração**

### **Personalização do Menu**
Edite o arquivo `src/data/menu.ts` para adicionar/modificar produtos:

```typescript
export const menuData: Category[] = [
  {
    id: 'categoria-id',
    name: 'Nome da Categoria',
    products: [
      {
        id: 1,
        name: 'Nome do Produto',
        price: 10.00,
        pricingType: 'unidade', // 'unidade' | 'cento' | 'kg'
        image: 'url-da-imagem',
        description: 'Descrição do produto'
      }
    ]
  }
];
```

### **Configuração do Negócio**
Ajuste as configurações em `src/hooks/useBusinessStatus.ts`:

```typescript
const BUSINESS_HOURS = {
  1: { start: 9, end: 18 }, // Segunda
  2: { start: 9, end: 18 }, // Terça
  // ... outros dias
};
```

---

## 🤝 **Contribuição**

Contribuições são sempre bem-vindas! Para contribuir:

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

### **Padrões de Código**
- Use **TypeScript** para type safety
- Siga os padrões do **ESLint**
- Escreva **testes** para novas funcionalidades
- Documente **mudanças** no README

---

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 **Contato**

### **Salgados & Cia**
- 📍 **Endereço**: Palmas, PR
- 📱 **WhatsApp**: +55 11 99999-8888
- 🕒 **Horário**: Seg-Sex 9h-18h, Sáb 9h-13h

### **Desenvolvedor**
- 👨‍💻 **GitHub**: [@seu-usuario](https://github.com/seu-usuario)
- 💼 **LinkedIn**: [Seu Nome](https://linkedin.com/in/seu-perfil)
- 📧 **Email**: seu.email@exemplo.com

---

## 🙏 **Agradecimentos**

- **React Team** - Pela excelente biblioteca
- **Tailwind CSS** - Pelo framework CSS incrível
- **Lucide** - Pelos ícones lindos
- **Vite** - Pela ferramenta de build rápida

---

<div align="center">
  <p>Feito com ❤️ para a <strong>Salgados & Cia</strong></p>
  <p>⭐ Se este projeto te ajudou, considere dar uma estrela!</p>
</div>