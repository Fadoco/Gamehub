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

    // 2. Sistema Automático Otimizado: Conta frequências de tags em uma única passagem
    const tagCounts = {};
    games.forEach(game => {
        if (game.tags) {
            game.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });

    // Filtra categorias populares (mínimo 3 jogos) e ordena pela contagem
    const filteredCategories = Object.entries(tagCounts)
        .filter(([name, count]) => count >= 3)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    // Executa a criação de cada seção baseada nas categorias filtradas
    filteredCategories.forEach(cat => {
        const filtered = games.filter(g => g.tags.includes(cat.name));
        createSection(`Jogos de ${cat.name}`, filtered, storeSections);
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
    
    window.setupPagination(games, grid, footer);
}

/**
 * Controla a exibição em lotes de 10 jogos
 */
window.setupPagination = (games, grid, footer) => {
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