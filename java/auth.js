/**
 * Lógica de autenticação e gerenciamento de sessão do usuário.
 */

const DESATIVAR_LOGIN_PARA_TESTE = false; // Altere para 'false' quando quiser reativar o login
const USAR_EMULADOR_LOCAL = false; // Mude para 'true' apenas se estiver rodando 'firebase emulators:start' no terminal

// --- CONFIGURAÇÃO DO FIREBASE ---
// Inicializa o Firebase apenas se a configuração estiver disponível

if (typeof firebaseConfig !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
window.auth = firebase.auth();
const auth = window.auth;

// Conecta ao emulador de autenticação do Firebase se estiver rodando localmente
if (USAR_EMULADOR_LOCAL && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    try {
        auth.useEmulator('http://localhost:9099');
        console.log('Conectado ao emulador de autenticação Firebase em http://localhost:9099');
    } catch (e) {
        console.warn('Não foi possível conectar ao emulador de autenticação:', e);
    }
}

// Inicializa o Firestore com segurança
window.db = null;
try {
    window.db = firebase.firestore();
    // Se o Auth usa emulador, o Firestore também deve usar para manter a consistência local
    if (USAR_EMULADOR_LOCAL && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        window.db.useEmulator('localhost', 8080);
        console.log('Conectado ao emulador do Firestore em localhost:8080');
    }
} catch (e) {
    console.warn("Firestore SDK não carregado. Funcionalidades de favoritos e admin desativadas.");
}

const db = window.db;

window.userFavorites = []; // Armazenamento global de favoritos
window.userCart = [];      // Armazenamento global do carrinho
window.userLibrary = [];   // Armazenamento global da biblioteca
window.userBalance = 0;    // Saldo da carteira
window.userUpgrades = {};  // Armazenamento de melhorias { gameId: level }
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

// Função auxiliar para o Loader
function toggleLoader(show) {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

// Função para alternar entre Login e Cadastro dentro do Modal
window.toggleModalForms = () => {
    const loginSec = document.getElementById('modal-login-section');
    const signupSec = document.getElementById('modal-signup-section');
    if (loginSec && signupSec) {
        const isLoginVisible = loginSec.style.display !== 'none';
        loginSec.style.display = isLoginVisible ? 'none' : 'block';
        signupSec.style.display = isLoginVisible ? 'block' : 'none';
    }
};

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
    const isHtmlFolder = window.location.pathname.includes('/html/');
    const isActuallySubfolder = window.location.pathname.includes('/Roleta/');
    const isWelcomePage = window.location.pathname.includes('welcome.html');
    const isLoginPage = window.location.pathname.includes('login.html');
    const isAdminPage = window.location.pathname.includes('admin.html') || window.location.pathname.includes('admin-user-detail.html');
    const adminList = (window.ADMIN_EMAILS || []).map(e => e.toLowerCase());
    const isAdmin = user && adminList.includes(user.email.toLowerCase());
    const isSkipActive = localStorage.getItem('skipLogin') === 'true';

    if (!user) {
        if (!isLoginPage && !isWelcomePage && !DESATIVAR_LOGIN_PARA_TESTE && !isSkipActive) { // Se não logado e não na página de login/welcome
            let loginPath = window.utils.getHtmlPath('login.html'); // Usa utilitário global
            if (isHtmlFolder) { // Tratamento especial para acesso direto à pasta html
                loginPath = 'login.html'; // Se já estiver na pasta html, usa apenas o nome do arquivo
            } else if (isActuallySubfolder) {
                loginPath = '../html/login.html';
            }
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

    window.checkUserSession(user);

    // Se o modo de teste estiver ativo após as verificações básicas, encerramos aqui
    if ((DESATIVAR_LOGIN_PARA_TESTE || isSkipActive) && !user) return;

    if (user) {
        // Garante que o documento do usuário existe no Firestore para aparecer no Admin e ter dados iniciais
        if (db) {
            db.collection('users').doc(user.uid).get().then(doc => {
                // Se o documento não existir OU o campo email estiver faltando, atualizamos
                const existingData = doc.exists ? doc.data() : {};
                let friendshipId = existingData.friendshipId;

                // Gerar um friendshipId se não existir (6 dígitos aleatórios)
                if (!friendshipId) {
                    friendshipId = Math.floor(100000 + Math.random() * 900000);
                }

                db.collection('users').doc(user.uid).set({
                    email: user.email,
                    balance: existingData.balance ?? 0,
                    favorites: existingData.favorites ?? [],
                    cart: existingData.cart ?? [],
                    library: existingData.library ?? [],
                    upgrades: existingData.upgrades ?? {},
                    history: existingData.history ?? [],
                    bio: existingData.bio ?? "",
                    avatar: existingData.avatar ?? "",
                    bannerURL: existingData.bannerURL ?? "",
                    bannerType: existingData.bannerType ?? "image",
                    friendshipId: friendshipId,
                    friends: existingData.friends ?? [],
                    friendRequestsSent: existingData.friendRequestsSent ?? [],
                    friendRequestsReceived: existingData.friendRequestsReceived ?? []
                }, { merge: true });
            });
        }
        if (db) loadUserData(user.uid);
    } else {
        window.userFavorites = [];
        window.userCart = [];
        window.userLibrary = [];
        if (window.routePageRendering) window.routePageRendering();
        window.updateNavBadges();
    }
});

// Função para carregar todos os dados do usuário do banco de dados
async function loadUserData(uid) {
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
            const data = doc.data();
            window.userFavorites = data.favorites || [];
            window.userCart = data.cart || [];
            window.userLibrary = data.library || [];
            window.userUpgrades = data.upgrades || {};
            window.userBalance = data.balance ?? 0.00; // Usuário começa com R$ 0,00
            window.userHistory = data.history || []; // Histórico de compras
            window.userBio = data.bio || "";
            window.userAvatar = data.avatar || "";
            window.userBannerURL = data.bannerURL || "";
            window.userBannerType = data.bannerType || "image";
            window.userFriendshipId = data.friendshipId ?? null;
            window.userFriends = data.friends || [];
            window.userFriendRequestsSent = data.friendRequestsSent || [];
            window.userFriendRequestsReceived = data.friendRequestsReceived || [];
        } else {
            window.userFavorites = []; window.userCart = []; window.userLibrary = [];
            window.userUpgrades = {}; window.userBalance = 0.00; window.userHistory = [];
            window.userBio = ""; window.userAvatar = ""; window.userBannerURL = ""; window.userBannerType = "image";
            window.userFriends = []; window.userFriendRequestsSent = []; window.userFriendRequestsReceived = [];
        }
        if (window.routePageRendering) window.routePageRendering();
        window.updateNavBadges(); // Chama a função global updateNavBadges para atualizar os badges do cabeçalho e a carteira
    } catch (e) { console.error("Erro ao carregar favoritos:", e); }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('login-modal');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const closeModal = document.querySelector('.close-modal');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const forgotPasswordModalLink = document.getElementById('forgot-password-modal-link');

    // Configuração do logotipo para redirecionar à loja (Home)
    const brand = document.querySelector('.brand');
    if (brand) {
        brand.style.cursor = 'pointer';
        brand.onclick = () => window.location.href = window.utils.getHtmlPath('index.html');
    }

    // Abrir modal de login ao clicar no botão "Entrar" do header
    if (btnLogin && loginModal) {
        btnLogin.onclick = (e) => {
            e.preventDefault();
            loginModal.style.display = 'flex';
        };
    }

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
                        window.location.href = window.utils.getHtmlPath('welcome.html');
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
                    switch (error.code) {
                        case 'auth/invalid-email':
                            message = "E-mail inválido.";
                            break;
                    }
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
                        friendshipId: Math.floor(100000 + Math.random() * 900000),
                        friends: [], friendRequestsSent: [], friendRequestsReceived: []
                    }, { merge: true });
                })
                .then(() => {
                    showToast("Conta criada com sucesso!", "success");
                    window.location.href = window.utils.getHtmlPath('welcome.html');
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

    if (forgotPasswordLink) forgotPasswordLink.onclick = handleForgotPassword;
    if (forgotPasswordModalLink) forgotPasswordModalLink.onclick = handleForgotPassword;

    // Logout
    if (btnLogout) {
        btnLogout.onclick = () => {
            localStorage.removeItem('skipLogin'); // Remove o bypass ao deslogar
            auth.signOut().then(() => {
                location.reload();
            });
        };
    }

    // --- Injeção Automática do Botão de Skip (Apenas para Teste Local) ---
    // O botão só aparece se você estiver no localhost para não afetar o site real
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const loginCard = document.querySelector('.login-card');
        if (loginCard && window.location.pathname.includes('login.html')) {
            const skipBtn = document.createElement('button');
            skipBtn.id = 'btn-skip-login-dev';
            skipBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Pular Login (Modo Teste)';
            skipBtn.className = "nav-button"; // Usa o estilo de botão que você já tem
            skipBtn.style.cssText = "width: 100%; margin-top: 15px; opacity: 0.6; font-size: 11px; justify-content: center; border-style: dashed; cursor: pointer;";
            skipBtn.onclick = () => {
                localStorage.setItem('skipLogin', 'true');
                window.location.href = window.utils.getHtmlPath('index.html');
            };
            loginCard.appendChild(skipBtn);
        }
    }
});

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
    window.updateNavBadges();
};

