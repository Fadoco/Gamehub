/**
 * Lógica global para carregar dados e inicializar funcionalidades comuns.
 */

let allGamesData = []; // Armazenar os dados dos jogos globalmente para acesso por outros scripts

// Detecta uma única vez se estamos em uma subpasta
window.IS_SUBFOLDER = window.location.pathname.includes('/html/');
const IS_SUBFOLDER = window.IS_SUBFOLDER;

// Utilitários Globais
window.utils = {
    // Converte preços como "R$ 99,90" ou "Grátis" para números (float)
    parsePrice: (priceStr) => {
        if (typeof priceStr === 'number') return priceStr;
        if (!priceStr || String(priceStr).toLowerCase().includes('grátis')) return 0;
        
        const cleaned = String(priceStr)
            .replace(/[^\d,.-]/g, '') // Remove tudo exceto números, pontos, vírgulas e hifens
            .replace(',', '.');       // Padroniza decimal para ponto
        return parseFloat(cleaned) || 0;
    },
    // Retorna o nome de exibição ou o prefixo do email
    getUserFriendlyName: (user) => {
        if (!user) return 'Usuário';
        return user.displayName || (user.email ? user.email.split('@')[0] : 'Usuário');
    }
};

/**
 * Renderiza uma lista de jogos em um container HTML.
 * Esta função é compartilhada entre home.js, library.js e busca.js.
 */
window.renderToContainer = (games, container, clear = true) => {
    if (!container) return;

    const gamePagePath = IS_SUBFOLDER ? 'jogo.html' : 'html/jogo.html';

    const html = games.map(game => {
        // Fallbacks para garantir que o site não quebre se houver dados faltando no banco
        const platforms = game.platforms || [];
        const tags = game.tags || [];
        const gameImg = game.image || (IS_SUBFOLDER ? '../img/placeholder.png' : 'img/placeholder.png');

        // Gerar ícones de plataformas dinamicamente
        const platformsHtml = platforms.map(icon => `<i class="${icon}"></i>`).join('');
        
        // Lógica de exibição de preço e desconto
        const hasDiscount = game.discount > 0;
        const discountBadge = hasDiscount ? `<span class="discount-percent">-${game.discount}%</span>` : '';
        const oldPriceHtml = hasDiscount ? `<span class="old-price">${game.oldPrice}</span>` : '';
        const priceClass = hasDiscount ? 'game-price sale' : 'game-price';

        const isFavorite = window.userFavorites && window.userFavorites.includes(game.id);
        const favIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';

        return `
            <a href="${gamePagePath}?id=${game.id}" class="game-card-link" style="text-decoration: none; color: inherit;">
                <article class="game-card">
                <div class="card-media">
                    ${discountBadge}
                    <img src="${gameImg}" alt="${game.title}" onerror="this.src='${IS_SUBFOLDER ? '../img/placeholder.png' : 'img/placeholder.png'}'">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(event, ${game.id})">
                        <i class="${favIcon}"></i>
                    </button>
                </div>
                <div class="game-info">
                    <div class="game-details">
                        <p class="game-title">${game.title}</p>
                        <div class="game-platforms">${platformsHtml}</div>
                        <span class="game-tags">${tags.join(', ')}</span>
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
    // Se já temos os dados, não precisamos buscar novamente (Cache simples)
    if (allGamesData.length > 0) return routePageRendering();

    try {
        if (window.db) {
            const snapshot = await window.db.collection('games').get();
            if (!snapshot.empty) {
                allGamesData = snapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
            }
        }

        if (allGamesData.length === 0) {
            const jsonPath = IS_SUBFOLDER ? '../json/games.json' : 'json/games.json';
            const response = await fetch(jsonPath);
            allGamesData = await response.json();
        }

        // Normalização e sanitização dos dados
        allGamesData = allGamesData.map(game => {
            let imgPath = game.image || game.Image;
            
            if (imgPath && !imgPath.startsWith('http') && IS_SUBFOLDER && !imgPath.startsWith('../')) {
                imgPath = '../' + imgPath;
            }

            return {
                ...game,
                id: parseInt(game.id),
                image: imgPath,
                description: game.description || game.Description
            };
        });

        routePageRendering();
    } catch (error) {
        console.error("Erro ao carregar o catálogo de jogos:", error);
    }
}

function routePageRendering() {
    const path = window.location.pathname;
    
    const routeMap = {
        'jogo.html': () => typeof renderGameDetails === 'function' && renderGameDetails(allGamesData),
        'busca.html': () => typeof renderSearchResults === 'function' && renderSearchResults(allGamesData),
        'carrinho.html': () => typeof renderCart === 'function' && renderCart(),
        'biblioteca.html': () => typeof renderLibrary === 'function' && renderLibrary(),
        'historico.html': () => typeof renderHistory === 'function' && renderHistory(),
        'perfil.html': () => typeof renderProfile === 'function' && renderProfile()
    };

    const activeFile = Object.keys(routeMap).find(file => path.includes(file));

    if (activeFile) {
        routeMap[activeFile]();
    } else if (typeof renderGames === 'function') {
        renderGames(allGamesData);
    }
}

/**
 * Inicializa o botão "Voltar ao Topo" globalmente
 */
function initBackToTop() {
    if (document.querySelector('.back-to-top')) return; // Evita duplicar o botão

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