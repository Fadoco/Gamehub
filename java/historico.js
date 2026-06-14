/**
 * Lógica para exibir o histórico de compras.
 */
function renderHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;

    if (!window.userHistory || window.userHistory.length === 0) {
        list.innerHTML = "<p>Você ainda não realizou nenhuma compra.</p>";
        return;
    }

    list.innerHTML = window.userHistory.map(order => `
        <div class="history-card">
            <div class="history-header">
                <span><strong>Data:</strong> ${new Date(order.date).toLocaleDateString('pt-BR')}</span>
                <span class="history-total">R$ ${order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="history-items">
                <strong>Itens:</strong> ${order.items.join(', ')}
            </div>
        </div>
    `).join('');
}