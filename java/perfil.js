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

    // 1. Encontrar o jogo mais caro na biblioteca
    const ownedGames = allGamesData.filter(g => window.userLibrary.some(id => String(id) === String(g.id)));
    let mostExpensive = "Nenhum jogo na coleção";
    if (ownedGames.length > 0) {
        const expensiveGame = ownedGames.reduce((prev, curr) => utils.parsePrice(curr.currentPrice) > utils.parsePrice(prev.currentPrice) ? curr : prev);
        mostExpensive = `${expensiveGame.title} (${expensiveGame.currentPrice})`;
    }

    // 2. Pegar a compra mais recente do histórico
    let mostRecent = "Nenhuma compra registrada";
    if (window.userHistory && window.userHistory.length > 0) {
        mostRecent = Array.isArray(window.userHistory[0].items) ? window.userHistory[0].items.join(', ') : "Nenhuma compra registrada";
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
    const photoURL = window.userAvatar || user.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=27ae60&color=fff`;

    let bannerHtml = '';
    if (window.userBannerURL) {
        if (window.userBannerType === 'video') {
            bannerHtml = `<video class="profile-banner-media" src="${window.userBannerURL}" autoplay muted loop></video>`;
        } else {
            bannerHtml = `<img class="profile-banner-media" src="${window.userBannerURL}" alt="Banner">`;
        }
    } else {
        bannerHtml = `<div class="profile-banner-media" style="background: var(--gradient);"></div>`;
    }

    container.innerHTML = `
        <div class="profile-banner-container">
            ${bannerHtml}
        </div>
        <div class="profile-container">
            <button class="btn-edit-profile" onclick="toggleEditProfile()"><i class="fas fa-edit"></i> Editar Perfil</button>
            
            <img src="${photoURL}" alt="Avatar" class="profile-avatar">
            <h1>${displayName}</h1>
            <p style="color: #bdc3c7;">${user.email}</p>

            <div id="edit-profile-form" class="edit-profile-form">
                <h3>Personalizar Perfil</h3>
                <div class="form-group">
                    <label>Novo Nickname</label>
                    <input type="text" id="edit-nick" value="${displayName}">
                </div>
                <div class="form-group">
                    <label>Bio / Descrição</label>
                    <textarea id="edit-bio" rows="3">${window.userBio}</textarea>
                </div>
                <div class="form-group">
                    <label>URL da Foto de Perfil</label>
                    <input type="url" id="edit-avatar" value="${window.userAvatar}" placeholder="Link da imagem">
                </div>
                <div class="form-group">
                    <label>URL do Banner</label>
                    <input type="url" id="edit-banner-url" value="${window.userBannerURL}" placeholder="Link da imagem ou vídeo">
                </div>
                <div class="form-group">
                    <label>Tipo de Banner</label>
                    <select id="edit-banner-type">
                        <option value="image" ${window.userBannerType === 'image' ? 'selected' : ''}>Imagem</option>
                        <option value="video" ${window.userBannerType === 'video' ? 'selected' : ''}>Vídeo</option>
                    </select>
                </div>
                <button class="buy-button" onclick="saveProfileChanges()">Salvar Alterações</button>
            </div>

            <p class="profile-bio">${window.userBio || 'Nenhuma descrição adicionada.'}</p>

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

window.toggleEditProfile = () => {
    const form = document.getElementById('edit-profile-form');
    if (form) form.style.display = form.style.display === 'flex' ? 'none' : 'flex';
};

window.saveProfileChanges = async () => {
    const nick = document.getElementById('edit-nick').value;
    const bio = document.getElementById('edit-bio').value;
    const avatarURL = document.getElementById('edit-avatar').value;
    const bannerURLInput = document.getElementById('edit-banner-url').value;
    let bannerType = document.getElementById('edit-banner-type').value;

    const user = firebase.auth().currentUser;
    if (!user) return;

    toggleLoader(true);
    try {
        let finalAvatar = avatarURL;
        let finalBanner = bannerURLInput;

        // Atualiza o Display Name no Firebase Auth
        await user.updateProfile({ displayName: nick, photoURL: finalAvatar });
        
        // Atualiza os dados no Firestore
        await window.db.collection('users').doc(user.uid).update({
            displayName: nick,
            bio: bio,
            avatar: finalAvatar,
            bannerURL: finalBanner,
            bannerType: bannerType
        });

        showToast("Perfil atualizado com sucesso!", "success");
        location.reload(); // Recarrega para aplicar as mudanças
    } catch (e) {
        console.error("Erro ao atualizar perfil:", e);
        showToast("Erro ao salvar alterações.", "error");
    } finally {
        toggleLoader(false);
    }
};