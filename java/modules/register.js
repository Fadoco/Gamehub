const RegisterModule = (() => {
  function signup(email, password, name) {
    const auth = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);

    if (!auth) {
      return Promise.reject(new Error('Firebase Auth não inicializado.'));
    }

    return auth.createUserWithEmailAndPassword(email, password)
      .then((result) => {
        if (name) {
          return result.user.updateProfile({ displayName: name }).then(() => result);
        }
        return result;
      });
  }

  function bindSignupForm(formSelector = '#signup-form') {
    const form = document.querySelector(formSelector);
    if (!form) return null;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = form.querySelector('[name="name"], #signup-name')?.value || '';
      const email = form.querySelector('[name="email"], #signup-email')?.value || '';
      const password = form.querySelector('[name="password"], #signup-password')?.value || '';

      try {
        await signup(email, password, name);
        if (typeof window.showToast === 'function') {
          window.showToast('Conta criada com sucesso!', 'success');
        }
      } catch (error) {
        if (typeof window.showToast === 'function') {
          window.showToast(error.message || 'Erro ao cadastrar usuário.', 'error');
        }
      }
    });

    return form;
  }

  return {
    signup,
    bindSignupForm,
  };
})();

window.RegisterModule = RegisterModule;
