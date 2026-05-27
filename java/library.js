/**
 * Lógica para exibir os jogos da biblioteca do usuário.
 */

function renderLibrary() {
    const grid = document.getElementById('library-grid');
    const emptyMsg = document.getElementById('library-empty');
    const titleElement = document.querySelector('main h1');
    
    if (!grid || !allGamesData.length) return;
    if (!grid || !window.allGamesData.length) return;

    // Filtra apenas os jogos que estão na lista de biblioteca do usuário
    const libraryGames = window.allGamesData.filter(game => window.userLibrary.some(libId => String(libId) === String(game.id)));

    if (titleElement) {
        titleElement.innerHTML = `Minha Biblioteca <span style="font-size: 0.5em; color: var(--secondary); vertical-align: middle; background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 20px; margin-left: 10px;">${libraryGames.length} Jogos</span>`;
    }

    if (libraryGames.length === 0) {
        grid.innerHTML = '';
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
        // Reutilizamos a função de renderização global
        window.renderToContainer(libraryGames, grid, true);
    }
}