/**
 * Lógica para processar e exibir os resultados na página busca.html
 */

window.renderSearchResults = function(games) {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q')?.toLowerCase().trim() || "";
    const queryWords = query.split(' ').filter(w => w.length > 0);
    
    const queryDisplay = document.getElementById('search-query-text');
    if (queryDisplay) queryDisplay.textContent = query;

    if (queryWords.length === 0) {
        if (queryDisplay) queryDisplay.textContent = "nenhum termo digitado";
        return;
    }

    // Filtragem Inteligente com Ranqueamento
    const results = games.map(game => {
        const title = game.title.toLowerCase();
        const tags = game.tags.map(t => t.toLowerCase());
        let score = 0;

        // Verifica se todas as palavras da busca estão presentes
        const matchesAll = queryWords.every(word => title.includes(word) || tags.some(t => t.includes(word)));
        
        if (matchesAll) {
            // Sistema de pontuação para ordenação
            if (title === query) score += 100; // Correspondência exata de título
            if (title.startsWith(query)) score += 50; // Começa com o termo
            queryWords.forEach(word => {
                if (title.includes(word)) score += 10; // Palavra no título
                if (tags.includes(word)) score += 5; // Palavra exata na tag
            });
        }

        return { ...game, score };
    }).filter(game => game.score > 0);

    // Ordena por score (maior primeiro)
    const filteredGames = results.sort((a, b) => b.score - a.score);

    const grid = document.getElementById('grid-busca');
    const footer = document.getElementById('footer-busca');
    
    if (grid) {
        if (filteredGames.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px;">
                                <h3>Nenhum jogo encontrado para "${query}"</h3>
                                <p>Tente termos mais genéricos ou verifique a ortografia.</p>
                              </div>`;
        } else {
            window.renderToContainer(filteredGames, grid, true);
        }
    }
};