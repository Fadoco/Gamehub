/**
 * SISTEMA DE LIMPEZA DE USUÁRIOS DELETADOS
 * Garante que não haja "resquícios" de contas deletadas no site
 */

console.log('✅ user-cleanup.js loaded');

window.UserCleanup = {
    /**
     * Verifica se os dados do Firestore representam um usuário ativo/válido
     * @param {object} data - Documento do usuário
     * @returns {boolean}
     */
    isValidUserData: (data) => {
        if (!data) return false;
        if (data.active === false) return false;
        if (!data.email || String(data.email).trim() === '') return false;
        if (data.displayName === '[Deletado]') return false;
        if (String(data.email).startsWith('deleted_') && String(data.email).endsWith('@deleted.local')) {
            return false;
        }
        return true;
    },

    /**
     * Verifica se um usuário ainda existe no Firestore
     * @param {string} uid - UID do usuário
     * @returns {Promise<boolean>} - true se existe, false se foi deletado
     */
    userExists: async (uid) => {
        try {
            if (!window.db) return false;
            
            const doc = await window.db.collection('users').doc(uid).get();
            
            if (!doc.exists) return false;
            
            return window.UserCleanup.isValidUserData(doc.data());
        } catch (error) {
            console.warn('[USER CLEANUP] Erro ao verificar usuário:', error);
            return false;
        }
    },

    /**
     * Deleta completamente um usuário (quando não existe mais no Firestore)
     * @param {string} uid - UID do usuário
     */
    deleteUserCompletely: async (uid) => {
        try {
            if (!window.db) return;
            
            console.log(`[USER CLEANUP] Deletando usuário ${uid} de todas as referências...`);
            
            // 1. Tenta deletar imagens do GitHub APENAS se disponível
            // (GitHubUploader está disponível apenas em perfil.html e páginas que o carregam)
            if (window.GitHubUploader && typeof window.GitHubUploader.deleteAllUserImages === 'function') {
                try {
                    console.log(`[USER CLEANUP] Deletando imagens do GitHub para ${uid}...`);
                    const imageResults = await window.GitHubUploader.deleteAllUserImages(uid);
                    console.log(`[USER CLEANUP] ✓ Imagens deletadas:`, imageResults);
                } catch (error) {
                    console.warn(`[USER CLEANUP] ⚠️ Erro ao deletar imagens (esperado se não disponível):`, error.message);
                    // Continua mesmo se falhar - não é crítico
                }
            } else {
                console.log(`[USER CLEANUP] ℹ️ GitHubUploader não disponível nesta página`);
            }
            
            // 2. Remove de amigos de outros usuários
            await window.UserCleanup.removeFromFriends(uid);
            
            // 3. Limpa localStorage
            localStorage.removeItem(`user_${uid}`);
            localStorage.removeItem(`user_profile_${uid}`);
            
            // 4. Dispara evento para atualizar UI
            window.dispatchEvent(new CustomEvent('userDeleted', { detail: { uid } }));
            
            console.log(`[USER CLEANUP] ✅ Usuário ${uid} completamente removido do site`);
        } catch (error) {
            console.error('[USER CLEANUP] Erro ao deletar usuário:', error);
        }
    },

    /**
     * Remove um UID de todos os amigos de outros usuários
     * @param {string} deletedUid - UID do usuário deletado
     */
    removeFromFriends: async (deletedUid) => {
        try {
            if (!window.db) return;
            
            // Busca todos os usuários que têm este UID na lista de amigos
            const usersWithThisFriend = await window.db
                .collection('users')
                .where('friends', 'array-contains', deletedUid)
                .get();
            
            if (usersWithThisFriend.docs.length === 0) {
                console.log(`[USER CLEANUP] Nenhum usuário tinha ${deletedUid} na lista de amigos`);
                return;
            }
            
            // Remove de cada um
            const batch = window.db.batch();
            usersWithThisFriend.docs.forEach(doc => {
                const friends = doc.data().friends || [];
                const updated = friends.filter(f => f !== deletedUid);
                batch.update(doc.ref, { friends: updated });
            });
            
            await batch.commit();
            console.log(`[USER CLEANUP] ✅ Removido de ${usersWithThisFriend.docs.length} listas de amigos`);
        } catch (error) {
            console.warn('[USER CLEANUP] Erro ao remover de amigos:', error);
            // Não relança erro para não quebrar o fluxo
        }
    },

    /**
     * Limpa usuários deletados de um array de UIDs
     * @param {array} uids - Array de UIDs
     * @returns {Promise<array>} - Array sem UIDs deletados
     */
    filterDeletedUsers: async (uids) => {
        if (!Array.isArray(uids) || uids.length === 0) return [];
        
        try {
            const validUsers = [];
            
            // Verifica cada UID em paralelo (máx 10 de cada vez)
            const chunks = [];
            for (let i = 0; i < uids.length; i += 10) {
                chunks.push(uids.slice(i, i + 10));
            }
            
            for (const chunk of chunks) {
                const results = await Promise.all(
                    chunk.map(uid => window.UserCleanup.userExists(uid))
                );
                
                chunk.forEach((uid, index) => {
                    if (results[index]) {
                        validUsers.push(uid);
                    } else {
                        // Usuário foi deletado, remove as referências
                        window.UserCleanup.deleteUserCompletely(uid);
                    }
                });
            }
            
            return validUsers;
        } catch (error) {
            console.error('[USER CLEANUP] Erro ao filtrar usuários deletados:', error);
            return uids; // Retorna original se houver erro
        }
    },

    /**
     * Verifica e limpa usuários deletados no ranking
     * Chamado automaticamente pelo ranking.js
     */
    cleanRanking: (rankingData) => {
        if (!Array.isArray(rankingData) || rankingData.length === 0) {
            return rankingData;
        }

        try {
            // Filtra apenas usuários que claramente não existem
            const cleaned = rankingData.filter(item => {
                try {
                    // Estrutura esperada: { uid, user, balance, gamesValue, totalValue, name, _debug }
                    if (!item || !item.user) return false;
                    
                    const user = item.user;
                    
                    if (!window.UserCleanup.isValidUserData(user)) {
                        console.log(`[USER CLEANUP] Removendo usuário ${item.uid}: inativo ou dados inválidos`);
                        window.UserCleanup.deleteUserCompletely(item.uid).catch(err => {
                            console.warn(`[USER CLEANUP] Erro background ao deletar ${item.uid}:`, err);
                        });
                        return false;
                    }
                    
                    return true;
                } catch (err) {
                    console.warn(`[USER CLEANUP] Erro ao validar item:`, err);
                    return true; // Mantém em caso de erro
                }
            });
            
            console.log(`[USER CLEANUP] Ranking: ${rankingData.length} → ${cleaned.length} usuários válidos`);
            return cleaned;
        } catch (error) {
            console.error('[USER CLEANUP] Erro geral em cleanRanking:', error);
            return rankingData; // Retorna original em caso de erro crítico
        }
    },

    /**
     * Verifica e limpa amigos deletados do perfil
     * @param {array} friends - Array de UIDs de amigos
     * @returns {Promise<array>} - Array sem amigos deletados
     */
    cleanFriendsForProfile: async (friends) => {
        if (!friends || friends.length === 0) return [];
        return await window.UserCleanup.filterDeletedUsers(friends);
    },

    /**
     * Soft delete seguro — marca como inativo e limpa referências
     * @param {string} uid - UID do usuário
     * @param {string} reason - Motivo da deleção
     */
    softDeleteUser: async (uid, reason = 'Solicitação do usuário') => {
        if (!window.db || !uid) return false;

        await window.db.collection('users').doc(uid).update({
            active: false,
            displayName: '[Deletado]',
            email: `deleted_${uid}@deleted.local`,
            deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
            deletedReason: reason,
            balance: 0,
            library: [],
            upgrades: {},
            favorites: [],
            cart: [],
            history: [],
            friends: [],
            friendRequestsSent: [],
            friendRequestsReceived: []
        });

        await window.UserCleanup.deleteUserCompletely(uid);
        return true;
    },

    /**
     * Inicia monitoramento de limpeza
     * Verifica periodicamente se há usuários deletados a remover
     */
    startMonitoring: () => {
        console.log('[USER CLEANUP] Iniciando monitoramento de usuários deletados...');
        
        // Listener para evento de deleção
        window.addEventListener('userDeleted', (event) => {
            const uid = event.detail.uid;
            
            // Se estamos no ranking, recarrega
            if (window.location.pathname.includes('ranking')) {
                console.log('[USER CLEANUP] Recarregando ranking após deleção...');
                setTimeout(() => window.location.reload(), 500);
            }
            
            // Se estamos no perfil, volta para home
            if (window.location.pathname.includes('perfil') && 
                new URLSearchParams(window.location.search).get('uid') === uid) {
                console.log('[USER CLEANUP] Perfil deletado, redirecionando...');
                setTimeout(() => window.location.href = '../index.html', 1000);
            }
        });
        
        // Limpeza periódica a cada 5 minutos
        setInterval(() => {
            console.log('[USER CLEANUP] Executando limpeza periódica...');
            // Aqui você pode adicionar lógica adicional se necessário
        }, 5 * 60 * 1000);
    }
};

// Auto-inicia o monitoramento
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.UserCleanup.startMonitoring();
    });
} else {
    window.UserCleanup.startMonitoring();
}
