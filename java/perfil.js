/**
 * Lógica específica para a página de perfil do usuário.
 */

// Estado Global da Página
const ProfileState = {
    uid: null,
    data: null,
    isMyProfile: false
};

// Cache de Elementos do DOM para performance
const Elements = {
    displayName: () => document.getElementById('profile-display-name'),
    bio: () => document.getElementById('profile-bio'),
    avatar: () => document.getElementById('profile-avatar'),
    banner: () => document.getElementById('profile-banner-container'),
    friendId: () => document.getElementById('profile-friendship-id'),
    btnEdit: () => document.getElementById('btn-edit-profile'),
    btnAddFriend: () => document.getElementById('btn-add-friend'),
    editForm: () => document.getElementById('edit-profile-form'),
    stats: {
        games: () => document.getElementById('stat-games'),
        friends: () => document.getElementById('stat-friends'),
        balance: () => document.getElementById('stat-balance')
    },
    friendships: {
        sectionRequests: () => document.getElementById('friend-requests-section'),
        listRequests: () => document.getElementById('friend-requests-list'),
        listFriends: () => document.getElementById('friends-list'),
        addByIdContainer: () => document.getElementById('add-by-id-container')
    }
};

async function initProfilePage() {
    // Aguarda dependências críticas
    if (!window.db || !window.auth || !window.utils || !window.auth.currentUser) {
        return setTimeout(initProfilePage, 500);
    }

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

    // 1. Dados Básicos e Banner
    Elements.displayName().textContent = window.utils.getUserFriendlyName(data);
    Elements.bio().textContent = data.bio || "Nenhuma biografia definida.";
    Elements.avatar().src = data.avatar || `https://ui-avatars.com/api/?name=${window.utils.getUserFriendlyName(data)}&background=27ae60&color=fff`;
    Elements.friendId().textContent = `ID de Amizade: #${data.friendshipId || 'N/A'}`;
    
    Elements.friendId().onclick = () => {
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

    // 3. Estatísticas
    Elements.stats.games().textContent = (data.library || []).length;
    Elements.stats.friends().textContent = (data.friends || []).length;
    Elements.stats.balance().textContent = `R$ ${(data.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Renderizar Pedidos de Amizade Recebidos (apenas para o próprio perfil)
    if (ProfileState.isMyProfile) await renderRequests();

    // 4. Lista de Amigos
    await renderFriendsList(data.friends || []);
}

function renderBanner(data) {
    const container = Elements.banner();
    if (data.bannerURL) {
        const media = data.bannerType === 'video' 
            ? `<video class="profile-banner-media" src="${data.bannerURL}" autoplay loop muted></video>`
            : `<img class="profile-banner-media" src="${data.bannerURL}" alt="Banner">`;
        container.innerHTML = media;
    } else {
        container.style.background = 'linear-gradient(135deg, var(--accent), var(--bg-dark))';
        container.innerHTML = '';
    }
}

function setupMyProfileUI(data) {
    Elements.btnEdit().style.display = 'block';
    Elements.btnAddFriend().style.display = 'none';
    Elements.friendships.sectionRequests().style.display = 'block';
    Elements.friendships.addByIdContainer().style.display = 'flex';

    // Preencher formulário
    const form = Elements.editForm();
    form.style.display = 'none';
    document.getElementById('edit-display-name').value = data.displayName || '';
    document.getElementById('edit-bio').value = data.bio || '';
    document.getElementById('edit-avatar-url').value = data.avatar || '';
    document.getElementById('edit-banner-url').value = data.bannerURL || '';
    document.getElementById('edit-banner-type').value = data.bannerType || 'image';

    Elements.btnEdit().onclick = () => { form.style.display = 'flex'; Elements.btnEdit().style.display = 'none'; };
    document.getElementById('cancel-edit-profile').onclick = () => { form.style.display = 'none'; Elements.btnEdit().style.display = 'block'; };
    form.onsubmit = handleEditProfile;
}

function setupOtherProfileUI() {
    Elements.btnEdit().style.display = 'none';
    Elements.friendships.sectionRequests().style.display = 'none';
    Elements.friendships.addByIdContainer().style.display = 'none';

    const btn = Elements.btnAddFriend();
    btn.style.display = 'block';
    
    const uid = ProfileState.uid;
    if (window.userFriends.includes(uid)) {
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
    const list = Elements.friendships.listRequests();
    const uids = window.userFriendRequestsReceived || [];
    
    if (uids.length === 0) {
        list.innerHTML = "<p>Nenhum pedido pendente.</p>";
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
    list.innerHTML = html.join('');
}

async function renderFriendsList(friendsUids) {
    const list = Elements.friendships.listFriends();
    if (friendsUids.length === 0) {
        list.innerHTML = "<p>Nenhum amigo para exibir.</p>";
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
    list.innerHTML = html.join('');
}


window.handleAddFriendById = async () => {
    const idInput = document.getElementById('input-friend-id');
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

document.addEventListener('DOMContentLoaded', initProfilePage);