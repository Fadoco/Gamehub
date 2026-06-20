/**
 * ======================================
 * CONFIGURAÇÃO DO UPLOAD NO GITHUB
 * ======================================
 * 
 * O token é salvo no Firestore para ser
 * acessível em qualquer dispositivo.
 * 
 * Segurança: 
 * - Token não fica no código (Git)
 * - Apenas o proprietário pode modificar
 * - Usuarios podem ler e usar
 */

// ============================================
// CONFIGURAÇÃO: Preencha esses dados
// ============================================

// SEU TOKEN DO GITHUB
// Será carregado do Firestore em tempo de execução
let GITHUB_TOKEN = '';

// SEU USUÁRIO DO GITHUB
const GITHUB_USER = 'Fadoco'; // Seu usuário GitHub

// NOME DO REPOSITÓRIO
const GITHUB_REPO = 'Gamehub'; // Seu repositório

// BRANCH PADRÃO
const GITHUB_BRANCH = 'main'; // ou 'master'

// PASTA DENTRO DO REPOSITÓRIO
const GITHUB_FOLDER = 'assets/user-avatars'; // Será criada automaticamente

// ============================================
// VALIDAÇÃO
// ============================================

function validateGitHubConfig() {
    const isConfigured = 
        GITHUB_USER !== 'SEU_USUARIO_AQUI' &&
        GITHUB_REPO !== 'SEU_REPOSITORIO_AQUI';

    if (!isConfigured) {
        console.warn('⚠️  GitHub não está configurado!');
        console.warn('Preencha os dados em: java/github-upload-config.js');
        return false;
    }

    return true;
}

// ============================================
// CARREGAR TOKEN DO FIRESTORE
// ============================================

async function loadGitHubTokenFromFirestore() {
    if (!window.db) {
        console.error('❌ Firestore não está inicializado');
        return false;
    }

    try {
        const configDoc = await window.db.collection('site-config').doc('github-token').get();
        
        if (configDoc.exists) {
            const data = configDoc.data();
            GITHUB_TOKEN = data.token;
            console.log('✓ Token do GitHub carregado do Firestore');
            return true;
        } else {
            console.warn('⚠️  Token não encontrado no Firestore');
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar token do Firestore:', error);
        return false;
    }
}

// ============================================
// EXPORTAR CONFIGURAÇÃO
// ============================================

const GitHubConfig = {
    token: GITHUB_TOKEN,
    user: GITHUB_USER,
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH,
    folder: GITHUB_FOLDER,
    isValid: validateGitHubConfig(),
    
    // URL base para acessar as imagens
    getImageUrl(userId, filename) {
        return `https://raw.githubusercontent.com/${this.user}/${this.repo}/${this.branch}/${this.folder}/${userId}/${filename}`;
    },

    // Caminho dentro do repositório
    getFilePath(userId, filename) {
        return `${this.folder}/${userId}/${filename}`;
    },

    // Atualizar token em memória
    setToken(newToken) {
        GITHUB_TOKEN = newToken;
        this.token = newToken;
    },

    // Obter token
    getToken() {
        return GITHUB_TOKEN;
    }
};
