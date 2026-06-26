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
            text: 'Aqui você acessa Biblioteca, Roleta, Ranking, Empréstimo, Revenda e Carrinho.',
            selector: '.topbar__menu'
        },
        {
            title: 'Busca e atalhos',
            text: 'Use a barra para pesquisar jogos e o botão aleatório para descobrir novidades.',
            selector: '.main-header'
        },
        {
            title: 'Destaques da loja',
            text: 'Essa área mostra promoções, coleções e os jogos mais populares.',
            selector: '.hero-section'
        },
        {
            title: 'Sua conta',
            text: 'No topo você acompanha saldo, notificações, perfil e acesso ao histórico.',
            selector: '.topbar__actions'
        },
        {
            title: 'Rodapé e ajuda',
            text: 'No rodapé ficam atalhos úteis, suporte e o botão de ajuda para abrir este tutorial de novo.',
            selector: '.main-footer'
        }
    ];

    let activeOverlay = null;
    let currentStepIndex = 0;

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

    function closeActiveOverlay() {
        if (!activeOverlay) return;
        clearTutorialHighlight();
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

    function renderStep(overlay, stepIndex) {
        const step = STEP_DEFINITIONS[stepIndex];
        if (!step) return;

        currentStepIndex = stepIndex;
        const targetElement = step.selector ? document.querySelector(step.selector) : null;
        clearTutorialHighlight();
        if (targetElement) {
            targetElement.classList.add('tutorial-highlight-target');
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const progress = overlay.querySelector('.site-tutorial-progress');
        const title = overlay.querySelector('.site-tutorial-title');
        const text = overlay.querySelector('.site-tutorial-text');
        const prevBtn = overlay.querySelector('.site-tutorial-prev');
        const nextBtn = overlay.querySelector('.site-tutorial-next');

        if (progress) progress.textContent = `Passo ${stepIndex + 1} de ${STEP_DEFINITIONS.length}`;
        if (title) title.textContent = step.title;
        if (text) text.textContent = step.text;
        if (prevBtn) prevBtn.disabled = stepIndex === 0;
        if (nextBtn) nextBtn.textContent = stepIndex === STEP_DEFINITIONS.length - 1 ? 'Finalizar' : 'Próximo';
    }

    function startTour(forceManualOpen = false) {
        if (!isIndexPage()) return false;

        const overlay = mountOverlay(`
            <div class="site-tutorial-card" role="dialog" aria-modal="true" aria-labelledby="site-tutorial-title">
                <div class="site-tutorial-progress"></div>
                <h2 id="site-tutorial-title" class="site-tutorial-title"></h2>
                <p class="site-tutorial-text"></p>
                <label class="site-tutorial-never-show">
                    <input type="checkbox" id="tutorial-never-show-checkbox">
                    Não mostrar automaticamente novamente
                </label>
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
                <h2 id="site-tutorial-prompt-title" class="site-tutorial-title">Quer uma explicação rápida do site?</h2>
                <p class="site-tutorial-text">Podemos te guiar em poucos passos mostrando tudo que a GameHub oferece.</p>
                <label class="site-tutorial-never-show">
                    <input type="checkbox" id="tutorial-prompt-never-show-checkbox">
                    Não mostrar automaticamente novamente
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
            scheduleAutomaticPrompt();
        }, 2200);

        window.auth.onAuthStateChanged(() => {
            if (initialized) return;
            initialized = true;
            clearTimeout(fallbackTimer);
            scheduleAutomaticPrompt();
        });
    } else {
        document.addEventListener('DOMContentLoaded', scheduleAutomaticPrompt);
    }
})();
