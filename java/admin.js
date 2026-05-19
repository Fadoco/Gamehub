/**
 * Lógica do Painel Administrativo do GameHub.
 */

document.addEventListener('DOMContentLoaded', () => {
    const gameForm = document.getElementById('admin-game-form');
    const gameList = document.getElementById('admin-game-list');
    const cancelBtn = document.getElementById('btn-cancel-edit');
    const formTitle = document.getElementById('form-title');

    // 1. Carregar e Renderizar Jogos
    async function loadAdminGames() {
        const snapshot = await db.collection('games').orderBy('id', 'asc').get();
        gameList.innerHTML = '';
        
        snapshot.forEach(doc => {
            const game = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${game.id}</td>
                <td><strong>${game.title}</strong></td>
                <td>${game.currentPrice}</td>
                <td class="admin-actions">
                    <button class="btn-edit" onclick="editGame('${doc.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteGame('${doc.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            gameList.appendChild(tr);
        });
    }

    // 2. Salvar Jogo (Add ou Update)
    gameForm.onsubmit = async (e) => {
        e.preventDefault();
        const firestoreId = document.getElementById('game-firestore-id').value;

        const gameData = {
            id: parseInt(document.getElementById('game-id').value),
            title: document.getElementById('game-title').value,
            image: document.getElementById('game-image').value,
            tags: document.getElementById('game-tags').value.split(',').map(t => t.trim()),
            platforms: document.getElementById('game-platforms').value.split(',').map(p => p.trim()),
            currentPrice: document.getElementById('game-current-price').value,
            discount: parseInt(document.getElementById('game-discount').value) || 0,
            oldPrice: document.getElementById('game-old-price').value || null,
            featured: document.getElementById('game-featured').checked
        };

        try {
            if (firestoreId) {
                await db.collection('games').doc(firestoreId).update(gameData);
                alert("Jogo atualizado com sucesso!");
            } else {
                await db.collection('games').doc(String(gameData.id)).set(gameData);
                alert("Jogo adicionado com sucesso!");
            }
            resetForm();
            loadAdminGames();
        } catch (error) {
            alert("Erro ao salvar: " + error.message);
        }
    };

    // 3. Editar Jogo (Preencher formulário)
    window.editGame = async (id) => {
        const doc = await db.collection('games').doc(id).get();
        const game = doc.data();

        document.getElementById('game-firestore-id').value = id;
        document.getElementById('game-id').value = game.id;
        document.getElementById('game-title').value = game.title;
        document.getElementById('game-image').value = game.image;
        document.getElementById('game-tags').value = game.tags.join(', ');
        document.getElementById('game-platforms').value = game.platforms.join(', ');
        document.getElementById('game-current-price').value = game.currentPrice;
        document.getElementById('game-discount').value = game.discount;
        document.getElementById('game-old-price').value = game.oldPrice || '';
        document.getElementById('game-featured').checked = game.featured;

        formTitle.textContent = "Editando: " + game.title;
        cancelBtn.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 4. Excluir Jogo
    window.deleteGame = async (id) => {
        if (confirm("Tem certeza que deseja excluir este jogo?")) {
            await db.collection('games').doc(id).delete();
            loadAdminGames();
        }
    };

    function resetForm() {
        gameForm.reset();
        document.getElementById('game-firestore-id').value = '';
        formTitle.textContent = "Adicionar Novo Jogo";
        cancelBtn.style.display = 'none';
    }

    cancelBtn.onclick = resetForm;
    loadAdminGames();

    // --- Gerenciamento de Saldo do Usuário ---
    const addBalanceForm = document.getElementById('add-balance-form');

    if (addBalanceForm) {
        addBalanceForm.onsubmit = async (e) => {
            e.preventDefault();
            const userId = document.getElementById('user-id-balance').value.trim();
            const amount = parseFloat(document.getElementById('amount-to-add').value);

            if (!userId) {
                alert("Por favor, insira o ID do usuário (UID).");
                return;
            }
            if (isNaN(amount) || amount <= 0) {
                alert("Por favor, insira um valor válido e positivo para adicionar.");
                return;
            }

            try {
                const userRef = db.collection('users').doc(userId);
                const doc = await userRef.get();

                if (!doc.exists) {
                    alert("Usuário não encontrado com o ID fornecido.");
                    return;
                }

                const currentBalance = doc.data().balance || 0; // Pega o saldo atual, ou 0 se não existir
                const newBalance = currentBalance + amount;

                await userRef.update({ balance: newBalance });
                alert(`R$ ${amount.toFixed(2)} adicionados ao saldo do usuário ${userId}. Novo saldo: R$ ${newBalance.toFixed(2)}`);
                addBalanceForm.reset();
            } catch (error) {
                console.error("Erro ao adicionar saldo:", error);
                alert("Erro ao adicionar saldo: " + error.message);
            }
        };
    }
});