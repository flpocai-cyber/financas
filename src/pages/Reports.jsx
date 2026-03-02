import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatPercent, getCategoryColor } from '../utils/formatters';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) return (
        <div className="bg-[#1a1a2e] border border-[#2d2d4a] rounded-xl p-3 shadow-xl">
            <p className="text-white font-semibold text-sm mb-2">{label}</p>
            {payload.map((entry, i) => <p key={i} className="text-xs" style={{ color: entry.color }}>{entry.name}: {formatCurrency(entry.value)}</p>)}
        </div>
    );
    return null;
};

export default function Reports() {
    const { get12MonthProjection, getExpensesByCategory, incomes, expenses } = useFinance();
    const projection = get12MonthProjection();
    const expByCategory = getExpensesByCategory();
    const COLORS = expByCategory.map(e => getCategoryColor(e.name));
    const totalMonthlyIncome = incomes.filter(i => i.type === 'fixed').reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalMonthlyExp = expenses.filter(e => e.recurrence === 'monthly').reduce((s, e) => s + Number(e.amount || 0), 0);
    const netSaving = totalMonthlyIncome - totalMonthlyExp;
    const savingRate = totalMonthlyIncome > 0 ? (netSaving / totalMonthlyIncome) * 100 : 0;
    const projPositive = projection.filter(p => p.net >= 0).length;
    const projNegative = projection.filter(p => p.net < 0).length;

    return (
        <div className="animate-fade-in space-y-6">
            <div><h1 className="text-2xl font-bold text-white">Relatórios & Análise</h1><p className="text-gray-500 text-sm mt-0.5">Visão aprofundada das suas finanças</p></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Taxa de Poupança', value: `${savingRate.toFixed(1)}%`, color: savingRate > 20 ? 'text-[#00d4aa]' : savingRate > 0 ? 'text-[#fbbf24]' : 'text-[#f43f5e]', sub: savingRate > 20 ? 'Excelente' : savingRate > 0 ? 'Atenção' : 'Déficit' },
                    { label: 'Meses Positivos (12m)', value: `${projPositive}/12`, color: 'text-[#00d4aa]', sub: 'nos próximos meses' },
                    { label: 'Meses Negativos (12m)', value: `${projNegative}/12`, color: projNegative > 0 ? 'text-[#f43f5e]' : 'text-gray-400', sub: 'déficit previsto' },
                    { label: 'Fontes de Renda', value: `${incomes.length}`, color: 'text-[#4f8ef7]', sub: `${incomes.filter(i => i.type === 'fixed').length} fixa(s)` },
                ].map((m, i) => <div key={i} className="card"><p className="text-xs text-gray-500 mb-1">{m.label}</p><p className={`text-2xl font-bold ${m.color}`}>{m.value}</p><p className="text-xs text-gray-600">{m.sub}</p></div>)}
            </div>

            <div className="card">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-[#4f8ef7]" />Projeção Mensal Detalhada (12 meses)</h3>
                {projection.length > 0 ? (
                    <>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={projection}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" />
                                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                                <Line type="monotone" dataKey="income" name="Recebimentos" stroke="#00d4aa" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="expenses" name="Gastos" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="balance" name="Saldo" stroke="#4f8ef7" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="border-b border-[#1e1e32]">
                                    {['Mês', 'Recebimentos', 'Gastos', 'Resultado', 'Saldo Projetado'].map(h => <th key={h} className="text-left text-gray-500 py-2 font-medium">{h}</th>)}
                                </tr></thead>
                                <tbody>
                                    {projection.map((row, i) => (
                                        <tr key={i} className="border-b border-[#1a1a2e] hover:bg-white/2 transition-colors">
                                            <td className="py-2 text-white font-medium">{row.month}</td>
                                            <td className="py-2 text-[#00d4aa]">{formatCurrency(row.income)}</td>
                                            <td className="py-2 text-[#f43f5e]">{formatCurrency(row.expenses)}</td>
                                            <td className={`py-2 font-semibold ${row.net >= 0 ? 'text-[#00d4aa]' : 'text-[#f43f5e]'}`}>{row.net >= 0 ? '+' : ''}{formatCurrency(row.net)}</td>
                                            <td className="py-2 text-white">{formatCurrency(row.balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Adicione dados financeiros</div>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><PieIcon size={16} className="text-[#fbbf24]" />Distribuição de Gastos</h3>
                    {expByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart><Pie data={expByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#374151' }}>
                                {expByCategory.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                            </Pie><Tooltip formatter={val => formatCurrency(val)} contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4a', borderRadius: 12 }} /></PieChart>
                        </ResponsiveContainer>
                    ) : <div className="h-52 flex items-center justify-center text-gray-600 text-sm">Sem dados</div>}
                </div>
                <div className="card">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-[#7c3aed]" />Gastos por Categoria</h3>
                    {expByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={expByCategory} layout="vertical" margin={{ left: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                                <Tooltip formatter={val => formatCurrency(val)} contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4a', borderRadius: 12 }} />
                                <Bar dataKey="value" name="Valor" radius={[0, 4, 4, 0]}>{expByCategory.map((entry, i) => <Cell key={i} fill={getCategoryColor(entry.name)} />)}</Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className="h-52 flex items-center justify-center text-gray-600 text-sm">Sem dados</div>}
                </div>
            </div>
        </div>
    );
}
