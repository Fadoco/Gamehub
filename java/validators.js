/**
 * Módulo centralizado de validações
 * Centraliza todas as validações de entrada para evitar duplicação
 */

const Validators = (() => {
    /**
     * Valida formato de email
     * @param {string} email
     * @returns {boolean}
     */
    const email = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof email === 'string' && emailRegex.test(email.trim());
    };

    /**
     * Valida força de senha
     * Mínimo 8 caracteres, pelo menos 1 maiúscula e 1 número
     * @param {string} password
     * @returns {boolean}
     */
    const password = (password) => {
        if (typeof password !== 'string') return false;
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    };

    /**
     * Valida senha fraca (para compatibilidade com usuários existentes)
     * Mínimo 6 caracteres
     * @param {string} password
     * @returns {boolean}
     */
    const passwordWeak = (password) => {
        return typeof password === 'string' && password.length >= 6;
    };

    /**
     * Valida preço (número positivo)
     * @param {number|string} price
     * @returns {boolean}
     */
    const price = (price) => {
        const parsed = parseFloat(price);
        return !isNaN(parsed) && parsed > 0;
    };

    /**
     * Valida ID de jogo (número inteiro positivo)
     * @param {number|string} gameId
     * @returns {boolean}
     */
    const gameId = (gameId) => {
        const parsed = parseInt(gameId);
        return !isNaN(parsed) && parsed > 0;
    };

    /**
     * Valida UID do Firebase (36 caracteres alfanuméricos)
     * @param {string} uid
     * @returns {boolean}
     */
    const firebaseUID = (uid) => {
        return typeof uid === 'string' && uid.length > 0 && /^[a-zA-Z0-9]{15,}$/.test(uid);
    };

    /**
     * Valida nome de usuário (não vazio, max 50 chars)
     * @param {string} name
     * @returns {boolean}
     */
    const username = (name) => {
        return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 50;
    };

    /**
     * Valida array de IDs de jogos
     * @param {array} gameIds
     * @returns {boolean}
     */
    const gameIdArray = (gameIds) => {
        return Array.isArray(gameIds) && gameIds.every(id => gameId(id));
    };

    /**
     * Valida que um objeto tem as propriedades obrigatórias
     * @param {object} obj
     * @param {array} requiredFields
     * @returns {boolean}
     */
    const hasRequiredFields = (obj, requiredFields) => {
        if (typeof obj !== 'object' || obj === null) return false;
        return requiredFields.every(field => field in obj && obj[field] !== undefined);
    };

    /**
     * Valida entrada de texto simples (sem caracteres especiais perigosos)
     * @param {string} text
     * @param {number} maxLength
     * @returns {boolean}
     */
    const plainText = (text, maxLength = 500) => {
        if (typeof text !== 'string') return false;
        if (text.length > maxLength) return false;
        // Rejeita scripts e HTML malicioso
        return !/<|>|javascript:|onerror|onclick|onload/i.test(text);
    };

    /**
     * Retorna mensagem de erro para validação falhada
     * @param {string} field
     * @returns {string}
     */
    const getErrorMessage = (field) => {
        const messages = {
            email: 'Email inválido. Use o formato: exemplo@dominio.com',
            password: 'Senha deve ter no mínimo 8 caracteres, 1 maiúscula e 1 número',
            passwordWeak: 'Senha deve ter no mínimo 6 caracteres',
            price: 'Preço deve ser um número positivo',
            gameId: 'ID de jogo inválido',
            uid: 'Identificador de usuário inválido',
            username: 'Nome de usuário inválido (1-50 caracteres)',
            required: 'Campo obrigatório',
        };
        return messages[field] || 'Valor inválido';
    };

    return {
        email,
        password,
        passwordWeak,
        price,
        gameId,
        firebaseUID,
        username,
        gameIdArray,
        hasRequiredFields,
        plainText,
        getErrorMessage,
    };
})();

// Exportar para uso em diferentes contextos
if (typeof window !== 'undefined') {
    window.Validators = Validators;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
}
