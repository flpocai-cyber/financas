import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import CreditCards from './pages/CreditCards';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import BankAccounts from './pages/BankAccounts';
import Crypto from './pages/Crypto';
import Reports from './pages/Reports';
import Planning from './pages/Planning';
import Bills from './pages/Bills';


export default function App() {
    return (
        <FinanceProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="cartoes" element={<CreditCards />} />
                        <Route path="despesas" element={<Expenses />} />
                        <Route path="bills" element={<Bills />} />
                        <Route path="recebimentos" element={<Income />} />
                        <Route path="contas" element={<BankAccounts />} />
                        <Route path="cripto" element={<Crypto />} />
                        <Route path="planejamento" element={<Planning />} />
                        <Route path="relatorios" element={<Reports />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </FinanceProvider>
    );
}
