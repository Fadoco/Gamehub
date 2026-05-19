/**
 * Lógica global para carregar dados e inicializar funcionalidades comuns.
 */

let allGamesData = []; // Armazenar os dados dos jogos globalmente para acesso por outros scripts

async function fetchGamesData() {
    try {
        // Tenta carregar do Firestore primeiro (Melhor Performance e Escala)
        if (typeof db !== 'undefined') {
            const snapshot = await db.collection('games').get();
            if (!snapshot.empty) {
                allGamesData = snapshot.docs.map(doc => ({
                    firestoreId: doc.id,
                    ...doc.data()
                }));
                console.log("Dados carregados via Firestore");
            }
        }

        // Se o Firestore estiver vazio ou falhar, usa o fallback JSON
        if (allGamesData.length === 0) {
            const isSubfolder = window.location.pathname.includes('/html/');
            const jsonPath = isSubfolder ? '../json/games.json' : 'json/games.json';
            const response = await fetch(jsonPath);
            allGamesData = await response.json();
        }

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