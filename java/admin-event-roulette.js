/**
 * Painel de Roleta de Eventos - Admin
 * Sistema com roletas giratórias e resultado automático
 */

let selectedEvent = null;
let selectedPeople = null;
let selectedAmount = null;
let allUsers = [];
let eventInProgress = false;
let rouletteInProgress = false;
let peopleCount = 0;
let affectedUsers = [];

// Mapeamento de eventos
const EVENTS = {
    money_win: {
        name: '💰 Ganhar Dinheiro',
        icon: 'fas fa-coins',
        color: '#f39c12',
        action: 'Ganhar'
    },
    money_lose: {
        name: '📉 Perder Dinheiro',
        icon: 'fas fa-money-bill-wave',
        color: '#e74c3c',
        action: 'Perder'
    },
    game_win: {
        name: '🎁 Ganhar Jogo',
        icon: 'fas fa-gift',
        color: '#2ecc71',
        action: 'Ganhar'
    },
    game_lose: {
        name: '🗑️ Perder Jogo',
        icon: 'fas fa-trash',
        color: '#9b59b6',
        action: 'Perder'
    },
    upgrade_random: {
        name: '⭐ Jogo Aleatório Melhorado',
        icon: 'fas fa-star',
        color: '#3498db',
        action: 'Ganhar'
    }
};

// Inicializa o painel
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando painel de Roleta de Eventos...');
    
    // Aguarda Firebase inicializar
    let retries = 0;
    while (!window.db || !window.auth.currentUser) {
        if (retries++ > 30) {
            console.error('❌ Firebase não inicializou após 30 tentativas');
            window.showToast('Erro ao carregar dados. Faça login novamente.', 'error');
            return;
        }
        await new Promise(r => setTimeout(r, 100));
    }

    console.log('✅ Firebase inicializado');
    console.log('👤 Usuário atual:', window.auth.currentUser.email);

    // Verificar se é admin
    const isAdmin = window.auth.currentUser.email === 'fadoco12311@gmail.com' || 
                   window.auth.currentUser.email === 'gabrielmomo6759@gmail.com';
    
    console.log('🔐 É Admin?', isAdmin);
    
    if (!isAdmin) {
        document.body.innerHTML = '<div style="padding: 40px; text-align: center; color: red;"><h1>❌ Acesso Negado</h1><p>Apenas administradores podem acessar esta página.</p></div>';
        return;
    }

    await loadUsers();
    await loadTopUsers();
    await loadGames();

    console.log('✅ Painel de Roleta de Eventos carregado com sucesso');
});

/**
 * Carregar lista de usuários
 */
async function loadUsers() {
    try {
        console.log('📥 Carregando usuários do Firestore...');
        const snapshot = await window.db.collection('users').get();
        allUsers = [];
        
        console.log(`📊 Total de documentos na coleção: ${snapshot.size}`);
        
        snapshot.forEach(doc => {
            const userData = doc.data();
            const email = userData.email || 'sem-email';
            const isAdmin = email === 'fadoco12311@gmail.com' || email === 'gabrielmomo6759@gmail.com';
            
            allUsers.push({
                uid: doc.id,
                email: email,
                displayName: window.utils.getUserFriendlyName({ ...userData, id: doc.id }) || 'Usuário',
                isAdmin: isAdmin,
                avatar: userData.avatar || null,
                gamesBought: userData.library ? userData.library.length : 0
            });
            
            console.log(`👤 ${userData.displayName || 'Anônimo'} (${email}) - Admin: ${isAdmin}`);
        });

        // Filtrar apenas usuários não-admin
        const nonAdminUsers = allUsers.filter(u => !u.isAdmin);

        document.getElementById('total-users').textContent = allUsers.length;
        document.getElementById('non-admin-users').textContent = nonAdminUsers.length;

        console.log(`✅ ${nonAdminUsers.length} usuários não-admin carregados`);
    } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        window.showToast('Erro ao carregar usuários: ' + error.message, 'error');
    }
}

