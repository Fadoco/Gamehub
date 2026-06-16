# 🎨 VISUAL ASCII - Novo Sistema de Edição de Perfil

## 📍 Localização do Ícone

```
┌─────────────────────────────────────────────────────────────────┐
│                   BANNER DO PERFIL (1920x300)                   │
│                                                                 │
│      [✏️] ← NOVO ÍCONE AQUI (ESQUERDA)                          │
│    Gira e brilha ao passar mouse!                              │
│                                                                 │
│                                                                 │
│              (Banner customizado aparece aqui                  │
│               ou cor de gradiente por padrão)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 O Modal (Ao Clicar no Lápis)

### Desktop (650px)
```
┌─────────────────────────────────────────────────────┐
│  Personalizar Perfil                          [✕]  │ ← Header elegante
├─────────────────────────────────────────────────────┤
│                                                     │
│ 👤 Nick / Nome de Exibição                          │
│  ┌─────────────────────────────────────────────┐    │
│  │ Digite seu nick ou nome...            [15/50]   │ ← Contador
│  └─────────────────────────────────────────────┘    │
│                                                     │
│ 📝 Biografia                                        │
│  ┌─────────────────────────────────────────────┐    │
│  │ Conte um pouco sobre você...        [87/200]   │ ← Contador
│  │ (máx. 200 caracteres)                      │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│ 🖼️ Foto de Perfil                                  │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │         [Clique aqui ou arraste]             │ ← Preview
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│  JPG, PNG, GIF (até 5MB)                           │
│                                                     │
│ 🎨 Banner de Perfil                                │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │      [Clique aqui para fazer upload]         │   │ ← Preview
│  │                                              │   │ ← 16:9
│  └──────────────────────────────────────────────┘   │
│  JPG, PNG, GIF (até 10MB) - Recomendado: 1920x400 │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │  [✕ Cancelar]              [✓ Salvar Alter.] │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Mobile (90% width)
```
┌────────────────────────────┐
│ Personalizar Perfil    [✕] │
├────────────────────────────┤
│                            │
│ 👤 Nick                    │
│ [________] [12/50]         │
│                            │
│ 📝 Bio                     │
│ [________] [0/200]         │
│                            │
│ 🖼️ Avatar                 │
│ ┌──────────────────────┐   │
│ │  [Click to upload]   │   │
│ └──────────────────────┘   │
│ JPG, PNG, GIF (5MB)        │
│                            │
│ 🎨 Banner                  │
│ ┌──────────────────────┐   │
│ │  [Click to upload]   │   │
│ └──────────────────────┘   │
│ JPG, PNG, GIF (10MB)       │
│                            │
│ [Cancelar]                 │
│ [Salvar Alterações]        │
│                            │
└────────────────────────────┘
```

---

## 🎬 Animações

### Ícone do Lápis

**Estado Padrão:**
```
      [✏️]
   (Glow leve)
```

**Ao Passar Mouse:**
```
      [✏️]  → Rotaciona 10°
    ↻  
   (Glow forte + amplia)
```

**Ao Clicar:**
```
      [✏️]  → Scale 0.95
    ↙↘
   (Feedback de clique)
```

---

### Modal

**Antes de Abrir:**
```
(Modal está fora da tela)
(Overlay transparente)
(Nada visível)
```

**Abrindo (0.3s):**
```
Overlay: opacity 0 → 1 (com blur)
Modal:   scale 0.95 → 1.0 (animação suave)
```

**Aberto:**
```
┌─────────────────┐
│ Personalizar    │ ← Visível e interativo
│ ...             │
└─────────────────┘
(Com blur backdrop)
```

**Fechando:**
```
Reversão das animações (0.3s)
Modal some suavemente
```

---

## 🎨 Cores e Efeitos

### Tema Dark (Padrão)

```
Fundo Modal:     #0c1429 (dark)
Border:          rgba(255, 255, 255, 0.1)
Header:          rgba(43, 144, 255, 0.1) com gradiente
Ícone Lápis:     #2b90ff (accent) com glow
Input:           #0c1429 com border azul
Hover Input:     rgba(43, 144, 255, 0.05)
Text:            Branco
Accent:          #2b90ff (azul ciano)
```

### Preview Areas

```
Padrão:
┌─────────────────────┐
│ 📷 Clique para fazer │ ← Borda tracejada
│    upload           │    Fundo semitransparente
└─────────────────────┘

Hover:
┌─────────────────────┐
│ 📷 Clique para fazer │ ← Borda mais visível
│    upload           │    Fundo mais claro
└─────────────────────┘

Com Imagem:
┌─────────────────────┐
│  [imagem preview]   │ ← Imagem renderizada
│  (redonda avatar)   │    (circular para avatar)
└─────────────────────┘
```

---

## 🔄 Fluxo de Interação

### Passo 1: Clique no Lápis
```
     [✏️] 
       ↓ click
    Modal abre (animação 0.3s)
    Overlay mostra (blur)
    Dados carregam
```

