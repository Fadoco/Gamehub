/**
 * Lógica para renderizar a página de perfil do usuário.
 */
function renderProfile() {
    const container = document.getElementById('profile-content');
    const user = firebase.auth().currentUser;

    if (!container) return;

    if (!user) {
        container.innerHTML = `
            <div class="profile-container">
                <h2>Acesso Negado</h2>
                <p>Você precisa estar logado para ver seu perfil.</p>
                <button class="nav-button" onclick="window.location.href='login.html'">Ir para Login</button>
            </div>`;
        return;
    }

    // --- Cálculos de Destaques e Categorização ---
    const parsePrice = (p) => parseFloat(String(p).replace('R$', '').replace('Grátis', '0').replace(',', '.').trim()) || 0;

    // 1. Encontrar o jogo mais caro na biblioteca
    const ownedGames = allGamesData.filter(g => window.userLibrary.some(id => String(id) === String(g.id)));
    let mostExpensive = "Nenhum jogo na coleção";
    if (ownedGames.length > 0) {
        const expensiveGame = ownedGames.reduce((prev, curr) => parsePrice(curr.currentPrice) > parsePrice(prev.currentPrice) ? curr : prev);
        mostExpensive = `${expensiveGame.title} (${expensiveGame.currentPrice})`;
    }

    // 2. Pegar a compra mais recente do histórico
    let mostRecent = "Nenhuma compra registrada";
    if (window.userHistory && window.userHistory.length > 0) {
        mostRecent = window.userHistory[0].items.join(', '); // Pega os itens da última transação
    }

    // 3. Agrupar favoritos por categoria (tag)
    const favGames = allGamesData.filter(g => window.userFavorites.some(id => String(id) === String(g.id)));
    const favsByCategory = {};
    favGames.forEach(game => {
        game.tags.forEach(tag => {
            if (!favsByCategory[tag]) favsByCategory[tag] = [];
            favsByCategory[tag].push(game.title);
        });
    });

    const displayName = user.displayName || user.email.split('@')[0];
    const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=27ae60&color=fff`;

    container.innerHTML = `
        <div class="profile-container">
            <img src="${photoURL}" alt="Avatar" class="profile-avatar">
            <h1>${displayName}</h1>
            <p style="color: #bdc3c7;">${user.email}</p>
            <div class="profile-id" title="Use este ID no painel Admin para gerenciar seu saldo">ID: ${user.uid}</div>
            
            <div class="profile-stats">
                <div class="stat-item">
                    <span class="stat-value">R$ ${window.userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span class="stat-label">Saldo em Carteira</span>
                </div>
                <div class="stat-item" style="cursor:pointer" onclick="window.location.href='biblioteca.html'">
                    <span class="stat-value">${window.userLibrary.length}</span>
                    <span class="stat-label">Jogos na Biblioteca</span>
                </div>
                <div class="stat-item" style="cursor:pointer" onclick="window.location.href='carrinho.html'">
                    <span class="stat-value">${window.userCart.length}</span>
                    <span class="stat-label">Itens no Carrinho</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${window.userFavorites.length}</span>
                    <span class="stat-label">Favoritos</span>
                </div>
            </div>

            <div class="profile-section">
                <h2>Destaques da Coleção</h2>
                <div class="highlight-grid">
                    <div class="highlight-card">
                        <span class="highlight-label">Mais Recente Adquirido</span>
                        <span class="highlight-title">${mostRecent}</span>
                    </div>
                    <div class="highlight-card">
                        <span class="highlight-label">Item mais Valioso</span>
                        <span class="highlight-title">${mostExpensive}</span>
                    </div>
                </div>
            </div>

            <div class="profile-section">
                <h2>Favoritos por Categoria</h2>
                ${Object.keys(favsByCategory).length === 0 ? '<p style="color:#7f8c8d">Você ainda não favoritou nenhum jogo.</p>' : 
                    Object.entries(favsByCategory).map(([tag, titles]) => `
                        <span class="fav-category-title">${tag}</span>
                        <div class="fav-list">
                            ${titles.map(t => `<div class="fav-item">${t}</div>`).join('')}
                        </div>
                    `).join('')
                }
            </div>
        </div>
    `;
}