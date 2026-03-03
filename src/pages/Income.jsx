import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Plus, Trash2, TrendingUp, Edit2 } from 'lucide-react';

const SOURCES = ['Salário', 'Freelance', 'Aluguel', 'Dividendos', 'Pensão', 'Bolsa', 'Outros'];
const TYPES = [{ value: 'fixed', label: 'Fixo Mensal' }, { value: 'weekly', label: 'Fixo Semanal' }, { value: 'variable', label: 'Variável' }, { value: 'once', label: 'Pontual' }];
const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function IncomeForm({ onSave, onCancel, initial }) {
    const [form, setForm] = useState(initial || { description: '', amount: '', source: 'Salário', type: 'fixed', date: '', dayOfMonth: '5', dayOfWeek: 'Sexta-feira' });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="card mb-4 border-[#00d4aa]/30 animate-fade-in">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-[#00d4aa]" />{initial ? 'Editar' : 'Novo'} Recebimento</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2"><label className="label">Descrição</label><input className="input" placeholder="Salário empresa X" value={form.description} onChange={e => set('description', e.target.value)} required /></div>
                <div><label className="label">Valor (R$)</label><input className="input" type="number" placeholder="5000" value={form.amount} onChange={e => set('amount', e.target.value)} required /></div>
                <div><label className="label">Fonte</label><select className="input" value={form.source} onChange={e => set('source', e.target.value)}>{SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={e => set('type', e.target.value)}>{TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                {form.type === 'fixed' && <div><label className="label">Dia do Mês</label><input className="input" type="number" min="1" max="31" placeholder="Ex: 5" value={form.dayOfMonth || ''} onChange={e => set('dayOfMonth', e.target.value)} /></div>}
                {form.type === 'weekly' && <div><label className="label">Dia da Semana</label><select className="input" value={form.dayOfWeek || 'Sexta-feira'} onChange={e => set('dayOfWeek', e.target.value)}>{WEEKDAYS.map(w => <option key={w}>{w}</option>)}</select></div>}
                {(form.type === 'variable' || form.type === 'once') && <div><label className="label">Data Prevista</label><input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>}
            </div>
            <div className="flex gap-3 mt-4"><button type="submit" className="btn-success">Salvar</button><button type="button" onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button></div>
        </form>
    );
}

export default function Income() {
    const { incomes, addIncome, updateIncome, deleteIncome, monthlyFixedIncome } = useFinance();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const totalFixed = monthlyFixedIncome;
    const typeLabel = { fixed: 'Fixo Mensal', weekly: 'Fixo Semanal', variable: 'Variável', once: 'Pontual' };
    const typeBadge = { fixed: 'badge-green', weekly: 'badge-green text-xs', variable: 'badge-blue', once: 'badge-yellow' };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div><h1 className="text-2xl font-bold text-white">Recebimentos</h1><p className="text-gray-500 text-sm mt-0.5">{incomes.length} fonte(s) • Fixo: {formatCurrency(totalFixed)}/mês</p></div>
                <button className="btn-success" onClick={() => setShowForm(true)}><Plus size={16} />Novo Recebimento</button>
            </div>
            {showForm && !editingId && <IncomeForm onSave={(inc) => { addIncome(inc); setShowForm(false); }} onCancel={() => setShowForm(false)} />}
            {incomes.length > 0 && (
                <div className="card bg-gradient-to-r from-[#00d4aa]/10 to-[#059669]/5 border-[#00d4aa]/20 flex items-center gap-6 mb-4">
                    <div><p className="text-xs text-gray-400">Renda Fixa Mensal</p><p className="text-xl font-bold text-[#00d4aa]">{formatCurrency(totalFixed)}</p></div>
                    <div className="w-px h-10 bg-[#1e1e32]" />
                    <div><p className="text-xs text-gray-400">Total de Fontes</p><p className="text-xl font-bold text-white">{incomes.length}</p></div>
                </div>
            )}
            {incomes.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-16 text-center"><TrendingUp size={40} className="text-gray-700 mb-3" /><p className="text-gray-500">Nenhum recebimento cadastrado</p></div>
            ) : (
                <div className="space-y-2">
                    {incomes.map(inc => {
                        if (editingId === inc.id) return <IncomeForm key={inc.id} initial={inc} onSave={(data) => { updateIncome(inc.id, data); setEditingId(null); }} onCancel={() => setEditingId(null)} />;
                        return (
                            <div key={inc.id} className="card flex items-center gap-4 py-3 hover:border-[#2d2d4a] transition-all">
                                <div className="w-10 h-10 rounded-xl bg-[#00d4aa]/10 flex items-center justify-center flex-shrink-0"><TrendingUp size={16} className="text-[#00d4aa]" /></div>
                                <div className="flex-1 min-w-0"><p className="text-white font-medium text-sm truncate">{inc.description}</p><p className="text-gray-500 text-xs">{inc.source} • {inc.type === 'weekly' && inc.dayOfWeek ? inc.dayOfWeek : inc.type === 'fixed' && inc.dayOfMonth ? `Dia ${inc.dayOfMonth}` : ''}{(inc.type === 'variable' || inc.type === 'once') && inc.date ? ` • Previsto: ${inc.date}` : ''}</p></div>
                                <span className={typeBadge[inc.type]}>{typeLabel[inc.type]}</span>
                                <p className="text-[#00d4aa] font-bold w-28 text-right">{formatCurrency(inc.amount)} {inc.type === 'weekly' && <span className="text-[10px] text-gray-500 font-normal block">/sem</span>}</p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditingId(inc.id)} className="p-1.5 text-gray-400 hover:text-[#4f8ef7]"><Edit2 size={14} /></button>
                                    <button onClick={() => deleteIncome(inc.id)} className="p-1.5 text-gray-400 hover:text-[#f43f5e]"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
