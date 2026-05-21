/**
 * Lógica para o Ranking Global de Usuários (Saldos)
 */

async function initRanking() {
    const elements = {
        list: document.getElementById('ranking-list-body')
    };

    if (!elements.list) return;

    // Aguarda o Banco de Dados estar pronto
    if (!window.db) return setTimeout(initRanking, 500);

    if (window.showToast) console.log("Sincronizando ranking em tempo real...");

    // Escuta mudanças em tempo real na coleção de usuários, ordenando pelo saldo (Decrescente)
    window.db.collection('users')
        .orderBy('balance', 'desc')
        .limit(50) // Mostra o Top 50 usuários mais ricos
        .onSnapshot(snapshot => {
            if (snapshot.empty) {
                elements.list.innerHTML = "<tr><td colspan='3' style='text-align:center'>Nenhum usuário encontrado.</td></tr>";
                return;
            }

            elements.list.innerHTML = snapshot.docs.map((doc, index) => {
                const user = doc.data();
                const pos = index + 1;
                const name = window.utils.getUserFriendlyName({ ...user, id: doc.id });
                
                // Fallback de avatar consistente com o perfil
                const avatar = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=27ae60&color=fff`;
                const balance = parseFloat(user.balance) || 0;

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
        }, error => {
            console.error("Erro ao carregar ranking:", error);
            if (window.showToast) window.showToast("Erro ao atualizar ranking em tempo real.", "error");
        });
}

document.addEventListener('DOMContentLoaded', initRanking);