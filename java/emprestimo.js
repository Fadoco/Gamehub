/**
 * Página de empréstimos.
 */

const selectedLoanGameIds = new Set();

function formatCurrency(value) {
    const amount = Number(value) || 0;
    return `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function getGameLoanValue(gameId) {
    const game = (window.allGamesData || []).find((g) => String(g.id) === String(gameId));
    if (!game) return null;

    const basePrice = window.utils?.parsePrice ? window.utils.parsePrice(game.currentPrice) : Number(game.currentPrice) || 0;
    const upgradeLevel = (window.userUpgrades && (window.userUpgrades[String(gameId)] ?? window.userUpgrades[gameId])) || 0;
    const valuation = window.RankSystem?.calculateValuation
        ? window.RankSystem.calculateValuation(basePrice, upgradeLevel)
        : basePrice;

    return {
        gameId: String(gameId),
        game,
        title: game.title,
        upgradeLevel,
        valuation: Number(valuation) || 0
    };
}

window.toggleLoanGameSelection = (gameId) => {
    const normalizedId = String(gameId);
    if (selectedLoanGameIds.has(normalizedId)) {
        selectedLoanGameIds.delete(normalizedId);
    } else {
        selectedLoanGameIds.add(normalizedId);
    }

    renderLoanPage();
};

function renderLoanGamesList() {
    const list = document.getElementById('loan-games-list');
    if (!list) return;

    const library = Array.isArray(window.userLibrary) ? window.userLibrary : [];
    if (!library.length) {
        list.innerHTML = '<p>Você não possui jogos para usar como pagamento.</p>';
        return;
    }

    const gameItems = library
        .map((gameId) => getGameLoanValue(gameId))
        .filter((item) => !!item)
        .sort((a, b) => b.valuation - a.valuation);

    if (!gameItems.length) {
        list.innerHTML = '<p>Não foi possível calcular o valor dos jogos da sua biblioteca.</p>';
        return;
    }

    list.innerHTML = `
        <div class="game-grid loan-games-grid">
            ${gameItems.map((item) => {
                const isSelected = selectedLoanGameIds.has(item.gameId);
                const cover = item.game.coverUrl || item.game.image;
                const upgradeHtml = item.upgradeLevel > 0 && window.RankSystem?.getUpgradeHtml
                    ? window.RankSystem.getUpgradeHtml(item.gameId)
                    : '';

                return `
                    <article class="game-card loan-game-card ${isSelected ? 'selected' : ''}" role="button" tabindex="0" aria-pressed="${isSelected}" aria-label="Selecionar ${item.game.title} para pagamento" data-loan-game-id="${item.gameId}" onclick="window.toggleLoanGameSelection('${item.gameId}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.toggleLoanGameSelection('${item.gameId}')}">
                        <div class="card-media">
                            <span class="loan-select-pill">${isSelected ? 'Selecionado' : 'Toque para usar'}</span>
                            <img data-src="${cover}" alt="${item.game.title}" class="lazy-image" referrerpolicy="no-referrer">
                            <div class="loan-value-chip">${formatCurrency(item.valuation)}</div>
                        </div>
                        <div class="game-info">
                            <div class="game-details">
                                <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                                    <p class="game-title">${item.game.title}</p>
                                    ${upgradeHtml}
                                </div>
                                <span class="game-tags">${item.game.tags?.slice(0, 3).join(', ') || 'Jogo da biblioteca'}</span>
                            </div>
                            <div class="price-container">
                                <p class="game-price">Abate ${formatCurrency(item.valuation)}</p>
                            </div>
                        </div>
                    </article>
                `;
            }).join('')}
        </div>
    `;
}

function renderLoanHistory() {
    const historyList = document.getElementById('loan-history-list');
    if (!historyList) return;

    const history = Array.isArray(window.userLoanHistory) ? window.userLoanHistory : [];
    if (!history.length) {
        historyList.innerHTML = '<p>Nenhuma movimentação de empréstimo ainda.</p>';
        return;
    }

    const labels = {
        loan_request: 'Empréstimo solicitado',
        loan_payment_money: 'Pagamento com dinheiro',
        loan_payment_games: 'Pagamento com jogos',
        loan_daily_expire: 'Expiração diária',
        loan_max_reset: 'Reset de emergência'
    };

    historyList.innerHTML = [...history]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .map((entry) => `
            <div class="loan-history-item">
                <div><strong>${labels[entry.type] || 'Movimentação'}</strong></div>
                <div>Valor: ${formatCurrency(entry.requestedAmount ?? entry.paidAmount ?? entry.expiredAmount ?? 0)}</div>
                <div>Dívida após: ${formatCurrency(entry.totalDebtAfter || 0)}</div>
                <div>Data: ${new Date(entry.date).toLocaleString('pt-BR')}</div>
            </div>
        `).join('');
}

function renderLoanPage() {
    const debtElement = document.getElementById('loan-debt-amount');
    const walletElement = document.getElementById('loan-wallet-amount');
    const availableElement = document.getElementById('loan-daily-available');
    const borrowedElement = document.getElementById('loan-borrowed-today');
    const rulesText = document.getElementById('loan-rules-text');
    const requestSubmitBtn = document.querySelector('#loan-request-form button[type="submit"]');
    const emergencyPanel = document.getElementById('loan-emergency-panel');
    const emergencyBtn = document.getElementById('loan-emergency-reset-btn');
    const emergencyMessage = document.getElementById('loan-emergency-message');

    if (!debtElement || !walletElement) return;

    const minAmount = window.FirebaseTransactions?.LOAN_MIN_AMOUNT ?? 50;
    const maxAmount = window.FirebaseTransactions?.LOAN_MAX_AMOUNT ?? 5000;
    const dailyLimit = window.FirebaseTransactions?.LOAN_DAILY_LIMIT ?? 5000;
    const maxDebt = window.FirebaseTransactions?.LOAN_MAX_DEBT ?? 15000;
    const borrowedToday = Number(window.userLoanBorrowedToday) || 0;
    const availableToday = Math.max(0, dailyLimit - borrowedToday);
    const currentDebt = Number(window.userLoanDebt) || 0;
    const atMaxDebt = currentDebt >= maxDebt;

    debtElement.textContent = formatCurrency(currentDebt);
    walletElement.textContent = formatCurrency(window.userBalance || 0);

    if (availableElement) availableElement.textContent = formatCurrency(availableToday);
    if (borrowedElement) borrowedElement.textContent = formatCurrency(borrowedToday);
    if (rulesText) {
        rulesText.textContent = `Você pode pegar até ${formatCurrency(dailyLimit)} por dia. Pedido mínimo: ${formatCurrency(minAmount)}. Pedido máximo: ${formatCurrency(maxAmount)}. Dívida máxima: ${formatCurrency(maxDebt)}.`;
    }

    if (emergencyPanel) {
        emergencyPanel.classList.toggle('hidden', !atMaxDebt);
    }
    if (emergencyBtn) {
        emergencyBtn.disabled = !atMaxDebt;
    }
    if (emergencyMessage) {
        emergencyMessage.textContent = atMaxDebt
            ? 'Você atingiu o limite máximo de dívida. Só resta a saída extrema.'
            : 'O botão aparece quando a dívida atingir o máximo.';
    }
    if (requestSubmitBtn) {
        requestSubmitBtn.disabled = atMaxDebt;
        requestSubmitBtn.textContent = atMaxDebt ? 'Limite máximo atingido' : 'Pedir empréstimo';
    }

    renderLoanGamesList();
    renderLoanHistory();
}

async function handleLoanRequestSubmit(event) {
    event.preventDefault();
    const amountInput = document.getElementById('loan-amount');
    if (!amountInput) return;

    if (!window.auth?.currentUser) {
        window.showToast('Você precisa estar logado para pedir empréstimo.', 'error');
        return;
    }
    if (!window.FirebaseTransactions?.requestLoan) {
        window.showToast('Módulo de transações não carregado.', 'error');
        return;
    }

    const requestedAmount = Number(amountInput.value);
    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
        const result = await window.FirebaseTransactions.requestLoan(window.auth.currentUser.uid, requestedAmount);
        window.userBalance = result.newBalance;
        window.userLoanDebt = result.newDebt;
        window.userLoanHistory = [result.loanEntry, ...(window.userLoanHistory || [])];
        await window.loadUserData(window.auth.currentUser.uid);
        window.updateNavBadges?.();
        renderLoanPage();
        amountInput.value = '';
        window.showToast('Empréstimo liberado na sua carteira!', 'success');
    } catch (error) {
        window.showToast(error.message || 'Erro ao solicitar empréstimo.', 'error');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

async function handleLoanPaymentSubmit(event) {
    event.preventDefault();
    const amountInput = document.getElementById('loan-payment-amount');
    if (!amountInput) return;

    if (!window.auth?.currentUser) {
        window.showToast('Você precisa estar logado para pagar a dívida.', 'error');
        return;
    }
    if (!window.FirebaseTransactions?.repayLoan) {
        window.showToast('Módulo de transações não carregado.', 'error');
        return;
    }

    const paymentAmount = Number(amountInput.value);
    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
        const result = await window.FirebaseTransactions.repayLoan(window.auth.currentUser.uid, paymentAmount);
        window.userBalance = result.newBalance;
        window.userLoanDebt = result.newDebt;
        window.userLoanHistory = [result.loanEntry, ...(window.userLoanHistory || [])];
        await window.loadUserData(window.auth.currentUser.uid);
        window.updateNavBadges?.();
        renderLoanPage();
        amountInput.value = '';
        window.showToast(`Pagamento de ${formatCurrency(result.paymentAmount)} realizado com sucesso!`, 'success');
    } catch (error) {
        window.showToast(error.message || 'Erro ao pagar dívida.', 'error');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

async function handleLoanGamesPayment() {
    if (!window.auth?.currentUser) {
        window.showToast('Você precisa estar logado para pagar com jogos.', 'error');
        return;
    }
    if (!window.FirebaseTransactions?.repayLoanWithGames) {
        window.showToast('Módulo de transações não carregado.', 'error');
        return;
    }

    const selected = [...selectedLoanGameIds];
    if (!selected.length) {
        window.showToast('Selecione ao menos um jogo.', 'info');
        return;
    }

    const btn = document.getElementById('loan-pay-games-btn');
    if (btn) btn.disabled = true;

    try {
        const result = await window.FirebaseTransactions.repayLoanWithGames(window.auth.currentUser.uid, selected);
        window.userLoanDebt = result.newDebt;
        window.userLoanHistory = [result.loanEntry, ...(window.userLoanHistory || [])];
        selectedLoanGameIds.clear();
        await window.loadUserData(window.auth.currentUser.uid);
        renderLoanPage();
        window.showToast(`Dívida abatida em ${formatCurrency(result.paymentAmount)} usando jogos.`, 'success');
    } catch (error) {
        window.showToast(error.message || 'Erro ao pagar com jogos.', 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function handleEmergencyLoanReset() {
    if (!window.auth?.currentUser) {
        window.showToast('Você precisa estar logado.', 'error');
        return;
    }
    if (!window.FirebaseTransactions?.resetUserProgressOnLoanMax) {
        window.showToast('Módulo de transações não carregado.', 'error');
        return;
    }

    const debt = Number(window.userLoanDebt) || 0;
    const maxDebt = window.FirebaseTransactions?.LOAN_MAX_DEBT ?? 15000;
    if (debt < maxDebt) {
        window.showToast('Essa opção só aparece quando a dívida atinge o máximo.', 'info');
        return;
    }

    window.customConfirm(
        'Dar no bequinho da esquina? Isso vai zerar sua dívida, mas apagar seu dinheiro e seus jogos.',
        async () => {
            const btn = document.getElementById('loan-emergency-reset-btn');
            if (btn) btn.disabled = true;

            try {
                await window.FirebaseTransactions.resetUserProgressOnLoanMax(window.auth.currentUser.uid);
                await window.loadUserData(window.auth.currentUser.uid);
                selectedLoanGameIds.clear();
                renderLoanPage();
                window.updateNavBadges?.();
                window.showToast('Reset concluído. Você recomeçou do zero.', 'success');
            } catch (error) {
                window.showToast(error.message || 'Erro ao executar o reset.', 'error');
            } finally {
                if (btn) btn.disabled = false;
            }
        }
    );
}

document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.dataset.loanGameId === undefined) return;

    const gameId = String(target.dataset.loanGameId);
    if (target.checked) {
        selectedLoanGameIds.add(gameId);
    } else {
        selectedLoanGameIds.delete(gameId);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const loanForm = document.getElementById('loan-request-form');
    if (loanForm) loanForm.addEventListener('submit', handleLoanRequestSubmit);

    const paymentForm = document.getElementById('loan-payment-form');
    if (paymentForm) paymentForm.addEventListener('submit', handleLoanPaymentSubmit);

    const payGamesBtn = document.getElementById('loan-pay-games-btn');
    if (payGamesBtn) payGamesBtn.addEventListener('click', handleLoanGamesPayment);

    const emergencyBtn = document.getElementById('loan-emergency-reset-btn');
    if (emergencyBtn) emergencyBtn.addEventListener('click', handleEmergencyLoanReset);

    renderLoanPage();
});

window.renderLoanPage = renderLoanPage;
if (window.addPageRenderer) {
    window.addPageRenderer('emprestimo.html', window.renderLoanPage);
}
