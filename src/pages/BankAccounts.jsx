import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Plus, Trash2, Building2, Edit2, PiggyBank, TrendingUp as InvestIcon, Landmark } from 'lucide-react';

const BANKS = ['Nubank', 'Itaú', 'Bradesco', 'Santander', 'Caixa', 'Banco do Brasil', 'Inter', 'C6', 'PicPay', 'Binance', 'XP', 'Outros'];
const TYPES = ['Corrente', 'Poupança', 'Investimento', 'Digital'];
const typeIcons = { Corrente: Building2, Poupança: PiggyBank, Investimento: InvestIcon, Digital: Landmark };

function AccountForm({ onSave, onCancel, initial }) {
    const [form, setForm] = useState(initial || { bank: 'Nubank', type: 'Corrente', balance: '', nickname: '' });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="card mb-4 border-[#4f8ef7]/30 animate-fade-in">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Building2 size={16} className="text-[#4f8ef7]" />{initial ? 'Editar' : 'Nova'} Conta</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><label className="label">Banco</label><select className="input" value={form.bank} onChange={e => set('bank', e.target.value)}>{BANKS.map(b => <option key={b}>{b}</option>)}</select></div>
                <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={e => set('type', e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label className="label">Apelido</label><input className="input" placeholder="Conta principal" value={form.nickname} onChange={e => set('nickname', e.target.value)} /></div>
                <div><label className="label">Saldo (R$)</label><input className="input" type="number" placeholder="1500" value={form.balance} onChange={e => set('balance', e.target.value)} required /></div>
            </div>
            <div className="flex gap-3 mt-4"><button type="submit" className="btn-primary">Salvar</button><button type="button" onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button></div>
        </form>
    );
}

export default function BankAccounts() {
    const { accounts, addAccount, updateAccount, deleteAccount, totalBankBalance } = useFinance();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div><h1 className="text-2xl font-bold text-white">Contas Bancárias</h1><p className="text-gray-500 text-sm mt-0.5">{accounts.length} conta(s) • Total: {formatCurrency(totalBankBalance)}</p></div>
                <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} />Nova Conta</button>
            </div>
            {showForm && !editingId && <AccountForm onSave={(a) => { addAccount(a); setShowForm(false); }} onCancel={() => setShowForm(false)} />}
            {accounts.length > 0 && (
                <div className="card bg-gradient-to-r from-[#4f8ef7]/10 to-[#7c3aed]/5 border-[#4f8ef7]/20 flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#4f8ef7]/20 flex items-center justify-center"><Building2 size={22} className="text-[#4f8ef7]" /></div>
                    <div><p className="text-xs text-gray-400">Saldo Total em Contas</p><p className="text-2xl font-bold text-white">{formatCurrency(totalBankBalance)}</p></div>
                </div>
            )}
            {accounts.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-16 text-center"><Building2 size={40} className="text-gray-700 mb-3" /><p className="text-gray-500">Nenhuma conta cadastrada</p></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {accounts.map(acc => {
                        if (editingId === acc.id) return (
                            <div key={acc.id} className="md:col-span-2 xl:col-span-3">
                                <AccountForm initial={acc} onSave={(data) => { updateAccount(acc.id, data); setEditingId(null); }} onCancel={() => setEditingId(null)} />
                            </div>
                        );
                        const Icon = typeIcons[acc.type] || Building2;
                        const pct = totalBankBalance > 0 ? (Number(acc.balance) / totalBankBalance) * 100 : 0;
                        return (
                            <div key={acc.id} className="card hover:border-[#2d2d4a] transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#4f8ef7]/10 flex items-center justify-center"><Icon size={18} className="text-[#4f8ef7]" /></div>
                                        <div><p className="text-white font-semibold">{acc.nickname || acc.bank}</p><p className="text-xs text-gray-500">{acc.bank} • {acc.type}</p></div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingId(acc.id)} className="p-1.5 text-gray-400 hover:text-[#4f8ef7]"><Edit2 size={13} /></button>
                                        <button onClick={() => deleteAccount(acc.id)} className="p-1.5 text-gray-400 hover:text-[#f43f5e]"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-white mb-2">{formatCurrency(acc.balance)}</p>
                                <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#4f8ef7] to-[#7c3aed] rounded-full" style={{ width: `${pct}%` }} /></div>
                                <p className="text-xs text-gray-500 mt-1">{pct.toFixed(1)}% do total</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
