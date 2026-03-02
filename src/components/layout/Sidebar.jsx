import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Receipt, TrendingUp, Building2, Bitcoin, BarChart3, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/cartoes', icon: CreditCard, label: 'Cartões' },
    { to: '/despesas', icon: Receipt, label: 'Despesas' },
    { to: '/recebimentos', icon: TrendingUp, label: 'Recebimentos' },
    { to: '/contas', icon: Building2, label: 'Contas' },
    { to: '/cripto', icon: Bitcoin, label: 'Cripto' },
    { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    return (
        <aside className={`relative flex flex-col bg-[#111118] border-r border-[#1e1e32] transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'} min-h-screen`}>
            <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#1e1e32] ${collapsed ? 'justify-center' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4f8ef7] to-[#7c3aed] flex items-center justify-center flex-shrink-0">
                    <Wallet size={18} className="text-white" />
                </div>
                {!collapsed && <div><span className="font-bold text-white text-sm tracking-wide">FINANÇAS</span><p className="text-[10px] text-gray-500">Controle Financeiro</p></div>}
            </div>
            <nav className="flex-1 py-4 px-2 space-y-1">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} end={to === '/'}
                        className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-[#4f8ef7]/20 to-[#7c3aed]/20 text-[#4f8ef7] border border-[#4f8ef7]/30' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? label : undefined}>
                        <Icon size={18} className="flex-shrink-0" />
                        {!collapsed && <span>{label}</span>}
                    </NavLink>
                ))}
            </nav>
            <button onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 w-6 h-6 bg-[#1a1a2e] border border-[#2d2d4a] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-[#4f8ef7] transition-all duration-200 z-10">
                {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
            {!collapsed && <div className="px-4 py-3 border-t border-[#1e1e32]"><p className="text-[10px] text-gray-600 text-center">Dados salvos localmente</p></div>}
        </aside>
    );
}
