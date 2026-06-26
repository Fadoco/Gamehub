/**
 * Sistema de Revenda de Jogos
 * Usuários podem revender seus jogos com 70% do valor (taxa de 30%)
 */

const RESALE_CUT = 0.70; // Usuário recebe 70%
const TAX_PERCENTAGE = 0.30; // Taxa de 30%

let resaleSelection = new Set(); // Rastreia jogos selecionados para revenda

/**
 * Inicializar a página de revenda
 */
function initReseller() {
    const container = document.getElementById('reseller-grid');
    if (!container) return;

    // Aguardar dados do usuário e dos jogos
    const startListener = () => {
        if (!window.db || !window.auth.currentUser || !window.allGamesData) {
            setTimeout(startListener, 500);
            return;
        }

        loadResellerGames();
    };

    startListener();
}

/**
 * Carregar e exibir os jogos disponíveis para revenda
 */
async function loadResellerGames() {
    try {
        const container = document.getElementById('reseller-grid');
        const emptyState = document.getElementById('reseller-empty');
        
        if (!container) return;

        // Verificar se o usuário possui library
        if (!window.userLibrary || window.userLibrary.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            updateResellingSummary();
            return;
        }

        // Carregar apenas os jogos que o usuário possui
        const userGames = window.allGamesData.filter(game => 
            window.userLibrary.includes(String(game.id)) || window.userLibrary.includes(Number(game.id))
        );

        if (userGames.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            updateResellingSummary();
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');

        // Renderizar cards de revenda
        container.innerHTML = userGames.map(game => {
            const originalPrice = window.utils.parsePrice(game.currentPrice);
            const gameId = String(game.id);
            const upgradeLevel = (window.userUpgrades && window.userUpgrades[gameId]) || 0;
            
            // Calcular o valor considerando upgrades
            const salePrice = window.RankSystem ? 
                window.RankSystem.calculateValuation(originalPrice, upgradeLevel) : 
                originalPrice;
            
            const resalePrice = salePrice * RESALE_CUT;
            const taxAmount = salePrice * TAX_PERCENTAGE;
            const isSelected = resaleSelection.has(gameId);
            
            // Se houver upgrade, mostrar o multiplicador
            const upgradeLabel = upgradeLevel > 0 ? 
                `<span style="font-size: 11px; color: #f39c12; margin-top: 4px;">⭐ ${window.RankSystem.getRankMetadata(upgradeLevel).label}</span>` : 
                '';

            return `
                <div class="reseller-card ${isSelected ? 'selected' : ''}" data-game-id="${gameId}">
                    <div class="reseller-card__checkbox" onclick="toggleGameSelection('${gameId}', event)">
                        ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <img src="${game.coverUrl || game.image}" alt="${game.title}" class="reseller-card__image">
                    <div class="reseller-card__content">
                        <h3 class="reseller-card__title">${game.title}</h3>
                        ${upgradeLabel}
                        
                        <div class="reseller-card__prices">
                            <div class="price-row">
                                <span class="price-label">${upgradeLevel > 0 ? 'Valor Melhorado' : 'Valor Original'}</span>
                                <span class="price-value original">R$ ${salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div class="price-row">
                                <span class="price-label">Taxa (-30%)</span>
                                <span class="price-value" style="color: #e74c3c;">-R$ ${taxAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div class="price-row" style="border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px;">
                                <span class="price-label">Você Recebe</span>
                                <span class="price-value resale">R$ ${resalePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                    <button class="reseller-card__button" onclick="toggleGameSelection('${gameId}', event)">
                        ${isSelected ? 'Remover Revenda' : 'Vender Este Jogo'}
                    </button>
                </div>
            `;
        }).join('');

        // Configurar listeners de clique nos cards
        document.querySelectorAll('.reseller-card').forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.closest('button') && !e.target.closest('.reseller-card__checkbox')) {
                    const gameId = this.dataset.gameId;
                    toggleGameSelection(gameId, e);
                }
            });
        });

        // Atualizar resumo
        updateResellingSummary();

    } catch (error) {
        console.error('❌ Erro ao carregar jogos para revenda:', error);
        window.showToast('Erro ao carregar seus jogos.', 'error');
    }
}

