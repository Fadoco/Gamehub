/**
 * Lógica para exibir e gerenciar o carrinho de compras - Estilo Steam
 */

function renderCart() {
    const wrapper = document.getElementById('cart-wrapper');
    
    if (!wrapper || !window.allGamesData || window.allGamesData.length === 0) {
        return;
    }

    // Filtra garantindo que a comparação de ID ignore se é string ou número
    const cartGames = window.allGamesData.filter(game => 
        window.userCart && window.userCart.some(cartId => String(cartId) === String(game.id))
    );

    if (cartGames.length === 0) {
        wrapper.innerHTML = '<div style="text-align: center; padding: 60px 20px;"><i class="fas fa-shopping-cart" style="font-size: 48px; opacity: 0.3; margin-bottom: 20px; display: block;"></i><h2 style="opacity: 0.5;">Seu Carrinho esta vazio</h2><p style="opacity: 0.4; margin: 10px 0;">Comece a adicionar jogos</p></div>';
        return;
    }

    // Calcular total
    const total = cartGames.reduce((sum, game) => sum + window.utils.parsePrice(game.currentPrice), 0);
    const walletDisplay = (window.userBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const totalDisplay = total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const canAfford = window.userBalance >= total;
    const afterPurchase = window.userBalance - total;

    // Renderizar itens
    let itemsHtml = '';
    for (const game of cartGames) {
        itemsHtml += `
            <div style="display: grid; grid-template-columns: 60px 1fr auto auto; gap: 15px; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <img src="${game.image}" alt="${game.title}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 4px;">
                <div>
                    <h4 style="margin: 0 0 4px 0; color: #fff; font-size: 0.95rem;">${game.title}</h4>
                    <p style="margin: 0; font-size: 0.8rem; opacity: 0.6;">${game.tags.slice(0, 2).join(' • ')}</p>
                </div>
                <span style="font-weight: 600; color: var(--accent); min-width: 80px; text-align: right;">${game.currentPrice}</span>
                <button onclick="window.toggleCart(${game.id})" style="background: none; border: none; color: #666; cursor: pointer; font-size: 18px; padding: 8px; border-radius: 4px;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    }

    wrapper.innerHTML = `
        <div style="margin-top: 20px;">
            <div style="margin-bottom: 30px;">${itemsHtml}</div>
            
            <div style="background: rgba(0, 212, 255, 0.05); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 8px; padding: 20px;">
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; opacity: 0.7;">
                        <span>Subtotal:</span>
                        <span>R$ ${totalDisplay}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; opacity: 0.7;">
                        <span>Taxa:</span>
                        <span>R$ 0,00</span>
                    </div>
                    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px; display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 700;">
                        <span>TOTAL:</span>
                        <span style="color: var(--accent);">R$ ${totalDisplay}</span>
                    </div>
                </div>
                
                <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 4px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 4px;">
                        <span style="opacity: 0.7;">Seu Saldo:</span>
                        <span style="color: #4ade80; font-weight: 600;">R$ ${walletDisplay}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                        <span style="opacity: 0.7;">Apos Compra:</span>
                        <span style="color: ${canAfford ? '#4ade80' : '#ef4444'}; font-weight: 600;">R$ ${canAfford ? afterPurchase.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</span>
                    </div>
                </div>
                
                <button onclick="window.purchaseLibrary()" style="width: 100%; padding: 14px; font-size: 1rem; font-weight: 700; border: none; border-radius: 6px; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; background: ${canAfford ? 'linear-gradient(135deg, var(--accent), #00a8cc)' : '#2a2a2a'}; color: ${canAfford ? '#000' : '#666'}; margin-bottom: 10px;" ${canAfford ? '' : 'disabled'}>
                    FINALIZAR COMPRA
                </button>
            </div>
        </div>
    `;
}

/**
 * Inicializar o carrinho quando a página carrega
 */
function initCart() {
    if (!window.allGamesData || window.allGamesData.length === 0) {
        setTimeout(initCart, 500);
        return;
    }
    
    renderCart();
}

// Executa na inicializacao da pagina
document.addEventListener('DOMContentLoaded', initCart);

// Tambem reage ao evento de dados carregados
window.addEventListener('gamesDataLoaded', () => {
    if (window.location.pathname.includes('carrinho')) {
        renderCart();
    }
});

// Atualizacao quando auth muda
if (window.auth) {
    window.auth.onAuthStateChanged(() => {
        if (window.location.pathname.includes('carrinho')) {
            setTimeout(renderCart, 100);
        }
    });
}

// Fallback no load
window.addEventListener('load', () => {
    setTimeout(renderCart, 300);
});