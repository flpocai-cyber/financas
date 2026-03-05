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

// Returns a valid Date or null — prevents crashes from empty/invalid date strings
const safeDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
};

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
        const monthStr = now.toISOString().slice(0, 7);
        // Exclude incomes that are already marked as received for this exact period
        // For weekly incomes, we need to check if the specific occurrence was paid, which we'll handle by passing an exact periodKey like `2026-03-WK1`

        if (i.type === 'fixed') {
            if ((i.receivedPeriods || []).includes(monthStr)) return sum;
            return sum + Number(i.amount || 0);
        }
        if (i.type === 'once') {
            if ((i.receivedPeriods || []).includes(monthStr)) return sum;
            if (new Date(i.date).toISOString().slice(0, 7) === monthStr) return sum + Number(i.amount || 0);
            return sum;
        }
        if (i.type === 'weekly') {
            const count = getWeekdaysInMonth(now.getFullYear(), now.getMonth() + 1, i.dayOfWeek);
            let pendingCount = count;

            // Subtrai do contador cada semana que já foi recebida no mês atual
            for (let occurrence = 1; occurrence <= count; occurrence++) {
                const periodKey = `${monthStr}-WK${occurrence}`;
                if ((i.receivedPeriods || []).includes(periodKey)) {
                    pendingCount--;
                }
            }
            return sum + (Number(i.amount || 0) * pendingCount);
        }
        return sum;
    }, 0);

    // Calcula o "Gastos do Mês" filtrando aquilo que já foi pago nesse exato mês para não deduzir duas vezes
    const monthlyFixedExpenses = expenses.reduce((sum, e) => {
        const monthStr = now.toISOString().slice(0, 7);
        const isPaid = (e.paidMonths || []).includes(monthStr);
        if (isPaid) return sum;

        if (e.recurrence === 'monthly') return sum + Number(e.amount || 0);
        if (e.recurrence === 'yearly') {
            const d = safeDate(e.date);
            if (d && d.getMonth() === now.getMonth()) return sum + Number(e.amount || 0);
            return sum;
        }
        if (e.recurrence === 'once') {
            const d = safeDate(e.date);
            if (d && d.toISOString().slice(0, 7) === monthStr) return sum + Number(e.amount || 0);
            return sum;
        }

        return sum;
    }, 0);

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

            // Calculo da renda e gastos normais
            const fixedInc = incomes.reduce((s, inc) => {
                if (inc.type === 'fixed') return s + Number(inc.amount || 0);
                if (inc.type === 'weekly') {
                    const count = getWeekdaysInMonth(y, m, inc.dayOfWeek);
                    return s + (Number(inc.amount || 0) * count);
                }
                return s;
            }, 0);
            const variableInc = incomes.filter(inc => inc.type === 'variable' || inc.type === 'once').filter(inc => { const id = safeDate(inc.date); return id && id.getFullYear() === y && id.getMonth() + 1 === m; }).reduce((s, inc) => s + Number(inc.amount || 0), 0);
            const totalInc = fixedInc + variableInc;

            const monthStr = `${y}-${m.toString().padStart(2, '0')}`;
            const fixedExp = expenses.filter(e => e.recurrence === 'monthly' && !(e.paidMonths || []).includes(monthStr)).reduce((s, e) => s + Number(e.amount || 0), 0);
            const yearlyExp = expenses.filter(e => e.recurrence === 'yearly' && !(e.paidMonths || []).includes(monthStr)).filter(e => { const ed = safeDate(e.date); return ed && ed.getMonth() + 1 === m; }).reduce((s, e) => s + Number(e.amount || 0), 0);
            const onceExp = expenses.filter(e => e.recurrence === 'once' && !(e.paidMonths || []).includes(monthStr)).filter(e => { const ed = safeDate(e.date); return ed && ed.getFullYear() === y && ed.getMonth() + 1 === m; }).reduce((s, e) => s + Number(e.amount || 0), 0);
            const cardExp = getInstallmentsForMonth(y, m);
            const totalExp = fixedExp + yearlyExp + onceExp + cardExp;

            // Calculo dos gastos provenientes apenas dos planos de simulacao
            const plannedExpenses = plans.reduce((s, p) => {
                if (!p || !p.startMonth) return s;
                const start = new Date(p.startMonth + '-01');
                const end = new Date(start.getFullYear(), start.getMonth() + Number(p.installments || 1), 0);
                const target = new Date(y, m - 1, 1);
                if (target >= start && target <= end) {
                    s += (Number(p.amount || 0) / Number(p.installments || 1));
                }
                return s;
            }, 0);

            const net = totalInc - totalExp;
            runningBalance += net;

            projection.push({
                month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                income: totalInc,
                expenses: totalExp,
                plannedExpenses: plannedExpenses,
                net,
                balance: runningBalance
            });
        }
        return projection;
    };

    const getExpensesByCategory = () => {
        const catMap = {};
        const monthStr = now.toISOString().slice(0, 7);
        expenses.filter(e => e.recurrence === 'monthly' && !(e.paidMonths || []).includes(monthStr)).forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount || 0); });
        if (currentMonthInstallments > 0) catMap['Cartão'] = (catMap['Cartão'] || 0) + currentMonthInstallments;
        return Object.entries(catMap).map(([name, value]) => ({ name, value }));
    };

    const payExpense = async (expenseId, monthStr, paymentMethod, sourceId) => {
        const exp = expenses.find(e => e.id === expenseId);
        if (!exp) return;

        // Deduzir ou adicionar na fatura
        if (paymentMethod === 'account') {
            const acc = accounts.find(a => a.id === sourceId);
            if (acc) {
                await updateAccount(acc.id, { balance: Number(acc.balance) - Number(exp.amount) });
            }
        } else if (paymentMethod === 'card') {
            const card = cards.find(c => c.id === sourceId);
            if (card) {
                const today = new Date();
                const currentDay = today.getDate();
                let targetMonth = today.getMonth() + 1;
                let targetYear = today.getFullYear();

                if (currentDay >= Number(card.closingDay)) {
                    targetMonth += 1;
                    if (targetMonth > 12) {
                        targetMonth = 1;
                        targetYear += 1;
                    }
                }
                const paddedMonth = targetMonth.toString().padStart(2, '0');
                const startDate = `${targetYear}-${paddedMonth}`;

                await addPurchase({
                    cardId: card.id,
                    description: `Pgto: ${exp.description}`,
                    amount: exp.amount,
                    installments: '1',
                    startDate
                });
            }
        }

        // Marcar como pago
        const paidMonths = exp.paidMonths || [];
        if (!paidMonths.includes(monthStr)) {
            await updateExpense(exp.id, { paidMonths: [...paidMonths, monthStr] });
        }
    };

    const receiveIncome = async (incomeId, periodKey, targetAccountId) => {
        const inc = incomes.find(i => i.id === incomeId);
        if (!inc) return;

        // Adicionar o dinheiro na conta, caso não seja "cash" (Dinheiro Físico/Sem Conta)
        if (targetAccountId && targetAccountId !== 'cash') {
            const acc = accounts.find(a => a.id === targetAccountId);
            if (acc) {
                await updateAccount(acc.id, { balance: Number(acc.balance) + Number(inc.amount) });
            }
        }

        // Marcar a ocorrência como recebida
        const receivedPeriods = inc.receivedPeriods || [];
        if (!receivedPeriods.includes(periodKey)) {
            await updateIncome(inc.id, { receivedPeriods: [...receivedPeriods, periodKey] });
        }
    };

    return (
        <FinanceContext.Provider value={{
            cards, purchases, expenses, incomes, accounts, cryptos, plans,
            addCard, updateCard, deleteCard,
            addPurchase, updatePurchase, deletePurchase,
            addExpense, updateExpense, deleteExpense, payExpense,
            addIncome, updateIncome, deleteIncome, receiveIncome,
            addAccount, updateAccount, deleteAccount,
            addCrypto, updateCrypto, deleteCrypto,
            addPlan, updatePlan, deletePlan,
            totalBankBalance, monthlyFixedIncome, monthlyFixedExpenses,
            currentMonthInstallments, getInstallmentsForMonth, getInstallmentsForCardAndMonth, getInstallmentsBreakdownForMonth,
            get12MonthProjection, getExpensesByCategory
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
