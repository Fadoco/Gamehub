/**
 * Lógica do Mercado Negro
 */

async function processSecretPurchase(cost, itemName, actionFn) {
    if (!window.auth.currentUser) return window.showToast("Conexão perdida. Relogue.", "error");
    if (window.userBalance < cost) return window.showToast("SALDO INSUFICIENTE NO SISTEMA.", "error");

    window.customConfirm(`Confirmar bypass de segurança para ${itemName}?`, async () => {
        try {
            const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
            
            // Deduz o saldo
            await userRef.update({
                balance: firebase.firestore.FieldValue.increment(-cost)
            });

            // Executa a ação específica do item
            await actionFn(userRef);

            window.showToast(`${itemName} ADQUIRIDO COM SUCESSO.`, "success");
            
            // Atualiza dados locais
            await window.loadUserData(window.auth.currentUser.uid);
        } catch (error) {
            console.error("Erro no Mercado Negro:", error);
            window.showToast("ERRO NA OPERAÇÃO. LOGS LIMPOS.", "error");
        }
    });
}

// 1. Selo Admin Temporário (5k)
window.buyAdminTemporario = () => {
    processSecretPurchase(5000, "SELO ADMIN", async (userRef) => {
        // Apenas um efeito visual conforme solicitado
        console.log("Hacking admin status...");
        localStorage.setItem('tempAdmin', 'true');
        window.showToast("ACESSO VISUAL LIBERADO POR 60s.", "info");
        
        setTimeout(() => {
            localStorage.removeItem('tempAdmin');
            window.showToast("CONEXÃO ADMIN EXPIRADA.", "warning");
        }, 60000);
    });
};

// 2. Lote de XP Corrompido (15k)
window.buyXPCorrompido = () => {
    processSecretPurchase(15000, "XP CORROMPIDO", async (userRef) => {
        if (!window.userLibrary || window.userLibrary.length === 0) {
            throw new Error("Biblioteca vazia");
        }

        const updates = {};
        window.userLibrary.forEach(gameId => {
            updates[`upgrades.${gameId}`] = 3; // Nível Máximo
        });

        await userRef.update(updates);
    });
};

// 3. Chave de Jogo Proibido (2.5k)
window.buyJogoProibido = () => {
    processSecretPurchase(2500, "JOGO PROIBIDO", async (userRef) => {
        // Sorteia um jogo que o usuário não tem
        const allGames = window.allGamesData || [];
        const notOwned = allGames.filter(g => !window.userLibrary.includes(g.id));
        
        if (notOwned.length === 0) {
            window.showToast("VOCÊ JÁ POSSUI TUDO. NADA É PROIBIDO.", "info");
            return;
        }

        const randomGame = notOwned[Math.floor(Math.random() * notOwned.length)];
        await userRef.update({
            library: firebase.firestore.FieldValue.arrayUnion(randomGame.id)
        });
        
        window.showToast(`VOCÊ DESBLOQUEOU: ${randomGame.title}`, "success");
    });
};

// --- NOVAS FUNCIONALIDADES DO MERCADO NEGRO ---

// 1. Renderizar Jogos Baratos (30% de desconto adicional)
function renderCheaperGames() {
    const container = document.getElementById('cheaper-games-list');
    if (!container || !window.allGamesData) return;

    // Pega 4 jogos aleatórios que o usuário não tem
    const available = window.allGamesData
        .filter(g => !window.userLibrary.includes(g.id) && window.utils.parsePrice(g.currentPrice) > 0)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);

    container.innerHTML = available.map(game => {
        const originalPrice = window.utils.parsePrice(game.currentPrice);
        const secretPrice = originalPrice * 0.7; // 30% de desconto
        return `
            <div class="secret-item">
                <div>
                    <strong>${game.title}</strong>
                    <p style="font-size: 10px; color: #f1c40f;">PREÇO DE MERCADO: R$ ${originalPrice.toFixed(2)}</p>
                </div>
                <span>R$ ${secretPrice.toFixed(2)}</span>
                <button class="btn-hack" onclick="buySecretGame(${game.id}, ${secretPrice})">HACK</button>
            </div>
        `;
    }).join('');
}

window.buySecretGame = async (gameId, price) => {
    processSecretPurchase(price, "JOGO DESVIADO", async (userRef) => {
        await userRef.update({
            library: firebase.firestore.FieldValue.arrayUnion(gameId)
        });
    });
};

// 2. Vender Jogos Melhorados (Lave seu lucro)
function renderSellList() {
    const container = document.getElementById('sell-upgrades-list');
    if (!container || !window.userLibrary) return;

    // Filtra jogos que possuem algum upgrade
    const upgradedGames = window.userLibrary.filter(id => (window.userUpgrades[id] || 0) > 0);

    if (upgradedGames.length === 0) {
        container.innerHTML = '<p style="padding:15px; font-size:12px;">NENHUM ITEM COM UPGRADE PARA REVENDA.</p>';
        return;
    }

    container.innerHTML = upgradedGames.map(gameId => {
        const game = window.allGamesData.find(g => String(g.id) === String(gameId));
        const level = window.userUpgrades[gameId];
        const multipliers = { 1: 1.5, 2: 2.5, 3: 4.0 };
        const basePrice = window.utils.parsePrice(game.currentPrice);
        const sellValue = (basePrice * multipliers[level]) * 0.6; // Vende por 60% do valor de mercado

        return `
            <div class="secret-item">
                <div>
                    <strong>${game.title} ${'+'.repeat(level)}</strong>
                    <p style="font-size: 10px;">VALOR DE REVENDA (60%)</p>
                </div>
                <span style="color: #4ade80;">+ R$ ${sellValue.toFixed(2)}</span>
                <button class="btn-hack" onclick="sellUpgradedItem(${gameId}, ${sellValue})">VENDER</button>
            </div>
        `;
    }).join('');
}

