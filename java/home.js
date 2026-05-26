/**
 * Lógica de renderização da Home Premium
 */

function renderGames(games) {
    if (!games || games.length === 0) return;

    // 1. Configurar Hero (Destaques)
    const featured = games.filter(g => g.featured).slice(0, 5);
    setupHero(featured);

    // 2. Configurar Promoções (Jogos com desconto)
    const discounted = games.filter(g => g.discount > 0).slice(0, 6);
    const promoContainer = document.getElementById('promo-cards-container');
    if (promoContainer) {
        promoContainer.innerHTML = discounted.map(game => `
            <article class="promo-card" onclick="window.location.href='html/jogo.html?id=${game.id}'">
                <img src="${game.image}" class="promo-card__thumb" style="object-fit: cover;">
                <div class="promo-card__meta">
                    <strong>${game.title}</strong>
                    <span class="tag">-${game.discount}%</span>
                    <div class="price-row">
                        <span class="old-price">${game.oldPrice}</span>
                        <strong>${game.currentPrice}</strong>
                    </div>
                </div>
            </article>
        `).join('');
    }

    // 3. Configurar Listas (Charts)
    renderChartList('chart-best-sellers', games.slice(10, 15));
    renderChartList('chart-free-games', games.filter(g => window.utils.parsePrice(g.currentPrice) === 0).slice(0, 5), true);
    renderChartList('chart-new-releases', games.slice(0, 5));
}

function setupHero(featuredGames) {
    const navList = document.getElementById('hero-nav-list');
    if (!navList || featuredGames.length === 0) return;

    // Renderiza lista lateral
    navList.innerHTML = featuredGames.map((game, index) => `
        <div class="hero-list__item ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="${game.image}" class="thumb" style="width: 50px; height: 65px; object-fit: cover; border-radius: 8px;">
            <div>
                <span>${game.title}</span>
                <small>${game.tags[0]}</small>
            </div>
        </div>
    `).join('');

    // Função para atualizar o card principal
    const updateMainCard = (game) => {
        document.getElementById('hero-title').textContent = game.title;
        document.getElementById('hero-description').textContent = game.Description;
        document.getElementById('hero-current-price').textContent = game.currentPrice;
        document.getElementById('hero-old-price').textContent = game.oldPrice || "";
        document.getElementById('hero-discount').textContent = `-${game.discount}%`;
        document.getElementById('hero-discount').style.display = game.discount > 0 ? 'block' : 'none';
        document.getElementById('hero-main-card').style.backgroundImage = `linear-gradient(180deg, rgba(4, 12, 26, 0.25), rgba(2, 6, 14, 0.95)), url('${game.image}')`;
        document.getElementById('hero-main-card').style.backgroundSize = 'cover';
        document.getElementById('hero-main-card').style.backgroundPosition = 'center';
        
        document.getElementById('hero-buy-btn').onclick = () => window.location.href = `html/jogo.html?id=${game.id}`;
        document.getElementById('hero-cart-btn').onclick = () => window.toggleCart(game.id);
    };

    // Inicializa primeiro jogo
    updateMainCard(featuredGames[0]);

    // Evento de clique na navegação lateral
    document.querySelectorAll('.hero-list__item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.hero-list__item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            updateMainCard(featuredGames[this.dataset.index]);
        });
    });
}

function renderChartList(elementId, games, isFree = false) {
    const container = document.getElementById(elementId);
    if (!container) return;

    container.innerHTML = games.map(game => `
        <li onclick="window.location.href='html/jogo.html?id=${game.id}'" style="cursor:pointer">
            <img src="${game.image}" class="chart-thumb" style="object-fit: cover;">
            <div>
                <strong>${game.title}</strong>
                ${game.discount > 0 ? `<span class="tag">-${game.discount}%</span>` : 
                  (isFree ? '<span class="status">Gratuito</span>' : '')}
            </div>
            ${!isFree ? `<span class="price">${game.currentPrice}</span>` : ''}
        </li>
    `).join('');
}

// Atualiza o badge do carrinho no header
window.addEventListener('load', () => {
    const badge = document.getElementById('cart-count-badge');
    if (badge) {
        const count = window.userCart ? window.userCart.length : 0;
        badge.textContent = count > 0 ? `(${count})` : "";
    }
});