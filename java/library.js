/**
 * Lógica para exibir os jogos da biblioteca do usuário.
 */

function renderLibrary() {
    const grid = document.getElementById('library-grid');
    const emptyMsg = document.getElementById('library-empty');
    
    if (!grid || !allGamesData.length) return;

    // Filtra apenas os jogos que estão na lista de biblioteca do usuário
    const libraryGames = allGamesData.filter(game => window.userLibrary.includes(game.id));

    if (libraryGames.length === 0) {
        grid.innerHTML = '';
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
        // Reutilizamos a função de renderização do home.js (ela precisa estar carregada)
        if (typeof renderToContainer === 'function') {
            renderToContainer(libraryGames, grid, true);
        }
    }
}

// Aguarda os dados globais serem carregados para renderizar
document.addEventListener('DOMContentLoaded', () => {
    // Como fetchGamesData é assíncrono, verificamos em intervalos ou após o load
    const checkData = setInterval(() => {
        if (allGamesData.length > 0) {
            renderLibrary();
            clearInterval(checkData);
        }
    }, 100);
});