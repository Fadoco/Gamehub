/**
 * Lógica específica para a página de detalhes do jogo.
 */

function getDefaultDetailImage() {
    return window.IS_SUBFOLDER ? '../assets/capa.jpg' : 'assets/capa.jpg';
}

function normalizeDetailImagePath(path) {
    if (typeof path !== 'string') return '';

    const trimmed = path.trim();
    if (!trimmed) return '';

    // Accept absolute URLs, data URLs and root-relative paths as-is
    if (/^(https?:\/\/|data:|blob:|\/)/i.test(trimmed)) return trimmed;

    // If this page is in a subfolder, local relative assets need one level up
    if (window.IS_SUBFOLDER && !trimmed.startsWith('../')) {
        return `../${trimmed.replace(/^\.\//, '')}`;
    }

    return trimmed.replace(/^\.\//, '');
}

function getGameImageCandidates(game) {
    const rawCandidates = [
        game?.image,
        game?.Image,
        game?.coverUrl,
        game?.CoverUrl,
        game?.imageUrl,
        game?.ImageUrl,
        game?.thumbnail,
        game?.Thumbnail,
        game?.banner,
        game?.Banner,
        game?.poster,
        game?.Poster,
        game?.images?.[0],
        game?.Images?.[0]
    ];

    const normalized = rawCandidates
        .map(normalizeDetailImagePath)
        .filter(Boolean);

    const unique = [...new Set(normalized)];
    unique.push(getDefaultDetailImage());
    return unique;
}

function applyDetailImageWithFallback(imgElement, candidates) {
    if (!imgElement) return;

    let currentIndex = 0;
    const nextCandidate = () => {
        if (currentIndex >= candidates.length) return;
        imgElement.src = candidates[currentIndex];
        currentIndex += 1;
    };

    imgElement.referrerPolicy = 'no-referrer';
    imgElement.loading = 'eager';
    imgElement.decoding = 'async';

    imgElement.onerror = () => nextCandidate();
    nextCandidate();
}

function renderGameDetails(games) {
    // Pega o ID da URL (ex: jogo.html?id=1)
    const params = new URLSearchParams(window.location.search);
    const gameId = parseInt(params.get('id'));
    
    // Busca o jogo garantindo que a comparação funcione mesmo se o ID no JSON for string ou número
    const game = games.find(g => String(g.id) === String(gameId));

    if (game) {
        // Preenche os elementos da página com os dados do JSON
        document.title = `GameHub - ${game.title}`;
        document.getElementById('game-title-detail').textContent = game.title;

        const detailImageElement = document.getElementById('game-image-detail');
        const imageCandidates = getGameImageCandidates(game);
        applyDetailImageWithFallback(detailImageElement, imageCandidates);
        document.getElementById('game-tags-detail').textContent = game.tags.join(', ');

        // Preenche a descrição usando o campo já normalizado pelo global.js
        const descElement = document.getElementById('game-description-detail');
        if (descElement) descElement.textContent = game.description;
        
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
            buyBtn.onclick = () => {
                if (typeof window.toggleCart === 'function') {
                    window.toggleCart(game.id);
                }
            };
            
            // Muda o texto se já estiver no carrinho ou biblioteca
            if (window.userLibrary && window.userLibrary.some(id => String(id) === String(game.id))) {
                buyBtn.textContent = "Na Biblioteca";
                buyBtn.style.background = "#2a2a2a";
                buyBtn.style.cursor = "default";
                buyBtn.disabled = true;
            } else if (window.userCart && window.userCart.some(id => String(id) === String(game.id))) {
                buyBtn.textContent = "Remover do Carrinho";
                buyBtn.style.background = "var(--accent)";
                buyBtn.disabled = false;
            } else {
                buyBtn.textContent = "Adicionar ao Carrinho";
                buyBtn.style.background = "var(--accent)";
                buyBtn.disabled = false;
            }
        }

        const platformsContainer = document.getElementById('game-platforms-detail');
        platformsContainer.innerHTML = game.platforms.map(icon => `<i class="${icon}"></i>`).join(' ');
    } else {
        // Se o jogo não for encontrado, exibe uma mensagem de erro
        const detailContainer = document.querySelector('.game-detail-container');
        if (detailContainer) {
            detailContainer.innerHTML = "<h2>Jogo não encontrado.</h2><p style='color: var(--secondary);'>Verifique o ID do jogo na URL.</p>";
        }
    }
}