/**
 * Lógica de renderização da Home Premium
 */
 
window.renderGames = function(games) {
    if (!games || games.length === 0) return;

    // 1. Configurar Hero (Destaques)
    const featured = games.filter(g => g.featured).slice(0, 5);
    setupHero(featured);

    // 1.1. Categorias Populares (Navegação Visual)
    const categories = ["Ação", "RPG", "Mundo Aberto", "Tiro", "Estratégia", "Terror"];
    const catGrid = document.getElementById('categories-grid');
    if (catGrid) {
        renderCategories(categories, catGrid);
    }

    // 1.2. Banner de Destaque Secundário (Formato Largo)
    const bannerGames = games.filter(g => !g.featured && g.discount > 0).slice(0, 2);
    const bannerGrid = document.getElementById('banners-grid');
    if (bannerGrid) {
        renderBanners(bannerGames, bannerGrid);
    }

    // 2. Configurar Promoções (Jogos com desconto)
    const discounted = games.filter(g => g.discount > 0).slice(0, 6);
    const promoContainer = document.getElementById('promo-cards-container');
    if (promoContainer) {
        promoContainer.innerHTML = discounted.map(game => `
            <article class="promo-card" onclick="window.location.href='${window.utils.getHtmlPath(`jogo.html?id=${game.id}`)}'">
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

    // 4. Nova Seção: Posters (Destaques Verticais)
    const posters = games.filter(g => g.featured).slice(0, 4);
    const posterGrid = document.getElementById('poster-section-grid');
    if (posterGrid) {
        renderPosters(posters, posterGrid);
    }

    // 5. Novidades
    const newArrivals = [...games].sort((a, b) => b.id - a.id).slice(0, 12); // Top 12 mais novos
    const newArrivalsGrid = document.getElementById('new-arrivals-grid');
    if (newArrivalsGrid) {
        window.renderToContainer(newArrivals, newArrivalsGrid);
    }

    // 6. Mais Populares
    // Em um sistema real, isso viria de dados de popularidade (vendas, visualizações, etc.)
    const mostPopular = [...games].sort(() => 0.5 - Math.random()).slice(0, 12); // Exemplo: 12 jogos aleatórios
    const mostPopularGrid = document.getElementById('most-popular-grid');
    if (mostPopularGrid) {
        window.renderToContainer(mostPopular, mostPopularGrid);
    }
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
        document.getElementById('hero-description').textContent = game.description;
        document.getElementById('hero-current-price').textContent = game.currentPrice;
        document.getElementById('hero-old-price').textContent = game.oldPrice || "";
        document.getElementById('hero-discount').textContent = `-${game.discount}%`;
        document.getElementById('hero-discount').style.display = game.discount > 0 ? 'block' : 'none';
        document.getElementById('hero-main-card').style.backgroundImage = `linear-gradient(180deg, rgba(4, 12, 26, 0.25), rgba(2, 6, 14, 0.95)), url('${game.image}')`;
        document.getElementById('hero-main-card').style.backgroundSize = 'cover';
        document.getElementById('hero-main-card').style.backgroundPosition = 'center';
        
        document.getElementById('hero-buy-btn').onclick = () => window.location.href = window.utils.getHtmlPath(`jogo.html?id=${game.id}`);
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

function renderCategories(categories, container) {
    container.innerHTML = categories.map(cat => `
        <div class="category-pill" onclick="window.location.href='${window.utils.getHtmlPath(`busca.html?q=${cat}`)}'">
            <i class="fas fa-tag"></i>
            <span>${cat}</span>
        </div>
    `).join('');
}

function renderPosters(games, container) {
    container.innerHTML = games.map(game => `
        <div class="poster-card" onclick="window.location.href='${window.utils.getHtmlPath(`jogo.html?id=${game.id}`)}'">
            <img src="${game.image}" alt="${game.title}">
            <div class="poster-card__info">
                <span class="eyebrow" style="color: var(--accent); font-size: 0.7rem; font-weight: bold;">DESTAQUE DA TEMPORADA</span>
                <h3 style="margin: 5px 0; font-size: 1.2rem;">${game.title}</h3>
                <p style="font-size: 0.8rem; color: #ccc; margin-bottom: 10px;">${(game.description || "").substring(0, 60)}...</p>
                <button class="btn btn-primary" style="padding: 6px 15px; font-size: 0.8rem;">Ver Detalhes</button>
            </div>
        </div>
    `).join('');
}

function renderChartList(elementId, games, isFree = false) {
    const container = document.getElementById(elementId);
    if (!container) return;

    container.innerHTML = games.map(game => `
        <li onclick="window.location.href='${window.utils.getHtmlPath(`jogo.html?id=${game.id}`)}'" style="cursor:pointer">
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

// Garante que a loja renderize se os dados chegarem antes do script terminar de carregar
if (window.allGamesData && window.allGamesData.length > 0) {
    window.renderGames(window.allGamesData);
}