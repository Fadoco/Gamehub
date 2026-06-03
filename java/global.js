/**
 * Lógica global para carregar dados e inicializar funcionalidades comuns.
 */

window.allGamesData = []; // Armazenar os dados dos jogos globalmente para acesso por outros scripts
window.isActionInProgress = false; // Trava global para evitar operações duplicadas (compras/roleta)

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
    // Resolve o caminho relativo para um arquivo HTML a partir da página atual
    // targetHtmlFile: o nome do arquivo HTML (ex: 'jogo.html', 'admin.html', 'index.html')
    getHtmlPath: (targetHtmlFile) => { 
        const currentPath = window.location.pathname; 
        const isCurrentInHtmlFolder = currentPath.includes('/html/'); 
        const isCurrentInRoletaFolder = currentPath.includes('/Roleta/'); 
 
        if (targetHtmlFile === 'index.html') { // Caso especial para a página inicial
            return isCurrentInHtmlFolder || isCurrentInRoletaFolder ? '../index.html' : 'index.html';
        }
        if (isCurrentInHtmlFolder) {
            return targetHtmlFile; // Se já estamos em /html/, o link é direto (ex: 'jogo.html')
        } else if (isCurrentInRoletaFolder) {
            return `../html/${targetHtmlFile}`; // Se estamos em /Roleta/, precisamos subir um nível e ir para /html/
        } else { // Da raiz
            return `html/${targetHtmlFile}`;
        }
    }
};

// Helper para gerar o HTML do rank de upgrade
window.getUpgradeHtml = (gameId) => {
    const upgradeLevel = (window.userUpgrades && window.userUpgrades[gameId]) || 0;
    if (upgradeLevel > 0) {
        if (upgradeLevel === 4) return `<span class="upgrade-rank rank-dark-matter">!!!!</span>`;
        const isMax = upgradeLevel >= 3;
        const rankClass = upgradeLevel === 1 ? 'rank-rare' : (upgradeLevel === 2 ? 'rank-epic' : 'rank-legendary' + (isMax ? ' max-rank-anim' : ''));
        const pluses = '+'.repeat(upgradeLevel);
        return `<span class="upgrade-rank ${rankClass}">${pluses}</span>`;
    }
    return '';
};

// Função para disparar o evento raro do Mercado Negro
window.triggerSecretEvent = (force = false) => {
    const chance = Math.random();
    if (force || chance <= 0.02) { 
        console.error("CRITICAL_SYSTEM_BREACH_DETECTED");

        // 1. Congela o site visualmente e funcionalmente
        document.documentElement.classList.add('site-frozen');
        document.body.classList.add('site-breaking-anim');

        // 2. Cria os elementos de bug
        const overlay = document.createElement('div');
        overlay.className = 'glitch-overlay';
        overlay.innerHTML = `
            <div style="font-size: 4rem; font-weight: 900; margin-bottom: 20px;">[ ! ]</div>
            <div id="glitch-text-status">> INITIALIZING_KERNEL_BYPASS...</div>
            <div style="font-size: 0.8rem; margin-top: 40px; color: #555;">UID: ${window.auth.currentUser?.uid || 'ANON'} | SESSION_HIJACKED</div>
        `;

        const scanline = document.createElement('div');
        scanline.className = 'glitch-scanline';
        
        document.body.appendChild(overlay);
        document.body.appendChild(scanline);

        // 3. Injeção de Código Corrompido pela tela
        const corruptedSnippets = [
            "0xDEADBEEF", "SYSTEM_FAILURE", "const _0x4f21 = [];", "eval(atob('...'))", 
            "Segmentation fault (core dumped)", "Bypassing Firewall...", "Accessing Kernel...", 
            "ERROR_0x8004210B", "while(true){ fork(); }", "injecting_payload...", 
            "WIPING_LOGS", "sudo rm -rf /", "HIDDEN_MARKET_ACCESS"
        ];

        const spawnCode = setInterval(() => {
            const span = document.createElement('div');
            span.className = 'corrupted-code-fragment';
            span.innerText = corruptedSnippets[Math.floor(Math.random() * corruptedSnippets.length)];
            
            // Posição aleatória na tela
            span.style.top = Math.random() * 100 + 'vh';
            span.style.left = Math.random() * 100 + 'vw';
            
            // Tamanho e rotação aleatória
            span.style.fontSize = (Math.random() * 20 + 10) + 'px';
            span.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            document.body.appendChild(span);
            
            // Remove o elemento após a animação
            setTimeout(() => span.remove(), 800);
        }, 60); // Cria um novo fragmento a cada 60ms

        // 4. Simula uma sequência de falhas no texto do status
        const status = overlay.querySelector('#glitch-text-status');
        setTimeout(() => { status.innerText = "> CORRUPTING_FIRESTORE_RECORDS..."; }, 1000);
        setTimeout(() => { status.innerText = "> WIPING_LOGS..."; }, 2000);
        setTimeout(() => { status.innerText = "> HIJACKING_DB_CONNECTION..."; }, 3000);
        setTimeout(() => { status.innerText = "> BYPASSING_SECURITY_LAYER..."; }, 4000);
        setTimeout(() => { status.innerText = "> ACCESSING_BLACK_MARKET..."; }, 4500);

        // 5. Redireciona após 5 segundos
        setTimeout(() => {
            clearInterval(spawnCode);
            window.location.href = window.utils.getHtmlPath('mercado-negro.html');
        }, 5000);
        return true;
    }
    return false;
};

