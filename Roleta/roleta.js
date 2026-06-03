/**
 * Lógica do Sistema de Roleta e Caixas Misteriosas
 */

let selectedGameToBet = null;
let isActionInProgress = false; // Bloqueio global para evitar cliques múltiplos e bugs de saldo

// Mapeamento de IDs para Tipos
const CARD_TYPES = {
    STAY: 0, // NADA (Cinza)
    LOSE: 1, // PERDEU (Vermelho)
    WIN: 2   // UPGRADE (Dourado)
};

// Busca o elemento de áudio definido no HTML
const playSpinSound = () => {
    const audio = document.getElementById('spin-sound-effect');
    if (audio) {
        audio.pause(); 
        audio.currentTime = 0; 
        audio.volume = 0.4; 
        audio.play().catch(error => console.error("Erro ao tocar áudio. Verifique se o caminho 'assets/csgo-case-open.mp3' está correto no HTML.", error));
    }
};

// Helper para definir raridade baseada no preço
function getRarityInfo(priceStr) {
    const price = window.utils.parsePrice(priceStr);
    if (price <= 70) return { class: 'rarity-gray', label: 'Comum' };
    if (price <= 150) return { class: 'rarity-purple', label: 'Raro' };
    if (price <= 280) return { class: 'rarity-gold', label: 'Épico' };
    return { class: 'rarity-mythic', label: 'Mítico' };
}

function renderRoulette() {
    // Primeiro, renderizamos as caixas (Bronze, Prata, Ouro, Diamante)
    renderBoxes();

    console.log("Sistema de Recompensas inicializado...");
    
    const inventoryGrid = document.getElementById('bet-inventory-grid');
    if (!inventoryGrid || !window.allGamesData || window.allGamesData.length === 0) return;

    // Filtrar jogos da biblioteca que NÃO são gratuitos (Preço > 0)
    const bettableGames = window.allGamesData.filter(game => {
        const isOwned = window.userLibrary.some(libId => String(libId) === String(game.id));
        const isNotFree = window.utils.parsePrice(game.currentPrice) > 0;
        return isOwned && isNotFree;
    });

    if (bettableGames.length === 0) {
        inventoryGrid.innerHTML = '<p style="grid-column: 1/-1; padding: 20px;">Você não possui jogos pagos para apostar.</p>';
        return;
    }

    inventoryGrid.innerHTML = bettableGames.map(game => `
        <div class="bet-item" data-id="${game.id}" onclick="selectGameForBet(${game.id})">
            <img src="${game.coverUrl || game.image}" alt="${game.title}">
            <div class="bet-item-info">
                <span class="bet-item-name" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                    <span>${game.title}</span>
                    ${window.getUpgradeHtml(game.id)}
                </span>
                <span class="bet-item-price">${(() => {
                    const level = window.userUpgrades[game.id] || 0;
                    const multipliers = { 0: 1, 1: 1.5, 2: 2.5, 3: 4.0 };
                    const val = window.utils.parsePrice(game.currentPrice) * multipliers[level];
                    return val > 0 ? `Valor: R$ ${val.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : game.currentPrice;
                })()}</span>
            </div>
        </div>
    `).join('');
}

window.selectGameForBet = (gameId) => {
    const game = window.allGamesData.find(g => String(g.id) === String(gameId));
    if (!game) return;
    const currentLevel = window.userUpgrades[game.id] || 0;

    selectedGameToBet = game;

    // Atualiza Visual
    document.querySelectorAll('.bet-item').forEach(el => {
        el.classList.toggle('selected', el.getAttribute('data-id') == gameId);
    });

    const display = document.getElementById('selected-game-display');
    const spinBtn = document.getElementById('btn-spin');

    if (display) {
        const upgradeHtml = window.getUpgradeHtml(game.id);
        const targetText = currentLevel >= 3 
            ? `<span style="color:var(--promo)">Rank Máximo Atingido</span>` 
            : `Rank Atual: ${currentLevel} | Alvo: ${currentLevel + 1}`;
        
        display.classList.add('active');
        display.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <img src="${game.coverUrl || game.image}" style="width:50px; border-radius:4px;">
                <div style="text-align:left; display: flex; flex-direction: column; justify-content: center;">
                    <strong style="display:flex; align-items: center; gap: 8px;">${game.title} ${upgradeHtml}</strong>
                    <span style="font-size:12px; color:var(--accent)">${targetText}</span>
                </div>
            </div>
        `;
    }

    if (spinBtn) {
        spinBtn.disabled = currentLevel >= 3;
        spinBtn.textContent = currentLevel >= 3 ? "Rank Máximo Atingido" : "Girar e Melhorar Jogo";
        spinBtn.onclick = () => startUpgradeSpin();
    }
};

