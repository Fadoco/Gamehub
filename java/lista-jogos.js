/**
 * Lógica para exibir a lista completa de todos os jogos do catálogo.
 */

console.log('✅ lista-jogos.js loaded');

window.renderAllGamesList = function(games) {
    const grid = document.getElementById('all-games-grid');
    const countBadge = document.getElementById('games-count');

    if (!grid || !games || !games.length) return;

    if (countBadge) {
        countBadge.textContent = games.length;
    }

    window.renderToContainer(games, grid, true);
};

// Renderizar quando dados estiverem disponíveis
if (window.allGamesData && window.allGamesData.length > 0) {
    window.renderAllGamesList(window.allGamesData);
}

// Escutar atualizações
window.addEventListener('gamesDataLoaded', () => {
    if (window.allGamesData) window.renderAllGamesList(window.allGamesData);
});
