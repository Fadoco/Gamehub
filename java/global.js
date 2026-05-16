/**
 * Lógica global para carregar dados e inicializar funcionalidades comuns.
 */

let allGamesData = []; // Armazenar os dados dos jogos globalmente para acesso por outros scripts

async function fetchGamesData() {
    try {
        // Detecta se o arquivo está dentro de uma subpasta para ajustar o caminho do fetch
        const isSubfolder = window.location.pathname.includes('/html/') || window.location.pathname.includes('/jogo.html');
        const jsonPath = isSubfolder ? '../json/games.json' : 'json/games.json';

        const response = await fetch(jsonPath);
        allGamesData = await response.json(); // Armazena os dados

        // Decide qual função de renderização chamar com base na página atual
        if (window.location.pathname.includes('jogo.html')) {
            // Verifica se a função renderGameDetails está disponível (carregada por jogo.js)
            if (typeof renderGameDetails === 'function') {
                renderGameDetails(allGamesData);
            } else {
                console.warn("renderGameDetails não está definida. Verifique se jogo.js foi carregado.");
            }
        } else if (window.location.pathname.includes('busca.html')) {
            if (typeof renderSearchResults === 'function') {
                renderSearchResults(allGamesData);
            } else {
                console.warn("renderSearchResults não está definida. Verifique se busca.js foi carregado.");
            }
        } else { // Assumimos que é a página inicial ou outra que lista jogos
            // Verifica se a função renderGames está disponível (carregada por home.js)
            if (typeof renderGames === 'function') {
                renderGames(allGamesData);
            } else {
                console.warn("renderGames não está definida. Verifique se home.js foi carregado.");
            }
        }
    } catch (error) {
        console.error("Erro ao carregar o catálogo de jogos:", error);
    }
}

document.addEventListener('DOMContentLoaded', fetchGamesData);