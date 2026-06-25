# Auditoria Inicial - Mobile First (parcial)

Data: 2026-06-25

Resumo rápido:
- Objetivo: transformar o projeto em uma experiência mobile-first premium sem quebrar desktop.
- Escopo: varredura completa de HTML/CSS/JS, correções estruturais de header, tokens e utilitários.

Alterações realizadas (rápidas):
- Corrigido CSS quebrado em `css/variables.css` (sintaxe e adição de tokens responsivos e tipografia com `clamp()`).
- Adicionado sistema de header móvel: estilos em `css/header-footer.css` e inicialização dinâmica em `java/global.js` (hamburger, painel lateral, overlay, handlers acessíveis).
- Evitado uso de `100vw` que causava overflow: ajustado `.w-screen` em `css/utilities.css` para `width: 100%`.
- Adicionado regras globais para imagens responsivas e utilitário `.touch-target` em `css/utilities.css`.
- Adicionado `overflow-x: hidden` global em `css/style-global.css` para prevenir scroll horizontal indesejado.
- Garantido tamanho mínimo de botões (`.btn`) para touch (min-height e min-width 44px) e focus-visible por acessibilidade.

Arquivos alterados:
- `css/variables.css`  (fix + tokens responsivos)
- `css/header-footer.css` (mobile header styles)
- `css/utilities.css` (responsive images, touch-target, w-screen fix)
- `css/style-global.css` (overflow-x, button touch sizes)
- `java/global.js` (mobile header injection and handlers)

Problemas detectados (lista inicial para investigação completa):
- Uso disperso de `overflow: hidden` em diversos arquivos (busca, components, animations) — pode mascarar conteúdo em mobile.
- Algumas imagens e banners usam fixed widths (ex: `.wide-banner img { width: 40%; }` em `css/home.css`) que precisam ser revisadas para breakpoints menores.
- Tabelas administrativas usam `overflow-x: auto` (bom), mas precisam ser convertidas para cards em mobile onde fizer sentido (`css/admin.css`).
- Animações intensas e scripts (e.g., sistema "mercado-negro") podem impactar TTI / LCP — marcar para tuning.
- Componentes customizados (cards, toasts, modais) já possuem estilos, mas precisam de foco em espaçamento, hit-area e uso de clamp() para tipografia.

Próximos passos imediatos (implementarei em sequência):
1. Rodar varredura automatizada por CSS para coletar ocorrências de `overflow`, `100vw`, `width` fixo e `position: absolute` que causem overflow.
2. Corrigir padrões problemáticos em `home.css`, `busca.css`, `components.css` (grids, banners, largura fixa).
3. Implementar utilitários de grid mobile-first (CSS Grid auto-fit/minmax) e migrar as regras de `.game-grid` e `poster-grid` quando apropriado.
4. Revisar formulários e inputs (tamanho, labels, teclado) e ajustar `login-modal` e formulários de cadastro.
5. Gerar relatório final com todas correções e verificação página a página.

Se algo da auditoria inicial precisa ser revertido, informe qual alteração priorizo reverter.
