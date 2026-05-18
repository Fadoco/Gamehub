/**
 * Lógica de autenticação e gerenciamento de sessão do usuário.
 */

// --- CONFIGURAÇÃO DO FIREBASE ---
// Inicializa o Firebase apenas se a configuração estiver disponível
if (typeof firebaseConfig !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore(); // Inicializa o Firestore

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

    const ADMIN_EMAILS = ["fadoco12311@gmail.com"]; // Lista de e-mails de administradores
    const isAdmin = user && ADMIN_EMAILS.includes(user.email); // Calcula se o usuário logado é admin

    if (!user && !isLoginPage) {
        // Melhora a detecção do caminho base para evitar redirecionamentos infinitos ou errados
        let loginPath;
        if (isSubfolder) {
            loginPath = 'login.html';
        } else {
            loginPath = 'html/login.html';
        }
        
        window.location.href = loginPath;
    }

    if (user && isLoginPage) {
        window.location.href = '../index.html';
    }

    // Proteção de Rota Admin: Se tentar acessar a página admin sem ser o dono, volta pra home
    if (isAdminPage && !isAdmin) {
        window.location.href = '../index.html';
    }

    // Atualiza a interface sempre que o estado do usuário mudar
    checkUserSession(user, isAdmin); // Passa isAdmin para a função

    if (user) {
        loadFavorites(user.uid);
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

    // Abrir modal
    if (btnLogin) {
        btnLogin.onclick = () => loginModal.style.display = 'flex';
    }

    // Fechar modal
    if (closeModal) {
        closeModal.onclick = () => loginModal.style.display = 'none';
    }

    // Fechar ao clicar fora
    window.onclick = (event) => {
        if (event.target == loginModal) loginModal.style.display = 'none';
    }

    // Lógica do formulário
    // Lógica do formulário de Login
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
                    const isNewUser = userCredential.additionalUserInfo.isNewUser;
                    const isLoginPage = window.location.pathname.includes('login.html');

                    if (isNewUser) {
                        alert("Conta criada e login realizado com sucesso! Bem-vindo ao GameHub.");
                        window.location.href = isLoginPage ? '../html/welcome.html' : 'html/welcome.html';
                    } else {
                        alert("Login realizado com sucesso!");
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

function checkUserSession(user, isAdmin) { // Recebe isAdmin como parâmetro
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const userNameSpan = document.getElementById('user-name');
    const userImg = document.querySelector('.user-profile img');
    const userMenu = document.getElementById('user-menu');

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
                adminBtn.style.cssText = "font-size: 10px; color: var(--secondary); background: none; border: none; cursor: pointer;";
                adminBtn.innerHTML = '<i class="fas fa-tools"></i> Admin';
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