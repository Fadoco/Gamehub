/**
 * Lógica específica para a página de perfil do usuário.
 */

// ===== PROTEÇÃO CONTRA CARREGAMENTO DUPLICADO =====
if (typeof window.profileModuleLoaded !== 'undefined') {
  console.warn('⚠️ perfil.js já foi carregado. Ignorando duplicata.');
} else {
  window.profileModuleLoaded = true;

// Estado Global da Página
const ProfileState = {
    uid: null,
    data: null,
    isMyProfile: false
};

// Referências de elementos cacheificadas
let el = {};

function cacheElements() {
    el = {
        displayName: document.getElementById('profile-display-name'),
        bio: document.getElementById('profile-bio'),
        avatar: document.getElementById('profile-avatar'),
        banner: document.getElementById('profile-banner-container'),
        friendId: document.getElementById('profile-friendship-id'),
        btnEdit: document.getElementById('btn-edit-profile'),
        btnAddFriend: document.getElementById('btn-add-friend'),
        editForm: document.getElementById('edit-profile-form'),
        statGames: document.getElementById('stat-games'),
        statFriends: document.getElementById('stat-friends'),
        statBalance: document.getElementById('stat-balance'),
        sectionReq: document.getElementById('friend-requests-section'),
        sectionFriends: document.getElementById('friends-section'),
        listReq: document.getElementById('friend-requests-list'),
        listFriends: document.getElementById('friends-list'),
        addByIdBox: document.getElementById('add-by-id-container'),
        cancelEdit: document.getElementById('cancel-edit-profile')
    };
};

async function initProfilePage() {
    // Aguarda dependências críticas
    if (!window.db || !window.auth || !window.utils || !window.auth.currentUser) {
        return setTimeout(initProfilePage, 500);
    }

    cacheElements();

    const params = new URLSearchParams(window.location.search);
    ProfileState.uid = params.get('uid') || window.auth.currentUser.uid;
    ProfileState.isMyProfile = ProfileState.uid === window.auth.currentUser.uid;

    // Escuta mudanças em tempo real no perfil (com debounce para evitar spam)
    let renderTimeout;
    window.db.collection('users').doc(ProfileState.uid).onSnapshot(async (doc) => {
        if (doc.exists) {
            ProfileState.data = doc.data();
            // Debounce para evitar rerenderings múltiplos muito rápido
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                renderProfile();
            }, 100);
        } else {
            document.querySelector('main.container').innerHTML = "<h2 style='text-align:center; margin-top: 50px;'>Perfil não encontrado.</h2>";
        }
    });
}

