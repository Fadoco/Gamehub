/**
 * Lógica específica para a página de detalhes do jogo.
 */

function renderGameDetails(games) {
    // Pega o ID da URL (ex: jogo.html?id=1)
    const params = new URLSearchParams(window.location.search);
    const gameId = parseInt(params.get('id'));

    const game = games.find(g => g.id === gameId);

    if (game) {
        // Preenche os elementos da página com os dados do JSON
        document.title = `GameHub - ${game.title}`;
        document.getElementById('game-title-detail').textContent = game.title;
        document.getElementById('game-image-detail').src = game.image;
        document.getElementById('game-tags-detail').textContent = game.tags.join(', ');
        
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
            buyBtn.onclick = () => window.toggleCart(game.id);
            
            // Muda o texto se já estiver no carrinho ou biblioteca
            if (window.userLibrary && window.userLibrary.includes(game.id)) {
                buyBtn.textContent = "Na Biblioteca";
                buyBtn.style.background = "var(--bg-header)";
                buyBtn.disabled = true;
            } else if (window.userCart && window.userCart.includes(game.id)) {
                buyBtn.textContent = "Remover do Carrinho";
            }
        }

        const platformsContainer = document.getElementById('game-platforms-detail');
        platformsContainer.innerHTML = game.platforms.map(icon => `<i class="${icon}"></i>`).join(' ');
    } else {
        // Se o jogo não for encontrado, exibe uma mensagem de erro
        const detailContainer = document.querySelector('.game-detail-container');
        if (detailContainer) {
            detailContainer.innerHTML = "<h2>Jogo não encontrado.</h2><p>Verifique o ID do jogo na URL.</p>";
        }
    }
}