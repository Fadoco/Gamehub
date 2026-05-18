/**
 * Lógica de autenticação e gerenciamento de sessão do usuário.
 */

// --- CONFIGURAÇÃO DO FIREBASE ---
// Inicializa o Firebase apenas se a configuração estiver disponível
if (typeof firebaseConfig !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// Função auxiliar para o Loader
function toggleLoader(show) {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

// --- VERIFICAÇÃO DE SEGURANÇA (Monitora o estado da sessão em tempo real) ---
auth.onAuthStateChanged((user) => {
    const isLoginPage = window.location.pathname.includes('login.html');
    const isSubfolder = window.location.pathname.includes('/html/');

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
                toggleLoader(true);
                auth.signInWithPopup(provider)
                    .then((result) => {
                        toggleLoader(false);
                    const isNewUser = result.additionalUserInfo.isNewUser;
                    const isLoginPage = window.location.pathname.includes('login.html');
                        // O Firebase já puxa automaticamente o 'displayName' e 'photoURL' do Google.
                        console.log("Usuário autenticado pelo Google:", result.user.displayName);

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
                        console.error("Google Auth Error Detail:", error);
                        
                        if (error.code === 'auth/unauthorized-domain') {
                            alert(`[ERRO FIREBASE] O domínio '${window.location.hostname}' não está na lista de 'Domínios Autorizados' no console do Firebase.`);
                        } else if (error.message.toLowerCase().includes('referer')) {
                            alert(`[ERRO GOOGLE CLOUD] Sua API Key está restringindo o acesso. Adicione 'https://${window.location.hostname}/*' nas restrições da chave no Google Cloud Console.`);
                        } else {
                            alert("Erro Google: " + error.message);
                            if (error.message.includes('The requested action is invalid.')) {
                                alert(
                                    "Erro Google: 'The requested action is invalid'.\n\n" +
                                    "Para corrigir, vá ao Google Cloud Console e configure os dois campos:\n\n" +
                                    "1. Origens JavaScript autorizadas: Use APENAS 'https://fadoco.github.io' (sem barras ou caminhos).\n" +
                                    "2. URIs de redirecionamento autorizados: Adicione estes dois:\n" +
                                    "   - https://fadoco.github.io/__/auth/handler\n" +
                                    "   - https://gamehub-web-8c78c.firebaseapp.com/__/auth/handler\n\n" +
                                    "Aguarde 5 minutos após salvar."
                                );
                            }
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