/**
 * Cria e injeta as 4 categorias de caixas na interface (Bronze, Prata, Ouro e Diamante).
 * Isso garante que a UI reflita exatamente os valores e regras de raridade.
 */
function renderBoxes() {
    const grid = document.querySelector('.boxes-grid');
    if (!grid) return;

    const boxTypes = [
        { id: 'bronze', name: 'Bronze', cost: 30, color: '#cd7f32', range: 'Até R$ 70' },
        { id: 'silver', name: 'Prata', cost: 80, color: '#bdc3c7', range: 'R$ 70 - R$ 150' },
        { id: 'gold', name: 'Ouro', cost: 180, color: '#f1c40f', range: 'R$ 150 - R$ 280' },
        { id: 'diamond', name: 'Diamante', cost: 450, color: '#00e5ff', range: 'Acima de R$ 280' }
    ];

    grid.innerHTML = boxTypes.map(box => `
        <div class="box-card tier-${box.id}">
            <div class="box-tag" style="background: ${box.color}; color: #000; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 20px; position: absolute; top: 10px; right: 10px; text-transform: uppercase;">
                ${box.id}
            </div>
            <h3 style="color: ${box.color}; margin-top: 10px;">Caixa ${box.name}</h3>
            <p style="font-size: 11px; color: var(--text-secondary); margin: 10px 0 15px;">
                Contém: ${box.range}
            </p>
            <div style="font-size: 40px; margin-bottom: 20px; filter: drop-shadow(0 0 10px ${box.color}44)">
                ${box.id === 'diamond' ? '💎' : '📦'}
            </div>
            <button class="buy-button" onclick="openBox('${box.id}')">
                Abrir R$ ${box.cost.toFixed(2)}
            </button>
        </div>
    `).join('');
}

function generateRouletteRail(winnerType, winningGame, targetRailId = 'roulette-rail') {
    const rail = document.getElementById(targetRailId);
    if (!rail) return;

    rail.style.transition = 'none';
    rail.style.transform = 'translateX(0px)';
    rail.innerHTML = '';

    const totalItems = 80;

    // Converte tipo string para ID numérico se necessário
    const winnerId = winnerType === 'win' ? CARD_TYPES.WIN : (winnerType === 'stay' ? CARD_TYPES.STAY : CARD_TYPES.LOSE);

    for (let i = 0; i < totalItems; i++) {
        const card = document.createElement('div');
        const isWinner = (i === 65);
        
        // Escolhe um ID aleatório para os outros cards
        const cardId = isWinner ? winnerId : Math.floor(Math.random() * 3);
        
        card.className = 'roulette-card';
        card.dataset.cardId = cardId; // Define o ID para o CSS colorir

        let labelText = "";
        if (cardId === CARD_TYPES.WIN) {
            card.classList.add('win-card'); 
            labelText = "UPGRADE!";
        } else if (cardId === CARD_TYPES.STAY) {
            card.classList.add('stay-card'); 
            labelText = "NADA";
        } else {
            card.classList.add('lose-card'); 
            labelText = "PERDEU!";
        }

        // Injeta o ponto de interrogação e o label fixo
        card.innerHTML = `<span class="q-mark">?</span><span class="card-label">${labelText}</span>`;

        rail.appendChild(card);
    }

    rail.offsetHeight; 
    const wrapper = rail.parentElement;
    const winnerCard = rail.children[65];

    // Alinha o centro real do elemento vencedor com o centro do container
    const randomInnerOffset = Math.floor(Math.random() * (winnerCard.offsetWidth * 0.6)) - (winnerCard.offsetWidth * 0.3);
    const targetPos = (winnerCard.offsetLeft + winnerCard.offsetWidth / 2) - (wrapper.offsetWidth / 2) + randomInnerOffset;

    // Adiciona atraso de 1.2s antes de iniciar a transição de 5.7s
    setTimeout(() => {
        rail.style.transition = 'transform 5.7s cubic-bezier(0.15, 0, 0.05, 1)';
        rail.style.transform = `translateX(-${targetPos}px)`;
    }, 1200);
}