/**
 * Carregar e exibir top 5 usuários do ranking
 */
async function loadTopUsers() {
    try {
        const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
        
        // Ordenar por número de jogos (ranking simplificado)
        const topUsers = nonAdminUsers
            .sort((a, b) => b.gamesBought - a.gamesBought)
            .slice(0, 5);

        const grid = document.getElementById('top-users-grid');
        grid.innerHTML = '';

        topUsers.forEach((user, index) => {
            const card = document.createElement('div');
            card.className = 'user-card';
            
            const avatarHtml = user.avatar 
                ? `<img src="${user.avatar}" alt="${user.displayName}">` 
                : `<i class="fas fa-user" style="color: white;"></i>`;

            card.innerHTML = `
                <div class="user-avatar">${avatarHtml}</div>
                <div class="user-info">
                    <div class="user-name">${user.displayName}</div>
                    <div class="user-rank">#${index + 1}</div>
                </div>
            `;
            
            grid.appendChild(card);
        });

        console.log('✅ Top 5 usuários carregados');
    } catch (error) {
        console.error('❌ Erro ao carregar top usuários:', error);
    }
}

/**
 * Carregar lista de jogos
 */
async function loadGames() {
    try {
        if (!window.allGamesData || window.allGamesData.length === 0) {
            return;
        }

        const gameSelect = document.getElementById('game-select');
        if (gameSelect) {
            gameSelect.innerHTML = '<option value="">Aleatório</option>';
            
            window.allGamesData.forEach(game => {
                const option = document.createElement('option');
                option.value = game.id;
                option.textContent = game.title;
                gameSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('❌ Erro ao carregar jogos:', error);
    }
}

/**
 * SISTEMA DE ROLETA ALEATÓRIA
 */

/**
 * Iniciar a roleta giratória
 */
window.startRoulette = async () => {
    if (rouletteInProgress) {
        window.showToast('A roleta já está girando!', 'info');
        return;
    }

    console.log('🎲 Iniciando roleta...');
    rouletteInProgress = true;
    
    // Desabilitar botão
    document.getElementById('spin-button').disabled = true;
    document.getElementById('spin-button').innerHTML = '<i class="fas fa-spinner"></i> GIRANDO...';

    try {
        // PASSO 1: Girar e selecionar evento
        console.log('🎲 PASSO 1: Selecionando evento aleatório...');
        await spinRoulette('event-wheel', () => selectRandomEvent());
        await new Promise(r => setTimeout(r, 1000)); // Pausa de 1s

        // PASSO 2: Girar e selecionar quantidade de pessoas
        console.log('👥 PASSO 2: Selecionando quantidade de pessoas...');
        document.getElementById('roulette-people').classList.remove('hidden');
        await spinRoulette('people-wheel', () => selectRandomPeople());
        await new Promise(r => setTimeout(r, 1000)); // Pausa de 1s

        // PASSO 3: Girar e selecionar quantidade
        console.log('💰 PASSO 3: Selecionando quantidade...');
        document.getElementById('roulette-amount').classList.remove('hidden');
        updateAmountWheel();
        await spinRoulette('amount-wheel', () => selectRandomAmount());
        await new Promise(r => setTimeout(r, 500)); // Pausa de 0.5s

        // MOSTRAR RESULTADO
        showResultModal();

    } catch (error) {
        console.error('❌ Erro na roleta:', error);
        window.showToast('Erro ao girar a roleta', 'error');
    } finally {
        rouletteInProgress = false;
        document.getElementById('spin-button').disabled = false;
        document.getElementById('spin-button').innerHTML = '<i class="fas fa-spinner"></i> GIRAR ROLETA';
    }
};

/**
 * Animar roleta girando
 */
function spinRoulette(wheelId, selectFunction) {
    return new Promise(resolve => {
        const wheel = document.getElementById(wheelId);
        const cards = wheel.querySelectorAll('.event-card');
        
        // Remover seleção anterior
        cards.forEach(card => card.classList.remove('selected'));
        
        // Adicionar classe de spinning
        wheel.classList.add('spinning');
        
        // Girar por 600ms
        setTimeout(() => {
            wheel.classList.remove('spinning');
            
            // Executar função de seleção
            selectFunction();
            
            // Resolver promise
            resolve();
        }, 600);
    });
}

/**
 * Selecionar evento aleatório
 */
function selectRandomEvent() {
    const eventKeys = Object.keys(EVENTS);
    const randomKey = eventKeys[Math.floor(Math.random() * eventKeys.length)];
    
    selectedEvent = randomKey;
    const eventInfo = EVENTS[randomKey];
    
    console.log(`✅ Evento selecionado: ${randomKey} - ${eventInfo.name}`);
    
    document.getElementById('selected-event-name').textContent = eventInfo.name;
    
    // Marcar card selecionado
    document.querySelectorAll('#event-wheel .event-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.event === randomKey) {
            card.classList.add('selected');
        }
    });
}

/**
 * Selecionar quantidade de pessoas aleatória
 */
function selectRandomPeople() {
    const modes = ['all', 'specific'];
    const randomMode = modes[Math.floor(Math.random() * modes.length)];
    
    selectedPeople = randomMode;
    const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
    
    if (randomMode === 'all') {
        peopleCount = nonAdminUsers.length;
        document.getElementById('selected-people-name').textContent = 'TODOS os usuários';
        console.log(`✅ Seleção: TODOS - ${peopleCount} usuários`);
    } else {
        // Número aleatório entre 1 e 50% dos usuários
        const maxSpecific = Math.ceil(nonAdminUsers.length / 2);
        peopleCount = Math.floor(Math.random() * (maxSpecific - 1)) + 1;
        document.getElementById('selected-people-name').textContent = `${peopleCount} usuário(s)`;
        console.log(`✅ Seleção: ESPECÍFICO - ${peopleCount} usuários`);
    }
    
    document.getElementById('affected-people-count').textContent = peopleCount;
    
    // Marcar card selecionado
    document.querySelectorAll('#people-wheel .event-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.people === randomMode) {
            card.classList.add('selected');
        }
    });
}

