/**
 * SISTEMA DE GERENCIAMENTO DE USUÁRIOS - ADMIN
 * Otimizado para gerenciamento completo de usuários, jogos e finanças.
 */

let globalUsersList = []; // Cache local para busca instantânea
let isEditingGame = false;

// Centralização de referências DOM
const elements = {
    userContainer: () => document.querySelector('.user-list-container'),
    userSearch: () => document.querySelector('.admin-search-input'),
    gameForm: () => document.getElementById('admin-game-form'),
    gameList: () => document.getElementById('admin-game-list'),
    balanceForm: () => document.getElementById('add-balance-form'),
    formTitle: () => document.getElementById('form-title'),
    btnCancelEdit: () => document.getElementById('btn-cancel-edit')
};

/**
 * Inicialização do Sistema Admin
 */
async function initAdminSystem() {
    if (!window.db || !window.utils) {
        return setTimeout(initAdminSystem, 500);
    }

    setupUserSync();
    setupGameManagement();
    setupBalanceForm();
}

/**
 * 1. GERENCIAMENTO DE USUÁRIOS (Tempo Real)
 */
function setupUserSync() {
    const container = elements.userContainer();
    if (!container) return;

    // Sincronização em tempo real com Firestore
    window.db.collection('users').onSnapshot(snapshot => {
        globalUsersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Ordena por nome e renderiza
        const sorted = [...globalUsersList].sort((a, b) => 
            window.utils.getUserFriendlyName(a).localeCompare(window.utils.getUserFriendlyName(b))
        );
        displayUsers(sorted);
    }, error => {
        console.error("Erro no sync de usuários:", error);
        container.innerHTML = `<p style="color:red">Erro de permissão ou conexão.</p>`;
    });

    // Busca em tempo real
    elements.userSearch()?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = globalUsersList.filter(u => {
            const name = window.utils.getUserFriendlyName(u).toLowerCase();
            const email = (u.email || "").toLowerCase();
            return name.includes(term) || email.includes(term) || u.id.toLowerCase().includes(term);
        });
        displayUsers(filtered);
    });
}

function displayUsers(list) {
    const container = elements.userContainer();
    if (!container) return;

    container.innerHTML = list.length === 0 
        ? "<p>Nenhum usuário encontrado.</p>"
        : list.map(user => `
            <div class="user-admin-card" onclick="window.location.href='admin-user-detail.html?uid=${user.id}'" style="cursor:pointer">
                <span class="user-name">${window.utils.getUserFriendlyName(user)}</span>
                <span class="user-email">${user.email || 'E-mail privado'}</span>
                <span class="user-id">UID: ${user.id}</span>
                <div class="user-balance-tag">Saldo: R$ ${(user.balance || 0).toFixed(2)}</div>
            </div>
        `).join('');
}

/**
 * 2. GERENCIAMENTO DE JOGOS (CRUD)
 */
