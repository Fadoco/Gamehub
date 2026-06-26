/**
 * Lógica para exibir o histórico de compras e empréstimos.
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
        title: game.title,
        upgradeLevel,
        valuation: Number(valuation) || 0
    };
}

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

    list.innerHTML = gameItems.map((item) => `
        <div class="loan-game-item">
            <label>
                <input type="checkbox" data-loan-game-id="${item.gameId}" ${selectedLoanGameIds.has(item.gameId) ? 'checked' : ''}>
                <span>${item.title}${item.upgradeLevel > 0 ? ` ⭐${item.upgradeLevel}` : ''}</span>
            </label>
            <span class="loan-game-value">${formatCurrency(item.valuation)}</span>
        </div>
    `).join('');
}

function renderLoanPanel() {
    const debtElement = document.getElementById('loan-debt-amount');
    const walletElement = document.getElementById('loan-wallet-amount');
    const availableElement = document.getElementById('loan-daily-available');
    const rulesText = document.getElementById('loan-rules-text');
    const loanHistoryList = document.getElementById('loan-history-list');
    if (!debtElement || !walletElement || !loanHistoryList) return;

    const minAmount = window.FirebaseTransactions?.LOAN_MIN_AMOUNT ?? 50;
    const maxAmount = window.FirebaseTransactions?.LOAN_MAX_AMOUNT ?? 5000;
    const dailyLimit = window.FirebaseTransactions?.LOAN_DAILY_LIMIT ?? 5000;
    const borrowedToday = Number(window.userLoanBorrowedToday) || 0;
    const availableToday = Math.max(0, dailyLimit - borrowedToday);

    debtElement.textContent = formatCurrency(window.userLoanDebt || 0);
    walletElement.textContent = formatCurrency(window.userBalance || 0);
    if (availableElement) {
        availableElement.textContent = formatCurrency(availableToday);
    }

    if (rulesText) {
        rulesText.textContent = `Limite por pedido: ${formatCurrency(minAmount)} até ${formatCurrency(maxAmount)} | Limite diário: ${formatCurrency(dailyLimit)}.`;
    }

    const history = Array.isArray(window.userLoanHistory) ? window.userLoanHistory : [];
    if (!history.length) {
        loanHistoryList.innerHTML = '<p>Nenhuma movimentação de empréstimo ainda.</p>';
    } else {
        const orderedHistory = [...history].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        loanHistoryList.innerHTML = orderedHistory.map((entry) => {
            const typeMap = {
                loan_request: 'Empréstimo solicitado',
                loan_payment_money: 'Pagamento com dinheiro',
                loan_payment_games: 'Pagamento com jogos',
                loan_daily_expire: 'Expiração diária do empréstimo'
            };
            const label = typeMap[entry.type] || 'Movimentação';
            const value = entry.requestedAmount ?? entry.paidAmount ?? entry.expiredAmount ?? 0;
            return `
                <div class="loan-history-item">
                    <div><strong>${label}</strong> - ${formatCurrency(value)}</div>
                    <div>Dívida após movimentação: ${formatCurrency(entry.totalDebtAfter || 0)}</div>
                    <div>Data: ${new Date(entry.date).toLocaleString('pt-BR')}</div>
                </div>
            `;
        }).join('');
    }

    renderLoanGamesList();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;

    if (!window.userHistory || window.userHistory.length === 0) {
        list.innerHTML = "<p>Você ainda não realizou nenhuma compra.</p>";
        renderLoanPanel();
        return;
    }

    list.innerHTML = window.userHistory.map((order) => `
        <div class="history-card">
            <div class="history-header">
                <span><strong>Data:</strong> ${new Date(order.date).toLocaleDateString('pt-BR')}</span>
                <span class="history-total">R$ ${order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="history-items">
                <strong>Itens:</strong> ${order.items.join(', ')}
            </div>
        </div>
    `).join('');

    renderLoanPanel();
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
        renderLoanPanel();
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
        renderLoanPanel();
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
        renderHistory();
        window.showToast(`Dívida abatida em ${formatCurrency(result.paymentAmount)} usando jogos.`, 'success');
    } catch (error) {
        window.showToast(error.message || 'Erro ao pagar com jogos.', 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
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

    renderLoanPanel();
});

window.renderHistory = renderHistory;