/**
 * Atualizar a roleta 3 baseado no tipo de evento
 */
function updateAmountWheel() {
    const wheel = document.getElementById('amount-wheel');
    wheel.innerHTML = '';

    if (selectedEvent === 'money_win' || selectedEvent === 'money_lose') {
        const amounts = [100, 250, 500, 1000, 2000, 5000];
        amounts.forEach(amount => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.textContent = `R$ ${amount.toLocaleString('pt-BR')}`;
            card.dataset.amount = amount;
            wheel.appendChild(card);
        });

    } else if (selectedEvent === 'game_win' || selectedEvent === 'game_lose') {
        const quantities = [1, 2, 3, 5, 10];
        quantities.forEach(qty => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `<i class="fas fa-gamepad" style="margin-right: 5px;"></i> ${qty} Jogo${qty > 1 ? 's' : ''}`;
            card.dataset.amount = qty;
            wheel.appendChild(card);
        });

    } else if (selectedEvent === 'upgrade_random') {
        const upgrades = [1, 2, 3];
        upgrades.forEach(upgrade => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `<i class="fas fa-star" style="margin-right: 5px;"></i> ${upgrade} Upgrade${upgrade > 1 ? 's' : ''}`;
            card.dataset.amount = upgrade;
            wheel.appendChild(card);
        });
    }
}

/**
 * Selecionar quantidade aleatória
 */
