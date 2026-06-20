/**
 * Painel de Roleta de Eventos - Admin (Automático e Aleatório)
 * Sistema para apresentações ao vivo
 */

let allUsers = [];
let isSpinning = false;

// Eventos disponíveis
const EVENTS = {
    money_win: {
        name: '💰 Ganhar Dinheiro',
        icon: 'fas fa-coins',
        color: '#f39c12',
        minValue: 50,
        maxValue: 500
    },
    money_lose: {
        name: '📉 Perder Dinheiro',
        icon: 'fas fa-money-bill-wave',
        color: '#e74c3c',
        minValue: 50,
        maxValue: 300
    },
    game_win: {
        name: '🎁 Ganhar Jogo',
        icon: 'fas fa-gift',
        color: '#2ecc71',
        minValue: 0,
        maxValue: 0
    },
    game_lose: {
        name: '🗑️ Perder Jogo',
        icon: 'fas fa-trash',
        color: '#9b59b6',
        minValue: 0,
        maxValue: 0
    },
    upgrade_random: {
        name: '⭐ Jogo Melhorado',
        icon: 'fas fa-star',
        color: '#3498db',
        minValue: 0,
        maxValue: 0
    }
};

// Inicializa o painel
window.addEventListener('DOMContentLoaded', async () => {
    // Aguarda Firebase inicializar
    let retries = 0;
    while (!window.db || !window.auth.currentUser) {
        if (retries++ > 30) {
            document.body.innerHTML = '<div style="padding: 40px; text-align: center; color: red;"><h1>❌ Erro ao Carregar</h1><p>Faça login novamente.</p></div>';
            return;
        }
        await new Promise(r => setTimeout(r, 100));
    }

    // Verificar se é admin
    const isAdmin = window.auth.currentUser.email === 'fadoco12311@gmail.com' || 
                   window.auth.currentUser.email === 'gabrielmomo6759@gmail.com';
    
    if (!isAdmin) {
        document.body.innerHTML = '<div style="padding: 40px; text-align: center; color: red;"><h1>❌ Acesso Negado</h1><p>Apenas administradores podem acessar esta página.</p></div>';
        return;
    }

    await loadUsers();
    initializeRoulette();

    console.log('✅ Painel de Roleta de Eventos carregado');
});

/**
 * Carregar lista de usuários
 */
async function loadUsers() {
    try {
        const snapshot = await window.db.collection('users').get();
        allUsers = [];
        
        snapshot.forEach(doc => {
            allUsers.push({
                uid: doc.id,
                email: doc.data().email,
                displayName: doc.data().displayName || 'Usuário Anônimo',
                isAdmin: doc.data().email === 'fadoco12311@gmail.com' || doc.data().email === 'gabrielmomo6759@gmail.com',
                library: doc.data().library || []
            });
        });

        const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
        document.getElementById('total-users').textContent = allUsers.length;
        document.getElementById('non-admin-users').textContent = nonAdminUsers.length;

        console.log(`✅ ${nonAdminUsers.length} usuários carregados`);
    } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
    }
}

/**
 * Inicializar roleta vazia
 */
function initializeRoulette() {
    const rail = document.getElementById('roulette-rail');
    rail.innerHTML = '';
    rail.style.transition = 'none';
    rail.style.transform = 'translateX(0px)';

    // Criar cards da roleta
    for (let i = 0; i < 50; i++) {
        const eventKey = Object.keys(EVENTS)[Math.floor(Math.random() * Object.keys(EVENTS).length)];
        const event = EVENTS[eventKey];
        
        const card = document.createElement('div');
        card.className = 'roulette-card';
        card.innerHTML = `<i class="${event.icon}"></i><div>${event.name}</div>`;
        card.style.color = event.color;
        rail.appendChild(card);
    }
}

/**
 * Iniciar spin da roleta
 */
