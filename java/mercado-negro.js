/**
 * Lógica do Mercado Negro
 */

async function processSecretPurchase(cost, itemName, actionFn) {
    if (!window.auth.currentUser) return window.showToast("Conexão perdida. Relogue.", "error");
    if (window.userBalance < cost) return window.showToast("SALDO INSUFICIENTE NO SISTEMA.", "error");

    window.customConfirm(`Confirmar bypass de segurança para ${itemName}?`, async () => {
        try {
            const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
            
            // Deduz o saldo
            await userRef.update({
                balance: firebase.firestore.FieldValue.increment(-cost)
            });

            // Executa a ação específica do item
            await actionFn(userRef);

            window.showToast(`${itemName} ADQUIRIDO COM SUCESSO.`, "success");
            
            // Atualiza dados locais
            await window.loadUserData(window.auth.currentUser.uid);
        } catch (error) {
            console.error("Erro no Mercado Negro:", error);
            window.showToast("ERRO NA OPERAÇÃO. LOGS LIMPOS.", "error");
        }
    });
}

// --- NOVAS FUNCIONALIDADES DO MERCADO NEGRO ---

// 1. Renderizar Jogos Baratos (30% de desconto adicional)
function renderCheaperGames() {
    const container = document.getElementById('cheaper-games-list');
    if (!container || !window.allGamesData) return;

    // Pega 4 jogos aleatórios que o usuário não tem
    const available = window.allGamesData
        .filter(g => !window.userLibrary.includes(g.id) && window.utils.parsePrice(g.currentPrice) > 0)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);

    container.innerHTML = available.map(game => {
        const originalPrice = window.utils.parsePrice(game.currentPrice);
        const secretPrice = originalPrice * 0.7; // 30% de desconto
        return `
            <div class="secret-item">
                <div>
                    <strong>${game.title}</strong>
                    <p style="font-size: 10px; color: #f1c40f;">PREÇO DE MERCADO: R$ ${originalPrice.toFixed(2)}</p>
                </div>
                <span>R$ ${secretPrice.toFixed(2)}</span>
                <button class="btn-hack" onclick="buySecretGame(${game.id}, ${secretPrice})">HACK</button>
            </div>
        `;
    }).join('');
}

// Variável global para o jogo selecionado para as caixas especiais
let selectedGameForSpecialBox = null;