function selectRandomAmount() {
    const cards = document.querySelectorAll('#amount-wheel .event-card');
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    
    selectedAmount = parseInt(randomCard.dataset.amount);
    
    console.log(`✅ Quantidade selecionada: ${selectedAmount}`);
    
    document.getElementById('selected-amount-name').textContent = randomCard.textContent;
    
    // Marcar card selecionado
    cards.forEach(card => card.classList.remove('selected'));
    randomCard.classList.add('selected');
}

/**
 * Mostrar modal de resultado
 */
function showResultModal() {
    const eventInfo = EVENTS[selectedEvent];
    const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
    let targetUsers = nonAdminUsers;
    
    if (selectedPeople === 'specific') {
        targetUsers = shuffleArray(nonAdminUsers).slice(0, peopleCount);
    }
    
    // 🔴 IMPORTANTE: Armazenar EXATAMENTE esses usuários para usar depois
    affectedUsers = targetUsers;

    // Determinar tipo de quantidade
    let quantityText = '';
    if (selectedEvent === 'money_win' || selectedEvent === 'money_lose') {
        quantityText = `R$ ${selectedAmount.toLocaleString('pt-BR')}`;
    } else if (selectedEvent === 'game_win' || selectedEvent === 'game_lose') {
        quantityText = `${selectedAmount} Jogo${selectedAmount > 1 ? 's' : ''}`;
    } else if (selectedEvent === 'upgrade_random') {
        quantityText = `${selectedAmount} Upgrade${selectedAmount > 1 ? 's' : ''}`;
    }

    // Preencher modal
    document.getElementById('result-icon').textContent = 
        selectedEvent === 'money_win' || selectedEvent === 'game_win' ? '✅' : '⚠️';
    
    document.getElementById('result-title').textContent = eventInfo.name;
    document.getElementById('result-event-type').textContent = eventInfo.name;
    document.getElementById('result-action').textContent = eventInfo.action;
    document.getElementById('result-quantity').textContent = quantityText;
    document.getElementById('result-affected-users').textContent = `${targetUsers.length} usuário${targetUsers.length > 1 ? 's' : ''}`;
    
    // Gerar lista de usuários afetados (com clique para abrir perfil)
    const userListHTML = targetUsers.length > 0 
        ? targetUsers.map(u => `<li onclick="window.openUserProfile('${u.uid}')">👤 ${u.displayName}</li>`).join('')
        : '<li style="opacity: 0.6;">Nenhum usuário</li>';
    
    const userListElement = document.getElementById('result-affected-list');
    if (userListElement) {
        userListElement.innerHTML = userListHTML;
    }

    // Mostrar modal
    document.getElementById('result-modal').classList.add('active');

    console.log('🎊 Modal de resultado exibido');
}

/**
 * Abrir perfil do usuário em nova aba
 */
window.openUserProfile = (uid) => {
    if (!uid) return;
    window.open(`../html/perfil.html?uid=${uid}`, '_blank');
    console.log(`🔗 Abrindo perfil do usuário: ${uid}`);
};

/**
 * Fechar modal de resultado
 */
window.closeResultModal = () => {
    document.getElementById('result-modal').classList.remove('active');
    
    // Resetar roletas
    selectedEvent = null;
    selectedPeople = null;
    selectedAmount = null;
    affectedUsers = [];
    
    document.getElementById('roulette-people').classList.add('hidden');
    document.getElementById('roulette-amount').classList.add('hidden');
    
    document.querySelectorAll('.event-card').forEach(card => card.classList.remove('selected'));
    
    // Limpar displays
    document.getElementById('selected-event-name').textContent = '-';
    document.getElementById('selected-people-name').textContent = '-';
    document.getElementById('affected-people-count').textContent = '-';
    document.getElementById('selected-amount-name').textContent = '-';

    console.log('🔄 Roleta resetada para novo giro');
};

/**
 * Confirmar e aplicar evento
 */
