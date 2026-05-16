/**
 * Lógica de autenticação e gerenciamento de sessão do usuário.
 */

// --- CONFIGURAÇÃO DO FIREBASE ---
// Inicializa o Firebase apenas se a configuração estiver disponível
if (typeof firebaseConfig !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// --- VERIFICAÇÃO DE SEGURANÇA (Monitora o estado da sessão em tempo real) ---
auth.onAuthStateChanged((user) => {
    const isLoginPage = window.location.pathname.includes('login.html');
    const isSubfolder = window.location.pathname.includes('/html/');

    if (!user && !isLoginPage) {
        // Detecta a localização correta do login.html de forma robusta
        const currentPath = window.location.pathname;
        const isInHtmlFolder = currentPath.includes('/html/');
        const loginPath = isInHtmlFolder ? 'login.html' : 'html/login.html';
        
        window.location.href = loginPath;
    }
    if (user && isLoginPage) {
        window.location.href = '../index.html';
    }

    // Atualiza a interface sempre que o estado do usuário mudar
    checkUserSession(user);
});

document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('login-modal');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const closeModal = document.querySelector('.close-modal');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const googleButtons = document.querySelectorAll('.btn-google');
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
            const email = document.getElementById('email')?.value || document.getElementById('username')?.value;
            const password = document.getElementById('password').value;

            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    alert("Login realizado com sucesso!");
                    if (window.location.pathname.includes('login.html')) {
                        window.location.href = '../index.html';
                    } else {
                        loginModal.style.display = 'none';
                    }
                })
                .catch((error) => {
                    let message = "E-mail ou senha incorretos.";
                    // Em produção, usamos mensagens genéricas por segurança
                    switch (error.code) {
                        case 'auth/invalid-email':
                            message = "E-mail inválido.";
                            break;
                    }
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
                    alert("Conta criada com sucesso! Bem-vindo ao GameHub.");
                    window.location.href = '../index.html';
                })
                .catch((error) => {
                    alert("Erro ao cadastrar: " + error.message);
                    console.error(error);
                });
        };
    }

    // Lógica de Esqueci a Senha
    const handleForgotPassword = () => {
        const email = document.getElementById('email')?.value || document.getElementById('username')?.value;
        if (!email) {
            alert("Por favor, digite seu e-mail no campo correspondente antes de clicar em esqueci a senha.");
            return;
        }
        auth.sendPasswordResetEmail(email)
            .then(() => {
                alert("E-mail de recuperação enviado! Verifique sua caixa de entrada (e a pasta de spam).");
            })
            .catch((error) => {
                alert("Erro ao enviar e-mail: " + error.message);
            });
    };

    if (forgotPasswordLink) forgotPasswordLink.onclick = handleForgotPassword;
    if (forgotPasswordModalLink) forgotPasswordModalLink.onclick = handleForgotPassword;

    // Lógica do Login com Google
    if (googleButtons.length > 0) {
        const provider = new firebase.auth.GoogleAuthProvider();
        googleButtons.forEach(btn => {
            btn.onclick = () => {
                auth.signInWithPopup(provider)
                    .then((result) => {
                        // O Firebase já puxa automaticamente o 'displayName' e 'photoURL' do Google.
                        console.log("Usuário autenticado pelo Google:", result.user.displayName);

                        if (window.location.pathname.includes('login.html')) {
                            window.location.href = '../index.html';
                        } else {
                            loginModal.style.display = 'none';
                        }
                    })
                    .catch((error) => {
                        console.error("Google Auth Error:", error);
                        if (error.code === 'auth/unauthorized-domain' || error.message.toLowerCase().includes('referer')) {
                            alert("Erro de Autorização: O domínio 'fadoco.github.io' ainda não foi propagado ou autorizado no Firebase/Google Cloud. Verifique as configurações e aguarde 5 minutos.");
                        } else {
                            alert("Erro Google: " + error.message);
                        }
                    });
            };
        });
    }

    // Logout
    if (btnLogout) {
        btnLogout.onclick = () => {
            auth.signOut().then(() => {
                location.reload();
            });
        };
    }
});

function checkUserSession(user) {
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const userNameSpan = document.getElementById('user-name');
    const userImg = document.querySelector('.user-profile img');

    if (user) {
        const displayName = user.displayName || user.email.split('@')[0];
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'block';
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