// Simulação de Compra (Move do Carrinho para Biblioteca)
window.purchaseLibrary = async () => {
    if (window.userCart.length === 0 || window.isActionInProgress) {
        showToast("Carrinho vazio!", "error");
        return;
    }

    if (!auth.currentUser && !DESATIVAR_LOGIN_PARA_TESTE) {
        showToast("Você precisa estar logado para realizar uma compra.", "info");
        return;
    }

    // Calcula o total da compra baseado nos dados globais
    const cartGames = window.allGamesData.filter(game => window.userCart.some(id => String(id) === String(game.id)));
    const totalPurchase = cartGames.reduce((acc, game) => acc + window.utils.parsePrice(game.currentPrice), 0);

    if (window.userBalance < totalPurchase) {
        showToast("Saldo insuficiente!", "error");
        return;
    }

    window.customConfirm(`Total: R$ ${totalPurchase.toFixed(2)}\nDeseja finalizar a compra?`, async () => {
        window.isActionInProgress = true;
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
            window.updateNavBadges();
            window.isActionInProgress = false;
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
            window.updateNavBadges();
            window.triggerSecretEvent(); // Chance de ir para o mercado negro após gastar
            location.reload();
        } catch (error) {
            toggleLoader(false);
            showToast("Erro ao processar compra.", "error");
        } finally {
            window.isActionInProgress = false;
        }
    });
};

