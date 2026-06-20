/**
 * ======================================
 * SETUP DO TOKEN DO GITHUB (LOCAL)
 * ======================================
 * 
 * Execute este arquivo no console do navegador (F12)
 * ou cole o código abaixo para configurar seu token
 * 
 * O token será salvo no localStorage (local do seu navegador)
 * e NÃO será enviado para o GitHub
 */

// Função para configurar o token
function setupGitHubToken() {
    const token = prompt('Cole seu token do GitHub (github_pat_...):');
    
    if (!token) {
        alert('❌ Token não foi preenchido!');
        return;
    }
    
    if (!token.startsWith('github_pat_') && !token.startsWith('ghp_')) {
        alert('⚠️ Token parece inválido. Deve começar com "github_pat_" ou "ghp_"');
        return;
    }
    
    // Salvar no localStorage
    localStorage.setItem('github_token', token);
    
    // Atualizar na memória
    GITHUB_TOKEN = token;
    
    alert('✅ Token configurado com sucesso!\n\nVocê pode usar o site normalmente agora.');
    console.log('✓ Token salvo no localStorage');
}

// Verificar e alertar se token não está configurado
function checkGitHubToken() {
    const token = localStorage.getItem('github_token');
    
    if (!token) {
        console.warn('⚠️ Token do GitHub não configurado!');
        console.log('Execute: setupGitHubToken()');
        return false;
    }
    
    console.log('✓ Token do GitHub está configurado');
    return true;
}

// Auto-executar na primeira vez
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!localStorage.getItem('github_token')) {
            console.warn('⚠️ Primeira vez? Configure seu token!');
            console.log('Execute no console: setupGitHubToken()');
        }
    });
}