async function renderProfile() {
    const data = ProfileState.data;
    if (!data) return;

    // 1. Informações Básicas
    el.displayName.textContent = window.utils.getUserFriendlyName(data);
    el.bio.textContent = data.bio || "Nenhuma biografia definida.";
    
    // Adicionar cache busting para forçar reload do avatar
    if (data.avatar) {
        el.avatar.src = `${data.avatar}?cb=${Date.now()}`;
    } else {
        el.avatar.src = `https://ui-avatars.com/api/?name=${window.utils.getUserFriendlyName(data)}&background=27ae60&color=fff`;
    }
    
    el.friendId.textContent = `ID de Amizade: #${data.friendshipId || 'N/A'}`;
    
    el.friendId.onclick = () => {
        if (data.friendshipId) {
            navigator.clipboard.writeText(String(data.friendshipId));
            showToast("ID copiado!", "success");
        }
    };

    renderBanner(data);

    // 2. Configuração de Visibilidade (Meu Perfil vs Outro)
    if (ProfileState.isMyProfile) {
        setupMyProfileUI(data);
    } else {
        setupOtherProfileUI();
    }

    // 3. Estatísticas e Patrimônio Total (Calcula valor dos upgrades)
    let totalInventoryValue = 0;

    (data.library || []).forEach(gameId => {
        const game = window.allGamesData.find(g => String(g.id) === String(gameId));
        if (game) {
            // Tenta recuperar upgrades tanto com chave string quanto número (mesmo que no ranking)
            const level = (data.upgrades && (data.upgrades[String(gameId)] ?? data.upgrades[gameId])) || 0;
            const basePrice = window.utils.parsePrice(game.currentPrice);
            totalInventoryValue += window.RankSystem.calculateValuation(basePrice, level);
        }
    });

    const libraryCount = (data.library || []).length;
    const friendsCount = (data.friends || []).length;
    
    el.statGames.textContent = libraryCount;
    el.statFriends.textContent = friendsCount;
    el.statBalance.textContent = `R$ ${(data.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Atualiza o valor total da conta (Saldo + Inventário)
    const totalWealth = (data.balance || 0) + totalInventoryValue;
    
    // DEBUG: Compara com o ranking
    if (window.rankingDebugData) {
        const userInRanking = window.rankingDebugData.find(u => u.uid === data.uid);
        if (userInRanking) {
            const perfilTotal = totalInventoryValue;
            const rankingTotal = userInRanking.gamesValue;
            const diff = perfilTotal - rankingTotal;
            if (Math.abs(diff) > 0.01) {
                console.warn(`[DISCREPÂNCIA] ${data.username}: Perfil=${perfilTotal.toFixed(2)} vs Ranking=${rankingTotal.toFixed(2)} | Diferença=${diff.toFixed(2)}`);
            }
        }
    }
    
    const wealthEl = document.getElementById('profile-total-wealth');
    if (wealthEl) {
        wealthEl.textContent = `Patrimônio Total: R$ ${totalWealth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    // Renderizar Pedidos de Amizade Recebidos (apenas para o próprio perfil)
    if (ProfileState.isMyProfile) {
        await renderRequests();
    }
    
    // Renderizar lista de amigos do outro usuário (se não for o próprio perfil)
    if (!ProfileState.isMyProfile) {
        window.renderFriends();
    }

    // 4. Lista de Amigos
    if (ProfileState.isMyProfile) {
        renderFriendsList(window.userFriends || data.friends || []);
    } else {
        renderFriendsList(data.friends || []);
    }
}

function renderBanner(data) {
    if (!el.banner) return; // Sair se elemento não existir
    
    if (data.bannerURL) {
        // Adicionar cache busting para forçar reload da imagem
        const urlWithCacheBust = `${data.bannerURL}?cb=${Date.now()}`;
        
        el.banner.innerHTML = data.bannerType === 'video' 
            ? `<video class="profile-banner-media" src="${urlWithCacheBust}" autoplay loop muted></video>`
            : `<img class="profile-banner-media" src="${urlWithCacheBust}" alt="Banner">`;
    } else {
        el.banner.style.background = 'linear-gradient(135deg, var(--accent), var(--bg-dark))';
        el.banner.innerHTML = '';
    }
}

function setupMyProfileUI(data) {
    // Mostrar ícone de edição (novo sistema)
    const editIcon = document.getElementById('btn-edit-profile-icon');
    
    if (editIcon) {
        editIcon.classList.remove('hidden'); // Mostrar botão novo
        editIcon.style.display = 'block'; // Força display block
    }
    
    // Inicializar o sistema de edição de perfil
    setTimeout(() => {
        EditProfileModal.init();
    }, 100);

    // Inicializar sistema de busca de amigos (APENAS NO MEU PERFIL)
    if (ProfileState.isMyProfile) {
        setTimeout(() => {
            setupFriendSearchSystem();
        }, 150);
    }
    
    // Configurar visibilidade dos elementos
    if (el.btnEdit) el.btnEdit.style.display = 'none'; 
    if (el.btnAddFriend) el.btnAddFriend.style.display = 'none';
    if (el.sectionReq) el.sectionReq.style.display = 'block';
    if (el.sectionFriends) el.sectionFriends.style.display = 'block';
    if (el.addByIdBox) el.addByIdBox.style.display = 'flex';
    
    // Mostrar o friend-search-container (sistema de busca de amigos)
    const friendSearchContainer = document.querySelector('.friend-search-container');
    if (friendSearchContainer) friendSearchContainer.style.display = 'block';

    // Preencher formulário antigo (se existir)
    const form = el.editForm;
    if (form && form.style.display !== 'flex') form.style.display = 'none';
    
    if (document.getElementById('edit-display-name')) document.getElementById('edit-display-name').value = data.displayName || '';
    if (document.getElementById('edit-bio')) document.getElementById('edit-bio').value = data.bio || '';
    if (document.getElementById('edit-avatar-url')) document.getElementById('edit-avatar-url').value = data.avatar || '';
    if (document.getElementById('edit-banner-url')) document.getElementById('edit-banner-url').value = data.bannerURL || '';
    if (document.getElementById('edit-banner-type')) document.getElementById('edit-banner-type').value = data.bannerType || 'image';

    // Configurar handlers para botões antigos (se existirem)
    if (el.btnEdit && form) el.btnEdit.onclick = () => { form.style.display = 'flex'; el.btnEdit.style.display = 'none'; };
    if (el.cancelEdit && form) el.cancelEdit.onclick = () => { form.style.display = 'none'; el.btnEdit.style.display = 'block'; };
    if (form) form.onsubmit = handleEditProfile;

    // Manipulador para o botão de adicionar por ID
    const toggleAddFriendBtn = document.getElementById('btn-toggle-add-friend');
    if (toggleAddFriendBtn) {
        toggleAddFriendBtn.onclick = () => {
            const container = document.getElementById('add-by-id-container');
            if (container) {
                const isHidden = container.classList.contains('hidden');
                if (isHidden) {
                    container.classList.remove('hidden');
                    toggleAddFriendBtn.textContent = 'Cancelar';
                    toggleAddFriendBtn.style.background = 'var(--danger)';
                } else {
                    container.classList.add('hidden');
                    toggleAddFriendBtn.textContent = 'Adicionar por ID';
                    toggleAddFriendBtn.style.background = '';
                }
            }
        };
    }
}

function setupOtherProfileUI() {
    // Ocultar elementos de edição do próprio perfil
    if (el.btnEdit) el.btnEdit.style.display = 'none';
    if (el.addByIdBox) el.addByIdBox.style.display = 'none';
    
    // Ocultar seção de pedidos de amizade recebidos (não é o próprio perfil)
    if (el.sectionReq) el.sectionReq.style.display = 'none';
    
    // Mostrar seção de amigos do outro usuário
    if (el.sectionFriends) el.sectionFriends.style.display = 'block';
    
    // Esconder sistema de busca de amigos (não é o próprio perfil)
    const friendSearchContainer = document.querySelector('.friend-search-container');
    if (friendSearchContainer) friendSearchContainer.style.display = 'none';
    
    // Esconder ícone de edição (não é o próprio perfil)
    const editIcon = document.getElementById('btn-edit-profile-icon');
    if (editIcon) editIcon.classList.add('hidden');

    const btn = el.btnAddFriend;
    if (!btn) return; // Sair se botão não existir
    
    btn.style.display = 'block';
    
    const uid = ProfileState.uid;
    if (window.userFriends && window.userFriends.includes(uid)) {
        btn.textContent = "Amigo"; btn.disabled = true; btn.style.background = "#27ae60";
    } else if (window.userFriendRequestsSent.includes(uid)) {
        btn.textContent = "Pedido Enviado"; btn.disabled = true; btn.style.background = "var(--secondary)";
    } else if (window.userFriendRequestsReceived.includes(uid)) {
        btn.textContent = "Aceitar Pedido"; btn.disabled = false; btn.style.background = "var(--accent)";
        btn.onclick = () => window.acceptFriendRequest(uid);
    } else {
        btn.textContent = "Adicionar Amigo"; btn.disabled = false; btn.style.background = "var(--accent)";
        btn.onclick = () => window.sendFriendRequest(uid);
    }
}

async function renderRequests() {
    const uids = window.userFriendRequestsReceived || [];
    
    if (uids.length === 0) {
        el.listReq.innerHTML = "<p>Nenhum pedido pendente.</p>";
        return;
    }

    const html = await Promise.all(uids.map(async (uid) => {
        const userDoc = await window.db.collection('users').doc(uid).get();
        if (!userDoc.exists) return '';
        const userData = userDoc.data();
        const name = window.utils.getUserFriendlyName(userData);
        const avatar = userData.avatar || `https://ui-avatars.com/api/?name=${name}&background=27ae60&color=fff`;
        return `
            <div class="friend-request-card">
                <img src="${avatar}" alt="Avatar" class="rank-avatar">
                <span class="friend-request-name">${name}</span>
                <div class="friend-request-actions">
                    <button class="buy-button" onclick="window.acceptFriendRequest('${uid}')">Aceitar</button>
                    <button class="nav-button" onclick="window.rejectFriendRequest('${uid}')">Rejeitar</button>
                </div>
            </div>`;
    }));
    el.listReq.innerHTML = html.join('');
}

async function renderFriendsList(friendsUids) {
    if (!el.listFriends) return;
    
    if (friendsUids.length === 0) {
        el.listFriends.innerHTML = ProfileState.isMyProfile ? "<p>Nenhum amigo para exibir.</p>" : "<p>Este usuário não tem amigos.</p>";
        return;
    }

    const html = await Promise.all(friendsUids.map(async (uid) => {
        try {
            const userDoc = await window.db.collection('users').doc(uid).get();
            if (!userDoc.exists) return '';
            const userData = userDoc.data();
            const name = window.utils.getUserFriendlyName(userData);
            const avatar = userData.avatar || `https://ui-avatars.com/api/?name=${name}&background=27ae60&color=fff`;
            const libraryCount = (userData.library || []).length;
            
            return `
                <div class="friend-card" onclick="window.location.href='perfil.html?uid=${uid}'">
                    <img src="${avatar}" alt="Avatar" class="rank-avatar">
                    <span class="friend-name">${name}</span>
                    <span class="friend-games-count" style="font-size: 11px; color: #7f8c8d; margin-top: 4px;">${libraryCount} jogo${libraryCount !== 1 ? 's' : ''}</span>
                    ${ProfileState.isMyProfile ? `<button class="nav-button remove-friend-btn" onclick="event.stopPropagation(); window.removeFriend('${uid}')"><i class="fas fa-user-minus"></i></button>` : ''}
                </div>`;
        } catch (error) {
            console.error('Erro ao renderizar amigo:', error);
            return '';
        }
    }));
    el.listFriends.innerHTML = html.join('');
}

// Alias global para renderizar amigos (chamado pelo listener de amizades)
window.renderFriends = async () => {
    // Se estamos no próprio perfil e há amigos, renderizar
    if (ProfileState.isMyProfile && window.userFriends && window.userFriends.length > 0) {
        await renderFriendsList(window.userFriends);
    } else if (ProfileState.isMyProfile && el && el.listFriends) {
        el.listFriends.innerHTML = "<p>Nenhum amigo para exibir.</p>";
    }
    
    // Se estamos visitando outro perfil, renderizar amigos daquele usuário
    if (!ProfileState.isMyProfile && ProfileState.data) {
        const otherUserFriends = ProfileState.data.friends || [];
        if (otherUserFriends.length > 0) {
            await renderFriendsList(otherUserFriends);
        } else if (el && el.listFriends) {
            el.listFriends.innerHTML = "<p>Este usuário não tem amigos.</p>";
        }
    }
};

window.handleAddFriendById = async () => {
    const idInput = document.getElementById('friend-id-input');
    const friendId = parseInt(idInput.value);

    if (!friendId || isNaN(friendId)) {
        return showToast("Digite um ID válido (apenas números).", "error");
    }
    
    if (friendId === ProfileState.data?.friendshipId) {
        return showToast("Este é o seu próprio ID!", "info");
    }

    try {
        toggleLoader(true);
        const userFound = await window.findUserByFriendshipId(friendId);

        if (!userFound) {
            showToast("Usuário não encontrado com este ID.", "error");
        } else {
            const targetUid = userFound.uid;
            await window.sendFriendRequest(targetUid);
            showToast("Pedido enviado com sucesso!", "success");
            idInput.value = "";
        }
    } catch (error) {
        console.error("Erro ao buscar ID ou enviar pedido:", error);
        showToast("Erro ao buscar. Tente novamente.", "error");
    } finally {
        toggleLoader(false);
    }
};

async function handleEditProfile(event) {
    event.preventDefault();
    if (!window.auth.currentUser) return;

    const displayName = document.getElementById('edit-display-name').value;
    const bio = document.getElementById('edit-bio').value;
    const avatar = document.getElementById('edit-avatar-url').value;
    const bannerURL = document.getElementById('edit-banner-url').value;
    const bannerType = document.getElementById('edit-banner-type').value;

    try {
        // Atualiza o displayName no Firebase Auth
        await window.auth.currentUser.updateProfile({
            displayName: displayName,
            photoURL: avatar // Firebase Auth photoURL é usado para avatar
        });

        // Atualiza os dados no Firestore
        await window.db.collection('users').doc(window.auth.currentUser.uid).update({
            displayName: displayName,
            bio: bio,
            avatar: avatar,
            bannerURL: bannerURL,
            bannerType: bannerType
        });

        showToast("Perfil atualizado com sucesso!", "success");
        document.getElementById('edit-profile-form').style.display = 'none';
        document.getElementById('btn-edit-profile').style.display = 'block';
        // Recarrega os dados do usuário para atualizar a UI
        await window.loadUserData(window.auth.currentUser.uid);
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        showToast("Erro ao atualizar perfil: " + error.message, "error");
    }
}

/**
 * ===== NOVO SISTEMA DE EDIÇÃO DE PERFIL (MELHORADO) =====
 * Modal elegante com upload de imagens, previsualização em tempo real
 * e compatibilidade com GIFs e vídeos.
 */

const EditProfileModal = {
    // Estado do modal
    state: {
        isOpen: false,
        avatarFile: null,
        bannerFile: null,
        avatarPreview: null,
        bannerPreview: null
    },

    // Inicializar o sistema
    init() {
        // Primeiro, tentar cachear os elementos
        if (!this.cacheElements()) {
            return; // Se falhar, não é o perfil do usuário
        }
        
        this.attachEventListeners();
    },

    // Cache de elementos do DOM
    cacheElements() {
        // Verificar se os elementos existem antes de cachear
        const btnEditIcon = document.getElementById('btn-edit-profile-icon');
        if (!btnEditIcon) return false; // Modal não está disponível (não é o perfil do usuário)

        this.els = {
            modal: document.getElementById('edit-profile-modal'),
            overlay: document.getElementById('edit-profile-modal-overlay'),
            btnEditIcon: btnEditIcon,
            btnClose: document.getElementById('btn-close-edit-modal'),
            form: document.getElementById('edit-profile-form-new'),
            btnCancel: document.getElementById('btn-cancel-edit-profile'),
            btnSave: document.getElementById('btn-save-profile'),
            
            // Inputs
            displayNameInput: document.getElementById('edit-display-name-new'),
            bioInput: document.getElementById('edit-bio-new'),
            avatarFileInput: document.getElementById('avatar-file-input'),
            bannerFileInput: document.getElementById('banner-file-input'),
            avatarUrlInput: document.getElementById('avatar-url-input'),
            bannerUrlInput: document.getElementById('banner-url-input'),
            
            // Previews
            avatarPreview: document.getElementById('avatar-preview'),
            bannerPreview: document.getElementById('banner-preview'),
            
            // Contadores
            nameCharCount: document.getElementById('name-char-count'),
            bioCharCount: document.getElementById('bio-char-count')
        };
        
        return true; // Todos os elementos foram encontrados
    },

    // Anexar listeners de eventos
    attachEventListeners() {
        // Abrir modal
        this.els.btnEditIcon.addEventListener('click', () => this.openModal());

        // Fechar modal
        this.els.btnClose.addEventListener('click', () => this.closeModal());
        this.els.overlay.addEventListener('click', () => this.closeModal());
        this.els.btnCancel.addEventListener('click', () => this.closeModal());

        // Prevenção de propagação no modal
        this.els.modal.addEventListener('click', (e) => e.stopPropagation());

        // Submissão do formulário
        this.els.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Upload de Avatar
        this.els.avatarPreview.addEventListener('click', () => {
            this.els.avatarFileInput.click();
        });
        this.els.avatarFileInput.addEventListener('change', (e) => this.handleAvatarUpload(e));

        // Upload de Banner
        this.els.bannerPreview.addEventListener('click', () => {
            this.els.bannerFileInput.click();
        });
        this.els.bannerFileInput.addEventListener('change', (e) => this.handleBannerUpload(e));

        // Contadores de caracteres
        this.els.displayNameInput.addEventListener('input', () => {
            this.els.nameCharCount.textContent = this.els.displayNameInput.value.length;
        });
        this.els.bioInput.addEventListener('input', () => {
            this.els.bioCharCount.textContent = this.els.bioInput.value.length;
        });

        // Listeners para URLs
        if (this.els.avatarUrlInput) {
            this.els.avatarUrlInput.addEventListener('change', (e) => this.handleAvatarUrlInput(e));
            this.els.avatarUrlInput.addEventListener('blur', (e) => this.handleAvatarUrlInput(e));
        }
        if (this.els.bannerUrlInput) {
            this.els.bannerUrlInput.addEventListener('change', (e) => this.handleBannerUrlInput(e));
            this.els.bannerUrlInput.addEventListener('blur', (e) => this.handleBannerUrlInput(e));
        }

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isOpen) {
                this.closeModal();
            }
        });
    },

    // Abrir modal
    openModal() {
        if (!ProfileState || !ProfileState.isMyProfile) return;

        // Preencher campos com dados atuais
        const data = ProfileState.data;
        if (!data) return;
        
        this.els.displayNameInput.value = data.displayName || '';
        this.els.bioInput.value = data.bio || '';
        
        // Atualizar contadores
        this.els.nameCharCount.textContent = this.els.displayNameInput.value.length;
        this.els.bioCharCount.textContent = this.els.bioInput.value.length;

        // Previsualizar avatar atual
        if (data.avatar) {
            this.previewAvatarFromUrl(data.avatar);
        } else {
            this.resetAvatarPreview();
        }

        // Previsualizar banner atual
        if (data.bannerURL) {
            this.previewBannerFromUrl(data.bannerURL);
        } else {
            this.resetBannerPreview();
        }

        // Mostrar modal
        this.els.modal.classList.remove('hidden');
        this.els.overlay.classList.remove('hidden');
        this.state.isOpen = true;

        // Prevenir scroll de fundo
        document.body.style.overflow = 'hidden';
    },

    // Fechar modal
    closeModal() {
        this.els.modal.classList.add('hidden');
        this.els.overlay.classList.add('hidden');
        this.state.isOpen = false;
        
        // Limpar estado
        this.state.avatarFile = null;
        this.state.bannerFile = null;
        this.state.avatarPreview = null;
        this.state.bannerPreview = null;

        // Restaurar scroll
        document.body.style.overflow = '';
    },

    // Validar tamanho do arquivo
    validateFileSize(file, maxSizeMB) {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    },

    // Validar tipo de arquivo
    validateFileType(file, allowedTypes) {
        return allowedTypes.includes(file.type);
    },

    // Handler para upload de Avatar
    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validações
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!this.validateFileType(file, allowedTypes)) {
            showToast('Formato não suportado. Use JPG, PNG ou GIF.', 'error');
            return;
        }

        if (!this.validateFileSize(file, 5)) {
            showToast('Arquivo muito grande. Máximo 5MB para avatar.', 'error');
            return;
        }

        // Ler arquivo e converter para base64
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.avatarFile = e.target.result;
            this.previewAvatar(e.target.result);
        };
        reader.readAsDataURL(file);
    },

    // Handler para upload de Banner
    handleBannerUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validações
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!this.validateFileType(file, allowedTypes)) {
            showToast('Formato não suportado. Use JPG, PNG ou GIF.', 'error');
            return;
        }

        if (!this.validateFileSize(file, 10)) {
            showToast('Arquivo muito grande. Máximo 10MB para banner.', 'error');
            return;
        }

        // Ler arquivo e converter para base64
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.bannerFile = e.target.result;
            this.previewBanner(e.target.result);
        };
        reader.readAsDataURL(file);
    },

    // Preview de Avatar
    previewAvatar(base64Data) {
        const img = document.createElement('img');
        img.src = base64Data;
        img.onload = () => {
            this.els.avatarPreview.innerHTML = '';
            this.els.avatarPreview.appendChild(img);
        };
        img.onerror = () => {
            showToast('Erro ao carregar prévia da imagem.', 'error');
        };
    },

    // Handler para URL de Avatar
    handleAvatarUrlInput(event) {
        const url = event.target.value.trim();
        if (url && this.isValidUrl(url)) {
            const img = document.createElement('img');
            img.src = url;
            img.onload = () => {
                this.els.avatarPreview.innerHTML = '';
                this.els.avatarPreview.appendChild(img);
                showToast('Avatar carregado com sucesso!', 'success');
            };
            img.onerror = () => {
                showToast('Erro ao carregar a imagem. Verifique o link.', 'error');
            };
        }
    },

    // Handler para URL de Banner
    handleBannerUrlInput(event) {
        const url = event.target.value.trim();
        if (url && this.isValidUrl(url)) {
            const img = document.createElement('img');
            img.src = url;
            img.onload = () => {
                this.els.bannerPreview.innerHTML = '';
                this.els.bannerPreview.appendChild(img);
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                showToast('Banner carregado com sucesso!', 'success');
            };
            img.onerror = () => {
                showToast('Erro ao carregar o banner. Verifique o link.', 'error');
            };
        }
    },

    // Validar URL
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    // Preview de Avatar de URL
    previewAvatarFromUrl(url) {
        const img = document.createElement('img');
        img.src = url;
        img.onload = () => {
            this.els.avatarPreview.innerHTML = '';
            this.els.avatarPreview.appendChild(img);
        };
    },

    // Reset Avatar Preview
    resetAvatarPreview() {
        this.els.avatarPreview.innerHTML = `<i class="fas fa-camera"></i><span>Clique para fazer upload</span>`;
    },

    // Preview de Banner
    previewBanner(base64Data) {
        const img = document.createElement('img');
        img.src = base64Data;
        img.onload = () => {
            this.els.bannerPreview.innerHTML = '';
            this.els.bannerPreview.appendChild(img);
        };
        img.onerror = () => {
            showToast('Erro ao carregar prévia do banner.', 'error');
        };
    },

    // Preview de Banner de URL
    previewBannerFromUrl(url) {
        const img = document.createElement('img');
        img.src = url;
        img.onload = () => {
            this.els.bannerPreview.innerHTML = '';
            this.els.bannerPreview.appendChild(img);
        };
    },

    // Reset Banner Preview
    resetBannerPreview() {
        this.els.bannerPreview.innerHTML = `<i class="fas fa-image"></i><span>Clique para fazer upload do banner</span>`;
    },

    // Validar dados
    validateFormData(displayName, bio) {
        if (!displayName || displayName.trim().length === 0) {
            showToast('Por favor, insira um nome de exibição.', 'error');
            return false;
        }

        if (displayName.length > 50) {
            showToast('Nome de exibição muito longo (máx. 50 caracteres).', 'error');
            return false;
        }

        if (bio.length > 200) {
            showToast('Biografia muito longa (máx. 200 caracteres).', 'error');
            return false;
        }

        return true;
    },

    // Submeter formulário
    async handleSubmit(event) {
        event.preventDefault();

        if (!window.auth.currentUser) {
            showToast('Você precisa estar logado.', 'error');
            return;
        }

        const displayName = this.els.displayNameInput.value.trim();
        const bio = this.els.bioInput.value.trim();
        const userId = window.auth.currentUser.uid;

        // Validar dados
        if (!this.validateFormData(displayName, bio)) {
            return;
        }

        try {
            toggleLoader(true);

            // Preparar dados para atualização
            const updateData = {
                displayName: displayName,
                bio: bio
            };

            // ===== UPLOAD NO GITHUB =====
            // Se houver arquivo de avatar para enviar
            if (this.state.avatarFile) {
                try {
                    showToast('📤 Enviando avatar para GitHub...', 'info');
                    const avatarUrl = await GitHubUploader.uploadAvatar(userId, this.state.avatarFile);
                    updateData.avatar = avatarUrl;
                    showToast('✓ Avatar enviado!', 'success');
                } catch (error) {
                    console.error('Erro ao enviar avatar:', error);
                    showToast('Erro ao enviar avatar: ' + error.message, 'error');
                    toggleLoader(false);
                    return;
                }
            } else if (this.els.avatarUrlInput && this.els.avatarUrlInput.value.trim()) {
                // Se houver URL manual, usar ela
                updateData.avatar = this.els.avatarUrlInput.value.trim();
            }

            // Se houver arquivo de banner para enviar
            if (this.state.bannerFile) {
                try {
                    showToast('📤 Enviando banner para GitHub...', 'info');
                    const bannerUrl = await GitHubUploader.uploadBanner(userId, this.state.bannerFile);
                    updateData.bannerURL = bannerUrl;
                    updateData.bannerType = 'image';
                    showToast('✓ Banner enviado!', 'success');
                } catch (error) {
                    console.error('Erro ao enviar banner:', error);
                    showToast('Erro ao enviar banner: ' + error.message, 'error');
                    toggleLoader(false);
                    return;
                }
            } else if (this.els.bannerUrlInput && this.els.bannerUrlInput.value.trim()) {
                // Se houver URL manual, usar ela
                updateData.bannerURL = this.els.bannerUrlInput.value.trim();
                updateData.bannerType = 'image';
            }

            // Atualizar Firebase Auth
            await window.auth.currentUser.updateProfile({
                displayName: displayName,
                photoURL: updateData.avatar || window.auth.currentUser.photoURL
            });

            // Atualizar Firestore (agora com URLs do GitHub ao invés de Base64)
            await window.db.collection('users').doc(userId).update(updateData);

            showToast('✓ Perfil atualizado com sucesso!', 'success');
            showToast('⏳ Processando imagens (2-3 segundos)...', 'info');
            
            // Aguardar o GitHub processar as imagens completamente
            // Depois recarrega a página com força (sem cache)
            setTimeout(() => {
                // Fechar modal
                this.closeModal();
                
                // Fazer reload sem cache para garantir que pega as imagens novas
                // Ctrl+F5 force refresh
                window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
            }, 3000);

        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            showToast('Erro ao salvar perfil: ' + error.message, 'error');
        } finally {
            toggleLoader(false);
        }
    }
};

