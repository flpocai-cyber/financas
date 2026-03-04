import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getCategoryColor } from '../utils/formatters';
import { Calendar, CheckCircle, XCircle, Wallet } from 'lucide-react';

export default function Receivables() {
    const { incomes, accounts, receiveIncome } = useFinance();
    const [receiveModal, setReceiveModal] = useState(null);
    const [receiveDest, setReceiveDest] = useState('');

    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const todayDay = now.getDate();

    // Map day of week name to JS getDay() integer
    const daysMap = {
        'Domingo': 0, 'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3,
        'Quinta-feira': 4, 'Sexta-feira': 5, 'Sábado': 6
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Calendar size={24} className="text-[#00d4aa]" />
                        Contas a Receber
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">Gerencie os recebimentos de {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateObj = new Date(now.getFullYear(), now.getMonth(), day);
                    const currentJsDay = dateObj.getDay();

                    // Find matching incomes
                    const dayIncomes = incomes.reduce((acc, inc) => {
                        let isMatch = false;
                        let periodKey = monthStr;

                        if (inc.type === 'fixed') {
                            if (Number(inc.dayOfMonth) === day) isMatch = true;
                        }
                        else if (inc.type === 'once') {
                            if (inc.date) {
                                const parts = inc.date.split('-');
                                if (parseInt(parts[2]) === day && parts[1] === monthStr.split('-')[1] && parts[0] === monthStr.split('-')[0]) {
                                    isMatch = true;
                                }
                            }
                        }
                        else if (inc.type === 'weekly') {
                            if (daysMap[inc.dayOfWeek] === currentJsDay) {
                                isMatch = true;

                                // Calculate which occurrence this is (1st Friday, 2nd Friday, etc)
                                let occurrence = 0;
                                for (let d = 1; d <= day; d++) {
                                    if (new Date(now.getFullYear(), now.getMonth(), d).getDay() === currentJsDay) {
                                        occurrence++;
                                    }
                                }
                                periodKey = `${monthStr}-WK${occurrence}`;
                            }
                        }

                        if (isMatch) {
                            acc.push({ ...inc, periodKey });
                        }
                        return acc;
                    }, []);

                    if (dayIncomes.length === 0) return null;

                    return (
                        <div key={day} className={`card border ${day === todayDay ? 'border-[#00d4aa]/50 bg-[#00d4aa]/5' : 'border-[#1e1e32]'}`}>
                            <div className="flex items-center justify-between mb-3 border-b border-[#1e1e32]/50 pb-2">
                                <h4 className={`font-bold ${day === todayDay ? 'text-[#00d4aa]' : 'text-white'}`}>Dia {day} {day === todayDay && '(Hoje)'}</h4>
                            </div>
                            <div className="space-y-3">
                                {dayIncomes.map((inc, idx) => {
                                    const isReceived = (inc.receivedPeriods || []).includes(inc.periodKey);
                                    return (
                                        <div key={`${inc.id}-${idx}`} className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ background: '#00d4aa' }} />
                                                    <span className={`text-sm ${isReceived ? 'text-gray-500 line-through' : 'text-white font-medium'}`}>{inc.description}</span>
                                                </div>
                                                <span className={`text-sm font-bold ${isReceived ? 'text-gray-500' : 'text-[#00d4aa]'}`}>+{formatCurrency(inc.amount)}</span>
                                            </div>
                                            {!isReceived ? (
                                                <div className="flex justify-end mt-1">
                                                    <button onClick={() => {
                                                        setReceiveModal({ income: inc, periodKey: inc.periodKey });
                                                        setReceiveDest(accounts[0]?.id || 'cash');
                                                    }} className="text-xs bg-[#00d4aa]/20 text-[#00d4aa] hover:bg-[#00d4aa]/30 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium">
                                                        Receber
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end mt-1">
                                                    <span className="text-xs text-[#00d4aa] flex items-center gap-1 font-medium"><CheckCircle size={14} />Recebido</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Recebimento */}
            {receiveModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Wallet className="text-[#00d4aa]" size={20} /> Receber Valor</h3>
                            <button onClick={() => setReceiveModal(null)} className="text-gray-500 hover:text-white"><XCircle size={20} /></button>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">Onde o valor de <span className="text-white font-medium">{receiveModal.income.source} ({formatCurrency(receiveModal.income.amount)})</span> foi depositado?</p>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Conta de Destino</label>
                                <select className="input" value={receiveDest} onChange={(e) => setReceiveDest(e.target.value)}>
                                    <option value="cash">Dinheiro em Espécie (Não contabilizar saldo bankário)</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.nickname || acc.bank} (Conta)</option>)}
                                </select>
                                <p className="text-xs text-gray-500 mt-2">Escolhendo uma conta bancária, o saldo será adicionado a ela. Se escolher "Dinheiro em Espécie", o valor apenas sai da lista de "Falta Receber".</p>
                            </div>

                            <button
                                disabled={!receiveDest}
                                onClick={async () => {
                                    if (receiveDest) {
                                        await receiveIncome(receiveModal.income.id, receiveModal.periodKey, receiveDest);
                                        setReceiveModal(null);
                                    }
                                }}
                                className="w-full btn-primary py-3 text-sm font-semibold mt-2"
                            >
                                Confirmar Recebimento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
