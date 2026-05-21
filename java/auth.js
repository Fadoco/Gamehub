/**
 * Lógica de autenticação e gerenciamento de sessão do usuário.
 */

const DESATIVAR_LOGIN_PARA_TESTE = false; // Altere para 'false' quando quiser reativar o login

// --- CONFIGURAÇÃO DO FIREBASE ---
// Inicializa o Firebase apenas se a configuração estiver disponível
if (typeof firebaseConfig !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
window.auth = firebase.auth();
const auth = window.auth;

// Inicializa o Firestore with segurança
window.db = null;
try {
    window.db = firebase.firestore();
} catch (e) {
    console.warn("Firestore SDK não carregado. Funcionalidades de favoritos e admin desativadas.");
}

const db = window.db;

window.userFavorites = []; // Armazenamento global de favoritos
window.userCart = [];      // Armazenamento global do carrinho
window.userLibrary = [];   // Armazenamento global da biblioteca
window.userBalance = 0;    // Saldo da carteira
window.ADMIN_EMAILS = ["fadoco12311@gmail.com", "gabrielmomo6759@gmail.com"]; // E-mails de administradores
window.userHistory = [];   // Histórico de compras
window.userBio = "";       // Descrição do perfil
window.userAvatar = "";    // URL da foto customizada
window.userBannerURL = ""; // URL do banner
window.userBannerType = "image"; // Tipo de banner (image/video)
window.userFriendshipId = null; // ID numérico para adicionar amigos
window.userFriends = [];   // Lista de UIDs de amigos
window.userFriendRequestsSent = []; // Requisições de amizade enviadas
window.userFriendRequestsReceived = []; // Requisições de amizade recebidas

// Referências DOM centralizadas
const authElements = {
    loginModal: () => document.getElementById('login-modal'),
    userMenu: () => document.getElementById('user-menu'),
    walletDisplay: () => document.getElementById('wallet-amount'),
    userName: () => document.getElementById('user-name'),
    userImg: () => document.querySelector('.user-profile img'),
    btnLogin: () => document.getElementById('btn-login'),
    btnLogout: () => document.getElementById('btn-logout')
};

// Função auxiliar para o Loader
function toggleLoader(show) {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

// Sistema de Notificação Customizado
window.showToast = (message, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'exclamation-circle' : 'info-circle');
    toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
};

// Substituição para o confirm() nativo do navegador
window.customConfirm = (message, onConfirm) => {
    let modal = document.getElementById('confirm-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'confirm-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 350px; text-align: center;">
                <h3 id="confirm-msg" style="margin-bottom: 25px;"></h3>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="confirm-yes" class="buy-button" style="padding: 10px 20px;">Confirmar</button>
                    <button id="confirm-no" class="nav-button" style="padding: 10px 20px;">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('confirm-msg').textContent = message;
    modal.style.display = 'flex';

    document.getElementById('confirm-yes').onclick = () => {
        modal.style.display = 'none';
        onConfirm();
    };

    document.getElementById('confirm-no').onclick = () => {
        modal.style.display = 'none';
    };
};

// --- VERIFICAÇÃO DE SEGURANÇA (Monitora o estado da sessão em tempo real) ---
auth.onAuthStateChanged((user) => {
    const isLoginPage = window.location.pathname.includes('login.html');
    const isAdminPage = window.location.pathname.includes('admin.html') || window.location.pathname.includes('admin-user-detail.html');
    const isWelcomePage = window.location.pathname.includes('welcome.html');
    const adminList = (window.ADMIN_EMAILS || []).map(e => e.toLowerCase());
    const isAdmin = user && adminList.includes(user.email.toLowerCase());

    if (!user) {
        if (!isLoginPage && !isWelcomePage && !DESATIVAR_LOGIN_PARA_TESTE) {
            const loginPath = window.IS_SUBFOLDER ? 'login.html' : 'html/login.html';
            window.location.href = loginPath;
            return;
        }
    } else {
        if (isLoginPage) {
            window.location.href = '../index.html';
            showToast("Você já está logado!", "info");
            return;
        }
        // 3. Proteção de Rota Admin: Somente o Admin logado pode ver a página administrativa
        if (isAdminPage && !isAdmin) {
            window.location.href = '../index.html';
            return;
        }
    }

    checkUserSession(user);

    if (DESATIVAR_LOGIN_PARA_TESTE && !user) return;

    if (user) {
        if (db) {
            // Garante a existência do documento do usuário
            const userRef = db.collection('users').doc(user.uid);
            userRef.get().then(doc => {
                const existingData = doc.exists ? doc.data() : {};
                if (!doc.exists) {
                    userRef.set({
                        email: user.email,
                        displayName: user.displayName || user.email.split('@')[0],
                        balance: 0,
                        favorites: [],
                        cart: [],
                        library: [],
                        history: [],
                        bio: "",
                        avatar: "",
                        bannerURL: "",
                        bannerType: "image",
                        friendshipId: Math.floor(100000 + Math.random() * 900000),
                        friends: [],
                        friendRequestsSent: [],
                        friendRequestsReceived: []
                    });
                }
            });
            // Inicializa sincronização em tempo real
            setupUserDataSync(user.uid);
        }
    } else {
        resetGlobals();
    }
});

/**
 * Sincroniza dados do usuário em tempo real
 */
function setupUserDataSync(uid) {
    if (!db) return;

    db.collection('users').doc(uid).onSnapshot(doc => {
        if (!doc.exists) return;
        const data = doc.data();
        
        // Atualiza variáveis globais
        window.userFavorites = data.favorites || [];
        window.userCart = data.cart || [];
        window.userLibrary = data.library || [];
        window.userBalance = data.balance || 0;
        window.userHistory = data.history || [];
        window.userBio = data.bio || "";
        window.userAvatar = data.avatar || "";
        window.userBannerURL = data.bannerURL || "";
        window.userBannerType = data.bannerType || "image";
        window.userFriendshipId = data.friendshipId;
        window.userFriends = data.friends || [];
        window.userFriendRequestsSent = data.friendRequestsSent || [];
        window.userFriendRequestsReceived = data.friendRequestsReceived || [];

        updateNavBadges();
        refreshCurrentPageUI();
        checkUserSession(auth.currentUser); // Atualiza UI do cabeçalho com novos dados (avatar/saldo)
    }, error => {
        console.error("Erro no sync de dados do usuário:", error);
    });
}

function resetGlobals() {
    window.userFavorites = []; window.userCart = []; window.userLibrary = [];
    window.userBalance = 0; window.userFriends = [];
}

// Função auxiliar para atualizar a interface da página atual sem recarregar
function refreshCurrentPageUI() {
    const path = window.location.pathname;
    if (!window.allGamesData || window.allGamesData.length === 0) return;

    if (path.includes('jogo.html') && typeof renderGameDetails === 'function') renderGameDetails(window.allGamesData);
    else if (path.includes('busca.html') && typeof renderSearchResults === 'function') renderSearchResults(window.allGamesData);
    else if (path.includes('carrinho.html') && typeof renderCart === 'function') renderCart();
    else if (path.includes('biblioteca.html') && typeof renderLibrary === 'function') renderLibrary();
    else if (path.includes('perfil.html') && typeof renderProfile === 'function') renderProfile();
    else if (typeof renderGames === 'function') renderGames(window.allGamesData);
}

document.addEventListener('DOMContentLoaded', () => {
    const loginModal = authElements.loginModal();
    const closeModal = document.querySelector('.close-modal');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // Abrir modal de login
    authElements.btnLogin()?.addEventListener('click', (e) => { e.preventDefault(); loginModal.style.display = 'flex'; });

    // Fechar modal ao clicar no X
    if (closeModal && loginModal) {
        closeModal.onclick = () => {
            loginModal.style.display = 'none';
        };
    }

    // Lógica do formulário
    if (loginForm) {
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const email = emailInput.value;
            const password = passwordInput.value;

            toggleLoader(true);
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    toggleLoader(false);
                    const isNewUser = userCredential.additionalUserInfo?.isNewUser;
                    const isLoginPage = window.location.pathname.includes('login.html');

                    if (isNewUser) {
                        showToast("Bem-vindo ao GameHub!", "success");
                        window.location.href = isLoginPage ? '../html/welcome.html' : 'html/welcome.html';
                    } else {
                        console.log("Login bem-sucedido.");
                        if (isLoginPage) {
                            window.location.href = '../index.html';
                        } else {
                            loginModal.style.display = 'none';
                        }
                    }
                })
                .catch((error) => {
                    toggleLoader(false);
                    let message = "E-mail ou senha incorretos.";
                    // Em produção, usamos mensagens genéricas por segurança
                    if (error.code === 'auth/invalid-email') message = "E-mail inválido.";
                    else if (error.code === 'auth/user-not-found') message = "Usuário não encontrado.";

                    console.error("Erro no Login:", error); // Log detalhado do erro
                    showToast(message, "error");
                });
        };
    }

    // Lógica do formulário de Cadastro
    if (signupForm) {
        signupForm.onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Após criar o usuário, atualizamos o perfil com o nome digitado
                    return userCredential.user.updateProfile({
                        displayName: name
                    });
                })
                .then(() => {
                    // Salva o Nick (displayName) também no documento do Firestore para o Admin ver
                    const user = auth.currentUser;
                    return db.collection('users').doc(user.uid).set({
                        displayName: name,
                        email: user.email,
                        balance: 0,
                        favorites: [],
                        cart: [],
                        library: [],
                        history: [],
                        bio: "",
                        avatar: "",
                        bannerURL: "",
                        bannerType: "image",
                        friendshipId: Math.floor(100000 + Math.random() * 900000),
                        friends: [], 
                        friendRequestsSent: [], 
                        friendRequestsReceived: []
                    }, { merge: true });
                })
                .then(() => {
                    showToast("Conta criada com sucesso!", "success");
                    window.location.href = 'welcome.html';
                })
                .catch((error) => {
                    console.error("Erro no Cadastro:", error);
                    if (error.message.includes('requests-from-referer-blocked')) {
                        showToast("Domínio não autorizado no Firebase.", "error");
                    } else {
                        showToast("Erro ao cadastrar: " + error.message, "error");
                    }
                    console.error("Erro no Cadastro:", error); // Log detalhado do erro
                    console.error(error);
                });
        };
    }

    // Lógica de Esqueci a Senha
    const handleForgotPassword = () => {
        const emailInput = document.getElementById('email');
        const email = emailInput.value;
        
        if (!email || !email.includes('@')) {
            showToast("Digite um e-mail válido.", "error");
            return;
        }

        toggleLoader(true);
        auth.sendPasswordResetEmail(email)
            .then(() => {
                toggleLoader(false);
                showToast("E-mail de recuperação enviado!", "success");
            })
            .catch((error) => {
                toggleLoader(false);
                console.error("Erro ao enviar e-mail de recuperação:", error); // Log detalhado do erro
                showToast("Erro ao enviar e-mail.", "error");
            });
    };

    document.getElementById('forgot-password-link')?.addEventListener('click', handleForgotPassword);
    document.getElementById('forgot-password-modal-link')?.addEventListener('click', handleForgotPassword);

    // Logout
    authElements.btnLogout()?.addEventListener('click', () => {
        auth.signOut().then(() => location.reload());
    });
});