// Inicializar quando a página carrega
document.addEventListener('DOMContentLoaded', initProfilePage);

// Nota: EditProfileModal.init() é chamado dentro de setupMyProfileUI() após remover a classe 'hidden' do botão

// ===== NOVO SISTEMA DE BUSCA DE AMIGOS =====

// Estado da busca de amigos
const FriendSearchState = {
    currentMode: 'nick',
    searchTimeout: null,
    lastResults: []
};

// Alternar modo de busca (Nick ou ID)
window.switchFriendSearchMode = (mode) => {
    FriendSearchState.currentMode = mode;
    
    // Atualizar abas
    document.getElementById('tab-search-nick').classList.toggle('active', mode === 'nick');
    document.getElementById('tab-search-id').classList.toggle('active', mode === 'id');
    
    // Mostrar/Esconder modos
    document.getElementById('mode-search-nick').classList.toggle('active', mode === 'nick');
    document.getElementById('mode-search-id').classList.toggle('active', mode === 'id');
    
    // Limpar resultados anteriores
    const resultsContainer = document.getElementById('friend-search-results');
    if (resultsContainer) {
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
    }
};

// Debounce para evitar buscas excessivas
function debounceSearch(func, delay = 300) {
    return function(...args) {
        clearTimeout(FriendSearchState.searchTimeout);
        FriendSearchState.searchTimeout = setTimeout(() => func(...args), delay);
    };
}