// Função para atualizar contadores no menu (opcional) - Movida de auth.js
window.updateNavBadges = () => { 
    const cartBtn = document.querySelector('.nav-button .fa-shopping-cart')?.parentElement;
    if (cartBtn) {
        cartBtn.setAttribute('data-count', window.userCart.length);
    }
 
    // Garante que o saldo no Header esteja atualizado
    const walletDisplay = document.getElementById('wallet-amount');
    if (walletDisplay) {
        walletDisplay.textContent = `R$ ${window.userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
 
    // Atualiza o sino de notificações
    const notifBadge = document.getElementById('notif-badge');
    if (notifBadge) {
        const count = (window.userFriendRequestsReceived || []).length;
        notifBadge.textContent = count;
        notifBadge.style.display = count > 0 ? 'block' : 'none';
        
        const dropdown = document.getElementById('notif-dropdown');
        if (dropdown && dropdown.style.display === 'block') window.renderNotifications();
    }
};

// Função para renderizar a UI do cabeçalho com base no estado de autenticação - Movida de auth.js
window.checkUserSession = (user) => { 
    const btnLogin = document.getElementById('btn-login');
    const userMenu = document.getElementById('user-menu');
    const sectionNav = document.querySelector('.section-nav');

    // Limpar sub-header (section-nav) deixando apenas o botão aleatório
    if (sectionNav) {
        sectionNav.innerHTML = `
            <button id="btn-random-game" class="btn btn-ghost" onclick="window.handleRandomGame()" style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-dice"></i> <span>Jogo Aleatório</span>
            </button>
            <button id="btn-all-games" class="btn btn-ghost" onclick="window.location.href = window.utils.getHtmlPath('lista-jogos.html')" style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-th-list"></i> <span>Lista Completa</span>
            </button>
        `;
    }

    const adminList = (window.ADMIN_EMAILS || []).map(e => e.toLowerCase());
    const isAdmin = user && adminList.includes(user.email.toLowerCase());

    if (user) {
        if (btnLogin) btnLogin.style.display = 'none'; 

        if (userMenu) {
            userMenu.style.display = 'flex';
            userMenu.style.width = 'auto';
            userMenu.innerHTML = '';

            // 1. Botão Admin (se for o caso)
            if (isAdmin) {
                const adminBtn = document.createElement('button');
                adminBtn.className = 'nav-button';
                adminBtn.innerHTML = '<i class="fas fa-user-shield"></i>';
                adminBtn.title = "Painel Administrativo";
                adminBtn.onclick = () => window.location.href = window.utils.getHtmlPath('admin.html'); 
                userMenu.appendChild(adminBtn);
            }

            // 2. Sininho (Notificações)
            const notifWrapper = document.createElement('div');
            notifWrapper.id = 'notif-wrapper';
            notifWrapper.className = 'notifications-wrapper';
            notifWrapper.innerHTML = `
                <button id="btn-notifications" class="nav-button" style="font-size: 18px; color: #ffffff; background: none; border: none; cursor: pointer; position: relative;" title="Notificações">
                    <i class="fas fa-bell"></i>
                    <span id="notif-badge" class="notification-badge">0</span>
                </button>
                <div id="notif-dropdown" class="notifications-dropdown">
                    <div class="notifications-header">Pedidos de Amizade</div>
                    <div id="notif-list" class="notifications-list">
                        <div class="empty-notif">Nenhuma notificação nova.</div>
                    </div>
                </div>
            `;
            userMenu.appendChild(notifWrapper);

            const btnNotif = notifWrapper.querySelector('#btn-notifications');
            const dropdown = notifWrapper.querySelector('#notif-dropdown');
            btnNotif.onclick = (e) => {
                e.stopPropagation(); 
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                if (dropdown.style.display === 'block') window.renderNotifications();
            };
            document.addEventListener('click', () => { if (dropdown) dropdown.style.display = 'none'; });
            dropdown.onclick = (e) => e.stopPropagation();

            // 3. Fotinha do Perfil (Avatar) com nome abaixo
            const userAvatarContainer = document.createElement('div');
            userAvatarContainer.className = 'user-profile-display';
            const displayName = window.utils.getUserFriendlyName(user);
            userAvatarContainer.innerHTML = `
                <img src="${user.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=27ae60&color=fff`}" 
                     style="width: 35px; height: 35px; border-radius: 50%; border: 2px solid var(--accent); cursor: pointer;"
                     title="${displayName}"
                     onclick="window.location.href='${window.utils.getHtmlPath('perfil.html')}'"> 
                <span style="font-size: 12px; color: var(--text-secondary); display: block; text-align: center; margin-top: 4px;">${displayName}</span>
            `;
            userAvatarContainer.onclick = () => window.location.href = window.utils.getHtmlPath('perfil.html');
            userMenu.appendChild(userAvatarContainer);

            // Botão Logout
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'nav-button'; 
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
            logoutBtn.onclick = () => window.auth.signOut().then(() => location.reload());
            userMenu.appendChild(logoutBtn);
        }
 
        // Apenas mostra/esconde, o conteúdo é atualizado por updateNavBadges
        const walletDisplay = document.getElementById('user-wallet');
        if (walletDisplay) {
            walletDisplay.style.display = 'flex'; 
        } 
    } else {
        if (btnLogin) btnLogin.style.display = 'block';
        // Sem usuário, garante que o menu do usuário esteja oculto e o botão de login visível
        if (userMenu) userMenu.style.display = 'none';
        const walletDisplay = document.getElementById('user-wallet');
        if (walletDisplay) walletDisplay.style.display = 'none';
    }
}; 

/**
 * Renderiza uma lista de jogos em um container HTML.
 * Esta função é compartilhada entre home.js, library.js e busca.js.
 */
window.renderToContainer = (games, container, clear = true) => {
    if (!container) return;

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
        const upgradeHtml = window.getUpgradeHtml(game.id);

        let auraClass = '';
        if (upgradeLevel === 1) auraClass = 'upgrade-aura-1';
        else if (upgradeLevel === 2) auraClass = 'upgrade-aura-2';
        else if (upgradeLevel >= 3) auraClass = 'upgrade-aura-3'; // >=3 para rank máximo
        else if (upgradeLevel === 4) auraClass = 'upgrade-aura-4';

        // Escolhe a Capa (Vertical) para a loja, ou cai de volta para o banner se não houver capa
        const displayImg = game.coverUrl || game.image;

        // Cálculo de valorização por Upgrade
        const basePriceNum = window.utils.parsePrice(game.currentPrice);
        const multipliers = { 0: 1, 1: 1.5, 2: 2.5, 3: 4.0, 4: 9.0 };
        const multiplier = multipliers[upgradeLevel] || 1; // Garante que Rank 4 use 9.0
        const inventoryValue = basePriceNum * multiplier;

        const isLibraryPage = window.location.pathname.includes('biblioteca.html');
        const finalPriceClass = isLibraryPage ? 'game-price valuation' : priceClass;
        const displayPrice = (isLibraryPage && inventoryValue > 0)
            ? `Valor: R$ ${inventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : game.currentPrice;

        return `
            <a href="${window.utils.getHtmlPath(`jogo.html?id=${game.id}`)}" class="game-card-link" style="text-decoration: none; color: inherit;">
                <article class="game-card ${auraClass}">
                <div class="card-media">
                    ${discountBadge}
                    <img src="${displayImg}" alt="${game.title}" referrerpolicy="no-referrer">
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
                        <div class="price-box">${isLibraryPage ? '' : oldPriceHtml}<p class="${finalPriceClass}">${displayPrice}</p></div>
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
        let data = [];

        // Tenta carregar do Firestore
        try {
            if (window.db) {
                const snapshot = await window.db.collection('games').get();
                if (!snapshot.empty) {
                    data = snapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
                    console.log("Dados carregados via Firestore");
                }
            }
        } catch (dbError) {
            console.warn("Firestore inacessível, tentando fallback JSON...", dbError);
        }

        // Fallback para JSON se o Firestore falhar ou estiver vazio
        if (data.length === 0) {
            const jsonPath = IS_SUBFOLDER ? '../json/games.json' : 'json/games.json';
            console.log("Tentando carregar games.json de:", jsonPath);
            const response = await fetch(jsonPath);
            if (response.ok) {
                data = await response.json();
                console.log("Dados carregados via JSON");
            } else {
                console.error("Falha na resposta HTTP ao carregar games.json:", response.status, response.statusText);
                console.error("Erro ao carregar games.json:", response.statusText);
            }
        }

        console.log("Conteúdo final de window.allGamesData (antes da normalização):", data); // Adicionado para depuração
        window.allGamesData = data;

        // Normalização dos dados para resolver problemas de caminhos e nomes de campos (case-sensitive)
        window.allGamesData = (window.allGamesData || []).map(game => { 
            // 1. Resolve inconsistência: aceita 'image' ou 'Image' do JSON
            let imgPath = game.image || game.Image;
            let coverPath = game.coverUrl || game.CoverUrl || null;
            
            // 2. Ajusta caminhos de imagens locais para subpastas (ex: de 'img/...' para '../img/...')
            if (imgPath && !imgPath.startsWith('http') && IS_SUBFOLDER && !imgPath.startsWith('../')) {
                imgPath = '../' + imgPath;
            }

            // Ajusta caminhos de capas verticais locais para subpastas
            if (coverPath && !coverPath.startsWith('http') && IS_SUBFOLDER && !coverPath.startsWith('../')) {
                coverPath = '../' + coverPath;
            }

            return {
                ...game,
                image: imgPath,
                coverUrl: coverPath,
                description: game.description || game.Description || "",
                platforms: game.platforms || game.Platforms || [],
                tags: game.tags || game.Tags || [],
                id: game.id || game.ID
            };
        });
        console.log("Conteúdo final de window.allGamesData (após normalização):", window.allGamesData); // Adicionado para depuração

        window.routePageRendering();

    } catch (error) {
        console.error("Erro ao carregar o catálogo de jogos:", error);
    }
}

/**
 * Decide qual função de renderização chamar com base na página atual
 */
window.routePageRendering = function() {
    const path = window.location.pathname.toLowerCase();
    
    const routes = [
        { file: 'jogo.html', func: typeof window.renderGameDetails === 'function' ? window.renderGameDetails : null, args: [window.allGamesData] },
        { file: 'busca.html', func: typeof window.renderSearchResults === 'function' ? window.renderSearchResults : null, args: [window.allGamesData] },
        { file: 'carrinho.html', func: typeof window.renderCart === 'function' ? window.renderCart : null },
        { file: 'biblioteca.html', func: typeof window.renderLibrary === 'function' ? window.renderLibrary : null },
        { file: 'historico.html', func: typeof window.renderHistory === 'function' ? window.renderHistory : null },
        { file: 'perfil.html', func: typeof window.renderProfile === 'function' ? window.renderProfile : null },
        { file: 'lista-jogos.html', func: typeof window.renderAllGamesList === 'function' ? window.renderAllGamesList : null, args: [window.allGamesData] },
        { file: 'roleta.html', func: typeof window.renderRoulette === 'function' ? window.renderRoulette : null, args: [] }
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
    } else if (typeof window.renderGames === 'function') {
        window.renderGames(window.allGamesData);
    }
};

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