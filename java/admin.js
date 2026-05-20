/**
 * SISTEMA DE GERENCIAMENTO DE USUÁRIOS - ADMIN
 * Refatorado do zero para garantir performance e hierarquia visual.
 */

let globalUsersList = []; // Cache local para busca instantânea

/**
 * Função principal que busca dados no Firestore
 */
async function loadUsersSystem() {
    const container = document.querySelector('.user-list-container');
    const searchInput = document.querySelector('.admin-search-input');

    if (!container) return;
    if (!window.db || !window.utils) {
        return setTimeout(loadUsersSystem, 500); // Aguarda dependências globais
    }

    try {
        const snapshot = await window.db.collection('users').get();
        if (snapshot.empty) {
            container.innerHTML = "<p>Nenhum usuário encontrado no banco de dados.</p>";
            return;
        }

        // Mapeia os dados e armazena na variável global
        globalUsersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Renderização inicial (ordenada por nome)
        displayUsers(globalUsersList.sort((a, b) => 
            window.utils.getUserFriendlyName(a).localeCompare(window.utils.getUserFriendlyName(b))
        ));

        // Lógica de Busca em Tempo Real
        searchInput?.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = globalUsersList.filter(u => {
                const name = window.utils.getUserFriendlyName(u).toLowerCase();
                const email = (u.email || "").toLowerCase();
                const id = u.id.toLowerCase();
                return name.includes(term) || email.includes(term) || id.includes(term);
            });
            displayUsers(filtered);
        });
    } catch (error) {
        console.error("Erro detalhado ao carregar usuários:", error);
        container.innerHTML = `<p style="color:red">Erro ao carregar usuários: ${error.code === 'permission-denied' ? 'Sem permissão no Firestore (verifique as Regras de Segurança)' : error.message}</p>`;
    }
}

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
        <div class="user-admin-card" onclick="window.location.href='admin-user-detail.html?uid=${user.id}'" style="cursor:pointer">
            <span class="user-name">${window.utils.getUserFriendlyName(user)}</span>
            <span class="user-email">${user.email || 'E-mail privado'}</span>
            <span class="user-id">UID: ${user.id}</span>
            <div class="user-balance-tag">Saldo: R$ ${(user.balance || 0).toFixed(2)}</div>
        </div>
    `).join('');
}

// Inicialização protegida: Só roda se o usuário logado for admin
if (window.auth) {
    window.auth.onAuthStateChanged((user) => {
        const admins = (window.ADMIN_EMAILS || []).map(e => e.toLowerCase());
        if (user && admins.includes(user.email.toLowerCase())) {
            loadUsersSystem();
        }
    });
} else {
    console.error("Auth script não encontrado.");
}