// --- Funções de Amizade (Lógica) ---
window.sendFriendRequest = async (targetUid) => {
    if (!auth.currentUser) return showToast("Logue para adicionar amigos.", "info");
    const myUid = auth.currentUser.uid;
    if (myUid === targetUid) return showToast("Você não pode se adicionar.", "error");
    if (window.userFriends.includes(targetUid)) return showToast("Já são amigos!", "info");
    if (window.userFriendRequestsSent.includes(targetUid)) return showToast("Pedido já enviado.", "info");

    try {
        await db.collection('users').doc(myUid).update({
            friendRequestsSent: firebase.firestore.FieldValue.arrayUnion(targetUid)
        });
        await db.collection('users').doc(targetUid).update({
            friendRequestsReceived: firebase.firestore.FieldValue.arrayUnion(myUid)
        });
        showToast("Pedido de amizade enviado!", "success");
        window.userFriendRequestsSent.push(targetUid);
        refreshCurrentPageUI();
    } catch (error) { showToast("Erro ao enviar pedido.", "error"); }
};

window.acceptFriendRequest = async (requesterUid) => {
    if (!auth.currentUser) return;
    try {
        toggleLoader(true);
        const myUid = auth.currentUser.uid;
        const myRef = db.collection('users').doc(myUid);
        const requesterRef = db.collection('users').doc(requesterUid);

        await db.runTransaction(async (transaction) => {
            transaction.update(myRef, {
                friendRequestsReceived: firebase.firestore.FieldValue.arrayRemove(requesterUid),
                friends: firebase.firestore.FieldValue.arrayUnion(requesterUid)
            });
            transaction.update(requesterRef, {
                friendRequestsSent: firebase.firestore.FieldValue.arrayRemove(myUid),
                friends: firebase.firestore.FieldValue.arrayUnion(myUid)
            });
        });

        showToast("Pedido aceito!", "success");
        window.userFriendRequestsReceived = window.userFriendRequestsReceived.filter(id => id !== requesterUid);
        window.userFriends.push(requesterUid);
        refreshCurrentPageUI();
    } catch (error) { showToast("Erro ao aceitar pedido.", "error"); }
    finally { toggleLoader(false); }
};

window.rejectFriendRequest = async (requesterUid) => {
    if (!auth.currentUser) return;
    try {
        const myUid = auth.currentUser.uid;
        await db.collection('users').doc(myUid).update({
            friendRequestsReceived: firebase.firestore.FieldValue.arrayRemove(requesterUid)
        });
        await db.collection('users').doc(requesterUid).update({
            friendRequestsSent: firebase.firestore.FieldValue.arrayRemove(myUid)
        });
        showToast("Pedido rejeitado.", "info");
        window.userFriendRequestsReceived = window.userFriendRequestsReceived.filter(id => id !== requesterUid);
        refreshCurrentPageUI();
    } catch (error) { showToast("Erro ao rejeitar.", "error"); }
};

