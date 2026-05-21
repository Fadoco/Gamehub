/**
 * Lógica específica para a página de detalhes do jogo.
 */

function renderGameDetails(games) {
    // Centralizando o acesso aos elementos DOM para melhor performance e legibilidade
    const elements = {
        title: document.getElementById('game-title-detail'),
        image: document.getElementById('game-image-detail'),
        tags: document.getElementById('game-tags-detail'),
        description: document.getElementById('game-description-detail'),
        priceBox: document.getElementById('game-price-detail'),
        buyBtn: document.querySelector('.buy-button'),
        platformsContainer: document.getElementById('game-platforms-detail'),
        detailContainer: document.querySelector('.game-detail-container')
    };

    // Pega o ID da URL (ex: jogo.html?id=1)
    const params = new URLSearchParams(window.location.search);
    const gameId = parseInt(params.get('id'));
    
    // Busca o jogo garantindo que a comparação funcione mesmo se o ID no JSON for string ou número
    const game = games.find(g => String(g.id) === String(gameId));

    if (game) {
        // Fallback para imagem caso o game.image seja nulo ou quebrado
        const placeholder = window.IS_SUBFOLDER ? '../img/placeholder.png' : 'img/placeholder.png';
        const gameImgSrc = game.image || placeholder;

        // Preenche os elementos da página com os dados do JSON
        if (elements.title) {
            document.title = `GameHub - ${game.title}`;
            elements.title.textContent = game.title;
        }
        if (elements.image) {
            elements.image.src = gameImgSrc;
            elements.image.onerror = function() { this.src = placeholder; this.onerror = null; };
        }
        if (elements.tags) elements.tags.textContent = (game.tags || []).join(', ');

        // Preenche a descrição usando o campo já normalizado pelo global.js
        if (elements.description) elements.description.textContent = game.description;
        
        if (elements.priceBox) {
            if (game.discount > 0) {
                elements.priceBox.innerHTML = `
                    <span class="discount-badge">-${game.discount}%</span>
                    <span class="old-price">${game.oldPrice}</span>
                    <span class="current-price sale">${game.currentPrice}</span>
                `;
            } else {
                elements.priceBox.innerHTML = `<span class="current-price">${game.currentPrice}</span>`;
            }
        }

        // Configura o botão de compra/carrinho
        if (elements.buyBtn) {
            elements.buyBtn.onclick = () => window.toggleCart(game.id);
            
            // Muda o texto se já estiver no carrinho ou biblioteca
            if (window.userLibrary && window.userLibrary.includes(game.id)) {
                elements.buyBtn.textContent = "Na Biblioteca";
                elements.buyBtn.style.background = "#27ae60"; // Verde para indicar posse
                elements.buyBtn.style.cursor = "default";
                elements.buyBtn.disabled = true;
            } else if (window.userCart && window.userCart.includes(game.id)) {
                elements.buyBtn.textContent = "Remover do Carrinho";
                elements.buyBtn.style.background = "var(--accent)";
                elements.buyBtn.disabled = false;
            } else {
                elements.buyBtn.textContent = "Adicionar ao Carrinho";
                elements.buyBtn.style.background = "var(--accent)";
                elements.buyBtn.disabled = false;
            }
        }

        if (elements.platformsContainer) {
            elements.platformsContainer.innerHTML = (game.platforms || []).map(icon => `<i class="${icon}"></i>`).join('');
        }
    } else {
        // Se o jogo não for encontrado, exibe uma mensagem de erro
        if (elements.detailContainer) {
            elements.detailContainer.innerHTML = "<h2>Jogo não encontrado.</h2><p style='color: var(--secondary);'>Verifique o ID do jogo na URL.</p>";
        }
    }
}