/**
 * Lógica de autenticação e gerenciamento de sessão do usuário.
 */

const DESATIVAR_LOGIN_PARA_TESTE = false; // Altere para 'false' quando quiser reativar o login

// --- CONFIGURAÇÃO DO FIREBASE ---
// Inicializa o Firebase apenas se a configuração estiver disponível
if (typeof firebaseConfig !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// Inicializa o Firestore com segurança
let db;
try {
    db = firebase.firestore();
} catch (e) {
    console.warn("Firestore SDK não carregado. Funcionalidades de favoritos e admin desativadas.");
}

window.userFavorites = []; // Armazenamento global de favoritos
window.userCart = [];      // Armazenamento global do carrinho
window.userLibrary = [];   // Armazenamento global da biblioteca

// Função auxiliar para o Loader
function toggleLoader(show) {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

// --- VERIFICAÇÃO DE SEGURANÇA (Monitora o estado da sessão em tempo real) ---
auth.onAuthStateChanged((user) => {
    const isLoginPage = window.location.pathname.includes('login.html');
    const isAdminPage = window.location.pathname.includes('admin.html');
    const isWelcomePage = window.location.pathname.includes('welcome.html');
    const isSubfolder = window.location.pathname.includes('/html/');

    // Se o modo de teste estiver ativo, ignora os redirecionamentos de bloqueio
    if (DESATIVAR_LOGIN_PARA_TESTE) {
        checkUserSession(user); 
        if (user && db) loadUserData(user.uid);
        return;
    }

    const ADMIN_EMAILS = ["fadoco12311@gmail.com"]; 
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);

    if (!user) {
        // 1. Se NÃO estiver logado e NÃO estiver na página de login ou boas-vindas, redireciona para login.html
        if (!isLoginPage && !isWelcomePage) {
            const loginPath = isSubfolder ? 'login.html' : 'html/login.html';
            window.location.href = loginPath;
            return;
        }
    } else {
        // 2. Se ESTIVER logado e tentar acessar a página de login, manda para a home
        if (isLoginPage) {
            window.location.href = '../index.html';
            return;
        }
        // 3. Proteção de Rota Admin: Somente o Admin logado pode ver a página administrativa
        if (isAdminPage && !isAdmin) {
            window.location.href = '../index.html';
            return;
        }
    }

    // Atualiza a interface sempre que o estado do usuário mudar
    checkUserSession(user); 

    if (user) {
        if (db) loadUserData(user.uid);
    } else {
        window.userFavorites = [];
        window.userCart = [];
        window.userLibrary = [];
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
        } else {
            window.userFavorites = []; window.userCart = []; window.userLibrary = [];
        }
        refreshCurrentPageUI();
        updateNavBadges();
    } catch (e) { console.error("Erro ao carregar favoritos:", e); }
}

// Função auxiliar para atualizar a interface da página atual sem recarregar
function refreshCurrentPageUI() {
    if (typeof allGamesData !== 'undefined' && allGamesData.length > 0) {
        if (window.location.pathname.includes('jogo.html') && typeof renderGameDetails === 'function') {
            renderGameDetails(allGamesData);
        } else if (window.location.pathname.includes('busca.html') && typeof renderSearchResults === 'function') {
            renderSearchResults(allGamesData);
        } else if (typeof renderGames === 'function') {
            renderGames(allGamesData);
        }
    }
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
                        alert("Conta criada e login realizado com sucesso! Bem-vindo ao GameHub.");
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
                    switch (error.code) {
                        case 'auth/invalid-email':
                            message = "E-mail inválido.";
                            break;
                    }
                    console.error("Erro no Login:", error); // Log detalhado do erro
                    alert(message);
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
                    alert("Conta criada com sucesso! Bem-vindo(a) ao GameHub.");
                    window.location.href = 'welcome.html';
                })
                .catch((error) => {
                    console.error("Erro no Cadastro:", error);
                    if (error.message.includes('requests-from-referer-blocked')) {
                        alert("Erro de Segurança: O domínio local (127.0.0.1:5500) não está autorizado no Google Cloud Console para esta API Key.");
                    } else {
                        alert("Erro ao cadastrar: " + error.message);
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
            alert("Por favor, digite seu e-mail no campo correspondente antes de clicar em esqueci a senha.");
            return;
        }

        toggleLoader(true);
        auth.sendPasswordResetEmail(email)
            .then(() => {
                toggleLoader(false);
                alert("E-mail de recuperação enviado! Verifique sua caixa de entrada (e a pasta de spam).");
            })
            .catch((error) => {
                toggleLoader(false);
                console.error("Erro ao enviar e-mail de recuperação:", error); // Log detalhado do erro
                alert("Erro ao enviar e-mail: " + error.message);
            });
    };

    if (forgotPasswordLink) forgotPasswordLink.onclick = handleForgotPassword;
    if (forgotPasswordModalLink) forgotPasswordModalLink.onclick = handleForgotPassword;

    // Logout
    if (btnLogout) {
        btnLogout.onclick = () => {
            auth.signOut().then(() => {
                location.reload();
            });
        };
    }
});

