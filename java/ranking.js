/**
 * Lógica para o Ranking Global de Usuários (Saldos + Valor dos Jogos com Upgrades)
 */

function initRanking() {
    const listContainer = document.getElementById('ranking-list-body');
    if (!listContainer) return;

    // Estado de carregamento
    listContainer.innerHTML = "<tr><td colspan='3' style='text-align:center; padding: 20px;'>Buscando milionários...</td></tr>";

    // Pequena função para rodar a busca quando o banco estiver pronto
    const startListener = () => {
        if (!window.db || !window.allGamesData || window.allGamesData.length === 0) {
            setTimeout(startListener, 500);
            return;
        }

// Escuta mudanças em tempo real na coleção de usuários
        // Lista de emails de admins
        const adminEmails = ['fadoco12311@gmail.com', 'gabrielmomo6759@gmail.com'];

        window.db.collection('users')
            .onSnapshot((snapshot) => {
                if (snapshot.empty) {
                    listContainer.innerHTML = "<tr><td colspan='4' style='text-align:center'>Nenhum usuário encontrado.</td></tr>";
                    return;
                }

                // Filtra usuários: remove admins e calcula valor total
                let rankingData = snapshot.docs
                    .map((doc) => {
                        const user = doc.data();
                        const uid = doc.id;
                        const email = user.email || '';
                        
                        // Pula admins — eles não aparecem no ranking
                        if (adminEmails.includes(email)) {
                            return null;
                        }

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
                                    breakdown.push({ gameId, basePrice, upgradeLevel, valuation: gamePriceWithUpgrade });
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

                if (rankingData.length === 0) {
                    listContainer.innerHTML = "<tr><td colspan='4' style='text-align:center'>Nenhum usuário encontrado.</td></tr>";
                    return;
                }

                // Se estiver no modo de debug, imprime breakdowns no console
                if (window.DEBUG_RANKING) {
                    console.log('[RANKING][DEBUG] Breakdown for users:');
                    rankingData.forEach((d) => {
                        console.group(`uid=${d.uid} name=${d.name} total=${d.totalValue}`);
                        console.log('balance:', d.balance);
                        console.table(d._debug || []);
                        console.groupEnd();
                    });
                }

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