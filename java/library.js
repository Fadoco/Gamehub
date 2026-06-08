/**
 * Lógica específica para a página de Biblioteca.
 */

window.renderLibrary = () => {
    const libraryGrid = document.getElementById('library-grid');
    if (!libraryGrid) {
        console.error("Elemento #library-grid não encontrado na página da Biblioteca.");
        return;
    }

    if (!window.allGamesData || window.allGamesData.length === 0) {
        libraryGrid.innerHTML = '<p class="empty-library">Carregando jogos...</p>';
        return;
    }

    const userGames = window.allGamesData.filter(game => 
        window.userLibrary.some(libId => String(libId) === String(game.id))
    );

    if (userGames.length === 0) {
        libraryGrid.innerHTML = '<div id="library-empty"><p>Sua biblioteca está vazia. Que tal explorar a <a href="../index.html">loja</a>?</p></div>';
        return;
    }

    window.renderToContainer(userGames, libraryGrid);
};