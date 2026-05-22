/**
 * Utilitário para migrar games.json para Firestore.
 * Execute 'migrateToFirestore()' no console do navegador.
 */
async function migrateToFirestore() {
    if (!allGamesData || allGamesData.length === 0) return console.error("Dados não carregados");
    
    const batch = db.batch();
    allGamesData.forEach(game => {
        const docRef = db.collection('games').doc(String(game.id));
        batch.set(docRef, game);
    });
    
    await batch.commit();
    console.log("Migração concluída com sucesso!");
}