/**
 * ======================================
 * SETUP DO TOKEN DO GITHUB (FIRESTORE)
 * ======================================
 * 
 * Execute este arquivo no console do navegador (F12)
 * para configurar seu token do GitHub
 * 
 * O token será salvo no Firestore e acessível
 * de qualquer dispositivo/navegador
 */

// Função para configurar o token no Firestore
async function setupGitHubToken() {
    // Verificar se Firestore está disponível
    if (!window.db) {
        alert('❌ Firestore não está inicializado!');
        return;
    }

    // Verificar se usuário está autenticado (admin/proprietário)
    if (!window.auth.currentUser) {
        alert('❌ Você precisa estar logado!');
        return;
    }

    const token = prompt('Cole seu token do GitHub (github_pat_...):');
    
    if (!token) {
        alert('❌ Token não foi preenchido!');
        return;
    }
    
    if (!token.startsWith('github_pat_') && !token.startsWith('ghp_')) {
        alert('⚠️ Token parece inválido. Deve começar com "github_pat_" ou "ghp_"');
        return;
    }
    
    try {
        // Salvar no Firestore
        await window.db.collection('site-config').doc('github-token').set({
            token: token,
            updatedAt: new Date(),
            updatedBy: window.auth.currentUser.uid,
            email: window.auth.currentUser.email
        }, { merge: true });
        
        // Atualizar na memória
        GitHubConfig.setToken(token);
        
        alert('✅ Token configurado com sucesso!\n\nAgora qualquer usuário pode fazer upload em qualquer dispositivo.');
        console.log('✓ Token salvo no Firestore');
        
    } catch (error) {
        console.error('Erro ao salvar token:', error);
        alert('❌ Erro ao salvar token: ' + error.message);
    }
}

// Função para carregar o token ao iniciar
async function initGitHubToken() {
    try {
        const success = await loadGitHubTokenFromFirestore();
        if (success) {
            console.log('✓ Sistema de upload pronto!');
        } else {
            console.warn('⚠️ Token do GitHub não está configurado');
            console.log('Proprietário: Execute setupGitHubToken() no console');
        }
    } catch (error) {
        console.error('Erro ao iniciar token:', error);
    }
}

// Auto-executar quando Firestore estiver pronto
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Aguardar um pouco para Firestore inicializar
        setTimeout(() => {
            initGitHubToken();
        }, 1000);
    });
}