function checkUserSession(user) {
    const btnLogin = authElements.btnLogin();
    const btnLogout = authElements.btnLogout();
    const userNameSpan = document.getElementById('user-name');
    const userImg = document.querySelector('.user-profile img');
    const userMenu = document.getElementById('user-menu');
    
    if (userMenu) userMenu.style.display = 'flex';

    // Adiciona botão Ranking se não existir (Visível para todos)
    if (userMenu && !document.getElementById('btn-ranking')) {
        const rankBtn = document.createElement('button');
        rankBtn.id = 'btn-ranking';
        rankBtn.className = 'nav-button';
        rankBtn.style.cssText = "font-size: 18px; color: #f1c40f; background: none; border: none; cursor: pointer; margin: 0 10px; display: flex; align-items: center; transition: 0.3s;";
        rankBtn.title = "Ranking de Riqueza";
        rankBtn.innerHTML = '<i class="fas fa-trophy"></i>';
        rankBtn.onclick = () => window.location.href = window.IS_SUBFOLDER ? 'ranking.html' : 'html/ranking.html';
        userMenu.prepend(rankBtn);
    }

    const adminList = (window.ADMIN_EMAILS || []).map(e => e.toLowerCase());
    const isAdmin = user && adminList.includes(user?.email?.toLowerCase());

    if (user) {
        const displayName = window.utils.getUserFriendlyName(user);
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'block';
        
        // Adiciona botão Admin se não existir
        if (userMenu && !document.getElementById('btn-admin')) {
            if (isAdmin) {
                const adminBtn = document.createElement('button');
                adminBtn.id = 'btn-admin';
                adminBtn.className = 'nav-button';
                // Bonequinho Admin grande e visível ao lado da foto
                adminBtn.style.cssText = "font-size: 22px; color: var(--secondary); background: none; border: none; cursor: pointer; margin: 0 12px; display: flex; align-items: center; transition: 0.3s;";
                adminBtn.title = "Painel Administrativo";
                adminBtn.innerHTML = '<i class="fas fa-user-shield"></i>';
                
                adminBtn.onmouseover = () => adminBtn.style.color = 'var(--accent)';
                adminBtn.onmouseout = () => adminBtn.style.color = 'var(--secondary)';

                adminBtn.onclick = () => window.location.href = window.location.pathname.includes('/html/') ? 'admin.html' : 'html/admin.html';
                userMenu.insertBefore(adminBtn, btnLogout);
            }
        }
        // Remove o botão Admin se o usuário não for admin e ele existir
        else if (!isAdmin && document.getElementById('btn-admin')) {
            document.getElementById('btn-admin').remove();
        }

        if (userNameSpan) {
            userNameSpan.textContent = displayName;
            userNameSpan.style.display = 'inline';
        }
        if (userImg) {
            userImg.src = user.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=27ae60&color=fff`;
            userImg.style.display = 'block';
            // Torna a foto de perfil clicável para ir ao perfil
            userImg.onclick = () => window.location.href = window.IS_SUBFOLDER ? 'perfil.html' : 'html/perfil.html';
        }

        // Atualiza a exibição da carteira
        const walletDisplay = authElements.walletDisplay();
        if (walletDisplay) {
            walletDisplay.textContent = `R$ ${window.userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            if (document.getElementById('user-wallet')) document.getElementById('user-wallet').style.display = 'flex';
        }
    } else {
        if (btnLogin) btnLogin.style.display = 'block';
        if (btnLogout) btnLogout.style.display = 'none';
        if (userNameSpan) userNameSpan.style.display = 'none';
        if (userImg) userImg.style.display = 'block'; // Mostra avatar padrão mesmo deslogado
    }
}

// Função global para favoritar/desfavoritar
window.toggleFavorite = async (event, gameId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!db && !DESATIVAR_LOGIN_PARA_TESTE) {
        showToast("Erro: Banco de dados não inicializado.", "error");
        return;
    }

    if (!auth.currentUser && !DESATIVAR_LOGIN_PARA_TESTE) {
        document.getElementById('login-modal').style.display = 'flex';
        return;
    }

    if (window.userFavorites.includes(gameId)) {
        window.userFavorites = window.userFavorites.filter(id => id !== gameId);
    } else {
        window.userFavorites.push(gameId);
    }

    if (auth.currentUser && db) {
        await db.collection('users').doc(auth.currentUser.uid).set({
            favorites: window.userFavorites
        }, { merge: true });
    }

    refreshCurrentPageUI();
};

