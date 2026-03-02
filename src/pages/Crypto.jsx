import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useBitcoinPrice } from '../hooks/useBitcoinPrice';
import { formatCurrency } from '../utils/formatters';
import { Plus, Trash2, Bitcoin, Edit2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const CRYPTOS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'ADA', 'DOT', 'MATIC', 'LINK', 'Outros'];

function CryptoForm({ onSave, onCancel, initial }) {
    const [form, setForm] = useState(initial || { symbol: 'BTC', name: '', amount: '', valueInBrl: '' });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="card mb-4 border-[#fbbf24]/30 animate-fade-in">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Bitcoin size={16} className="text-[#fbbf24]" />{initial ? 'Editar' : 'Novo'} Ativo Cripto</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><label className="label">Moeda</label><select className="input" value={form.symbol} onChange={e => set('symbol', e.target.value)}>{CRYPTOS.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="label">Nome</label><input className="input" placeholder="Bitcoin" value={form.name} onChange={e => set('name', e.target.value)} /></div>
                <div><label className="label">Quantidade</label><input className="input" type="number" step="any" placeholder="0.5" value={form.amount} onChange={e => set('amount', e.target.value)} required /></div>
                {form.symbol !== 'BTC' && <div><label className="label">Valor em BRL (manual)</label><input className="input" type="number" placeholder="Para não-BTC" value={form.valueInBrl} onChange={e => set('valueInBrl', e.target.value)} /></div>}
            </div>
            {form.symbol === 'BTC' && <p className="text-xs text-[#fbbf24] mt-2">✓ Valor calculado automaticamente via API</p>}
            <div className="flex gap-3 mt-4"><button type="submit" className="btn-primary">Salvar</button><button type="button" onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button></div>
        </form>
    );
}

export default function Crypto() {
    const { cryptos, addCrypto, updateCrypto, deleteCrypto } = useFinance();
    const { btcData, loading } = useBitcoinPrice();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const totalCrypto = cryptos.reduce((sum, c) => {
        if (c.symbol === 'BTC' && btcData.brl) return sum + Number(c.amount) * btcData.brl;
        return sum + Number(c.valueInBrl || 0);
    }, 0);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div><h1 className="text-2xl font-bold text-white">Criptoativos</h1><p className="text-gray-500 text-sm mt-0.5">{cryptos.length} ativo(s) • Total: {formatCurrency(totalCrypto)}</p></div>
                <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} />Novo Ativo</button>
            </div>
            {showForm && !editingId && <CryptoForm onSave={(c) => { addCrypto(c); setShowForm(false); }} onCancel={() => setShowForm(false)} />}
            <div className="card bg-gradient-to-r from-[#f59e0b]/10 to-[#fbbf24]/5 border-[#f59e0b]/20 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#f59e0b]/20 flex items-center justify-center"><Bitcoin size={24} className="text-[#fbbf24]" /></div>
                        <div>
                            <p className="text-sm text-gray-400 flex items-center gap-1">Bitcoin (BTC) {loading && <RefreshCw size={11} className="animate-spin" />}</p>
                            <p className="text-2xl font-bold text-white">{btcData.brl ? formatCurrency(btcData.brl) : 'Carregando...'}</p>
                            <p className="text-xs text-gray-500">USD: {btcData.usd ? `$${btcData.usd.toLocaleString()}` : '...'}</p>
                        </div>
                    </div>
                    {btcData.change24h !== null && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${btcData.change24h >= 0 ? 'bg-[#00d4aa]/10 text-[#00d4aa]' : 'bg-[#f43f5e]/10 text-[#f43f5e]'}`}>
                            {btcData.change24h >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            <div><p className="text-xs opacity-70">24h</p><p className="font-bold">{btcData.change24h >= 0 ? '+' : ''}{btcData.change24h?.toFixed(2)}%</p></div>
                        </div>
                    )}
                    {btcData.lastUpdated && <p className="text-xs text-gray-600">Atualizado: {btcData.lastUpdated.toLocaleTimeString('pt-BR')}</p>}
                </div>
            </div>
            {cryptos.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-16 text-center"><Bitcoin size={40} className="text-gray-700 mb-3" /><p className="text-gray-500">Nenhum ativo cripto cadastrado</p></div>
            ) : (
                <div className="space-y-3">
                    {cryptos.map(c => {
                        if (editingId === c.id) return <CryptoForm key={c.id} initial={c} onSave={(data) => { updateCrypto(c.id, data); setEditingId(null); }} onCancel={() => setEditingId(null)} />;
                        const value = c.symbol === 'BTC' && btcData.brl ? Number(c.amount) * btcData.brl : Number(c.valueInBrl || 0);
                        const pct = totalCrypto > 0 ? (value / totalCrypto) * 100 : 0;
                        return (
                            <div key={c.id} className="card flex items-center gap-4 hover:border-[#2d2d4a] transition-all group">
                                <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center flex-shrink-0 font-bold text-[#fbbf24] text-sm">{c.symbol.slice(0, 3)}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold">{c.symbol}{c.name && <span className="text-gray-500 font-normal text-sm"> — {c.name}</span>}</p>
                                    <p className="text-gray-500 text-xs">{c.amount} {c.symbol}</p>
                                    {c.symbol === 'BTC' && btcData.brl && <p className="text-xs text-[#fbbf24]">{formatCurrency(btcData.brl)} / BTC (live)</p>}
                                </div>
                                <div className="text-right mr-4 hidden md:block">
                                    <div className="h-1.5 w-24 bg-[#1a1a2e] rounded-full overflow-hidden"><div className="h-full bg-[#fbbf24] rounded-full" style={{ width: `${pct}%` }} /></div>
                                    <p className="text-xs text-gray-500 mt-0.5">{pct.toFixed(1)}%</p>
                                </div>
                                <div className="text-right"><p className="text-white font-bold">{formatCurrency(value)}</p></div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingId(c.id)} className="p-1.5 text-gray-400 hover:text-[#4f8ef7]"><Edit2 size={14} /></button>
                                    <button onClick={() => deleteCrypto(c.id)} className="p-1.5 text-gray-400 hover:text-[#f43f5e]"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        );
                    })}
                    <div className="card bg-[#1a1a2e] flex justify-between items-center"><span className="text-gray-400 text-sm">Total Cripto</span><span className="text-[#fbbf24] font-bold text-lg">{formatCurrency(totalCrypto)}</span></div>
                </div>
            )}
        </div>
    );
}
