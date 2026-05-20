/**
 * Lógica específica para a página de perfil do usuário.
 */

let currentProfileUid = null; // UID do perfil que está sendo visualizado
let currentProfileData = null; // Dados do perfil que está sendo visualizado

async function initProfilePage() {
    // Aguarda o Firebase e os dados globais estarem prontos
    if (!window.db || !window.auth.currentUser) {
        return setTimeout(initProfilePage, 500);
    }

    const params = new URLSearchParams(window.location.search);
    const uidFromUrl = params.get('uid');

    // Se não houver UID na URL, é o perfil do usuário logado
    currentProfileUid = uidFromUrl || window.auth.currentUser.uid;

    // Escuta mudanças em tempo real no perfil
    window.db.collection('users').doc(currentProfileUid).onSnapshot(async (doc) => {
        if (doc.exists) {
            currentProfileData = doc.data();
            await renderProfile();
        } else {
            document.querySelector('main.container').innerHTML = "<h2 style='text-align:center; margin-top: 50px;'>Perfil não encontrado.</h2>";
        }
    });
}

async function renderProfile() {
    if (!currentProfileData) return;

    const isMyProfile = currentProfileUid === window.auth.currentUser.uid;

    // Elementos do perfil
    const profileDisplayName = document.getElementById('profile-display-name');
    const profileBio = document.getElementById('profile-bio');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileBannerContainer = document.getElementById('profile-banner-container');
    const profileFriendshipId = document.getElementById('profile-friendship-id');
    const btnEditProfile = document.getElementById('btn-edit-profile');
    const btnAddFriend = document.getElementById('btn-add-friend');

    // Estatísticas
    const statGames = document.getElementById('stat-games');
    const statFriends = document.getElementById('stat-friends');
    const statBalance = document.getElementById('stat-balance');

    // Seções de amizade
    const friendRequestsSection = document.getElementById('friend-requests-section');
    const friendRequestsList = document.getElementById('friend-requests-list');
    const friendsList = document.getElementById('friends-list');

    // Preencher dados básicos
    profileDisplayName.textContent = window.utils.getUserFriendlyName(currentProfileData);
    profileBio.textContent = currentProfileData.bio || "Nenhuma biografia definida.";
    profileAvatar.src = currentProfileData.avatar || `https://ui-avatars.com/api/?name=${window.utils.getUserFriendlyName(currentProfileData)}&background=27ae60&color=fff`;
    profileFriendshipId.textContent = `ID de Amizade: #${currentProfileData.friendshipId || 'N/A'}`;

    // Configura o clique para copiar o ID
    profileFriendshipId.onclick = () => {
        const idOnly = currentProfileData.friendshipId;
        navigator.clipboard.writeText(idOnly);
        showToast("ID copiado para a área de transferência!", "success");
    };

    // Renderizar Banner
    profileBannerContainer.innerHTML = ''; // Limpa o conteúdo anterior
    if (currentProfileData.bannerURL) {
        if (currentProfileData.bannerType === 'video') {
            profileBannerContainer.innerHTML = `<video class="profile-banner-media" src="${currentProfileData.bannerURL}" autoplay loop muted></video>`;
        } else {
            profileBannerContainer.innerHTML = `<img class="profile-banner-media" src="${currentProfileData.bannerURL}" alt="Banner do Perfil">`;
        }
    } else {
        profileBannerContainer.style.background = 'linear-gradient(135deg, var(--accent), var(--bg-dark))'; // Banner padrão
    }

    // Exibir/Esconder botão de edição e formulário
    if (isMyProfile) {
        btnEditProfile.style.display = 'block';
        btnAddFriend.style.display = 'none';
        friendRequestsSection.style.display = 'block';
        document.getElementById('add-by-id-container').style.display = 'flex';
        document.getElementById('edit-profile-form').style.display = 'none'; // Esconde o formulário por padrão

        // Preencher formulário de edição
        document.getElementById('edit-display-name').value = currentProfileData.displayName || '';
        document.getElementById('edit-bio').value = currentProfileData.bio || '';
        document.getElementById('edit-avatar-url').value = currentProfileData.avatar || '';
        document.getElementById('edit-banner-url').value = currentProfileData.bannerURL || '';
        document.getElementById('edit-banner-type').value = currentProfileData.bannerType || 'image';

        // Eventos do formulário de edição
        btnEditProfile.onclick = () => {
            document.getElementById('edit-profile-form').style.display = 'flex';
            btnEditProfile.style.display = 'none';
        };
        document.getElementById('cancel-edit-profile').onclick = () => {
            document.getElementById('edit-profile-form').style.display = 'none';
            btnEditProfile.style.display = 'block';
        };
        document.getElementById('edit-profile-form').onsubmit = handleEditProfile;

    } else {
        btnEditProfile.style.display = 'none';
        document.getElementById('edit-profile-form').style.display = 'none';
        friendRequestsSection.style.display = 'none';
        document.getElementById('add-by-id-container').style.display = 'none';

        // Lógica do botão "Adicionar Amigo" para outros perfis
        btnAddFriend.style.display = 'block';
        if (window.userFriends.includes(currentProfileUid)) {
            btnAddFriend.textContent = "Amigo";
            btnAddFriend.disabled = true;
            btnAddFriend.style.background = "#27ae60";
        } else if (window.userFriendRequestsSent.includes(currentProfileUid)) {
            btnAddFriend.textContent = "Pedido Enviado";
            btnAddFriend.disabled = true;
            btnAddFriend.style.background = "var(--secondary)";
        } else if (window.userFriendRequestsReceived.includes(currentProfileUid)) {
            btnAddFriend.textContent = "Aceitar Pedido";
            btnAddFriend.disabled = false;
            btnAddFriend.style.background = "var(--accent)";
            btnAddFriend.onclick = () => window.acceptFriendRequest(currentProfileUid);
        } else {
            btnAddFriend.textContent = "Adicionar Amigo";
            btnAddFriend.disabled = false;
            btnAddFriend.style.background = "var(--accent)";
            btnAddFriend.onclick = () => window.sendFriendRequest(currentProfileUid);
        }
    }

    // Preencher estatísticas
    statGames.textContent = (currentProfileData.library || []).length;
    statFriends.textContent = (currentProfileData.friends || []).length;
    statBalance.textContent = `R$ ${(currentProfileData.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // Renderizar Pedidos de Amizade Recebidos (apenas para o próprio perfil)
    if (isMyProfile) {
        if (window.userFriendRequestsReceived.length > 0) {
            friendRequestsList.innerHTML = await Promise.all(window.userFriendRequestsReceived.map(async (uid) => {
                const userDoc = await window.db.collection('users').doc(uid).get();
                if (userDoc.exists) {
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
                        </div>
                    `;
                }
                return '';
            })).join('');
        } else {
            friendRequestsList.innerHTML = "<p>Nenhum pedido de amizade pendente.</p>";
        }
    }

    // Renderizar Lista de Amigos
    if ((currentProfileData.friends || []).length > 0) {
        friendsList.innerHTML = await Promise.all((currentProfileData.friends || []).map(async (uid) => {
            const userDoc = await window.db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const name = window.utils.getUserFriendlyName(userData);
                const avatar = userData.avatar || `https://ui-avatars.com/api/?name=${name}&background=27ae60&color=fff`;
                return `
                    <div class="friend-card" onclick="window.location.href='perfil.html?uid=${uid}'">
                        <img src="${avatar}" alt="Avatar" class="rank-avatar">
                        <span class="friend-name">${name}</span>
                        ${isMyProfile ? `<button class="nav-button remove-friend-btn" onclick="event.stopPropagation(); window.removeFriend('${uid}')"><i class="fas fa-user-minus"></i></button>` : ''}
                    </div>
                `;
            }
            return '';
        })).join('');
    } else {
        friendsList.innerHTML = "<p>Nenhum amigo para exibir.</p>";
    }
}

window.handleAddFriendById = async () => {
    const idInput = document.getElementById('input-friend-id');
    const friendId = parseInt(idInput.value);

    if (!friendId) return showToast("Digite um ID válido.", "error");
    if (friendId === currentProfileData.friendshipId) return showToast("Este é o seu próprio ID!", "info");

    try {
        toggleLoader(true);
        // Busca o usuário que possui esse friendshipId
        const userFound = await window.findUserByFriendshipId(friendId); // Usa a função global do auth.js

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