/**
 * Utilitário para migrar games.json para Firestore.
 * Execute 'migrateToFirestore()' no console do navegador.
 */
async function migrateToFirestore() {
    if (!window.allGamesData || window.allGamesData.length === 0) {
        return console.error("Catálogo de jogos não carregado. Certifique-se de que o fetchGamesData() no global.js já terminou.");
    }

    if (!window.db) {
        return console.error("Firestore não inicializado. Verifique a configuração do Firebase.");
    }
    
    try {
        const batch = window.db.batch();
        window.allGamesData.forEach(game => {
            // Usa o ID numérico como nome do documento para manter a consistência
            const docRef = window.db.collection('games').doc(String(game.id));
            batch.set(docRef, game);
        });
        
        await batch.commit();
        console.log("Migração concluída com sucesso!");
        if (window.showToast) window.showToast("Catálogo migrado com sucesso para o Firestore!", "success");
    } catch (error) {
        console.error("Erro crítico na migração:", error);
        if (window.showToast) window.showToast("Falha na migração dos dados.", "error");
    }
}