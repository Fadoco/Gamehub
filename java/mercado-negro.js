/**
 * Lógica do Mercado Negro - Sistema de compras secretas com caixa especial
 */

console.log('✅ mercado-negro.js loaded');

// --- CONFIGURAÇÕES ---
let selectedGameForSpecialBox = null;

async function processSecretPurchase(cost, itemName, actionFn) {
    if (!window.auth || !window.auth.currentUser) return window.showToast("Conexão perdida. Relogue.", "error");
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

// Renderiza o inventário de jogos para seleção na caixa especial
function renderSpecialBoxInventory() {
    const inventoryGrid = document.getElementById('special-box-inventory-grid');
    if (!inventoryGrid || !window.allGamesData || window.allGamesData.length === 0) return;

    const library = window.userLibrary || [];
    const upgrades = window.userUpgrades || {};

    // Filtrar jogos da biblioteca que NÃO são gratuitos
    const eligibleGames = window.allGamesData.filter(game => {
        const isOwned = library.some(libId => String(libId) === String(game.id));
        const isNotFree = window.utils.parsePrice(game.currentPrice) >= 0;
        return isOwned && isNotFree;
    });

    if (eligibleGames.length === 0) {
        inventoryGrid.innerHTML = '<p style="grid-column: 1/-1; padding: 20px; font-size: 12px; color: #666;">Nenhum software alvo detectado no seu terminal.</p>';
        document.getElementById('btn-spin-special').disabled = true;
        return;
    }

    inventoryGrid.innerHTML = eligibleGames.map(game => {
        const level = (window.userUpgrades && window.userUpgrades[game.id]) || 0;
        const rankMeta = window.RankSystem ? window.RankSystem.getRankMetadata(level) : { class: '', label: '' };
        const auraClass = rankMeta.aura || '';
        const titleClass = rankMeta.class || '';

        return `
        <div class="bet-item ${auraClass}" data-id="${game.id}" onclick="selectGameForSpecialBox('${game.id}')" style="overflow: visible;">
            <img src="${game.coverUrl || game.image}" alt="${game.title}">
            <div class="bet-item-info">
                <span class="bet-item-name" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; width: 100%;">
                    <span class="${titleClass}">${game.title}</span>
                    ${window.getUpgradeHtml ? window.getUpgradeHtml(game.id) : ''}
                </span>
            </div>
        </div>
        `;
    }).join('');
}

// Seleciona um jogo para a caixa especial
window.selectGameForSpecialBox = (gameId) => {
    document.querySelectorAll('.bet-item').forEach(el => el.classList.remove('selected'));
    const selected = document.querySelector(`[data-id="${gameId}"]`);
    if (selected) selected.classList.add('selected');
    selectedGameForSpecialBox = gameId;
};

// Compra jogo secreto
window.buySecretGame = async (gameId, price) => {
    await processSecretPurchase(price, `Jogo ID ${gameId}`, async (userRef) => {
        const library = window.userLibrary || [];
        if (!library.includes(gameId)) {
            library.push(gameId);
            await userRef.update({ library });
        }
    });
};

// Renderizar quando dados estiverem disponíveis
if (window.allGamesData && window.allGamesData.length > 0) {
    renderCheaperGames();
    renderSpecialBoxInventory();
}

// Escutar atualizações
window.addEventListener('gamesDataLoaded', () => {
    renderCheaperGames();
    renderSpecialBoxInventory();
});
