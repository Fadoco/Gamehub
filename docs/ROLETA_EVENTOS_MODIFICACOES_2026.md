# 🎲 Modificações da Roleta de Eventos - Junho 2026

## Resumo das Alterações

Foi implementado um novo sistema de roleta de eventos com 3 etapas sequenciais e display de ranking dos top 5 usuários.

---

## ✨ Mudanças Implementadas

### 1️⃣ **Status dos Usuários (Topo da Página)**
- **Posição**: Primeira coisa que aparece na página
- **Conteúdo**: Top 5 usuários do ranking
- **Exibição**: Cards com avatar, nome e posição (#1, #2, etc)
- **Ordenação**: Baseada em quantidade de jogos na biblioteca
- **ID do elemento**: `#top-users-grid`

### 2️⃣ **Botão "Iniciar Apresentação"**
- **Posição**: Logo abaixo dos status dos usuários
- **Texto**: "Iniciar Apresentação"
- **Subtítulo**: "atualizando valores para 5 mil"
- **Funcionalidade**: 
  - Reseta a carteira de TODOS os usuários (não-admin) para R$ 5.000
  - Pede confirmação antes de executar
  - Mostra progresso e resultado
- **Função**: `initializePresentation()`

### 3️⃣ **Sistema de 3 Roletas Sequenciais**

#### **Roleta 1: Selecione o Evento** 🎲
- **Eventos disponíveis**:
  - 💰 Ganhar Dinheiro
  - 📉 Perder Dinheiro
  - 🎁 Ganhar Jogo
  - 🗑️ Perder Jogo
  - ⭐ Jogo Aleatório Melhorado

#### **Roleta 2: Quantas Pessoas?** 👥
- **Opções**:
  - TODOS os Usuários
  - Número Específico (com input)
- **Dinâmica**: Aparece somente após selecionar evento
- **Exibição**: Mostra quantidade de usuários afetados

#### **Roleta 3: Quanto?** 💰
- **Dinâmica**: Conteúdo muda baseado no tipo de evento
- **Opções por evento**:
  - **Money Win/Lose**: R$ 100, R$ 250, R$ 500, R$ 1.000, R$ 2.000, R$ 5.000
  - **Game Win/Lose**: 1 Jogo, 2 Jogos, 3 Jogos, 5 Jogos, 10 Jogos
  - **Upgrade Random**: 1 Upgrade, 2 Upgrades, 3 Upgrades
- **Input manual**: Possibilidade de inserir valor custom

---

## 🔧 Mudanças Técnicas

### HTML (`admin-event-roulette.html`)
```html
<!-- Nova seção de status no topo -->
<div class="status-section">
  <h2>👥 Top 5 Usuários do Ranking</h2>
  <div id="top-users-grid"><!-- Preenchido dinamicamente --></div>
  
  <!-- Botão iniciar apresentação -->
  <div class="init-presentation-btn">
    <button onclick="initializePresentation()">...</button>
    <div class="subtitle">atualizando valores para 5 mil</div>
  </div>
</div>

<!-- 3 roletas em grid -->
<div class="roulette-wrapper">
  <div id="roulette-section"><!-- Roleta 1 --></div>
  <div id="roulette-people" class="hidden"><!-- Roleta 2 --></div>
  <div id="roulette-amount" class="hidden"><!-- Roleta 3 --></div>
</div>
```

### Estilos CSS Adicionados
- `.status-section` - Container do ranking
- `.top-users-grid` - Grid 5 colunas (responsive)
- `.user-card` - Card individual de usuário
- `.user-avatar` - Avatar redondo com imagem
- `.init-presentation-btn` - Botão de inicialização
- `.roulette-wrapper` - Grid 3 colunas para roletas
- `.roulette-step-title` - Título de cada passo
- `.hidden` - Classe para ocultar roletas

### JavaScript (`admin-event-roulette.js`)
**Novas funções principais**:
- `loadTopUsers()` - Carrega top 5 usuários
- `initializePresentation()` - Reseta carteiras para R$ 5.000
- `selectEvent(eventKey)` - Seleciona evento e mostra roleta 2
- `selectPeople(peopleMode)` - Seleciona quantidade de pessoas e mostra roleta 3
- `updatePeopleCount()` - Atualiza contagem de pessoas (input)
- `updateAmountWheel()` - Gera cards da roleta 3 conforme evento
- `selectAmount(amount, displayName)` - Seleciona quantidade

**Variáveis controladas**:
- `selectedEvent` - Evento selecionado
- `selectedPeople` - Modo de aplicação (all/specific)
- `selectedAmount` - Quantidade selecionada
- `peopleCount` - Número de pessoas a afetar

---

## 🎯 Fluxo de Uso

1. **Admin acessa a página** → Ver top 5 usuários em cards no topo
2. **Clica "Iniciar Apresentação"** → Todos usuários recebem R$ 5.000
3. **Seleciona um evento** → Aparece Roleta 2 (Quantas Pessoas?)
4. **Seleciona "TODOS" ou "Específico"** → Aparece Roleta 3 (Quanto?)
5. **Seleciona quantidade** → Pronto para aplicar
6. **Clica "Aplicar Evento"** → Evento é processado

---

## 📊 Estrutura de Dados

### Top Users
```javascript
{
  uid: "user_id",
  displayName: "Nome Usuário",
  avatar: "url_avatar",
  gamesBought: 5,  // Total de jogos na biblioteca
  isAdmin: false
}
```

### Evento Aplicado
```javascript
{
  event: "money_win",        // Tipo de evento
  affectedUsers: 10,         // Quantidade de usuários
  amount: 500,               // Quantidade (R$ ou jogos)
  timestamp: "14:30:45"      // Hora da execução
}
```

---

## 🚀 Melhorias Futuras Possíveis

- [ ] Adicionar animação de "girar" nas roletas
- [ ] Salvar histórico de eventos aplicados
- [ ] Modo de prévia (mostrar quem será afetado)
- [ ] Sistema de probabilidades/pesos nas roletas
- [ ] Exportar relatório de eventos
- [ ] Agendamento de eventos

---

## 📝 Notas

- Admins definidos: `fadoco12311@gmail.com`, `gabrielmomo6759@gmail.com`
- Apenas usuários não-admin são afetados pelos eventos
- Carteira inicial: R$ 5.000
- Máximo de upgrades por jogo: 3 níveis

