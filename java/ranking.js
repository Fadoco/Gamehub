/**
 * Lógica para o Ranking Global de Usuários (Saldos + Valor dos Jogos com Upgrades)
 */

function initRanking() {
    const listContainer = document.getElementById('ranking-list-body');
    if (!listContainer) {
        console.error('[RANKING] ❌ Elemento ranking-list-body não encontrado!');
        return;
    }

    console.log('[RANKING] 🟢 Iniciando ranking...');

    // Estado de carregamento
    listContainer.innerHTML = "<tr><td colspan='3' style='text-align:center; padding: 20px;'>Buscando milionários...</td></tr>";

    // Pequena função para rodar a busca quando o banco estiver pronto
    const startListener = () => {
        console.log('[RANKING] Verificando dependências: db=', !!window.db, 'allGamesData=', !!window.allGamesData);
        
        if (!window.db || !window.allGamesData || window.allGamesData.length === 0) {
            console.log('[RANKING] ⏳ Aguardando dependências...');
            setTimeout(startListener, 500);
            return;
        }

        console.log('[RANKING] ✅ Dependências prontas, iniciando listener Firestore...');

        // Escuta mudanças em tempo real na coleção de usuários
        // Lista de emails de admins
        const adminEmails = ['fadoco12311@gmail.com', 'gabrielmomo6759@gmail.com'];

        window.db.collection('users')
            .onSnapshot((snapshot) => {
                console.log('[RANKING] 📦 Snapshot recebido:', {
                    empty: snapshot.empty,
                    size: snapshot.size,
                    docs: snapshot.docs.length
                });

                if (snapshot.empty) {
                    console.warn('[RANKING] ⚠️ Snapshot vazio - nenhum usuário no Firestore');
                    listContainer.innerHTML = "<tr><td colspan='4' style='text-align:center'>Nenhum usuário encontrado.</td></tr>";
                    return;
                }

                console.log('[RANKING] 📋 Processando', snapshot.docs.length, 'documentos do Firestore');
                let rankingData = snapshot.docs
                    .map((doc) => {
                        const user = doc.data();
                        const uid = doc.id;
                        const email = user.email || '';
                        
                        console.log(`[RANKING] Processando usuário: email=${email}, username=${user.username}, active=${user.active}, uid=${uid.slice(0, 8)}...`);
                        
                        // VALIDAÇÕES para detectar usuários deletados ou corrompidos
                        // 1. Pula admins
                        if (adminEmails.includes(email)) {
                            console.log(`[RANKING]   ⏭️ Pulando admin: ${email}`);
                            return null;
                        }
                        
                        // 2. Pula usuários sem email válido (dados corrompidos/deletados)
                        if (!email || email.trim() === '') {
                            console.log(`[RANKING]   ⏭️ Pulando: sem email`);
                            return null;
                        }
                        
                        // 3. Pula usuários sem username (indicativo de deleção parcial)
                        if (!user.username || user.username.trim() === '') {
                            console.log(`[RANKING]   ⏭️ Pulando: sem username`);
                            return null;
                        }
                        
                        // 4. Pula usuários marcados como deletados
                        if (user.active === false) {
                            console.log(`[RANKING]   ⏭️ Pulando: marcado como inativo`);
                            return null;
                        }

                        console.log(`[RANKING]   ✅ Usuário válido: ${user.username}`);

                        // Calcula valor total: balance + valor dos jogos COM UPGRADES
                        const balance = user.balance || 0;
                        let gamesValue = 0;
                        const breakdown = [];

                        if (user.library && Array.isArray(user.library) && window.allGamesData) {
                            user.library.forEach(gameId => {
                                const game = window.allGamesData.find(g => String(g.id) === String(gameId));
                                if (game) {
                                    const basePrice = window.utils.parsePrice(game.currentPrice);
                                    // tenta recuperar upgrades por chave string ou número
                                    const upgradeLevel = (user.upgrades && (user.upgrades[String(gameId)] ?? user.upgrades[gameId])) || 0;
                                    
                                    const gamePriceWithUpgrade = window.RankSystem ?
                                        window.RankSystem.calculateValuation(basePrice, upgradeLevel) :
                                        basePrice;

                                    gamesValue += gamePriceWithUpgrade;
                                    breakdown.push({ 
                                        gameId, 
                                        gameName: game.name,
                                        basePrice, 
                                        upgradeLevel, 
                                        valuation: gamePriceWithUpgrade 
                                    });
                                } else {
                                    breakdown.push({ gameId, error: 'game-not-found' });
                                }
                            });
                        }

                        const totalValue = balance + gamesValue;
                        
                        return {
                            uid,
                            user,
                            balance,
                            gamesValue,
                            totalValue,
                            name: window.utils.getUserFriendlyName({ ...user, id: uid })
                            ,_debug: breakdown
                        };
                    })
                    .filter(item => item !== null) // Remove admins
                    .sort((a, b) => b.totalValue - a.totalValue) // Ordena por valor total decrescente
                    .slice(0, 50); // Pega top 50

                console.log(`[RANKING] 🔍 Após filtros: ${rankingData.length} usuários válidos`);

                if (rankingData.length === 0) {
                    console.log('[RANKING] ❌ Nenhum usuário encontrado após filtragem inicial');
                    listContainer.innerHTML = "<tr><td colspan='4' style='text-align:center'>Nenhum usuário encontrado.</td></tr>";
                    return;
                }

                console.log(`[RANKING] ✅ ${rankingData.length} usuários válidos após filtragem inicial`);

                // LIMPEZA DE USUÁRIOS DELETADOS
                if (window.UserCleanup) {
                    console.log('[RANKING] Iniciando limpeza de usuários deletados...');
                    rankingData = window.UserCleanup.cleanRanking(rankingData);
                    console.log(`[RANKING] ✅ ${rankingData.length} usuários após limpeza`);
                    
                    if (rankingData.length === 0) {
                        console.log('[RANKING] ❌ Nenhum usuário encontrado após limpeza');
                        listContainer.innerHTML = "<tr><td colspan='4' style='text-align:center'>Nenhum usuário encontrado.</td></tr>";
                        return;
                    }
                } else {
                    console.log('[RANKING] ⚠️ UserCleanup não disponível, pulando limpeza');
                }

                // Imprime breakdown de cálculo no console para debug
                console.log('[RANKING] Breakdown for users:');
                rankingData.forEach((d) => {
                    console.group(`${d.name} (uid=${d.uid.slice(0, 8)}...) total=R$ ${d.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                    console.log('balance:', d.balance);
                    console.log('gamesValue:', d.gamesValue);
                    console.table(d._debug || []);
                    console.groupEnd();
                });

                listContainer.innerHTML = rankingData.map((data, index) => {
                    const user = data.user;
                    const uid = data.uid;
                    const pos = index + 1;
                    const name = data.name;
                    const avatar = user.avatar || `https://ui-avatars.com/api/?name=${name}&background=27ae60&color=fff`;
                    const balance = data.balance;
                    const totalValue = data.totalValue;
                    const profilePath = window.utils.getHtmlPath(`perfil.html?uid=${uid}`);

                    return `
                        <tr class="rank-row" style="align-items: center;">
                            <td class="rank-pos rank-${pos <= 3 ? pos : 'other'}">#${pos}</td>
                            <td>
                                <div class="rank-user" onclick="window.location.href='${profilePath}'" style="cursor: pointer;">
                                    <img src="${avatar}" class="rank-avatar" alt="Avatar">
                                    <span>${name}</span>
                                </div>
                            </td>
                            <td class="rank-val" style="text-align: center;">R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td class="rank-val" style="text-align: center; font-weight: bold; color: #f39c12;">R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    `;
                }).join('');
            }, (error) => {
                console.error("[RANKING] Error on snapshot:", error);
                if (error && error.code === 'permission-denied') {
                    listContainer.innerHTML = "<tr><td colspan='4' style='text-align:center; color: var(--danger)'>Acesso negado ao ranking. Faça login ou contacte o administrador.</td></tr>";
                } else {
                    listContainer.innerHTML = `<tr><td colspan='4' style='text-align:center; color: var(--danger)'>Erro ao carregar ranking. Verifique as Regras do Firestore ou Índices.</td></tr>`;
                }
            });
    };

    startListener();
}

document.addEventListener('DOMContentLoaded', initRanking);