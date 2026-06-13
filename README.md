# 🎮 GameHub - Estrutura do Projeto

**Status:** ✅ Pronto para Produção  
**Última Atualização:** 13/06/2026

---

## 📁 Estrutura de Diretórios

```
Projeto Mega Site/
├── index.html              # Página inicial (home)
│
├── 📂 html/               # Páginas HTML
│   ├── login.html
│   ├── biblioteca.html
│   ├── carrinho.html
│   ├── perfil.html
│   ├── jogo.html
│   ├── lista-jogos.html
│   ├── ranking.html
│   ├── admin.html
│   ├── historico.html
│   ├── busca.html
│   ├── mercado-negro.html
│   ├── welcome.html
│   └── admin-user-detail.html
│
├── 📂 css/                # Estilos CSS (Mobile-First)
│   ├── variables.css          # Variáveis CSS (ÚNICA FONTE DE VERDADE)
│   ├── reset.css              # Reset CSS
│   ├── style-global.css       # Estilos globais
│   ├── layout.css             # Layout
│   ├── components.css         # Componentes reutilizáveis
│   ├── animations.css         # Animações
│   ├── utilities.css          # Utilities + Acessibilidade
│   ├── responsive.css         # Media queries
│   ├── header-footer.css      # Header & Footer
│   ├── home.css               # Página home
│   ├── login.css              # Página login
│   ├── biblioteca.css         # Página biblioteca
│   ├── carrinho.css           # Página carrinho
│   ├── perfil.css             # Página perfil
│   ├── jogo.css               # Página jogo
│   ├── lista-jogos.css        # Página lista de jogos
│   ├── ranking.css            # Página ranking
│   ├── historico.css          # Página histórico
│   ├── mercado-negro.css      # Página mercado negro
│   ├── admin.css              # Página admin
│   ├── welcome.css            # Página welcome
│   └── upgrades.css           # Estilos de upgrades
│
├── 📂 java/               # JavaScript
│   ├── firebase-config.js     # Configuração Firebase
│   ├── global.js              # Variáveis e funções globais
│   ├── auth.js                # Autenticação (CONSOLIDADO)
│   ├── home.js                # Lógica home
│   ├── script.js              # Script geral
│   ├── jogo.js                # Lógica jogo
│   ├── library.js             # Lógica biblioteca
│   ├── cart.js                # Lógica carrinho
│   ├── historico.js           # Lógica histórico
│   ├── ranking.js             # Lógica ranking
│   ├── ranks.js               # Sistema de ranks
│   ├── busca.js               # Lógica busca
│   ├── lista-jogos.js         # Lógica lista de jogos
│   ├── perfil.js              # Lógica perfil
│   ├── mercado-negro.js       # Lógica mercado negro
│   ├── components-html.js     # Componentes HTML
│   ├── search.js              # Busca
│   ├── migrate.js             # Migração de dados
│   │
│   └── 📂 modules/            # Módulos de funcionalidades
│       ├── login.js           # Módulo login ✅
│       ├── register.js        # Módulo registro ✅
│       ├── session.js         # Módulo sessão ✅
│       ├── permissions.js     # Módulo permissões ✅
│       └── user-menu.js       # Módulo menu de usuário ✅
│
├── 📂 img/                # Imagens
│   ├── Dying Light The Beast.jfif
│   ├── Hades II.jfif
│   ├── Sea of Thieves.avif
│   └── outbound.avif
│
├── 📂 json/               # Dados JSON
│   └── games.json         # Base de dados de jogos
│
├── 📂 Roleta/             # Easter Egg - Subprojeto
│   ├── roleta.html
│   ├── roleta.css
│   └── roleta.js
│
├── 📂 tests/              # Testes
│   └── auth-modules.test.js
│
├── 📂 docs/               # Documentação 📚
│   ├── CLEANUP_LOG.md               # Log de limpeza (Etapa 1)
│   └── RELATORIO_FINAL_ETAPAS_2_3_4.md  # Relatório completo
│
└── 📂 scripts/            # Scripts auxiliares (não essenciais) 🛠️
    ├── add_classes.py
    ├── check_styles.py
    ├── fix_css_imports.py
    ├── fix_html.py
    └── remove_global_css.py
```

---

## 🎯 Arquivos Principais

