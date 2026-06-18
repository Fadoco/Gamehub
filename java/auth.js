/**
 * Lógica de autenticação e gerenciamento de sessão do usuário.
 */

// ===== PROTEÇÃO CONTRA CARREGAMENTO DUPLICADO =====
if (typeof window.authModuleLoaded !== 'undefined') {
  console.warn('⚠️ auth.js já foi carregado. Ignorando duplicata.');
} else {
  window.authModuleLoaded = true;

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
        if (window.SecurityModule?.DEBUG_MODE) {
            console.log('Conectado ao emulador de autenticação Firebase em http://localhost:9099');
        }
    } catch (e) {
        if (window.SecurityModule?.DEBUG_MODE) {
            console.warn('Não foi possível conectar ao emulador de autenticação:', e);
        }
    }
}

// Inicializa o Firestore com segurança
window.db = null;
try {
    window.db = firebase.firestore();
    // Se o Auth usa emulador, o Firestore também deve usar para manter a consistência local
    if (USAR_EMULADOR_LOCAL && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        window.db.useEmulator('localhost', 8080);
        if (window.SecurityModule?.DEBUG_MODE) {
            console.log('Conectado ao emulador do Firestore em localhost:8080');
        }
    }
} catch (e) {
    console.warn("Firestore SDK não carregado. Funcionalidades de favoritos e admin desativadas.");
}

const db = window.db;

function getModuleBasePath() {
    const currentPath = window.location.pathname || '';
    return currentPath.includes('/html/') || currentPath.includes('/Roleta/')
        ? '../java/modules/'
        : 'java/modules/';
}

