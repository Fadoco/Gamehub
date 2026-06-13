const SessionModule = (() => {
  function getAuth() {
    return window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
  }

  function restoreSession() {
    const auth = getAuth();
    if (!auth) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        window.currentUser = user || null;
        if (typeof window.updateNavBadges === 'function') {
          window.updateNavBadges();
        }

        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }

        resolve(user);
      });
    });
  }

  function logout() {
    const auth = getAuth();

    if (!auth) {
      return Promise.reject(new Error('Firebase Auth não inicializado.'));
    }

    localStorage.removeItem('skipLogin');

    return auth.signOut().then(() => {
      window.currentUser = null;
      window.userFavorites = [];
      window.userCart = [];
      window.userLibrary = [];

      if (typeof window.updateNavBadges === 'function') {
        window.updateNavBadges();
      }

      return true;
    });
  }

  return {
    restoreSession,
    logout,
    getAuth,
  };
})();

window.SessionModule = SessionModule;
