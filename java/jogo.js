/**
 * Lógica específica para a página de detalhes do jogo.
 */

function renderGameDetails(games) {
    // Pega o ID da URL (ex: jogo.html?id=1)
    const params = new URLSearchParams(window.location.search);
    const gameId = parseInt(params.get('id'));
    
    // Busca o jogo garantindo que a comparação funcione mesmo se o ID no JSON for string ou número
    const game = games.find(g => String(g.id) === String(gameId));

    if (game) {
        // Preenche os elementos da página com os dados do JSON
        document.title = `GameHub - ${game.title}`;
        document.getElementById('game-title-detail').textContent = game.title;
        document.getElementById('game-image-detail').src = game.image;
        document.getElementById('game-tags-detail').textContent = game.tags.join(', ');

        // Preenche a descrição usando o campo já normalizado pelo global.js
        const descElement = document.getElementById('game-description-detail');
        if (descElement) descElement.textContent = game.description;
        
        const priceBox = document.getElementById('game-price-detail');
        if (game.discount > 0) {
            priceBox.innerHTML = `
                <span class="discount-badge">-${game.discount}%</span>
                <span class="old-price">${game.oldPrice}</span>
                <span class="current-price sale">${game.currentPrice}</span>
            `;
        } else {
            priceBox.innerHTML = `<span class="current-price">${game.currentPrice}</span>`;
        }

        // Configura o botão de compra/carrinho
        const buyBtn = document.querySelector('.buy-button');
        if (buyBtn) {
            buyBtn.onclick = (e) => {
                console.log('[JOGO] Botao clicado para gameId:', game.id);
                if (window.toggleCart) {
                    window.toggleCart(game.id);
                } else {
                    console.error('[JOGO] window.toggleCart nao disponivel');
                }
            };
            
            // Muda o texto se já estiver no carrinho ou biblioteca
            if (window.userLibrary && window.userLibrary.includes(game.id)) {
                buyBtn.textContent = "Na Biblioteca";
                buyBtn.style.background = "#2a2a2a";
                buyBtn.style.cursor = "default";
                buyBtn.disabled = true;
            } else if (window.userCart && window.userCart.includes(game.id)) {
                buyBtn.textContent = "Remover do Carrinho";
                buyBtn.style.background = "var(--accent)";
                buyBtn.disabled = false;
            } else {
                buyBtn.textContent = "Adicionar ao Carrinho";
                buyBtn.style.background = "var(--accent)";
                buyBtn.disabled = false;
            }
            
            console.log('[JOGO] Botao configurado:', { gameId: game.id, text: buyBtn.textContent });
        } else {
            console.warn('[JOGO] Botao .buy-button nao encontrado');
        }

        const platformsContainer = document.getElementById('game-platforms-detail');
        platformsContainer.innerHTML = game.platforms.map(icon => `<i class="${icon}"></i>`).join(' ');
    } else {
        // Se o jogo não for encontrado, exibe uma mensagem de erro
        const detailContainer = document.querySelector('.game-detail-container');
        if (detailContainer) {
            detailContainer.innerHTML = "<h2>Jogo não encontrado.</h2><p style='color: var(--secondary);'>Verifique o ID do jogo na URL.</p>";
        }
    }
}