function setupGameManagement() {
    const form = elements.gameForm();
    const gameListContainer = elements.gameList();
    if (!form || !gameListContainer) return;

    // Carregar Lista de Jogos na Tabela
    window.db.collection('games').onSnapshot(snapshot => {
        gameListContainer.innerHTML = snapshot.docs.map(doc => {
            const game = doc.data();
            return `
                <tr>
                    <td>${game.id}</td>
                    <td><strong>${game.title}</strong></td>
                    <td>${game.currentPrice}</td>
                    <td>
                        <button class="nav-button" onclick="editGame('${doc.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="nav-button" onclick="deleteGame('${doc.id}')" style="color:#e74c3c" title="Excluir"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    });

    // Submit do Formulário (Salvar/Atualizar)
    form.onsubmit = async (e) => {
        e.preventDefault();
        const idValue = document.getElementById('game-id').value;
        const id = parseInt(idValue);

        if (isNaN(id)) {
            return showToast("ID do jogo deve ser um número", "error");
        }

        const gameData = {
            id: id,
            title: document.getElementById('game-title').value,
            image: document.getElementById('game-image').value,
            description: document.getElementById('game-description').value,
            tags: document.getElementById('game-tags').value.split(',').map(t => t.trim()),
            platforms: document.getElementById('game-platforms').value.split(',').map(p => p.trim()),
            currentPrice: document.getElementById('game-current-price').value,
            discount: parseInt(document.getElementById('game-discount').value) || 0,
            oldPrice: document.getElementById('game-old-price').value || null,
            featured: document.getElementById('game-featured').checked
        };

        try {
            // Usamos o gameId como ID do documento para facilitar
            await window.db.collection('games').doc(String(id)).set(gameData, { merge: true });
            showToast(isEditingGame ? "Jogo atualizado!" : "Jogo criado!", "success");
            resetGameForm();
        } catch (error) {
            showToast("Erro ao salvar jogo", "error");
        }
    };
}

window.editGame = async (docId) => {
    try {
        const doc = await window.db.collection('games').doc(docId).get();
        const game = doc.data();
        
        isEditingGame = true;
        elements.formTitle().textContent = "Editando Jogo";
        elements.btnCancelEdit().style.display = "block";

        document.getElementById('game-id').value = game.id;
        document.getElementById('game-id').disabled = true; // Não muda ID de jogo existente
        document.getElementById('game-title').value = game.title;
        document.getElementById('game-image').value = game.image;
        document.getElementById('game-description').value = game.description || "";
        document.getElementById('game-tags').value = game.tags.join(', ');
        document.getElementById('game-platforms').value = game.platforms.join(', ');
        document.getElementById('game-current-price').value = game.currentPrice;
        document.getElementById('game-discount').value = game.discount;
        document.getElementById('game-old-price').value = game.oldPrice || "";
        document.getElementById('game-featured').checked = game.featured || false;

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        showToast("Erro ao carregar dados do jogo", "error");
    }
};

window.deleteGame = (docId) => {
    window.customConfirm("Tem certeza que deseja remover este jogo do catálogo?", async () => {
        await window.db.collection('games').doc(docId).delete();
        showToast("Jogo removido com sucesso!");
    });
};

function resetGameForm() {
    isEditingGame = false;
    elements.gameForm().reset();
    elements.gameForm().querySelector('#game-id').disabled = false;
    elements.formTitle().textContent = "Adicionar Novo Jogo";
    elements.btnCancelEdit().style.display = "none";
}

/**
 * 3. FORMULÁRIO DE SALDO RÁPIDO
 */
function setupBalanceForm() {
    const form = elements.balanceForm();
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const uid = document.getElementById('user-id-balance').value.trim();
        const amount = parseFloat(document.getElementById('amount-to-add').value);

        if (!uid) return showToast("UID do usuário é obrigatório", "error");
        if (isNaN(amount) || amount <= 0) return showToast("Digite um valor positivo", "error");

        try {
            const userRef = window.db.collection('users').doc(uid);
            const doc = await userRef.get();
            
            if (!doc.exists) return showToast("UID de usuário não encontrado!", "error");

            // Uso do increment para maior segurança atômica
            await userRef.update({ balance: firebase.firestore.FieldValue.increment(amount) });
            
            showToast(`R$ ${amount.toFixed(2)} adicionados com sucesso!`, "success");
            form.reset();
        } catch (error) {
            showToast("Erro ao processar transação", "error");
        }
    };
}

document.getElementById('btn-cancel-edit')?.addEventListener('click', resetGameForm);

// Inicialização protegida: Só roda se o usuário logado for admin
if (window.auth) {
    window.auth.onAuthStateChanged((user) => {
        const admins = (window.ADMIN_EMAILS || []).map(e => e.toLowerCase());
        if (user && admins.includes(user.email?.toLowerCase())) initAdminSystem();
    });
} else {
    console.error("Auth script não encontrado.");
}