// Gerenciar input de busca por nick
const handleFriendSearchInput = debounceSearch(async (event) => {
    const searchTerm = event.target.value.trim();
    const resultsContainer = document.getElementById('friend-search-results');
    
    console.log(`[BUSCA] Termo digitado: "${searchTerm}"`);
    
    if (!searchTerm || searchTerm.length < 2) {
        console.log('[BUSCA] Termo muito curto, escondendo resultados');
        resultsContainer.classList.add('hidden');
        return;
    }
    
    try {
        console.log('[BUSCA] Iniciando busca...');
        resultsContainer.innerHTML = '<div class="friend-search-loading"><i class="fas fa-spinner fa-spin"></i> Procurando...</div>';
        resultsContainer.classList.remove('hidden');
        
        // Buscar usuários pelo nome
        console.log('[BUSCA] Chamando findUsersByDisplayName com termo:', searchTerm);
        const users = await window.findUsersByDisplayName(searchTerm);
        console.log('[BUSCA] Usuários retornados:', users);
        
        // Filtrar apenas o usuário atual (não filtrar amigos)
        const currentUid = window.auth.currentUser?.uid;
        console.log('[BUSCA] UID atual:', currentUid);
        const filtered = users.filter(user => 
            user.uid !== currentUid
        );
        console.log('[BUSCA] Usuários após filtro:', filtered);
        
        if (filtered.length === 0) {
            console.log('[BUSCA] Nenhum usuário encontrado');
            resultsContainer.innerHTML = '<div class="friend-search-empty">Nenhum usuário encontrado</div>';
            return;
        }
        
        // Renderizar resultados
        console.log('[BUSCA] Renderizando', filtered.length, 'resultados');
        renderFriendSearchResults(filtered, resultsContainer);
        FriendSearchState.lastResults = filtered;
        
    } catch (error) {
        console.error('[BUSCA] ERRO:', error);
        resultsContainer.innerHTML = '<div class="friend-search-empty">Erro na busca. Tente novamente.</div>';
    }
});

