const UserMenuModule = (() => {
  function renderUserMenu(containerId = 'user-menu', user = window.currentUser || (window.auth && window.auth.currentUser)) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    if (!user) {
      container.innerHTML = '';
      return container;
    }

    const displayName = (typeof window.utils?.getUserFriendlyName === 'function')
      ? window.utils.getUserFriendlyName(user)
      : (user.displayName || user.email || 'Usuário');

    const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=27ae60&color=fff`;
    const isAdmin = (typeof PermissionsModule?.isAdmin === 'function') ? PermissionsModule.isAdmin(user) : false;

    container.innerHTML = `
      ${isAdmin ? '<button class="nav-button" type="button" onclick="window.location.href=window.utils.getHtmlPath(\'admin.html\')"><i class="fas fa-user-shield"></i></button>' : ''}
      <div class="user-profile-display" onclick="window.location.href='${window.utils?.getHtmlPath ? window.utils.getHtmlPath('perfil.html') : 'perfil.html'}'" style="display:flex;align-items:center;gap:8px;cursor:pointer;">
        <img src="${avatar}" alt="${displayName}" style="width:35px;height:35px;border-radius:50%;border:2px solid var(--accent);">
        <span style="font-size:12px;color:var(--text-secondary);">${displayName}</span>
      </div>
      <button class="nav-button" type="button" data-action="logout" title="Sair"><i class="fas fa-sign-out-alt"></i></button>
    `;

    const logoutButton = container.querySelector('[data-action="logout"]');
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        try {
          await SessionModule.logout();
          if (window.location) {
            window.location.reload();
          }
        } catch (error) {
          if (typeof window.showToast === 'function') {
            window.showToast(error.message || 'Erro ao sair.', 'error');
          }
        }
      });
    }

    return container;
  }

  return {
    renderUserMenu,
  };
})();

window.UserMenuModule = UserMenuModule;
