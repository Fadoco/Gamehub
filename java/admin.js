/**
 * Lógica para o Painel Administrativo.
 * Gerencia a listagem, busca e visualização de usuários.
 */

let allUsers = [];

async function initAdminPanel() {
    const userListContainer = document.querySelector('.user-list-container');
    const searchInput = document.querySelector('.admin-search-input');

    if (!userListContainer) {
        console.warn("Elemento '.user-list-container' não encontrado no HTML.");
        return;
    }

    userListContainer.innerHTML = "<p style='padding: 20px;'>Carregando usuários...</p>";

    try {
        // Busca todos os usuários cadastrados na coleção 'users' do Firestore
        const snapshot = await db.collection('users').get();
        if (snapshot.empty) {
            userListContainer.innerHTML = "<p style='padding: 20px;'>Nenhum usuário cadastrado no banco.</p>";
            return;
        }

        allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Ordena por nome inicialmente e renderiza
        allUsers.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
        renderUserList(allUsers);

        // Pesquisa em tempo real (Filtra por Nick, Email ou ID)
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                const filtered = allUsers.filter(user => {
                    const nick = String(user.displayName || "").toLowerCase();
                    const email = String(user.email || "").toLowerCase();
                    const id = String(user.id || "").toLowerCase();
                    return nick.includes(term) || email.includes(term) || id.includes(term);
                });
                renderUserList(filtered);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar usuários no painel admin:", error);
        userListContainer.innerHTML = "<p style='color: #e74c3c; padding: 20px;'>Erro de conexão com o banco de dados.</p>";
    }
}

function renderUserList(users) {
    const container = document.querySelector('.user-list-container');
    if (!container) return;

    if (users.length === 0) {
        container.innerHTML = "<p style='text-align: center; color: #7f8c8d; padding: 20px;'>Nenhum usuário encontrado.</p>";
        return;
    }

    // Gera o HTML seguindo a hierarquia: Nick (Destaque), Gmail e ID (Menores)
    container.innerHTML = users.map(user => `
        <div class="user-admin-card">
            <span class="user-name">${user.displayName || user.email?.split('@')[0] || 'Usuário'}</span>
            <span class="user-email">${user.email || 'E-mail não disponível'}</span>
            <span class="user-id">ID: ${user.id}</span>
        </div>
    `).join('');
}

// Só inicia o painel quando o Firebase confirmar que o usuário está logado e é Admin
firebase.auth().onAuthStateChanged((user) => {
    if (user && ADMIN_EMAILS.includes(user.email)) {
        initAdminPanel();
    }
});