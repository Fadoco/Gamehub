/**
 * GameHub - Componentes HTML Reutilizáveis
 * JavaScript para injetar componentes comuns (header, footer) de forma dinâmica
 * Isso evita duplicação e facilita manutenção
 */

/**
 * Injeta o header padrão do GameHub
 * @param {string} currentPage - Nome da página atual para marcar ativo (ex: 'biblioteca')
 * @param {string} pathPrefix - Prefixo do caminho relativo (ex: '../' para páginas em /html/)
 */
window.injectGameHubHeader = (currentPage = '', pathPrefix = '') => {
    const headerHTML = `
    <header class="topbar" role="banner">
        <div class="topbar__left">
            <div class="brand" onclick="window.location.href='${pathPrefix}index.html'" role="button" tabindex="0" aria-label="Ir para página inicial">GameHub</div>
            <nav class="topbar__menu" aria-label="Navegação Principal">
                <a href="${pathPrefix}html/biblioteca.html" ${currentPage === 'biblioteca' ? 'class="active"' : ''}>Biblioteca</a>
                <a href="${pathPrefix}Roleta/roleta.html" ${currentPage === 'roleta' ? 'class="active"' : ''}>Roleta</a>
                <a href="${pathPrefix}html/ranking.html" ${currentPage === 'ranking' ? 'class="active"' : ''}>Ranking</a>
                <a href="${pathPrefix}html/carrinho.html" ${currentPage === 'carrinho' ? 'class="active"' : ''}>Carrinho</a>
            </nav>
        </div>
        <div class="topbar__actions" role="region" aria-label="Ações do Usuário">
            <div id="user-wallet" class="wallet-widget" style="display: none;" onclick="window.location.href='${pathPrefix}html/historico.html'" role="button" tabindex="0" aria-label="Carteira - Clique para ver histórico">
                <i class="fas fa-coins" aria-hidden="true"></i>
                <span id="wallet-amount">R$ 0,00</span>
            </div>
            <div id="user-menu" style="display: flex; align-items: center; gap: 15px;"></div>
            <button id="btn-login" class="btn btn-primary" aria-label="Abrir modal de login">Entrar</button>
        </div>
    </header>

    <header class="main-header" role="region" aria-label="Barra de Pesquisa e Filtros">
        <div class="searchbar">
            <i class="fas fa-search searchbar__icon" aria-hidden="true"></i>
            <input type="search" id="main-search" placeholder="Pesquisar na loja..." aria-label="Pesquisar jogos">
        </div>
        <nav class="section-nav" aria-label="Navegação Secundária">
            <button id="btn-random-game" class="btn btn-ghost" onclick="window.handleRandomGame()" aria-label="Sugerir jogo aleatório">
                <i class="fas fa-dice" aria-hidden="true"></i> Jogo Aleatório
            </button>
        </nav>
    </header>
    `;

    return headerHTML;
};

/**
 * Injeta o footer padrão do GameHub
 */
window.injectGameHubFooter = (pathPrefix = '') => {
    const footerHTML = `
    <footer class="main-footer" role="contentinfo">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>GameHub</h3>
                    <p>Sua loja independente preferida para descobrir novos mundos.</p>
                </div>
                <div class="footer-section">
                    <h3>Navegação</h3>
                    <ul role="list">
                        <li><a href="${pathPrefix}index.html">Loja</a></li>
                        <li><a href="${pathPrefix}html/biblioteca.html">Biblioteca</a></li>
                        <li><a href="${pathPrefix}html/carrinho.html">Carrinho</a></li>
                        <li><a href="${pathPrefix}html/historico.html">Histórico</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h3>Suporte</h3>
                    <ul role="list">
                        <li><a href="#">Ajuda</a></li>
                        <li><a href="#">Reembolsos</a></li>
                        <li><a href="#">Privacidade</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h3>Siga-nos</h3>
                    <div class="social-icons" role="list">
                        <a href="#" role="listitem" aria-label="Discord"><i class="fab fa-discord" aria-hidden="true"></i></a>
                        <a href="#" role="listitem" aria-label="Instagram"><i class="fab fa-instagram" aria-hidden="true"></i></a>
                        <a href="#" role="listitem" aria-label="Twitter"><i class="fab fa-twitter" aria-hidden="true"></i></a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">&copy; 2026 GameHub. Todos os direitos reservados.</div>
        </div>
    </footer>
    `;

    return footerHTML;
};

/**
 * Injeta o modal de login padrão
 */
window.injectLoginModal = () => {
    const modalHTML = `
    <div id="login-modal" class="modal" style="display: none;" role="dialog" aria-labelledby="modal-title" aria-hidden="true">
        <div class="modal-content">
            <button class="close-modal" aria-label="Fechar modal">&times;</button>
            <h2 id="modal-title">Entrar no GameHub</h2>
            <form id="login-form">
                <fieldset>
                    <legend class="sr-only">Formulário de Login</legend>
                    <div class="form-group">
                        <label for="email">E-mail</label>
                        <input type="email" id="email" name="email" placeholder="E-mail" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Senha</label>
                        <input type="password" id="password" name="password" placeholder="Senha" required>
                    </div>
                </fieldset>
                <button type="submit" class="btn btn-primary btn-block">Entrar</button>
                <p class="toggle-form" onclick="window.toggleModalForms()" role="button" tabindex="0">Ainda não tem conta? Cadastre-se</p>
            </form>

            <form id="signup-form" style="display: none;">
                <fieldset>
                    <legend class="sr-only">Formulário de Cadastro</legend>
                    <div class="form-group">
                        <label for="signup-name">Nome</label>
                        <input type="text" id="signup-name" name="signup-name" placeholder="Seu Nome" required>
                    </div>
                    <div class="form-group">
                        <label for="signup-email">E-mail</label>
                        <input type="email" id="signup-email" name="signup-email" placeholder="E-mail" required>
                    </div>
                    <div class="form-group">
                        <label for="signup-password">Senha</label>
                        <input type="password" id="signup-password" name="signup-password" placeholder="Senha" required>
                    </div>
                </fieldset>
                <button type="submit" class="btn btn-primary btn-block">Criar Conta</button>
                <p class="toggle-form" onclick="window.toggleModalForms()" role="button" tabindex="0">Já tem conta? Entre</p>
            </form>
        </div>
    </div>
    `;

    return modalHTML;
};

/**
 * Injeta o overlay de carregamento global
 */
window.injectLoadingOverlay = () => {
    const overlayHTML = `
    <div id="loading-overlay" style="display: none;" role="status" aria-label="Carregando conteúdo">
        <div class="spinner" aria-hidden="true"></div>
        <p>AGUARDE...</p>
    </div>
    `;

    return overlayHTML;
};

/**
 * Função auxiliar para inicializar componentes em uma página
 * Deve ser chamada ao final do HTML de cada página
 * @param {string} currentPage - Nome da página (ex: 'biblioteca', 'ranking', etc)
 * @param {string} pathPrefix - Prefixo do caminho (ex: '../' para /html/, '', ou 'html/' para root)
 */
window.initializePageComponents = (currentPage = '', pathPrefix = '../') => {
    // Nota: Esta função é um placeholder para quando os componentes forem injetados dinamicamente
    // Por enquanto, os HTMLs estão hardcoded em cada página
};

// Exportar para uso em outras páginas (se necessário)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        injectGameHubHeader,
        injectGameHubFooter,
        injectLoginModal,
        injectLoadingOverlay
    };
}
