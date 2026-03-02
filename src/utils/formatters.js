export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
};

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

export const getCurrentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const categoryColors = {
    'Educação': '#4f8ef7', 'Impostos': '#f43f5e', 'Moradia': '#7c3aed',
    'Saúde': '#00d4aa', 'Lazer': '#fbbf24', 'Alimentação': '#f97316',
    'Transporte': '#06b6d4', 'Cartão': '#a855f7', 'Outros': '#6b7280',
};

export const getCategoryColor = (category) => categoryColors[category] || '#6b7280';

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
