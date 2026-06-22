/**
 * Painel de Roleta de Eventos - Admin
 * Sistema para apresentações ao vivo com 3 roletas sequenciais
 */

let selectedEvent = null;
let selectedPeople = null;
let selectedAmount = null;
let allUsers = [];
let applyMode = 'all';
let eventInProgress = false;
let peopleCount = 0;

// Mapeamento de eventos
const EVENTS = {
    money_win: {
        name: '💰 Ganhar Dinheiro',
        icon: 'fas fa-coins',
        color: '#f39c12'
    },
    money_lose: {
        name: '📉 Perder Dinheiro',
        icon: 'fas fa-money-bill-wave',
        color: '#e74c3c'
    },
    game_win: {
        name: '🎁 Ganhar Jogo',
        icon: 'fas fa-gift',
        color: '#2ecc71'
    },
    game_lose: {
        name: '🗑️ Perder Jogo',
        icon: 'fas fa-trash',
        color: '#9b59b6'
    },
    upgrade_random: {
        name: '⭐ Jogo Aleatório Melhorado',
        icon: 'fas fa-star',
        color: '#3498db'
    }
};

// Inicializa o painel
window.addEventListener('DOMContentLoaded', async () => {
    // Aguarda Firebase inicializar
    let retries = 0;
    while (!window.db || !window.auth.currentUser) {
        if (retries++ > 30) {
            window.showToast('Erro ao carregar dados. Faça login novamente.', 'error');
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
    await loadTopUsers();
    await loadGames();

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
                avatar: doc.data().avatar || null,
                gamesBought: doc.data().library ? doc.data().library.length : 0
            });
        });

        // Filtrar apenas usuários não-admin
        const nonAdminUsers = allUsers.filter(u => !u.isAdmin);

        document.getElementById('total-users').textContent = allUsers.length;
        document.getElementById('non-admin-users').textContent = nonAdminUsers.length;

        console.log(`✅ ${nonAdminUsers.length} usuários carregados`);
    } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        window.showToast('Erro ao carregar usuários', 'error');
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
 * Inicializar apresentação (reset de carteiras)
 */
window.initializePresentation = async () => {
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
        window.showToast(`💰 Inicializando apresentação (${nonAdminUsers.length} usuários)...`, 'info');

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

        // Atualizar status
        const timeStr = new Date().toLocaleTimeString('pt-BR');
        document.getElementById('last-event-status').textContent = 
            `💰 Apresentação Inicializada | ${processedCount} usuários | ${timeStr}`;

        window.showToast(`✅ Apresentação inicializada! ${processedCount} usuários com R$ 5.000`, 'success');
        console.log(`✅ Apresentação inicializada`);

    } catch (error) {
        console.error('❌ Erro ao inicializar apresentação:', error);
        window.showToast('Erro ao inicializar apresentação', 'error');
    } finally {
        eventInProgress = false;
    }
};

/**
 * ROLETA 1: Selecionar evento
 */
window.selectEvent = (eventKey) => {
    selectedEvent = eventKey;
    selectedPeople = null;
    selectedAmount = null;
    
    // Resetar seleções das próximas roletas
    document.querySelectorAll('#people-wheel .event-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelectorAll('#amount-wheel .event-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Atualizar visual da roleta 1
    document.querySelectorAll('.event-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.event === eventKey);
    });

    // Atualizar nome do evento
    const eventInfo = EVENTS[eventKey];
    document.getElementById('selected-event-name').textContent = eventInfo.name;

    // Mostrar roleta 2 (pessoas)
    document.getElementById('roulette-people').classList.remove('hidden');
    document.getElementById('roulette-amount').classList.add('hidden');
    
    // Resetar seleção de pessoas
    document.getElementById('selected-people-name').textContent = '-';
    document.getElementById('affected-people-count').textContent = '-';
    document.getElementById('specific-people-input').style.display = 'none';

    console.log(`✅ Evento selecionado: ${eventKey}`);
};

/**
 * ROLETA 2: Selecionar quantidade de pessoas
 */
