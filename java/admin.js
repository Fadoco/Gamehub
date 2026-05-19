/**
 * Lógica para o Painel Administrativo.
 * Gerencia a listagem, busca e visualização de usuários.
 */

let allUsers = [];

async function initAdminPanel() {
    console.log("Iniciando carregamento do Painel Admin...");
    
    const container = document.querySelector('.user-list-container');
    const search = document.querySelector('.admin-search-input');

    // 1. Validação de Elementos e Dependências
    if (!container) return console.error("ERRO: .user-list-container não encontrado no HTML.");
    if (!window.db) {
        console.warn("Banco de dados não pronto. Tentando novamente em 500ms...");
        return setTimeout(initAdminPanel, 500);
    }
    if (!window.utils) {
        console.warn("Utilitários globais não prontos. Tentando novamente em 500ms...");
        return setTimeout(initAdminPanel, 500);
    }

    container.innerHTML = "<p style='padding: 20px;'>Carregando usuários do Firestore...</p>";

    try {
        // 2. Busca de Dados
        const snapshot = await window.db.collection('users').get();
        
        if (snapshot.empty) {
            console.log("Firestore retornou uma coleção vazia.");
            container.innerHTML = "<p style='padding: 20px;'>Nenhum usuário encontrado no banco de dados.</p>";
            return;
        }

        // 3. Processamento e Ordenação
        allUsers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`${allUsers.length} usuários carregados com sucesso.`);

        // Ordena alfabeticamente pelo nome amigável
        allUsers.sort((a, b) => {
            const nameA = window.utils.getUserFriendlyName(a).toLowerCase();
            const nameB = window.utils.getUserFriendlyName(b).toLowerCase();
            return nameA.localeCompare(nameB);
        });

        // 4. Renderização Inicial
        renderUserList(allUsers);

        // 5. Configuração da Pesquisa (se o input existir)
        if (search) {
            search.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                const filtered = allUsers.filter(user => {
                    const nick = window.utils.getUserFriendlyName(user).toLowerCase();
                    const email = (user.email || "").toLowerCase();
                    const uid = (user.id || "").toLowerCase();
                    return nick.includes(term) || email.includes(term) || uid.includes(term);
                });
                renderUserList(filtered);
            });
        }

    } catch (error) {
        console.error("Erro crítico ao carregar painel admin:", error);
        container.innerHTML = `<p style='color: #e74c3c; padding: 20px;'>Erro ao acessar Firestore: ${error.message}</p>`;
    }
}

function renderUserList(users) {
    const container = document.querySelector('.user-list-container');
    if (!container) return;

    if (users.length === 0) {
        container.innerHTML = "<p style='text-align: center; color: #7f8c8d; padding: 20px;'>Nenhum usuário encontrado.</p>";
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="user-admin-card">
            <div class="user-name">${window.utils.getUserFriendlyName(user)}</div>
            <div class="user-email">${user.email || 'E-mail não disponível'}</div>
            <div class="user-id">ID: ${user.id}</div>
        </div>
    `).join('');
}

// 6. Gatilho de Inicialização com Proteção de Admin
if (window.auth) {
    window.auth.onAuthStateChanged((user) => {
        if (user) {
            const adminEmails = window.ADMIN_EMAILS || [];
            if (adminEmails.includes(user.email)) {
                initAdminPanel();
            } else {
                console.warn("Usuário logado não é administrador.");
            }
        } else {
            console.log("Aguardando login do administrador...");
        }
    });
} else {
    console.error("Objeto window.auth não encontrado. Verifique se auth.js foi carregado corretamente.");
}