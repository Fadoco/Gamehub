const LoginModule = (() => {
  function login(email, password) {
    const auth = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);

    if (!auth) {
      return Promise.reject(new Error('Firebase Auth não inicializado.'));
    }

    return auth.signInWithEmailAndPassword(email, password);
  }

  function bindLoginForm(formSelector = '#login-form') {
    const form = document.querySelector(formSelector);
    if (!form) {
      console.warn('❌ Formulário de login não encontrado:', formSelector);
      return null;
    }

    console.log('✅ Formulário de login encontrado e sendo vinculado:', formSelector);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      console.log('📝 Formulário de login submetido');
      
      const email = form.querySelector('[name="email"], #email')?.value || '';
      const password = form.querySelector('[name="password"], #password')?.value || '';

      console.log('Email do formulário:', email);

      try {
        console.log('🔄 Fazendo login...');
        await login(email, password);
        
        console.log('✅ Login realizado com sucesso!');
        if (typeof window.showToast === 'function') {
          window.showToast('Login realizado com sucesso! Redirecionando...', 'success');
        }

        // Redireciona após 1.5 segundos para a página inicial
        setTimeout(() => {
          console.log('🔄 Redirecionando para index.html...');
          const indexPath = window.utils?.getHtmlPath ? window.utils.getHtmlPath('index.html') : '../index.html';
          window.location.href = indexPath;
        }, 1500);
      } catch (error) {
        console.error('❌ Erro no login:', error);
        if (typeof window.showToast === 'function') {
          window.showToast(error.message || 'Erro ao fazer login.', 'error');
        }
      }
    });

    return form;
  }

  return {
    login,
    bindLoginForm,
  };
})();

window.LoginModule = LoginModule;
console.log('✅ LoginModule carregado');
