/**
 * Lógica de autenticação e gerenciamento de sessão do usuário.
 */

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

// Função auxiliar para o Loader
function toggleLoader(show) {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

// --- VERIFICAÇÃO DE SEGURANÇA (Monitora o estado da sessão em tempo real) ---
auth.onAuthStateChanged((user) => {
    const isLoginPage = window.location.pathname.includes('login.html');
    const isAdminPage = window.location.pathname.includes('admin.html');
    const isSubfolder = window.location.pathname.includes('/html/');

    const ADMIN_EMAILS = ["fadoco12311@gmail.com"]; 
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);

    if (!user) {
        // 1. Se NÃO estiver logado e NÃO estiver na página de login, redireciona para login.html
        if (!isLoginPage) {
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
        if (db) loadFavorites(user.uid);
    } else {
        window.userFavorites = [];
    }
});

// Função para carregar favoritos do banco de dados
async function loadFavorites(uid) {
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
            window.userFavorites = doc.data().favorites || [];
        } else {
            window.userFavorites = [];
        }
        // Força a atualização da interface se as funções de renderização existirem
        if (typeof renderGames === 'function' && typeof allGamesData !== 'undefined') {
            renderGames(allGamesData);
        }
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
                    window.location.href = '../html/welcome.html';
                })
                .catch((error) => {
                    alert("Erro ao cadastrar: " + error.message);
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
        }
    } else {
        if (btnLogin) btnLogin.style.display = 'block';
        if (btnLogout) btnLogout.style.display = 'none';
        if (userNameSpan) userNameSpan.style.display = 'none';
    }
}

// Função global para favoritar/desfavoritar
window.toggleFavorite = async (event, gameId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!db) {
        alert("Erro: Banco de dados não inicializado.");
        return;
    }

    if (!auth.currentUser) {
        document.getElementById('login-modal').style.display = 'flex';
        return;
    }

    if (window.userFavorites.includes(gameId)) {
        window.userFavorites = window.userFavorites.filter(id => id !== gameId);
    } else {
        window.userFavorites.push(gameId);
    }

    await db.collection('users').doc(auth.currentUser.uid).set({
        favorites: window.userFavorites
    }, { merge: true });

    if (typeof renderGames === 'function') renderGames(allGamesData);
};