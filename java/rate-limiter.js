/**
 * Módulo de Rate Limiting
 * Protege contra brute force, DDoS e abuso de recursos
 */

const RateLimiter = (() => {
    // Configurações padrão
    const DEFAULT_CONFIG = {
        login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 tentativas em 15 min
        register: { maxAttempts: 3, windowMs: 1 * 60 * 60 * 1000 }, // 3 registros por hora
        purchase: { maxAttempts: 10, windowMs: 1 * 60 * 60 * 1000 }, // 10 compras por hora
        roulette: { maxAttempts: 30, windowMs: 1 * 60 * 60 * 1000 }, // 30 roletas por hora
        api: { maxAttempts: 100, windowMs: 1 * 60 * 1000 }, // 100 requests por minuto
        search: { maxAttempts: 60, windowMs: 1 * 60 * 1000 }, // 60 buscas por minuto
    };

    // Armazena tentativas: { key: [timestamps] }
    const attempts = new Map();

    /**
     * Registra uma tentativa e verifica se ultrapassou o limite
     * 
     * @param {string} key - Identificador único (userId, IP, etc)
     * @param {string} action - Tipo de ação (login, register, purchase, etc)
     * @returns {object} { allowed: boolean, remaining: number, resetIn: number }
     */
    const checkLimit = (key, action = 'api') => {
        const config = DEFAULT_CONFIG[action] || DEFAULT_CONFIG.api;
        const now = Date.now();
        const mapKey = `${action}:${key}`;

        // Obtém tentativas anteriores
        let userAttempts = attempts.get(mapKey) || [];

        // Filtra tentativas dentro da janela de tempo
        userAttempts = userAttempts.filter(timestamp => now - timestamp < config.windowMs);

        // Atualiza o mapa
        attempts.set(mapKey, userAttempts);

        // Calcula informações
        const allowed = userAttempts.length < config.maxAttempts;
        const remaining = Math.max(0, config.maxAttempts - userAttempts.length);
        const resetIn = userAttempts.length > 0 
            ? Math.ceil((userAttempts[0] + config.windowMs - now) / 1000)
            : 0;

        return {
            allowed,
            remaining,
            resetIn,
            attemptCount: userAttempts.length,
        };
    };

    /**
     * Registra uma nova tentativa
     */
    const recordAttempt = (key, action = 'api') => {
        const mapKey = `${action}:${key}`;
        const userAttempts = attempts.get(mapKey) || [];
        userAttempts.push(Date.now());
        attempts.set(mapKey, userAttempts);

        const limit = checkLimit(key, action);
        
        if (!limit.allowed) {
            SecurityModule?.logger?.security(
                `Rate limit excedido para ${action}`,
                'RATE_LIMIT_EXCEEDED',
                { action, key: key.substring(0, 10) + '***', remaining: limit.remaining }
            );
        }

        return limit;
    };

    /**
     * Reseta o contador para um usuário/ação específica
     */
    const reset = (key, action = 'api') => {
        const mapKey = `${action}:${key}`;
        attempts.delete(mapKey);
    };

    /**
     * Reseta todos os contadores (útil para testes)
     */
    const resetAll = () => {
        attempts.clear();
    };

    /**
     * Retorna estatísticas de rate limiting
     */
    const getStats = () => {
        const stats = {};
        for (const [key, value] of attempts.entries()) {
            const now = Date.now();
            const [action, userId] = key.split(':');
            const active = value.filter(t => now - t < 1 * 60 * 60 * 1000).length; // Últimas 1 hora
            
            if (!stats[action]) stats[action] = [];
            stats[action].push({
                user: userId.substring(0, 10) + '***',
                attempts: active,
            });
        }
        return stats;
    };

    /**
     * Middleware para usar em funções críticas
     * 
     * @param {string} userId 
     * @param {string} action 
     * @param {function} callback - Função a executar se permitido
     * @returns {Promise}
     */
    const withRateLimit = async (userId, action, callback) => {
        const limit = recordAttempt(userId, action);

        if (!limit.allowed) {
            const error = new Error(
                `Muitas tentativas. Tente novamente em ${limit.resetIn} segundos.`
            );
            error.code = 'RATE_LIMIT_EXCEEDED';
            error.resetIn = limit.resetIn;
            throw error;
        }

        try {
            const result = await callback();
            return result;
        } catch (error) {
            // Se a operação falhou, remove a tentativa gravada
            // (para não penalizar usuários com conexão ruim)
            if (error.code === 'NETWORK_ERROR') {
                const mapKey = `${action}:${userId}`;
                const userAttempts = attempts.get(mapKey) || [];
                if (userAttempts.length > 0) {
                    userAttempts.pop();
                    if (userAttempts.length === 0) {
                        attempts.delete(mapKey);
                    } else {
                        attempts.set(mapKey, userAttempts);
                    }
                }
            }
            throw error;
        }
    };

    /**
     * Gera mensagem amigável para o usuário
     */
    const getFriendlyMessage = (action, resetIn) => {
        const messages = {
            login: `Muitas tentativas de login. Tente novamente em ${resetIn} segundo${resetIn > 1 ? 's' : ''}.`,
            register: `Registros em excesso. Tente novamente mais tarde.`,
            purchase: `Você está comprando muito rápido. Aguarde alguns minutos.`,
            roulette: `Muitas rotações na roleta. Aguarde um pouco.`,
            search: `Muitas buscas. Reduza a frequência de pesquisas.`,
            api: `Muitas requisições. Aguarde um momento.`,
        };
        return messages[action] || `Limite de tentativas excedido. Tente novamente em ${resetIn}s.`;
    };

    return {
        checkLimit,
        recordAttempt,
        reset,
        resetAll,
        getStats,
        withRateLimit,
        getFriendlyMessage,
        DEFAULT_CONFIG,
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.RateLimiter = RateLimiter;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RateLimiter;
}
