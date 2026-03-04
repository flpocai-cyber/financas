import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { useBitcoinPrice } from '../hooks/useBitcoinPrice';
import { formatCurrency, formatPercent, getCategoryColor } from '../utils/formatters';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Bitcoin, Building2, AlertTriangle, Target, ArrowUpRight, ArrowDownRight, Calendar, CheckCircle, XCircle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-3 shadow-xl">
                <p className="text-white font-semibold text-sm mb-2">{label}</p>
                {payload.map((entry, i) => <p key={i} className="text-xs" style={{ color: entry.color }}>{entry.name}: {formatCurrency(entry.value)}</p>)}
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const {
        totalBankBalance, monthlyFixedIncome, monthlyFixedExpenses, currentMonthInstallments,
        cryptos, accounts, incomes, cards, expenses, get12MonthProjection, getExpensesByCategory, payExpense
    } = useFinance();
    const { btcData } = useBitcoinPrice();

    const [view, setView] = useState('overview'); // overview | bills

    // Bills state
    const [payModal, setPayModal] = useState(null); // { expense: Object }
    const [payMethod, setPayMethod] = useState('account'); // account | card
    const [paySource, setPaySource] = useState('');

    const cryptoTotal = cryptos.reduce((sum, c) => {
        if (c.symbol === 'BTC' && btcData.brl) return sum + Number(c.amount) * btcData.brl;
        return sum + Number(c.valueInBrl || 0);
    }, 0);

    const totalPatrimony = totalBankBalance + cryptoTotal;
    const totalMonthlyExp = monthlyFixedExpenses + currentMonthInstallments;
    const netMonth = monthlyFixedIncome - totalMonthlyExp;
    const expByCategory = getExpensesByCategory();
    const projection = get12MonthProjection();
    const sortedExp = [...expByCategory].sort((a, b) => b.value - a.value);
    const totalExpForPercent = sortedExp.reduce((s, e) => s + e.value, 0);
    const COLORS = expByCategory.map(e => getCategoryColor(e.name));

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => setView('overview')} className={`text-sm font-medium transition-colors ${view === 'overview' ? 'text-[#4f8ef7] border-b-2 border-[#4f8ef7] pb-1' : 'text-gray-500 hover:text-white pb-1'}`}>Visão Geral</button>
                        <button onClick={() => setView('bills')} className={`text-sm font-medium transition-colors ${view === 'bills' ? 'text-[#00d4aa] border-b-2 border-[#00d4aa] pb-1' : 'text-gray-500 hover:text-white pb-1'}`}>Contas a Pagar</button>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Hoje</p>
                    <p className="text-sm font-semibold text-white">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                </div>
            </div>

            {view === 'overview' && (<>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <div className="card col-span-2 lg:col-span-1 bg-gradient-to-br from-[#4f8ef7]/20 to-[#7c3aed]/20 border-[#4f8ef7]/30">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Patrimônio Total</p>
                        <p className="text-2xl font-bold text-white mb-1">{formatCurrency(totalPatrimony)}</p>
                        <p className="text-xs text-gray-400">Contas + Cripto</p>
                        <div className="flex items-center gap-1 mt-1 text-xs font-medium text-[#00d4aa]"><Wallet size={11} />{accounts.length} conta(s) • {cryptos.length} cripto(s)</div>
                    </div>
                    {[
                        { title: 'Recebimentos do mês', value: formatCurrency(monthlyFixedIncome), sub: `${incomes.filter(i => i.type === 'fixed').length} fonte(s)`, color: 'text-[#00d4aa]', Icon: TrendingUp },
                        { title: 'Gastos do mês', value: formatCurrency(totalMonthlyExp), sub: 'Despesas + Parcelas', color: 'text-[#f43f5e]', Icon: TrendingDown },
                        { title: 'Saldo líquido', value: formatCurrency(netMonth), sub: 'Receb. - Gastos', color: netMonth >= 0 ? 'text-[#00d4aa]' : 'text-[#f43f5e]', Icon: netMonth >= 0 ? ArrowUpRight : ArrowDownRight },
                        { title: 'Fatura cartões', value: formatCurrency(currentMonthInstallments), sub: `${cards.length} cartão(ões)`, color: 'text-[#a855f7]', Icon: CreditCard },
                    ].map((s, i) => (
                        <div key={i} className="card flex items-start justify-between">
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{s.title}</p>
                                <p className={`text-2xl font-bold mb-1 ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-gray-500">{s.sub}</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center ml-4">
                                <s.Icon size={20} className={s.color} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bitcoin ticker */}
                {btcData.brl && (
                    <div className="card bg-gradient-to-r from-[#f59e0b]/10 to-[#fbbf24]/5 border-[#f59e0b]/30 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/20 flex items-center justify-center flex-shrink-0"><Bitcoin size={20} className="text-[#fbbf24]" /></div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-400 mb-0.5">Bitcoin (BTC) • Atualizado hoje</p>
                            <div className="flex items-center gap-6 flex-wrap">
                                <div><span className="text-lg font-bold text-white">{formatCurrency(btcData.brl)}</span><span className="text-gray-500 text-xs ml-2">/ BTC</span></div>
                                {btcData.change24h !== null && (
                                    <div className={`flex items-center gap-1 text-sm font-medium ${btcData.change24h >= 0 ? 'text-[#00d4aa]' : 'text-[#f43f5e]'}`}>
                                        {btcData.change24h >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{formatPercent(Math.abs(btcData.change24h))} (24h)
                                    </div>
                                )}
                                {cryptoTotal > 0 && <div><span className="text-xs text-gray-400">Carteira cripto:</span><span className="text-sm font-semibold text-[#fbbf24] ml-2">{formatCurrency(cryptoTotal)}</span></div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="card lg:col-span-2">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Target size={16} className="text-[#4f8ef7]" />Projeção — Próximos 12 Meses</h3>
                        {projection.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={projection}>
                                    <defs>
                                        <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4aa" stopOpacity={0.2} /><stop offset="95%" stopColor="#00d4aa" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} /><stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} /></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" />
                                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                                    <Area type="monotone" dataKey="income" name="Recebimentos" stroke="#00d4aa" fill="url(#ig)" strokeWidth={2} dot={false} />
                                    <Area type="monotone" dataKey="expenses" name="Gastos Normais" stroke="#f43f5e" fill="url(#eg)" strokeWidth={2} dot={false} />
                                    <Area type="monotone" dataKey="plannedExpenses" name="Gastos + Projetos" stroke="#f59e0b" fill="url(#pg)" strokeWidth={2} dot={false} />
                                    <Area type="monotone" dataKey="balance" name="Saldo" stroke="#4f8ef7" fill="url(#bg)" strokeWidth={2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <div className="h-60 flex items-center justify-center text-gray-600 text-sm">Adicione dados para ver a projeção</div>}
                    </div>

                    <div className="card">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-[#fbbf24]" />Gastos por Categoria</h3>
                        {expByCategory.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart><Pie data={expByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                        {expByCategory.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                    </Pie><Tooltip formatter={val => formatCurrency(val)} contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4a', borderRadius: 12 }} /></PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-1.5 mt-2">
                                    {sortedExp.slice(0, 5).map((item, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: getCategoryColor(item.name) }} /><span className="text-gray-400">{item.name}</span></div>
                                            <span className="text-white font-medium">{formatCurrency(item.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : <div className="h-60 flex items-center justify-center text-gray-600 text-sm">Sem despesas cadastradas</div>}
                    </div>
                </div>

                {/* Economy analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="card">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><CreditCard size={16} className="text-[#a855f7]" />Gastos vs Recebimentos (12 meses)</h3>
                        {projection.some(p => p.expenses > 0) ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={projection}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" />
                                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="expenses" name="Gastos" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="income" name="Recebimentos" fill="#00d4aa" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Adicione dados</div>}
                    </div>

                    <div className="card">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Target size={16} className="text-[#00d4aa]" />Onde Posso Economizar?</h3>
                        {sortedExp.length > 0 ? (
                            <div className="space-y-3">
                                {sortedExp.map((item, i) => {
                                    const pct = totalExpForPercent > 0 ? (item.value / totalExpForPercent) * 100 : 0;
                                    const pctOfIncome = monthlyFixedIncome > 0 ? (item.value / monthlyFixedIncome) * 100 : 0;
                                    return (
                                        <div key={i}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-white">{item.name}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-400">{formatPercent(pctOfIncome)} da renda</span>
                                                    <span className="text-sm font-semibold" style={{ color: getCategoryColor(item.name) }}>{formatCurrency(item.value)}</span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: getCategoryColor(item.name) }} />
                                            </div>
                                            {pctOfIncome > 30 && <p className="text-[10px] text-[#fbbf24] mt-0.5 flex items-center gap-1"><AlertTriangle size={9} />Consome mais de 30% da sua renda</p>}
                                        </div>
                                    );
                                })}
                                <div className="mt-3 pt-3 border-t border-[#1e1e32] flex justify-between text-sm">
                                    <span className="text-gray-400">Comprometimento da renda:</span>
                                    <span className={`font-bold ${totalMonthlyExp / monthlyFixedIncome > 0.8 ? 'text-[#f43f5e]' : totalMonthlyExp / monthlyFixedIncome > 0.5 ? 'text-[#fbbf24]' : 'text-[#00d4aa]'}`}>
                                        {monthlyFixedIncome > 0 ? formatPercent((totalMonthlyExp / monthlyFixedIncome) * 100) : '—'}
                                    </span>
                                </div>
                            </div>
                        ) : <div className="h-48 flex items-center justify-center text-gray-600 text-sm">Adicione despesas para análise</div>}
                    </div>
                </div>

            </>)}

            {view === 'bills' && (
                <div className="space-y-4">
                    <h3 className="text-white font-semibold flex items-center gap-2"><Calendar size={16} className="text-[#00d4aa]" />Calendário do Mês {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => {
                            const day = i + 1;
                            const todayDay = new Date().getDate();
                            const monthStr = new Date().toISOString().slice(0, 7);

                            // Find matching expenses
                            const dayBills = expenses.filter(e => {
                                if (!e.date) return false;
                                const parts = e.date.split('-');
                                const eDay = parseInt(parts[2]);
                                const eMonth = parts[1];
                                const eYear = parts[0];
                                const currentMonth = monthStr.split('-')[1];
                                const currentYear = monthStr.split('-')[0];

                                if (eDay !== day) return false;

                                if (e.recurrence === 'once' && (eMonth !== currentMonth || eYear !== currentYear)) return false;
                                if (e.recurrence === 'yearly' && eMonth !== currentMonth) return false;

                                return true;
                            });

                            if (dayBills.length === 0) return null; // Only render days with bills

                            return (
                                <div key={day} className={`card border ${day === todayDay ? 'border-[#00d4aa]/50' : 'border-[#1e1e32]'}`}>
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
                                                            <span className={`text-sm ${isPaid ? 'text-gray-500 line-through' : 'text-white'}`}>{bill.description}</span>
                                                        </div>
                                                        <span className={`text-sm font-semibold ${isPaid ? 'text-gray-500' : 'text-[#f43f5e]'}`}>{formatCurrency(bill.amount)}</span>
                                                    </div>
                                                    {!isPaid ? (
                                                        <div className="flex justify-end mt-1">
                                                            <button onClick={() => {
                                                                setPayModal({ expense: bill, monthStr });
                                                                setPayMethod('account');
                                                                setPaySource(accounts[0]?.id || '');
                                                            }} className="text-xs bg-[#00d4aa]/20 text-[#00d4aa] hover:bg-[#00d4aa]/30 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                                                Pagar Agora
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end mt-1">
                                                            <span className="text-xs text-[#00d4aa] flex items-center gap-1"><CheckCircle size={12} />Pago</span>
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
                </div>
            )}

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
                                    <button onClick={() => { setPayMethod('account'); setPaySource(accounts[0]?.id || ''); }} className={`flex-1 text-sm py-2 rounded-md transition-all ${payMethod === 'account' ? 'bg-[#2d2d4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Débito em Conta</button>
                                    <button onClick={() => { setPayMethod('card'); setPaySource(cards[0]?.id || ''); }} className={`flex-1 text-sm py-2 rounded-md transition-all ${payMethod === 'card' ? 'bg-[#2d2d4a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Cartão de Crédito</button>
                                </div>
                            </div>

                            {payMethod === 'account' ? (
                                <div>
                                    <label className="label">Qual a conta de origem?</label>
                                    <select className="input" value={paySource} onChange={(e) => setPaySource(e.target.value)}>
                                        {accounts.length === 0 && <option value="" disabled>Nenhuma conta cadastrada</option>}
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Saldo: {formatCurrency(acc.balance)})</option>)}
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
                                    <p className="text-xs text-gray-500 mt-2">O valor será alocado automaticamente na fatura mais correta de acordo com a regra de fechamento do cartão (Melhor dia de compra).</p>
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