window.sellUpgradedItem = async (gameId, value) => {
    window.customConfirm(`Vender seu item por R$ ${value.toFixed(2)}? Esta ação é irreversível.`, async () => {
        const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
        await userRef.update({
            balance: firebase.firestore.FieldValue.increment(value),
            library: firebase.firestore.FieldValue.arrayRemove(gameId),
            [`upgrades.${gameId}`]: firebase.firestore.FieldValue.delete()
        });
        window.showToast("ITEM VENDIDO. RASTROS APAGADOS.", "success");
        await window.loadUserData(window.auth.currentUser.uid);
        renderSellList();
    });
};

// 3. Roleta Especial (Estrutura)
function initSpecialRoulette() {
    const rail = document.getElementById('special-rail');
    if (!rail) return;
    
    rail.innerHTML = '';
    for(let i=0; i<50; i++) {
        const card = document.createElement('div');
        card.className = 'special-card';
        card.innerHTML = '?';
        rail.appendChild(card);
    }
}

window.spinSpecialRoulette = async () => {
    const cost = 1000;
    if (window.isActionInProgress) return; // Proteção contra spam
    if (window.userBalance < cost) return window.showToast("SALDO INSUFICIENTE.", "error");
    
    window.isActionInProgress = true;
    const rail = document.getElementById('special-rail');
    rail.style.transition = 'none';
    rail.style.transform = 'translateX(0px)';

    // Probabilidades: 35% Win, 45% Stay, 20% Lose
    const roll = Math.random() * 100;
    let resultType = 'lose';
    if (roll < 35) resultType = 'win';
    else if (roll < 80) resultType = 'stay';

    // Preencher rail com cards temáticos
    rail.innerHTML = '';
    for(let i=0; i<50; i++) {
        const card = document.createElement('div');
        card.className = 'special-card';
        if (i === 40) {
            card.style.borderColor = resultType === 'win' ? '#f00' : (resultType === 'stay' ? '#0f0' : '#444');
            card.innerHTML = resultType === 'win' ? 'DM' : (resultType === 'stay' ? 'OK' : 'XX');
        } else {
            card.innerHTML = Math.random() > 0.5 ? '??' : '!!';
        }
        rail.appendChild(card);
    }

    setTimeout(() => {
        rail.style.transition = 'transform 5s cubic-bezier(0.15, 0, 0.05, 1)';
        const cardWidth = 90; // 80px + 10px margem
        const targetX = (40 * cardWidth) - (rail.parentElement.offsetWidth / 2) + (cardWidth / 2);
        rail.style.transform = `translateX(-${targetX}px)`;
        
        setTimeout(async () => {
            try {
                const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
                await userRef.update({ balance: firebase.firestore.FieldValue.increment(-cost) });

                if (resultType === 'win') {
                    // Busca itens Rank 3
                    const rank3Games = window.userLibrary.filter(id => (window.userUpgrades[id] || 0) === 3);
                    
                    if (rank3Games.length > 0) {
                        const targetId = rank3Games[Math.floor(Math.random() * rank3Games.length)];
                        await userRef.update({ [`upgrades.${targetId}`]: 4 });
                        window.showToast("MATÉRIA ESCURA DETECTADA. RANK PROIBIDO ALCANÇADO.", "success");
                    } else {
                        // Consolação: Upgrade aleatório para Rank 3
                        const otherGames = window.userLibrary.filter(id => (window.userUpgrades[id] || 0) < 3);
                        if (otherGames.length > 0) {
                            const targetId = otherGames[Math.floor(Math.random() * otherGames.length)];
                            await userRef.update({ [`upgrades.${targetId}`]: 3 });
                            window.showToast("ESTABILIDADE ALCANÇADA: RANK LENDÁRIO.", "success");
                        }
                    }
                } else if (resultType === 'stay') {
                    window.showToast("CONEXÃO ESTÁVEL. NADA MUDOU.", "info");
                } else {
                    window.showToast("FALHA CRÍTICA. CRÉDITOS PERDIDOS.", "error");
                }
                await window.loadUserData(window.auth.currentUser.uid);
            } finally {
                window.isActionInProgress = false;
            }
        }, 5500);
    }, 50);
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Aguarda carregar dados globais
    setTimeout(() => {
        renderCheaperGames();
        renderSellList();
        initSpecialRoulette();
    }, 1000);

    console.log("%c MERCADO NEGRO ATIVO ", "background: #000; color: #0f0; font-size: 20px;");
    
    // Pequena animação de "digitação" no parágrafo inicial
    const p = document.querySelector('.black-market-container p');
    const text = p.innerText;
    p.innerText = '';
    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) {
            p.innerText += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
        }
    }, 50);
});