const PermissionsModule = (() => {
  // NOTA: Admin emails devem estar sincronizados com window.ADMIN_EMAILS em auth.js
  // Para manter a consistência, use window.ADMIN_EMAILS quando disponível
  function getAdminEmails() {
    return (window.ADMIN_EMAILS && window.ADMIN_EMAILS.length > 0) 
      ? window.ADMIN_EMAILS 
      : ['fadoco12311@gmail.com', 'gabrielmomo6759@gmail.com'];
  }

  function isAdmin(user = window.currentUser || (window.auth && window.auth.currentUser)) {
    if (!user || !user.email) return false;
    const admins = getAdminEmails();
    return admins.some((email) => email.toLowerCase() === user.email.toLowerCase());
  }

  return {
    getAdminEmails,
    isAdmin,
  };
})();

window.PermissionsModule = PermissionsModule;
