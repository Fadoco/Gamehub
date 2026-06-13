# 🎯 PROMPT AVANÇADO - MELHORIAS, BUGS E OTIMIZAÇÕES DO GAMEHUB

**Data**: 2026-06-13  
**Status do Projeto**: ✅ Funcional | Pronto para otimizações  
**Versão**: 2.0 (Pós-Correções CSS)

---

## 📋 ÍNDICE EXECUTIVO

1. [Estado Atual do Projeto](#1-estado-atual)
2. [Bugs Conhecidos & Problemas Potenciais](#2-bugs-conhecidos)
3. [Melhorias de Performance](#3-melhorias-performance)
4. [Refatoração de Código](#4-refatoracao)
5. [Otimizações de Segurança](#5-seguranca)
6. [Melhorias de UX/UI](#6-melhorias-uxui)
7. [Priorização de Tarefas](#7-priorizacao)
8. [Checklist de Validação](#8-checklist)

---

## 1. ESTADO ATUAL DO PROJETO {#1-estado-atual}

### ✅ Implementado
- **Frontend**: HTML5 modular com CSS variables-driven
- **Estilos**: 24 arquivos CSS otimizados com breakpoints responsivos (mobile-first)
- **JavaScript**: 18 arquivos JS com modularização baseada em auth.js e global.js
- **Backend**: Firebase Firestore + Auth para usuários, biblioteca, carrinho, upgrades
- **Funcionalidades Core**:
  - ✅ Autenticação (login/registro/logout)
  - ✅ Biblioteca de jogos
  - ✅ Carrinho de compras
  - ✅ Sistema de Ranking
  - ✅ Roleta de Upgrades (Raro/Épico/Lendário/Dark Matter)
  - ✅ Caixas Misteriosas (Bronze/Prata/Ouro/Diamante)
  - ✅ Mercado Negro (compra com desconto)
  - ✅ Sistema de Favoritos
  - ✅ Histórico de Compras

### 🟡 Parcialmente Implementado
- **Responsividade**: Breakpoints definidos, mas faltam testes em dispositivos reais
- **Animações**: CSS animations presentes, mas sem sincronização com JS events
- **Acessibilidade**: Focus states e skip-link implementados, mas sem testes WCAG completos
- **Performance**: CSS e JS não minificados, sem cache-busting, sem lazy-loading de imagens

### ❌ Não Implementado
- **Notificações**: Sistema de toast existe mas sem persistência
- **Analytics**: Sem rastreamento de eventos do usuário
- **Testes**: Nenhum teste unitário ou E2E
- **Logging**: Sem sistema centralizado de logs
- **API Documentation**: Sem documentação de endpoints
- **PWA**: Sem service worker ou manifest
- **Monetização**: Sem sistema de moeda real (apenas simulação)

---

## 2. BUGS CONHECIDOS & PROBLEMAS POTENCIAIS {#2-bugs-conhecidos}

### 🔴 CRÍTICOS (Corrigir Imediatamente)

#### 2.1 Race Condition no Firebase Firestore
**Arquivo**: `java/auth.js` L475-L540  
**Problema**:
```javascript
// BUGGY: Leitura seguida de escrita sem transação
const currentBalance = window.userBalance;
await userRef.update({ balance: currentBalance - 50 });
```
**Risco**: Dois cliques rápidos podem deduzir mais de uma vez  
**Solução**: Usar Firebase Transactions ou batch writes
```javascript
// FIXO:
return await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(userRef);
    const newBalance = doc.data().balance - 50;
    if (newBalance < 0) throw new Error("Saldo insuficiente");
    transaction.update(userRef, { balance: newBalance });
});
```

#### 2.2 Falta de Validação de Entrada
**Arquivo**: `java/modules/register.js`  
**Problema**: Email e senha não são validados no cliente
```javascript
// BUGGY:
const email = document.querySelector('#email').value;
const password = document.querySelector('#password').value;
// Sem nenhuma validação... envia direto
firebase.auth().createUserWithEmailAndPassword(email, password);
```
**Risco**: Entradas malformadas causam erros 500 no Firebase  
**Solução**: Adicionar regex validation
```javascript
// FIXO:
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^.{6,}$/; // Mínimo 6 caracteres
if (!emailRegex.test(email)) throw new Error("Email inválido");
if (!passwordRegex.test(password)) throw new Error("Senha deve ter 6+ caracteres");
```

#### 2.3 Vazamento de Dados Sensíveis no Console
**Arquivo**: Múltiplos  
**Problema**: `console.log()` com dados do usuário em produção
```javascript
console.log("User:", window.auth.currentUser); // Expõe tokens
console.log("Balance:", window.userBalance);
```
**Risco**: Dados sensíveis visíveis em DevTools publicamente  
**Solução**: Implementar logger condicional
```javascript
// FIXO:
const DEBUG = false;
window.log = (msg, data) => {
    if (DEBUG) console.log(msg, data);
    else console.debug("[ENV=PROD]");
};
```

#### 2.4 Acesso Não Autorizado ao Carrinho/Biblioteca de Outros Usuários
**Arquivo**: `html/carrinho.html`, `html/biblioteca.html`  
**Problema**: Falta validação que `userID === localStorage.uid`
```javascript
// BUGGY: Qualquer um pode passar outro userID na URL
const user = db.collection('users').doc(userIdFromUrl).get();
```
**Risco**: Segurança crítica violada  
**Solução**: Validar ownership
```javascript
// FIXO:
if (window.auth.currentUser.uid !== userIdFromUrl) {
    throw new Error("Acesso negado");
}
```

### 🟠 ALTOS (Corrigir Próximas Semanas)

#### 2.5 Memory Leak em Event Listeners
**Arquivo**: `java/global.js` L89-120  
**Problema**: Event listeners nunca removidos
```javascript
// BUGGY:
window.addEventListener('resize', updateLayout);
// Sem nunca fazer removeEventListener
```
**Risco**: Múltiplos listeners acumulam, página fica lenta  
**Solução**: Gerenciar listeners com classe
```javascript
// FIXO:
class EventManager {
    constructor() { this.listeners = []; }
    on(element, event, handler) {
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
    }
    cleanup() {
        this.listeners.forEach(l => 
            l.element.removeEventListener(l.event, l.handler)
        );
        this.listeners = [];
    }
}
```

#### 2.6 CSS Inconsistente Entre Navegadores
**Arquivo**: `css/animations.css`  
**Problema**: Faltam vendor prefixes
```css
/* BUGGY:
animation: spin 2s linear infinite;
transform: rotate(45deg);
*/

/* FIXO: */
-webkit-animation: spin 2s linear infinite;
animation: spin 2s linear infinite;
-webkit-transform: rotate(45deg);
transform: rotate(45deg);
```

#### 2.7 Dados não Sincronizam Após Offline
**Arquivo**: `java/auth.js` (Firebase sync)  
**Problema**: Sem listeners de conexão
```javascript
// FIXO: Adicionar
firebase.database().ref('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
        console.log('connected');
        // Re-sync data
        window.loadUserData(window.auth.currentUser.uid);
    }
});
```

### 🟡 MÉDIOS (Corrigir Próximo Mês)

#### 2.8 N+1 Query Problem
**Arquivo**: `java/lista-jogos.js`  
**Problema**: Uma query por jogo em vez de batch
```javascript
// BUGGY:
games.forEach(game => {
    db.collection('games').doc(game.id).get(); // 100 queries!
});

// FIXO:
const gameIds = games.map(g => g.id);
db.collection('games').where(firebase.firestore.FieldPath.documentId(), 'in', gameIds).get();
```

#### 2.9 Sem Tratamento de Erro 404
**Arquivo**: Todas as páginas HTML  
**Problema**: Se firebase.json não carregar, página fica branca
```javascript
// FIXO: Adicionar try-catch global
window.addEventListener('error', (event) => {
    console.error('Erro global:', event.error);
    showErrorPage('Erro ao carregar página. Recarregue.');
});
```

#### 2.10 Imagens Não Otimizadas
**Arquivo**: `img/`  
**Problema**: JPEGs/PNGs grandes, sem WebP
```
- Dying Light The Beast.jfif: ~2.5MB
- Hades II.jfif: ~2.8MB
- Sea of Thieves.avif: ~1.5MB (melhor)
```
**Solução**: Usar ImageOptim ou TinyPNG, adicionar WebP
```html
<!-- FIXO: -->
<picture>
    <source srcset="image.webp" type="image/webp">
    <img src="image.jpg" alt="...">
</picture>
```

---

## 3. MELHORIAS DE PERFORMANCE {#3-melhorias-performance}

### 3.1 Otimizar JavaScript Bundle
**Current State**: 18 arquivos JS, ~150KB total (não minificados)  
**Target**: <50KB (minificado + gzipped)

**Ações**:
1. Minificar com UglifyJS/Terser
```bash
terser java/*.js -c -m -o java/bundle.min.js
```

2. Remover código morto
```javascript
// REMOVER estes métodos nunca chamados:
window.legacyLoginMethod = () => { ... }; // Não usado
window.oldCartSystem = () => { ... }; // Substituído
```

3. Lazy-load módulos não críticos
```javascript
// FIXO:
if (isMarketNegroPage) {
    await import('./mercado-negro.js');
}
```

### 3.2 Cache Strategy para Assets
**Problema**: CSS/JS recarregam sempre, sem cache  
**Solução**: Implementar cache-busting com hash
```html
<!-- BUGGY: -->
<script src="java/auth.js"></script>

<!-- FIXO: -->
<script src="java/auth.js?v=<%= BUILD_HASH %>"></script>
```

### 3.3 Lazy-Load de Imagens
```html
<!-- FIXO: -->
<img src="game.jpg" loading="lazy" alt="...">
```

### 3.4 Debounce de Eventos
**Arquivo**: `java/search.js`  
**Problema**: Query a cada keystroke
```javascript
// BUGGY:
input.addEventListener('input', (e) => {
    searchGames(e.target.value); // Muitos calls!
});

// FIXO:
const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};
input.addEventListener('input', debounce((e) => {
    searchGames(e.target.value);
}, 300));
```

### 3.5 Usar CSS Containment
```css
/* Melhora performance de repaints */
.game-card {
    contain: layout style paint;
}
```

---

## 4. REFATORAÇÃO DE CÓDIGO {#4-refatoracao}

### 4.1 Padronizar Estrutura de Módulos
**Problema**: Inconsistência entre auth.js, global.js e módulos
**Solução**: Implementar padrão CommonJS/ES6

```javascript
// FIXO: Todos os módulos seguem este padrão
class GameModule {
    constructor(db) {
        this.db = db;
        this.cache = new Map();
    }

    async getGames() {
        if (this.cache.has('games')) return this.cache.get('games');
        const games = await this.db.collection('games').get();
        this.cache.set('games', games);
        return games;
    }

    invalidateCache() {
        this.cache.clear();
    }
}

export default GameModule;
```

### 4.2 Consolidar Lógica de Validação
**Problema**: Validação espalhada em múltiplos arquivos
**Solução**: Criar `java/validators.js`

```javascript
// java/validators.js
export const validators = {
    email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    password: (pwd) => pwd.length >= 8 && /[A-Z]/.test(pwd),
    price: (price) => !isNaN(price) && price > 0,
    gameId: (id) => typeof id === 'number' && id > 0,
};

// Usage em qualquer arquivo:
import { validators } from './validators.js';
if (!validators.email(userEmail)) throw new Error("Email inválido");
```

### 4.3 Remover Duplicação em Rendering
**Problema**: `renderRoulette()` em roleta.js, `renderSpecialBoxInventory()` em mercado-negro.js  
**Solução**: Criar helper único

```javascript
// java/renderer.js
export function renderGameGrid(games, container, options = {}) {
    const {
        showPrice = true,
        showRank = true,
        onSelect = null,
        className = 'game-card'
    } = options;
    
    container.innerHTML = games.map(game => `
        <div class="${className}" data-id="${game.id}">
            <img src="${game.image}" alt="${game.title}">
            ${showPrice ? `<span class="price">${game.currentPrice}</span>` : ''}
            ${showRank ? `<span class="rank">${getRankBadge(game.id)}</span>` : ''}
        </div>
    `).join('');
    
    if (onSelect) {
        container.querySelectorAll(`.${className}`).forEach(el => {
            el.addEventListener('click', () => onSelect(el.dataset.id));
        });
    }
}
```

### 4.4 TypeScript Migration (Opcional mas Recomendado)
**Benefícios**: Type-safety, melhor IDE support, menos bugs
```typescript
// java/types.ts
interface Game {
    id: number;
    title: string;
    currentPrice: string;
    image: string;
    coverUrl?: string;
}

interface User {
    uid: string;
    email: string;
    balance: number;
    library: number[];
}
```

---

## 5. OTIMIZAÇÕES DE SEGURANÇA {#5-seguranca}

### 5.1 OWASP Top 10 Audit
- [ ] **A01:2021 - Broken Access Control**: Validar `window.auth.currentUser.uid` em TODAS operações
- [ ] **A02:2021 - Cryptographic Failures**: Usar HTTPS, não armazenar senhas em localStorage
- [ ] **A03:2021 - Injection**: Sanitizar inputs, usar parameterized queries
- [ ] **A04:2021 - Insecure Design**: Implementar rate limiting em login
- [ ] **A05:2021 - Security Configuration**: Remover console.logs de debug em produção

### 5.2 Firebase Security Rules Update
**Problema**: Regras atuais são genéricas
```javascript
// BUGGY: rules na firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;  // MUITO PERMISSIVO!
    }
  }
}

// FIXO:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /games/{document=**} {
      allow read: if true;  // Qualquer um pode ler
      allow write: if request.auth.token.admin == true;  // Só admins escrevem
    }
    match /transactions/{document=**} {
      allow create: if request.auth != null;
      allow read: if resource.data.userId == request.auth.uid;
    }
  }
}
```

### 5.3 Rate Limiting
```javascript
// java/rateLimiter.js
class RateLimiter {
    constructor(maxAttempts = 5, windowMs = 60000) {
        this.attempts = new Map();
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    async checkLimit(userId) {
        const key = `${userId}_${Date.now()}`;
        const attempts = this.attempts.get(userId) || [];
        const now = Date.now();
        const recentAttempts = attempts.filter(t => now - t < this.windowMs);
        
        if (recentAttempts.length >= this.maxAttempts) {
            throw new Error('Muitas tentativas. Tente mais tarde.');
        }
        
        this.attempts.set(userId, [...recentAttempts, now]);
    }
}
```

### 5.4 Input Sanitization
```javascript
// java/security.js
export function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Usage:
const safeName = sanitizeInput(userInput);
```

---

## 6. MELHORIAS DE UX/UI {#6-melhorias-uxui}

### 6.1 Melhorar Feedback Visual de Ações
**Problema**: Usuário não sabe se ação foi processada
```javascript
// FIXO: Adicionar loading state
async function purchaseGame(gameId) {
    const btn = document.getElementById(`buy-${gameId}`);
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    
    try {
        await completePurchase(gameId);
        btn.innerHTML = '✓ Adicionado à Biblioteca';
    } catch (err) {
        btn.innerHTML = 'Tentar Novamente';
        showErrorToast(err.message);
    } finally {
        btn.disabled = false;
    }
}
```

### 6.2 Melhorar Navegação Móvel
**Problema**: Menu fica escondido em mobile
```html
<!-- FIXO: Adicionar hamburger menu responsivo -->
<nav class="mobile-menu" id="mobile-menu">
    <button class="menu-toggle" onclick="toggleMobileMenu()">
        <i class="fas fa-bars"></i>
    </button>
</nav>

<style>
@media (max-width: 768px) {
    .main-nav { display: none; }
    .mobile-menu { display: block; }
}
</style>
```

### 6.3 Adicionar Dark Mode Toggle
```javascript
// java/theme.js
class ThemeManager {
    constructor() {
        this.isDark = localStorage.getItem('theme') === 'dark';
        this.apply();
    }

    toggle() {
        this.isDark = !this.isDark;
        this.apply();
        localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    }

    apply() {
        document.documentElement.setAttribute(
            'data-theme',
            this.isDark ? 'dark' : 'light'
        );
    }
}
```

### 6.4 Skeleton Loaders
```html
<!-- FIXO: Mostrar skeleton enquanto carrega -->
<div class="game-card skeleton" id="card-1">
    <div class="skeleton-image"></div>
    <div class="skeleton-text"></div>
</div>

<style>
.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
</style>
```

### 6.5 Toast Notifications com Queue
```javascript
// java/notifications.js
class NotificationManager {
    constructor() {
        this.queue = [];
        this.isShowing = false;
    }

    async show(message, type = 'info', duration = 3000) {
        this.queue.push({ message, type, duration });
        if (!this.isShowing) this.processQueue();
    }

    async processQueue() {
        while (this.queue.length > 0) {
            this.isShowing = true;
            const { message, type, duration } = this.queue.shift();
            await this.display(message, type, duration);
        }
        this.isShowing = false;
    }

    display(message, type, duration) {
        return new Promise(resolve => {
            const toast = this.createToastElement(message, type);
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.remove();
                resolve();
            }, duration);
        });
    }

    createToastElement(message, type) {
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.textContent = message;
        return el;
    }
}
```

---

## 7. PRIORIZAÇÃO DE TAREFAS {#7-priorizacao}

### ⭐⭐⭐ CRÍTICO (Semana 1)
1. Corrigir race condition no Firebase (Bug 2.1)
2. Adicionar validação de entrada (Bug 2.2)
3. Remover dados sensíveis de console (Bug 2.3)
4. Validar ownership de usuário (Bug 2.4)
5. Atualizar Firebase Security Rules (Seg 5.2)

### ⭐⭐ ALTO (Semana 2-3)
1. Implementar logger estruturado
2. Adicionar rate limiting
3. Refatorar estrutura de módulos
4. Otimizar JavaScript bundle
5. Adicionar testes unitários para validators

### ⭐ MÉDIO (Semana 4+)
1. Lazy-load de imagens
2. Dark mode toggle
3. Melhorias móveis
4. Analytics tracking
5. PWA implementation

---

## 8. CHECKLIST DE VALIDAÇÃO {#8-checklist}

### Antes de Fazer Deploy
- [ ] Todos os bugs críticos corrigidos
- [ ] Firebase rules auditadas
- [ ] Inputs validados
- [ ] Sem console.logs de debug
- [ ] Assets otimizados (<100KB total)
- [ ] Lighthouse score >90
- [ ] Teste em 3 navegadores diferentes
- [ ] Teste responsividade (320px, 768px, 1920px)
- [ ] Documentação atualizada
- [ ] Changelog criado

### Teste de Performance
```bash
# Lighthouse
lighthouse https://seu-site.com --output-path=./report.html

# Bundle analysis
webpack-bundle-analyzer dist/stats.json

# Performance monitoring
npm install web-vitals
# Adicionar tracking
```

### Teste de Segurança
```bash
# OWASP ZAP scan
zaproxy -cmd -quickurl https://seu-site.com -quickout report.html

# Dependency check
npm audit
npm audit fix
```

---

## 9. DOCUMENTAÇÃO COMPLEMENTAR NECESSÁRIA {#9-docs}

### Criar os Seguintes Documentos
1. **API.md** - Documentação de endpoints/funções Firebase
2. **ARCHITECTURE.md** - Diagrama de componentes e data flow
3. **SECURITY.md** - Políticas de segurança e compliance
4. **TROUBLESHOOTING.md** - Guia de resolução de problemas comuns
5. **DEPLOYMENT.md** - Processo de deploy com checklist

### Exemplo: API.md
```markdown
## Users Collection

### GET user(uid)
Retorna dados do usuário incluindo balance, library, upgrades

### Fields
- uid: string (primary key)
- email: string
- balance: number
- library: array<number> (game IDs)
- upgrades: object<gameId, level>
- createdAt: timestamp
- lastLogin: timestamp
```

---

## 10. TIMELINE SUGERIDA {#10-timeline}

```
Semana 1: Bugs Críticos + Security
├── 2.1 Race Condition Fix
├── 2.2 Input Validation
├── 2.3 Remove Console Logs
├── 2.4 Auth Check
└── 5.2 Firebase Rules

Semana 2-3: Refactor & Performance
├── 4.1 Padronizar Módulos
├── 3.1 Minificar JS
├── 3.4 Debounce Events
└── 6.1 Loading States

Semana 4+: UX & Analytics
├── 6.2 Mobile Improvements
├── 6.5 Better Notifications
├── PWA Implementation
└── Analytics Tracking
```

---

## 11. RECURSOS & FERRAMENTAS RECOMENDADAS {#11-recursos}

### Development
- **Prettier**: Auto-format código
- **ESLint**: Lint JS
- **Lighthouse**: Performance audit
- **OWASP ZAP**: Security testing

### Monitoring
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Google Analytics**: User behavior
- **Firebase Performance**: App metrics

### Deployment
- **GitHub Actions**: CI/CD
- **Vercel/Netlify**: Hosting
- **CloudFlare**: CDN + Security

### Commands Úteis
```bash
# ESLint
npx eslint java/*.js

# Prettier
npx prettier --write css/*.css

# Bundle Analysis
npx webpack-bundle-analyzer

# Performance Test
npm run lighthouse

# Security Audit
npm audit
```

---

## 12. CONCLUSÃO & PRÓXIMOS PASSOS {#12-conclusao}

**Status**: O GameHub está funcional mas precisa de:
1. ✅ Correções críticas de segurança
2. ✅ Otimizações de performance
3. ✅ Refatoração de código para manutenibilidade
4. ✅ Melhorias de UX

**Prioridade**: Comece com bugs críticos (Semana 1), depois performance e refactor (Semana 2-3).

**Estimativa de Esforço**:
- Bugs Críticos: 8-12 horas
- Refactor: 16-20 horas
- Performance: 12-16 horas
- UX Melhorias: 8-12 horas
- **Total: ~56 horas (~2 semanas de dev)**

---

## 📞 Questões para Próxima Iteração

1. Qual é a prioridade: Performance, Segurança ou UX?
2. Há requisitos de compliance (GDPR, PCI)?
3. Necessário suporte a múltiplos idiomas?
4. Vai usar analytics (Google, Mixpanel)?
5. Precisa de notificações push?
6. Vai monetizar com real money? (Stripe/PayPal integration)

---

**Criado em**: 2026-06-13  
**Versão**: 1.0  
**Autor**: IA Assistant  
**Status**: Pronto para Implementação
