/**
 * SISTEMA DE GERENCIAMENTO DE USUÁRIOS - ADMIN
 * Refatorado do zero para garantir performance e hierarquia visual.
 */

let globalUsersList = [];
let adminUsersUnsubscribe = null;

/**
 * Função principal que busca dados no Firestore (tempo real)
 */
async function loadUsersSystem() {
    const container = document.querySelector('.user-list-container');
    const searchInput = document.querySelector('.admin-search-input');

    if (!container) return;
    if (!window.db || !window.utils) {
        return setTimeout(loadUsersSystem, 500);
    }

    if (container && !document.getElementById('debug-hacker-btn')) {
        const debugBtn = document.createElement('button');
        debugBtn.id = 'debug-hacker-btn';
        debugBtn.style.cssText = `
            background: #000; color: #0f0; border: 1px solid #0f0; 
            font-family: monospace; width: 100%; margin-bottom: 20px; 
            padding: 12px; cursor: pointer; font-weight: bold;
            text-shadow: 0 0 5px #0f0; box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
        `;
        debugBtn.innerText = "> FORÇAR_CORRUPÇÃO_SISTEMA (MERCADO_NEGRO.EXE)";
        debugBtn.onclick = () => window.openBlackMarketFromAdmin();
        
        container.parentNode.insertBefore(debugBtn, container);
    }

    if (adminUsersUnsubscribe) return;

    try {
        adminUsersUnsubscribe = window.db.collection('users').onSnapshot(
            { includeMetadataChanges: true },
            (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'removed' && window.UserCleanup) {
                        window.UserCleanup.handleUserDeletion(change.doc.id, 'Removido do painel admin');
                    }
                });

                if (snapshot.metadata.fromCache) return;

                if (snapshot.empty) {
                    container.innerHTML = "<p>Nenhum usuário encontrado no banco de dados.</p>";
                    globalUsersList = [];
                    return;
                }

                globalUsersList = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(user => !window.UserCleanup || window.UserCleanup.isValidUserData(user));

                displayUsers(globalUsersList.sort((a, b) =>
                    window.utils.getUserFriendlyName(a).localeCompare(window.utils.getUserFriendlyName(b))
                ));
            },
            (error) => {
                console.error("Erro ao ouvir usuários:", error);
                container.innerHTML = `<p style="color:red">Erro ao carregar usuários: ${error.code === 'permission-denied' ? 'Sem permissão no Firestore (verifique as Regras de Segurança)' : error.message}</p>`;
            }
        );

        if (searchInput && !searchInput.dataset.bound) {
            searchInput.dataset.bound = 'true';
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = globalUsersList.filter(u => {
                    const name = window.utils.getUserFriendlyName(u).toLowerCase();
                    const email = (u.email || "").toLowerCase();
                    const id = u.id.toLowerCase();
                    return name.includes(term) || email.includes(term) || id.includes(term);
                });
                displayUsers(filtered);
            });
        }
    } catch (error) {
        console.error("Erro detalhado ao carregar usuários:", error);
        container.innerHTML = `<p style="color:red">Erro ao carregar usuários: ${error.message}</p>`;
    }
}

window.reloadAdminUserList = () => {
    if (globalUsersList.length === 0) return;
    displayUsers(globalUsersList.sort((a, b) =>
        window.utils.getUserFriendlyName(a).localeCompare(window.utils.getUserFriendlyName(b))
    ));
};

/**
 * Injeta o HTML dos cartões no container
 */
function displayUsers(list) {
    const container = document.querySelector('.user-list-container');
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = "<p>Nenhum resultado encontrado.</p>";
        return;
    }

    container.innerHTML = list.map(user => `
        <div class="user-admin-card" onclick="window.location.href='admin-user-detail.html?uid=${user.id}'" style="cursor:pointer;">
            <span class="user-name">${window.utils.getUserFriendlyName(user)}</span>
            <span class="user-email">${user.email || 'E-mail privado'}</span>
            <span class="user-id">UID: ${user.id}</span>
            <div class="user-balance-tag"><i class="fas fa-wallet" style="margin-right: 5px;"></i> R$ ${(user.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
    `).join('');
}

/**
 * Manipulador do formulário para adicionar dinheiro ao saldo de um usuário
 */
async function handleAddBalance(event) {
    event.preventDefault();
    
    const userIdInput = document.getElementById('user-id-balance');
    const amountInput = document.getElementById('amount-to-add');
    const uid = userIdInput.value.trim();
    const amount = parseFloat(amountInput.value);

    // Validação
    if (!uid) {
        window.showToast("Digite o ID do usuário (UID).", "error");
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        window.showToast("Digite um valor válido (maior que 0).", "error");
        return;
    }

    // Confirmação
    window.customConfirm(
        `Adicionar R$ ${amount.toFixed(2)} à carteira do usuário ${uid}?\n\nOperação irreversível!`,
        async () => {
            try {
                window.toggleLoader(true);

                // Busca o usuário para obter o saldo atual
                const userDoc = await window.db.collection('users').doc(uid).get();
                if (!userDoc.exists) {
                    window.showToast("Usuário não encontrado com este UID.", "error");
                    window.toggleLoader(false);
                    return;
                }

                const currentBalance = userDoc.data().balance || 0;
                const newBalance = currentBalance + amount;

                // Atualiza o saldo
                await window.db.collection('users').doc(uid).update({
                    balance: newBalance
                });

                window.showToast(`✓ R$ ${amount.toFixed(2)} adicionado com sucesso! Novo saldo: R$ ${newBalance.toFixed(2)}`, "success");
                
                // Limpa os campos
                userIdInput.value = "";
                amountInput.value = "";

                // Recarrega a lista de usuários se ela está visível
                loadUsersSystem();

                window.toggleLoader(false);
            } catch (error) {
                console.error("Erro ao adicionar saldo:", error);
                window.showToast("Erro ao adicionar saldo: " + error.message, "error");
                window.toggleLoader(false);
            }
        }
    );
}

// Inicialização protegida: Só roda se o usuário logado for admin
if (window.auth) {
    window.auth.onAuthStateChanged((user) => {
        const admins = (window.ADMIN_EMAILS || []).map(e => e.toLowerCase());
        if (user && admins.includes(user.email?.toLowerCase())) {
            loadUsersSystem();
            
            // Vincula o manipulador do formulário de adicionar dinheiro
            const balanceForm = document.getElementById('add-balance-form');
            if (balanceForm) {
                balanceForm.addEventListener('submit', handleAddBalance);
            }
        }
    });
} else {
    console.error("Auth script não encontrado.");
}