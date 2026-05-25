/**
 * Lógica do Sistema de Roleta e Caixas Misteriosas
 */

let selectedGameToBet = null;
const sounds = {
    // Áudio de abertura de caixa do CS:GO (MyInstants)
    spin: new Audio('https://www.myinstants.com/media/sounds/csgo-case-open.mp3'), 
    tick: new Audio('https://raw.githubusercontent.com/Aris-Tottle/Casino-Slot-Machine/master/sounds/click.mp3')
};

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
        
        // O card de índice 55 será o nosso vencedor
        if (i === 55) {
            card.classList.add(winnerType + '-card');
            card.innerHTML = `<span class="q-mark">?</span><span class="card-label">${winnerType === 'win' ? 'UPGRADE!' : (winnerType === 'stay' ? 'NADA' : 'PERDEU')}</span>`;
        } else {
            // Preenche o resto com pontos de interrogação aleatórios para efeito visual
            const types = ['win', 'stay', 'lose'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            card.classList.add(randomType + '-card');
            card.innerHTML = `<span class="q-mark">?</span>`;
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

    // Tocar som de tick baseado no movimento (aproximado)
    let ticks = 0;
    const interval = setInterval(() => {
        ticks++;
        // Toca o som de tick apenas se o áudio estiver carregado
        const tickClone = sounds.tick.cloneNode();
        tickClone.volume = 0.5;
        tickClone.play().catch(() => {});
        if (ticks > 55) clearInterval(interval);
    }, 110); 
}

async function startUpgradeSpin() {
    if (!selectedGameToBet || !window.auth.currentUser) return;
    
    const gameId = selectedGameToBet.id;
    const currentLevel = window.userUpgrades[gameId] || 0;
    const gamePrice = window.utils.parsePrice(selectedGameToBet.currentPrice);
    const spinBtn = document.getElementById('btn-spin');
    
    spinBtn.disabled = true;
    spinBtn.textContent = "Girando...";
    
    // Tocar som de início de giro
    sounds.spin.currentTime = 0;
    sounds.spin.play().catch(e => console.warn("Áudio bloqueado pelo navegador:", e));

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
                // PERDA: Remove o jogo da biblioteca e apaga os upgrades dele
                await userRef.update({
                    library: firebase.firestore.FieldValue.arrayRemove(gameId),
                    [`upgrades.${gameId}`]: firebase.firestore.FieldValue.delete()
                });
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