// Função para atualizar contadores no menu (opcional)
function updateNavBadges() {
    const cartBtn = document.querySelector('.nav-button .fa-shopping-cart')?.parentElement;
    if (cartBtn) {
        cartBtn.setAttribute('data-count', window.userCart.length);
    }

    // Garante que o saldo no Header esteja atualizado
    const walletDisplay = authElements.walletDisplay();
    if (walletDisplay) {
        walletDisplay.textContent = `R$ ${window.userBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
}

// Função para Adicionar/Remover do Carrinho
window.toggleCart = async (gameId) => {
    if (!auth.currentUser && !DESATIVAR_LOGIN_PARA_TESTE) {
        window.location.href = window.location.pathname.includes('/html/') ? 'login.html' : 'html/login.html';
        return;
    }

    // Verifica se o jogo já está na biblioteca
    if (window.userLibrary.includes(gameId)) {
        showToast("Você já possui este jogo!", "info");
        return;
    }

    const index = window.userCart.indexOf(gameId);
    if (index > -1) {
        window.userCart.splice(index, 1);
        showToast("Removido do carrinho.");
    } else {
        window.userCart.push(gameId);
        showToast("Adicionado ao carrinho!", "success");
    }

    if (auth.currentUser && db) {
        await db.collection('users').doc(auth.currentUser.uid).set({
            cart: window.userCart
        }, { merge: true });
    }
    
    refreshCurrentPageUI();
    updateNavBadges();
};

// Simulação de Compra (Move do Carrinho para Biblioteca)
window.purchaseLibrary = async () => {
    if (window.userCart.length === 0) {
        showToast("Carrinho vazio!", "error");
        return;
    }

    if (!auth.currentUser && !DESATIVAR_LOGIN_PARA_TESTE) {
        showToast("Você precisa estar logado para realizar uma compra.", "info");
        return;
    }

    // Calcula o total da compra baseado nos dados globais
    const cartGames = allGamesData.filter(game => window.userCart.some(id => String(id) === String(game.id)));
    const totalPurchase = cartGames.reduce((acc, game) => acc + utils.parsePrice(game.currentPrice), 0);

    if (window.userBalance < totalPurchase) {
        showToast("Saldo insuficiente!", "error");
        return;
    }

    window.customConfirm(`Total: R$ ${totalPurchase.toFixed(2)}\nDeseja finalizar a compra?`, async () => {
        toggleLoader(true);
        
        // Adiciona itens do carrinho à biblioteca (sem duplicar)
        const newLibrary = [...new Set([...window.userLibrary, ...window.userCart])];
        const newBalance = window.userBalance - totalPurchase;
        
        // Cria o registro de histórico
        const transaction = {
            date: new Date().toISOString(),
            items: cartGames.map(g => g.title),
            total: totalPurchase
        };
        const newHistory = [transaction, ...window.userHistory];

        // Se não estiver logado (modo teste), apenas atualiza localmente
        if (!auth.currentUser) {
            window.userLibrary = newLibrary;
            window.userCart = [];
            window.userBalance = newBalance;
            window.userHistory = newHistory;
            toggleLoader(false);
            showToast("Compra realizada (Offline)!", "success");
            refreshCurrentPageUI();
            updateNavBadges();
            return;
        }

        try {
            await db.collection('users').doc(auth.currentUser.uid).update({
                library: newLibrary,
                cart: [], // Limpa o carrinho após a compra
                balance: newBalance,
                history: newHistory
            });

            window.userLibrary = newLibrary;
            window.userCart = [];
            window.userBalance = newBalance;
            window.userHistory = newHistory;
            
            toggleLoader(false);
            showToast("Compra finalizada com sucesso!", "success");
            // O sync em tempo real cuidará de atualizar a UI e os badges
        } catch (error) {
            toggleLoader(false);
            showToast("Erro ao processar compra.", "error");
        }
    });
};

// Eventos para os botões do Header
document.addEventListener('DOMContentLoaded', () => {
    const btnCart = document.getElementById('nav-cart');
    const btnLibrary = document.getElementById('nav-library');
    const isSubfolder = window.location.pathname.includes('/html/');

    if (btnCart) {
        btnCart.onclick = () => window.location.href = isSubfolder ? 'carrinho.html' : 'html/carrinho.html';
    }
    if (btnLibrary) {
        btnLibrary.onclick = () => window.location.href = isSubfolder ? 'biblioteca.html' : 'html/biblioteca.html';
    }
});

// --- Funções de Amizade ---
window.sendFriendRequest = async (targetUid) => {
    if (!auth.currentUser) {
        showToast("Você precisa estar logado para enviar pedidos de amizade.", "info");
        return;
    }
    const myUid = auth.currentUser.uid;

    if (myUid === targetUid) {
        showToast("Você não pode enviar um pedido de amizade para si mesmo.", "error");
        return;
    }

    // Verifica se já são amigos
    if (window.userFriends.includes(targetUid)) {
        showToast("Vocês já são amigos!", "info");
        return;
    }

    // Verifica se já enviou um pedido
    if (window.userFriendRequestsSent.includes(targetUid)) {
        showToast("Pedido de amizade já enviado!", "info");
        return;
    }

    // Verifica se já recebeu um pedido do alvo (nesse caso, aceita automaticamente)
    if (window.userFriendRequestsReceived.includes(targetUid)) {
        await window.acceptFriendRequest(targetUid);
        return;
    }

    try {
        // Adiciona o pedido na lista de enviados do usuário atual
        await db.collection('users').doc(myUid).update({
            friendRequestsSent: firebase.firestore.FieldValue.arrayUnion(targetUid)
        });
        // Adiciona o pedido na lista de recebidos do usuário alvo
        await db.collection('users').doc(targetUid).update({
            friendRequestsReceived: firebase.firestore.FieldValue.arrayUnion(myUid)
        });
        showToast("Pedido de amizade enviado!", "success");
        // Atualiza os dados locais
        window.userFriendRequestsSent.push(targetUid);
        refreshCurrentPageUI();
    } catch (error) {
        console.error("Erro ao enviar pedido de amizade:", error);
        showToast("Erro ao enviar pedido de amizade.", "error");
    }
};

window.acceptFriendRequest = async (requesterUid) => {
    if (!auth.currentUser) return;
    const myUid = auth.currentUser.uid;

    try {
        // Remove o pedido da lista de recebidos do usuário atual
        await db.collection('users').doc(myUid).update({
            friendRequestsReceived: firebase.firestore.FieldValue.arrayRemove(requesterUid),
            friends: firebase.firestore.FieldValue.arrayUnion(requesterUid) // Adiciona aos amigos
        });
        // Remove o pedido da lista de enviados do remetente e o adiciona aos amigos
        await db.collection('users').doc(requesterUid).update({
            friendRequestsSent: firebase.firestore.FieldValue.arrayRemove(myUid),
            friends: firebase.firestore.FieldValue.arrayUnion(myUid) // Adiciona aos amigos
        });
        showToast("Pedido de amizade aceito!", "success");
        // Atualiza os dados locais
        window.userFriendRequestsReceived = window.userFriendRequestsReceived.filter(uid => uid !== requesterUid);
        window.userFriends.push(requesterUid);
        refreshCurrentPageUI();
    } catch (error) {
        console.error("Erro ao aceitar pedido de amizade:", error);
        showToast("Erro ao aceitar pedido de amizade.", "error");
    }
};

window.rejectFriendRequest = async (requesterUid) => {
    if (!auth.currentUser) return;
    const myUid = auth.currentUser.uid;

    try {
        // Remove o pedido da lista de recebidos do usuário atual
        await db.collection('users').doc(myUid).update({
            friendRequestsReceived: firebase.firestore.FieldValue.arrayRemove(requesterUid)
        });
        // Remove o pedido da lista de enviados do remetente
        await db.collection('users').doc(requesterUid).update({
            friendRequestsSent: firebase.firestore.FieldValue.arrayRemove(myUid)
        });
        showToast("Pedido de amizade rejeitado.", "info");
        // Atualiza os dados locais
        window.userFriendRequestsReceived = window.userFriendRequestsReceived.filter(uid => uid !== requesterUid);
        refreshCurrentPageUI();
    } catch (error) {
        console.error("Erro ao rejeitar pedido de amizade:", error);
        showToast("Erro ao rejeitar pedido de amizade.", "error");
    }
};

window.removeFriend = async (friendUid) => {
    if (!auth.currentUser) return;
    const myUid = auth.currentUser.uid;

    window.customConfirm("Tem certeza que deseja remover este amigo?", async () => {
        try {
            await db.collection('users').doc(myUid).update({ friends: firebase.firestore.FieldValue.arrayRemove(friendUid) });
            await db.collection('users').doc(friendUid).update({ friends: firebase.firestore.FieldValue.arrayRemove(myUid) });
            
            showToast("Amizade removida.");
            // O sync em tempo real cuidará de atualizar a UI local
        } catch (error) {
            showToast("Erro ao remover amigo.", "error");
        }
    });
};