// Renderizar resultados de busca com cards visuais
function renderFriendSearchResults(users, container) {
    container.innerHTML = '';
    
    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'friend-search-result-card';
        
        // Usar displayName ou email como fallback
        const displayName = user.displayName || user.email || user.uid;
        
        // Gerar cor aleatória baseada no nome (consistente)
        const bannerColor = generateColorFromString(displayName);
        
        // HTML do card
        card.innerHTML = `
            ${user.bannerURL ? `<img src="${user.bannerURL}" alt="Banner" class="friend-result-banner">` : `<div class="friend-result-banner-placeholder" style="background: linear-gradient(135deg, ${bannerColor}, ${adjustBrightness(bannerColor, -30)});"></div>`}
            
            <div class="friend-result-content">
                <img 
                    src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2B90FF&color=fff`}" 
                    alt="${displayName}" 
                    class="friend-result-avatar"
                >
                
                <div class="friend-result-info">
                    <div class="friend-result-name">${displayName}</div>
                    <div class="friend-result-id">#${user.friendshipId || 'N/A'}</div>
                </div>
                
                <button 
                    class="friend-result-btn" 
                    onclick="window.sendFriendRequestFromSearch('${user.uid}', this)"
                >
                    <i class="fas fa-user-plus"></i> Adicionar
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Gerar cor consistente baseada em uma string
function generateColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash % 360);
    const saturation = 70 + (Math.abs(hash) % 20);
    const lightness = 50 + (Math.abs(hash) % 15);
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Ajustar brilho de cor HSL
function adjustBrightness(hsl, amount) {
    const match = hsl.match(/\d+/g);
    if (!match || match.length < 3) return hsl;
    
    const h = parseInt(match[0]);
    const s = parseInt(match[1]);
    let l = parseInt(match[2]);
    l = Math.max(10, Math.min(90, l + amount));
    
    return `hsl(${h}, ${s}%, ${l}%)`;
}

