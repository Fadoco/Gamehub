/**
 * Lógica específica para a página inicial (renderização da grid de jogos).
 */

function renderGames(games) {
    const storeSections = document.getElementById('store-sections');
    if (!storeSections) return;
    storeSections.innerHTML = ''; // Limpa o "Carregando..."

    // 1. Criar Seção de Destaques (Sempre no topo)
    const featured = games.filter(g => g.featured);
    if (featured.length > 0) {
        createSection("Jogos em Destaque", featured, storeSections);
    }

    // 2. Sistema Totalmente Automático: Extrai todas as tags únicas do catálogo
    const allTags = games.flatMap(game => game.tags);
    const uniqueCategories = [...new Set(allTags)].sort();

    uniqueCategories.forEach(category => {
        const filtered = games.filter(g => g.tags.includes(category));
        // Criamos seções apenas para categorias que tenham pelo menos 2 jogos (opcional)
        if (filtered.length >= 1) {
            createSection(`Jogos de ${category}`, filtered, storeSections);
        }
    });
}

/**
 * Cria dinamicamente o HTML de uma seção (Título + Grid)
 */
function createSection(title, games, parentContainer) {
    const section = document.createElement('section');
    section.className = 'store-section';
    section.style.marginTop = '40px';
    
    section.innerHTML = `
        <h2>${title}</h2>
        <div class="game-grid"></div>
        <div class="section-footer" style="text-align: center; margin-top: 20px;"></div>
    `;
    
    parentContainer.appendChild(section);
    const grid = section.querySelector('.game-grid');
    const footer = section.querySelector('.section-footer');
    
    setupPagination(games, grid, footer);
}

/**
 * Controla a exibição em lotes de 10 jogos
 */
function setupPagination(games, grid, footer) {
    let displayedCount = 0;
    const limit = 10;
    footer.innerHTML = '';

    const showNextBatch = () => {
        const batch = games.slice(displayedCount, displayedCount + limit);
        renderToContainer(batch, grid, displayedCount === 0);
        displayedCount += batch.length;

        if (displayedCount >= games.length) {
            footer.innerHTML = '';
        } else {
            footer.innerHTML = `<button class="btn-see-more">Ver Mais</button>`;
            footer.querySelector('.btn-see-more').onclick = showNextBatch;
        }
    };
    showNextBatch();
}

function renderToContainer(games, container, clear = true) {
    if (!container) return;
    
    const isSubfolder = window.location.pathname.includes('/html/');
    const gamePagePath = isSubfolder ? 'jogo.html' : 'html/jogo.html';

    if (clear) container.innerHTML = ''; 
    if (games.length === 0) {
        container.innerHTML = '<p>Nenhum jogo encontrado nesta seção.</p>';
        return;
    }

    games.forEach(game => {
        // Gerar ícones de plataformas dinamicamente
        const platformsHtml = game.platforms.map(icon => `<i class="${icon}"></i>`).join('');
        
        // Lógica de exibição de preço e desconto
        const hasDiscount = game.discount > 0;
        const discountBadge = hasDiscount ? `<span class="discount-percent">-${game.discount}%</span>` : '';
        const oldPriceHtml = hasDiscount ? `<span class="old-price">${game.oldPrice}</span>` : '';
        const priceClass = hasDiscount ? 'game-price sale' : 'game-price';

        const isFavorite = window.userFavorites && window.userFavorites.includes(game.id);
        const favIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';

        container.innerHTML += `
            <a href="${gamePagePath}?id=${game.id}" class="game-card-link" style="text-decoration: none; color: inherit;">
                <article class="game-card">
                <div class="card-media">
                    ${discountBadge}
                    <img src="${game.image}" alt="${game.title}">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(event, ${game.id})">
                        <i class="${favIcon}"></i>
                    </button>
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

function createFooter(parent) {
    let footer = parent.querySelector('.section-footer');
    if (!footer) {
        footer = document.createElement('div');
        footer.className = 'section-footer';
        parent.appendChild(footer);
    }
    return footer;
}