/**
 * Alternar seleção de jogo para revenda
 */
window.toggleGameSelection = (gameId, event) => {
    event?.stopPropagation();
    
    const gameIdStr = String(gameId);
    
    if (resaleSelection.has(gameIdStr)) {
        resaleSelection.delete(gameIdStr);
    } else {
        resaleSelection.add(gameIdStr);
    }

    // Atualizar UI
    const card = document.querySelector(`[data-game-id="${gameIdStr}"]`);
    if (card) {
        card.classList.toggle('selected');
        const button = card.querySelector('.reseller-card__button');
        const checkbox = card.querySelector('.reseller-card__checkbox');
        
        if (card.classList.contains('selected')) {
            button.textContent = 'Remover Revenda';
            checkbox.innerHTML = '<i class="fas fa-check"></i>';
        } else {
            button.textContent = 'Vender Este Jogo';
            checkbox.innerHTML = '';
        }
    }

    updateResellingSummary();
};

/**
 * Atualizar resumo de revenda
 */
function updateResellingSummary() {
    const summarySection = document.getElementById('reseller-summary');
    const gamesAvailable = document.getElementById('games-available');
    const totalPossible = document.getElementById('total-possible');
    
    let totalOriginal = 0;
    let totalResale = 0;
    let totalTax = 0;

    // Calcular totais para todos os jogos do usuário (considerando upgrades)
    if (window.userLibrary && window.allGamesData) {
        window.userLibrary.forEach(gameId => {
            const game = window.allGamesData.find(g => 
                String(g.id) === String(gameId) || Number(g.id) === Number(gameId)
            );
            if (game) {
                const basePrice = window.utils.parsePrice(game.currentPrice);
                const upgradeLevel = (window.userUpgrades && window.userUpgrades[String(gameId)]) || 0;
                
                // Calcular valor considerando upgrade
                const salePrice = window.RankSystem ? 
                    window.RankSystem.calculateValuation(basePrice, upgradeLevel) : 
                    basePrice;
                
                totalOriginal += salePrice;
                totalResale += salePrice * RESALE_CUT;
                totalTax += salePrice * TAX_PERCENTAGE;
            }
        });
    }

    // Atualizar cards de info
    if (gamesAvailable) gamesAvailable.textContent = `${window.userLibrary?.length || 0} Jogos`;
    if (totalPossible) totalPossible.textContent = `R$ ${totalResale.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Atualizar resumo de seleção
    const summaryCount = document.getElementById('summary-count');
    const summaryOriginal = document.getElementById('summary-original');
    const summaryTax = document.getElementById('summary-tax');
    const summaryTotal = document.getElementById('summary-total');
    const btnConfirm = document.getElementById('btn-confirm-resale');

    let selectedOriginal = 0;
    let selectedResale = 0;
    let selectedTax = 0;

    resaleSelection.forEach(gameId => {
        const game = window.allGamesData.find(g => String(g.id) === String(gameId));
        if (game) {
            const basePrice = window.utils.parsePrice(game.currentPrice);
            const upgradeLevel = (window.userUpgrades && window.userUpgrades[String(gameId)]) || 0;
            
            // Calcular valor considerando upgrade
            const salePrice = window.RankSystem ? 
                window.RankSystem.calculateValuation(basePrice, upgradeLevel) : 
                basePrice;
            
            selectedOriginal += salePrice;
            selectedResale += salePrice * RESALE_CUT;
            selectedTax += salePrice * TAX_PERCENTAGE;
        }
    });

    if (summaryCount) summaryCount.textContent = resaleSelection.size;
    if (summaryOriginal) summaryOriginal.textContent = `R$ ${selectedOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (summaryTax) summaryTax.textContent = `R$ ${selectedTax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (summaryTotal) summaryTotal.textContent = `R$ ${selectedResale.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Mostrar/Ocultar resumo
    if (summarySection) {
        if (resaleSelection.size > 0) {
            summarySection.classList.remove('hidden');
        } else {
            summarySection.classList.add('hidden');
        }
    }

    // Ativar/Desativar botão
    if (btnConfirm) {
        btnConfirm.disabled = resaleSelection.size === 0;
    }
}

/**
 * Confirmar e processar a revenda
 */
window.confirmResale = async () => {
    if (resaleSelection.size === 0) {
        window.showToast('Selecione pelo menos um jogo para revender.', 'info');
        return;
    }

    if (!window.auth.currentUser) {
        window.showToast('Você precisa estar logado para revender.', 'error');
        return;
    }

    const btn = document.getElementById('btn-confirm-resale');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Processando...';

    try {
        // Calcular o valor total de revenda
        let totalResaleValue = 0;
        const gamesToRemove = [];

        resaleSelection.forEach(gameId => {
            const game = window.allGamesData.find(g => String(g.id) === String(gameId));
            if (game) {
                const basePrice = window.utils.parsePrice(game.currentPrice);
                const upgradeLevel = (window.userUpgrades && window.userUpgrades[String(gameId)]) || 0;
                
                // Calcular valor considerando upgrade
                const salePrice = window.RankSystem ? 
                    window.RankSystem.calculateValuation(basePrice, upgradeLevel) : 
                    basePrice;
                
                const resalePrice = salePrice * RESALE_CUT;
                totalResaleValue += resalePrice;
                gamesToRemove.push(Number(gameId));
            }
        });

        // Atualizar no Firebase
        const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
        
        // Adicionar valor à carteira (crédito não conta como empréstimo)
        if (window.FirebaseTransactions?.creditBalance) {
            await window.FirebaseTransactions.creditBalance(
                window.auth.currentUser.uid,
                totalResaleValue,
                'resale_games'
            );
        } else {
            await userRef.update({
                balance: firebase.firestore.FieldValue.increment(totalResaleValue)
            });
        }

        // Remover jogos da biblioteca
        for (const gameId of gamesToRemove) {
            await userRef.update({
                library: firebase.firestore.FieldValue.arrayRemove(gameId),
                [`upgrades.${gameId}`]: firebase.firestore.FieldValue.delete()
            });
        }

        // Feedback ao usuário
        window.showToast(
            `✅ Revenda concluída! Você recebeu R$ ${totalResaleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            'success'
        );

        // Limpar seleção
        resaleSelection.clear();

        // Recarregar dados
        await window.loadUserData(window.auth.currentUser.uid);
        
        // Atualizar página
        setTimeout(() => {
            loadResellerGames();
            updateResellingSummary();
        }, 500);

    } catch (error) {
        console.error('❌ Erro ao processar revenda:', error);
        window.showToast('Erro ao processar revenda. Tente novamente.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
};

/**
 * Pesquisar jogos na página de revenda
 */
function setupResellerSearch() {
    const searchInput = document.getElementById('reseller-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.reseller-card');

        cards.forEach(card => {
            const title = card.querySelector('.reseller-card__title').textContent.toLowerCase();
            card.style.display = title.includes(query) ? 'flex' : 'none';
        });
    });
}

/**
 * Evento do botão de confirmação
 */
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-confirm-resale');
    if (btn) {
        btn.addEventListener('click', window.confirmResale);
    }

    // Inicializar revenda
    initReseller();
    setupResellerSearch();
});

// Adicionar renderizador de página
document.addEventListener('DOMContentLoaded', () => {
    if (window.addPageRenderer) {
        window.addPageRenderer('reseller.html', () => {
            loadResellerGames();
            updateResellingSummary();
        });
    }
});
