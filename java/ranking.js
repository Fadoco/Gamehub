/**
 * Lógica para o Ranking Global de Usuários (Saldos)
 */

async function initRanking() {
    const listContainer = document.getElementById('ranking-list-body');
    if (!listContainer) return;

    // Aguarda o Banco de Dados estar pronto
    if (!window.db) return setTimeout(initRanking, 500);

    // Escuta mudanças em tempo real na coleção de usuários, ordenando pelo saldo (Decrescente)
    // Nota: O Firebase pode solicitar a criação de um índice no console na primeira execução.
    window.db.collection('users')
        .orderBy('balance', 'desc')
        .limit(50) // Mostra o Top 50 usuários mais ricos
        .onSnapshot((snapshot) => {
            if (snapshot.empty) {
                listContainer.innerHTML = "<tr><td colspan='3' style='text-align:center'>Nenhum usuário encontrado.</td></tr>";
                return;
            }

            listContainer.innerHTML = snapshot.docs.map((doc, index) => {
                const user = doc.data();
                const pos = index + 1;
                const name = window.utils.getUserFriendlyName({ ...user, id: doc.id });
                const avatar = user.avatar || `https://ui-avatars.com/api/?name=${name}&background=27ae60&color=fff`;
                const balance = user.balance || 0;

                return `
                    <tr class="rank-row">
                        <td class="rank-pos rank-${pos <= 3 ? pos : 'other'}">#${pos}</td>
                        <td onclick="window.location.href='perfil.html?uid=${doc.id}'" style="cursor: pointer;">
                            <div class="rank-user">
                                <img src="${avatar}" class="rank-avatar" alt="Avatar">
                                <span>${name}</span>
                            </div>
                        </td>
                        <td class="rank-val">R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                `;
            }).join('');
        });
}

document.addEventListener('DOMContentLoaded', initRanking);