/**
 * Lógica para exibir a lista completa de todos os jogos do catálogo.
 */

window.renderAllGamesList = function(games) {
    const grid = document.getElementById('all-games-grid');
    const countBadge = document.getElementById('games-count');

    if (!grid || !games || !games.length) return;

    if (countBadge) {
        countBadge.textContent = games.length;
    }

    window.renderToContainer(games, grid, true);
};