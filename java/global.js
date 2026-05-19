/**
 * Lógica global para carregar dados e inicializar funcionalidades comuns.
 */

let allGamesData = []; // Armazenar os dados dos jogos globalmente para acesso por outros scripts

// Utilitários Globais
window.utils = {
    // Converte preços como "R$ 99,90" ou "Grátis" para números (float)
    parsePrice: (priceStr) => {
        if (!priceStr) return 0;
        const cleaned = String(priceStr).replace('R$', '').replace('Grátis', '0').replace(',', '.').trim();
        return parseFloat(cleaned) || 0;
    }
};

/**
 * Renderiza uma lista de jogos em um container HTML.
 * Esta função é compartilhada entre home.js, library.js e busca.js.
 */
window.renderToContainer = (games, container, clear = true) => {
    if (!container) return;
    
    const gamePagePath = IS_SUBFOLDER ? 'jogo.html' : 'html/jogo.html';

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
};

const IS_SUBFOLDER = window.location.pathname.includes('/html/'); // Define uma vez para reuso
async function fetchGamesData() {
    try {
        // Tenta carregar do Firestore primeiro (Melhor Performance e Escala)
        if (typeof db !== 'undefined') {
            const snapshot = await db.collection('games').get();
            if (!snapshot.empty) {
                allGamesData = snapshot.docs.map(doc => ({
                    firestoreId: doc.id,
                    ...doc.data()
                }));
                console.log("Dados carregados via Firestore");
            }
        }

        // Se o Firestore estiver vazio ou falhar, usa o fallback JSON
        if (allGamesData.length === 0) {
            const jsonPath = IS_SUBFOLDER ? '../json/games.json' : 'json/games.json';
            const response = await fetch(jsonPath);
            allGamesData = await response.json();
        }

        // Normalização dos dados para resolver problemas de caminhos e nomes de campos (case-sensitive)
        allGamesData = allGamesData.map(game => { // Usar IS_SUBFOLDER aqui
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

        // Decide qual função de renderização chamar com base na página atual
        if (window.location.pathname.includes('jogo.html')) {
            // Verifica se a função renderGameDetails está disponível (carregada por jogo.js)
            if (typeof renderGameDetails === 'function') {
                renderGameDetails(allGamesData);
            } else {
                console.warn("renderGameDetails não está definida. Verifique se jogo.js foi carregado.");
            }
        } else if (window.location.pathname.includes('busca.html')) {
            if (typeof renderSearchResults === 'function') {
                renderSearchResults(allGamesData);
            } else {
                console.warn("renderSearchResults não está definida. Verifique se busca.js foi carregado.");
            }
        } else if (window.location.pathname.includes('carrinho.html')) {
            if (typeof renderCart === 'function') {
                renderCart();
            } else {
                console.warn("renderCart não está definida. Verifique se cart.js foi carregado.");
            }
        } else if (window.location.pathname.includes('biblioteca.html')) {
            if (typeof renderLibrary === 'function') {
                renderLibrary();
            } else {
                console.warn("renderLibrary não está definida. Verifique se library.js foi carregado.");
            }
        } else if (window.location.pathname.includes('historico.html')) {
            if (typeof renderHistory === 'function') {
                renderHistory();
            } else {
                console.warn("renderHistory não está definida. Verifique se historico.js foi carregado.");
            }
        } else if (window.location.pathname.includes('perfil.html')) {
            if (typeof renderProfile === 'function') {
                renderProfile();
            } else {
                console.warn("renderProfile não está definida. Verifique se perfil.js foi carregado.");
            }
        } else { // Assumimos que é a página inicial ou outra que lista jogos
            // Verifica se a função renderGames está disponível (carregada por home.js)
            if (typeof renderGames === 'function') {
                renderGames(allGamesData);
            } else {
                console.warn("renderGames não está definida. Verifique se home.js foi carregado.");
            }
        }
    } catch (error) {
        console.error("Erro ao carregar o catálogo de jogos:", error);
    }
}

document.addEventListener('DOMContentLoaded', fetchGamesData);