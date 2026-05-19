/**
 * Lógica para o Painel Administrativo.
 * Gerencia a listagem, busca e visualização de usuários.
 */

let allUsers = [];

async function initAdminPanel() {
    const userListContainer = document.querySelector('.user-list-container');
    const searchInput = document.querySelector('.admin-search-input');

    if (!userListContainer) return;

    try {
        // Busca todos os usuários cadastrados na coleção 'users' do Firestore
        const snapshot = await db.collection('users').get();
        allUsers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Renderização inicial da lista completa
        renderUserList(allUsers);

        // Implementação da busca em tempo real (Filtra por Nick, Email ou ID)
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                const filtered = allUsers.filter(user => {
                    const nick = (user.displayName || "Sem Nick").toLowerCase();
                    const email = (user.email || "").toLowerCase();
                    const id = user.id.toLowerCase();
                    return nick.includes(term) || email.includes(term) || id.includes(term);
                });
                renderUserList(filtered);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar usuários no painel admin:", error);
        userListContainer.innerHTML = "<p style='color: #e74c3c; padding: 20px;'>Erro ao carregar lista de usuários.</p>";
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
            <span class="user-name">${user.displayName || 'Sem Nick'}</span>
            <span class="user-email">${user.email}</span>
            <span class="user-id">ID: ${user.id}</span>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    // Pequeno atraso para garantir que a variável 'db' (Firestore) foi inicializada em auth.js
    setTimeout(initAdminPanel, 500);
});