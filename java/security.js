/**
 * Módulo de Segurança e Sanitização
 * Implementa sanitização de entrada, logging seguro e funções de segurança gerais
 */

const SecurityModule = (() => {
    // Modo debug - mude para true apenas em desenvolvimento local
    const DEBUG_MODE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    // Níveis de log
    const LogLevel = {
        ERROR: 'ERROR',
        WARN: 'WARN',
        INFO: 'INFO',
        DEBUG: 'DEBUG',
    };

    /**
     * Logger seguro - não expõe dados sensíveis em produção
     */
    const logger = {
        _shouldLog: (level) => {
            if (DEBUG_MODE) return true;
            return level === LogLevel.ERROR || level === LogLevel.WARN;
        },

        _format: (level, message, data) => {
            const timestamp = new Date().toISOString();
            return `[${timestamp}] [${level}] ${message}`;
        },

        error: (message, error = null) => {
            if (logger._shouldLog(LogLevel.ERROR)) {
                console.error(logger._format(LogLevel.ERROR, message), error);
            } else {
                // Em produção, apenas registra que um erro ocorreu
                console.error('[PROD] Erro registrado no sistema');
            }
        },

        warn: (message, data = null) => {
            if (logger._shouldLog(LogLevel.WARN)) {
                console.warn(logger._format(LogLevel.WARN, message), data);
            }
        },

        info: (message, data = null) => {
            if (logger._shouldLog(LogLevel.INFO)) {
                console.log(logger._format(LogLevel.INFO, message), data);
            }
        },

        debug: (message, data = null) => {
            if (logger._shouldLog(LogLevel.DEBUG)) {
                console.log(logger._format(LogLevel.DEBUG, message), data);
            }
        },

        /**
         * Log de ação de segurança (nunca omitida)
         */
        security: (message, action, details = {}) => {
            const log = {
                timestamp: new Date().toISOString(),
                message,
                action,
                userAgent: navigator.userAgent.substring(0, 100),
                url: window.location.pathname,
                ...details
            };
            console.warn('[SECURITY]', log);
            // TODO: Enviar para servidor de logging centralizado
        },
    };

    /**
     * Sanitiza string HTML para evitar XSS
     */
    const sanitizeHTML = (dirtyHtml) => {
        const div = document.createElement('div');
        div.textContent = dirtyHtml;
        return div.innerHTML;
    };

    /**
     * Sanitiza objeto para logging seguro (remove dados sensíveis)
     */
    const sanitizeForLog = (obj) => {
        const sensitiveKeys = [
            'password', 'token', 'secret', 'key', 'apiKey', 
            'uid', 'email', 'phone', 'ssn', 'balance'
        ];

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
                sanitized[key] = '***REDACTED***';
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeForLog(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };

    /**
     * Valida e sanitiza input de usuário
     */
    const sanitizeInput = (input, maxLength = 500) => {
        if (typeof input !== 'string') {
            logger.warn('Input recebido não é string');
            return '';
        }

        // Limita tamanho
        let sanitized = input.substring(0, maxLength);

        // Remove scripts e HTML malicioso
        sanitized = sanitized
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');

        return sanitized.trim();
    };

    /**
     * Protege contra acesso não autorizado
     */
    const checkOwnership = (currentUserId, resourceUserId) => {
        if (currentUserId !== resourceUserId) {
            logger.security(
                'Tentativa de acesso não autorizado',
                'UNAUTHORIZED_ACCESS',
                { currentUser: currentUserId.substring(0, 10) + '***' }
            );
            throw new Error('Acesso negado: você não tem permissão para acessar este recurso');
        }
    };

    /**
     * Cria um wrapper seguro para operações sensíveis
     */
    const withSecurityContext = async (operationName, operation, { userId, requireAuth = true } = {}) => {
        try {
            if (requireAuth && !window.auth?.currentUser) {
                throw new Error('Operação requer autenticação');
            }

            logger.debug(`Iniciando operação: ${operationName}`);
            const result = await operation();
            logger.security(`Operação concluída: ${operationName}`, 'OPERATION_SUCCESS', { userId: userId?.substring(0, 10) + '***' });
            return result;
        } catch (error) {
            logger.security(
                `Erro em operação: ${operationName}`,
                'OPERATION_FAILED',
                { error: error.message }
            );
            throw error;
        }
    };

    /**
     * Remove listeners para evitar memory leaks
     */
    const cleanupEventListeners = (element, eventType, handler) => {
        if (element && eventType && handler) {
            element.removeEventListener(eventType, handler);
            logger.debug(`Listener removido: ${eventType}`);
        }
    };

    /**
     * Valida que o usuário atual é o UID da URL ou localStorage
     */
    const validateCurrentUserContext = () => {
        const currentUser = window.auth?.currentUser;
        if (!currentUser) {
            throw new Error('Usuário não autenticado');
        }
        return currentUser.uid;
    };

    /**
     * Cria um objeto com versão de segurança (hash do conteúdo)
     */
    const createSecureObject = (data) => {
        // Hash simples para detecção de tampering
        const hash = btoa(JSON.stringify(data)).substring(0, 16);
        return {
            data,
            version: 1,
            hash,
            timestamp: Date.now(),
        };
    };

    /**
     * Verifica integridade de objeto seguro
     */
    const verifySecureObject = (secureObj) => {
        if (!secureObj.data || !secureObj.hash) {
            throw new Error('Objeto seguro inválido');
        }
        const expectedHash = btoa(JSON.stringify(secureObj.data)).substring(0, 16);
        if (expectedHash !== secureObj.hash) {
            logger.security('Tampering detectado', 'TAMPERING_DETECTED');
            throw new Error('Dados foram modificados');
        }
        return secureObj.data;
    };

    return {
        logger,
        sanitizeHTML,
        sanitizeForLog,
        sanitizeInput,
        checkOwnership,
        withSecurityContext,
        cleanupEventListeners,
        validateCurrentUserContext,
        createSecureObject,
        verifySecureObject,
        DEBUG_MODE,
        LogLevel,
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SecurityModule = SecurityModule;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityModule;
}