window.confirmAndApplyEvent = async () => {
    if (!selectedEvent || !selectedPeople || selectedAmount === null) {
        window.showToast('Erro: dados de evento incompletos', 'error');
        return;
    }

    // Fechar modal
    document.getElementById('result-modal').classList.remove('active');

    // Aplicar evento
    await applyEvent();
};

/**
 * Embaralhar array (Fisher-Yates shuffle)
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Aplicar evento aos usuários
 */
async function applyEvent() {
    if (!selectedEvent || !selectedPeople || selectedAmount === null) {
        window.showToast('Selecione evento, pessoas e quantidade!', 'warning');
        return;
    }

    if (eventInProgress) {
        window.showToast('Um evento já está sendo processado...', 'info');
        return;
    }

    eventInProgress = true;

    try {
        const eventInfo = EVENTS[selectedEvent];
        
        // 🔴 USAR os usuários que foram mostrados no modal (armazenados em affectedUsers)
        const targetUsers = affectedUsers;

        console.log(`🎲 Aplicando evento: ${selectedEvent}`);
        console.log(`👥 Usuários alvo: ${targetUsers.length}`);
        console.log(`💰 Quantidade: ${selectedAmount}`);

        window.showToast(`🎲 Aplicando evento a ${targetUsers.length} usuário(s)...`, 'info');

        let processedCount = 0;
        let errorCount = 0;

        // Aplicar evento a cada usuário
        for (const user of targetUsers) {
            try {
                const userRef = window.db.collection('users').doc(user.uid);

                switch (selectedEvent) {
                    case 'money_win':
                        const moneyWin = selectedAmount || 100;
                        console.log(`   💵 ${user.displayName}: +R$ ${moneyWin}`);
                        
                        const userDocWin = await userRef.get();
                        const currentBalanceWin = userDocWin.data()?.balance || 0;
                        
                        await userRef.set({
                            balance: currentBalanceWin + moneyWin
                        }, { merge: true });
                        break;

                    case 'money_lose':
                        const moneyLose = selectedAmount || 100;
                        console.log(`   💸 ${user.displayName}: -R$ ${moneyLose}`);
                        
                        const userDocLose = await userRef.get();
                        const currentBalanceLose = userDocLose.data()?.balance || 0;
                        
                        await userRef.set({
                            balance: Math.max(0, currentBalanceLose - moneyLose)
                        }, { merge: true });
                        break;

                    case 'game_win':
                        if (window.allGamesData && window.allGamesData.length > 0) {
                            const gamesToAdd = [];
                            const qtyGames = selectedAmount || 1;
                            for (let i = 0; i < qtyGames; i++) {
                                const randomGame = window.allGamesData[Math.floor(Math.random() * window.allGamesData.length)];
                                gamesToAdd.push(randomGame.id);
                            }
                            
                            console.log(`   🎮 ${user.displayName}: +${gamesToAdd.length} jogo(s)`);
                            
                            for (const gameId of gamesToAdd) {
                                await userRef.update({
                                    library: firebase.firestore.FieldValue.arrayUnion(gameId)
                                });
                            }
                        }
                        break;

                    case 'game_lose':
                        const userDoc = await userRef.get();
                        const library = userDoc.data().library || [];
                        
                        if (library.length > 0) {
                            const qtyToRemove = Math.min(selectedAmount || 1, library.length);
                            let newLibrary = [...library];
                            for (let i = 0; i < qtyToRemove; i++) {
                                const randomIndex = Math.floor(Math.random() * newLibrary.length);
                                newLibrary.splice(randomIndex, 1);
                            }
                            
                            console.log(`   🗑️ ${user.displayName}: -${qtyToRemove} jogo(s)`);
                            
                            await userRef.update({ library: newLibrary });
                        }
                        break;

                    case 'upgrade_random':
                        const userDoc2 = await userRef.get();
                        const userLibrary = userDoc2.data().library || [];
                        
                        if (userLibrary.length > 0) {
                            const qtyUpgrades = selectedAmount || 1;
                            let upgradedCount = 0;
                            
                            for (let i = 0; i < qtyUpgrades; i++) {
                                const randomGameId = userLibrary[Math.floor(Math.random() * userLibrary.length)];
                                const currentLevel = (userDoc2.data().upgrades || {})[randomGameId] || 0;
                                
                                if (currentLevel < 3) {
                                    const upgradesObj = userDoc2.data().upgrades || {};
                                    upgradesObj[randomGameId] = currentLevel + 1;
                                    await userRef.update({ upgrades: upgradesObj });
                                    upgradedCount++;
                                }
                            }
                            
                            console.log(`   ⭐ ${user.displayName}: +${upgradedCount} upgrade(s)`);
                        }
                        break;
                }

                processedCount++;
            } catch (error) {
                errorCount++;
                console.error(`❌ Erro ao processar usuário ${user.displayName}:`, error);
            }
        }

        // Atualizar status
        const timeStr = new Date().toLocaleTimeString('pt-BR');
        // Status removido da página

        if (errorCount === 0) {
            window.showToast(`✅ Evento aplicado a ${processedCount} usuário(s)!`, 'success');
            console.log(`✅ Evento "${selectedEvent}" aplicado com sucesso`);
        } else {
            window.showToast(`⚠️ Evento parcial: ${processedCount} OK, ${errorCount} erro(s)`, 'warning');
            console.log(`⚠️ Evento com erros: ${processedCount} OK, ${errorCount} falhas`);
        }

        // Resetar para próximo giro
        await new Promise(r => setTimeout(r, 1500));
        closeResultModal();

    } catch (error) {
        console.error('❌ Erro ao aplicar evento:', error);
        window.showToast('Erro ao aplicar evento: ' + error.message, 'error');
    } finally {
        eventInProgress = false;
    }
}

