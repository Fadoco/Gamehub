/**
 * ======================================
 * SISTEMA DE UPLOAD NO GITHUB
 * ======================================
 * 
 * Responsável por fazer upload de imagens
 * para o GitHub usando a API de commits
 */

const GitHubUploader = {
    /**
     * Fazer upload de uma imagem para o GitHub
     * @param {string} userId - ID do usuário
     * @param {string} imageBase64 - Imagem em Base64
     * @param {string} filename - Nome do arquivo (avatar.jpg, banner.png, etc)
     * @returns {Promise<string>} URL da imagem no GitHub
     */
    async uploadImage(userId, imageBase64, filename) {
        // Validar configuração
        if (!GitHubConfig.isValid) {
            throw new Error('GitHub não está configurado. Verifique java/github-upload-config.js');
        }

        // Obter token do Firestore (carregado na memória)
        let token = GitHubConfig.getToken();
        
        if (!token || token === '') {
            throw new Error('Token do GitHub não está configurado. Proprietário: Execute setupGitHubToken() no console (F12)');
        }

        // Remover prefixo data:image/... do Base64 se existir
        let base64Data = imageBase64;
        if (imageBase64.includes('data:image')) {
            base64Data = imageBase64.split(',')[1];
        }

        const filePath = GitHubConfig.getFilePath(userId, filename);
        const apiUrl = `https://api.github.com/repos/${GitHubConfig.user}/${GitHubConfig.repo}/contents/${filePath}`;

        try {
            // Primeiro: verificar se o arquivo já existe
            let sha = null;
            try {
                const checkResponse = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (checkResponse.ok) {
                    const fileData = await checkResponse.json();
                    sha = fileData.sha; // Arquivo existe, pega o SHA para atualizar
                }
            } catch (e) {
                // Arquivo não existe, va ignorar
            }

            // Segundo: fazer upload/atualizar o arquivo
            const uploadResponse = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Upload ${filename} para usuário ${userId}`,
                    content: base64Data,
                    branch: GitHubConfig.branch,
                    ...(sha && { sha }) // Incluir SHA se arquivo já existe
                })
            });

            if (!uploadResponse.ok) {
                const error = await uploadResponse.json();
                throw new Error(error.message || 'Erro ao fazer upload no GitHub');
            }

            // Terceiro: retornar URL raw da imagem
            const imageUrl = GitHubConfig.getImageUrl(userId, filename);
            console.log('✓ Upload realizado:', imageUrl);
            return imageUrl;

        } catch (error) {
            console.error('❌ Erro no upload do GitHub:', error);
            throw error;
        }
    },

    /**
     * Fazer upload de avatar
     * @param {string} userId - ID do usuário
     * @param {string} imageBase64 - Imagem em Base64
     * @returns {Promise<string>} URL do avatar
     */
    async uploadAvatar(userId, imageBase64) {
        return this.uploadImage(userId, imageBase64, 'avatar.jpg');
    },

    /**
     * Fazer upload de banner
     * @param {string} userId - ID do usuário
     * @param {string} imageBase64 - Imagem em Base64
     * @returns {Promise<string>} URL do banner
     */
    async uploadBanner(userId, imageBase64) {
        return this.uploadImage(userId, imageBase64, 'banner.jpg');
    },

    /**
     * Fazer upload de múltiplas imagens (avatar + banner)
     * @param {string} userId - ID do usuário
     * @param {string|null} avatarBase64 - Avatar em Base64
     * @param {string|null} bannerBase64 - Banner em Base64
     * @returns {Promise<{avatar: string, banner: string}>} URLs das imagens
     */
    async uploadMultiple(userId, avatarBase64, bannerBase64) {
        const results = {};

        // Upload Avatar
        if (avatarBase64) {
            try {
                results.avatar = await this.uploadAvatar(userId, avatarBase64);
            } catch (error) {
                console.error('Erro ao fazer upload do avatar:', error);
                throw error;
            }
        }

        // Upload Banner
        if (bannerBase64) {
            try {
                results.banner = await this.uploadBanner(userId, bannerBase64);
            } catch (error) {
                console.error('Erro ao fazer upload do banner:', error);
                throw error;
            }
        }

        return results;
    }
};
