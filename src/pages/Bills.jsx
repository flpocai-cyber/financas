import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getCategoryColor } from '../utils/formatters';
import { Calendar, CheckCircle, XCircle, CreditCard } from 'lucide-react';

export default function Bills() {
    const { expenses, accounts, cards, payExpense } = useFinance();
    const [payModal, setPayModal] = useState(null);
    const [payMethod, setPayMethod] = useState('account');
    const [paySource, setPaySource] = useState('');

    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const todayDay = now.getDate();

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Calendar size={24} className="text-[#00d4aa]" />
                        Contas a Pagar
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">Gerencie os vencimentos de {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;

                    // Despesas que vencem nesse dia
                    const dayBills = expenses.filter(e => {
                        if (!e.date) return false;
                        const parts = e.date.split('-');
                        const eDay = parseInt(parts[2]);
                        const eMonth = parts[1];
                        const eYear = parts[0];
                        const currentMonth = monthStr.split('-')[1];
                        const currentYear = monthStr.split('-')[0];

                        if (eDay !== day) return false;

                        // Eventual: só aparece no mês/ano exato
                        if (e.recurrence === 'once' && (eMonth !== currentMonth || eYear !== currentYear)) return false;
                        // Anual: só aparece no mês cadastrado
                        if (e.recurrence === 'yearly' && eMonth !== currentMonth) return false;
                        // Mensal: aparece todo mês nesse dia ✓

                        return true;
                    });

                    if (dayBills.length === 0) return null;

                    return (
                        <div key={day} className={`card border ${day === todayDay ? 'border-[#00d4aa]/50 bg-[#00d4aa]/5' : 'border-[#1e1e32]'}`}>
                            <div className="flex items-center justify-between mb-3 border-b border-[#1e1e32]/50 pb-2">
                                <h4 className={`font-bold ${day === todayDay ? 'text-[#00d4aa]' : 'text-white'}`}>Dia {day} {day === todayDay && '(Hoje)'}</h4>
                            </div>
                            <div className="space-y-3">
                                {dayBills.map(bill => {
                                    const isPaid = (bill.paidMonths || []).includes(monthStr);
                                    return (
                                        <div key={bill.id} className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ background: getCategoryColor(bill.category) }} />
                                                    <span className={`text-sm ${isPaid ? 'text-gray-500 line-through' : 'text-white font-medium'}`}>{bill.description}</span>
                                                </div>
                                                <span className={`text-sm font-bold ${isPaid ? 'text-gray-500' : 'text-[#f43f5e]'}`}>{formatCurrency(bill.amount)}</span>
                                            </div>
                                            {!isPaid ? (
                                                <div className="flex justify-end mt-1">
                                                    <button onClick={() => {
                                                        setPayModal({ expense: bill, monthStr });
                                                        setPayMethod('account');
                                                        setPaySource(accounts[0]?.id || '');
                                                    }} className="text-xs bg-[#00d4aa]/20 text-[#00d4aa] hover:bg-[#00d4aa]/30 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium">
                                                        Pagar Agora
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end mt-1">
                                                    <span className="text-xs text-[#00d4aa] flex items-center gap-1 font-medium"><CheckCircle size={14} />Pago</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
                {expenses.filter(e => e.date).length === 0 && (
                    <div className="col-span-3 card flex flex-col items-center justify-center py-16 text-center">
                        <Calendar size={40} className="text-gray-700 mb-3" />
                        <p className="text-gray-400 font-medium">Nenhuma conta com vencimento cadastrado</p>
                        <p className="text-gray-600 text-sm mt-1">Vá em <strong className="text-gray-400">Despesas</strong> e adicione uma despesa com data de vencimento.</p>
                    </div>
                )}
            </div>

            {/* Modal de Pagamento */}
            {payModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><CreditCard className="text-[#00d4aa]" size={20} /> Pagar Conta</h3>
                            <button onClick={() => setPayModal(null)} className="text-gray-500 hover:text-white"><XCircle size={20} /></button>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">Como você gostaria de pagar <span className="text-white font-medium">{payModal.expense.description} ({formatCurrency(payModal.expense.amount)})</span>?</p>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Método de Pagamento</label>
                                <div className="flex bg-[#0f0f1a] rounded-lg p-1 mt-1">
                                    <button onClick={() => { setPayMethod('account'); setPaySource(accounts[0]?.id || ''); }} className={`flex-1 text-sm py-2 rounded-md transition-all font-medium ${payMethod === 'account' ? 'bg-[#2d2d4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Débito em Conta</button>
                                    <button onClick={() => { setPayMethod('card'); setPaySource(cards[0]?.id || ''); }} className={`flex-1 text-sm py-2 rounded-md transition-all font-medium ${payMethod === 'card' ? 'bg-[#2d2d4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Cartão de Crédito</button>
                                </div>
                            </div>

                            {payMethod === 'account' ? (
                                <div>
                                    <label className="label">Qual a conta de origem?</label>
                                    <select className="input" value={paySource} onChange={(e) => setPaySource(e.target.value)}>
                                        {accounts.length === 0 && <option value="" disabled>Nenhuma conta cadastrada</option>}
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nickname || acc.bank} (Saldo: {formatCurrency(acc.balance)})</option>)}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">O valor será subtraído imediatamente do saldo real da sua conta.</p>
                                </div>
                            ) : (
                                <div>
                                    <label className="label">Qual o cartão de crédito?</label>
                                    <select className="input" value={paySource} onChange={(e) => setPaySource(e.target.value)}>
                                        {cards.length === 0 && <option value="" disabled>Nenhum cartão cadastrado</option>}
                                        {cards.map(card => <option key={card.id} value={card.id}>{card.name} (Fecha dia {card.closingDay})</option>)}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">O valor será alocado na fatura do mês correspondente à regra de fechamento do cartão.</p>
                                </div>
                            )}

                            <button
                                disabled={!paySource}
                                onClick={async () => {
                                    if (paySource) {
                                        await payExpense(payModal.expense.id, payModal.monthStr, payMethod, paySource);
                                        setPayModal(null);
                                    }
                                }}
                                className="w-full btn-primary py-3 text-sm font-semibold mt-2"
                            >
                                Confirmar Pagamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
