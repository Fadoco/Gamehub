/**
 * Lógica do Sistema de Roleta e Caixas Misteriosas
 */

let selectedGameToBet = null;
const sounds = {
    // Links de áudio corrigidos e mais estáveis
    spin: new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3'), 
    tick: new Audio('https://www.soundjay.com/buttons/sounds/button-27.mp3')
};

// Garante que o áudio não trave o script se falhar
const playSound = (sound) => {
    sound.currentTime = 0;
    sound.play().catch(e => console.warn("Áudio bloqueado ou indisponível:", e));
};

// Helper para definir raridade baseada no preço
function getRarityInfo(priceStr) {
    const price = window.utils.parsePrice(priceStr);
    if (price < 50) return { class: 'rarity-gray', label: 'Comum' };
    if (price <= 100) return { class: 'rarity-green', label: 'Incomum' };
    if (price <= 150) return { class: 'rarity-purple', label: 'Raro' };
    if (price < 300) return { class: 'rarity-gold', label: 'Épico' };
    return { class: 'rarity-mythic', label: 'Mítico' };
}

function renderRoulette() {
    console.log("Sistema de Recompensas inicializado...");
    
    const inventoryGrid = document.getElementById('bet-inventory-grid');
    if (!inventoryGrid || !allGamesData.length) return;

    // Filtrar jogos da biblioteca que NÃO são gratuitos (Preço > 0)
    const bettableGames = allGamesData.filter(game => {
        const isOwned = window.userLibrary.some(libId => String(libId) === String(game.id));
        const isNotFree = window.utils.parsePrice(game.currentPrice) > 0;
        return isOwned && isNotFree;
    });

    if (bettableGames.length === 0) {
        inventoryGrid.innerHTML = '<p style="grid-column: 1/-1; padding: 20px;">Você não possui jogos pagos para apostar.</p>';
        return;
    }

    inventoryGrid.innerHTML = bettableGames.map(game => `
        <div class="bet-item" data-id="${game.id}" onclick="selectGameForBet(${game.id})">
            <img src="${game.image}" alt="${game.title}">
            <div class="bet-item-info">
                <span class="bet-item-name">${game.title}</span>
                <span class="bet-item-price">${game.currentPrice}</span>
            </div>
        </div>
    `).join('');
}