// Renderiza o inventário de jogos para seleção na caixa especial
function renderSpecialBoxInventory() {
    const inventoryGrid = document.getElementById('special-box-inventory-grid');
    if (!inventoryGrid || !window.allGamesData || window.allGamesData.length === 0) return;

    const library = window.userLibrary || [];
    const upgrades = window.userUpgrades || {};

    // Filtrar jogos da biblioteca que NÃO são gratuitos e NÃO são Rank 4 (Dark Matter)
    const eligibleGames = window.allGamesData.filter(game => {
        const isOwned = library.some(libId => String(libId) === String(game.id));
        const isNotFree = window.utils.parsePrice(game.currentPrice) >= 0; // Mercado Negro aceita tudo
        const currentLevel = upgrades[game.id] || 0;
        return isOwned && isNotFree;
    });

    if (eligibleGames.length === 0) {
        inventoryGrid.innerHTML = '<p style="grid-column: 1/-1; padding: 20px; font-size: 12px; color: #666;">Nenhum software alvo detectado no seu terminal.</p>';
        document.getElementById('btn-spin-special').disabled = true; // Desabilita roleta se não houver jogos
        return;
    }

    inventoryGrid.innerHTML = eligibleGames.map(game => {
        const level = window.userUpgrades[game.id] || 0;
        let auraClass = '';
        if (level === 1) auraClass = 'upgrade-aura-1';
        else if (level === 2) auraClass = 'upgrade-aura-2';
        else if (level === 3) auraClass = 'upgrade-aura-3';
        return `
        <div class="bet-item ${auraClass}" data-id="${game.id}" onclick="selectGameForSpecialBox('${game.id}')">
            <img src="${game.coverUrl || game.image}" alt="${game.title}">
            <div class="bet-item-info">
                <span class="bet-item-name" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                    <span>${game.title}</span>
                    ${window.getUpgradeHtml(game.id)}
                </span>
                <span class="bet-item-price">${(() => {
                    const level = (window.userUpgrades && window.userUpgrades[game.id]) || 0;
                    const multipliers = { 0: 1, 1: 1.5, 2: 2.5, 3: 4.0, 4: 9.0 };
                    const val = window.utils.parsePrice(game.currentPrice) * multipliers[level];
                    return val > 0 ? `Valor: R$ ${val.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : game.currentPrice;
                })()}</span>
            </div>
        </div>
    `;
    }).join('');
}

window.selectGameForSpecialBox = (gameId) => {
    const game = window.allGamesData.find(g => String(g.id) === String(gameId));
    if (!game) return;

    selectedGameForSpecialBox = game;

    // Atualiza Visual
    document.querySelectorAll('#special-box-inventory-grid .bet-item').forEach(el => {
        el.classList.toggle('selected', el.getAttribute('data-id') == gameId);
    });

    // Atualiza o texto do botão da roleta baseado no rank
    const spinBtn = document.getElementById('btn-spin-special');
    if (spinBtn) spinBtn.innerText = (window.userUpgrades[gameId] || 0) === 3 ? "TENTAR DARK MATTER (R$ 1.000)" : "TENTAR UPGRADE (R$ 1.000)";
    
    window.showToast(`Jogo ${game.title} selecionado para corrupção.`, "info");

    // Habilita os botões das caixas especiais
    document.getElementById('btn-open-glitch-box').disabled = false;
    document.getElementById('btn-open-glitch-box').onclick = () => window.openSpecialBox('glitch');
    document.getElementById('btn-open-void-box').disabled = false;
    document.getElementById('btn-open-void-box').onclick = () => window.openSpecialBox('void');
};

// Função para abrir as caixas especiais
window.openSpecialBox = async (tier) => {
    if (window.isActionInProgress) return;
    if (!selectedGameForSpecialBox) return window.showToast("Selecione um jogo para melhorar primeiro!", "error");

    // SOM IMEDIATO (Mesmo da roleta original)
    if (typeof window.playSpinSound === 'function') window.playSpinSound();

    const boxCosts = {
        'glitch': 800,
        'void': 3000
    };
    const cost = boxCosts[tier];

    if (window.userBalance < cost) return window.showToast("SALDO INSUFICIENTE NO SISTEMA.", "error");    

    window.customConfirm(`Confirmar abertura da ${tier.toUpperCase()} Box por R$ ${cost.toFixed(2)} para ${selectedGameForSpecialBox.title}?`, async () => {
        try {
            window.isActionInProgress = true;
            const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
            await userRef.update({
                balance: firebase.firestore.FieldValue.increment(-cost)
            });

            // Mostrar modal de abertura (reutilizando estrutura da roleta)
            const modal = document.getElementById('box-opening-modal');
            if (modal) {
                modal.style.display = 'flex';
                document.getElementById('modal-box-title').textContent = `CORROMPENDO ARQUIVOS...`;
            }

            const gameId = selectedGameForSpecialBox.id;
            const currentLevel = window.userUpgrades[gameId] || 0;
            let newLevel = currentLevel + 1;
            let success = true;

            // Lógica de upgrade para as caixas especiais
            if (tier === 'glitch') {
                if (currentLevel === 3 && Math.random() < 0.5) {
                    newLevel = 4; // Dark Matter
                } else if (currentLevel === 3) {
                    newLevel = 3;
                    success = false;
                }
            } else if (tier === 'void') {
                if (currentLevel === 3 && Math.random() < 0.8) {
                    newLevel = 4;
                } else if (currentLevel === 3) {
                    newLevel = 3;
                    success = false;
                } else if (currentLevel === 2 && Math.random() < 0.3) {
                    newLevel = 4;
                }
            }

            // Simular atraso de "hacking"
            setTimeout(async () => {
                await userRef.update({ [`upgrades.${gameId}`]: newLevel });
                if (modal) modal.style.display = 'none';
                
                if (success) window.showToast(`BYPASS COMPLETO! ${selectedGameForSpecialBox.title} agora é Rank ${newLevel === 4 ? '!!!!' : newLevel}!`, "success");
                else window.showToast("FALHA NA INTEGRIDADE: O rank não mudou.", "info");
                
                await window.loadUserData(window.auth.currentUser.uid);
                renderSpecialBoxInventory();
                window.isActionInProgress = false;
            }, 3000);

        } catch (error) {
            console.error("Erro ao abrir caixa especial:", error);
            window.showToast("ERRO NA OPERAÇÃO. Tente novamente.", "error");
            window.isActionInProgress = false;
        }
    });
};

window.buySecretGame = async (gameId, price) => {
    processSecretPurchase(price, "JOGO DESVIADO", async (userRef) => {
        await userRef.update({
            library: firebase.firestore.FieldValue.arrayUnion(gameId)
        });
    });
};

// 3. Roleta Especial (Estrutura)
function initSpecialRoulette() {
    const rail = document.getElementById('special-rail');
    if (!rail) return;
    
    rail.innerHTML = '';
    for(let i=0; i<50; i++) {
        const card = document.createElement('div');
        card.className = 'special-card';
        card.innerHTML = '?';
        rail.appendChild(card);
    }
}

window.spinSpecialRoulette = async () => {
    const cost = 1000;
    if (window.isActionInProgress) return; // Proteção contra spam
    if (!selectedGameForSpecialBox) return window.showToast("ALVO NÃO SELECIONADO.", "error");
    
    const gameId = selectedGameForSpecialBox.id;
    const currentLevel = window.userUpgrades[gameId] || 0;

    if (currentLevel >= 4) return window.showToast("ESTE SOFTWARE JÁ ATINGIU A SINGULARIDADE (RANK MÁXIMO).", "info");
    if (window.userBalance < cost) return window.showToast("SALDO INSUFICIENTE.", "error");
    
    window.isActionInProgress = true;

    const rail = document.getElementById('special-rail');
    rail.style.transition = 'none';
    rail.style.transform = 'translateX(0px)';

    // Lógica Dupla: Se rank 3, tenta Dark Matter. Se não, tenta Upgrade normal.
    const roll = Math.random() * 100;
    let resultType = 'lose';
    const winChance = currentLevel === 3 ? 20 : 40; // Menor chance para Dark Matter
    if (roll < winChance) resultType = 'win';
    else if (roll < 80) resultType = 'stay';

    try {
        const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
        await userRef.update({ balance: firebase.firestore.FieldValue.increment(-cost) });
        window.userBalance -= cost;
        if (window.updateNavBadges) window.updateNavBadges();
        if (typeof window.playSpinSound === 'function') window.playSpinSound();
    } catch (e) {
        window.isActionInProgress = false;
        return window.showToast("FALHA NA CONEXÃO.", "error");
    }

    // Preencher rail com cards temáticos
    rail.innerHTML = '';
    for(let i=0; i<50; i++) {
        const card = document.createElement('div');
        card.className = 'special-card';
        if (i === 40) {
            card.style.borderColor = resultType === 'win' ? '#f00' : (resultType === 'stay' ? '#0f0' : '#333');
            card.innerHTML = resultType === 'win' ? (currentLevel === 3 ? 'DM' : 'UP') : (resultType === 'stay' ? 'OK' : 'XX');
            if (resultType === 'win' && currentLevel === 3) card.classList.add('rank-dark-matter');
        } else {
            card.innerHTML = Math.random() > 0.5 ? '0x' : 'F1';
            card.style.opacity = '0.3';
        }
        rail.appendChild(card);
    }

    // Usa requestAnimationFrame para garantir que o browser registre o reset da posição antes da animação
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const cards = rail.children;
            const winnerCard = cards[40];
            const wrapperWidth = rail.parentElement.offsetWidth;
            
            // Cálculo dinâmico para centralizar o card vencedor independente da tela
            const targetX = winnerCard.offsetLeft - (wrapperWidth / 2) + (winnerCard.offsetWidth / 2);

            rail.style.transition = 'transform 5s cubic-bezier(0.15, 0, 0.05, 1)';
            rail.style.transform = `translateX(-${targetX}px)`;
        });
    });
        
        setTimeout(async () => {
            try {
                if (resultType === 'win') {
                    const newLevel = currentLevel + 1;
                    const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
                    await userRef.update({ [`upgrades.${gameId}`]: newLevel });
                    window.showToast(`BYPASS COMPLETO! ${selectedGameForSpecialBox.title} agora é Rank ${newLevel === 4 ? '!!!!' : newLevel}!`, "success");
                } else if (resultType === 'stay') {
                    window.showToast("CONEXÃO ESTÁVEL. NADA MUDOU.", "info");
                } else {
                    window.showToast("FALHA CRÍTICA. CRÉDITOS PERDIDOS.", "error");
                }
                await window.loadUserData(window.auth.currentUser.uid);
                renderSpecialBoxInventory();
                selectedGameForSpecialBox = null; // Limpa a seleção após a roleta
            } finally {
                window.isActionInProgress = false;
            }
        }, 6000);
    }, 50);
};

// Função chamada pelo global.js quando os dados estão prontos
window.renderMercadoNegro = () => {
    renderCheaperGames();
    renderSpecialBoxInventory();
    initSpecialRoulette();
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log("%c MERCADO NEGRO ATIVO ", "background: #000; color: #0f0; font-size: 20px;");
    
    // Pequena animação de "digitação" no parágrafo inicial
    const p = document.querySelector('.black-market-container p');
    const text = p.innerText;
    p.innerText = '';
    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) {
            p.innerText += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
        }
    }, 50);
});