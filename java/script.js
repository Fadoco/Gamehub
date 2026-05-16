/**
 * Lógica para carregar jogos dinamicamente via JSON
 */

async function loadGames() {
    try {
        // Detecta se o arquivo está dentro de uma subpasta para ajustar o caminho do fetch
        const isSubfolder = window.location.pathname.includes('/html/');
        const jsonPath = isSubfolder ? '../json/games.json' : 'json/games.json';

        const response = await fetch(jsonPath);
        const games = await response.json();

        // Verifica em qual página estamos para decidir o que executar
        if (window.location.pathname.includes('jogo.html')) {
            renderGameDetails(games);
        } else {
            renderGames(games);
        }
    } catch (error) {
        console.error("Erro ao carregar o catálogo de jogos:", error);
    }
}

function renderGames(games) {
    const grid = document.querySelector('.game-grid');
    if (!grid) return;

    const isSubfolder = window.location.pathname.includes('/html/');
    const gamePagePath = isSubfolder ? 'jogo.html' : 'html/jogo.html';

    grid.innerHTML = ''; // Limpa o conteúdo estático inicial

    games.forEach(game => {
        // Gerar ícones de plataformas dinamicamente
        const platformsHtml = game.platforms.map(icon => `<i class="${icon}"></i>`).join('');
        
        // Lógica de exibição de preço e desconto
        const hasDiscount = game.discount > 0;
        const discountBadge = hasDiscount ? `<span class="discount-percent">-${game.discount}%</span>` : '';
        const oldPriceHtml = hasDiscount ? `<span class="old-price">${game.oldPrice}</span>` : '';
        const priceClass = hasDiscount ? 'game-price sale' : 'game-price';

        grid.innerHTML += `
            <a href="${gamePagePath}?id=${game.id}" class="game-card-link" style="text-decoration: none; color: inherit;">
                <article class="game-card">
                <div class="card-media">
                    ${discountBadge}
                    <img src="${game.image}" alt="${game.title}">
                </div>
                <div class="game-info">
                    <div class="game-details">
                        <p class="game-title">${game.title}</p>
                        <div class="game-platforms">${platformsHtml}</div>
                        <span class="game-tags">${game.tags.join(', ')}</span>
                    </div>
                    <div class="price-container">
                        <div class="price-box">${oldPriceHtml}<p class="${priceClass}">${game.currentPrice}</p></div>
                    </div>
                </div>
                </article>
            </a>`;
    });
}

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

        const platformsContainer = document.getElementById('game-platforms-detail');
        platformsContainer.innerHTML = game.platforms.map(icon => `<i class="${icon}"></i>`).join(' ');
    } else {
        document.querySelector('.game-detail-container').innerHTML = "<h2>Jogo não encontrado.</h2>";
    }
}

document.addEventListener('DOMContentLoaded', loadGames);