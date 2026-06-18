/**
 * Sistema de Gerenciamento de Notificações
 * Handles friend requests notifications
 */

class NotificationsManager {
    constructor() {
        this.button = document.getElementById('btn-notifications');
        this.dropdown = document.getElementById('notif-dropdown');
        this.badge = document.getElementById('notif-badge');
        this.listContainer = document.getElementById('notif-list');
        this.notifications = [];
        
        this.init();
    }

    init() {
        if (!this.button || !this.dropdown) {
            console.warn('Notification elements not found');
            return;
        }

        // Event listeners
        this.button.addEventListener('click', (e) => this.toggleDropdown(e));
        this.dropdown.addEventListener('click', (e) => e.stopPropagation());
        document.addEventListener('click', () => this.closeDropdown());

        // Listen for notification updates
        if (window.db) {
            this.watchNotifications();
        }
    }

    toggleDropdown(e) {
        e.stopPropagation();
        if (this.dropdown.classList.contains('active')) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.dropdown.classList.add('active');
        this.renderNotifications();
    }

    closeDropdown() {
        this.dropdown.classList.remove('active');
    }

    watchNotifications() {
        const user = window.auth?.currentUser;
        if (!user) return;

        try {
            window.db.collection('users').doc(user.uid).collection('friend_requests')
                .onSnapshot((snapshot) => {
                    this.notifications = [];
                    snapshot.forEach((doc) => {
                        this.notifications.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    this.updateBadge();
                    if (this.dropdown.classList.contains('active')) {
                        this.renderNotifications();
                    }
                });
        } catch (error) {
            console.error('Error watching notifications:', error);
        }
    }

    updateBadge() {
        if (this.notifications.length > 0) {
            this.badge.textContent = this.notifications.length;
            this.badge.classList.remove('hidden');
        } else {
            this.badge.classList.add('hidden');
        }
    }

    renderNotifications() {
        if (this.notifications.length === 0) {
            this.listContainer.innerHTML = '<div class="notif-empty">Nenhuma notificação nova.</div>';
            return;
        }

        this.listContainer.innerHTML = this.notifications
            .map((notif) => `
                <div class="notif-item">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong>${notif.from_name || 'Usuário'}</strong>
                        <small style="color: #7f8c8d;">${this.formatDate(notif.timestamp)}</small>
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <button class="btn btn-sm" onclick="window.notificationsManager.acceptRequest('${notif.id}', '${notif.from_id}')" style="flex: 1; padding: 6px 12px; font-size: 12px;">
                            Aceitar
                        </button>
                        <button class="btn btn-ghost" onclick="window.notificationsManager.rejectRequest('${notif.id}')" style="flex: 1; padding: 6px 12px; font-size: 12px;">
                            Recusar
                        </button>
                    </div>
                </div>
            `)
            .join('');
    }

    acceptRequest(notifId, fromId) {
        const user = window.auth?.currentUser;
        if (!user) return;

        try {
            // Add friend relationship
            window.db.collection('users').doc(user.uid).collection('friends').doc(fromId).set({
                added_at: new Date(),
                friend_id: fromId
            });

            window.db.collection('users').doc(fromId).collection('friends').doc(user.uid).set({
                added_at: new Date(),
                friend_id: user.uid
            });

            // Remove notification
            window.db.collection('users').doc(user.uid).collection('friend_requests').doc(notifId).delete();

            alert('Amigo adicionado com sucesso!');
        } catch (error) {
            console.error('Error accepting request:', error);
            alert('Erro ao aceitar solicitação');
        }
    }

    rejectRequest(notifId) {
        const user = window.auth?.currentUser;
        if (!user) return;

        try {
            window.db.collection('users').doc(user.uid).collection('friend_requests').doc(notifId).delete();
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Erro ao recusar solicitação');
        }
    }

    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}m atrás`;
        if (hours < 24) return `${hours}h atrás`;
        if (days < 7) return `${days}d atrás`;
        
        return date.toLocaleDateString('pt-BR');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.notificationsManager = new NotificationsManager();
});

// Also try to initialize if document is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.notificationsManager = new NotificationsManager();
    });
} else {
    window.notificationsManager = new NotificationsManager();
}
