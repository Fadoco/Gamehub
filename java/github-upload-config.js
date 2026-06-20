/**
 * ======================================
 * CONFIGURAÇÃO DO UPLOAD NO GITHUB
 * ======================================
 * 
 * Para usar este sistema, você precisa:
 * 
 * 1. Criar um Token de Acesso Pessoal no GitHub:
 *    - Vá para: github.com/settings/tokens
 *    - Clique em "Generate new token (classic)"
 *    - Selecione a permissão: ✓ repo (Full control of private repositories)
 *    - Copie o token gerado (você não verá novamente!)
 * 
 * 2. Criar um Repositório no GitHub:
 *    - Pode ser privado ou público
 *    - Exemplo: "meu-site-images" ou "projeto-mega-images"
 *    - Não precisa de README, .gitignore, etc
 * 
 * 3. IMPORTANTE - SEGURANÇA:
 *    ⚠️  NÃO COMMIT este arquivo com token real no Git!
 *    ⚠️  Use variáveis de ambiente em produção!
 * 
 * OPÇÃO 1: Colocar Token Aqui (SOMENTE em desenvolvimento local)
 * OPÇÃO 2: Usar Variáveis de Ambiente (RECOMENDADO)
 */

// ============================================
// CONFIGURAÇÃO: Preencha esses dados
// ============================================

// SEU TOKEN DO GITHUB
// IMPORTANTE: Configure o token como variável de ambiente ou localStorage
// NÃO deixe o token hardcoded no código!
// 
// Opção 1 - Variável de Ambiente (RECOMENDADO):
//   const GITHUB_TOKEN = process.env.GITHUB_TOKEN || localStorage.getItem('github_token');
//
// Opção 2 - Pedir ao usuário (em tempo de execução):
//   const GITHUB_TOKEN = prompt('Cole seu token do GitHub:');
//   localStorage.setItem('github_token', GITHUB_TOKEN);
//
// Para agora, deixamos vazio e você configura na primeira utilização

let GITHUB_TOKEN = localStorage.getItem('github_token') || '';

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
        GITHUB_TOKEN !== 'SEU_TOKEN_AQUI' &&
        GITHUB_USER !== 'SEU_USUARIO_AQUI' &&
        GITHUB_REPO !== 'SEU_REPOSITORIO_AQUI' &&
        GITHUB_TOKEN.length > 20; // Token real tem mais de 20 chars

    if (!isConfigured) {
        console.warn('⚠️  GitHub upload não está configurado!');
        console.warn('Preencha os dados em: java/github-upload-config.js');
        return false;
    }

    return true;
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
    }
};