### Passo 2: Editar Dados
```
    Digite nome/bio
    Contadores atualizam
    
    Seleciona arquivo
       ↓
    Preview mostra imagem
       ↓
    Feedback visual
```

### Passo 3: Salvar
```
    Clica [Salvar]
       ↓
    Validação (local)
       ↓
    Loader aparece
       ↓
    Firestore update
       ↓
    Sucesso! Toast aparece
       ↓
    Modal fecha (animação)
       ↓
    Página atualiza
```

---

## 📐 Dimensões

### Ícone do Lápis
```
Tamanho:     45px × 45px (circular)
Ícone:       18px
Posição:     top: 20px, left: 20px
Z-Index:     25 (acima do banner)
Glow:        20px spread
```

### Modal
```
Desktop:
  Largura:   650px (máximo)
  Altura:    auto (máximo 90vh)
  Position:  fixed, center (translate -50%)
  Z-Index:   100

Mobile:
  Largura:   90% (com margem)
  Altura:    auto (máximo 95vh)
  Position:  fixed, center
  Z-Index:   100
```

### Overlay
```
Tamanho:     100% × 100%
Blur:        4px backdrop-filter
Opacity:     0.7 (escuro)
Position:    fixed, full screen
Z-Index:     90 (atrás do modal)
```

---

## 🎯 Estados Possíveis

### Estado: Normal (Sem Modal)
```
Página visível
Ícone lápis visível
Modal escondido (display: none)
Overlay escondido
Body scroll normal
```

### Estado: Modal Aberta
```
Página desfocada (blur)
Ícone lápis não interativo (atrás do overlay)
Modal visível e interativa
Overlay visível com blur
Body scroll: hidden
```

### Estado: Carregando
```
Overlay mostra loader
Botão "Salvar" desabilitado
Inputs desabilitados
Mensagem "AGUARDE..."
```

### Estado: Sucesso
```
Modal fecha (animação)
Toast "Perfil atualizado!" aparece
Página recarrega
Dados atualizados visíveis
```

### Estado: Erro
```
Modal continua aberta
Toast de erro aparece (mensagem clara)
Campo em destaque
Usuário pode corrigir

Exemplos de erro:
- "Arquivo muito grande" (>5MB)
- "Formato não suportado" (XLSX, PDF, etc)
- "Nome obrigatório" (vazio)
- "Nome muito longo" (>50 caracteres)
```

---

## 📊 Tabela de Transições

```
┌──────────────────────────────────────────────────────┐
│ Estado         Evento              Novo Estado    Tempo
├──────────────────────────────────────────────────────┤
│ Normal         Click lápis         Modal aberta   0.3s
│ Modal aberta   Click overlay       Modal fecha    0.3s
│ Modal aberta   Click Cancelar      Modal fecha    0.3s
│ Modal aberta   ESC                 Modal fecha    0.3s
│ Modal aberta   Click Salvar        Salvando       -
│ Salvando       Success             Modal fecha    0.3s
│ Salvando       Error               Modal aberta   -
│ Modal aberta   Upload arquivo      Preview       Instant
│ Preview        Novo upload         Preview novo  Instant
│ Padrão         Mouse hover lápis   Scale+glow    0.3s
└──────────────────────────────────────────────────────┘
```

---

## 🎨 Padrão de Design

```
Filosofia: Modern Dark UI com Accent Azul

Elementos:
├── Header
│   ├── Título com ícone
│   └── Botão fechar
├── Seções (4 grupos)
│   ├── Ícone + Título
│   ├── Input/Textarea
│   └── Helper text
├── Preview Areas
│   ├── Borda tracejada
│   ├── Ícone centralizado
│   └── Texto descritivo
└── Actions (footer)
    ├── Botão Cancelar (outline)
    └── Botão Salvar (filled)

Paleta:
├── Primária: #2b90ff (Accent)
├── Escura:   #0c1429 (BG)
├── Cinzenta: rgba(255, 255, 255, 0.1)
└── Texto:    #ffffff (ou transparent cinza)

Tipografia:
├── Título: 1.5rem, bold
├── Seção:  1rem, bold
├── Texto:  0.95rem, normal
└── Helper: 0.8rem, muted
```

---

## 🚀 Perfeito! Sistema Completo

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ✅ Ícone de lápis (esquerda, com animações)      │
│   ✅ Modal elegante (centralizado, responsivo)     │
│   ✅ Campos (nome, bio, avatar, banner)            │
│   ✅ Contadores (dinâmicos, tempo real)            │
│   ✅ Preview (imagens, GIFs, animado)              │
│   ✅ Validações (tamanho, tipo, caracteres)        │
│   ✅ Acessibilidade (ESC, labels, feedback)        │
│   ✅ Segurança (apenas dono edita)                 │
│   ✅ Sincronização (todos veem mudanças)           │
│   ✅ Mobile-first (responsivo e otimizado)         │
│                                                     │
│      STATUS: ✅ PRONTO PARA PRODUÇÃO                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

**Documentação Visual Completa**  
**Sistema implementado com excelência** 🎉
