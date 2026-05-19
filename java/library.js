/**
 * Lógica para exibir os jogos da biblioteca do usuário.
 */

function renderLibrary() {
    const grid = document.getElementById('library-grid');
    const emptyMsg = document.getElementById('library-empty');
    
    if (!grid || !allGamesData.length) return;

    // Filtra apenas os jogos que estão na lista de biblioteca do usuário
    const libraryGames = allGamesData.filter(game => window.userLibrary.some(libId => String(libId) === String(game.id)));

    if (libraryGames.length === 0) {
        grid.innerHTML = '';
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
        // Reutilizamos a função de renderização global
        window.renderToContainer(libraryGames, grid, true);
    }
}