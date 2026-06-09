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
        .filter(g => !window.userLibrary.some(id => String(id) === String(g.id)) && window.utils.parsePrice(g.currentPrice) > 0)
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
        const level = (window.userUpgrades && window.userUpgrades[game.id]) || 0;
        const rankMeta = window.RankSystem.getRankMetadata(level);
        const auraClass = rankMeta.aura || '';
        const titleClass = rankMeta.class || '';

        return `
        <div class="bet-item ${auraClass}" data-id="${game.id}" onclick="selectGameForSpecialBox('${game.id}')" style="overflow: visible;">
            <img src="${game.coverUrl || game.image}" alt="${game.title}">
            <div class="bet-item-info">
                <span class="bet-item-name" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                    <span class="${titleClass}">${game.title}</span>
                    ${window.getUpgradeHtml(game.id)}
                </span>
                <span class="bet-item-price">${(() => {
                    const level = (window.userUpgrades && window.userUpgrades[game.id]) || 0;
                    const val = window.RankSystem.calculateValuation(window.utils.parsePrice(game.currentPrice), level);
                    return val > 0 ? `Valor: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : game.currentPrice;
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
        el.classList.toggle('selected', String(el.getAttribute('data-id')) === String(gameId));
    });

    // Atualiza o texto do botão da roleta baseado no rank
    const spinBtn = document.getElementById('btn-spin-special');
    if (spinBtn) spinBtn.innerText = (window.userUpgrades[gameId] || 0) === 3 ? "TENTAR DARK MATTER (R$ 250)" : "TENTAR UPGRADE (R$ 250)";
    
    window.showToast(`Jogo ${game.title} selecionado para corrupção.`, "info");
};

// Garante que os botões de caixa estejam prontos
const initMarketButtons = () => {
    const glitchBtn = document.getElementById('btn-open-glitch-box');
    const voidBtn = document.getElementById('btn-open-void-box');
    if (glitchBtn) glitchBtn.onclick = () => window.openSpecialBox('glitch');
    if (voidBtn) voidBtn.onclick = () => window.openSpecialBox('void');
};

