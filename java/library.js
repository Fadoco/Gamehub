/**
 * Lógica para exibir os jogos da biblioteca do usuário.
 */

function renderLibrary() {
    const grid = document.getElementById('library-grid');
    const emptyMsg = document.getElementById('library-empty');
    const countBadge = document.getElementById('library-count');

    if (!grid || !window.allGamesData || !window.allGamesData.length) return;

    // Filtra apenas os jogos que estão na lista de biblioteca do usuário
    const libraryGames = window.allGamesData.filter(game => window.userLibrary.some(libId => String(libId) === String(game.id)));

    if (countBadge) countBadge.textContent = libraryGames.length;

    if (libraryGames.length === 0) {
        grid.innerHTML = '';
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
        // Reutilizamos a função de renderização global
        window.renderToContainer(libraryGames, grid, true);
    }
}