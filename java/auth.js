/**
 * Lógica de autenticação e gerenciamento de sessão do usuário.
 */

// --- CONFIGURAÇÃO DO FIREBASE ---
// Você obtém esses dados ao criar um projeto no Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyA7UzLE9eO-Zas3n5fgEv8sQmHOuclwg3Q",
    authDomain: "gamehub-web-8c78c.firebaseapp.com",
    projectId: "gamehub-web-8c78c",
    storageBucket: "gamehub-web-8c78c.firebasestorage.app",
    messagingSenderId: "72140954640",
    appId: "1:72140954640:web:29c9662a447659cbf73e95",
    measurementId: "G-237ZJ8KN79"
};

// Inicializa o Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// --- VERIFICAÇÃO DE SEGURANÇA (Monitora o estado da sessão em tempo real) ---
auth.onAuthStateChanged((user) => {
    const isLoginPage = window.location.pathname.includes('login.html');
    const isSubfolder = window.location.pathname.includes('/html/');

    if (!user && !isLoginPage) {
        // Se não estiver logado, manda para a login.html
        const target = isSubfolder ? 'login.html' : 'html/login.html';
        window.location.href = window.location.pathname.includes('index.html') ? 'html/login.html' : target;
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
                    let message = "Erro ao realizar login.";
                    switch (error.code) {
                        case 'auth/user-not-found':
                            message = "Usuário não encontrado.";
                            break;
                        case 'auth/wrong-password':
                            message = "Senha incorreta.";
                            break;
                        case 'auth/invalid-email':
                            message = "E-mail inválido.";
                            break;
                    }
                    alert(message);
                    console.error("Firebase Auth Error:", error.code);
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
                    .then(() => {
                        if (window.location.pathname.includes('login.html')) {
                            window.location.href = '../index.html';
                        } else {
                            loginModal.style.display = 'none';
                        }
                    })
                    .catch((error) => {
                        console.error("Google Auth Error:", error);
                        if (error.code === 'auth/unauthorized-domain') {
                            alert("Erro: Este domínio não está autorizado no Firebase. Se você está testando localmente, certifique-se de estar usando o Live Server (localhost).");
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