/**
 * Lógica do Painel de Controle de Usuário Específico
 */

const urlParams = new URLSearchParams(window.location.search);
let targetUid = urlParams.get('uid');
let targetUserData = null;

// Referências a elementos DOM para centralização e performance
const elements = {
    info: () => document.getElementById('user-info-display'),
    header: () => document.getElementById('target-user-header'),
    library: () => document.getElementById('user-library-list'),
    historyTable: () => document.getElementById('user-history-table'),
    balanceInput: () => document.getElementById('new-balance-input'),
    addGameInput: () => document.getElementById('add-game-id')
};

async function initUserDetail() {
    if (!targetUid) return window.location.href = 'admin.html';
    
    // Aguarda dependências globais
    if (!window.db || !window.allGamesData || !window.allGamesData.length) {
        return setTimeout(initUserDetail, 500);
    }

    // Escuta mudanças em tempo real no usuário selecionado
    window.db.collection('users').doc(targetUid).onSnapshot(
        doc => {
            if (!doc.exists) {
                alert("Usuário não encontrado!");
                window.location.href = 'admin.html';
                return;
            }
            targetUserData = doc.data();
            renderUserPanel();
        },
        error => {
            console.error("Erro ao sincronizar usuário:", error);
            showToast("Erro ao carregar dados em tempo real", "error");
        }
    );
}

function renderUserPanel() {
    if (!targetUserData) return;

    const userName = window.utils.getUserFriendlyName({ ...targetUserData, id: targetUid });
    
    elements.header().textContent = `Editando: ${userName}`;
    
    elements.info().innerHTML = `
        <p><strong>Email:</strong> ${targetUserData.email || 'Não informado'}</p>
        <p><strong>UID:</strong> <small style="font-family: monospace;">${targetUid}</small></p>
        <p style="font-size: 1.2rem; color: var(--promo); margin-top: 10px;">
            <strong>Saldo Atual:</strong> R$ ${(targetUserData.balance || 0).toFixed(2)}
        </p>
    `;

    // Renderizar Biblioteca
    const libIds = targetUserData.library || [];
    elements.library().innerHTML = libIds.length === 0 
        ? "<p>Biblioteca vazia.</p>" 
        : libIds.map(id => {
            const game = window.allGamesData.find(g => String(g.id) === String(id));
            return `
                <div class="user-admin-card" style="flex-direction: row; justify-content: space-between; align-items: center;">
                    <div>
                        <div class="user-name" style="font-size: 1rem;">${game ? game.title : 'Jogo ID: ' + id}</div>
                        <div class="user-id">ID: ${id}</div>
                    </div>
                    <button class="nav-button" onclick="removeGameFromUser(${id})" style="color: #e74c3c; border-color: rgba(231, 76, 60, 0.3);">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');

    // Renderizar Histórico
    const history = targetUserData.history || [];
    elements.historyTable().innerHTML = history.map(h => {
        const dateObj = new Date(h.date);
        return `
        <tr>
            <td>${dateObj.toLocaleDateString('pt-BR')} às ${dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td>
            <td>${h.items.join(', ')}</td>
            <td>R$ ${h.total.toFixed(2)}</td>
        </tr>
        `;
    }).join('');
}

window.updateUserBalance = async () => {
    const input = elements.balanceInput();
    const value = parseFloat(input.value);
    
    if (isNaN(value) || value < 0) return showToast("Digite um valor válido", "error");

    try {
        await window.db.collection('users').doc(targetUid).update({ balance: value });
        showToast("Saldo atualizado!", "success");
        input.value = "";
    } catch (error) {
        showToast("Erro ao atualizar saldo", "error");
    }
};

window.addGameToUser = async () => {
    const input = elements.addGameInput();
    const gameId = parseInt(input.value);
    
    if (!gameId || isNaN(gameId)) return showToast("Digite um ID válido", "error");
    
    // Verifica se o jogo existe no catálogo global
    const gameExists = window.allGamesData.some(g => String(g.id) === String(gameId));
    if (!gameExists) return showToast("Este ID de jogo não existe no catálogo!", "error");

    const currentLib = targetUserData.library || [];
    if (currentLib.includes(gameId)) return showToast("Usuário já possui este jogo", "info");

    try {
        const newLib = [...currentLib, gameId];
        await window.db.collection('users').doc(targetUid).update({ library: newLib });
        showToast("Jogo adicionado!", "success");
        input.value = "";
    } catch (error) {
        showToast("Erro ao adicionar jogo", "error");
    }
};

window.removeGameFromUser = async (gameId) => {
    window.customConfirm("Remover este jogo da biblioteca do usuário?", async () => {
        try {
            const newLib = (targetUserData.library || []).filter(id => id !== gameId);

            // Encontra o título do jogo para removê-lo também do histórico
            const game = window.allGamesData.find(g => String(g.id) === String(gameId));
            const gameTitle = game ? game.title : null;

            let newHistory = (targetUserData.history || []).map(order => ({
                ...order,
                items: gameTitle ? order.items.filter(item => item !== gameTitle) : order.items
            })).filter(order => order.items.length > 0);

            await window.db.collection('users').doc(targetUid).update({ 
                library: newLib,
                history: newHistory
            });
            
            showToast("Jogo removido com sucesso!", "success");
        } catch (error) {
            showToast("Erro ao remover jogo", "error");
        }
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