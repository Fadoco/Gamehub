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

    // Validar email
    if (!email || !email.trim()) {
      errors.push('Email é obrigatório');
    } else if (!window.Validators.email(email)) {
      errors.push('Email inválido. Use o formato: exemplo@dominio.com');
    }

    // Validar senha (aceita 6+ caracteres para compatibilidade com existentes)
    if (!password || !password.trim()) {
      errors.push('Senha é obrigatória');
    } else if (!window.Validators.passwordWeak(password)) {
      errors.push('Senha deve ter no mínimo 6 caracteres');
    }

    // Validar nome
    if (name && !window.Validators.username(name)) {
      errors.push('Nome de usuário inválido (máximo 50 caracteres)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
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
    const sanitizedName = name ? window.SecurityModule.sanitizeInput(name.trim(), 50) : '';
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
        // Aplica rate limiting para registro
        const userId = `signup:${email}`;
        await window.RateLimiter?.withRateLimit(userId, 'register', async () => {
          await signup(email, password, name);
        });

        if (typeof window.showToast === 'function') {
          window.showToast('Conta criada com sucesso!', 'success');
        }
      } catch (error) {
        if (error.code === 'RATE_LIMIT_EXCEEDED') {
          if (typeof window.showToast === 'function') {
            window.showToast(
              window.RateLimiter.getFriendlyMessage('register', error.resetIn),
              'error'
            );
          }
        } else if (typeof window.showToast === 'function') {
          window.showToast(error.message || 'Erro ao cadastrar usuário.', 'error');
        }

        // Log de segurança
        if (window.SecurityModule?.logger) {
          window.SecurityModule.logger.security(
            'Erro no registro',
            'SIGNUP_FAILED',
            { email: email.substring(0, 5) + '***' }
          );
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
