/**
 * Módulo de Transações Firebase Seguras
 * Implementa transações atômicas para evitar race conditions
 * e operações financeiras com empréstimo diário.
 */

const FirebaseTransactions = (() => {
    const LOAN_MIN_AMOUNT = 50;
    const LOAN_MAX_AMOUNT = 5000;
    const LOAN_DAILY_LIMIT = 5000;
    const LOAN_INTEREST_RATE = 0.10;
    const LOAN_MAX_DEBT = 15000;
    const ENABLE_PURCHASE_AUDIT_LOG = false;

    const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
    const dateKey = (baseDate = new Date()) => {
        const y = baseDate.getFullYear();
        const m = String(baseDate.getMonth() + 1).padStart(2, '0');
        const d = String(baseDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getGameValuation = (gameId, upgrades = {}) => {
        if (!Array.isArray(window.allGamesData) || window.allGamesData.length === 0) {
            throw new Error('Catálogo de jogos não carregado');
        }

        const game = window.allGamesData.find((g) => String(g.id) === String(gameId));
        if (!game) {
            throw new Error(`Jogo não encontrado para pagamento: ${gameId}`);
        }

        const basePrice = window.utils?.parsePrice ? window.utils.parsePrice(game.currentPrice) : Number(game.currentPrice) || 0;
        const level = (upgrades[String(gameId)] ?? upgrades[gameId]) || 0;
        const value = window.RankSystem?.calculateValuation
            ? window.RankSystem.calculateValuation(basePrice, level)
            : basePrice;

        return {
            game,
            upgradeLevel: level,
            valuation: roundMoney(value)
        };
    };

    const normalizeLoanState = (userData, todayKey) => ({
        balance: roundMoney(userData.balance || 0),
        loanDebt: roundMoney(userData.loanDebt || 0),
        loanWalletBalance: roundMoney(userData.loanWalletBalance || 0),
        loanBorrowedToday: roundMoney(userData.loanBorrowedToday || 0),
        loanDayKey: userData.loanDayKey || todayKey,
        loanHistory: Array.isArray(userData.loanHistory) ? userData.loanHistory : []
    });

    const applyDailyLoanReset = (state, todayKey) => {
        if (state.loanDayKey === todayKey) {
            return { state, resetEntry: null, resetApplied: false };
        }

        const expirableFromWallet = roundMoney(Math.min(state.loanWalletBalance, state.balance));
        const newBalance = roundMoney(state.balance - expirableFromWallet);
        const newDebt = roundMoney(Math.max(0, state.loanDebt - expirableFromWallet));
        const remainingLoanWallet = roundMoney(Math.max(0, state.loanWalletBalance - expirableFromWallet));

        const resetEntry = expirableFromWallet > 0
            ? {
                type: 'loan_daily_expire',
                expiredAmount: expirableFromWallet,
                totalDebtAfter: newDebt,
                date: new Date().toISOString()
            }
            : null;

        return {
            resetApplied: true,
            resetEntry,
            state: {
                ...state,
                balance: newBalance,
                loanDebt: newDebt,
                loanWalletBalance: remainingLoanWallet,
                loanBorrowedToday: 0,
                loanDayKey: todayKey
            }
        };
    };

    const commitLoanAwareUserUpdate = (transaction, userRef, updatePayload, loanHistoryEntries = []) => {
        transaction.update(userRef, updatePayload);
        if (loanHistoryEntries.length > 0) {
            transaction.update(userRef, {
                loanHistory: firebase.firestore.FieldValue.arrayUnion(...loanHistoryEntries)
            });
        }
    };

    const syncDailyLoanState = async (userId) => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }

        const userRef = window.db.collection('users').doc(userId);
        const todayKey = dateKey();

        const result = await window.db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error('Usuário não encontrado');
            }

            const state = normalizeLoanState(userDoc.data(), todayKey);
            const { state: normalized, resetEntry, resetApplied } = applyDailyLoanReset(state, todayKey);

            if (resetApplied) {
                commitLoanAwareUserUpdate(
                    transaction,
                    userRef,
                    {
                        balance: normalized.balance,
                        loanDebt: normalized.loanDebt,
                        loanWalletBalance: normalized.loanWalletBalance,
                        loanBorrowedToday: normalized.loanBorrowedToday,
                        loanDayKey: normalized.loanDayKey
                    },
                    resetEntry ? [resetEntry] : []
                );
            }

            return {
                resetApplied,
                newBalance: normalized.balance,
                newDebt: normalized.loanDebt,
                newLoanWalletBalance: normalized.loanWalletBalance,
                newBorrowedToday: normalized.loanBorrowedToday,
                newLoanDayKey: normalized.loanDayKey
            };
        });

        window.userBalance = result.newBalance;
        window.userLoanDebt = result.newDebt;
        window.userLoanWalletBalance = result.newLoanWalletBalance;
        window.userLoanBorrowedToday = result.newBorrowedToday;
        window.userLoanDayKey = result.newLoanDayKey;
        return result;
    };

    const debitBalance = async (userId, amount, reason = 'unknown') => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }
        if (amount <= 0) {
            throw new Error('Valor de débito deve ser positivo');
        }

        const userRef = window.db.collection('users').doc(userId);
        const todayKey = dateKey();

        try {
            const result = await window.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                const baseState = normalizeLoanState(userDoc.data(), todayKey);
                const { state, resetEntry } = applyDailyLoanReset(baseState, todayKey);
                const balanceAfterDebit = roundMoney(state.balance - amount);
                if (balanceAfterDebit < 0) {
                    throw new Error(`Saldo insuficiente. Saldo: R$ ${state.balance}, Necessário: R$ ${amount}`);
                }

                const newLoanWallet = roundMoney(Math.max(0, state.loanWalletBalance - amount));
                const txRecord = {
                    type: 'debit',
                    amount,
                    reason,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    beforeBalance: state.balance,
                    afterBalance: balanceAfterDebit
                };

                commitLoanAwareUserUpdate(
                    transaction,
                    userRef,
                    {
                        balance: balanceAfterDebit,
                        loanDebt: state.loanDebt,
                        loanWalletBalance: newLoanWallet,
                        loanBorrowedToday: state.loanBorrowedToday,
                        loanDayKey: state.loanDayKey,
                        lastTransaction: txRecord
                    },
                    resetEntry ? [resetEntry] : []
                );

                if (window.db.collection('audit_logs')) {
                    transaction.set(window.db.collection('audit_logs').doc(), {
                        userId,
                        action: 'debit_balance',
                        ...txRecord
                    });
                }

                return {
                    newBalance: balanceAfterDebit,
                    newLoanWallet,
                    loanBorrowedToday: state.loanBorrowedToday,
                    loanDayKey: state.loanDayKey
                };
            });

            window.userBalance = result.newBalance;
            window.userLoanWalletBalance = result.newLoanWallet;
            window.userLoanBorrowedToday = result.loanBorrowedToday;
            window.userLoanDayKey = result.loanDayKey;
            return { success: true, newBalance: result.newBalance };
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao debitar saldo: ${error.message}`);
            throw error;
        }
    };

    const creditBalance = async (userId, amount, reason = 'unknown') => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }
        if (amount <= 0) {
            throw new Error('Valor de crédito deve ser positivo');
        }

        const userRef = window.db.collection('users').doc(userId);
        const todayKey = dateKey();

        try {
            const result = await window.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                const baseState = normalizeLoanState(userDoc.data(), todayKey);
                const { state, resetEntry } = applyDailyLoanReset(baseState, todayKey);
                const newBalance = roundMoney(state.balance + amount);

                const txRecord = {
                    type: 'credit',
                    amount,
                    reason,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    beforeBalance: state.balance,
                    afterBalance: newBalance
                };

                commitLoanAwareUserUpdate(
                    transaction,
                    userRef,
                    {
                        balance: newBalance,
                        loanDebt: state.loanDebt,
                        loanWalletBalance: state.loanWalletBalance,
                        loanBorrowedToday: state.loanBorrowedToday,
                        loanDayKey: state.loanDayKey,
                        lastTransaction: txRecord
                    },
                    resetEntry ? [resetEntry] : []
                );

                if (window.db.collection('audit_logs')) {
                    transaction.set(window.db.collection('audit_logs').doc(), {
                        userId,
                        action: 'credit_balance',
                        ...txRecord
                    });
                }

                return {
                    newBalance,
                    loanWalletBalance: state.loanWalletBalance,
                    loanBorrowedToday: state.loanBorrowedToday,
                    loanDayKey: state.loanDayKey
                };
            });

            window.userBalance = result.newBalance;
            window.userLoanWalletBalance = result.loanWalletBalance;
            window.userLoanBorrowedToday = result.loanBorrowedToday;
            window.userLoanDayKey = result.loanDayKey;
            return { success: true, newBalance: result.newBalance };
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao creditar saldo: ${error.message}`);
            throw error;
        }
    };

    const requestLoan = async (userId, amount) => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }
        if (!Number.isFinite(amount)) {
            throw new Error('Valor inválido');
        }

        const normalizedAmount = roundMoney(amount);
        if (normalizedAmount < LOAN_MIN_AMOUNT || normalizedAmount > LOAN_MAX_AMOUNT) {
            throw new Error(`Empréstimo deve estar entre R$ ${LOAN_MIN_AMOUNT} e R$ ${LOAN_MAX_AMOUNT}`);
        }

        const userRef = window.db.collection('users').doc(userId);
        const nowIso = new Date().toISOString();
        const todayKey = dateKey();

        try {
            const result = await window.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                const baseState = normalizeLoanState(userDoc.data(), todayKey);
                const { state, resetEntry } = applyDailyLoanReset(baseState, todayKey);

                const borrowedTodayAfter = roundMoney(state.loanBorrowedToday + normalizedAmount);
                if (borrowedTodayAfter > LOAN_DAILY_LIMIT) {
                    throw new Error(`Limite diário atingido. Máximo por dia: R$ ${LOAN_DAILY_LIMIT}`);
                }

                const debtAdded = roundMoney(normalizedAmount * (1 + LOAN_INTEREST_RATE));
                const newDebt = roundMoney(state.loanDebt + debtAdded);
                if (newDebt > LOAN_MAX_DEBT) {
                    throw new Error(`Limite de dívida atingido. Dívida máxima: R$ ${LOAN_MAX_DEBT}`);
                }

                const newBalance = roundMoney(state.balance + normalizedAmount);
                const newLoanWallet = roundMoney(state.loanWalletBalance + normalizedAmount);

                const loanEntry = {
                    type: 'loan_request',
                    requestedAmount: normalizedAmount,
                    debtAdded,
                    totalDebtAfter: newDebt,
                    date: nowIso
                };
                const txRecord = {
                    type: 'loan_credit',
                    amount: normalizedAmount,
                    debtAdded,
                    reason: 'loan_request',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    beforeBalance: state.balance,
                    afterBalance: newBalance
                };

                const historyEntries = resetEntry ? [resetEntry, loanEntry] : [loanEntry];
                commitLoanAwareUserUpdate(
                    transaction,
                    userRef,
                    {
                        balance: newBalance,
                        loanDebt: newDebt,
                        loanWalletBalance: newLoanWallet,
                        loanBorrowedToday: borrowedTodayAfter,
                        loanDayKey: state.loanDayKey,
                        lastTransaction: txRecord
                    },
                    historyEntries
                );

                if (window.db.collection('audit_logs')) {
                    transaction.set(window.db.collection('audit_logs').doc(), {
                        userId,
                        action: 'loan_request',
                        ...txRecord,
                        loanDebtAfter: newDebt
                    });
                }

                return {
                    newBalance,
                    newDebt,
                    newLoanWallet,
                    newBorrowedToday: borrowedTodayAfter,
                    loanEntry
                };
            });

            window.userBalance = result.newBalance;
            window.userLoanDebt = result.newDebt;
            window.userLoanWalletBalance = result.newLoanWallet;
            window.userLoanBorrowedToday = result.newBorrowedToday;
            window.userLoanDayKey = todayKey;

            return {
                success: true,
                newBalance: result.newBalance,
                newDebt: result.newDebt,
                loanEntry: result.loanEntry
            };
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao solicitar empréstimo: ${error.message}`);
            throw error;
        }
    };

    const repayLoan = async (userId, amount) => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }
        if (!Number.isFinite(amount)) {
            throw new Error('Valor inválido');
        }

        const normalizedAmount = roundMoney(amount);
        if (normalizedAmount <= 0) {
            throw new Error('Valor de pagamento deve ser positivo');
        }

        const userRef = window.db.collection('users').doc(userId);
        const nowIso = new Date().toISOString();
        const todayKey = dateKey();

        try {
            const result = await window.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                const baseState = normalizeLoanState(userDoc.data(), todayKey);
                const { state, resetEntry } = applyDailyLoanReset(baseState, todayKey);

                if (state.loanDebt <= 0) {
                    throw new Error('Você não possui dívida ativa');
                }

                const paymentAmount = roundMoney(Math.min(normalizedAmount, state.loanDebt));
                if (state.balance < paymentAmount) {
                    throw new Error(`Saldo insuficiente para pagamento. Saldo: R$ ${state.balance.toFixed(2)}`);
                }

                const newBalance = roundMoney(state.balance - paymentAmount);
                const newDebt = roundMoney(state.loanDebt - paymentAmount);
                const newLoanWallet = roundMoney(Math.max(0, state.loanWalletBalance - paymentAmount));

                const loanEntry = {
                    type: 'loan_payment_money',
                    paidAmount: paymentAmount,
                    totalDebtAfter: newDebt,
                    date: nowIso
                };
                const txRecord = {
                    type: 'loan_payment',
                    amount: paymentAmount,
                    reason: 'loan_repayment_money',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    beforeBalance: state.balance,
                    afterBalance: newBalance
                };

                const historyEntries = resetEntry ? [resetEntry, loanEntry] : [loanEntry];
                commitLoanAwareUserUpdate(
                    transaction,
                    userRef,
                    {
                        balance: newBalance,
                        loanDebt: newDebt,
                        loanWalletBalance: newLoanWallet,
                        loanBorrowedToday: state.loanBorrowedToday,
                        loanDayKey: state.loanDayKey,
                        lastTransaction: txRecord
                    },
                    historyEntries
                );

                if (window.db.collection('audit_logs')) {
                    transaction.set(window.db.collection('audit_logs').doc(), {
                        userId,
                        action: 'loan_repayment_money',
                        ...txRecord,
                        loanDebtAfter: newDebt
                    });
                }

                return {
                    paymentAmount,
                    newBalance,
                    newDebt,
                    newLoanWallet,
                    loanBorrowedToday: state.loanBorrowedToday,
                    loanDayKey: state.loanDayKey,
                    loanEntry
                };
            });

            window.userBalance = result.newBalance;
            window.userLoanDebt = result.newDebt;
            window.userLoanWalletBalance = result.newLoanWallet;
            window.userLoanBorrowedToday = result.loanBorrowedToday;
            window.userLoanDayKey = result.loanDayKey;

            return {
                success: true,
                paymentAmount: result.paymentAmount,
                newBalance: result.newBalance,
                newDebt: result.newDebt,
                loanEntry: result.loanEntry
            };
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao pagar empréstimo: ${error.message}`);
            throw error;
        }
    };

    const repayLoanWithGames = async (userId, gameIds) => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }
        if (!Array.isArray(gameIds) || gameIds.length === 0) {
            throw new Error('Selecione ao menos um jogo para pagamento');
        }

        const userRef = window.db.collection('users').doc(userId);
        const nowIso = new Date().toISOString();
        const todayKey = dateKey();

        try {
            const result = await window.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                const userData = userDoc.data();
                const baseState = normalizeLoanState(userData, todayKey);
                const { state, resetEntry } = applyDailyLoanReset(baseState, todayKey);
                if (state.loanDebt <= 0) {
                    throw new Error('Você não possui dívida ativa');
                }

                const library = Array.isArray(userData.library) ? [...userData.library] : [];
                const upgrades = userData.upgrades && typeof userData.upgrades === 'object' ? { ...userData.upgrades } : {};

                const normalizedGameIds = [...new Set(gameIds.map((id) => String(id)))];
                const paidGames = [];
                let totalGamesValue = 0;

                normalizedGameIds.forEach((gameId) => {
                    const owned = library.some((item) => String(item) === gameId);
                    if (!owned) {
                        throw new Error(`Você não possui o jogo ${gameId}`);
                    }

                    const valuationInfo = getGameValuation(gameId, upgrades);
                    totalGamesValue = roundMoney(totalGamesValue + valuationInfo.valuation);
                    paidGames.push({
                        gameId,
                        title: valuationInfo.game.title,
                        upgradeLevel: valuationInfo.upgradeLevel,
                        valuation: valuationInfo.valuation
                    });
                });

                if (totalGamesValue <= 0) {
                    throw new Error('Nenhum valor válido encontrado nos jogos selecionados');
                }

                const paymentAmount = roundMoney(Math.min(totalGamesValue, state.loanDebt));
                const newDebt = roundMoney(state.loanDebt - paymentAmount);

                const updatedLibrary = library.filter((item) => !normalizedGameIds.includes(String(item)));
                normalizedGameIds.forEach((id) => {
                    delete upgrades[id];
                    if (!Number.isNaN(Number(id))) {
                        delete upgrades[Number(id)];
                    }
                });

                const loanEntry = {
                    type: 'loan_payment_games',
                    paidAmount: paymentAmount,
                    gamesValue: totalGamesValue,
                    gamesUsed: paidGames,
                    totalDebtAfter: newDebt,
                    date: nowIso
                };

                const historyEntries = resetEntry ? [resetEntry, loanEntry] : [loanEntry];
                commitLoanAwareUserUpdate(
                    transaction,
                    userRef,
                    {
                        library: updatedLibrary,
                        upgrades,
                        loanDebt: newDebt,
                        loanWalletBalance: state.loanWalletBalance,
                        loanBorrowedToday: state.loanBorrowedToday,
                        loanDayKey: state.loanDayKey
                    },
                    historyEntries
                );

                if (window.db.collection('audit_logs')) {
                    transaction.set(window.db.collection('audit_logs').doc(), {
                        userId,
                        action: 'loan_repayment_games',
                        paymentAmount,
                        gamesValue: totalGamesValue,
                        gamesCount: paidGames.length,
                        loanDebtAfter: newDebt,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }

                return {
                    paymentAmount,
                    totalGamesValue,
                    newDebt,
                    loanBorrowedToday: state.loanBorrowedToday,
                    loanDayKey: state.loanDayKey,
                    updatedLibrary,
                    updatedUpgrades: upgrades,
                    loanEntry,
                    paidGames
                };
            });

            window.userLoanDebt = result.newDebt;
            window.userLibrary = result.updatedLibrary;
            window.userUpgrades = result.updatedUpgrades;
            window.userLoanBorrowedToday = result.loanBorrowedToday;
            window.userLoanDayKey = result.loanDayKey;

            return {
                success: true,
                paymentAmount: result.paymentAmount,
                totalGamesValue: result.totalGamesValue,
                newDebt: result.newDebt,
                paidGames: result.paidGames,
                loanEntry: result.loanEntry
            };
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao pagar empréstimo com jogos: ${error.message}`);
            throw error;
        }
    };

    const resetUserProgressOnLoanMax = async (userId) => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }

        const userRef = window.db.collection('users').doc(userId);
        const todayKey = dateKey();
        const resetIso = new Date().toISOString();

        try {
            const result = await window.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                const userData = userDoc.data();
                const debt = roundMoney(userData.loanDebt || 0);
                if (debt < LOAN_MAX_DEBT) {
                    throw new Error('Reset emergencial só fica disponível ao atingir a dívida máxima');
                }

                const resetEntry = {
                    type: 'loan_max_reset',
                    date: resetIso,
                    totalDebtAfter: 0
                };

                transaction.update(userRef, {
                    balance: 0,
                    loanDebt: 0,
                    loanWalletBalance: 0,
                    loanBorrowedToday: 0,
                    loanDayKey: todayKey,
                    library: [],
                    upgrades: {},
                    cart: [],
                    lastTransaction: {
                        type: 'loan_max_reset',
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        beforeDebt: debt,
                        afterDebt: 0
                    }
                });

                transaction.update(userRef, {
                    loanHistory: firebase.firestore.FieldValue.arrayUnion(resetEntry)
                });

                if (window.db.collection('audit_logs')) {
                    transaction.set(window.db.collection('audit_logs').doc(), {
                        userId,
                        action: 'loan_max_reset',
                        beforeDebt: debt,
                        afterDebt: 0,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }

                return {
                    resetEntry,
                    beforeDebt: debt
                };
            });

            window.userBalance = 0;
            window.userLoanDebt = 0;
            window.userLoanWalletBalance = 0;
            window.userLoanBorrowedToday = 0;
            window.userLibrary = [];
            window.userUpgrades = {};
            window.userCart = [];
            window.userLoanDayKey = todayKey;

            return {
                success: true,
                resetEntry: result.resetEntry,
                beforeDebt: result.beforeDebt
            };
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao resetar progresso por dívida máxima: ${error.message}`);
            throw error;
        }
    };

    const purchaseGameTransaction = async (userId, gameIds, totalPrice, purchaseRecord = null) => {
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
        const todayKey = dateKey();

        try {
            const result = await window.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                const userData = userDoc.data();
                const baseState = normalizeLoanState(userData, todayKey);
                const { state, resetEntry } = applyDailyLoanReset(baseState, todayKey);
                const currentLibrary = userData.library || [];
                const currentCart = userData.cart || [];

                if (state.balance < totalPrice) {
                    throw new Error(`Saldo insuficiente. Saldo: R$ ${state.balance}, Necessário: R$ ${totalPrice}`);
                }

                const duplicates = gameIds.filter((id) => currentLibrary.includes(id));
                if (duplicates.length > 0) {
                    throw new Error(`Alguns jogos já estão na sua biblioteca: ${duplicates.join(', ')}`);
                }

                const newBalance = roundMoney(state.balance - totalPrice);
                const newLoanWallet = roundMoney(Math.max(0, state.loanWalletBalance - totalPrice));
                const newLibrary = [...new Set([...currentLibrary, ...gameIds])];
                const newCart = currentCart.filter((id) => !gameIds.includes(id));

                const updatePayload = {
                    balance: newBalance,
                    library: newLibrary,
                    cart: newCart,
                    loanDebt: state.loanDebt,
                    loanWalletBalance: newLoanWallet,
                    loanBorrowedToday: state.loanBorrowedToday,
                    loanDayKey: state.loanDayKey,
                    lastPurchase: firebase.firestore.FieldValue.serverTimestamp()
                };

                if (purchaseRecord) {
                    updatePayload.history = firebase.firestore.FieldValue.arrayUnion(purchaseRecord);
                }

                commitLoanAwareUserUpdate(
                    transaction,
                    userRef,
                    updatePayload,
                    resetEntry ? [resetEntry] : []
                );

                if (ENABLE_PURCHASE_AUDIT_LOG && window.db.collection('purchase_history')) {
                    transaction.set(window.db.collection('purchase_history').doc(), {
                        userId,
                        gameIds,
                        totalPrice,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        balanceAfter: newBalance
                    });
                }

                return {
                    newBalance,
                    newLoanWallet,
                    loanBorrowedToday: state.loanBorrowedToday,
                    loanDayKey: state.loanDayKey,
                    library: newLibrary,
                    gamesPurchased: gameIds.length
                };
            });

            window.userBalance = result.newBalance;
            window.userLoanWalletBalance = result.newLoanWallet;
            window.userLoanBorrowedToday = result.loanBorrowedToday;
            window.userLoanDayKey = result.loanDayKey;
            window.userLibrary = result.library;
            window.userCart = [];

            return {
                success: true,
                newBalance: result.newBalance,
                library: result.library,
                gamesPurchased: result.gamesPurchased
            };
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao comprar jogos: ${error.message}`);
            throw error;
        }
    };

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
                    lastModified: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            return { success: true };
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao atualizar ${fieldName}: ${error.message}`);
            throw error;
        }
    };

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

                transaction.update(userRef, { [fieldName]: newValue });
                return { newValue };
            });

            return result;
        } catch (error) {
            SecurityModule?.logger?.error(`Erro ao incrementar ${fieldName}: ${error.message}`);
            throw error;
        }
    };

    const batchUpdateUserData = async (userId, updates) => {
        if (!window.db || !userId) {
            throw new Error('Database ou userId não definido');
        }

        const userRef = window.db.collection('users').doc(userId);

        try {
            for (const [key] of Object.entries(updates)) {
                if (typeof key !== 'string' || key.trim() === '') {
                    throw new Error(`Chave inválida: ${key}`);
                }
            }

            await window.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('Usuário não encontrado');
                }

                transaction.update(userRef, {
                    ...updates,
                    lastModified: firebase.firestore.FieldValue.serverTimestamp()
                });
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
        requestLoan,
        repayLoan,
        repayLoanWithGames,
        resetUserProgressOnLoanMax,
        syncDailyLoanState,
        LOAN_MIN_AMOUNT,
        LOAN_MAX_AMOUNT,
        LOAN_DAILY_LIMIT,
        LOAN_INTEREST_RATE,
        LOAN_MAX_DEBT,
        purchaseGameTransaction,
        updateUserArray,
        incrementCounter,
        batchUpdateUserData
    };
})();

if (typeof window !== 'undefined') {
    window.FirebaseTransactions = FirebaseTransactions;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseTransactions;
}