window.removeFriend = async (friendUid) => {
    if (!auth.currentUser) return;
    const myUid = auth.currentUser.uid;

    window.customConfirm("Remover este amigo?", async () => {
        try {
            toggleLoader(true);
            await db.collection('users').doc(myUid).update({
                friends: firebase.firestore.FieldValue.arrayRemove(friendUid)
            });
            await db.collection('users').doc(friendUid).update({
                friends: firebase.firestore.FieldValue.arrayRemove(myUid)
            });
            showToast("Amigo removido.");
            window.userFriends = window.userFriends.filter(id => id !== friendUid);
            refreshCurrentPageUI();
        } catch (error) { showToast("Erro ao remover.", "error"); }
        finally { toggleLoader(false); }
    });
};

// Lógica para buscar usuário pelo ID numérico
window.findUserByFriendshipId = async (friendId) => {
    const snapshot = await db.collection('users')
        .where('friendshipId', '==', parseInt(friendId))
        .limit(1)
        .get();
    return snapshot.empty ? null : { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

// Renderiza a lista de notificações (pedidos de amizade) no dropdown do sino
window.renderNotifications = async () => {
    const list = document.getElementById('notif-list');
    if (!list) return;

    const uids = window.userFriendRequestsReceived || [];
    if (uids.length === 0) {
        list.innerHTML = '<div class="empty-notif" style="padding: 15px; text-align: center; font-size: 13px; color: var(--text-secondary);">Nenhuma notificação nova.</div>';
        return;
    }

    const html = await Promise.all(uids.map(async (uid) => {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) return '';
        const userData = userDoc.data();
        const name = window.utils.getUserFriendlyName(userData);
        const avatar = userData.avatar || `https://ui-avatars.com/api/?name=${name}&background=27ae60&color=fff`;
        return `
            <div class="notification-item" style="display: flex; gap: 12px; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center;">
                <img src="${avatar}" style="width: 32px; height: 32px; border-radius: 50%;">
                <div style="flex: 1; font-size: 12px;">
                    <div style="margin-bottom: 6px; color: var(--text-main);"><strong>${name}</strong> quer ser seu amigo.</div>
                    <div style="display: flex; gap: 6px;">
                        <button class="buy-button" onclick="window.acceptFriendRequest('${uid}')" style="padding: 4px 8px; font-size: 10px; margin:0; width: auto; height: auto;">Aceitar</button>
                        <button class="nav-button" onclick="window.rejectFriendRequest('${uid}')" style="padding: 4px 8px; font-size: 10px; margin:0; width: auto; height: auto;">Recusar</button>
                    </div>
                </div>
            </div>`;
    }));
    list.innerHTML = html.join('');
};

// Lógica do Botão de Jogo Aleatório (Contextual)
window.handleRandomGame = () => {
    const games = window.allGamesData || [];
    if (games.length === 0) {
        showToast("Carregando dados dos jogos...", "info");
        return;
    }

    const path = window.location.pathname;
    
    // Função interna para resolver o caminho da página de jogo
    const getGamePath = (gameId) => {
        // Usa a função global para resolver o caminho
        const targetFile = `jogo.html?id=${gameId}`;
        return window.utils.getHtmlPath(targetFile);
    };

    // 1. Contexto de Biblioteca: Sorteia entre os jogos que o usuário já tem
    if (path.includes('biblioteca.html')) {
        if (!window.userLibrary || window.userLibrary.length === 0) {
            return showToast("Sua biblioteca está vazia!", "info");
        }
        const randomId = window.userLibrary[Math.floor(Math.random() * window.userLibrary.length)];
        window.location.href = getGamePath(randomId);
    } 
    // 2. Contexto de Roleta: Seleciona um jogo elegível para aposta
    else if (path.includes('roleta.html')) {
        const bettableGames = games.filter(game => {
            const isOwned = window.userLibrary.some(libId => String(libId) === String(game.id));
            const isNotFree = window.utils.parsePrice(game.currentPrice) > 0;
            return isOwned && isNotFree;
        });

        if (bettableGames.length === 0) {
            return showToast("Você não possui jogos pagos para apostar!", "info");
        }

        const randomGame = bettableGames[Math.floor(Math.random() * bettableGames.length)];
        if (typeof window.selectGameForBet === 'function') {
            window.selectGameForBet(randomGame.id);
            showToast(`Sorteado para aposta: ${randomGame.title}`, "success");
        }
    } 
    // 3. Contexto Geral (Loja/Busca): Sugere um jogo qualquer da loja
    else {
        const randomGame = games[Math.floor(Math.random() * games.length)];
        window.location.href = window.utils.getHtmlPath(`jogo.html?id=${randomGame.id}`);
    }
};