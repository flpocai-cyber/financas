import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Target, Plus, Trash2, CalendarDays, ArrowRight, TrendingUp, Edit2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function PlanForm({ initial, onSave, onCancel }) {
    const [form, setForm] = useState(initial || { title: '', amount: '', installments: '12', startMonth: new Date().toISOString().slice(0, 7) });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="card mb-4 border-[#4f8ef7]/30 animate-fade-in">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Target size={16} className="text-[#4f8ef7]" />{initial ? 'Editar Projeto' : 'Novo Planejamento'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2"><label className="label">O que você planeja fazer?</label><input className="input" placeholder="Ex: Pintura da Casa, Trocar de Carro" value={form.title} onChange={e => set('title', e.target.value)} required /></div>
                <div><label className="label">Valor Total (R$)</label><input className="input" type="number" step="0.01" placeholder="5000" value={form.amount} onChange={e => set('amount', e.target.value)} required /></div>
                <div><label className="label">Em quantas vezes?</label><input className="input" type="number" min="1" max="48" value={form.installments} onChange={e => set('installments', e.target.value)} required /></div>
                <div className="col-span-2"><label className="label">Mês de Início</label><input className="input" type="month" value={form.startMonth} onChange={e => set('startMonth', e.target.value)} required /></div>
            </div>
            <div className="flex gap-3 mt-4"><button type="submit" className="btn-primary">{initial ? 'Salvar Alterações' : 'Adicionar Simulação'}</button><button type="button" onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button></div>
        </form>
    );
}

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

export default function Planning() {
    const { plans, addPlan, updatePlan, deletePlan, get12MonthProjection } = useFinance();
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    // Obtém a projeção atual como base (sem os planos)
    const baseProjection = get12MonthProjection();
    const now = new Date();

    const safePlans = plans || [];
    const safeBaseProjection = baseProjection || [];

    // Calcula as despesas mensais extras baseadas nos planos cadastrados
    const planMonthlyCosts = {};
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const y = d.getFullYear(), m = d.getMonth() + 1;
        const key = `${y}-${m.toString().padStart(2, '0')}`;

        planMonthlyCosts[key] = safePlans.reduce((sum, p) => {
            if (!p || !p.startMonth) return sum;
            try {
                const start = new Date(p.startMonth + '-01');
                const end = new Date(start.getFullYear(), start.getMonth() + Number(p.installments || 1), 0);
                const target = new Date(y, m - 1, 1);
                if (target >= start && target <= end) {
                    sum += (Number(p.amount || 0) / Number(p.installments || 1));
                }
            } catch (err) {
                console.error("Erro plano", err);
            }
            return sum;
        }, 0);
    }

    // Cria a projeção simulada subtraindo mês a mês as despesas extras do saldo real
    let accumulatedExtraExpenses = 0;

    const simulatedProjection = safeBaseProjection.map((p, idx) => {
        if (!p) return { month: '', "Saldo Atual": 0, "Saldo Simulado": 0, "Despesas Extras (Planos)": 0 };
        const d = new Date(now.getFullYear(), now.getMonth() + idx, 1);
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;

        const extraExpense = planMonthlyCosts[key] || 0;
        accumulatedExtraExpenses += extraExpense;

        return {
            month: p.month || '',
            "Saldo Atual": p.balance || 0,
            "Saldo Simulado": (p.balance || 0) - accumulatedExtraExpenses,
            "Despesas Extras (Planos)": extraExpense,
        };
    });

    return (
        <div className="animate-fade-in space-y-6">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold text-white">Planejamento Financeiro</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Simule compras futuras e veja o impacto no seu saldo em 12 meses</p>
                </div>
                <button className="btn-primary" onClick={() => { setEditingPlan(null); setShowForm(true); }}><Plus size={16} />Nova Simulação</button>
            </div>

            {showForm && (
                <PlanForm
                    initial={editingPlan}
                    onSave={(plan) => {
                        if (editingPlan) updatePlan(editingPlan.id, plan);
                        else addPlan(plan);
                        setShowForm(false);
                        setEditingPlan(null);
                    }}
                    onCancel={() => { setShowForm(false); setEditingPlan(null); }}
                />
            )}

            {/* Gráfico de Impacto Simulado */}
            <div className="card">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#4f8ef7]" /> Simulador de Saldo (Real vs Planejado)
                </h3>
                {safeBaseProjection.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={simulatedProjection} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} /><stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} /></linearGradient>
                                <linearGradient id="colorSimulated" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e32" />
                            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                            <Area type="monotone" dataKey="Saldo Atual" stroke="#4f8ef7" fill="url(#colorReal)" strokeWidth={2} dot={false} />
                            <Area type="monotone" dataKey="Saldo Simulado" stroke="#f59e0b" fill="url(#colorSimulated)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-60 flex items-center justify-center text-gray-600 text-sm">Adicione dados financeiros para ver a simulação</div>
                )}
            </div>

            {/* Lista de Projetos Simulados */}
            <div className="card">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Target size={16} className="text-[#f59e0b]" />Meus Projetos / Sonhos</h3>
                {safePlans.length === 0 ? (
                    <div className="py-8 text-center"><p className="text-gray-500">Nenhum projeto planejado ainda.</p></div>
                ) : (
                    <div className="space-y-3">
                        {safePlans.map(plan => {
                            const monthlyAmount = Number(plan.amount) / Number(plan.installments);
                            return (
                                <div key={plan.id} className="flex items-center justify-between bg-[#1a1a2e] border border-[#1e1e32] p-4 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                                            <Target size={18} className="text-[#f59e0b]" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium">{plan.title}</h4>
                                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                                <CalendarDays size={12} /> {plan.installments}x de {formatCurrency(monthlyAmount)}
                                                <ArrowRight size={10} className="text-gray-600 mx-1" />
                                                Início: {plan.startMonth}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Valor Total</p>
                                            <p className="text-white font-semibold">{formatCurrency(plan.amount)}</p>
                                        </div>
                                        <button onClick={() => { setEditingPlan(plan); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 text-[#4f8ef7] hover:bg-[#4f8ef7]/10 rounded-lg transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => deletePlan(plan.id)} className="p-2 text-[#f43f5e] hover:bg-[#f43f5e]/10 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
