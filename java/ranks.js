/**
 * SISTEMA DE RANKS E UPGRADES
 * Centraliza multiplicadores, labels e classes visuais.
 */

console.log('✅ ranks.js loaded');

window.RankSystem = {
    // Multiplicadores de valor por Rank
    multipliers: { 
        0: 1,      // Padrão
        1: 1.5,    // Raro (+)
        2: 2.5,    // Épico (++)
        3: 4.0,    // Lendário (+++)
        4: 12.0    // Dark Matter (!!!!) - Valor massivo para o rank final
    },

    // Retorna os metadados de cada Rank
    getRankMetadata: (level) => {
        switch (level) {
            case 4: return { label: 'Dark Matter', class: 'rank-dark-matter', aura: 'upgrade-aura-4' };
            case 3: return { label: '+++', class: 'rank-legendary', aura: 'upgrade-aura-3' };
            case 2: return { label: '++', class: 'rank-epic', aura: 'upgrade-aura-2' };
            case 1: return { label: '+', class: 'rank-rare', aura: 'upgrade-aura-1' };
            default: return { label: '', class: '', aura: '', media: '' };
        }
    },

    // Gera o HTML do selo de upgrade
    getUpgradeHtml: (gameId) => {
        const level = (window.userUpgrades && window.userUpgrades[gameId]) || 0;
        if (level === 0) return '';
        const meta = window.RankSystem.getRankMetadata(level);
        return `<span class="upgrade-rank ${meta.class}">${meta.label}</span>`;
    },

    // Calcula o valor de mercado atualizado
    calculateValuation: (basePrice, level) => {
        const multiplier = window.RankSystem.multipliers[level] || 1;
        const result = basePrice * multiplier;
        
        // Debug se level é 1 e resultado não é esperado
        if (level === 1 && Math.abs(result - (basePrice * 1.5)) > 0.01) {
            console.warn('[VALUATION BUG] level=1 mas resultado errado:', {
                basePrice,
                level,
                multiplier,
                'multipliers[1]': window.RankSystem.multipliers[1],
                'expected': basePrice * 1.5,
                'actual': result
            });
        }
        
        return result;
    }
};

// Compatibilidade com chamadas antigas
window.getUpgradeHtml = window.RankSystem.getUpgradeHtml;