window.selectGameForBet = (gameId) => {
    const game = allGamesData.find(g => String(g.id) === String(gameId));
    if (!game) return;
    const currentLevel = window.userUpgrades[game.id] || 0;

    selectedGameToBet = game;

    // Atualiza Visual
    document.querySelectorAll('.bet-item').forEach(el => {
        el.classList.toggle('selected', el.getAttribute('data-id') == gameId);
    });

    const display = document.getElementById('selected-game-display');
    const spinBtn = document.getElementById('btn-spin');

    if (display) {
        const colors = ['#0078f2', '#a335ee', '#ffb400'];
        const rankText = currentLevel > 0 ? `<span style="color:${colors[currentLevel-1]}">${'+'.repeat(currentLevel)}</span>` : '';
        
        display.classList.add('active');
        display.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; width:100%">
                <img src="${game.image}" style="width:50px; border-radius:4px;">
                <div style="text-align:left">
                    <strong style="display:block">${game.title} ${rankText}</strong>
                    <span style="font-size:12px; color:var(--accent)">Rank Atual: ${currentLevel} | Alvo: ${currentLevel + 1}</span>
                </div>
            </div>
        `;
    }

    if (spinBtn) {
        spinBtn.disabled = currentLevel >= 3;
        spinBtn.textContent = currentLevel >= 3 ? "Rank Máximo Atingido" : "Girar e Melhorar Jogo";
        spinBtn.onclick = () => startUpgradeSpin();
    }
};

function generateRouletteRail(winnerType, winningGame) {
    const rail = document.getElementById('roulette-rail');
    rail.style.transition = 'none';
    rail.style.transform = 'translateX(0px)';
    rail.innerHTML = '';

    const totalItems = 60; // Quantidade de cards para dar sensação de velocidade
    const itemWidth = 130; // largura do card (120) + margem (10)
    
    for (let i = 0; i < totalItems; i++) {
        const card = document.createElement('div');
        card.className = 'roulette-card';
        
        const isWinner = (i === 55);
        // Se for o vencedor (card 55), aplica o tipo real. Se não, aleatório.
        const type = isWinner ? winnerType : ['win', 'stay', 'lose'][Math.floor(Math.random() * 3)];
        
        // Limpa classes anteriores e aplica a nova
        card.classList.remove('win-card', 'stay-card', 'lose-card');
        
        if (type === 'win') card.classList.add('win-card');
        else if (type === 'stay') card.classList.add('stay-card');
        else if (type === 'lose') card.classList.add('lose-card');

        card.innerHTML = `<span class="q-mark">?</span>`;
        if (isWinner) {
            // Texto do selo baseado no resultado real
            const label = winnerType === 'win' ? 'UPGRADE!' : (winnerType === 'stay' ? 'NADA' : 'PERDEU!');
            card.innerHTML += `<span class="card-label">${label}</span>`;
        }

        rail.appendChild(card);
    }

    // Força reflow para o navegador notar a mudança de 'transition: none'
    rail.offsetHeight; 

    // Calcula a parada exata (centralizado no seletor)
    const containerWidth = document.querySelector('.roulette-wrapper').offsetWidth;
    const targetPos = (55 * itemWidth) - (containerWidth / 2) + (itemWidth / 2);

    rail.style.transition = 'transform 7s cubic-bezier(0.15, 0, 0.05, 1)';
    rail.style.transform = `translateX(-${targetPos}px)`;

    // Tocar som de tick
    let ticks = 0;
    const interval = setInterval(() => {
        ticks++;
        playSound(sounds.tick);
        if (ticks > 55) clearInterval(interval);
    }, 110); 
}

window.openBox = async (tier) => {
    if (!window.auth.currentUser) return window.showToast("Faça login para abrir caixas!", "info");
    
    const boxCosts = { 'bronze': 5, 'gold': 50 };
    const cost = boxCosts[tier];

    if (window.userBalance < cost) return window.showToast("Saldo insuficiente!", "error");

    const spinBtn = document.querySelector(`.box-card.tier-${tier} .nav-button`);
    spinBtn.disabled = true;

    // 1. Selecionar ganhador
    let pool = allGamesData.filter(g => window.utils.parsePrice(g.currentPrice) > 0);
    if (tier === 'gold') pool = pool.filter(g => window.utils.parsePrice(g.currentPrice) > 50);
    
    const winningGame = pool[Math.floor(Math.random() * pool.length)];
    const rarity = getRarityInfo(winningGame.currentPrice);

    // 2. Preparar Trilho de Mistério
    const rail = document.getElementById('roulette-rail');
    rail.style.transition = 'none';
    rail.style.transform = 'translateX(0px)';
    rail.innerHTML = '';

    for (let i = 0; i < 60; i++) {
        const card = document.createElement('div');
        card.className = 'roulette-card';
        
        let displayRarity;
        if (i === 55) {
            displayRarity = rarity;
        } else {
            const randomGame = pool[Math.floor(Math.random() * pool.length)];
            displayRarity = getRarityInfo(randomGame.currentPrice);
        }
        
        card.classList.add(displayRarity.class);
        card.innerHTML = `<span class="q-mark">?</span>`;
        rail.appendChild(card);
    }

    rail.offsetHeight;
    const itemWidth = 130;
    const containerWidth = document.querySelector('.roulette-wrapper').offsetWidth;
    const targetPos = (55 * itemWidth) - (containerWidth / 2) + (itemWidth / 2);

    playSound(sounds.spin);
    
    rail.style.transition = 'transform 7s cubic-bezier(0.15, 0, 0.05, 1)';
    rail.style.transform = `translateX(-${targetPos}px)`;

    // Som de Tick
    let ticks = 0;
    const interval = setInterval(() => {
        ticks++;
        const tickClone = sounds.tick.cloneNode();
        tickClone.volume = 0.5;
        tickClone.play().catch(() => {});
        if (ticks > 55) clearInterval(interval);
    }, 110);

    // 3. Revelação e Salvamento
    setTimeout(async () => {
        // Revelar o vencedor no trilho
        const winnerCard = rail.children[55];
        winnerCard.innerHTML = `
            <img src="${winningGame.image}" style="width:100%; height:100%; object-fit:cover; opacity: 1;">
            <span class="card-label" style="background:rgba(0,0,0,0.8);">${winningGame.title}</span>
        `;

        try {
            const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
            const newBalance = window.userBalance - cost;
            
            // Se o usuário já tiver o jogo, ele ganha o valor do jogo de volta como consolação
            if (window.userLibrary.includes(winningGame.id)) {
                const refund = window.utils.parsePrice(winningGame.currentPrice) * 0.5;
                await userRef.update({ balance: newBalance + refund });
                window.showToast(`Você já tinha o jogo! Recebeu R$ ${refund.toFixed(2)} de compensação.`, "info");
            } else {
                await userRef.update({
                    balance: newBalance,
                    library: firebase.firestore.FieldValue.arrayUnion(winningGame.id)
                });
                window.showToast(`PARABÉNS! Você ganhou ${winningGame.title}!`, "success");
            }

            await window.loadUserData(window.auth.currentUser.uid);
            renderRoulette();
        } catch (e) {
            console.error(e);
        } finally {
            spinBtn.disabled = false;
        }
    }, 7200);
};

async function startUpgradeSpin() {
    if (!selectedGameToBet || !window.auth.currentUser) return;
    
    const gameId = selectedGameToBet.id;
    const currentLevel = window.userUpgrades[gameId] || 0;
    const gamePrice = window.utils.parsePrice(selectedGameToBet.currentPrice);
    const spinBtn = document.getElementById('btn-spin');
    
    spinBtn.disabled = true;
    spinBtn.textContent = "Girando...";
    
    playSound(sounds.spin);

    // 1. Probabilidades baseadas no nível atual
    let winProb, stayProb; // O resto é a probabilidade de perder
    
    if (currentLevel === 0) { // Para Raro (+)
        winProb = 60; stayProb = 30; // 10% de perda
    } else if (currentLevel === 1) { // Para Épico (++)
        winProb = 35; stayProb = 35; // 30% de perda
    } else { // Para Lendário (+++)
        winProb = 15; stayProb = 25; // 60% de perda
    }

    // 2. Ajuste de Dificuldade por Preço: -5% de chance a cada R$ 50,00
    const pricePenalty = Math.floor(gamePrice / 50) * 5;
    winProb = Math.max(5, winProb - pricePenalty); // Chance mínima de 5%

    const result = Math.random() * 100;
    let winnerType = 'lose';
    if (result < winProb) winnerType = 'win';
    else if (result < winProb + stayProb) winnerType = 'stay';

    // 3. Inicia a animação visual da roleta
    generateRouletteRail(winnerType, selectedGameToBet);

    // 4. Aguarda a animação terminar (7 segundos) para atualizar o banco de dados
    setTimeout(async () => {
        const userRef = window.db.collection('users').doc(window.auth.currentUser.uid);
        try {
            if (winnerType === 'win') {
                // SUCESSO: Aumenta o nível
                const newLevel = currentLevel + 1;
                await userRef.set({ upgrades: { [gameId]: newLevel } }, { merge: true });
                window.showToast(`BOA! Seu jogo agora é Rank ${newLevel}!`, "success");
            } 
            else if (winnerType === 'stay') {
                // NEUTRO: Não ganha nada, mas mantém o jogo
                window.showToast("A roleta parou no meio... Você manteve seu jogo.", "info");
            } 
            else {
                // Lógica de Remoção Corrigida
                const idParaRemover = Number(gameId);
                
                // Atualiza o banco (tenta remover tanto como número quanto string por segurança)
                await userRef.update({
                    library: firebase.firestore.FieldValue.arrayRemove(idParaRemover),
                    [`upgrades.${gameId}`]: firebase.firestore.FieldValue.delete()
                });
                await userRef.update({
                    library: firebase.firestore.FieldValue.arrayRemove(String(gameId))
                });

                // Remove localmente para refletir na UI imediatamente
                window.userLibrary = window.userLibrary.filter(id => Number(id) !== idParaRemover);
                
                window.showToast("QUE AZAR! Você perdeu o jogo na aposta.", "error");
            }
            
            // Recarrega os dados e a interface
            await window.loadUserData(window.auth.currentUser.uid);
            selectedGameToBet = null;
            document.getElementById('selected-game-display').innerHTML = "<p>Nenhum jogo selecionado</p>";
            renderRoulette();
            
        } catch (error) {
            console.error("Erro na aposta:", error);
            window.showToast("Erro ao processar aposta.", "error");
        } finally {
            spinBtn.textContent = "Girar e Melhorar Jogo";
        }
    }, 7200); // Tempo da animação + pequeno delay
}

// Escutar mudanças no Firebase para atualizar o inventário se o usuário ganhar/perder algo
if (window.auth) {
    window.auth.onAuthStateChanged(() => {
        setTimeout(renderRoulette, 1000); // Pequeno delay para garantir que global.js carregou os dados
    });
}