// Função para abrir as caixas especiais
window.openSpecialBox = async (tier) => {
    if (window.isActionInProgress) return;

    const boxCosts = {
        'glitch': 400,
        'void': 500
    };
    const cost = boxCosts[tier];
    if (!cost) return;

    if (window.userBalance < cost) return window.showToast("SALDO INSUFICIENTE NO SISTEMA.", "error");    

    window.customConfirm(`Confirmar abertura da ${tier.toUpperCase()} BOX por R$ ${cost.toFixed(2)}?`, async () => {
        try {
            window.isActionInProgress = true;
            
            // Toca o som de abertura
            if (typeof window.playSpinSound === 'function') window.playSpinSound();

            const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
            await userRef.update({
                balance: firebase.firestore.FieldValue.increment(-cost)
            });

            // Mostrar modal de hacking
            const modal = document.getElementById('box-opening-modal');
            const rail = document.getElementById('modal-market-rail');
            
            if (modal) {
                modal.style.display = 'flex';
                document.getElementById('modal-box-title').textContent = `> INJETANDO_PAYLOAD_${tier.toUpperCase()}...`;
            }
            // Lógica de Seleção de Jogo (Loot)
            const allGames = window.allGamesData.filter(g => window.utils.parsePrice(g.currentPrice) > 0);
            let pool = [];

            if (tier === 'glitch') {
                // Glitch Box: Jogos acima de R$ 100
                pool = allGames.filter(g => window.utils.parsePrice(g.currentPrice) >= 100);
            } else if (tier === 'void') {
                // Void Box: Jogos de elite (Acima de R$ 200)
                pool = allGames.filter(g => window.utils.parsePrice(g.currentPrice) >= 200);
            }
            
            if (pool.length === 0) pool = allGames; // Fallback
            const winningGame = pool[Math.floor(Math.random() * pool.length)];

            // Configurar Trilho da Roleta Hacker (Sistema de Giro)
            rail.style.transition = 'none';
            rail.style.transform = 'translateX(0px)';
            rail.innerHTML = '';

            // Preenche o trilho com 80 itens (igual a roleta.js)
            for (let i = 0; i < 80; i++) {
                const card = document.createElement('div');
                card.className = 'special-card';
                if (i === 65) {
                    card.innerHTML = `<img src="${winningGame.coverUrl || winningGame.image}" style="width:100%; height:100%; object-fit:cover;">`;
                    card.style.borderColor = '#0f0';
                } else {
                    card.innerHTML = '<span class="q-mark">?</span>';
                }
                rail.appendChild(card);
            }

            // Inicia o Giro com atraso dramático de 1.2s (igual a roleta.js)
            setTimeout(() => {
                const winnerCard = rail.children[65];
                const wrapperWidth = rail.parentElement.offsetWidth;
                // Centraliza o card 65 no seletor
                const targetX = winnerCard.offsetLeft - (wrapperWidth / 2) + (winnerCard.offsetWidth / 2);
                
                rail.style.transition = 'transform 5.7s cubic-bezier(0.15, 0, 0.05, 1)';
                rail.style.transform = `translateX(-${targetX}px)`;
            }, 1200);

            // Finalização do Giro e Entrega do Prêmio
            setTimeout(async () => {
                if (modal) modal.style.display = 'none';
                
                // Revelar no Modal de Resultado
                if (window.showRevealModal) {
                    // Criamos um elemento temporário para o modal de revelação usar
                    const tempCard = document.createElement('div');
                    tempCard.className = 'roulette-card rarity-mythic';
                    tempCard.style.border = "2px solid #0f0";
                    tempCard.innerHTML = `
                        <img src="${winningGame.coverUrl || winningGame.image}" style="width:100%; height:100%; object-fit:cover;">
                        <span class="card-label" style="background: #000; color: #0f0;">${winningGame.title}</span>
                    `;
                    window.showRevealModal(tempCard, "SISTEMA SEQUESTRADO!");
                }

                // Adicionar à biblioteca
                if (window.userLibrary.includes(winningGame.id)) {
                    // Reembolso se já tiver (Mercado Negro é generoso: 70% de volta)
                    const refund = window.utils.parsePrice(winningGame.currentPrice) * 0.7;
                    await userRef.update({ balance: firebase.firestore.FieldValue.increment(refund) });
                    window.showToast(`Software já detectado. Crédito de R$ ${refund.toFixed(2)} injetado.`, "info");
                } else {
                    await userRef.update({
                        library: firebase.firestore.FieldValue.arrayUnion(winningGame.id)
                    });
                    window.showToast(`CONEXÃO ESTABELECIDA: ${winningGame.title} agora é seu.`, "success");
                }
                
                await window.loadUserData(window.auth.currentUser.uid);
                renderSpecialBoxInventory();
                window.isActionInProgress = false;
            }, 7100); // 1.2s de delay + 5.7s de giro + margem

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
        card.innerHTML = '<span class="q-mark">?</span>';
        rail.appendChild(card);
    }
}

window.spinSpecialRoulette = async () => {
    const cost = 250;
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

    // Preencher rail com cards temáticos
    rail.innerHTML = '';
    for(let i=0; i<50; i++) {
        const card = document.createElement('div');
        card.className = 'special-card';
        card.innerHTML = '<span class="q-mark">?</span>';
        rail.appendChild(card);
    }

    try {
        const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
        await userRef.update({ balance: firebase.firestore.FieldValue.increment(-cost) });
        window.userBalance -= cost;
        if (window.updateNavBadges) window.updateNavBadges();
    } catch (e) {
        window.isActionInProgress = false;
        return window.showToast("FALHA NA CONEXÃO.", "error");
    }

    // Força o reflow para resetar a posição antes de iniciar a animação
    rail.offsetHeight;

    // SOM INICIAL E ATRASO (Sincronizado com roleta.js)
    if (typeof window.playSpinSound === 'function') window.playSpinSound();

    setTimeout(() => {
        const cards = rail.children;
        const winnerCard = cards[40];
        const wrapperWidth = rail.parentElement.offsetWidth;
        
        // Cálculo dinâmico para centralizar o card vencedor independente da tela
        const targetX = winnerCard.offsetLeft - (wrapperWidth / 2) + (winnerCard.offsetWidth / 2);

        rail.style.transition = 'transform 5.7s cubic-bezier(0.15, 0, 0.05, 1)';
        rail.style.transform = `translateX(-${targetX}px)`;
    }, 1200); // 1.2s de atraso para drama, igual roleta.js
        
    setTimeout(async () => {
        const cards = rail.children;
        const winnerCard = cards[40];
        
        // Revelação do Card Vencedor
        winnerCard.style.borderColor = resultType === 'win' ? '#f00' : (resultType === 'stay' ? '#0f0' : '#333');
        winnerCard.innerHTML = resultType === 'win' ? (currentLevel === 3 ? 'DM' : 'UP') : (resultType === 'stay' ? 'OK' : 'XX');
        if (resultType === 'win' && currentLevel === 3) winnerCard.classList.add('rank-dark-matter');

        // Pop-up de Resultado (Drama)
        if (window.showRevealModal) {
            const label = resultType === 'win' ? "BYPASS COMPLETO!" : (resultType === 'stay' ? "NADA MUDOU" : "SISTEMA CORROMPIDO");
            window.showRevealModal(winnerCard, label);
        }

        try {
            if (resultType === 'win') {
                const newLevel = currentLevel + 1;
                const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
                await userRef.update({ [`upgrades.${gameId}`]: newLevel });
                window.showToast(`BYPASS COMPLETO! ${selectedGameForSpecialBox.title} agora é Rank ${newLevel === 4 ? '!!!!' : newLevel}!`, "success");
                } 
                else if (resultType === 'stay') {
                window.showToast("CONEXÃO ESTÁVEL. NADA MUDOU.", "info");
                } 
                else {
                    // PERDA: Remove o jogo da conta
                    const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
                    const idToRemove = isNaN(gameId) ? gameId : Number(gameId);
                    
                    await userRef.update({
                        library: firebase.firestore.FieldValue.arrayRemove(idToRemove),
                        [`upgrades.${gameId}`]: firebase.firestore.FieldValue.delete()
                    });
                    // Tenta remover como string também para garantir
                    await userRef.update({ library: firebase.firestore.FieldValue.arrayRemove(String(gameId)) });

                    window.showToast("FALHA CRÍTICA: SOFTWARE DELETADO DO SISTEMA.", "error");
            }
            await window.loadUserData(window.auth.currentUser.uid);
            renderSpecialBoxInventory();
            selectedGameForSpecialBox = null; // Limpa a seleção após a roleta
        } finally {
            window.isActionInProgress = false;
        }
    }, 7100); // 1.2s + 5.7s + margem de erro
};

// Função chamada pelo global.js quando os dados estão prontos
window.renderMercadoNegro = () => {
    renderCheaperGames();
    renderSpecialBoxInventory();
    initSpecialRoulette();
    initMarketButtons();
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