import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Plus, Trash2, CreditCard, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';

const BRANDS = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard', 'Outros'];
const brandColors = { Visa: 'from-[#1a1f71] to-[#0a0e3f]', Mastercard: 'from-[#eb001b] to-[#7a0010]', Elo: 'from-[#f59e0b] to-[#92400e]', Amex: 'from-[#007bc1] to-[#003d60]', Hipercard: 'from-[#cc0000] to-[#660000]', Outros: 'from-[#4f8ef7] to-[#1d4ed8]' };

function CardForm({ onSave, onCancel }) {
    const [form, setForm] = useState({ name: '', brand: 'Visa', limit: '', dueDay: '', closingDay: '' });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    return (
        <form onSubmit={(e) => { e.preventDefault(); if (!form.name || !form.limit) return; onSave(form); }} className="card mb-4 border-[#4f8ef7]/30 animate-fade-in">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><CreditCard size={16} className="text-[#4f8ef7]" />Novo Cartão</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-2 md:col-span-1"><label className="label">Nome</label><input className="input" placeholder="Nubank" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
                <div><label className="label">Bandeira</label><select className="input" value={form.brand} onChange={e => set('brand', e.target.value)}>{BRANDS.map(b => <option key={b}>{b}</option>)}</select></div>
                <div><label className="label">Limite (R$)</label><input className="input" type="number" placeholder="5000" value={form.limit} onChange={e => set('limit', e.target.value)} required /></div>
                <div><label className="label">Dia Vencimento</label><input className="input" type="number" min="1" max="31" placeholder="10" value={form.dueDay} onChange={e => set('dueDay', e.target.value)} /></div>
                <div><label className="label">Dia Fechamento</label><input className="input" type="number" min="1" max="31" placeholder="3" value={form.closingDay} onChange={e => set('closingDay', e.target.value)} /></div>
            </div>
            <div className="flex gap-3 mt-4"><button type="submit" className="btn-primary">Salvar</button><button type="button" onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button></div>
        </form>
    );
}

function PurchaseForm({ cardId, onSave, onCancel }) {
    const [form, setForm] = useState({ description: '', amount: '', installments: '1', startDate: new Date().toISOString().slice(0, 7) });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, cardId }); }} className="bg-[#1a1a2e] rounded-xl p-4 mt-3 animate-fade-in border border-[#7c3aed]/30">
            <h4 className="text-white font-medium mb-3 text-sm flex items-center gap-2"><ShoppingBag size={14} className="text-[#7c3aed]" />Nova Compra Parcelada</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2"><label className="label text-xs">Descrição</label><input className="input text-sm py-2" placeholder="TV, Celular..." value={form.description} onChange={e => set('description', e.target.value)} required /></div>
                <div><label className="label text-xs">Valor Total (R$)</label><input className="input text-sm py-2" type="number" placeholder="1200" value={form.amount} onChange={e => set('amount', e.target.value)} required /></div>
                <div><label className="label text-xs">Parcelas</label><input className="input text-sm py-2" type="number" min="1" max="60" value={form.installments} onChange={e => set('installments', e.target.value)} /></div>
                <div><label className="label text-xs">Mês Inicial</label><input className="input text-sm py-2" type="month" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></div>
            </div>
            <div className="flex gap-2 mt-3"><button type="submit" className="btn-primary text-sm px-4 py-2">Adicionar</button><button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-white px-3 py-2">Cancelar</button></div>
        </form>
    );
}

export default function CreditCards() {
    const { cards, purchases, addCard, deleteCard, addPurchase, deletePurchase, getInstallmentsForMonth } = useFinance();
    const [showForm, setShowForm] = useState(false);
    const [addingFor, setAddingFor] = useState(null);
    const [expanded, setExpanded] = useState(null);
    const now = new Date();

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div><h1 className="text-2xl font-bold text-white">Cartões de Crédito</h1><p className="text-gray-500 text-sm mt-0.5">{cards.length} cartão(ões)</p></div>
                <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} />Novo Cartão</button>
            </div>
            {showForm && <CardForm onSave={(c) => { addCard(c); setShowForm(false); }} onCancel={() => setShowForm(false)} />}
            {cards.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-16 text-center"><CreditCard size={40} className="text-gray-700 mb-3" /><p className="text-gray-500">Nenhum cartão cadastrado</p></div>
            ) : (
                <div className="space-y-4">
                    {cards.map(card => {
                        const cardPurchases = purchases.filter(p => p.cardId === card.id);
                        const fatura = getInstallmentsForMonth(now.getFullYear(), now.getMonth() + 1);
                        const isExp = expanded === card.id;
                        return (
                            <div key={card.id} className="card">
                                <div className="flex items-start gap-4">
                                    <div className={`w-16 h-10 rounded-lg bg-gradient-to-br ${brandColors[card.brand] || brandColors.Outros} flex items-center justify-center flex-shrink-0`}><CreditCard size={18} className="text-white" /></div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div><h3 className="text-white font-semibold">{card.name}</h3><p className="text-xs text-gray-500">{card.brand} • Vence dia {card.dueDay} • Fecha dia {card.closingDay}</p></div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right"><p className="text-xs text-gray-500">Fatura mês</p><p className="text-base font-bold text-[#a855f7]">{formatCurrency(fatura)}</p></div>
                                                <div className="text-right"><p className="text-xs text-gray-500">Limite</p><p className="text-sm font-semibold text-white">{formatCurrency(card.limit)}</p></div>
                                                <button onClick={() => setExpanded(isExp ? null : card.id)} className="p-2 text-gray-400 hover:text-white">{isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                                                <button onClick={() => deleteCard(card.id)} className="p-2 text-[#f43f5e] hover:opacity-70"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {isExp && (
                                    <div className="mt-4 pt-4 border-t border-[#1e1e32]">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-medium text-gray-300">Compras Parceladas ({cardPurchases.length})</h4>
                                            <button className="text-xs text-[#7c3aed] hover:text-[#a855f7] flex items-center gap-1" onClick={() => setAddingFor(addingFor === card.id ? null : card.id)}><Plus size={12} />Adicionar</button>
                                        </div>
                                        {addingFor === card.id && <PurchaseForm cardId={card.id} onSave={(p) => { addPurchase(p); setAddingFor(null); }} onCancel={() => setAddingFor(null)} />}
                                        {cardPurchases.length === 0 ? <p className="text-center text-gray-600 text-sm py-4">Nenhuma compra parcelada</p> : (
                                            <div className="space-y-2">
                                                {cardPurchases.map(p => {
                                                    const monthly = Number(p.amount) / Number(p.installments);
                                                    return (
                                                        <div key={p.id} className="flex items-center justify-between bg-[#1a1a2e] rounded-xl px-4 py-3">
                                                            <div className="flex items-center gap-3"><ShoppingBag size={14} className="text-[#7c3aed]" /><div><p className="text-sm text-white font-medium">{p.description}</p><p className="text-xs text-gray-500">{p.installments}x de {formatCurrency(monthly)} • Início: {p.startDate}</p></div></div>
                                                            <div className="flex items-center gap-4"><div className="text-right"><p className="text-xs text-gray-500">Total</p><p className="text-sm font-semibold text-white">{formatCurrency(p.amount)}</p></div><button onClick={() => deletePurchase(p.id)} className="text-[#f43f5e] hover:opacity-70"><Trash2 size={14} /></button></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
