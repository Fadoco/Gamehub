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

// Objeto para armazenar funções de renderização específicas de cada página
window.pageRenderers = {};

// Função para registrar renderizadores de página
window.addPageRenderer = (pageFile, rendererFunction) => {
    window.pageRenderers[pageFile.toLowerCase()] = rendererFunction;
};

// Função para disparar o evento raro do Mercado Negro
window.triggerSecretEvent = (force = false) => {
    const chance = Math.random();
    if (force || chance <= 0.04) { // 4% de chance
        console.error("CRITICAL_SYSTEM_BREACH_DETECTED");

        // 1. Congela o site visualmente com efeito mais intenso
        document.documentElement.classList.add('site-frozen');
        document.body.classList.add('site-breaking-anim');

        // 2. Cria os elementos de transição assustadora
        const overlay = document.createElement('div');
        overlay.className = 'glitch-overlay';
        overlay.innerHTML = `
            <div class="breach-container">
                <div class="breach-noise"></div>
                <div class="glitch-icon" style="animation: glitch-scale 0.3s infinite;">[ ! ]</div>
                <div id="glitch-text-status" class="glitch-status">> INITIALIZING_KERNEL_BYPASS...</div>
                <div class="glitch-meta">UID: ${window.auth.currentUser?.uid || 'ANON'} | SESSION_HIJACKED</div>
                <div class="scanning-line"></div>
            </div>
        `;

        const scanline = document.createElement('div');
        scanline.className = 'glitch-scanline';
        
        document.body.appendChild(overlay);
        document.body.appendChild(scanline);

        // 3. Injeção de Código Corrompido com mais intensidade
        const corruptedSnippets = [
            "0xDEADBEEF", "SYSTEM_FAILURE", "const _0x4f21 = [];", "eval(atob('...'))", 
            "Segmentation fault (core dumped)", "Bypassing Firewall...", "Accessing Kernel...", 
            "ERROR_0x8004210B", "while(true){ fork(); }", "injecting_payload...", 
            "WIPING_LOGS", "sudo rm -rf /", "HIDDEN_MARKET_ACCESS",
            "🔥 BURNING_PERMISSIONS", "💀 DEATH_PROCESS", "⚡ ELECTRICAL_SURGE",
            "🔓 UNLOCK_FORBIDDEN", "⛓️ CHAIN_BROKEN"
        ];

        const spawnCode = setInterval(() => {
            const span = document.createElement('div');
            span.className = 'corrupted-code-fragment';
            span.innerText = corruptedSnippets[Math.floor(Math.random() * corruptedSnippets.length)];
            
            // Posição aleatória na tela
            span.style.top = Math.random() * 100 + 'vh';
            span.style.left = Math.random() * 100 + 'vw';
            
            // Tamanho, rotação e cor aleatória
            span.style.fontSize = (Math.random() * 24 + 12) + 'px';
            span.style.transform = `rotate(${Math.random() * 360}deg) scale(${Math.random() * 0.5 + 0.5})`;
            span.style.color = ['#0f0', '#f00', '#00f', '#ff00ff'][Math.floor(Math.random() * 4)];
            span.style.fontWeight = 'bold';
            
            document.body.appendChild(span);
            
            // Remove o elemento após a animação (mais rápido)
            setTimeout(() => span.remove(), 600);
        }, 40); // Mais frequente = mais intenso

        // 4. Vibrações (usando transform para simular tremor)
        const vibrateInterval = setInterval(() => {
            const intensity = Math.random() * 8;
            document.body.style.transform = `translate(${intensity - 4}px, ${Math.random() * 4}px)`;
        }, 50);

        // 5. Simula uma sequência de falhas com timing mais dramático
        const status = overlay.querySelector('#glitch-text-status');
        setTimeout(() => { status.innerText = "> CORRUPTING_FIRESTORE_RECORDS..."; status.style.color = '#f00'; }, 800);
        setTimeout(() => { status.innerText = "> WIPING_LOGS..."; status.style.color = '#0f0'; }, 1600);
        setTimeout(() => { status.innerText = "> HIJACKING_DB_CONNECTION..."; status.style.color = '#f00'; }, 2400);
        setTimeout(() => { status.innerText = "> BYPASSING_SECURITY_LAYER..."; status.style.color = '#0f0'; }, 3200);
        setTimeout(() => { status.innerText = "> ACCESSING_BLACK_MARKET..."; status.style.color = '#ff00ff'; }, 3800);
        setTimeout(() => { status.innerText = "> 🔓 WELCOME TO THE VOID 🔓"; status.style.color = '#ffff00'; }, 4400);

        // 6. Redireciona após 5 segundos com cleanup
        setTimeout(() => {
            clearInterval(spawnCode);
            clearInterval(vibrateInterval);
            document.body.style.transform = 'translate(0, 0)';
            window.location.href = window.utils.getHtmlPath('mercado-negro.html');
        }, 5200);
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
 
    // Badge é gerenciado pelo notifications-manager.js
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
    const isAdmin = user && (
        (typeof window.PermissionsModule?.isAdmin === 'function' && window.PermissionsModule.isAdmin(user)) ||
        adminList.includes((user.email || '').toLowerCase())
    );

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

            // 2. Fotinha do Perfil (Avatar) com nome abaixo
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
            logoutBtn.onclick = async () => {
                try {
                    if (typeof window.SessionModule?.logout === 'function') {
                        await window.SessionModule.logout();
                    } else {
                        await window.auth.signOut();
                    }
                    location.reload();
                } catch (error) {
                    console.error('Erro ao sair:', error);
                    if (typeof window.showToast === 'function') {
                        window.showToast('Erro ao sair da conta.', 'error');
                    }
                }
            };
            userMenu.appendChild(logoutBtn);
        }
 
        // Mostra a carteira e remove a classe hidden
        const walletDisplay = document.getElementById('user-wallet');
        if (walletDisplay) {
            walletDisplay.classList.remove('hidden');
            walletDisplay.style.display = 'flex'; 
        } 
    } else {
        if (btnLogin) btnLogin.style.display = 'block';
        // Sem usuário, garante que o menu do usuário esteja oculto e o botão de login visível
        if (userMenu) userMenu.style.display = 'none';
        const walletDisplay = document.getElementById('user-wallet');
        if (walletDisplay) {
            walletDisplay.classList.add('hidden');
            walletDisplay.style.display = 'none';
        }
    }
}; 