let revealTimer;
window.showRevealModal = (cardElement, titleText) => {
    const target = document.getElementById('reveal-card-target');
    const title = document.getElementById('reveal-result-title');
    const modal = document.getElementById('result-reveal-modal');
    
    if (!target || !modal) return;
    
    target.innerHTML = '';
    const clone = cardElement.cloneNode(true);
    clone.style.margin = '0'; // Remove margens do rail
    target.appendChild(clone);
    
    title.textContent = titleText;
    modal.style.display = 'flex';

    // Fecha automaticamente após 5 segundos
    clearTimeout(revealTimer);
    revealTimer = setTimeout(closeRevealModal, 5000);
};

window.closeRevealModal = () => {
    document.getElementById('result-reveal-modal').style.display = 'none';
    clearTimeout(revealTimer);
};

window.closeBoxModal = () => {
    document.getElementById('box-opening-modal').style.display = 'none';
    document.getElementById('modal-result-info').innerHTML = '';
};

window.openBox = async (tier) => {
    if (isActionInProgress) return;

    // SOM IMEDIATO NO CLIQUE
    playSpinSound();

    if (!window.auth.currentUser) return window.showToast("Faça login para abrir caixas!", "info");
    
    const boxCosts = { 
        'bronze': 30, 
        'silver': 80, 
        'gold': 180, 
        'diamond': 450 
    };
    const cost = boxCosts[tier];

    if (window.userBalance < cost) return window.showToast("Saldo insuficiente!", "error");

    isActionInProgress = true;

    try {
        // 1. Debitar saldo IMEDIATAMENTE no banco de dados para evitar gastos duplicados ou negativos
        // Usamos increment(-cost) para garantir atomicidade no Firebase
        const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
        await userRef.update({
            balance: firebase.firestore.FieldValue.increment(-cost)
        });

        // Atualiza localmente para a UI refletir a cobrança imediatamente
        window.userBalance -= cost;
        const walletDisplay = document.getElementById('wallet-amount');
        if (walletDisplay) {
            walletDisplay.textContent = `R$ ${window.userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }
    } catch (error) {
        console.error("Erro ao processar débito da caixa:", error);
        isActionInProgress = false;
        return window.showToast("Erro ao processar pagamento. Tente novamente.", "error");
    }

    // Mostrar Modal
    const modal = document.getElementById('box-opening-modal');
    modal.style.display = 'flex';
    document.getElementById('modal-box-title').textContent = `Abrindo Caixa ${tier.toUpperCase()}...`;

    // 1. Selecionar ganhador
    let pool = [];
    const allGames = window.allGamesData.filter(g => window.utils.parsePrice(g.currentPrice) > 0);

    if (tier === 'bronze') {
        pool = allGames.filter(g => window.utils.parsePrice(g.currentPrice) <= 70);
    } else if (tier === 'silver') {
        pool = allGames.filter(g => {
            const p = window.utils.parsePrice(g.currentPrice);
            return p > 70 && p <= 150;
        });
    } else if (tier === 'gold') {
        pool = allGames.filter(g => {
            const p = window.utils.parsePrice(g.currentPrice);
            return p > 150 && p <= 280;
        });
    } else if (tier === 'diamond') {
        pool = allGames.filter(g => window.utils.parsePrice(g.currentPrice) > 280);
    }
    
    // Fallback caso a pool esteja vazia por falta de jogos cadastrados naquela faixa
    const finalPool = pool.length > 0 ? pool : allGames;
    const winningGame = finalPool[Math.floor(Math.random() * finalPool.length)];
    const rarity = getRarityInfo(winningGame.currentPrice);

    // 2. Preparar Trilho de Mistério
    const rail = document.getElementById('modal-roulette-rail');
    rail.style.transition = 'none';
    rail.style.transform = 'translateX(0px)';
    rail.innerHTML = '';

    for (let i = 0; i < 80; i++) {
        const card = document.createElement('div');
        card.className = 'roulette-card';
        
        let displayRarity;
        if (i === 65) {
            displayRarity = rarity;
        } else {
            const randomGame = finalPool[Math.floor(Math.random() * finalPool.length)];
            displayRarity = getRarityInfo(randomGame.currentPrice);
        }
        
        card.classList.add(displayRarity.class);
        card.innerHTML = `<span class="q-mark">?</span><span class="card-label">${displayRarity.label}</span>`;
        rail.appendChild(card);
    }

    rail.offsetHeight;
    const wrapper = rail.parentElement;
    const winnerCard = rail.children[65];

    const randomInnerOffset = Math.floor(Math.random() * (winnerCard.offsetWidth * 0.6)) - (winnerCard.offsetWidth * 0.3);
    const targetPos = (winnerCard.offsetLeft + winnerCard.offsetWidth / 2) - (wrapper.offsetWidth / 2) + randomInnerOffset;
    
    // Adiciona atraso de 1.2s antes de iniciar a transição de 5.7s
    setTimeout(() => {
        rail.style.transition = 'transform 5.7s cubic-bezier(0.15, 0, 0.05, 1)';
        rail.style.transform = `translateX(-${targetPos}px)`;
    }, 1200);

    // 3. Revelação e Salvamento
    // Ajustado para 7.1s (1.2s de atraso + 5.7s de animação + 0.2s de margem)
    setTimeout(async () => {
        const winnerCard = rail.children[65];
        
        // Limpa classes de raridade genéricas antes de aplicar a final
        winnerCard.className = 'roulette-card';
        winnerCard.classList.add(rarity.class);
        winnerCard.innerHTML = `
            <img src="${winningGame.coverUrl || winningGame.image}" style="width:100%; height:100%; object-fit:cover; opacity: 1;">
            <span class="card-label" style="background:rgba(0,0,0,0.8);">${winningGame.title}</span>
        `;

        // Fecha modal da caixa e mostra o grande reveal
        window.closeBoxModal();
        window.showRevealModal(winnerCard, "VOCÊ GANHOU!");

        try {
            const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
            
            // Se o usuário já tiver o jogo, ele ganha o valor do jogo de volta como consolação
            if (window.userLibrary.includes(winningGame.id)) {
                const currentLevel = window.userUpgrades[winningGame.id] || 0;
                const multipliers = { 0: 1, 1: 1.5, 2: 2.5, 3: 4.0 };
                const refund = (window.utils.parsePrice(winningGame.currentPrice) * multipliers[currentLevel]) * 0.5;
                await userRef.update({ balance: firebase.firestore.FieldValue.increment(refund) });
                window.showToast(`Você já tinha o jogo! Recebeu R$ ${refund.toFixed(2)} de compensação.`, "info");
            } else {
                await userRef.update({
                    library: firebase.firestore.FieldValue.arrayUnion(winningGame.id)
                });
                window.showToast(`PARABÉNS! Você ganhou ${winningGame.title}!`, "success");
            }

            await window.loadUserData(window.auth.currentUser.uid);
            renderRoulette();
        } catch (e) {
            console.error(e);
        } finally {
            isActionInProgress = false;
        }
    }, 7100);
};

async function startUpgradeSpin() {
    // SOM IMEDIATO NO CLIQUE
    playSpinSound();

    if (!selectedGameToBet || !window.auth.currentUser) return;
    
    const gameId = selectedGameToBet.id;
    const currentLevel = window.userUpgrades[gameId] || 0;
    const gamePrice = window.utils.parsePrice(selectedGameToBet.currentPrice);
    const spinBtn = document.getElementById('btn-spin');
    
    spinBtn.disabled = true;
    isActionInProgress = true;
    spinBtn.textContent = "Girando...";

    // 1. Probabilidades baseadas no nível atual
    let winProb, stayProb; // O resto é a probabilidade de perder
    
    if (currentLevel === 0) { // Para Raro (+)
        winProb = 60; stayProb = 30; // 10% de perda
    } else if (currentLevel === 1) { // Para Épico (++)
        winProb = 35; stayProb = 35; // 30% de perda
    } else { // Para Lendário (+++)
        winProb = 15; stayProb = 25; // 60% de perda
    }

    // 2. Ajuste de Dificuldade por Preço: -5% de chance a cada R$ 50,00
    const pricePenalty = Math.floor(gamePrice / 50) * 5;
    winProb = Math.max(5, winProb - pricePenalty); // Chance mínima de 5%

    const result = Math.random() * 100;
    let winnerType = 'lose';
    if (result < winProb) winnerType = 'win';
    else if (result < winProb + stayProb) winnerType = 'stay';

    // 3. Inicia a animação visual da roleta
    generateRouletteRail(winnerType, selectedGameToBet);

    // 4. Aguarda a animação terminar para atualizar o banco de dados
    // Ajustado para 7.1s (1.2s de atraso + 5.7s de animação + 0.2s de margem)
    setTimeout(async () => {
        const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
        const rail = document.getElementById('roulette-rail');
        const winnerCard = rail ? rail.children[65] : null;

        try {
            if (winnerType === 'win') {
                // SUCESSO: Aumenta o nível
                const newLevel = currentLevel + 1;
                await userRef.set({ upgrades: { [gameId]: newLevel } }, { merge: true });
                
                if (winnerCard) window.showRevealModal(winnerCard, "UPGRADE BEM-SUCEDIDO!");
                window.showToast(`BOA! Seu jogo agora é Rank ${newLevel}!`, "success");
            } 
            else if (winnerType === 'stay') {
                // NEUTRO: Não ganha nada, mas mantém o jogo
                if (winnerCard) window.showRevealModal(winnerCard, "NADA MUDOU...");
                window.showToast("A roleta parou no meio... Você manteve seu jogo.", "info");
            } 
            else {
                // Lógica de Remoção Corrigida
                const idParaRemover = Number(gameId);
                
                // Atualiza o banco (tenta remover tanto como número quanto string por segurança)
                await userRef.update({
                    library: firebase.firestore.FieldValue.arrayRemove(idParaRemover),
                    [`upgrades.${gameId}`]: firebase.firestore.FieldValue.delete()
                });
                await userRef.update({
                    library: firebase.firestore.FieldValue.arrayRemove(String(gameId))
                });

                // Remove localmente para refletir na UI imediatamente
                window.userLibrary = window.userLibrary.filter(id => Number(id) !== idParaRemover);
                
                if (winnerCard) window.showRevealModal(winnerCard, "JOGO PERDIDO!");
                window.showToast("QUE AZAR! Você perdeu o jogo na aposta.", "error");
            }
            
            // Recarrega os dados e a interface
            await window.loadUserData(window.auth.currentUser.uid);
            selectedGameToBet = null;
            document.getElementById('selected-game-display').innerHTML = "<p>Nenhum jogo selecionado</p>";
            renderRoulette();
            
        } catch (error) {
            console.error("Erro na aposta:", error);
            window.showToast("Erro ao processar aposta.", "error");
        } finally {
            spinBtn.textContent = "Girar e Melhorar Jogo";
            isActionInProgress = false;
        }
    }, 7100); // Tempo da animação + pequeno delay
}

// Escutar mudanças no Firebase para atualizar o inventário se o usuário ganhar/perder algo
if (window.auth) {
    window.auth.onAuthStateChanged(() => {
        setTimeout(() => {
            renderRoulette();
        }, 1000); // Pequeno delay para garantir que global.js carregou os dados
    });
}