window.startRoulette = async () => {
    if (isSpinning) return;
    
    isSpinning = true;
    document.getElementById('btn-spin').disabled = true;
    document.getElementById('result-section').style.display = 'none';

    // Gerar evento aleatório
    const eventKeys = Object.keys(EVENTS);
    const selectedEventKey = eventKeys[Math.floor(Math.random() * eventKeys.length)];
    const selectedEvent = EVENTS[selectedEventKey];

    // Gerar valor aleatório
    let eventValue = 0;
    if (selectedEvent.minValue < selectedEvent.maxValue) {
        eventValue = Math.floor(Math.random() * (selectedEvent.maxValue - selectedEvent.minValue + 1)) + selectedEvent.minValue;
    }

    // Gerar quantidade de usuários aleatória (50% a 100% do total)
    const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
    const minAffected = Math.ceil(nonAdminUsers.length * 0.5);
    const maxAffected = nonAdminUsers.length;
    const affectedCount = Math.floor(Math.random() * (maxAffected - minAffected + 1)) + minAffected;

    // Animar roleta
    const rail = document.getElementById('roulette-rail');
    const wrapper = rail.parentElement;
    const winnerCard = rail.children[25]; // Card do meio

    const randomInnerOffset = Math.floor(Math.random() * (winnerCard.offsetWidth * 0.6)) - (winnerCard.offsetWidth * 0.3);
    const targetPos = (winnerCard.offsetLeft + winnerCard.offsetWidth / 2) - (wrapper.offsetWidth / 2) + randomInnerOffset;

    // Delay antes de girar (como a roleta original)
    setTimeout(() => {
        rail.style.transition = 'transform 5.7s cubic-bezier(0.15, 0, 0.05, 1)';
        rail.style.transform = `translateX(-${targetPos}px)`;
    }, 1200);

    // Revelar resultado (7.1s = 1.2s delay + 5.7s animação + 0.2s margem)
    setTimeout(async () => {
        // Animar card vencedor
        winnerCard.classList.add('winning');
        
        // Aplicar evento
        await applyEventToUsers(selectedEventKey, eventValue, affectedCount);

        // Mostrar resultado
        showResult(selectedEvent, eventValue, affectedCount, selectedEventKey);

        // Reinicializar roleta
        setTimeout(() => {
            initializeRoulette();
            document.getElementById('btn-spin').disabled = false;
            isSpinning = false;
        }, 3000);

    }, 7100);
};

/**
 * Aplicar evento aos usuários
 */
async function applyEventToUsers(eventKey, value, count) {
    const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
    const targetUsers = nonAdminUsers.slice(0, count);

    try {
        for (const user of targetUsers) {
            const userRef = window.db.collection('users').doc(user.uid);

            switch (eventKey) {
                case 'money_win':
                    await userRef.update({
                        balance: firebase.firestore.FieldValue.increment(value)
                    });
                    break;

                case 'money_lose':
                    await userRef.update({
                        balance: firebase.firestore.FieldValue.increment(-value)
                    });
                    break;

                case 'game_win':
                    if (window.allGamesData && window.allGamesData.length > 0) {
                        const randomGame = window.allGamesData[Math.floor(Math.random() * window.allGamesData.length)];
                        await userRef.update({
                            library: firebase.firestore.FieldValue.arrayUnion(randomGame.id)
                        });
                    }
                    break;

                case 'game_lose':
                    const userDoc = await userRef.get();
                    const library = userDoc.data().library || [];
                    if (library.length > 0) {
                        const randomGameId = library[Math.floor(Math.random() * library.length)];
                        const newLibrary = library.filter(id => id !== randomGameId);
                        await userRef.update({ library: newLibrary });
                    }
                    break;

                case 'upgrade_random':
                    const userDoc2 = await userRef.get();
                    const userLibrary = userDoc2.data().library || [];
                    if (userLibrary.length > 0) {
                        const randomGameId = userLibrary[Math.floor(Math.random() * userLibrary.length)];
                        const currentLevel = (userDoc2.data().upgrades || {})[randomGameId] || 0;
                        
                        if (currentLevel < 3) {
                            const upgradesObj = userDoc2.data().upgrades || {};
                            upgradesObj[randomGameId] = currentLevel + 1;
                            await userRef.update({ upgrades: upgradesObj });
                        }
                    }
                    break;
            }
        }
        console.log(`✅ Evento "${eventKey}" aplicado a ${targetUsers.length} usuários`);
    } catch (error) {
        console.error('❌ Erro ao aplicar evento:', error);
    }
}

