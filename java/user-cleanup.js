/**
 * SISTEMA DE LIMPEZA DE USUÁRIOS DELETADOS
 * Garante que não haja "resquícios" de contas deletadas no site
 * Detecta automaticamente quando um usuário é removido do Firestore
 */

if (window.UserCleanup) {
    console.log('✅ user-cleanup.js já carregado');
} else {

window.UserCleanup = {
    _listenerActive: false,
    _processedDeletions: new Set(),

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
     * Processa a remoção de um usuário (evita execução duplicada)
     * @param {string} uid - UID do usuário
     * @param {string} reason - Motivo do log
     */
    handleUserDeletion: async (uid, reason = 'Removido do Firestore') => {
        if (!uid || window.UserCleanup._processedDeletions.has(uid)) return;
        window.UserCleanup._processedDeletions.add(uid);
        console.log(`[USER CLEANUP] 🔔 ${reason}: ${uid}`);
        await window.UserCleanup.deleteUserCompletely(uid);
    },

    /**
     * Deleta completamente um usuário (quando não existe mais no Firestore)
     * @param {string} uid - UID do usuário
     */
    deleteUserCompletely: async (uid) => {
        try {
            if (!window.db || !uid) return;
            
            console.log(`[USER CLEANUP] Limpando referências do usuário ${uid}...`);
            
            if (window.GitHubUploader && typeof window.GitHubUploader.deleteAllUserImages === 'function') {
                try {
                    await window.GitHubUploader.deleteAllUserImages(uid);
                } catch (error) {
                    console.warn(`[USER CLEANUP] ⚠️ Erro ao deletar imagens:`, error.message);
                }
            }
            
            await Promise.all([
                window.UserCleanup.removeFromFriends(uid),
                window.UserCleanup.removeFromFriendRequests(uid),
                window.UserCleanup.removeFromFriendships(uid)
            ]);
            
            localStorage.removeItem(`user_${uid}`);
            localStorage.removeItem(`user_profile_${uid}`);
            
            window.dispatchEvent(new CustomEvent('userDeleted', { detail: { uid } }));
            
            console.log(`[USER CLEANUP] ✅ Usuário ${uid} removido de todas as referências do site`);
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
        }
    },

    /**
     * Remove pedidos de amizade e referências em arrays de usuários
     * @param {string} deletedUid - UID do usuário deletado
     */
    removeFromFriendRequests: async (deletedUid) => {
        try {
            if (!window.db) return;

            const [fromSnap, toSnap, sentSnap, recvSnap] = await Promise.all([
                window.db.collection('friendRequests').where('from', '==', deletedUid).get(),
                window.db.collection('friendRequests').where('to', '==', deletedUid).get(),
                window.db.collection('users').where('friendRequestsSent', 'array-contains', deletedUid).get(),
                window.db.collection('users').where('friendRequestsReceived', 'array-contains', deletedUid).get()
            ]);

            const batch = window.db.batch();
            let ops = 0;

            [...fromSnap.docs, ...toSnap.docs].forEach(doc => {
                batch.delete(doc.ref);
                ops++;
            });

            sentSnap.docs.forEach(doc => {
                const list = (doc.data().friendRequestsSent || []).filter(id => id !== deletedUid);
                batch.update(doc.ref, { friendRequestsSent: list });
                ops++;
            });

            recvSnap.docs.forEach(doc => {
                const list = (doc.data().friendRequestsReceived || []).filter(id => id !== deletedUid);
                batch.update(doc.ref, { friendRequestsReceived: list });
                ops++;
            });

            if (ops > 0) {
                await batch.commit();
                console.log(`[USER CLEANUP] ✅ Pedidos de amizade limpos (${ops} operações)`);
            }
        } catch (error) {
            console.warn('[USER CLEANUP] Erro ao remover pedidos de amizade:', error);
        }
    },

    /**
     * Remove documentos da coleção friendships envolvendo o usuário
     * @param {string} deletedUid - UID do usuário deletado
     */
    removeFromFriendships: async (deletedUid) => {
        try {
            if (!window.db) return;

            const [asUser1, asUser2] = await Promise.all([
                window.db.collection('friendships').where('user1', '==', deletedUid).get(),
                window.db.collection('friendships').where('user2', '==', deletedUid).get()
            ]);

            const docs = [...asUser1.docs, ...asUser2.docs];
            if (docs.length === 0) return;

            const batch = window.db.batch();
            docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            console.log(`[USER CLEANUP] ✅ ${docs.length} amizade(s) removida(s) da coleção friendships`);
        } catch (error) {
            console.warn('[USER CLEANUP] Erro ao remover friendships:', error);
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
                        window.UserCleanup.handleUserDeletion(uid, 'Referência a usuário inexistente');
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
                        console.log(`[USER CLEANUP] Removendo usuário ${item.uid} do ranking: inativo ou inválido`);
                        window.UserCleanup.handleUserDeletion(item.uid, 'Usuário inválido no ranking').catch(err => {
                            console.warn(`[USER CLEANUP] Erro background ao limpar ${item.uid}:`, err);
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

        await window.UserCleanup.handleUserDeletion(uid, 'Soft delete via admin');
        return true;
    },

    /**
     * Escuta em tempo real a coleção users e reage a deleções no Firestore
     */
    startFirestoreDeletionListener: () => {
        if (window.UserCleanup._listenerActive) return;

        const attach = () => {
            if (!window.db) {
                setTimeout(attach, 500);
                return;
            }

            window.UserCleanup._listenerActive = true;
            console.log('[USER CLEANUP] 👁️ Listener Firestore ativo — detectando deleções automaticamente');

            window.db.collection('users').onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const uid = change.doc.id;

                    if (change.type === 'removed') {
                        window.UserCleanup.handleUserDeletion(uid, 'Documento removido do Firestore');
                        return;
                    }

                    if (change.type === 'modified') {
                        const data = change.doc.data();
                        if (!window.UserCleanup.isValidUserData(data)) {
                            window.UserCleanup.handleUserDeletion(uid, 'Usuário desativado no Firestore');
                        }
                    }
                });
            }, (error) => {
                console.warn('[USER CLEANUP] Erro no listener Firestore:', error);
                window.UserCleanup._listenerActive = false;
                setTimeout(() => window.UserCleanup.startFirestoreDeletionListener(), 5000);
            });
        };

        attach();
    },

    /**
     * Inicia monitoramento de limpeza
     * Verifica periodicamente se há usuários deletados a remover
     */
    startMonitoring: () => {
        console.log('[USER CLEANUP] Iniciando monitoramento de usuários deletados...');
        
        window.UserCleanup.startFirestoreDeletionListener();
        
        window.addEventListener('userDeleted', (event) => {
            const uid = event.detail.uid;
            
            if (window.location.pathname.includes('ranking')) {
                console.log('[USER CLEANUP] Ranking atualizado após deleção');
            }
            
            if (window.location.pathname.includes('perfil') && 
                new URLSearchParams(window.location.search).get('uid') === uid) {
                console.log('[USER CLEANUP] Perfil deletado, redirecionando...');
                setTimeout(() => {
                    const homePath = window.utils?.getHtmlPath ? window.utils.getHtmlPath('index.html') : '../index.html';
                    window.location.href = homePath;
                }, 1000);
            }

            if (typeof window.renderFriends === 'function') {
                setTimeout(() => window.renderFriends(), 300);
            }
            if (window.notificationsManager?.renderNotifications) {
                setTimeout(() => window.notificationsManager.renderNotifications(), 300);
            }
        });
    }
};

console.log('✅ user-cleanup.js loaded');

} // fim do guard UserCleanup

function initUserCleanupMonitoring() {
    if (window.UserCleanup) window.UserCleanup.startMonitoring();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserCleanupMonitoring);
} else {
    initUserCleanupMonitoring();
}