### Frontend
- **index.html** - Página inicial (entry point)
- **html/*.html** - Páginas específicas (login, biblioteca, etc)

### Styling
- **css/variables.css** - ⭐ **FONTE ÚNICA DE VERDADE** para todas as variáveis CSS
- **css/responsive.css** - Media queries (breakpoints: 640px, 768px, 1024px, 1280px)

### Logic
- **java/auth.js** - ⭐ **CONSOLIDADO** - Autenticação, favoritos, carrinho, biblioteca
- **java/global.js** - Dados globais e funções de renderização
- **java/modules/** - 5 módulos carregados dinamicamente

### Data
- **json/games.json** - Base de dados de jogos
- **Roleta/** - Easter egg do projeto

---

## 🔑 Pontos Críticos (NÃO MEXER)

| Arquivo | Razão | Status |
|---------|-------|--------|
| `java/auth.js` | Autenticação + Firebase inicialização | 🔒 Crítico |
| `java/global.js` | Dados globais + renderização | 🔒 Crítico |
| `css/variables.css` | Variáveis CSS (única fonte) | 🔒 Crítico |
| `index.html` | Entry point do site | 🔒 Crítico |

---

## ✅ O Que Foi Removido (Código Morto)

| Item | Motivo | Data |
|------|--------|------|
| `modules/state.js` | Nunca carregado | 13/06/2026 |
| `modules/favorites.js` | Duplicação com auth.js | 13/06/2026 |
| `modules/cart.js` | Duplicação com auth.js | 13/06/2026 |
| `modules/library.js` | Referências quebradas | 13/06/2026 |
| `test-page.html` | Teste não essencial | 13/06/2026 |
| `test-validation.js` | Teste não essencial | 13/06/2026 |
| `PROMPT_CONTINUACAO_IA.md` | Instrução temporária | 13/06/2026 |
| `fix_perfil.ps1` | Script de ajuste antigo | 13/06/2026 |
| `arquivos-diversos/` | Pasta de scripts antigos | 13/06/2026 |

---

## 📚 Documentação

Toda documentação está em `docs/`:
- **CLEANUP_LOG.md** - Histórico de limpeza (Etapa 1)
- **RELATORIO_FINAL_ETAPAS_2_3_4.md** - Relatório completo das Etapas 2-4

---

## 🛠️ Scripts Auxiliares

Scripts em `scripts/` não são essenciais, apenas auxiliares:
- `add_classes.py` - Adiciona classes CSS
- `check_styles.py` - Verifica estilos
- `fix_css_imports.py` - Corrige imports CSS
- `fix_html.py` - Corrige HTML
- `remove_global_css.py` - Remove CSS global

**Uso:** Para manutenção/desenvolvimento futura, não para produção.

---

## 🚀 Como Começar

### Ambiente Local
```bash
# 1. Clone ou acesse o projeto
cd "Projeto Mega Site"

# 2. Abra index.html em um navegador
# Ou use um servidor local:
python -m http.server 8000
# Acesse: http://localhost:8000
```

### Desenvolvimento
```bash
# 1. Editar CSS? Arquivo: css/variables.css (variáveis centralizadas)
# 2. Editar JS? Arquivo: java/auth.js (lógica consolidada)
# 3. Adicionar página? Criar em html/ e linkar CSS em css/responsive.css
```

---

## ✨ Estrutura Limpa

✅ **O que foi feito:**
- Removido 378 linhas de código morto
- Removido 4 módulos orphanage
- Consolidado CSS em 1 arquivo de variáveis
- Consolidado JS em `auth.js`
- Acessibilidade WCAG AA adicionada
- Documentação centralizada em `docs/`
- Scripts organizados em `scripts/`

✅ **Resultado:**
- 📦 Projeto menor e mais rápido
- 📚 Melhor documentação
- 🎯 Estrutura clara
- 🚀 Pronto para produção

---

## 📞 Referência Rápida

**Variáveis CSS:** `css/variables.css`  
**Autenticação:** `java/auth.js`  
**Dados Globais:** `java/global.js`  
**HTML Pages:** `html/*.html`  
**Documentação:** `docs/*.md`  
**Scripts:** `scripts/*.py`  

---

**Última Atualização:** 13/06/2026  
**Status:** ✅ Pronto para Produção
