const RegisterModule = (() => {
  /**
   * Valida entrada de registro
   * @param {string} email
   * @param {string} password
   * @param {string} name
   * @returns {object} { valid: boolean, errors: array }
   */
  function validateSignupInput(email, password, name) {
    const errors = [];

    // Validar email - regex simples
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) {
      errors.push('Email é obrigatório');
    } else if (!emailRegex.test(email)) {
      errors.push('Email inválido. Use o formato: exemplo@dominio.com');
    }

    // Validar senha (aceita 6+ caracteres para compatibilidade com existentes)
    if (!password || !password.trim()) {
      errors.push('Senha é obrigatória');
    } else if (password.length < 6) {
      errors.push('Senha deve ter no mínimo 6 caracteres');
    }

    // Validar nome - máximo 50 caracteres
    if (name && name.length > 50) {
      errors.push('Nome de usuário inválido (máximo 50 caracteres)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function sanitizeInput(input) {
    // Remover HTML e caracteres especiais perigosos
    return String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }

  function signup(email, password, name) {
    const auth = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);

    if (!auth) {
      return Promise.reject(new Error('Firebase Auth não inicializado.'));
    }

    // Valida entrada antes de tentar criar conta
    const validation = validateSignupInput(email, password, name);
    if (!validation.valid) {
      return Promise.reject(new Error(validation.errors[0]));
    }

    // Sanitiza entrada
    const sanitizedName = name ? sanitizeInput(name.trim().substring(0, 50)) : '';
    const sanitizedEmail = email.trim().toLowerCase();

    return auth.createUserWithEmailAndPassword(sanitizedEmail, password)
      .then((result) => {
        if (sanitizedName) {
          return result.user.updateProfile({ displayName: sanitizedName }).then(() => result);
        }
        return result;
      })
      .catch((error) => {
        // Mapeia erros do Firebase para mensagens amigáveis
        if (error.code === 'auth/email-already-in-use') {
          throw new Error('Este email já está registrado. Faça login ou use outro email.');
        } else if (error.code === 'auth/weak-password') {
          throw new Error('Senha é muito fraca. Use pelo menos 6 caracteres.');
        } else if (error.code === 'auth/invalid-email') {
          throw new Error('Email inválido.');
        }
        throw error;
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
        // Regista o usuário
        await signup(email, password, name);

        if (typeof window.showToast === 'function') {
          window.showToast('Conta criada com sucesso! Redirecionando...', 'success');
        }

        // Redireciona após 1.5 segundos para a página de boas-vindas
        setTimeout(() => {
          const welcomePath = window.utils?.getHtmlPath ? window.utils.getHtmlPath('welcome.html') : '../html/welcome.html';
          window.location.href = welcomePath;
        }, 1500);
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
    validateSignupInput,
  };
})();

window.RegisterModule = RegisterModule;