function loadAuthModules() {
    if (window.LoginModule && window.RegisterModule && window.SessionModule && window.PermissionsModule && window.UserMenuModule) {
        return Promise.resolve();
    }

    const moduleFiles = ['login.js', 'register.js', 'session.js', 'permissions.js', 'user-menu.js'];
    const basePath = getModuleBasePath();

    return Promise.all(moduleFiles.map((file) => new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src*="${file}"]`);
        if (existing) {
            if (existing.dataset.loaded === 'true') {
                resolve();
                return;
            }
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error(`Erro ao carregar ${file}`)), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = `${basePath}${file}`;
        script.async = false;
        script.onload = () => {
            script.dataset.loaded = 'true';
            resolve();
        };
        script.onerror = () => reject(new Error(`Erro ao carregar ${file}`));
        document.head.appendChild(script);
    })));
}

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
    const isAdmin = user && (
        (typeof window.PermissionsModule?.isAdmin === 'function' && window.PermissionsModule.isAdmin(user)) ||
        adminList.includes((user.email || '').toLowerCase())
    );
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

    if (typeof window.checkUserSession === 'function') {
        window.checkUserSession(user);
    }

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
        // Carrega dados do usuário - verifica se db está disponível
        if (db && user.uid) {
            // Não aguarda para não bloquear a renderização, mas garante segurança
            loadUserData(user.uid).catch(e => console.warn("Aviso ao carregar dados do usuário:", e));
        } else {
            // Se não conseguir carregar do Firestore, reinicializa com valores padrão
            window.userFavorites = [];
            window.userCart = [];
            window.userLibrary = [];
            if (window.routePageRendering) window.routePageRendering();
            window.updateNavBadges();
        }
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
            
            // Debug: Mostrar notificações carregadas
            if (window.userFriendRequestsReceived && window.userFriendRequestsReceived.length > 0) {
                console.log(`✅ ${window.userFriendRequestsReceived.length} notificações de amizade carregadas`);
            }
        } else {
            window.userFavorites = []; window.userCart = []; window.userLibrary = [];
            window.userUpgrades = {}; window.userBalance = 0.00; window.userHistory = [];
            window.userBio = ""; window.userAvatar = ""; window.userBannerURL = ""; window.userBannerType = "image";
            window.userFriends = []; window.userFriendRequestsSent = []; window.userFriendRequestsReceived = [];
        }
        if (window.routePageRendering) window.routePageRendering();
        window.updateNavBadges(); // Chama a função global updateNavBadges para atualizar os badges do cabeçalho e a carteira
        window.setupFriendshipListener(uid); // Ativa listener em tempo real para novas notificações de amizade
    } catch (e) { console.error("Erro ao carregar favoritos:", e); }
}

// Exporta para escopo global para que outros scripts possam chamar
window.loadUserData = loadUserData;

// Listener em tempo real para atualizações de amizade
function setupFriendshipListener(uid) {
    if (!uid || !window.db) return;
    
    window.db.collection('users').doc(uid).onSnapshot(
        (doc) => {
            if (doc.exists) {
                const data = doc.data();
                const previousCount = (window.userFriendRequestsReceived || []).length;
                
                window.userFriendRequestsReceived = data.friendRequestsReceived || [];
                window.userFriends = data.friends || [];
                window.userFriendRequestsSent = data.friendRequestsSent || [];
                
                const currentCount = window.userFriendRequestsReceived.length;
                
                // Atualizar badge de notificações
                const notifBadge = document.getElementById('notif-badge');
                if (notifBadge) {
                    notifBadge.textContent = currentCount;
                    notifBadge.style.display = currentCount > 0 ? 'block' : 'none';
                    
                    // Se chegou novo pedido, renderizar notificações se dropdown estiver aberto
                    if (currentCount > previousCount) {
                        const dropdown = document.getElementById('notif-dropdown');
                        if (dropdown && dropdown.style.display === 'block') {
                            window.renderNotifications();
                        }
                        // Animar badge
                        notifBadge.style.animation = 'none';
                        setTimeout(() => {
                            notifBadge.style.animation = 'pulse 0.6s ease-in-out 2';
                        }, 10);
                    }
                }
                
                // Renderizar pedidos recebidos na página de perfil (se existir função)
                if (window.renderRequests && currentCount > previousCount) {
                    setTimeout(() => window.renderRequests(), 100);
                }
                
                if (window.userFriendRequestsReceived.length > 0) {
                    console.log(`🔔 ${window.userFriendRequestsReceived.length} notificações recebidas`);
                }
            }
        },
        (error) => {
            console.error("Erro ao ouvir amizades:", error);
        }
    );
}

window.setupFriendshipListener = setupFriendshipListener;

document.addEventListener('DOMContentLoaded', async () => {
    await loadAuthModules();

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
            LoginModule.login(email, password)
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

            RegisterModule.signup(email, password, name)
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
        btnLogout.onclick = async () => {
            try {
                await SessionModule.logout();
                location.reload();
            } catch (error) {
                console.error('Erro ao sair:', error);
                showToast('Erro ao sair da conta.', 'error');
            }
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
// Com validação de segurança e rate limiting
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

    // Valida gameId
    if (!window.Validators.gameId(gameId)) {
        window.SecurityModule?.logger?.security('Tentativa de favoritar game inválido', 'INVALID_GAME_ID', { gameId });
        showToast("Jogo inválido.", "error");
        return;
    }

    try {
        // Local update primeiro
        if (window.userFavorites.includes(gameId)) {
            window.userFavorites = window.userFavorites.filter(id => id !== gameId);
        } else {
            window.userFavorites.push(gameId);
        }

        // Persiste no banco se autenticado
        if (auth.currentUser && db) {
            await window.FirebaseTransactions.updateUserArray(
                auth.currentUser.uid,
                'favorites',
                window.userFavorites
            );
        }

        refreshCurrentPageUI();
    } catch (error) {
        window.SecurityModule?.logger?.error('Erro ao favoritar:', error);
        showToast("Erro ao favoritar. Tente novamente.", "error");
    }
}

// Função para Adicionar/Remover do Carrinho
// Com validação de segurança e transações
window.toggleCart = async (gameId) => {
    try {
        // Validação básica do gameId
        if (!gameId || (typeof gameId !== 'number' && typeof gameId !== 'string')) {
            showToast("Erro ao adicionar jogo ao carrinho.", "error");
            return;
        }

        if (!auth.currentUser && !DESATIVAR_LOGIN_PARA_TESTE) {
            window.location.href = window.location.pathname.includes('/html/') ? 'login.html' : 'html/login.html';
            return;
        }

        // Verificação adicional com Validators se disponível
        if (window.Validators && typeof window.Validators.gameId === 'function') {
            if (!window.Validators.gameId(gameId)) {
                window.SecurityModule?.logger?.security('Tentativa de carrinho com game inválido', 'INVALID_GAME_ID', { gameId });
                showToast("Jogo inválido.", "error");
                return;
            }
        }

        // Verifica se o jogo já está na biblioteca
        if (window.userLibrary && window.userLibrary.includes(gameId)) {
            showToast("Você já possui este jogo!", "info");
            return;
        }

        // Inicializa carrinho se não existir
        if (!window.userCart) window.userCart = [];

        // Atualização local
        const index = window.userCart.indexOf(gameId);
        if (index > -1) {
            window.userCart.splice(index, 1);
            showToast("Removido do carrinho.");
        } else {
            window.userCart.push(gameId);
            showToast("Adicionado ao carrinho!", "success");
        }

        // Persiste no banco se autenticado
        if (auth.currentUser && db) {
            try {
                // Tenta usar FirebaseTransactions se disponível, senão usa db direto
                if (window.FirebaseTransactions && typeof window.FirebaseTransactions.updateUserArray === 'function') {
                    await window.FirebaseTransactions.updateUserArray(
                        auth.currentUser.uid,
                        'cart',
                        window.userCart
                    );
                } else {
                    // Fallback: atualiza direto no Firestore
                    await db.collection('users').doc(auth.currentUser.uid).update({
                        cart: window.userCart
                    });
                }
            } catch (firebaseError) {
                console.error('Erro ao persistir carrinho:', firebaseError);
                // Não falha a operação se o Firebase falhar - o carrinho funciona localmente
            }
        }
        
        // Atualiza UI em tempo real
        refreshCurrentPageUI();
        window.updateNavBadges();
        
        // Force re-render se na pagina do carrinho
        if (typeof window.renderCart === 'function' && window.location.pathname.includes('carrinho')) {
            setTimeout(() => window.renderCart(), 100);
        }
    } catch (error) {
        console.error('Erro ao atualizar carrinho:', error);
        window.SecurityModule?.logger?.error('Erro ao atualizar carrinho:', error);
        showToast("Erro ao atualizar carrinho. Tente novamente.", "error");
    }
};

// Simulação de Compra (Move do Carrinho para Biblioteca)
// Usa transações Firebase para garantir atomicidade e evitar race conditions
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
        
        // Se não estiver logado (modo teste), apenas atualiza localmente
        if (!auth.currentUser) {
            const newLibrary = [...new Set([...window.userLibrary, ...window.userCart])];
            const newBalance = window.userBalance - totalPurchase;
            
            const purchaseRecord = {
                date: new Date().toISOString(),
                items: cartGames.map(g => g.title),
                total: totalPurchase
            };
            
            window.userLibrary = newLibrary;
            window.userCart = [];
            window.userBalance = newBalance;
            window.userHistory = [purchaseRecord, ...window.userHistory];
            
            toggleLoader(false);
            showToast("Compra realizada (Modo Teste)!", "success");
            refreshCurrentPageUI();
            window.updateNavBadges();
            window.isActionInProgress = false;
            return;
        }

        try {
            let result = null;
            
            // Tenta usar FirebaseTransactions se disponível
            if (window.FirebaseTransactions && typeof window.FirebaseTransactions.purchaseGameTransaction === 'function') {
                result = await window.FirebaseTransactions.purchaseGameTransaction(
                    auth.currentUser.uid,
                    window.userCart,
                    totalPurchase
                );
            } else {
                // Fallback: atualiza manualmente no Firestore
                const newLibrary = [...new Set([...window.userLibrary, ...window.userCart])];
                const newBalance = window.userBalance - totalPurchase;
                
                await db.collection('users').doc(auth.currentUser.uid).update({
                    library: newLibrary,
                    cart: [],
                    balance: newBalance
                });
                
                result = {
                    library: newLibrary,
                    newBalance: newBalance,
                    gamesPurchased: window.userCart.length
                };
            }

            // Cria registro de histórico
            const purchaseRecord = {
                date: new Date().toISOString(),
                items: cartGames.map(g => g.title),
                total: totalPurchase
            };

            // Atualiza histórico
            try {
                await db.collection('users').doc(auth.currentUser.uid).update({
                    history: firebase.firestore.FieldValue.arrayUnion(purchaseRecord)
                });
            } catch (historyError) {
                console.error('Erro ao atualizar histórico:', historyError);
            }

            // Atualiza globais locais
            window.userLibrary = result.library;
            window.userCart = [];
            window.userBalance = result.newBalance;
            window.userHistory = [purchaseRecord, ...window.userHistory];
            
            toggleLoader(false);
            showToast(`Compra finalizada com sucesso! ${result.gamesPurchased} jogo(s) adicionado(s).`, "success");
            window.updateNavBadges();
            location.reload();
        } catch (error) {
            toggleLoader(false);
            
            // Log de segurança
            window.SecurityModule?.logger?.security(
                `Erro na compra`,
                'PURCHASE_FAILED',
                { error: error.message }
            );

            showToast(error.message || "Erro ao processar compra.", "error");
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
    if (window.userFriends && window.userFriends.includes(targetUid)) return showToast("Já são amigos!", "info");
    if (window.userFriendRequestsSent && window.userFriendRequestsSent.includes(targetUid)) return showToast("Pedido já enviado.", "info");

    try {
        // Usar coleção centralizada para pedidos de amizade
        const requestId = `${myUid}_${targetUid}`;
        
        await db.collection('friendRequests').doc(requestId).set({
            from: myUid,
            to: targetUid,
            status: 'pending',
            createdAt: firebase.firestore.Timestamp.now(),
            updatedAt: firebase.firestore.Timestamp.now()
        });
        
        showToast("Pedido de amizade enviado!", "success");
        window.userFriendRequestsSent = window.userFriendRequestsSent || [];
        window.userFriendRequestsSent.push(targetUid);
        console.log(`Pedido enviado de ${myUid} para ${targetUid}`);
    } catch (error) { 
        console.error('Erro ao enviar pedido:', error);
        showToast("Erro ao enviar pedido: " + error.message, "error"); 
    }
};

window.acceptFriendRequest = async (requesterUid) => {
    if (!auth.currentUser) return;
    try {
        toggleLoader(true);
        const myUid = auth.currentUser.uid;
        const requestId = `${requesterUid}_${myUid}`;

        // Atualizar apenas a coleção friendRequests
        await db.collection('friendRequests').doc(requestId).update({
            status: 'accepted',
            updatedAt: firebase.firestore.Timestamp.now()
        });

        // Atualizar documentos de usuário (apenas o próprio)
        await db.collection('users').doc(myUid).update({
            friends: firebase.firestore.FieldValue.arrayUnion(requesterUid)
        });
        
        // Tentar atualizar requester se possível (pode falhar por permissões)
        try {
            await db.collection('users').doc(requesterUid).update({
                friends: firebase.firestore.FieldValue.arrayUnion(myUid)
            });
        } catch (e) {
            console.warn('Não foi possível atualizar friends do solicitante:', e);
        }

        showToast("Pedido aceito!", "success");
        window.userFriendRequestsReceived = window.userFriendRequestsReceived.filter(id => id !== requesterUid);
        window.userFriends = window.userFriends || [];
        window.userFriends.push(requesterUid);
        refreshCurrentPageUI();
    } catch (error) { 
        console.error('Erro ao aceitar pedido:', error);
        showToast("Erro ao aceitar pedido.", "error"); 
    }
    finally { toggleLoader(false); }
};

window.rejectFriendRequest = async (requesterUid) => {
    if (!auth.currentUser) return;
    try {
        const myUid = auth.currentUser.uid;
        const requestId = `${requesterUid}_${myUid}`;
        
        // Atualizar o documento de pedido para rejeitado
        await db.collection('friendRequests').doc(requestId).update({
            status: 'rejected',
            updatedAt: firebase.firestore.Timestamp.now()
        });
        
        showToast("Pedido rejeitado.", "info");
        window.userFriendRequestsReceived = window.userFriendRequestsReceived.filter(id => id !== requesterUid);
        refreshCurrentPageUI();
    } catch (error) { 
        console.error('Erro ao rejeitar:', error);
        showToast("Erro ao rejeitar.", "error"); 
    }
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
            
            // Tentar atualizar amigo também (pode falhar por permissões)
            try {
                await db.collection('users').doc(friendUid).update({
                    friends: firebase.firestore.FieldValue.arrayRemove(myUid)
                });
            } catch (e) {
                console.warn('Não foi possível atualizar friends do outro usuário:', e);
            }
            
            showToast("Amigo removido.");
            window.userFriends = window.userFriends.filter(id => id !== friendUid);
            refreshCurrentPageUI();
        } catch (error) { 
            console.error('Erro ao remover amigo:', error);
            showToast("Erro ao remover.", "error"); 
        }
        finally { toggleLoader(false); }
    });
};

// Lógica para buscar usuário pelo ID numérico
window.findUserByFriendshipId = async (friendId) => {
    const snapshot = await db.collection('users')
        .where('friendshipId', '==', parseInt(friendId))
        .limit(1)
        .get();
    
    if (snapshot.empty) return null;
    
    const userData = snapshot.docs[0].data();
    return { uid: snapshot.docs[0].id, ...userData };
};

// Nova função: Buscar usuários pelo displayName (nick)
window.findUsersByDisplayName = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length === 0) return [];
    
    const term = searchTerm.toLowerCase().trim();
    const currentUid = auth.currentUser?.uid;
    
    console.log('[findUsersByDisplayName] Iniciando busca por:', term);
    console.log('[findUsersByDisplayName] UID atual:', currentUid);
    
    try {
        // Busca direta: fetch todos os usuários e filtra localmente
        console.log('[findUsersByDisplayName] Buscando todos os usuários...');
        const allUsersSnapshot = await db.collection('users').get();
        console.log('[findUsersByDisplayName] Total de usuários no Firestore:', allUsersSnapshot.size);
        
        if (allUsersSnapshot.empty) {
            console.warn('[findUsersByDisplayName] Nenhum usuário encontrado no Firestore');
            return [];
        }
        
        const results = allUsersSnapshot.docs
            .map(doc => ({ uid: doc.id, ...doc.data() }))
            .filter(user => {
                // Filtro 1: Deve ter displayName
                if (!user.displayName) {
                    console.log('[findUsersByDisplayName] Usuário sem displayName ignorado:', user.uid);
                    return false;
                }
                // Filtro 2: Nome deve conter termo de busca
                const matches = user.displayName.toLowerCase().includes(term);
                console.log('[findUsersByDisplayName] Verificando', user.displayName, '- Match:', matches);
                if (!matches) return false;
                
                // Filtro 3: Não retornar o próprio usuário
                if (user.uid === currentUid) {
                    console.log('[findUsersByDisplayName] Ignorando próprio usuário');
                    return false;
                }
                return true;
            })
            .slice(0, 10);
        
        console.log('[findUsersByDisplayName] Resultados finais:', results.length, results);
        return results;
    } catch (error) {
        console.error('[findUsersByDisplayName] ERRO:', error);
        showToast('Erro ao buscar usuários. Tente novamente.', 'error');
        return [];
    }
};

} // Fim da proteção contra carregamento duplicado

// Cache para evitar rerenderings desnecessários
let lastRenderNotifCount = -1;

// Renderiza a lista de notificações (pedidos de amizade) no dropdown do sino
window.renderNotifications = async () => {
    const list = document.getElementById('notif-list');
    if (!list) return;

    const uids = window.userFriendRequestsReceived || [];
    
    // Só rerender se a contagem mudar
    if (lastRenderNotifCount === uids.length) return;
    lastRenderNotifCount = uids.length;
    
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