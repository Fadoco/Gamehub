/**
 * Lógica para o Ranking Global de Usuários (Saldos + Valor dos Jogos)
 */

function initRanking() {
    console.log('[RANKING] initRanking() called');
    const listContainer = document.getElementById('ranking-list-body');
    console.log('[RANKING] listContainer found:', !!listContainer);
    if (!listContainer) {
        console.warn('[RANKING] ranking-list-body not found in DOM');
        return;
    }

    // Estado de carregamento
    listContainer.innerHTML = "<tr><td colspan='4' style='text-align:center; padding: 20px;'>Buscando milionários...</td></tr>";

    // Pequena função para rodar a busca quando o banco estiver pronto
    const startListener = () => {
        console.log('[RANKING] startListener - db:', !!window.db, 'allGamesData:', window.allGamesData?.length || 0);
        if (!window.db || !window.allGamesData || window.allGamesData.length === 0) {
            console.log('[RANKING] Waiting for db/allGamesData...');
            setTimeout(startListener, 500);
            return;
        }
        console.log('[RANKING] Data ready! Starting listener...');

        // Lista de emails de admins
        const adminEmails = ['fadoco12311@gmail.com', 'gabrielmomo6759@gmail.com'];

        // Escuta mudanças em tempo real na coleção de usuários
        window.db.collection('users')
            .onSnapshot((snapshot) => {
                console.log('[RANKING] onSnapshot fired, docs:', snapshot.size);
                if (snapshot.empty) {
                    listContainer.innerHTML = "<tr><td colspan='4' style='text-align:center'>Nenhum usuário encontrado.</td></tr>";
                    return;
                }

                // Lista de emails de admins
                const adminEmails = ['fadoco12311@gmail.com', 'gabrielmomo6759@gmail.com'];
                console.log('[RANKING] Admin emails:', adminEmails);

                // Filtra usuários: remove admins e calcula valor total
                let rankingData = snapshot.docs
                    .map((doc) => {
                        const user = doc.data();
                        const uid = doc.id;
                        const email = user.email || '';
                        
                        console.log('[RANKING] Processing user:', email, 'isAdmin:', adminEmails.includes(email));
                        
                        // Pula admins
                        if (adminEmails.includes(email)) {
                            console.log('[RANKING] Skipping admin:', email);
                            return null;
                        }

                        // Calcula valor total: balance + valor dos jogos
                        const balance = user.balance || 0;
                        let gamesValue = 0;

                        if (user.library && Array.isArray(user.library) && window.allGamesData) {
                            user.library.forEach(gameId => {
                                const game = window.allGamesData.find(g => String(g.id) === String(gameId));
                                if (game) {
                                    const gamePrice = window.utils.parsePrice(game.currentPrice);
                                    gamesValue += gamePrice;
                                }
                            });
                        }

                        const totalValue = balance + gamesValue;
                        
                        // DEBUG
                        console.log(`[RANKING] ${user.displayName || 'Unknown'}: balance=${balance}, gamesValue=${gamesValue}, total=${totalValue}`);

                        return {
                            uid,
                            user,
                            balance,
                            gamesValue,
                            totalValue,
                            name: window.utils.getUserFriendlyName({ ...user, id: uid })
                        };
                    })
                    .filter(item => item !== null) // Remove admins
                    .sort((a, b) => b.totalValue - a.totalValue) // Ordena por valor total decrescente
                    .slice(0, 50); // Pega top 50
                
                console.log('[RANKING] Ranking data after filtering/sorting:', rankingData.length, 'users');
                rankingData.slice(0, 5).forEach((r, i) => {
                    console.log(`[RANKING] #${i+1}: ${r.name} = R$ ${r.totalValue}`);
                });

                if (rankingData.length === 0) {
                    console.warn('[RANKING] No non-admin users found!');
                    listContainer.innerHTML = "<tr><td colspan='3' style='text-align:center'>Nenhum usuário encontrado.</td></tr>";
                    return;
                }

                console.log('[RANKING] Rendering HTML...');
                listContainer.innerHTML = rankingData.map((data, index) => {
                    const user = data.user;
                    const uid = data.uid;
                    const pos = index + 1;
                    const name = data.name;
                    const avatar = user.avatar || `https://ui-avatars.com/api/?name=${name}&background=27ae60&color=fff`;
                    const totalValue = data.totalValue;
                    const profilePath = window.utils.getHtmlPath(`perfil.html?uid=${uid}`);
                    
                    // Determina o estado do botão de amigo
                    let friendBtn = '';
                    const isMe = window.auth?.currentUser?.uid === uid;
                    const isFriend = window.userFriends?.includes(uid);
                    const requestSent = window.userFriendRequestsSent?.includes(uid);
                    const requestReceived = window.userFriendRequestsReceived?.includes(uid);
                    
                    if (!isMe && window.auth?.currentUser) {
                        if (isFriend) {
                            friendBtn = `<button class="nav-button" style="background: #27ae60; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: default;" disabled>Amigo</button>`;
                        } else if (requestSent) {
                            friendBtn = `<button class="nav-button" style="background: var(--secondary); color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: default;" disabled>Pedido Enviado</button>`;
                        } else if (requestReceived) {
                            friendBtn = `<button class="buy-button" style="padding: 6px 12px; font-size: 12px;" onclick="event.stopPropagation(); window.acceptFriendRequest('${uid}')">Aceitar</button>`;
                        }
                    }

                    return `
                        <tr class="rank-row" style="align-items: center;">
                            <td class="rank-pos rank-${pos <= 3 ? pos : 'other'}">#${pos}</td>
                            <td>
                                <div class="rank-user" onclick="window.location.href='${profilePath}'" style="cursor: pointer;">
                                    <img src="${avatar}" class="rank-avatar" alt="Avatar">
                                    <span>${name}</span>
                                </div>
                            </td>
                            <td class="rank-val">R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td style="text-align: center; padding: 10px 5px;">${friendBtn}</td>
                        </tr>
                    `;
                }).join('');
                
                console.log('[RANKING] HTML rendered successfully');
            }, (error) => {
                console.error("[RANKING] Error on snapshot:", error);
                listContainer.innerHTML = `<tr><td colspan='4' style='text-align:center; color: var(--danger)'>Erro ao carregar ranking. Verifique as Regras do Firestore ou Índices.</td></tr>`;
            });
    };

    startListener();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[RANKING] DOMContentLoaded event fired, calling initRanking()');
    initRanking();
});