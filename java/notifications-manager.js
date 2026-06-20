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
        
        console.log('[NotificationsManager] Constructor - Elements found:', {
            button: !!this.button,
            dropdown: !!this.dropdown,
            badge: !!this.badge,
            listContainer: !!this.listContainer
        });
        
        this.init();
    }

    init() {
        if (!this.button || !this.dropdown) {
            console.warn('[NotificationsManager] ERROR - Elements not found. Button:', !!this.button, 'Dropdown:', !!this.dropdown);
            return;
        }

        console.log('[NotificationsManager] Init - Adding event listeners');

        // Event listeners
        this.button.addEventListener('click', (e) => {
            console.log('[NotificationsManager] Button clicked');
            this.toggleDropdown(e);
        });
        
        this.dropdown.addEventListener('click', (e) => {
            console.log('[NotificationsManager] Dropdown clicked - stopping propagation');
            e.stopPropagation();
        });
        
        document.addEventListener('click', () => {
            console.log('[NotificationsManager] Document clicked - closing dropdown');
            this.closeDropdown();
        });

        // Monitorar mudanças em userFriendRequestsReceived
        this.startWatching();
        console.log('[NotificationsManager] Watching started');
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
        console.log('[NotificationsManager] toggleDropdown called', e);
        e.stopPropagation();
        if (this.dropdown.classList.contains('active')) {
            console.log('[NotificationsManager] Closing dropdown');
            this.closeDropdown();
        } else {
            console.log('[NotificationsManager] Opening dropdown');
            this.openDropdown();
        }
    }

    openDropdown() {
        console.log('[NotificationsManager] openDropdown - adding active class');
        this.dropdown.classList.add('active');
        console.log('[NotificationsManager] Dropdown classes:', this.dropdown.className);
        this.renderNotifications();
    }

    closeDropdown() {
        console.log('[NotificationsManager] closeDropdown - removing active class');
        this.dropdown.classList.remove('active');
        console.log('[NotificationsManager] Dropdown classes:', this.dropdown.className);
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
        console.log('[NotificationsManager] renderNotifications - UIDs:', uids);
        
        if (uids.length === 0) {
            console.log('[NotificationsManager] No notifications - showing empty message');
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
                <div class="notif-item">
                    <img src="${avatar}" alt="${displayName}" class="notif-item-avatar">
                    <div class="notif-item-content">
                        <div class="notif-item-name">${displayName}</div>
                        <div class="notif-item-text">quer ser seu amigo</div>
                    </div>
                    <div class="notif-item-actions">
                        <button class="btn-accept" onclick="window.acceptFriendRequest('${uid}')">✓</button>
                        <button class="btn-reject" onclick="window.rejectFriendRequest('${uid}')">✕</button>
                    </div>
                </div>
            `;
        }));

        this.listContainer.innerHTML = items.join('');
    }
}

// Initialize when DOM is ready
console.log('[NotificationsManager] Script loaded. Document readyState:', document.readyState);

function initNotificationsManager() {
    console.log('[NotificationsManager] Initializing...');
    window.notificationsManager = new NotificationsManager();
    console.log('[NotificationsManager] Instance created:', !!window.notificationsManager);
}

if (document.readyState === 'loading') {
    console.log('[NotificationsManager] Waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', initNotificationsManager);
} else {
    console.log('[NotificationsManager] DOM already loaded, initializing now');
    initNotificationsManager();
}
