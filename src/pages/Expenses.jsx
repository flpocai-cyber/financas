import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getCategoryColor } from '../utils/formatters';
import { Plus, Trash2, Receipt, Edit2 } from 'lucide-react';

const CATEGORIES = ['Educação', 'Impostos', 'Moradia', 'Saúde', 'Lazer', 'Alimentação', 'Transporte', 'Outros'];
const RECURRENCES = [{ value: 'monthly', label: 'Mensal' }, { value: 'yearly', label: 'Anual' }, { value: 'once', label: 'Eventual' }];

function ExpenseForm({ onSave, onCancel, initial }) {
    const [form, setForm] = useState(initial || { description: '', amount: '', category: 'Outros', recurrence: 'monthly', date: '' });
    const isDateRequired = true;
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    return (
        <form onSubmit={(e) => { e.preventDefault(); if (!form.date) { alert('Por favor, informe a data de vencimento.'); return; } onSave(form); }} className="card mb-4 border-[#f43f5e]/30 animate-fade-in">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Receipt size={16} className="text-[#f43f5e]" />{initial ? 'Editar' : 'Nova'} Despesa</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2"><label className="label">Descrição</label><input className="input" placeholder="Faculdade, IPVA..." value={form.description} onChange={e => set('description', e.target.value)} required /></div>
                <div><label className="label">Valor (R$)</label><input className="input" type="number" placeholder="500" value={form.amount} onChange={e => set('amount', e.target.value)} required /></div>
                <div><label className="label">Categoria</label><select className="input" value={form.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="label">Recorrência</label><select className="input" value={form.recurrence} onChange={e => set('recurrence', e.target.value)}>{RECURRENCES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                <div><label className="label">Data Vencimento <span className="text-[#f43f5e]">*</span></label><input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} required /></div>
            </div>
            <div className="flex gap-3 mt-4"><button type="submit" className="btn-primary">Salvar</button><button type="button" onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button></div>
        </form>
    );
}

export default function Expenses() {
    const { expenses, addExpense, updateExpense, deleteExpense } = useFinance();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filter, setFilter] = useState('all');

    const filtered = filter === 'all' ? expenses : expenses.filter(e => e.recurrence === filter);
    const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
    const recurrenceLabel = { monthly: 'Mensal', yearly: 'Anual', once: 'Eventual' };
    const recurrenceBadge = { monthly: 'badge-blue', yearly: 'badge-yellow', once: 'badge-green' };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div><h1 className="text-2xl font-bold text-white">Despesas</h1><p className="text-gray-500 text-sm mt-0.5">{expenses.length} despesa(s) • Total: {formatCurrency(total)}</p></div>
                <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); }}><Plus size={16} />Nova Despesa</button>
            </div>
            {showForm && !editingId && <ExpenseForm onSave={(exp) => { addExpense(exp); setShowForm(false); }} onCancel={() => setShowForm(false)} />}
            <div className="flex gap-2 mb-4">
                {[['all', 'Todas'], ['monthly', 'Mensais'], ['yearly', 'Anuais'], ['once', 'Eventuais']].map(([val, label]) => (
                    <button key={val} onClick={() => setFilter(val)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === val ? 'bg-[#4f8ef7]/20 text-[#4f8ef7] border border-[#4f8ef7]/30' : 'text-gray-500 hover:text-gray-300'}`}>{label}</button>
                ))}
            </div>
            {filtered.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-16 text-center"><Receipt size={40} className="text-gray-700 mb-3" /><p className="text-gray-500">Nenhuma despesa cadastrada</p></div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(exp => {
                        if (editingId === exp.id) return <ExpenseForm key={exp.id} initial={exp} onSave={(data) => { updateExpense(exp.id, data); setEditingId(null); }} onCancel={() => setEditingId(null)} />;
                        return (
                            <div key={exp.id} className="card flex items-center gap-4 py-3 hover:border-[#2d2d4a] transition-all">
                                <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: getCategoryColor(exp.category) }} />
                                <div className="flex-1 min-w-0"><p className="text-white font-medium text-sm truncate">{exp.description}</p><p className="text-gray-500 text-xs">{exp.category}{exp.date && ` • Vence: ${exp.date}`}</p></div>
                                <span className={recurrenceBadge[exp.recurrence]}>{recurrenceLabel[exp.recurrence]}</span>
                                <p className="text-white font-bold w-28 text-right">{formatCurrency(exp.amount)}</p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditingId(exp.id)} className="p-1.5 text-gray-400 hover:text-[#4f8ef7]"><Edit2 size={14} /></button>
                                    <button onClick={() => deleteExpense(exp.id)} className="p-1.5 text-gray-400 hover:text-[#f43f5e]"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        );
                    })}
                    <div className="card flex justify-between bg-[#1a1a2e]"><span className="text-gray-400 text-sm font-medium">Total filtrado</span><span className="text-[#f43f5e] font-bold text-lg">{formatCurrency(total)}</span></div>
                </div>
            )}
        </div>
    );
}
