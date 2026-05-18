/**
 * Lógica para exibir e gerenciar o carrinho de compras.
 */

function renderCart() {
    const grid = document.getElementById('cart-grid');
    const summary = document.getElementById('cart-summary');
    const emptyMsg = document.getElementById('cart-empty');
    
    if (!grid || !allGamesData.length) return;

    const cartGames = allGamesData.filter(game => window.userCart.includes(game.id));

    if (cartGames.length === 0) {
        grid.innerHTML = '';
        summary.style.display = 'none';
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
        summary.style.display = 'block';
        if (typeof renderToContainer === 'function') {
            renderToContainer(cartGames, grid, true);
        }
        calculateTotal(cartGames);
    }
}

function calculateTotal(cartGames) {
    const totalElement = document.getElementById('cart-total');
    if (!totalElement) return;

    const total = cartGames.reduce((acc, game) => {
        // Converte "R$ 99,90" ou "Grátis" para número puro
        const priceStr = game.currentPrice.replace('R$', '').replace('Grátis', '0').replace(',', '.').trim();
        const price = parseFloat(priceStr) || 0;
        return acc + price;
    }, 0);

    totalElement.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const checkData = setInterval(() => {
        if (allGamesData.length > 0) {
            renderCart();
            clearInterval(checkData);
        }
    }, 100);
});