/**
 * Mostrar resultado
 */
function showResult(event, value, affectedCount, eventKey) {
    const resultSection = document.getElementById('result-section');
    const resultTitle = document.getElementById('result-title');
    const resultDescription = document.getElementById('result-description');
    const resultValue = document.getElementById('result-value');
    const resultCount = document.getElementById('result-count');

    // Montar descrição
    let description = '';
    let valueText = '';

    switch (eventKey) {
        case 'money_win':
            description = `Todos ganharam R$ ${value.toFixed(2)}!`;
            valueText = `+R$ ${value.toFixed(2)}`;
            resultValue.className = 'result-value';
            break;
        case 'money_lose':
            description = `Todos perderam R$ ${value.toFixed(2)}!`;
            valueText = `-R$ ${value.toFixed(2)}`;
            resultValue.className = 'result-value negative';
            break;
        case 'game_win':
            description = `Todos ganharam um jogo aleatório!`;
            valueText = `🎁 Novo Jogo`;
            resultValue.className = 'result-value';
            break;
        case 'game_lose':
            description = `Todos perderam um jogo da biblioteca!`;
            valueText = `🗑️ Jogo Removido`;
            resultValue.className = 'result-value negative';
            break;
        case 'upgrade_random':
            description = `Um jogo aleatório foi melhorado!`;
            valueText = `⭐ Upgrade +1`;
            resultValue.className = 'result-value';
            break;
    }

    resultTitle.textContent = '🎉 RESULTADO!';
    resultDescription.textContent = description;
    resultValue.textContent = valueText;
    resultCount.textContent = `Afetou ${affectedCount} usuário(s)`;

    // Atualizar last event status
    const timeStr = new Date().toLocaleTimeString('pt-BR');
    document.getElementById('last-event-status').textContent = 
        `${event.name} | ${timeStr}`;

    resultSection.style.display = 'block';
}

/**
 * Reset de carteira - Todos usuários (menos admins) para R$ 5.000
 */
window.resetAllWallets = async () => {
    const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
    const confirmed = confirm(
        `⚠️ Isso vai resetar a carteira de ${nonAdminUsers.length} usuários para R$ 5.000\n\nDeseja continuar?`
    );

    if (!confirmed) return;

    if (isSpinning) {
        window.showToast('A roleta está girando. Aguarde...', 'info');
        return;
    }

    try {
        window.showToast(`💰 Resetando carteiras...`, 'info');

        let processedCount = 0;

        for (const user of nonAdminUsers) {
            try {
                await window.db.collection('users').doc(user.uid).update({
                    balance: 5000
                });
                processedCount++;
            } catch (error) {
                console.error(`Erro ao resetar usuário ${user.displayName}:`, error);
            }
        }

        const timeStr = new Date().toLocaleTimeString('pt-BR');
        document.getElementById('last-event-status').textContent = 
            `💰 Reset R$ 5.000 | ${timeStr}`;

        window.showToast(`✅ Carteiras resetadas! ${processedCount} usuários com R$ 5.000`, 'success');
        console.log(`✅ Reset de carteira concluído`);

    } catch (error) {
        console.error('❌ Erro ao resetar carteiras:', error);
        window.showToast('Erro ao resetar carteiras', 'error');
    }
};
