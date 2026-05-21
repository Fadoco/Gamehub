/**
 * Lógica para exibir e gerenciar o carrinho de compras.
 */

function renderCart() {
    const elements = {
        grid: document.getElementById('cart-grid'),
        summary: document.getElementById('cart-summary'),
        emptyMsg: document.getElementById('cart-empty'),
        total: document.getElementById('cart-total'),
        wallet: document.getElementById('cart-wallet-balance')
    };
    
    if (!elements.grid || !window.allGamesData || !window.allGamesData.length) return;

    // Filtra jogos no carrinho com segurança de tipos
    const cartGames = window.allGamesData.filter(game => 
        window.userCart && window.userCart.some(cartId => String(cartId) === String(game.id))
    );

    if (cartGames.length === 0) {
        elements.grid.innerHTML = '';
        if (elements.summary) elements.summary.style.display = 'none';
        if (elements.emptyMsg) elements.emptyMsg.style.display = 'block';
    } else {
        if (elements.emptyMsg) elements.emptyMsg.style.display = 'none';
        if (elements.summary) elements.summary.style.display = 'block';
        
        elements.grid.innerHTML = cartGames.map(game => `
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

        calculateTotal(cartGames, elements);
    }
}

function calculateTotal(cartGames, elements) {
    const total = cartGames.reduce((acc, game) => {
        const price = window.utils.parsePrice(game.currentPrice);
        return acc + price;
    }, 0);

    if (elements.total) {
        elements.total.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    if (elements.wallet) {
        elements.wallet.textContent = `R$ ${window.userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
}