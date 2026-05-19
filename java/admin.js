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

    // Pega o DB do escopo global (window)
    const firestore = window.db;
    if (!firestore) {
        userListContainer.innerHTML = "<p style='padding: 20px;'>Erro: Banco de dados não conectado.</p>";
        return;
    }

    try {
        // Busca todos os usuários cadastrados na coleção 'users' do Firestore
        const snapshot = await firestore.collection('users').get();
        if (snapshot.empty) {
            userListContainer.innerHTML = "<p style='padding: 20px;'>Nenhum usuário cadastrado no banco.</p>";
            return;
        }

        allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Ordena por Nick e renderiza
        allUsers.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
        renderUserList(allUsers);

        // Implementação da Pesquisa em tempo real
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                const filtered = allUsers.filter(user => {
                    const nickStr = window.utils.getUserFriendlyName(user).toLowerCase();
                    const emailStr = String(user.email || "").toLowerCase();
                    const idStr = String(user.id || "").toLowerCase();
                    return nickStr.includes(term) || emailStr.includes(term) || idStr.includes(term);
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
            <span class="user-name">${window.utils.getUserFriendlyName(user)}</span>
            <span class="user-email">${user.email || 'E-mail privado'}</span>
            <span class="user-id">ID: ${user.id}</span>
        </div>
    `).join('');
}

// Só inicia o painel quando o Firebase confirmar que o usuário está logado e é Admin
window.auth.onAuthStateChanged((user) => {
    const adminEmails = window.ADMIN_EMAILS || [];
    
    if (user && adminEmails.includes(user.email)) {
        initAdminPanel();
    }
});