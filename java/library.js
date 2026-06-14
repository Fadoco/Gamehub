/**
 * Lógica para exibir os jogos da biblioteca do usuário.
 */

console.log('✅ library.js loaded');

window.renderLibrary = function() {
    console.log("Iniciando renderização da biblioteca...");
    
    const grid = document.getElementById('library-grid');
    const emptyMsg = document.getElementById('library-empty');
    const countBadge = document.getElementById('library-count');

    // Se o grid não existe, não estamos na página correta
    if (!grid) return;

    // Se os dados dos jogos ainda não carregaram, abortamos (o global.js chamará novamente depois)
    if (!window.allGamesData || window.allGamesData.length === 0) {
        console.warn("Biblioteca: Catálogo de jogos ainda não disponível.");
        return;
    }

    // Filtra apenas os jogos que estão na lista de biblioteca do usuário, 
    // garantindo comparação de string para evitar erro de tipo (ID 1 vs ID "1")
    const libraryGames = window.allGamesData.filter(game => 
        window.userLibrary && window.userLibrary.some(libId => String(libId) === String(game.id))
    );

    console.log(`Jogos encontrados na biblioteca: ${libraryGames.length}`);

    if (countBadge) countBadge.textContent = libraryGames.length;

    if (libraryGames.length === 0) {
        grid.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = 'block';
    } else {
        if (emptyMsg) emptyMsg.style.display = 'none';
        // Reutilizamos a função de renderização global
        window.renderToContainer(libraryGames, grid, true);
    }
};

// Registra o renderizador no sistema global para que o global.js saiba como atualizar esta página
if (window.addPageRenderer) {
    window.addPageRenderer('biblioteca.html', window.renderLibrary);
}

// Fallback: Caso o script carregue após os dados, tenta renderizar imediatamente
document.addEventListener('DOMContentLoaded', () => {
    if (window.allGamesData && window.allGamesData.length > 0) window.renderLibrary();
});
