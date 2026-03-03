import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    collection, doc, onSnapshot, addDoc, deleteDoc, updateDoc, setDoc, getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateId } from '../utils/formatters';

const FinanceContext = createContext();
export const useFinance = () => useContext(FinanceContext);

// ID fixo do usuário (sem login por enquanto)
const USER_ID = 'default-user';

const getWeekdaysInMonth = (year, month, dayOfWeekName) => {
    const daysMap = {
        'Domingo': 0, 'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3,
        'Quinta-feira': 4, 'Sexta-feira': 5, 'Sábado': 6
    };
    const targetDay = daysMap[dayOfWeekName || 'Sexta-feira'];
    if (targetDay === undefined) return 4.33; // fallback se não tiver nenhum válido

    let count = 0;
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
        if (date.getDay() === targetDay) count++;
        date.setDate(date.getDate() + 1);
    }
    return count;
};

function useFirestoreCollection(collectionName) {
    const [data, setData] = useState([]);

    useEffect(() => {
        const colRef = collection(db, 'users', USER_ID, collectionName);
        const unsub = onSnapshot(colRef, (snap) => {
            setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [collectionName]);

    const add = async (item) => {
        const colRef = collection(db, 'users', USER_ID, collectionName);
        await addDoc(colRef, item);
    };

    const update = async (id, data) => {
        const docRef = doc(db, 'users', USER_ID, collectionName, id);
        await updateDoc(docRef, data);
    };

    const remove = async (id) => {
        const docRef = doc(db, 'users', USER_ID, collectionName, id);
        await deleteDoc(docRef);
    };

    return [data, add, update, remove];
}

export const FinanceProvider = ({ children }) => {
    const [cards, addCard_raw, updateCard, deleteCard_raw] = useFirestoreCollection('cards');
    const [purchases, addPurchase_raw, updatePurchase, deletePurchase] = useFirestoreCollection('purchases');
    const [expenses, addExpense_raw, updateExpense, deleteExpense] = useFirestoreCollection('expenses');
    const [incomes, addIncome_raw, updateIncome, deleteIncome] = useFirestoreCollection('incomes');
    const [accounts, addAccount_raw, updateAccount, deleteAccount] = useFirestoreCollection('accounts');
    const [cryptos, addCrypto_raw, updateCrypto, deleteCrypto] = useFirestoreCollection('cryptos');
    const [plans, addPlan_raw, updatePlan, deletePlan] = useFirestoreCollection('plans');

    const addCard = (card) => addCard_raw(card);
    const addPurchase = (purchase) => addPurchase_raw(purchase);
    const addExpense = (expense) => addExpense_raw(expense);
    const addIncome = (income) => addIncome_raw(income);
    const addAccount = (account) => addAccount_raw(account);
    const addCrypto = (crypto) => addCrypto_raw(crypto);
    const addPlan = (plan) => addPlan_raw(plan);

    const deleteCard = async (id) => {
        await deleteCard_raw(id);
        // Remove purchases associated with this card
        const cardPurchases = purchases.filter(p => p.cardId === id);
        for (const p of cardPurchases) {
            await deletePurchase(p.id);
        }
    };

    const totalBankBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    const now = new Date();
    const monthlyFixedIncome = incomes.reduce((sum, i) => {
        if (i.type === 'fixed') return sum + Number(i.amount || 0);
        if (i.type === 'weekly') {
            const count = getWeekdaysInMonth(now.getFullYear(), now.getMonth() + 1, i.dayOfWeek);
            return sum + (Number(i.amount || 0) * count);
        }
        return sum;
    }, 0);
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

    const getInstallmentsForCardAndMonth = (cardId, year, month) => {
        return purchases
            .filter(p => p.cardId === cardId)
            .reduce((sum, p) => {
                const start = new Date(p.startDate + '-01');
                const end = new Date(start.getFullYear(), start.getMonth() + Number(p.installments), 0);
                const target = new Date(year, month - 1, 1);
                if (target >= start && target <= end) sum += Number(p.amount) / Number(p.installments);
                return sum;
            }, 0);
    };

    const getInstallmentsBreakdownForMonth = (cardId, year, month) => {
        return purchases
            .filter(p => p.cardId === cardId)
            .reduce((breakdown, p) => {
                const start = new Date(p.startDate + '-01');
                const end = new Date(start.getFullYear(), start.getMonth() + Number(p.installments), 0);
                const target = new Date(year, month - 1, 1);
                if (target >= start && target <= end) {
                    const startYear = start.getFullYear();
                    const startMonth = start.getMonth();
                    const monthsPassed = (year - startYear) * 12 + (month - 1 - startMonth);
                    const currentInstallment = monthsPassed + 1;
                    breakdown.push({
                        ...p,
                        currentInstallment,
                        installmentValue: Number(p.amount) / Number(p.installments)
                    });
                }
                return breakdown;
            }, []);
    };

    const currentMonthInstallments = getInstallmentsForMonth(now.getFullYear(), now.getMonth() + 1);

    const get12MonthProjection = () => {
        const projection = [];
        let runningBalance = totalBankBalance;
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const y = d.getFullYear(), m = d.getMonth() + 1;
            const fixedInc = incomes.reduce((s, inc) => {
                if (inc.type === 'fixed') return s + Number(inc.amount || 0);
                if (inc.type === 'weekly') {
                    const count = getWeekdaysInMonth(y, m, inc.dayOfWeek);
                    return s + (Number(inc.amount || 0) * count);
                }
                return s;
            }, 0);
            const variableInc = incomes.filter(inc => inc.type === 'variable' || inc.type === 'once').filter(inc => { const id = new Date(inc.date); return id.getFullYear() === y && id.getMonth() + 1 === m; }).reduce((s, inc) => s + Number(inc.amount || 0), 0);
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
            cards, purchases, expenses, incomes, accounts, cryptos, plans,
            addCard, updateCard, deleteCard,
            addPurchase, updatePurchase, deletePurchase,
            addExpense, updateExpense, deleteExpense,
            addIncome, updateIncome, deleteIncome,
            addAccount, updateAccount, deleteAccount,
            addCrypto, updateCrypto, deleteCrypto,
            addPlan, updatePlan, deletePlan,
            totalBankBalance, monthlyFixedIncome, monthlyFixedExpenses,
            currentMonthInstallments, getInstallmentsForMonth, getInstallmentsForCardAndMonth, getInstallmentsBreakdownForMonth,
            get12MonthProjection, getExpensesByCategory,
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
