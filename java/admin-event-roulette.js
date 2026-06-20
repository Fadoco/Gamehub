/**
 * Painel de Roleta de Eventos - Admin
 * Sistema para apresentações ao vivo
 */

let selectedEvent = null;
let allUsers = [];
let applyMode = 'all';
let eventInProgress = false;

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
    await loadGames();
    updateAffectedUsers();

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
                isAdmin: doc.data().email === 'fadoco12311@gmail.com' || doc.data().email === 'gabrielmomo6759@gmail.com'
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
 * Carregar lista de jogos
 */
async function loadGames() {
    try {
        if (!window.allGamesData || window.allGamesData.length === 0) {
            return;
        }

        const gameSelect = document.getElementById('game-select');
        gameSelect.innerHTML = '<option value="">Aleatório</option>';
        
        window.allGamesData.forEach(game => {
            const option = document.createElement('option');
            option.value = game.id;
            option.textContent = game.title;
            gameSelect.appendChild(option);
        });
    } catch (error) {
        console.error('❌ Erro ao carregar jogos:', error);
    }
}

/**
 * Selecionar evento
 */
window.selectEvent = (eventKey) => {
    selectedEvent = eventKey;
    
    // Atualizar visual
    document.querySelectorAll('.event-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.event === eventKey);
    });

    // Atualizar nome do evento
    const eventInfo = EVENTS[eventKey];
    document.getElementById('selected-event-name').textContent = eventInfo.name;

    // Mostrar/esconder campo de jogo conforme necessário
    const gameSelect = document.getElementById('game-select');
    if (eventKey === 'game_win') {
        gameSelect.style.display = 'block';
        gameSelect.previousElementSibling.style.display = 'block';
    } else {
        gameSelect.style.display = 'none';
        gameSelect.previousElementSibling.style.display = 'none';
    }

    console.log(`✅ Evento selecionado: ${eventKey}`);
};

/**
 * Atualizar modo de aplicação
 */
window.updateApplyMode = () => {
    applyMode = document.getElementById('apply-mode').value;
    const countLabel = document.getElementById('specific-count-label');
    const countInput = document.getElementById('specific-count');

    if (applyMode === 'specific') {
        countLabel.style.display = 'block';
        countInput.style.display = 'block';
    } else {
        countLabel.style.display = 'none';
        countInput.style.display = 'none';
    }

    document.getElementById('apply-mode-name').textContent = 
        applyMode === 'all' ? 'Todos' : `Específico (${document.getElementById('specific-count').value})`;

    updateAffectedUsers();
};

/**
 * Atualizar número de usuários afetados
 */
window.updateAffectedUsers = () => {
    const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
    let affectedCount = nonAdminUsers.length;

    if (applyMode === 'specific') {
        affectedCount = Math.min(parseInt(document.getElementById('specific-count').value) || 1, nonAdminUsers.length);
        document.getElementById('apply-mode-name').textContent = `Específico (${affectedCount})`;
    } else {
        document.getElementById('apply-mode-name').textContent = 'Todos';
    }

    document.getElementById('affected-users').textContent = affectedCount;
};

/**
 * Aplicar evento aos usuários
 */
window.applyEvent = async () => {
    if (!selectedEvent) {
        window.showToast('Selecione um evento primeiro!', 'warning');
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
        if (applyMode === 'specific') {
            const count = parseInt(document.getElementById('specific-count').value);
            targetUsers = nonAdminUsers.slice(0, count);
        }

        window.showToast(`🎲 Aplicando evento a ${targetUsers.length} usuário(s)...`, 'info');

        let processedCount = 0;

        // Aplicar evento a cada usuário
        for (const user of targetUsers) {
            try {
                const userRef = window.db.collection('users').doc(user.uid);

                switch (selectedEvent) {
                    case 'money_win':
                        const moneyWin = parseInt(document.getElementById('money-amount').value) || 100;
                        await userRef.update({
                            balance: firebase.firestore.FieldValue.increment(moneyWin)
                        });
                        break;

                    case 'money_lose':
                        const moneyLose = parseInt(document.getElementById('money-amount').value) || 100;
                        await userRef.update({
                            balance: firebase.firestore.FieldValue.increment(-moneyLose)
                        });
                        break;

                    case 'game_win':
                        const gameId = parseInt(document.getElementById('game-select').value);
                        if (gameId) {
                            await userRef.update({
                                library: firebase.firestore.FieldValue.arrayUnion(gameId)
                            });
                        }
                        break;

                    case 'game_lose':
                        const gameIdToRemove = parseInt(document.getElementById('game-select').value);
                        if (gameIdToRemove) {
                            const userDoc = await userRef.get();
                            const library = userDoc.data().library || [];
                            const newLibrary = library.filter(id => id !== gameIdToRemove);
                            await userRef.update({ library: newLibrary });
                        }
                        break;

                    case 'upgrade_random':
                        const userDoc = await userRef.get();
                        const userLibrary = userDoc.data().library || [];
                        
                        if (userLibrary.length > 0) {
                            const randomGameId = userLibrary[Math.floor(Math.random() * userLibrary.length)];
                            const currentLevel = (userDoc.data().upgrades || {})[randomGameId] || 0;
                            
                            if (currentLevel < 3) {
                                const upgradesObj = userDoc.data().upgrades || {};
                                upgradesObj[randomGameId] = currentLevel + 1;
                                await userRef.update({ upgrades: upgradesObj });
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
