/**
 * Lógica do Painel de Controle de Usuário Específico
 */

let targetUid = new URLSearchParams(window.location.search).get('uid');
let targetUserData = null;

async function initUserDetail() {
    if (!targetUid) return window.location.href = 'admin.html';
    if (!window.db || !window.allGamesData.length) return setTimeout(initUserDetail, 500);

    // Escuta mudanças em tempo real no usuário selecionado
    window.db.collection('users').doc(targetUid).onSnapshot(doc => {
        if (!doc.exists) {
            alert("Usuário não encontrado!");
            window.location.href = 'admin.html';
            return;
        }
        targetUserData = doc.data();
        renderUserPanel();
    });
}

function renderUserPanel() {
    const infoDiv = document.getElementById('user-info-display');
    const headerDiv = document.getElementById('target-user-header');
    const libraryDiv = document.getElementById('user-library-list');
    const historyTable = document.getElementById('user-history-table');

    const userName = window.utils.getUserFriendlyName({ ...targetUserData, id: targetUid });
    
    headerDiv.textContent = `Editando: ${userName}`;
    
    infoDiv.innerHTML = `
        <div class="admin-panel-card" style="margin-bottom: 20px; border-left: 4px solid var(--accent);">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${targetUserData.email || 'Não informado'}</p>
            <p style="margin: 5px 0;"><strong>UID:</strong> <small style="font-family: monospace; opacity: 0.6;">${targetUid}</small></p>
            <p style="font-size: 1.4rem; color: #4ade80; margin: 15px 0 0 0; font-weight: 800;">
                <i class="fas fa-coins"></i> R$ ${(targetUserData.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
        </div>
    `;

    // Renderizar Biblioteca
    const libIds = targetUserData.library || [];
    if (libIds.length === 0) {
        libraryDiv.innerHTML = "<p style='padding: 20px; opacity: 0.5;'>Este usuário não possui jogos.</p>";
    } else {
        libraryDiv.innerHTML = libIds.map(id => {
            const game = window.allGamesData.find(g => String(g.id) === String(id));
            return `
                <div class="user-admin-card" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; gap: 15px; margin-bottom: 10px; background: rgba(255,255,255,0.02);">
                    <div style="flex: 1;">
                        <div class="user-name" style="font-size: 1rem;">${game ? game.title : 'Jogo ID: ' + id}</div>
                        <div class="user-id">ID: ${id}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label style="font-size: 10px; color: var(--text-secondary);">RANK:</label>
                        <select class="admin-select" onchange="updateGameRank('${id}', this.value)" style="background: #111; color: #fff; border: 1px solid #333; padding: 5px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                            <option value="0" ${(targetUserData.upgrades?.[id] || 0) == 0 ? 'selected' : ''}>Padrão</option>
                            <option value="1" ${(targetUserData.upgrades?.[id] || 0) == 1 ? 'selected' : ''}>Raro (+)</option>
                            <option value="2" ${(targetUserData.upgrades?.[id] || 0) == 2 ? 'selected' : ''}>Épico (++)</option>
                            <option value="3" ${(targetUserData.upgrades?.[id] || 0) == 3 ? 'selected' : ''}>Lendário (+++)</option>
                            <option value="4" ${(targetUserData.upgrades?.[id] || 0) == 4 ? 'selected' : ''}>Dark Matter (!!!!)</option>
                        </select>
                    </div>
                    <button class="nav-button" onclick="removeGameFromUser('${id}')" style="color: #e74c3c; border-color: rgba(231, 76, 60, 0.3);">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    // Renderizar Histórico
    const history = targetUserData.history || [];
    historyTable.innerHTML = history.map(h => `
        <tr>
            <td>${new Date(h.date).toLocaleDateString('pt-BR')} às ${new Date(h.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td>
            <td>${h.items.join(', ')}</td>
            <td>R$ ${h.total.toFixed(2)}</td>
        </tr>
    `).join('');
}

window.updateUserBalance = async () => {
    const input = document.getElementById('new-balance-input');
    const value = parseFloat(input.value);
    
    if (isNaN(value)) return showToast("Digite un valor válido", "error");

    await window.db.collection('users').doc(targetUid).update({ balance: value });
    showToast("Saldo atualizado!", "success");
    input.value = "";
};

window.addGameToUser = async () => {
    const input = document.getElementById('add-game-id');
    const gameId = parseInt(input.value);
    
    if (!gameId) return;
    
    const currentLib = targetUserData.library || [];
    if (currentLib.includes(gameId)) return showToast("Usuário já possui este jogo", "info");

    const newLib = [...currentLib, gameId];
    await window.db.collection('users').doc(targetUid).update({ library: newLib });
    showToast("Jogo adicionado!", "success");
    input.value = "";
};

window.updateGameRank = async (gameId, newLevel) => {
    const levelNum = parseInt(newLevel);
    try {
        await window.db.collection('users').doc(targetUid).update({
            [`upgrades.${gameId}`]: levelNum
        });
        showToast("Rank do jogo atualizado!", "success");
    } catch (e) {
        showToast("Erro ao atualizar rank", "error");
    }
};

window.removeGameFromUser = async (gameId) => {
    window.customConfirm("Remover este jogo da biblioteca do usuário?", async () => {
        const newLib = (targetUserData.library || []).filter(id => id !== gameId);

        // Encontra o título do jogo para removê-lo também do histórico (que usa strings de título)
        const game = window.allGamesData.find(g => String(g.id) === String(gameId));
        const gameTitle = game ? game.title : null;

        let newHistory = (targetUserData.history || []).map(order => ({
            ...order,
            items: order.items.filter(item => item !== gameTitle)
        })).filter(order => order.items.length > 0);

        await window.db.collection('users').doc(targetUid).update({ 
            library: newLib,
            history: newHistory
        });
        
        showToast("Jogo removido da biblioteca e do histórico.");
    });
};

// Iniciar sistema
document.addEventListener('DOMContentLoaded', () => {
    // Aguarda o auth carregar para validar se ainda é admin
    window.auth.onAuthStateChanged(user => {
        const admins = (window.ADMIN_EMAILS || []).map(e => e.toLowerCase());
        if (user && admins.includes(user?.email?.toLowerCase())) initUserDetail();
    });
});