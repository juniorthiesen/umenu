# 🚀 Guia de Deploy - Salgados & Cia v1.0

## 📋 **Pré-requisitos para Deploy**

### **Verificações Antes do Deploy**
- ✅ Todos os testes passando
- ✅ Build funcionando sem erros
- ✅ Performance otimizada
- ✅ Responsividade testada
- ✅ Integração WhatsApp funcionando

---

## 🌐 **Opções de Deploy**

### **1. Vercel (Recomendado)**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy para produção
vercel --prod
```

**Configuração automática:**
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

### **2. Netlify**

```bash
# Build local
npm run build

# Fazer upload da pasta dist/ no Netlify
# Ou conectar repositório GitHub
```

**Configurações:**
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 18

### **3. GitHub Pages**

```bash
# Instalar gh-pages
npm install --save-dev gh-pages

# Adicionar script no package.json
"homepage": "https://seu-usuario.github.io/salgados-cia",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

# Deploy
npm run deploy
```

### **4. Firebase Hosting**

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar
firebase init hosting

# Deploy
firebase deploy
```

---

## Configurações de Produção

### Variáveis de Ambiente
Crie um arquivo `.env.production`:

```env
# Informações do Negócio
VITE_BUSINESS_PHONE=5511999998888
VITE_BUSINESS_NAME="Salgados & Cia"
VITE_BUSINESS_ADDRESS="Palmas, PR"

# Analytics e Tracking
REACT_APP_META_PIXEL_ID=123456789012345
REACT_APP_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# WhatsApp Business
REACT_APP_WHATSAPP_PHONE=5511999998888
```

**Como obter os IDs:**
- **Meta Pixel ID**: Acesse [Facebook Events Manager](https://business.facebook.com/events_manager) → Selecione seu pixel → Copie o ID (15 dígitos)
- **Google Analytics ID**: Acesse [Google Analytics](https://analytics.google.com) → Admin → Streams de dados → Copie o ID de medição
- **WhatsApp Phone**: Número do WhatsApp Business no formato internacional (5511999998888)

### Otimizações de Build

```javascript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons: ['lucide-react']
        }
      }
    }
  }
})
```

---

## 🔧 **Configurações de Servidor**

### **Headers de Segurança**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### **Cache Headers**
```
# Static assets
Cache-Control: public, max-age=31536000, immutable

# HTML
Cache-Control: public, max-age=0, must-revalidate
```

---

## 📊 **Monitoramento**

### **Analytics (Opcional)**
```javascript
// Google Analytics 4
gtag('config', 'GA_MEASUREMENT_ID');

// Eventos customizados
gtag('event', 'add_to_cart', {
  currency: 'BRL',
  value: itemPrice,
  items: [...]
});
```

### **Error Tracking**
```javascript
// Sentry (opcional)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_DSN_HERE",
  environment: "production"
});
```

---

## 🧪 **Testes de Produção**

### **Checklist Pré-Deploy**
- [ ] **Performance**: Lighthouse Score > 90
- [ ] **Acessibilidade**: WCAG 2.1 AA
- [ ] **SEO**: Meta tags configuradas
- [ ] **Mobile**: Testado em dispositivos reais
- [ ] **WhatsApp**: Integração funcionando
- [ ] **Carrinho**: Persistência funcionando
- [ ] **Busca**: Resultados relevantes
- [ ] **Imagens**: Lazy loading ativo

### **Testes Automatizados**
```bash
# Performance
npm run lighthouse

# Acessibilidade
npm run a11y

# Testes E2E
npm run e2e
```

---

## 🔄 **CI/CD (GitHub Actions)**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

---

## 📱 **PWA (Opcional)**

### **Service Worker**
```javascript
// sw.js
const CACHE_NAME = 'salgados-cia-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});
```

### **Manifest**
```json
{
  "name": "Salgados & Cia",
  "short_name": "Salgados",
  "description": "Sistema de pedidos online",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#f97316",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

## 🔒 **Segurança**

### **Content Security Policy**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               img-src 'self' https:; 
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';">
```

### **HTTPS**
- ✅ Sempre usar HTTPS em produção
- ✅ Configurar redirecionamento HTTP → HTTPS
- ✅ Usar HSTS headers

---

## 📈 **Otimizações Pós-Deploy**

### **Performance**
- **CDN**: Usar CDN para assets estáticos
- **Compression**: Gzip/Brotli habilitado
- **Minification**: CSS/JS minificados
- **Tree Shaking**: Código não usado removido

### **SEO**
```html
<!-- Meta tags essenciais -->
<title>Salgados & Cia - Pedidos Online</title>
<meta name="description" content="Faça seu pedido online na Salgados & Cia. Salgados frescos e deliciosos para sua festa.">
<meta name="keywords" content="salgados, festa, pedidos online, Palmas PR">

<!-- Open Graph -->
<meta property="og:title" content="Salgados & Cia">
<meta property="og:description" content="Sistema de pedidos online">
<meta property="og:image" content="/og-image.jpg">
<meta property="og:url" content="https://salgados-cia.vercel.app">
```

---

## 🎯 **Próximos Passos**

### **Pós-Deploy Imediato**
1. **Testar** todas as funcionalidades em produção
2. **Configurar** monitoramento de erros
3. **Verificar** performance com Lighthouse
4. **Testar** em dispositivos reais
5. **Configurar** backup automático

### **Melhorias Futuras**
1. **Analytics** - Implementar tracking
2. **A/B Testing** - Testar variações
3. **Push Notifications** - Notificar clientes
4. **Offline Support** - Funcionar sem internet
5. **API Backend** - Migrar para backend próprio

---

## 📞 **Suporte**

### **Problemas Comuns**
- **Build falha**: Verificar dependências e Node version
- **Deploy lento**: Otimizar bundle size
- **Imagens não carregam**: Verificar CORS e URLs
- **WhatsApp não abre**: Testar em dispositivos móveis

### **Contato**
- 📧 **Email**: suporte@salgados-cia.com
- 💬 **WhatsApp**: +55 11 99999-8888
- 🐛 **Issues**: GitHub Issues

---

**Status**: ✅ **PRONTO PARA DEPLOY**  
**Última atualização**: Janeiro 2025