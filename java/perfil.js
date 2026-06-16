/**
 * Lógica específica para a página de perfil do usuário.
 */

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

    // Escuta mudanças em tempo real no perfil
    window.db.collection('users').doc(ProfileState.uid).onSnapshot(async (doc) => {
        if (doc.exists) {
            ProfileState.data = doc.data();
            await renderProfile();
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
    el.avatar.src = data.avatar || `https://ui-avatars.com/api/?name=${window.utils.getUserFriendlyName(data)}&background=27ae60&color=fff`;
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
            const level = (data.upgrades || {})[gameId] || 0;
            const basePrice = window.utils.parsePrice(game.currentPrice);
            totalInventoryValue += window.RankSystem.calculateValuation(basePrice, level);
        }
    });

    el.statGames.textContent = (data.library || []).length;
    el.statFriends.textContent = (data.friends || []).length;
    el.statBalance.textContent = `R$ ${(data.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Atualiza o valor total da conta (Saldo + Inventário)
    const totalWealth = (data.balance || 0) + totalInventoryValue;
    const wealthEl = document.getElementById('profile-total-wealth');
    if (wealthEl) {
        wealthEl.textContent = `Patrimônio Total: R$ ${totalWealth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    // Renderizar Pedidos de Amizade Recebidos (apenas para o próprio perfil)
    if (ProfileState.isMyProfile) await renderRequests();

    // 4. Lista de Amigos
    renderFriendsList(data.friends || []);
}

function renderBanner(data) {
    if (!el.banner) return; // Sair se elemento não existir
    
    if (data.bannerURL) {
        el.banner.innerHTML = data.bannerType === 'video' 
            ? `<video class="profile-banner-media" src="${data.bannerURL}" autoplay loop muted></video>`
            : `<img class="profile-banner-media" src="${data.bannerURL}" alt="Banner">`;
    } else {
        el.banner.style.background = 'linear-gradient(135deg, var(--accent), var(--bg-dark))';
        el.banner.innerHTML = '';
    }
}

function setupMyProfileUI(data) {
    // Mostrar ícone de edição (novo sistema)
    const editIcon = document.getElementById('btn-edit-profile-icon');
    if (editIcon) editIcon.classList.remove('hidden'); // Mostrar ícone novo
    
    // Ocultar elementos antigos (se existirem)
    if (el.btnEdit) el.btnEdit.style.display = 'none'; 
    if (el.btnAddFriend) el.btnAddFriend.style.display = 'none';
    if (el.sectionReq) el.sectionReq.style.display = 'block';
    if (el.addByIdBox) el.addByIdBox.style.display = 'flex';

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
    // Ocultar elementos antigos (se existirem)
    if (el.btnEdit) el.btnEdit.style.display = 'none';
    if (el.sectionReq) el.sectionReq.style.display = 'none';
    if (el.addByIdBox) el.addByIdBox.style.display = 'none';
    
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
    if (friendsUids.length === 0) {
        el.listFriends.innerHTML = "<p>Nenhum amigo para exibir.</p>";
        return;
    }

    const html = await Promise.all(friendsUids.map(async (uid) => {
        const userDoc = await window.db.collection('users').doc(uid).get();
        if (!userDoc.exists) return '';
        const userData = userDoc.data();
        const name = window.utils.getUserFriendlyName(userData);
        const avatar = userData.avatar || `https://ui-avatars.com/api/?name=${name}&background=27ae60&color=fff`;
        return `
            <div class="friend-card" onclick="window.location.href='perfil.html?uid=${uid}'">
                <img src="${avatar}" alt="Avatar" class="rank-avatar">
                <span class="friend-name">${name}</span>
                ${ProfileState.isMyProfile ? `<button class="nav-button remove-friend-btn" onclick="event.stopPropagation(); window.removeFriend('${uid}')"><i class="fas fa-user-minus"></i></button>` : ''}
            </div>`;
    }));
    el.listFriends.innerHTML = html.join('');
}


window.handleAddFriendById = async () => {
    const idInput = document.getElementById('friend-id-input');
    const friendId = parseInt(idInput.value);

    if (!friendId) return showToast("Digite um ID válido.", "error");
    if (friendId === ProfileState.data?.friendshipId) return showToast("Este é o seu próprio ID!", "info");

    try {
        toggleLoader(true);
        const userFound = await window.findUserByFriendshipId(friendId);

        if (!userFound) {
            showToast("Usuário não encontrado com este ID.", "error");
        } else {
            const targetUid = userFound.uid;
            await window.sendFriendRequest(targetUid);
            idInput.value = ""; // Limpa o input após enviar o pedido
        }
    } catch (error) {
        console.error("Erro ao buscar ID ou enviar pedido:", error);
        showToast("Erro ao buscar ID ou enviar pedido.", "error");
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

            // Incluir avatar se foi alterado
            if (this.state.avatarFile) {
                updateData.avatar = this.state.avatarFile;
            }

            // Incluir banner se foi alterado
            if (this.state.bannerFile) {
                updateData.bannerURL = this.state.bannerFile;
                updateData.bannerType = 'image'; // Por padrão é imagem
            }

            // Atualizar Firebase Auth
            await window.auth.currentUser.updateProfile({
                displayName: displayName,
                photoURL: updateData.avatar || window.auth.currentUser.photoURL
            });

            // Atualizar Firestore
            await window.db.collection('users').doc(window.auth.currentUser.uid).update(updateData);

            showToast('✓ Perfil atualizado com sucesso!', 'success');
            
            // Fechar modal
            this.closeModal();

            // Recarregar dados
            await window.loadUserData(window.auth.currentUser.uid);

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

// Inicializar o sistema de edição após o perfil estar pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguarda um pouco para garantir que o perfil foi inicializado
    setTimeout(() => {
        // Verificar se ProfileState está pronto e se é o próprio perfil
        if (ProfileState && ProfileState.isMyProfile && ProfileState.data) {
            EditProfileModal.init();
        }
    }, 800); // Aumentado para 800ms para maior segurança
});