function checkUserSession(user) { // isAdmin é calculado aqui dentro
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const userNameSpan = document.getElementById('user-name');
    const userImg = document.querySelector('.user-profile img');
    const userMenu = document.getElementById('user-menu');
    
    // Garante que o container de perfil esteja visível no header
    if (userMenu) userMenu.style.display = 'flex';

    const ADMIN_EMAILS = ["fadoco12311@gmail.com"]; // Lista de e-mails de administradores
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);

    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
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
        alert("Erro: Banco de dados não inicializado.");
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
}

// Função para Adicionar/Remover do Carrinho
window.toggleCart = async (gameId) => {
    if (!auth.currentUser && !DESATIVAR_LOGIN_PARA_TESTE) {
        window.location.href = window.location.pathname.includes('/html/') ? 'login.html' : 'html/login.html';
        return;
    }

    // Verifica se o jogo já está na biblioteca
    if (window.userLibrary.includes(gameId)) {
        alert("Você já possui este jogo na sua biblioteca!");
        return;
    }

    const index = window.userCart.indexOf(gameId);
    if (index > -1) {
        window.userCart.splice(index, 1);
        alert("Removido do carrinho.");
    } else {
        window.userCart.push(gameId);
        alert("Adicionado ao carrinho!");
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
        alert("Seu carrinho está vazio!");
        return;
    }

    if (!auth.currentUser && !DESATIVAR_LOGIN_PARA_TESTE) {
        alert("Você precisa estar logado para realizar uma compra.");
        return;
    }

    if (confirm(`Deseja finalizar a compra de ${window.userCart.length} item(s)?`)) {
        toggleLoader(true);
        
        // Adiciona itens do carrinho à biblioteca (sem duplicar)
        const newLibrary = [...new Set([...window.userLibrary, ...window.userCart])];

        // Se não estiver logado (modo teste), apenas atualiza localmente
        if (!auth.currentUser) {
            window.userLibrary = newLibrary;
            window.userCart = [];
            toggleLoader(false);
            alert("Compra realizada com sucesso (Modo Offline)!");
            refreshCurrentPageUI();
            updateNavBadges();
            return;
        }

        try {
            await db.collection('users').doc(auth.currentUser.uid).update({
                library: newLibrary,
                cart: [] // Limpa o carrinho após a compra
            });

            window.userLibrary = newLibrary;
            window.userCart = [];
            
            toggleLoader(false);
            alert("Compra realizada com sucesso! Os jogos agora estão na sua Biblioteca.");
            updateNavBadges();
            location.reload();
        } catch (error) {
            toggleLoader(false);
            alert("Erro ao processar compra: " + error.message);
        }
    }
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