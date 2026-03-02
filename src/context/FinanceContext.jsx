import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateId } from '../utils/formatters';

const FinanceContext = createContext();
export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
    const [cards, setCards] = useLocalStorage('fin_cards', []);
    const [purchases, setPurchases] = useLocalStorage('fin_purchases', []);
    const [expenses, setExpenses] = useLocalStorage('fin_expenses', []);
    const [incomes, setIncomes] = useLocalStorage('fin_incomes', []);
    const [accounts, setAccounts] = useLocalStorage('fin_accounts', []);
    const [cryptos, setCryptos] = useLocalStorage('fin_cryptos', []);

    const addCard = (card) => setCards(prev => [...prev, { ...card, id: generateId() }]);
    const updateCard = (id, data) => setCards(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    const deleteCard = (id) => { setCards(prev => prev.filter(c => c.id !== id)); setPurchases(prev => prev.filter(p => p.cardId !== id)); };

    const addPurchase = (purchase) => setPurchases(prev => [...prev, { ...purchase, id: generateId() }]);
    const updatePurchase = (id, data) => setPurchases(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    const deletePurchase = (id) => setPurchases(prev => prev.filter(p => p.id !== id));

    const addExpense = (expense) => setExpenses(prev => [...prev, { ...expense, id: generateId() }]);
    const updateExpense = (id, data) => setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    const deleteExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id));

    const addIncome = (income) => setIncomes(prev => [...prev, { ...income, id: generateId() }]);
    const updateIncome = (id, data) => setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    const deleteIncome = (id) => setIncomes(prev => prev.filter(i => i.id !== id));

    const addAccount = (account) => setAccounts(prev => [...prev, { ...account, id: generateId() }]);
    const updateAccount = (id, data) => setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    const deleteAccount = (id) => setAccounts(prev => prev.filter(a => a.id !== id));

    const addCrypto = (crypto) => setCryptos(prev => [...prev, { ...crypto, id: generateId() }]);
    const updateCrypto = (id, data) => setCryptos(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    const deleteCrypto = (id) => setCryptos(prev => prev.filter(c => c.id !== id));

    const totalBankBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    const monthlyFixedIncome = incomes.filter(i => i.type === 'fixed').reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const monthlyFixedExpenses = expenses.filter(e => e.recurrence === 'monthly').reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const getInstallmentsForMonth = (year, month) => {
        return purchases.reduce((sum, p) => {
            const start = new Date(p.startDate + '-01');
            const end = new Date(start.getFullYear(), start.getMonth() + Number(p.installments), 0);
            const target = new Date(year, month - 1, 1);
            if (target >= start && target <= end) sum += Number(p.amount) / Number(p.installments);
            return sum;
        }, 0);
    };

    const now = new Date();
    const currentMonthInstallments = getInstallmentsForMonth(now.getFullYear(), now.getMonth() + 1);

    const get12MonthProjection = () => {
        const projection = [];
        let runningBalance = totalBankBalance;
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const y = d.getFullYear(), m = d.getMonth() + 1;
            const fixedInc = incomes.filter(inc => inc.type === 'fixed').reduce((s, inc) => s + Number(inc.amount || 0), 0);
            const variableInc = incomes.filter(inc => inc.type !== 'fixed').filter(inc => { const id = new Date(inc.date); return id.getFullYear() === y && id.getMonth() + 1 === m; }).reduce((s, inc) => s + Number(inc.amount || 0), 0);
            const totalInc = fixedInc + variableInc;
            const fixedExp = expenses.filter(e => e.recurrence === 'monthly').reduce((s, e) => s + Number(e.amount || 0), 0);
            const yearlyExp = expenses.filter(e => e.recurrence === 'yearly').filter(e => { const ed = new Date(e.date); return ed.getMonth() + 1 === m; }).reduce((s, e) => s + Number(e.amount || 0), 0);
            const onceExp = expenses.filter(e => e.recurrence === 'once').filter(e => { const ed = new Date(e.date); return ed.getFullYear() === y && ed.getMonth() + 1 === m; }).reduce((s, e) => s + Number(e.amount || 0), 0);
            const cardExp = getInstallmentsForMonth(y, m);
            const totalExp = fixedExp + yearlyExp + onceExp + cardExp;
            const net = totalInc - totalExp;
            runningBalance += net;
            projection.push({ month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), income: totalInc, expenses: totalExp, net, balance: runningBalance });
        }
        return projection;
    };

    const getExpensesByCategory = () => {
        const catMap = {};
        expenses.filter(e => e.recurrence === 'monthly').forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount || 0); });
        if (currentMonthInstallments > 0) catMap['Cartão'] = (catMap['Cartão'] || 0) + currentMonthInstallments;
        return Object.entries(catMap).map(([name, value]) => ({ name, value }));
    };

    return (
        <FinanceContext.Provider value={{
            cards, purchases, expenses, incomes, accounts, cryptos,
            addCard, updateCard, deleteCard,
            addPurchase, updatePurchase, deletePurchase,
            addExpense, updateExpense, deleteExpense,
            addIncome, updateIncome, deleteIncome,
            addAccount, updateAccount, deleteAccount,
            addCrypto, updateCrypto, deleteCrypto,
            totalBankBalance, monthlyFixedIncome, monthlyFixedExpenses,
            currentMonthInstallments, getInstallmentsForMonth,
            get12MonthProjection, getExpensesByCategory,
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
