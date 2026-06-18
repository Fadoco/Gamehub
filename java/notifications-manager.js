/**
 * Sistema de Gerenciamento de Notificações
 * Sincronizado com auth.js - Lê de window.userFriendRequestsReceived
 */

class NotificationsManager {
    constructor() {
        this.button = document.getElementById('btn-notifications');
        this.dropdown = document.getElementById('notif-dropdown');
        this.badge = document.getElementById('notif-badge');
        this.listContainer = document.getElementById('notif-list');
        this.userData = {}; // Cache de dados dos usuários
        
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

        // Monitorar mudanças em userFriendRequestsReceived
        this.startWatching();
    }

    startWatching() {
        // Verificar a cada 500ms se há mudanças
        setInterval(() => {
            this.updateBadge();
            if (this.dropdown && this.dropdown.classList.contains('active')) {
                this.renderNotifications();
            }
        }, 500);
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

    updateBadge() {
        const count = (window.userFriendRequestsReceived || []).length;
        if (count > 0) {
            this.badge.textContent = count;
            this.badge.classList.remove('hidden');
        } else {
            this.badge.classList.add('hidden');
        }
    }

    async renderNotifications() {
        const uids = window.userFriendRequestsReceived || [];
        
        if (uids.length === 0) {
            this.listContainer.innerHTML = '<div class="notif-empty">Nenhuma notificação nova.</div>';
            return;
        }

        // Buscar dados dos usuários
        const items = await Promise.all(uids.map(async (uid) => {
            // Cache de dados
            if (!this.userData[uid]) {
                try {
                    const userDoc = await window.db.collection('users').doc(uid).get();
                    if (userDoc.exists) {
                        this.userData[uid] = userDoc.data();
                    } else {
                        this.userData[uid] = { display_name: 'Usuário Desconhecido' };
                    }
                } catch (error) {
                    console.error('Erro ao buscar usuário:', error);
                    this.userData[uid] = { display_name: 'Erro ao carregar' };
                }
            }
            
            const user = this.userData[uid];
            const displayName = user.display_name || user.username || 'Usuário';
            const avatar = user.avatar || `https://ui-avatars.com/api/?name=${displayName}&background=27ae60&color=fff`;
            
            return `
                <div class="notif-item" style="display: flex; align-items: center; gap: 10px; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <img src="${avatar}" alt="${displayName}" style="width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 500; font-size: 13px;">${displayName}</div>
                        <div style="font-size: 11px; color: #7f8c8d;">quer ser seu amigo</div>
                    </div>
                    <div style="display: flex; gap: 6px; flex-shrink: 0;">
                        <button 
                            class="btn btn-sm" 
                            onclick="window.acceptFriendRequest('${uid}')" 
                            style="padding: 4px 8px; font-size: 11px; background: #27ae60; border: none; color: white; border-radius: 4px; cursor: pointer;">
                            ✓
                        </button>
                        <button 
                            class="btn btn-ghost" 
                            onclick="window.rejectFriendRequest('${uid}')" 
                            style="padding: 4px 8px; font-size: 11px; background: #e74c3c; border: none; color: white; border-radius: 4px; cursor: pointer;">
                            ✕
                        </button>
                    </div>
                </div>
            `;
        }));

        this.listContainer.innerHTML = items.join('');
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