/**
 * Renderiza uma lista de jogos em um container HTML.
 * Esta função é compartilhada entre home.js, library.js e busca.js.
 */
window.renderToContainer = (games, container, clear = true) => {
    if (!container) return;

    // Verifica se estamos na página inicial para desativar o visual de ranks (auras/cores) na loja
    const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';

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
        const upgradeLevel = isHomePage ? 0 : ((window.userUpgrades && window.userUpgrades[game.id]) || 0);
        const upgradeHtml = isHomePage ? '' : (window.RankSystem ? window.RankSystem.getUpgradeHtml(game.id) : '');
        const rankMeta = window.RankSystem ? window.RankSystem.getRankMetadata(upgradeLevel) : { aura: '', class: '' };

        const auraClass = rankMeta?.aura || '';
        // Aplica a classe de rank ao título para mudar a cor e adicionar efeitos (como o pulso) em todos os níveis
        const titleClass = rankMeta?.class ? `game-title ${rankMeta.class}` : 'game-title';

        // Escolhe a Capa (Vertical) para a loja, ou cai de volta para o banner se não houver capa
        const displayImg = game.coverUrl || game.image;

        // Cálculo de valorização por Upgrade
        const basePriceNum = window.utils.parsePrice(game.currentPrice);
        const inventoryValue = window.RankSystem.calculateValuation(basePriceNum, upgradeLevel);

        const isLibraryPage = window.location.pathname.includes('biblioteca.html');
        const finalPriceClass = isLibraryPage ? 'game-price valuation' : priceClass;
        const displayPrice = (isLibraryPage && inventoryValue > 0)
            ? `Valor: R$ ${inventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : game.currentPrice;

        return `
            <a href="${window.utils.getHtmlPath(`jogo.html?id=${game.id}`)}" class="game-card-link" style="text-decoration: none; color: inherit;">
                <article class="game-card ${auraClass}">
                <div class="card-media ${auraClass}">
                    ${discountBadge}
                    <img data-src="${displayImg}" alt="${game.title}" class="lazy-image" referrerpolicy="no-referrer">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(event, ${game.id})">
                        <i class="${favIcon}"></i>
                    </button>
                </div>
                <div class="game-info">
                    <div class="game-details">
                        <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
                            <p class="${titleClass}">${game.title}</p>
                            ${upgradeHtml}
                        </div>
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

    // Observa as imagens lazy-loaded após renderizar
    if (window.LazyImageLoader) {
        setTimeout(() => {
            const lazyImages = container.querySelectorAll('[data-src]');
            if (lazyImages.length > 0) {
                window.LazyImageLoader.observe(lazyImages);
            }
        }, 0);
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

        // Carregar e mesclar jogos locais (games-local.json)
        try {
            const localJsonPath = IS_SUBFOLDER ? '../json/games-local.json' : 'json/games-local.json';
            console.log("Tentando carregar games-local.json de:", localJsonPath);
            const localResponse = await fetch(localJsonPath);
            if (localResponse.ok) {
                const localGames = await localResponse.json();
                if (Array.isArray(localGames) && localGames.length > 0) {
                    // Mesclar: adicionar novos jogos e fazer override de existentes
                    localGames.forEach(localGame => {
                        const existingIndex = data.findIndex(g => String(g.id) === String(localGame.id));
                        if (existingIndex >= 0) {
                            // Override: substituir jogo existente
                            data[existingIndex] = { ...data[existingIndex], ...localGame };
                            console.log(`✏️ Jogo ${localGame.id} foi overridado pelos dados locais`);
                        } else {
                            // Novo jogo: adicionar
                            data.push(localGame);
                            console.log(`✨ Novo jogo adicionado localmente: ${localGame.id} - ${localGame.title}`);
                        }
                    });
                    console.log(`📦 ${localGames.length} jogos locais carregados/mesclados`);
                }
            }
        } catch (localError) {
            console.log("games-local.json não encontrado ou erro ao carregar (isso é normal):", localError.message);
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
        
        // Dispara evento para notificar que os dados foram carregados
        window.dispatchEvent(new CustomEvent('gamesDataLoaded', { detail: { games: window.allGamesData } }));

    } catch (error) {
        console.error("Erro ao carregar o catálogo de jogos:", error);
    }
}

/**
 * Atualiza a UI da página atual sem recarregar.
 * Chamado após mudanças de estado (favoritos, carrinho, compras, etc).
 */
window.refreshCurrentPageUI = function() {
    if (window.routePageRendering) {
        window.routePageRendering();
    }
};

/**
 * Decide qual função de renderização chamar com base na página atual
 */
window.routePageRendering = function() {
    const path = window.location.pathname.toLowerCase();
    
    // Encontra o renderizador para a página atual
    let activeRenderer = null;
    for (const file in window.pageRenderers) {
        if (path.includes(file)) {
            activeRenderer = window.pageRenderers[file];
            break;
        }
    }

    // Só executa renderização se allGamesData foi carregado
    if (!window.allGamesData || window.allGamesData.length === 0) {
        console.warn("[ROUTING] Dados dos jogos ainda nao foram carregados. Renderizacao adiada.");
        return;
    }

    // Renderizadores padrão que sempre recebem allGamesData
    if (path.includes('jogo.html') && typeof window.renderGameDetails === 'function') {
        return window.renderGameDetails(window.allGamesData);
    }
    if (path.includes('busca.html') && typeof window.renderSearchResults === 'function') {
        return window.renderSearchResults(window.allGamesData);
    }
    if (path.includes('lista-jogos.html') && typeof window.renderAllGamesList === 'function') {
        return window.renderAllGamesList(window.allGamesData);
    }
    
    // Renderizadores que não precisam de allGamesData ou o buscam internamente
    if (path.includes('carrinho.html')) {
        if (typeof window.renderCart === 'function') {
            window.renderCart();
        }
    }
    else if (path.includes('biblioteca.html') && typeof window.renderLibrary === 'function') {
        window.renderLibrary();
    }
    else if (path.includes('historico.html') && typeof window.renderHistory === 'function') {
        window.renderHistory();
    }
    else if (path.includes('perfil.html') && typeof window.renderProfile === 'function') {
        window.renderProfile();
    }
    else if (path.includes('roleta.html') && typeof window.renderRoulette === 'function') {
        window.renderRoulette();
    }
    else if (path.includes('mercado-negro.html') && typeof window.renderMercadoNegro === 'function') {
        window.renderMercadoNegro();
    }
    else if (activeRenderer) {
        activeRenderer();
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

// --- Mobile Header Initialization (accessible hamburger + slide panel) ---
function initMobileHeader() {
    try {
        const header = document.querySelector('.topbar');
        if (!header) return;

        // Create hamburger button (if not exists)
        let hb = document.getElementById('mobile-hamburger');
        if (!hb) {
            hb = document.createElement('button');
            hb.id = 'mobile-hamburger';
            hb.className = 'hamburger-button';
            hb.setAttribute('aria-label', 'Abrir menu');
            hb.setAttribute('aria-expanded', 'false');
            hb.setAttribute('aria-controls', 'mobile-nav-panel');
            hb.innerHTML = `<span class="bar" aria-hidden="true"></span>`;
            // Insert at the beginning of topbar__left for mobile
            const left = header.querySelector('.topbar__left');
            if (left) left.insertBefore(hb, left.firstChild);
            else header.insertBefore(hb, header.firstChild);
        }

        // Create overlay
        let overlay = document.getElementById('mobile-nav-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mobile-nav-overlay';
            overlay.className = 'mobile-nav-overlay';
            document.body.appendChild(overlay);
        }

        // Create panel
        let panel = document.getElementById('mobile-nav-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'mobile-nav-panel';
            panel.className = 'mobile-nav-panel';
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-modal', 'true');
            panel.setAttribute('aria-hidden', 'true');
        }

        const sanitizeClone = (element) => {
            if (!element || !element.querySelectorAll) return;
            element.removeAttribute('id');
            element.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
            element.querySelectorAll('[aria-controls]').forEach(child => child.removeAttribute('aria-controls'));
            element.querySelectorAll('[aria-expanded]').forEach(child => child.removeAttribute('aria-expanded'));
        };

        // Helpers to open/close
        const openPanel = () => {
            hb.classList.add('active');
            panel.classList.add('active');
            overlay.classList.add('active');
            hb.setAttribute('aria-expanded', 'true');
            panel.setAttribute('aria-hidden', 'false');
            // Lock scroll
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            // Focus first link
            const firstLink = panel.querySelector('a, button');
            if (firstLink) firstLink.focus();
        };

        const closePanel = () => {
            hb.classList.remove('active');
            panel.classList.remove('active');
            overlay.classList.remove('active');
            hb.setAttribute('aria-expanded', 'false');
            panel.setAttribute('aria-hidden', 'true');
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            hb.focus();
        };

        const buildMobilePanel = () => {
            panel.innerHTML = '';

            // Add close button at the top of the mobile panel
            const closeButton = document.createElement('button');
            closeButton.className = 'mobile-nav-close-btn btn btn-ghost';
            closeButton.type = 'button';
            closeButton.textContent = 'Fechar menu';
            closeButton.setAttribute('aria-label', 'Fechar menu');
            closeButton.addEventListener('click', closePanel);
            panel.appendChild(closeButton);

            // Clone main menu into panel and avoid mobile-hidden desktop class
            const mainMenu = document.querySelector('.topbar__menu');
            const menuClone = mainMenu ? mainMenu.cloneNode(true) : document.createElement('nav');
            sanitizeClone(menuClone);
            menuClone.className = 'mobile-nav-menu';
            menuClone.setAttribute('aria-label', 'Menu principal - móvel');
            menuClone.setAttribute('role', 'menu');
            menuClone.querySelectorAll('a').forEach(link => {
                link.setAttribute('role', 'menuitem');
                link.removeAttribute('id');
            });
            panel.appendChild(menuClone);

            // Add wallet and user actions to panel for mobile
            const actions = document.querySelector('.topbar__actions');
            if (actions) {
                const actionsClone = actions.cloneNode(true);
                sanitizeClone(actionsClone);
                actionsClone.style.marginTop = '12px';
                actionsClone.classList.add('mobile-nav-actions');
                panel.appendChild(actionsClone);
            }

            if (!panel.parentElement) {
                document.body.appendChild(panel);
            }
        };

        buildMobilePanel();

        // Event listeners
        hb.addEventListener('click', (e) => {
            const expanded = hb.classList.contains('active');
            if (expanded) closePanel(); else openPanel();
        });

        overlay.addEventListener('click', () => closePanel());

        // Close when clicking a link inside panel
        panel.addEventListener('click', (e) => {
            const target = e.target.closest('a, button');
            if (target && target.tagName.toLowerCase() === 'a') {
                // Let navigation proceed but close UI
                closePanel();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel.classList.contains('active')) closePanel();
        });

        // Responsive behavior: hide default menu on small screens
        const mq = window.matchMedia('(max-width: 767px)');
        const updateVisibility = () => {
            const desktopMenu = document.querySelector('.topbar__menu');
            if (mq.matches) {
                if (desktopMenu) desktopMenu.style.display = 'none';
                hb.style.display = 'inline-flex';
                panel.style.display = 'flex';
                overlay.style.display = 'block';
                overlay.classList.remove('active');
                panel.classList.remove('active');
            } else {
                if (desktopMenu) desktopMenu.style.display = '';
                hb.style.display = 'none';
                closePanel();
                panel.style.display = '';
                overlay.style.display = '';
            }
        };
        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', updateVisibility);
        } else if (typeof mq.addListener === 'function') {
            mq.addListener(updateVisibility);
        }
        updateVisibility();
    } catch (err) {
        console.error('Erro ao inicializar header móvel:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchGamesData();
    initBackToTop();
    initMobileHeader();
});