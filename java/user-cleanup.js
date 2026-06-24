/**
 * SISTEMA DE LIMPEZA DE USUÁRIOS DELETADOS
 * Detecta automaticamente remoções no Firestore e limpa referências no site
 */

if (window.UserCleanup) {
    console.log('✅ user-cleanup.js já carregado');
} else {

window.UserCleanup = {
    _listenerActive: false,
    _processedDeletions: new Set(),
    _orphanScanDone: false,
    _monitoringStarted: false,

    getDb: () => window.db || window.firebaseDb || null,

    isAdmin: () => {
        const email = window.auth?.currentUser?.email?.toLowerCase();
        if (!email) return false;
        return (window.ADMIN_EMAILS || []).map(e => e.toLowerCase()).includes(email);
    },

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

    userExists: async (uid) => {
        try {
            const db = window.UserCleanup.getDb();
            if (!db || !uid) return false;

            const doc = await db.collection('users').doc(uid).get({ source: 'server' });
            if (!doc.exists) return false;
            return window.UserCleanup.isValidUserData(doc.data());
        } catch (error) {
            try {
                const db = window.UserCleanup.getDb();
                const doc = await db.collection('users').doc(uid).get();
                if (!doc.exists) return false;
                return window.UserCleanup.isValidUserData(doc.data());
            } catch (fallbackError) {
                console.warn('[USER CLEANUP] Erro ao verificar usuário:', fallbackError);
                return false;
            }
        }
    },

    handleUserDeletion: async (uid, reason = 'Removido do Firestore') => {
        if (!uid || window.UserCleanup._processedDeletions.has(uid)) return;
        window.UserCleanup._processedDeletions.add(uid);
        console.log(`[USER CLEANUP] 🔔 ${reason}: ${uid}`);
        await window.UserCleanup.deleteUserCompletely(uid);
    },

    deleteUserCompletely: async (uid) => {
        try {
            const db = window.UserCleanup.getDb();
            if (!db || !uid) return;

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

    removeFromFriends: async (deletedUid) => {
        try {
            const db = window.UserCleanup.getDb();
            if (!db) return;

            const currentUid = window.auth?.currentUser?.uid;

            if (currentUid && currentUid !== deletedUid) {
                const myRef = db.collection('users').doc(currentUid);
                const myDoc = await myRef.get();
                if (myDoc.exists) {
                    const friends = myDoc.data().friends || [];
                    if (friends.includes(deletedUid)) {
                        await myRef.update({ friends: friends.filter(f => f !== deletedUid) });
                        console.log(`[USER CLEANUP] ✅ Removido da sua lista de amigos`);
                    }
                }
            }

            if (!window.UserCleanup.isAdmin()) return;

            const usersWithThisFriend = await db
                .collection('users')
                .where('friends', 'array-contains', deletedUid)
                .get();

            if (usersWithThisFriend.empty) return;

            const batch = db.batch();
            usersWithThisFriend.docs.forEach(doc => {
                const friends = doc.data().friends || [];
                batch.update(doc.ref, { friends: friends.filter(f => f !== deletedUid) });
            });

            await batch.commit();
            console.log(`[USER CLEANUP] ✅ Admin removeu de ${usersWithThisFriend.size} listas de amigos`);
        } catch (error) {
            console.warn('[USER CLEANUP] Erro ao remover de amigos:', error);
        }
    },

    removeFromFriendRequests: async (deletedUid) => {
        try {
            const db = window.UserCleanup.getDb();
            if (!db) return;

            const [fromSnap, toSnap] = await Promise.all([
                db.collection('friendRequests').where('from', '==', deletedUid).get(),
                db.collection('friendRequests').where('to', '==', deletedUid).get()
            ]);

            const requestDocs = [...fromSnap.docs, ...toSnap.docs];
            if (requestDocs.length > 0) {
                const batch = db.batch();
                requestDocs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                console.log(`[USER CLEANUP] ✅ ${requestDocs.length} pedido(s) de amizade apagado(s)`);
            }

            const currentUid = window.auth?.currentUser?.uid;
            if (currentUid) {
                const myRef = db.collection('users').doc(currentUid);
                const myDoc = await myRef.get();
                if (myDoc.exists) {
                    const data = myDoc.data();
                    const sent = (data.friendRequestsSent || []).filter(id => id !== deletedUid);
                    const recv = (data.friendRequestsReceived || []).filter(id => id !== deletedUid);
                    if (sent.length !== (data.friendRequestsSent || []).length ||
                        recv.length !== (data.friendRequestsReceived || []).length) {
                        await myRef.update({
                            friendRequestsSent: sent,
                            friendRequestsReceived: recv
                        });
                    }
                }
            }

            if (!window.UserCleanup.isAdmin()) return;

            const [sentSnap, recvSnap] = await Promise.all([
                db.collection('users').where('friendRequestsSent', 'array-contains', deletedUid).get(),
                db.collection('users').where('friendRequestsReceived', 'array-contains', deletedUid).get()
            ]);

            const batch = db.batch();
            let ops = 0;

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
                console.log(`[USER CLEANUP] ✅ Admin limpou pedidos em ${ops} usuário(s)`);
            }
        } catch (error) {
            console.warn('[USER CLEANUP] Erro ao remover pedidos de amizade:', error);
        }
    },

    removeFromFriendships: async (deletedUid) => {
        try {
            const db = window.UserCleanup.getDb();
            if (!db) return;

            const [asUser1, asUser2] = await Promise.all([
                db.collection('friendships').where('user1', '==', deletedUid).get(),
                db.collection('friendships').where('user2', '==', deletedUid).get()
            ]);

            const docs = [...asUser1.docs, ...asUser2.docs];
            if (docs.length === 0) return;

            const batch = db.batch();
            docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            console.log(`[USER CLEANUP] ✅ ${docs.length} amizade(s) removida(s)`);
        } catch (error) {
            console.warn('[USER CLEANUP] Erro ao remover friendships:', error);
        }
    },

    filterDeletedUsers: async (uids) => {
        if (!Array.isArray(uids) || uids.length === 0) return [];

        try {
            const validUsers = [];
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
            return uids;
        }
    },

    cleanRanking: (rankingData) => {
        if (!Array.isArray(rankingData) || rankingData.length === 0) {
            return rankingData;
        }

        try {
            const cleaned = rankingData.filter(item => {
                try {
                    if (!item || !item.user) return false;

                    if (!window.UserCleanup.isValidUserData(item.user)) {
                        window.UserCleanup.handleUserDeletion(item.uid, 'Usuário inválido no ranking').catch(err => {
                            console.warn(`[USER CLEANUP] Erro background ao limpar ${item.uid}:`, err);
                        });
                        return false;
                    }

                    return true;
                } catch (err) {
                    console.warn(`[USER CLEANUP] Erro ao validar item:`, err);
                    return true;
                }
            });

            console.log(`[USER CLEANUP] Ranking: ${rankingData.length} → ${cleaned.length} usuários válidos`);
            return cleaned;
        } catch (error) {
            console.error('[USER CLEANUP] Erro geral em cleanRanking:', error);
            return rankingData;
        }
    },

    cleanFriendsForProfile: async (friends) => {
        if (!friends || friends.length === 0) return [];
        return await window.UserCleanup.filterDeletedUsers(friends);
    },

    scanCurrentUserReferences: async () => {
        const db = window.UserCleanup.getDb();
        const uid = window.auth?.currentUser?.uid;
        if (!db || !uid) return;

        try {
            const myDoc = await db.collection('users').doc(uid).get();
            if (!myDoc.exists) return;

            const data = myDoc.data();
            const friends = data.friends || [];
            const validFriends = await window.UserCleanup.filterDeletedUsers(friends);

            if (validFriends.length !== friends.length) {
                await db.collection('users').doc(uid).update({ friends: validFriends });
            }

            if (window.UserCleanup.isAdmin()) {
                await window.UserCleanup.scanAllOrphanReferences();
            }
        } catch (error) {
            console.warn('[USER CLEANUP] Erro ao escanear referências do usuário logado:', error);
        }
    },

    /**
     * Admin: remove referências a UIDs que não existem mais no Firestore
     */
    scanAllOrphanReferences: async () => {
        const db = window.UserCleanup.getDb();
        if (!db || !window.UserCleanup.isAdmin()) return;

        try {
            console.log('[USER CLEANUP] 🔍 Admin: escaneando referências órfãs...');
            const usersSnap = await db.collection('users').get({ source: 'server' });
            const validUids = new Set(usersSnap.docs.map(d => d.id));
            let cleaned = 0;

            for (const doc of usersSnap.docs) {
                const data = doc.data();
                const friends = data.friends || [];
                const sent = data.friendRequestsSent || [];
                const recv = data.friendRequestsReceived || [];

                const validFriends = friends.filter(uid => validUids.has(uid));
                const validSent = sent.filter(uid => validUids.has(uid));
                const validRecv = recv.filter(uid => validUids.has(uid));

                const orphanUids = [
                    ...friends.filter(uid => !validUids.has(uid)),
                    ...sent.filter(uid => !validUids.has(uid)),
                    ...recv.filter(uid => !validUids.has(uid))
                ];

                if (validFriends.length !== friends.length ||
                    validSent.length !== sent.length ||
                    validRecv.length !== recv.length) {
                    await doc.ref.update({
                        friends: validFriends,
                        friendRequestsSent: validSent,
                        friendRequestsReceived: validRecv
                    });
                    cleaned++;
                }

                for (const orphanUid of [...new Set(orphanUids)]) {
                    await window.UserCleanup.removeFromFriendships(orphanUid);
                    await window.UserCleanup.removeFromFriendRequests(orphanUid);
                }
            }

            await window.UserCleanup.purgeInactiveDocuments();

            if (cleaned > 0) {
                console.log(`[USER CLEANUP] ✅ Admin limpou referências órfãs em ${cleaned} usuário(s)`);
            }
        } catch (error) {
            console.warn('[USER CLEANUP] Erro no scan de órfãos:', error);
        }
    },

    /**
     * Admin: apaga documentos inativos/deletados que ainda existem no Firestore
     */
    purgeInactiveDocuments: async () => {
        const db = window.UserCleanup.getDb();
        if (!db || !window.UserCleanup.isAdmin()) return;

        try {
            const usersSnap = await db.collection('users').get({ source: 'server' });
            let purged = 0;

            for (const doc of usersSnap.docs) {
                if (window.UserCleanup.isValidUserData(doc.data())) continue;

                const uid = doc.id;
                await window.UserCleanup.handleUserDeletion(uid, 'Documento inativo — purge automático');

                try {
                    await doc.ref.delete();
                    purged++;
                    console.log(`[USER CLEANUP] 🗑️ Documento removido do Firestore: ${uid}`);
                } catch (deleteError) {
                    console.warn(`[USER CLEANUP] Não foi possível apagar doc ${uid}:`, deleteError.message);
                }
            }

            if (purged > 0) {
                console.log(`[USER CLEANUP] ✅ ${purged} documento(s) inativo(s) apagado(s) do Firestore`);
            }
        } catch (error) {
            console.warn('[USER CLEANUP] Erro ao purgar documentos inativos:', error);
        }
    },

    softDeleteUser: async (uid, reason = 'Solicitação do usuário') => {
        const db = window.UserCleanup.getDb();
        if (!db || !uid) return false;

        await db.collection('users').doc(uid).update({
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

        try {
            await db.collection('users').doc(uid).delete();
            console.log(`[USER CLEANUP] 🗑️ Documento ${uid} apagado do Firestore após soft delete`);
        } catch (error) {
            console.warn(`[USER CLEANUP] Soft delete ok, mas doc não apagado:`, error.message);
        }

        return true;
    },

    startFirestoreDeletionListener: () => {
        if (window.UserCleanup._listenerActive) return;

        const attach = () => {
            const db = window.UserCleanup.getDb();
            if (!db) {
                setTimeout(attach, 300);
                return;
            }

            window.UserCleanup._listenerActive = true;
            console.log('[USER CLEANUP] 👁️ Listener Firestore ativo — detectando deleções automaticamente');

            db.collection('users').onSnapshot(
                { includeMetadataChanges: true },
                (snapshot) => {
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

                    if (snapshot.metadata.fromCache) {
                        console.log('[USER CLEANUP] Snapshot do cache — aguardando confirmação do servidor');
                        return;
                    }

                    if (window.UserCleanup.isAdmin() && !window.UserCleanup._orphanScanDone) {
                        window.UserCleanup._orphanScanDone = true;
                        window.UserCleanup.scanAllOrphanReferences();
                    }
                },
                (error) => {
                    console.warn('[USER CLEANUP] Erro no listener Firestore:', error);
                    window.UserCleanup._listenerActive = false;
                    setTimeout(() => window.UserCleanup.startFirestoreDeletionListener(), 5000);
                }
            );
        };

        attach();
    },

    startMonitoring: () => {
        if (window.UserCleanup._monitoringStarted) return;
        window.UserCleanup._monitoringStarted = true;

        console.log('[USER CLEANUP] Iniciando monitoramento de usuários deletados...');

        window.UserCleanup.startFirestoreDeletionListener();

        window.addEventListener('firebase-user-logged-in', () => {
            window.UserCleanup.scanCurrentUserReferences();
        });

        if (window.auth?.currentUser) {
            window.UserCleanup.scanCurrentUserReferences();
        }

        window.addEventListener('userDeleted', (event) => {
            const uid = event.detail.uid;

            if (window.location.pathname.includes('perfil') &&
                new URLSearchParams(window.location.search).get('uid') === uid) {
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
            if (typeof window.reloadAdminUserList === 'function') {
                window.reloadAdminUserList();
            }
        });
    }
};

console.log('✅ user-cleanup.js loaded');

}

function initUserCleanupMonitoring() {
    if (window.UserCleanup) window.UserCleanup.startMonitoring();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserCleanupMonitoring);
} else {
    initUserCleanupMonitoring();
}
