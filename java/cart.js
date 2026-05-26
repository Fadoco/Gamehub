/**
 * Lógica para exibir e gerenciar o carrinho de compras.
 */

function renderCart() {
    const grid = document.getElementById('cart-grid');
    const summary = document.getElementById('cart-summary');
    const emptyMsg = document.getElementById('cart-empty');
    
    if (!grid || !allGamesData || allGamesData.length === 0) return;

    // Filtra garantindo que a comparação de ID ignore se é string ou número
    const cartGames = allGamesData.filter(game => window.userCart.some(cartId => String(cartId) === String(game.id)));

    if (cartGames.length === 0) {
        grid.innerHTML = '';
        summary.style.display = 'none';
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
        summary.style.display = 'block';
        
        // Renderização customizada para o carrinho (Formato de Lista)
        grid.innerHTML = cartGames.map(game => `
            <div class="cart-item">
                <img src="${game.image}" alt="${game.title}">
                <div class="item-details">
                    <h3>${game.title}</h3>
                    <p class="item-tags">${game.tags.join(' • ')}</p>
                </div>
                <div class="item-price-actions">
                    <span class="item-price">${game.currentPrice}</span>
                    <button class="btn-remove" onclick="toggleCart(${game.id})" title="Remover item">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');

        calculateTotal(cartGames);
    }
}

function calculateTotal(cartGames) {
    const totalElement = document.getElementById('cart-total');
    if (!totalElement) return;

    const total = cartGames.reduce((acc, game) => {
        const price = utils.parsePrice(game.currentPrice);
        return acc + price;
    }, 0);

    totalElement.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Mostra o saldo atual do usuário no resumo para ele saber quanto tem
    const walletInSummary = document.getElementById('cart-wallet-balance');
    if (walletInSummary) {
        walletInSummary.textContent = `R$ ${window.userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
}