window.selectPeople = (peopleMode) => {
    selectedPeople = peopleMode;
    selectedAmount = null;
    
    // Atualizar visual
    document.querySelectorAll('#people-wheel .event-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.people === peopleMode);
    });

    // Resetar quantidade
    document.getElementById('selected-amount-name').textContent = '-';

    if (peopleMode === 'all') {
        const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
        peopleCount = nonAdminUsers.length;
        document.getElementById('selected-people-name').textContent = 'TODOS os usuários';
        document.getElementById('affected-people-count').textContent = peopleCount;
        document.getElementById('specific-people-input').style.display = 'none';
    } else {
        const count = parseInt(document.getElementById('people-count').value) || 10;
        peopleCount = Math.min(count, allUsers.filter(u => !u.isAdmin).length);
        document.getElementById('selected-people-name').textContent = `${peopleCount} usuário(s)`;
        document.getElementById('affected-people-count').textContent = peopleCount;
        document.getElementById('specific-people-input').style.display = 'block';
    }

    // Mostrar roleta 3 (quantidade)
    document.getElementById('roulette-amount').classList.remove('hidden');
    updateAmountWheel();

    console.log(`✅ Seleção de pessoas: ${peopleMode}`);
};

/**
 * Atualizar contagem de pessoas (input)
 */
window.updatePeopleCount = () => {
    if (selectedPeople === 'specific') {
        const count = parseInt(document.getElementById('people-count').value) || 10;
        const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
        peopleCount = Math.min(count, nonAdminUsers.length);
        document.getElementById('selected-people-name').textContent = `${peopleCount} usuário(s)`;
        document.getElementById('affected-people-count').textContent = peopleCount;
    }
};

/**
 * Atualizar a roleta 3 baseado no tipo de evento
 */
function updateAmountWheel() {
    const wheel = document.getElementById('amount-wheel');
    wheel.innerHTML = '';

    const amountLabel = document.getElementById('amount-label');
    const amountValue = document.getElementById('amount-value');

    if (selectedEvent === 'money_win' || selectedEvent === 'money_lose') {
        amountLabel.textContent = 'Valor de Dinheiro (R$):';
        amountValue.min = 10;
        amountValue.step = 5;
        amountValue.value = 100;
        document.getElementById('amount-input').style.display = 'block';

        // Criar cards para quantidade de dinheiro (pré-definidas)
        const amounts = [100, 250, 500, 1000, 2000, 5000];
        amounts.forEach(amount => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.textContent = `R$ ${amount.toLocaleString('pt-BR')}`;
            card.onclick = () => selectAmount(amount, `R$ ${amount.toLocaleString('pt-BR')}`);
            wheel.appendChild(card);
        });

    } else if (selectedEvent === 'game_win' || selectedEvent === 'game_lose') {
        amountLabel.textContent = 'Quantidade de Jogos:';
        amountValue.min = 1;
        amountValue.step = 1;
        amountValue.value = 1;
        document.getElementById('amount-input').style.display = 'block';

        // Criar cards para quantidade de jogos
        const quantities = [1, 2, 3, 5, 10];
        quantities.forEach(qty => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `<i class="fas fa-gamepad" style="margin-right: 5px;"></i> ${qty} Jogo${qty > 1 ? 's' : ''}`;
            card.onclick = () => selectAmount(qty, `${qty} Jogo${qty > 1 ? 's' : ''}`);
            wheel.appendChild(card);
        });

    } else if (selectedEvent === 'upgrade_random') {
        amountLabel.textContent = 'Quantidade de Melhorias:';
        amountValue.min = 1;
        amountValue.step = 1;
        amountValue.value = 1;
        document.getElementById('amount-input').style.display = 'block';

        // Criar cards para quantidade de upgrades
        const upgrades = [1, 2, 3];
        upgrades.forEach(upgrade => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `<i class="fas fa-star" style="margin-right: 5px;"></i> ${upgrade} Upgrade${upgrade > 1 ? 's' : ''}`;
            card.onclick = () => selectAmount(upgrade, `${upgrade} Upgrade${upgrade > 1 ? 's' : ''}`);
            wheel.appendChild(card);
        });
    }
}

/**
 * ROLETA 3: Selecionar quantidade
 */
