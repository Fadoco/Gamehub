/**
 * Lógica global para carregar dados e inicializar funcionalidades comuns.
 */

window.allGamesData = []; // Armazenar os dados dos jogos globalmente para acesso por outros scripts

// Detecta uma única vez se estamos em uma subpasta
window.IS_SUBFOLDER = window.location.pathname.includes('/html/') || window.location.pathname.includes('/Roleta/');

// Utilitários Globais
window.utils = {
    // Converte preços como "R$ 99,90" ou "Grátis" para números (float)
    parsePrice: (priceStr) => {
        if (!priceStr) return 0;
        const cleaned = String(priceStr).replace('R$', '').replace('Grátis', '0').replace(',', '.').trim();
        return parseFloat(cleaned) || 0;
    },
    // Retorna o nome de exibição ou o prefixo do email
    getUserFriendlyName: (user) => {
        if (!user) return 'Usuário';
        return user.displayName || (user.email ? user.email.split('@')[0] : 'Usuário');
    },
    getPath: (file) => {
        if (!window.IS_SUBFOLDER) return file.includes('html/') || file.includes('Roleta/') ? file : `html/${file}`;
        return file.replace('html/', '').replace('../', '');
    }
};

/**
 * Renderiza uma lista de jogos em um container HTML.
 * Esta função é compartilhada entre home.js, library.js e busca.js.
 */
window.renderToContainer = (games, container, clear = true) => {
    if (!container) return;

    const IS_SUBFOLDER = window.IS_SUBFOLDER;
    let gamePagePath = 'html/jogo.html';
    if (IS_SUBFOLDER) {
        if (window.location.pathname.includes('/html/')) {
            gamePagePath = 'jogo.html';
        } else {
            gamePagePath = '../html/jogo.html';
        }
    }

    const html = games.map(game => {
        // Gerar ícones de plataformas dinamicamente
        const platformsHtml = game.platforms.map(icon => `<i class="${icon}"></i>`).join('');
        
        // Lógica de exibição de preço e desconto
        const hasDiscount = game.discount > 0;
        const discountBadge = hasDiscount ? `<span class="discount-percent">-${game.discount}%</span>` : '';
        const oldPriceHtml = hasDiscount ? `<span class="old-price">${game.oldPrice}</span>` : '';
        const priceClass = hasDiscount ? 'game-price sale' : 'game-price';

        const isFavorite = window.userFavorites && window.userFavorites.includes(game.id);
        const favIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';

        // Lógica de Rank/Upgrade
        const upgradeLevel = (window.userUpgrades && window.userUpgrades[game.id]) || 0;
        let upgradeHtml = '';
        if (upgradeLevel > 0) {
            const rankClass = upgradeLevel === 1 ? 'rank-rare' : (upgradeLevel === 2 ? 'rank-epic' : 'rank-legendary');
            const pluses = '+'.repeat(upgradeLevel);
            upgradeHtml = `<span class="upgrade-rank ${rankClass}">${pluses}</span>`;
        }

        return `
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
                        <p class="game-title">${game.title}${upgradeHtml}</p>
                        <div class="game-platforms">${platformsHtml}</div>
                        <span class="game-tags">${game.tags.join(', ')}</span>
                    </div>
                    <div class="price-container">
                        <div class="price-box">${oldPriceHtml}<p class="${priceClass}">${game.currentPrice}</p></div>
                    </div>
                </div>
                </article>
            </a>`;
    }).join('');

    if (clear) {
        container.innerHTML = html || '<p>Nenhum jogo encontrado nesta seção.</p>';
    } else {
        container.insertAdjacentHTML('beforeend', html);
    }
};

async function fetchGamesData() {
    try {
        const IS_SUBFOLDER = window.IS_SUBFOLDER;
        if (window.db) {
            const snapshot = await window.db.collection('games').get();
            if (!snapshot.empty) {
                window.allGamesData = snapshot.docs.map(doc => ({
                    firestoreId: doc.id,
                    ...doc.data()
                }));
                console.log("Dados carregados via Firestore");
            }
        }

        // Se o Firestore estiver vazio ou falhar, usa o fallback JSON
        if (window.allGamesData.length === 0) {
            const jsonPath = IS_SUBFOLDER ? '../json/games.json' : 'json/games.json';
            const response = await fetch(jsonPath);
            window.allGamesData = await response.json();
        }

        // Normalização dos dados para resolver problemas de caminhos e nomes de campos (case-sensitive)
        window.allGamesData = window.allGamesData.map(game => { 
            // 1. Resolve inconsistência: aceita 'image' ou 'Image' do JSON
            let imgPath = game.image || game.Image;
            
            // 2. Ajusta caminhos de imagens locais para subpastas (ex: de 'img/...' para '../img/...')
            if (imgPath && !imgPath.startsWith('http') && IS_SUBFOLDER && !imgPath.startsWith('../')) {
                imgPath = '../' + imgPath;
            }

            return {
                ...game,
                image: imgPath,
                // Padroniza também a descrição para facilitar o uso nos outros scripts
                description: game.description || game.Description
            };
        });

        routePageRendering();

    } catch (error) {
        console.error("Erro ao carregar o catálogo de jogos:", error);
    }
}

/**
 * Decide qual função de renderização chamar com base na página atual
 */
function routePageRendering() {
    const path = window.location.pathname.toLowerCase();
    
    const routes = [
        { file: 'jogo.html', func: typeof renderGameDetails === 'function' ? renderGameDetails : null, args: [window.allGamesData] },
        { file: 'busca.html', func: typeof renderSearchResults === 'function' ? renderSearchResults : null, args: [window.allGamesData] },
        { file: 'carrinho.html', func: typeof renderCart === 'function' ? renderCart : null },
        { file: 'biblioteca.html', func: typeof renderLibrary === 'function' ? renderLibrary : null },
        { file: 'historico.html', func: typeof renderHistory === 'function' ? renderHistory : null },
        { file: 'perfil.html', func: typeof renderProfile === 'function' ? renderProfile : null },
        { file: 'roleta.html', func: typeof renderRoulette === 'function' ? renderRoulette : null }
    ];

    const activeRoute = routes.find(r => path.includes(r.file));

    // Só executa renderização se allGamesData foi carregado
    if (!window.allGamesData || window.allGamesData.length === 0) {
        console.warn("Dados dos jogos ainda não foram carregados. Renderização adiada.");
        return;
    }

    if (activeRoute) {
        if (activeRoute.func) activeRoute.func(...(activeRoute.args || []));
        else console.warn(`Função de renderização para ${activeRoute.file} não encontrada.`);
    } else if (typeof renderGames === 'function') {
        renderGames(window.allGamesData);
    }
}

// Atalho global para forçar atualização da UI
window.refreshUI = routePageRendering;

/**
 * Inicializa o botão "Voltar ao Topo" globalmente
 */
function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    });

    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchGamesData();
    initBackToTop();
});