/**
 * Lógica para o Ranking Global de Usuários (Saldos)
 */

function initRanking() {
    const listContainer = document.getElementById('ranking-list-body');
    if (!listContainer) return;

    // Estado de carregamento
    listContainer.innerHTML = "<tr><td colspan='3' style='text-align:center; padding: 20px;'>Buscando milionários...</td></tr>";

    // Pequena função para rodar a busca quando o banco estiver pronto
    const startListener = () => {
        if (!window.db) {
            setTimeout(startListener, 500);
            return;
        }

        // Escuta mudanças em tempo real na coleção de usuários, ordenando pelo saldo (Decrescente)
        window.db.collection('users')
            .orderBy('balance', 'desc')
            .limit(50) 
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
                    const profilePath = window.utils.getHtmlPath(`perfil.html?uid=${doc.id}`);

                    return `
                        <tr class="rank-row">
                            <td class="rank-pos rank-${pos <= 3 ? pos : 'other'}">#${pos}</td>
                            <td>
                                <div class="rank-user" onclick="window.location.href='${profilePath}'" style="cursor: pointer;">
                                    <img src="${avatar}" class="rank-avatar" alt="Avatar">
                                    <span>${name}</span>
                                </div>
                            </td>
                            <td class="rank-val">R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    `;
                }).join('');
            }, (error) => {
                console.error("Erro no Ranking:", error);
                listContainer.innerHTML = `<tr><td colspan='3' style='text-align:center; color: var(--danger)'>Erro ao carregar ranking. Verifique as Regras do Firestore ou Índices.</td></tr>`;
            });
    };

    startListener();
}

document.addEventListener('DOMContentLoaded', initRanking);