window.selectAmount = (amount, displayName) => {
    selectedAmount = amount;
    document.getElementById('selected-amount-name').textContent = displayName;
    
    // Atualizar input
    document.getElementById('amount-value').value = amount;

    // Atualizar visual dos cards - selecionar apenas o clicado
    document.querySelectorAll('#amount-wheel .event-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Encontrar e selecionar o card correto
    document.querySelectorAll('#amount-wheel .event-card').forEach(card => {
        if (card.textContent.trim() === displayName.trim() || 
            card.innerText.includes(displayName)) {
            card.classList.add('selected');
        }
    });

    console.log(`✅ Quantidade selecionada: ${displayName}`);
};

/**
 * Aplicar evento aos usuários
 */
window.applyEvent = async () => {
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
        const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
        
        let targetUsers = nonAdminUsers;
        if (selectedPeople === 'specific') {
            targetUsers = nonAdminUsers.slice(0, peopleCount);
        }

        window.showToast(`🎲 Aplicando evento a ${targetUsers.length} usuário(s)...`, 'info');

        let processedCount = 0;

        // Aplicar evento a cada usuário
        for (const user of targetUsers) {
            try {
                const userRef = window.db.collection('users').doc(user.uid);

                switch (selectedEvent) {
                    case 'money_win':
                        const moneyWin = selectedAmount || 100;
                        await userRef.update({
                            balance: firebase.firestore.FieldValue.increment(moneyWin)
                        });
                        break;

                    case 'money_lose':
                        const moneyLose = selectedAmount || 100;
                        await userRef.update({
                            balance: firebase.firestore.FieldValue.increment(-moneyLose)
                        });
                        break;

                    case 'game_win':
                        // Selecionar jogos aleatórios
                        if (window.allGamesData && window.allGamesData.length > 0) {
                            const gamesToAdd = [];
                            const qtyGames = selectedAmount || 1;
                            for (let i = 0; i < qtyGames; i++) {
                                const randomGame = window.allGamesData[Math.floor(Math.random() * window.allGamesData.length)];
                                gamesToAdd.push(randomGame.id);
                            }
                            
                            for (const gameId of gamesToAdd) {
                                await userRef.update({
                                    library: firebase.firestore.FieldValue.arrayUnion(gameId)
                                });
                            }
                        }
                        break;

                    case 'game_lose':
                        // Remover jogos aleatórios
                        const userDoc = await userRef.get();
                        const library = userDoc.data().library || [];
                        
                        if (library.length > 0) {
                            const qtyToRemove = Math.min(selectedAmount || 1, library.length);
                            let newLibrary = [...library];
                            for (let i = 0; i < qtyToRemove; i++) {
                                const randomIndex = Math.floor(Math.random() * newLibrary.length);
                                newLibrary.splice(randomIndex, 1);
                            }
                            await userRef.update({ library: newLibrary });
                        }
                        break;

                    case 'upgrade_random':
                        const userDoc2 = await userRef.get();
                        const userLibrary = userDoc2.data().library || [];
                        
                        if (userLibrary.length > 0) {
                            const qtyUpgrades = selectedAmount || 1;
                            for (let i = 0; i < qtyUpgrades; i++) {
                                const randomGameId = userLibrary[Math.floor(Math.random() * userLibrary.length)];
                                const currentLevel = (userDoc2.data().upgrades || {})[randomGameId] || 0;
                                
                                if (currentLevel < 3) {
                                    const upgradesObj = userDoc2.data().upgrades || {};
                                    upgradesObj[randomGameId] = currentLevel + 1;
                                    await userRef.update({ upgrades: upgradesObj });
                                }
                            }
                        }
                        break;
                }

                processedCount++;
            } catch (error) {
                console.error(`Erro ao processar usuário ${user.displayName}:`, error);
            }
        }

        // Atualizar status
        const timeStr = new Date().toLocaleTimeString('pt-BR');
        document.getElementById('last-event-status').textContent = 
            `${eventInfo.name} | ${processedCount} usuários | ${timeStr}`;

        window.showToast(`✅ Evento aplicado a ${processedCount} usuário(s)!`, 'success');
        console.log(`✅ Evento "${selectedEvent}" aplicado com sucesso`);

    } catch (error) {
        console.error('❌ Erro ao aplicar evento:', error);
        window.showToast('Erro ao aplicar evento', 'error');
    } finally {
        eventInProgress = false;
    }
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

        // Atualizar status
        const timeStr = new Date().toLocaleTimeString('pt-BR');
        document.getElementById('last-event-status').textContent = 
            `💰 Reset R$ 5.000 | ${processedCount} usuários | ${timeStr}`;

        window.showToast(`✅ Carteiras resetadas! ${processedCount} usuários com R$ 5.000`, 'success');
        console.log(`✅ Reset de carteira concluído`);

    } catch (error) {
        console.error('❌ Erro ao resetar carteiras:', error);
        window.showToast('Erro ao resetar carteiras', 'error');
    } finally {
        eventInProgress = false;
    }
};