// Enviar pedido de amizade a partir da busca
window.sendFriendRequestFromSearch = async (targetUid, button) => {
    try {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        await window.sendFriendRequest(targetUid);
        
        // Alterar botão para "Enviado"
        button.innerHTML = '<i class="fas fa-check"></i> Enviado';
        button.style.background = 'var(--text-secondary)';
        
    } catch (error) {
        console.error('Erro ao enviar pedido:', error);
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-exclamation"></i> Erro';
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-user-plus"></i> Adicionar';
        }, 2000);
    }
};

// Inicializar sistema de busca quando o perfil está pronto
function setupFriendSearchSystem() {
    const friendNickInput = document.getElementById('friend-nick-input');
    
    if (friendNickInput && ProfileState.isMyProfile) {
        friendNickInput.addEventListener('input', handleFriendSearchInput);
    }
}

// Função para exibir biblioteca desde o perfil (sem parâmetros)
window.showUserLibraryFromProfile = async () => {
    if (!ProfileState || !ProfileState.uid || !ProfileState.data) {
        showToast("Erro ao carregar biblioteca.", "error");
        return;
    }
    await window.showUserLibrary(ProfileState.uid, ProfileState.data);
};

// Função para exibir biblioteca/jogos de um usuário
window.showUserLibrary = async (uid, userData) => {
    if (!uid || !userData) {
        showToast("Erro ao carregar biblioteca.", "error");
        return;
    }
    
    // Mostrar modal mesmo que esteja vazia
    if (!userData.library || userData.library.length === 0) {
        // Criar modal vazio com mensagem
        let modal = document.getElementById('user-library-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'user-library-modal';
            modal.className = 'modal';
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
            document.body.appendChild(modal);
        }
        
        const userName = window.utils.getUserFriendlyName(userData);
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; width: 90%; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 12px; padding: 40px; text-align: center;">
                <button onclick="document.getElementById('user-library-modal').style.display = 'none';" style="position: absolute; top: 10px; right: 15px; background: none; border: none; color: #fff; font-size: 24px; cursor: pointer;">✕</button>
                <h2 style="margin: 0 0 20px 0; font-size: 24px; color: var(--text-primary);">Biblioteca de ${userName}</h2>
                <p style="color: var(--text-secondary); font-size: 16px; margin: 0;">Este usuário ainda não possui nenhum jogo em sua biblioteca.</p>
            </div>
        `;
        modal.style.display = 'flex';
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        return;
    }

    // Criar modal para exibir jogos
    let modal = document.getElementById('user-library-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'user-library-modal';
        modal.className = 'modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        document.body.appendChild(modal);
    }

    const userName = window.utils.getUserFriendlyName(userData);
    const gameCount = userData.library.length;
    
    // Buscar informações dos jogos
    const gamesInfo = userData.library.map(gameId => {
        return window.allGamesData.find(g => String(g.id) === String(gameId));
    }).filter(game => game); // Remover undefined

    let html = `
        <div class="modal-content" style="max-width: 900px; width: 90%; max-height: 80vh; overflow-y: auto; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 12px; padding: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 24px;">Biblioteca de ${userName}</h2>
                <button onclick="document.getElementById('user-library-modal').style.display = 'none';" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer;">✕</button>
            </div>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 14px;">${gameCount} jogo${gameCount !== 1 ? 's' : ''} na biblioteca</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
    `;

    gamesInfo.forEach(game => {
        if (game) {
            const level = (userData.upgrades || {})[game.id] || 0;
            const levelBadge = level > 0 ? `<div style="position: absolute; top: 8px; right: 8px; background: var(--promo); color: #000; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">LVL ${level}</div>` : '';
            
            html += `
                <div style="position: relative; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.3s; background: #17171d;" onclick="window.location.href='jogo.html?id=${game.id}'">
                    <img src="${game.image || game.cover}" alt="${game.title}" style="width: 100%; height: 180px; object-fit: cover; display: block;">
                    <div style="padding: 10px; background: #0a0a0d; min-height: 50px; display: flex; align-items: center;">
                        <span style="font-size: 12px; font-weight: 600; color: #fff; white-space: normal; line-height: 1.3;">${game.title}</span>
                    </div>
                    ${levelBadge}
                </div>
            `;
        }
    });

    html += `
            </div>
        </div>
    `;

    modal.innerHTML = html;
    modal.style.display = 'flex';

    // Fechar ao clicar fora do modal
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
};

} // Fim da proteção contra carregamento duplicado