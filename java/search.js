/**
 * Lógica específica para o sistema de busca em tempo real e sugestões dinâmicas.
 */

// Função de Debounce: Evita processamento excessivo durante a digitação
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function initSearch() {
    const searchInput = document.getElementById('main-search');
    const searchIcon = document.querySelector('.searchbar__icon');
    const searchBox = document.querySelector('.searchbar');
    
    if (!searchInput) return;

    // Cria o container de sugestões dinamicamente caso não exista
    let suggestionsContainer = document.getElementById('search-suggestions');
    if (!suggestionsContainer) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'search-suggestions';
        suggestionsContainer.className = 'search-suggestions';
        searchBox.appendChild(suggestionsContainer);
    }

    const processInput = (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const searchWords = searchTerm.split(' ').filter(word => word.length > 0);

        // 2. Lógica das Sugestões (Dropdown)
        if (searchWords.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        // Busca inteligente: o jogo deve conter todas as palavras da pesquisa no título ou nas tags
        const matchedGames = (window.allGamesData || []).filter(game => {
            const gameData = (game.title + ' ' + game.tags.join(' ')).toLowerCase();
            return searchWords.every(word => gameData.includes(word));
        }).slice(0, 3); // Limita a 3 sugestões de jogos

        // Busca categorias (tags) que combinam
        const allTags = [...new Set((window.allGamesData || []).flatMap(game => game.tags))];
        const matchedTags = allTags.filter(tag => 
            tag.toLowerCase().includes(searchTerm)
        ).slice(0, 2); // Limita a 2 tags

        renderSuggestions(matchedGames, matchedTags, suggestionsContainer, performSearch);
    };

    // Aplica o debounce de 300ms no input
    searchInput.addEventListener('input', debounce(processInput, 300));

    // 3. Lógica de Redirecionamento (Enter ou Lupa)
    const performSearch = (query) => {
        const term = query || searchInput.value.trim();
        if (!term) return;
        window.location.href = `${window.utils.getHtmlPath('busca.html')}?q=${encodeURIComponent(term)}`;
    };

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    searchIcon.addEventListener('click', () => performSearch());

    // Fecha o dropdown ao clicar fora da busca
    document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });

    // Delegação de Eventos para categorias dinâmicas
    document.addEventListener('click', (e) => {
        const categoryBtn = e.target.closest('.category-pill');
        if (categoryBtn) {
            const tag = categoryBtn.querySelector('span')?.textContent || categoryBtn.getAttribute('data-tag');
            if (tag) performSearch(tag);
        }
    });
}

function renderSuggestions(games, tags, container, performSearch) {
    container.innerHTML = '';
    
    if (games.length === 0 && tags.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    // Adiciona jogos sugeridos (Mini-Cards)
    games.forEach(game => {
        const div = document.createElement('div');
        div.className = 'suggestion-card';
        div.innerHTML = `
            <img src="${game.coverUrl || game.image}" alt="${game.title}" referrerpolicy="no-referrer">
            <div class="suggestion-text">
                <span class="suggestion-name">${game.title}</span>
                <span class="suggestion-meta">Jogo</span>
            </div>
        `;
        div.onclick = () => window.location.href = window.utils.getHtmlPath(`jogo.html?id=${game.id}`);
        container.appendChild(div);
    });

    // Adiciona categorias sugeridas abaixo dos jogos
    tags.forEach(tag => {
        const div = document.createElement('div');
        div.className = 'suggestion-card';
        div.innerHTML = `
            <i class="fas fa-tag"></i>
            <div class="suggestion-text">
                <span class="suggestion-name">${tag}</span>
                <span class="suggestion-meta">Categoria</span>
            </div>
        `;
        div.onclick = () => {
            performSearch(tag);
        };
        container.appendChild(div);
    });
}

// Inicia a escuta do campo de busca assim que o site carregar
document.addEventListener('DOMContentLoaded', initSearch);