/**
 * Iniciar apresentação - Reset de carteira de todos usuários
 */
window.initializePresentation = async () => {
    await window.resetAllWallets();
};

/**
 * Reset de carteira - Todos usuários (menos admins) para R$ 5.000
 */
window.resetAllWallets = async () => {
    const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
    const confirmed = confirm(
        `⚠️ Isso vai resetar a carteira de ${nonAdminUsers.length} usuários para R$ 5.000\n\nDeseja continuar?`
    );

    if (!confirmed) return;

    if (eventInProgress) {
        window.showToast('Um evento já está sendo processado...', 'info');
        return;
    }

    eventInProgress = true;

    try {
        window.showToast(`💰 Resetando carteiras de ${nonAdminUsers.length} usuários...`, 'info');

        let processedCount = 0;
        let errorCount = 0;

        for (const user of nonAdminUsers) {
            try {
                console.log(`📝 Atualizando ${user.displayName} (${user.uid})...`);
                
                const userRef = window.db.collection('users').doc(user.uid);
                
                await userRef.set({
                    balance: 5000
                }, { merge: true });
                
                console.log(`✅ ${user.displayName} atualizado com sucesso para R$ 5.000`);
                processedCount++;
            } catch (error) {
                errorCount++;
                console.error(`❌ Erro ao resetar ${user.displayName}:`, error.message, error);
            }
        }

        if (errorCount === 0) {
            window.showToast(`✅ Carteiras resetadas! ${processedCount} usuários com R$ 5.000`, 'success');
            console.log(`✅ Reset de carteira concluído`);
        } else {
            window.showToast(`⚠️ Reset parcial: ${processedCount} OK, ${errorCount} erro(s)`, 'warning');
            console.log(`⚠️ Reset com erros: ${processedCount} OK, ${errorCount} falhas`);
        }

    } catch (error) {
        console.error('❌ Erro ao resetar carteiras:', error.message, error);
        window.showToast('Erro ao resetar carteiras: ' + error.message, 'error');
    } finally {
        eventInProgress = false;
    }
};
