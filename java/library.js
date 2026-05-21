/**
 * Lógica para exibir os jogos da biblioteca do usuário.
 */

function renderLibrary() {
    // Centralizando o acesso aos elementos DOM
    const elements = {
        grid: document.getElementById('library-grid'),
        emptyMsg: document.getElementById('library-empty'),
        titleElement: document.querySelector('main h1')
    };
    
    // Verifica se os elementos necessários e os dados globais estão disponíveis
    if (!elements.grid || !window.allGamesData || !window.allGamesData.length) return;

    // Filtra apenas os jogos que estão na lista de biblioteca do usuário
    const libraryGames = window.allGamesData.filter(game => 
        window.userLibrary && window.userLibrary.some(libId => String(libId) === String(game.id))
    );

    if (elements.titleElement) {
        elements.titleElement.innerHTML = `Minha Biblioteca <span style="font-size: 0.5em; color: var(--secondary); vertical-align: middle; background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 20px; margin-left: 10px;">${libraryGames.length} Jogos</span>`;
    }

    if (libraryGames.length === 0) {
        elements.grid.innerHTML = '';
        if (elements.emptyMsg) elements.emptyMsg.style.display = 'block';
    } else {
        if (elements.emptyMsg) elements.emptyMsg.style.display = 'none';
        // Reutilizamos a função de renderização global
        window.renderToContainer(libraryGames, elements.grid, true);
    }
}

document.addEventListener('DOMContentLoaded', renderLibrary);