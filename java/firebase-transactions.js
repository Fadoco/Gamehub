/**
 * Módulo de Transações Firebase Seguras
 * Implementa transações atômicas para evitar race conditions
 * e operações de leitura-escrita que podem ser duplicadas
 */

const FirebaseTransactions = (() => {
    /**
     * Debita saldo com proteção contra race condition
     * Usa Firebase Transaction para garantir atomicidade
     * 
     * @param {string} userId - UID do usuário
     * @param {number} amount - Valor a debitar
     * @param {string} reason - Motivo da transação (para auditoria)
     * @returns {Promise<object>} { newBalance, success }
     */
    const debitBalance = async (userId, amount, reason = 'unknown') => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }

        if (amount <= 0) {
            throw new Error('Valor de débito deve ser positivo');
        }

        const userRef = window.db.collection('users').doc(userId);

        try {
            const result = await window.db.runTransaction(async (transaction) => {
                // 1. Lê dados atuais de forma atômica
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                const currentBalance = userDoc.data().balance || 0;
                const newBalance = currentBalance - amount;

                // 2. Valida antes de confirmar
                if (newBalance < 0) {
                    throw new Error(`Saldo insuficiente. Saldo: R$ ${currentBalance}, Necessário: R$ ${amount}`);
                }

                // 3. Registra a transação antes de atualizar (para auditoria)
                const transactionRecord = {
                    type: 'debit',
                    amount,
                    reason,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    beforeBalance: currentBalance,
                    afterBalance: newBalance,
                };

                // 4. Atualiza balance e adiciona registro de transação atomicamente
                transaction.update(userRef, {
                    balance: newBalance,
                    lastTransaction: transactionRecord,
                });

                // 5. Registra em log de auditoria
                if (window.db.collection('audit_logs')) {
                    transaction.set(
                        window.db.collection('audit_logs').doc(),
                        {
                            userId,
                            action: 'debit_balance',
                            ...transactionRecord,
                        }
                    );
                }

                return { newBalance, success: true };
            });

            // Atualiza o balance global
            window.userBalance = result.newBalance;

            return result;
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao debitar saldo: ${error.message}`);
            throw error;
        }
    };

    /**
     * Credita saldo com proteção
     */
    const creditBalance = async (userId, amount, reason = 'unknown') => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }

        if (amount <= 0) {
            throw new Error('Valor de crédito deve ser positivo');
        }

        const userRef = window.db.collection('users').doc(userId);

        try {
            const result = await window.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                const currentBalance = userDoc.data().balance || 0;
                const newBalance = currentBalance + amount;

                const transactionRecord = {
                    type: 'credit',
                    amount,
                    reason,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    beforeBalance: currentBalance,
                    afterBalance: newBalance,
                };

                transaction.update(userRef, {
                    balance: newBalance,
                    lastTransaction: transactionRecord,
                });

                if (window.db.collection('audit_logs')) {
                    transaction.set(
                        window.db.collection('audit_logs').doc(),
                        {
                            userId,
                            action: 'credit_balance',
                            ...transactionRecord,
                        }
                    );
                }

                return { newBalance, success: true };
            });

            window.userBalance = result.newBalance;
            return result;
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao creditar saldo: ${error.message}`);
            throw error;
        }
    };

    /**
     * Transfere item para biblioteca com validação
     * Garante que não é duplicado e que o saldo é debitado atomicamente
     */
    const purchaseGameTransaction = async (userId, gameIds, totalPrice) => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }

        if (!Array.isArray(gameIds) || gameIds.length === 0) {
            throw new Error('gameIds inválido');
        }

        if (totalPrice <= 0) {
            throw new Error('Preço deve ser positivo');
        }

        const userRef = window.db.collection('users').doc(userId);

        try {
            const result = await window.db.runTransaction(async (transaction) => {
                // 1. Lê dados atuais
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                const userData = userDoc.data();
                const currentBalance = userData.balance || 0;
                const currentLibrary = userData.library || [];
                const currentCart = userData.cart || [];

                // 2. Valida saldo
                if (currentBalance < totalPrice) {
                    throw new Error(`Saldo insuficiente. Saldo: R$ ${currentBalance}, Necessário: R$ ${totalPrice}`);
                }

                // 3. Valida que nenhum jogo já está na biblioteca
                const duplicates = gameIds.filter(id => currentLibrary.includes(id));
                if (duplicates.length > 0) {
                    throw new Error(`Alguns jogos já estão na sua biblioteca: ${duplicates.join(', ')}`);
                }

                const newBalance = currentBalance - totalPrice;
                const newLibrary = [...new Set([...currentLibrary, ...gameIds])]; // Remove duplicatas
                const newCart = currentCart.filter(id => !gameIds.includes(id)); // Remove do carrinho

                // 4. Atualiza atomicamente
                transaction.update(userRef, {
                    balance: newBalance,
                    library: newLibrary,
                    cart: newCart,
                    lastPurchase: firebase.firestore.FieldValue.serverTimestamp(),
                });

                // 5. Registra auditoria
                if (window.db.collection('purchase_history')) {
                    transaction.set(
                        window.db.collection('purchase_history').doc(),
                        {
                            userId,
                            gameIds,
                            totalPrice,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                            balanceAfter: newBalance,
                        }
                    );
                }

                return {
                    success: true,
                    newBalance,
                    library: newLibrary,
                    gamesPurchased: gameIds.length,
                };
            });

            // Atualiza globais
            window.userBalance = result.newBalance;
            window.userLibrary = result.library;
            window.userCart = [];

            return result;
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao comprar jogos: ${error.message}`);
            throw error;
        }
    };

    /**
     * Atualiza array de forma segura (favoritos, upgrades, etc)
     */
    const updateUserArray = async (userId, fieldName, newArray) => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }

        if (!Array.isArray(newArray)) {
            throw new Error('newArray deve ser um array');
        }

        const userRef = window.db.collection('users').doc(userId);

        try {
            await window.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                transaction.update(userRef, {
                    [fieldName]: newArray,
                    lastModified: firebase.firestore.FieldValue.serverTimestamp(),
                });
            });

            return { success: true };
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao atualizar ${fieldName}: ${error.message}`);
            throw error;
        }
    };

    /**
     * Incrementa um contador de forma atômica (usado para ranking, stats, etc)
     */
    const incrementCounter = async (userId, fieldName, incrementBy = 1) => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }

        const userRef = window.db.collection('users').doc(userId);

        try {
            const result = await window.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                const currentValue = userDoc.data()[fieldName] || 0;
                const newValue = currentValue + incrementBy;

                transaction.update(userRef, {
                    [fieldName]: newValue,
                });

                return { newValue };
            });

            return result;
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao incrementar ${fieldName}: ${error.message}`);
            throw error;
        }
    };

    /**
     * Batch update com validação de ownership
     */
    const batchUpdateUserData = async (userId, updates) => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }

        const userRef = window.db.collection('users').doc(userId);

        try {
            // Valida que cada update é válido antes de fazer batch
            for (const [key, value] of Object.entries(updates)) {
                if (typeof key !== 'string' || key.trim() === '') {
                    throw new Error(`Chave inválida: ${key}`);
                }
            }

            await window.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                const validatedUpdates = {
                    ...updates,
                    lastModified: firebase.firestore.FieldValue.serverTimestamp(),
                };

                transaction.update(userRef, validatedUpdates);
            });

            return { success: true };
        } catch (error) {
            SecurityModule?.logger?.error(`Erro em batch update: ${error.message}`);
            throw error;
        }
    };

    return {
        debitBalance,
        creditBalance,
        purchaseGameTransaction,
        updateUserArray,
        incrementCounter,
        batchUpdateUserData,
    };
})();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.FirebaseTransactions = FirebaseTransactions;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseTransactions;
}
