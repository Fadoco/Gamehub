/**
 * Tutorial interativo da página inicial (index).
 */
(function initIndexTutorialModule() {
    if (window.indexTutorialLoaded) return;
    window.indexTutorialLoaded = true;

    const NEVER_SHOW_PREFIX = 'gh_index_tutorial_never_show';
    const PROMPTED_SESSION_PREFIX = 'gh_index_tutorial_prompted_session';
    const STEP_DEFINITIONS = [
        {
            title: 'Navegação principal',
            eyebrow: 'Mapa da loja',
            icon: 'fas fa-compass',
            selector: '.topbar__menu',
            text: 'Esse menu leva você para as áreas mais importantes do site sem precisar caçar link perdido.',
            bullets: [
                'Biblioteca: veja os jogos que já são seus.',
                'Roleta: use a sorte para ganhar recompensas.',
                'Carrinho e revenda: acompanhe suas compras e trocas.'
            ],
            chips: ['Biblioteca', 'Roleta', 'Carrinho']
        },
        {
            title: 'Busca e descoberta',
            eyebrow: 'Explorando jogos',
            icon: 'fas fa-magnifying-glass',
            selector: '.main-header',
            text: 'Aqui você pesquisa por nome e também pode usar o jogo aleatório para descobrir algo novo sem pensar muito.',
            bullets: [
                'A barra filtra a loja em tempo real.',
                'O botão aleatório serve como atalho para achar novidades.',
                'Esse bloco fica sempre perto do topo para acesso rápido.'
            ],
            chips: ['Pesquisar', 'Aleatório', 'Atalho rápido']
        },
        {
            title: 'Destaque principal',
            eyebrow: 'O que vale a pena ver primeiro',
            icon: 'fas fa-star',
            selector: '.hero-section',
            text: 'Essa área mostra o jogo em destaque, o preço, a descrição curta e os botões de ação mais usados.',
            bullets: [
                'Comprar agora leva direto para a compra.',
                'O ícone de carrinho guarda o jogo para depois.',
                'O coração ajuda a marcar favoritos.'
            ],
            chips: ['Comprar', 'Carrinho', 'Favoritar']
        },
        {
            title: 'Sua conta e saldo',
            eyebrow: 'Painel do usuário',
            icon: 'fas fa-user-shield',
            selector: '.topbar__actions',
            text: 'No canto superior ficam sua carteira, notificações, perfil e o botão de entrar.',
            bullets: [
                'A carteira mostra seu saldo disponível.',
                'As notificações avisam pedidos e eventos.',
                'O perfil concentra ações da sua conta.'
            ],
            chips: ['Saldo', 'Notificações', 'Perfil']
        },
        {
            title: 'Promoções e categorias',
            eyebrow: 'Descobrindo ofertas',
            icon: 'fas fa-tags',
            selector: '.promo-section',
            text: 'Aqui você encontra ofertas destacadas, coleções e atalhos para navegar por gênero sem perder tempo.',
            bullets: [
                'As promoções mostram jogos com desconto.',
                'As categorias ajudam a filtrar por estilo.',
                'Os banners destacam campanhas especiais.'
            ],
            chips: ['Ofertas', 'Categorias', 'Banners']
        },
        {
            title: 'Rankings e novidades',
            eyebrow: 'O que está em alta',
            icon: 'fas fa-chart-line',
            selector: '.charts-section',
            text: 'Esses quadros mostram o que vende mais, o que é grátis e o que acabou de chegar na loja.',
            bullets: [
                'Mais vendidos indica o que a galera mais compra.',
                'Gratuitos mostra opções sem custo.',
                'Lançamentos ajuda a ver novidades primeiro.'
            ],
            chips: ['Mais vendidos', 'Gratuitos', 'Lançamentos']
        },
        {
            title: 'Rodapé e ajuda',
            eyebrow: 'Suporte rápido',
            icon: 'fas fa-circle-question',
            selector: '.main-footer',
            text: 'No rodapé ficam os atalhos de suporte, privacidade e o botão de ajuda para abrir esta explicação quando quiser.',
            bullets: [
                'O tutorial pode ser reaberto a qualquer momento.',
                'Os atalhos do rodapé ajudam na navegação.',
                'Essa área fecha a experiência com acesso rápido a suporte.'
            ],
            chips: ['Ajuda', 'Suporte', 'Reabrir tutorial']
        }
    ];

    let activeOverlay = null;
    let currentStepIndex = 0;
    let activeSpotlight = null;
    let spotlightObserver = null;

    function isIndexPage() {
        const path = (window.location.pathname || '').toLowerCase();
        return path.endsWith('/index.html') || path === '/' || path === '';
    }

    function getTutorialUserToken() {
        return window.auth?.currentUser?.uid || 'guest';
    }

    function getStorageKey(prefix) {
        return `${prefix}:${getTutorialUserToken()}`;
    }

    function shouldNeverShowAutomatically() {
        return localStorage.getItem(getStorageKey(NEVER_SHOW_PREFIX)) === '1';
    }

    function setNeverShowAutomatically(shouldHide) {
        const key = getStorageKey(NEVER_SHOW_PREFIX);
        if (shouldHide) {
            localStorage.setItem(key, '1');
        } else {
            localStorage.removeItem(key);
        }
    }

    function wasPromptedThisSession() {
        return sessionStorage.getItem(getStorageKey(PROMPTED_SESSION_PREFIX)) === '1';
    }

    function markPromptedThisSession() {
        sessionStorage.setItem(getStorageKey(PROMPTED_SESSION_PREFIX), '1');
    }

    function clearTutorialHighlight() {
        document.querySelectorAll('.tutorial-highlight-target').forEach((element) => {
            element.classList.remove('tutorial-highlight-target');
        });
    }

    function clearTutorialSpotlight() {
        if (activeSpotlight) {
            activeSpotlight.remove();
            activeSpotlight = null;
        }
    }

    function closeActiveOverlay() {
        if (!activeOverlay) return;
        clearTutorialHighlight();
        clearTutorialSpotlight();
        if (spotlightObserver) {
            spotlightObserver.disconnect();
            spotlightObserver = null;
        }
        activeOverlay.remove();
        activeOverlay = null;
    }

    function mountOverlay(innerHtml) {
        closeActiveOverlay();
        const overlay = document.createElement('div');
        overlay.className = 'site-tutorial-overlay';
        overlay.innerHTML = innerHtml;
        document.body.appendChild(overlay);
        activeOverlay = overlay;
        return overlay;
    }

    function ensureSpotlightElement(overlay) {
        if (activeSpotlight && activeSpotlight.isConnected) {
            return activeSpotlight;
        }

        const spotlight = document.createElement('div');
        spotlight.className = 'site-tutorial-spotlight';
        overlay.appendChild(spotlight);
        activeSpotlight = spotlight;
        return spotlight;
    }

    function positionSpotlightForStep(overlay, stepIndex) {
        const step = STEP_DEFINITIONS[stepIndex];
        if (!step || !step.selector) return;

        const target = document.querySelector(step.selector);
        const spotlight = ensureSpotlightElement(overlay);

        if (!target) {
            spotlight.classList.remove('is-visible');
            return;
        }

        target.classList.add('tutorial-highlight-target');
        const rect = target.getBoundingClientRect();
        const padding = 14;
        const left = Math.max(8, rect.left - padding);
        const top = Math.max(8, rect.top - padding);
        const rightLimit = window.innerWidth - 8;
        const bottomLimit = window.innerHeight - 8;
        const width = Math.max(120, Math.min(rightLimit - left, rect.width + (padding * 2)));
        const height = Math.max(72, Math.min(bottomLimit - top, rect.height + (padding * 2)));

        spotlight.style.left = `${left}px`;
        spotlight.style.top = `${top}px`;
        spotlight.style.width = `${width}px`;
        spotlight.style.height = `${height}px`;
        spotlight.style.borderRadius = window.getComputedStyle(target).borderRadius || '18px';
        spotlight.classList.add('is-visible');
    }

    function renderStep(overlay, stepIndex) {
        const step = STEP_DEFINITIONS[stepIndex];
        if (!step) return;

        currentStepIndex = stepIndex;
        clearTutorialHighlight();

        const progress = overlay.querySelector('.site-tutorial-progress');
        const title = overlay.querySelector('.site-tutorial-title');
        const text = overlay.querySelector('.site-tutorial-text');
        const eyebrow = overlay.querySelector('.site-tutorial-eyebrow');
        const visualIcon = overlay.querySelector('.site-tutorial-visual-icon i');
        const visualTitle = overlay.querySelector('.site-tutorial-visual-title');
        const visualSubtitle = overlay.querySelector('.site-tutorial-visual-subtitle');
        const chips = overlay.querySelector('.site-tutorial-chips');
        const bullets = overlay.querySelector('.site-tutorial-points');
        const prevBtn = overlay.querySelector('.site-tutorial-prev');
        const nextBtn = overlay.querySelector('.site-tutorial-next');

        if (progress) progress.textContent = `Passo ${stepIndex + 1} de ${STEP_DEFINITIONS.length}`;
        if (eyebrow) eyebrow.textContent = step.eyebrow || 'Guia do site';
        if (title) title.textContent = step.title;
        if (text) text.textContent = step.text;
        if (visualIcon && step.icon) visualIcon.className = step.icon;
        if (visualTitle) visualTitle.textContent = step.title;
        if (visualSubtitle) visualSubtitle.textContent = step.eyebrow || 'Tutorial interativo';
        if (chips) {
            chips.innerHTML = (step.chips || []).map((chip) => `<span class="site-tutorial-chip">${chip}</span>`).join('');
        }
        if (bullets) {
            bullets.innerHTML = (step.bullets || []).map((bullet) => `<li>${bullet}</li>`).join('');
        }
        if (prevBtn) prevBtn.disabled = stepIndex === 0;
        if (nextBtn) nextBtn.textContent = stepIndex === STEP_DEFINITIONS.length - 1 ? 'Finalizar' : 'Próximo';

        const target = step.selector ? document.querySelector(step.selector) : null;
        if (target && typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }

        window.requestAnimationFrame(() => {
            positionSpotlightForStep(overlay, stepIndex);
        });
    }

    function startTour(forceManualOpen = false) {
        if (!isIndexPage()) return false;

        const overlay = mountOverlay(`
            <div class="site-tutorial-card" role="dialog" aria-modal="true" aria-labelledby="site-tutorial-title">
                <div class="site-tutorial-card__header">
                    <div class="site-tutorial-progress"></div>
                    <div class="site-tutorial-badge">Tour guiado</div>
                </div>
                <div class="site-tutorial-layout">
                    <aside class="site-tutorial-visual">
                        <div class="site-tutorial-visual-icon">
                            <i class="fas fa-circle-question" aria-hidden="true"></i>
                        </div>
                        <strong class="site-tutorial-visual-title"></strong>
                        <span class="site-tutorial-visual-subtitle"></span>
                        <div class="site-tutorial-chips"></div>
                    </aside>
                    <section class="site-tutorial-copy">
                        <div class="site-tutorial-eyebrow"></div>
                        <h2 id="site-tutorial-title" class="site-tutorial-title"></h2>
                        <p class="site-tutorial-text"></p>
                        <ul class="site-tutorial-points"></ul>
                        <label class="site-tutorial-never-show">
                            <input type="checkbox" id="tutorial-never-show-checkbox">
                            <span>Não mostrar automaticamente novamente</span>
                        </label>
                    </section>
                </div>
                <div class="site-tutorial-actions">
                    <button type="button" class="btn btn-ghost site-tutorial-skip">Pular tutorial</button>
                    <button type="button" class="btn btn-ghost site-tutorial-prev">Anterior</button>
                    <button type="button" class="btn btn-primary site-tutorial-next">Próximo</button>
                </div>
            </div>
        `);

        renderStep(overlay, 0);

        const neverShowCheckbox = overlay.querySelector('#tutorial-never-show-checkbox');
        const skipBtn = overlay.querySelector('.site-tutorial-skip');
        const prevBtn = overlay.querySelector('.site-tutorial-prev');
        const nextBtn = overlay.querySelector('.site-tutorial-next');

        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                setNeverShowAutomatically(Boolean(neverShowCheckbox?.checked));
                closeActiveOverlay();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                renderStep(overlay, Math.max(0, currentStepIndex - 1));
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentStepIndex >= STEP_DEFINITIONS.length - 1) {
                    setNeverShowAutomatically(Boolean(neverShowCheckbox?.checked));
                    closeActiveOverlay();
                    if (forceManualOpen && typeof window.showToast === 'function') {
                        window.showToast('Tutorial concluído! Você pode abrir de novo pelo rodapé.', 'success');
                    }
                    return;
                }
                renderStep(overlay, currentStepIndex + 1);
            });
        }

        return true;
    }

    function showTutorialPrompt() {
        if (!isIndexPage() || shouldNeverShowAutomatically()) return;
        if (wasPromptedThisSession()) return;

        markPromptedThisSession();

        const overlay = mountOverlay(`
            <div class="site-tutorial-card site-tutorial-prompt" role="dialog" aria-modal="true" aria-labelledby="site-tutorial-prompt-title">
                <div class="site-tutorial-prompt__hero">
                    <div class="site-tutorial-visual-icon">
                        <i class="fas fa-user-astronaut" aria-hidden="true"></i>
                    </div>
                    <div>
                        <div class="site-tutorial-eyebrow">Boas-vindas</div>
                        <h2 id="site-tutorial-prompt-title" class="site-tutorial-title">Quer um tour rápido pela GameHub?</h2>
                    </div>
                </div>
                <p class="site-tutorial-text">Eu vou mostrar menu, busca, ofertas, rankings e o rodapé com ajuda. Em cada passo a área certa da tela fica destacada.</p>
                <label class="site-tutorial-never-show">
                    <input type="checkbox" id="tutorial-prompt-never-show-checkbox">
                    <span>Não mostrar automaticamente novamente</span>
                </label>
                <div class="site-tutorial-actions">
                    <button type="button" class="btn btn-ghost site-tutorial-no">Agora não</button>
                    <button type="button" class="btn btn-primary site-tutorial-yes">Sim, mostrar tutorial</button>
                </div>
            </div>
        `);

        const neverShowCheckbox = overlay.querySelector('#tutorial-prompt-never-show-checkbox');
        const noBtn = overlay.querySelector('.site-tutorial-no');
        const yesBtn = overlay.querySelector('.site-tutorial-yes');

        if (noBtn) {
            noBtn.addEventListener('click', () => {
                setNeverShowAutomatically(Boolean(neverShowCheckbox?.checked));
                closeActiveOverlay();
            });
        }

        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                setNeverShowAutomatically(Boolean(neverShowCheckbox?.checked));
                startTour(false);
            });
        }
    }

    function scheduleAutomaticPrompt() {
        if (!isIndexPage()) return;
        setTimeout(() => {
            showTutorialPrompt();
        }, 900);
    }

    function ensureFloatingHelperButton() {
        if (!isIndexPage()) return;
        if (document.getElementById('floating-tutorial-helper')) return;

        const helperBtn = document.createElement('button');
        helperBtn.id = 'floating-tutorial-helper';
        helperBtn.className = 'floating-tutorial-helper';
        helperBtn.type = 'button';
        helperBtn.setAttribute('aria-label', 'Abrir tutorial da loja');
        helperBtn.title = 'Ajuda rápida';
        helperBtn.innerHTML = `
            <span class="floating-helper-icon" aria-hidden="true">
                <i class="fas fa-user-astronaut"></i>
            </span>
            <span class="floating-helper-label">Ajuda</span>
        `;
        helperBtn.addEventListener('click', () => {
            if (typeof window.startSiteTutorial === 'function') {
                window.startSiteTutorial(true);
            }
        });

        document.body.appendChild(helperBtn);

        const footer = document.querySelector('.main-footer');
        if (footer && 'IntersectionObserver' in window) {
            spotlightObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    helperBtn.classList.toggle('is-over-footer', entry.isIntersecting);
                });
            }, { threshold: 0.18 });
            spotlightObserver.observe(footer);
        }
    }

    window.startSiteTutorial = (forceManualOpen = false) => {
        if (!isIndexPage()) return false;
        markPromptedThisSession();
        return startTour(Boolean(forceManualOpen));
    };

    if (window.auth && typeof window.auth.onAuthStateChanged === 'function') {
        let initialized = false;
        const fallbackTimer = setTimeout(() => {
            if (initialized) return;
            initialized = true;
            ensureFloatingHelperButton();
            scheduleAutomaticPrompt();
        }, 2200);

        window.auth.onAuthStateChanged(() => {
            if (initialized) return;
            initialized = true;
            clearTimeout(fallbackTimer);
            ensureFloatingHelperButton();
            scheduleAutomaticPrompt();
        });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            ensureFloatingHelperButton();
            scheduleAutomaticPrompt();
        });
    }
})();
