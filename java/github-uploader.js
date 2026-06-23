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

            // Aguardar um pouco para o GitHub processar completamente
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Terceiro: retornar URL raw da imagem
            const imageUrl = GitHubConfig.getImageUrl(userId, filename);
            // Adicionar cache busting com timestamp para garantir que sempre pega a versão mais nova
            const urlWithCacheBust = `${imageUrl}?t=${Date.now()}`;
            console.log('✓ Upload realizado:', urlWithCacheBust);
            return urlWithCacheBust;

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
    },

    /**
     * Deletar uma imagem do GitHub
     * @param {string} userId - ID do usuário
     * @param {string} filename - Nome do arquivo (avatar.jpg, banner.jpg, etc)
     * @returns {Promise<boolean>} true se deletado com sucesso
     */
    async deleteImage(userId, filename) {
        // Obter token do Firestore (carregado na memória)
        let token = GitHubConfig.getToken();
        
        if (!token || token === '') {
            console.warn('⚠️ Token do GitHub não está configurado');
            return false;
        }

        const filePath = GitHubConfig.getFilePath(userId, filename);
        const apiUrl = `https://api.github.com/repos/${GitHubConfig.user}/${GitHubConfig.repo}/contents/${filePath}`;

        try {
            // Primeiro: obter o SHA do arquivo
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
                    sha = fileData.sha; // Obter SHA necessário para deletar
                } else {
                    // Arquivo não existe, não há nada para deletar
                    console.log(`ℹ️ Arquivo ${filename} não existe para ${userId}`);
                    return true;
                }
            } catch (e) {
                console.log(`ℹ️ Arquivo ${filename} não encontrado para ${userId}`);
                return true;
            }

            // Se não houver SHA, arquivo não existe
            if (!sha) {
                return true;
            }

            // Segundo: deletar o arquivo
            const deleteResponse = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Deletar ${filename} do usuário ${userId}`,
                    sha: sha,
                    branch: GitHubConfig.branch
                })
            });

            if (!deleteResponse.ok) {
                const error = await deleteResponse.json();
                console.error(`❌ Erro ao deletar ${filename}:`, error.message);
                return false;
            }

            console.log(`✓ ${filename} deletado com sucesso para ${userId}`);
            return true;

        } catch (error) {
            console.error(`❌ Erro ao deletar ${filename}:`, error);
            return false;
        }
    },

    /**
     * Deletar avatar de um usuário
     * @param {string} userId - ID do usuário
     * @returns {Promise<boolean>} true se deletado com sucesso
     */
    async deleteAvatar(userId) {
        return this.deleteImage(userId, 'avatar.jpg');
    },

    /**
     * Deletar banner de um usuário
     * @param {string} userId - ID do usuário
     * @returns {Promise<boolean>} true se deletado com sucesso
     */
    async deleteBanner(userId) {
        return this.deleteImage(userId, 'banner.jpg');
    },

    /**
     * Deletar todas as imagens de um usuário (avatar + banner)
     * @param {string} userId - ID do usuário
     * @returns {Promise<{avatar: boolean, banner: boolean}>} Resultado das deleções
     */
    async deleteAllUserImages(userId) {
        const results = {};

        try {
            results.avatar = await this.deleteAvatar(userId);
        } catch (error) {
            console.error('Erro ao deletar avatar:', error);
            results.avatar = false;
        }

        try {
            results.banner = await this.deleteBanner(userId);
        } catch (error) {
            console.error('Erro ao deletar banner:', error);
            results.banner = false;
        }

        return results;
    }
};
