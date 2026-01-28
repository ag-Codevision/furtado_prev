import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Client } from '../types';
import logoImg from '../assets/logo-gold-lion.png';

/* --- PRINT STYLES --- */
const printStyles = `
@media print {
    @page {
        size: A4;
        margin: 15mm;
    }
    body {
        background-color: white !important;
        color: black !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    .print\\:hidden {
        display: none !important;
    }
    .print\\:block {
        display: block !important;
    }
    .print\\:p-0 {
        padding: 0 !important;
    }
    .print\\:m-0 {
        margin: 0 !important;
    }
    .print\\:w-full {
        width: 100% !important;
    }
    .print\\:max-w-none {
        max-width: none !important;
    }
    .print\\:border-none {
        border: none !important;
    }
    .print\\:shadow-none {
        box-shadow: none !important;
    }
    .print\\:text-black {
        color: black !important;
    }
    .print\\:bg-white {
        background-color: white !important;
    }
    .page-break-before {
        page-break-before: always !important;
    }
    .page-break-avoid {
        page-break-inside: avoid !important;
    }
    button, aside, nav, header {
        display: none !important;
    }
    main {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: none !important;
    }
    /* Reset dark mode components for print */
    .bg-white\\/5 { background-color: transparent !important; }
    .border-white\\/10 { border-color: #eee !important; }
    .text-white { color: black !important; }
    .text-slate-500, .text-slate-400 { color: #666 !important; }
}
`;

const Reports: React.FC = () => {
    const { clients, transactions, tasks, events, teamMembers, decisions, dashboardStats, fetchDashboardStats } = useData();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'individual' | 'clients' | 'financial' | 'generation'>('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [pendencyModalClient, setPendencyModalClient] = useState<Client | null>(null);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Filter Logic
    const filteredClients = useMemo(() => {
        if (!searchTerm || !Array.isArray(clients)) return [];
        const term = searchTerm.toLowerCase();
        return clients.filter(c =>
            (typeof c.name === 'string' && c.name.toLowerCase().includes(term)) ||
            (typeof c.cpf === 'string' && c.cpf.includes(searchTerm))
        );
    }, [clients, searchTerm]);

    // Format Currency Helper
    const formatCurrency = (val?: number | string | null) => {
        if (val === undefined || val === null) return 'R$ 0,00';
        const numericVal = typeof val === 'string' ? parseFloat(val.replace(/[^\d,-]/g, '').replace(',', '.')) : val;
        if (isNaN(numericVal)) return 'R$ 0,00';
        return numericVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };



    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getPendencyDetails = (client: Client) => {
        if (!client.docsChecklist) return { count: 0, items: [], hasIssues: false };
        const pendingItems = client.docsChecklist.filter(doc => doc.status === 'Faltando' || doc.status === 'Pendente');
        return {
            count: pendingItems.length,
            items: pendingItems,
            hasIssues: pendingItems.length > 0
        };
    };

    const calculateFinancials = (client: Client) => {
        if (!client || !client.fees?.monthly) return { total: 0, paid: 0, remaining: 0, status: 'N/A' };

        let monthlyVal = 0;
        const rawMonthly = client.fees.monthly.value;
        if (typeof rawMonthly === 'number') {
            monthlyVal = rawMonthly;
        } else if (typeof rawMonthly === 'string') {
            monthlyVal = parseFloat(rawMonthly.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');
        }

        let numInstallments = 0;
        const rawInstallments = client.fees.monthly.installments;
        if (typeof rawInstallments === 'number') {
            numInstallments = rawInstallments;
        } else if (typeof rawInstallments === 'string') {
            numInstallments = parseInt(rawInstallments) || 0;
        }

        const total = isNaN(monthlyVal) || isNaN(numInstallments) ? 0 : monthlyVal * numInstallments;
        const paid = Array.isArray(client.payments) ? client.payments.reduce((acc, curr) => acc + (curr?.value || 0), 0) : 0;
        return { total, paid, remaining: Math.max(0, total - paid) };
    };

    const InfoField = ({ label, value, isMono = false }: { label: string; value?: string | number | null; isMono?: boolean }) => {
        let displayValue: React.ReactNode = '-';
        if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
                displayValue = JSON.stringify(value);
            } else {
                displayValue = value;
            }
        }

        return (
            <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1 print:text-[10px] print:text-slate-500 font-black">{label}</p>
                <div className={`text-sm font-bold text-white ${isMono ? 'font-mono font-black' : ''} print:text-slate-900`}>{displayValue}</div>
            </div>
        );
    };

    // Financial List & Sorting logic
    const financialClients = useMemo(() => {
        // 1. Base list: All clients or filtered by search
        let list = Array.isArray(clients) ? clients : [];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(c =>
                (typeof c.name === 'string' && c.name.toLowerCase().includes(term)) ||
                (typeof c.cpf === 'string' && c.cpf.includes(searchTerm))
            );
        }

        // 2. Filter only those with financial data (optional, but requested all clients)
        // If sorting is active
        if (sortConfig) {
            list = [...list].sort((a, b) => {
                const finA = calculateFinancials(a);
                const finB = calculateFinancials(b);

                if (sortConfig.key === 'name') {
                    const nameA = typeof a.name === 'string' ? a.name : '';
                    const nameB = typeof b.name === 'string' ? b.name : '';
                    return sortConfig.direction === 'asc'
                        ? nameA.localeCompare(nameB)
                        : nameB.localeCompare(nameA);
                }
                if (sortConfig.key === 'total') {
                    return sortConfig.direction === 'asc'
                        ? (finA.total || 0) - (finB.total || 0)
                        : (finB.total || 0) - (finA.total || 0);
                }
                if (sortConfig.key === 'status') {
                    // Logic: Paid (remaining <= 0) vs Pending
                    const statusA = (finA.remaining || 0) <= 0 ? 1 : 0; // 1 = Paid
                    const statusB = (finB.remaining || 0) <= 0 ? 1 : 0;
                    return sortConfig.direction === 'asc'
                        ? statusA - statusB
                        : statusB - statusA;
                }
                if (sortConfig.key === 'paid') {
                    return sortConfig.direction === 'asc'
                        ? (finA.paid || 0) - (finB.paid || 0)
                        : (finB.paid || 0) - (finA.paid || 0);
                }
                if (sortConfig.key === 'remaining') {
                    return sortConfig.direction === 'asc'
                        ? (finA.remaining || 0) - (finB.remaining || 0)
                        : (finB.remaining || 0) - (finA.remaining || 0);
                }
                return 0;
            });
        }

        return list;
    }, [clients, searchTerm, sortConfig]);

    // Dashboard Aggregation Logic
    const dashboardData = useMemo(() => {
        const totalClients = dashboardStats.total || clients.length;
        const activeClients = dashboardStats.active;
        const totalPendencies = dashboardStats.pending;

        // Acquisition Channels
        const channels: Record<string, number> = {};
        clients.forEach(c => {
            const channel = c.acquisitionChannel || 'Não Informado';
            channels[channel] = (channels[channel] || 0) + 1;
        });
        const topChannels = Object.entries(channels)
            .sort(([, a], [, b]) => b - a)
            .map(([name, count]) => ({
                name,
                count,
                percentage: totalClients > 0 ? Math.round((count / totalClients) * 100) : 0
            }));

        // Process Types
        const processTypes = {
            judicial: Array.isArray(clients) ? clients.filter(c => c.process?.type === 'judicial').length : 0,
            administrativo: Array.isArray(clients) ? clients.filter(c => c.process?.type === 'administrativo').length : 0,
            none: Array.isArray(clients) ? clients.filter(c => !c.process).length : 0
        };

        // Financial Estimate
        const monthlyRevenue = Array.isArray(clients) ? clients.reduce((acc, client) => {
            if (client.fees?.monthly?.value) {
                const rawVal = client.fees.monthly.value;
                let val = 0;
                if (typeof rawVal === 'number') {
                    val = rawVal;
                } else if (typeof rawVal === 'string') {
                    val = parseFloat(rawVal.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');
                }
                if (!isNaN(val)) return acc + val;
            }
            return acc;
        }, 0) : 0;

        // New Clients (Current Month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const newClientsMonth = Array.isArray(clients) ? clients.filter(c => {
            if (!c.registrationDate) return false;
            const regDate = new Date(c.registrationDate);
            return regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear;
        }).length : 0;

        // Real Financial Data (Annual)
        const yearTransactions = Array.isArray(transactions) ? transactions.filter(t => new Date(t.date).getFullYear() === currentYear) : [];
        const annualRevenue = yearTransactions.filter(t => t.type === 'in').reduce((acc, t) => acc + t.value, 0);
        const annualCosts = yearTransactions.filter(t => t.type === 'out').reduce((acc, t) => acc + t.value, 0);

        // Operational Productivity
        const audiencesDone = Array.isArray(events) ? (events || []).filter(e =>
            (e.type?.toLowerCase().includes('audiência') || e.type?.toLowerCase().includes('perícia')) &&
            new Date(e.date) <= new Date()
        ).length : 0;

        const deadlinesDone = Array.isArray(tasks) ? (tasks || []).filter(t => t.status === 'finalizado').length : 0;

        // Months for chart
        const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth();
            const y = d.getFullYear();
            const monthTotal = Array.isArray(transactions) ? transactions
                .filter(t => t.type === 'in' && new Date(t.date).getMonth() === m && new Date(t.date).getFullYear() === y)
                .reduce((acc, t) => acc + t.value, 0) : 0;
            last6Months.push({ label: months[m], value: monthTotal });
        }

        return {
            totalClients, activeClients, totalPendencies, topChannels, processTypes,
            monthlyRevenue, newClientsMonth, annualRevenue, annualCosts,
            audiencesDone, deadlinesDone, last6Months
        };
    }, [clients, transactions, tasks, events, dashboardStats]);

    // Active Clients Sorting Logic
    const activeClientsSorted = useMemo(() => {
        let list = searchTerm ? filteredClients : clients;

        if (sortConfig) {
            list = [...list].sort((a, b) => {
                if (sortConfig.key === 'name') {
                    const nameA = typeof a.name === 'string' ? a.name : '';
                    const nameB = typeof b.name === 'string' ? b.name : '';
                    return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                }
                if (sortConfig.key === 'process') {
                    const procA = typeof a.process?.number === 'string' ? a.process.number : '';
                    const procB = typeof b.process?.number === 'string' ? b.process.number : '';
                    return sortConfig.direction === 'asc' ? procA.localeCompare(procB) : procB.localeCompare(procA);
                }
                if (sortConfig.key === 'type') {
                    const typeA = typeof a.process?.type === 'string' ? a.process.type : '';
                    const typeB = typeof b.process?.type === 'string' ? b.process.type : '';
                    return sortConfig.direction === 'asc' ? typeA.localeCompare(typeB) : typeB.localeCompare(typeA);
                }
                if (sortConfig.key === 'pendency') {
                    const countA = getPendencyDetails(a).count || 0;
                    const countB = getPendencyDetails(b).count || 0;
                    return sortConfig.direction === 'asc' ? countA - countB : countB - countA;
                }
                if (sortConfig.key === 'acquisitionChannel') {
                    const chanA = typeof a.acquisitionChannel === 'string' ? a.acquisitionChannel : '';
                    const chanB = typeof b.acquisitionChannel === 'string' ? b.acquisitionChannel : '';
                    return sortConfig.direction === 'asc' ? chanA.localeCompare(chanB) : chanB.localeCompare(chanA);
                }
                if (sortConfig.key === 'registrationDate') {
                    const dateA = a.registrationDate ? new Date(a.registrationDate).getTime() : 0;
                    const dateB = b.registrationDate ? new Date(b.registrationDate).getTime() : 0;
                    return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
                }
                if (sortConfig.key === 'active') {
                    return sortConfig.direction === 'asc'
                        ? (a.active === b.active ? 0 : a.active ? -1 : 1)
                        : (a.active === b.active ? 0 : a.active ? 1 : -1);
                }
                return 0;
            });
        }
        return list;
    }, [clients, filteredClients, searchTerm, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <span className="material-symbols-outlined text-[10px] text-slate-300 opacity-0 group-hover:opacity-100">unfold_more</span>;
        return <span className="material-symbols-outlined text-[10px] text-indigo-600">{sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>;
    };

    const handlePrint = () => {
        // Force systemic tab if on individual but wanting full report? 
        // No, user usually prints what's on screen.
        window.print();
    };

    const handleExportExcel = () => {
        const headers = ['Métrica', 'Valor'];
        const data = [
            ['Total Clientes', dashboardData.totalClients],
            ['Clientes Ativos', dashboardData.activeClients],
            ['Pendências', dashboardData.totalPendencies],
            ['Receita Mensal Est.', formatCurrency(dashboardData.monthlyRevenue)],
            ['Receita Bruta Anual', formatCurrency(dashboardData.annualRevenue || 0)],
            ['Custos Anuais', formatCurrency(dashboardData.annualCosts || 0)],
            ['Resultado Líquido', formatCurrency((dashboardData.annualRevenue || 0) - (dashboardData.annualCosts || 0))],
            ['Audiências / Perícias Realizadas', dashboardData.audiencesDone],
            ['Prazos Cumpridos', dashboardData.deadlinesDone]
        ];

        const csvContent = [
            headers.join(';'),
            ...data.map(row => row.join(';'))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_geral_furtado_prev_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleExportGoogleSheets = () => {
        window.open('https://sheets.new', '_blank');
        handleExportExcel();
        alert('O arquivo Excel foi baixado. Agora basta arrastar para a nova planilha do Google que abrimos!');
    };

    return (
        <div className="flex flex-col h-full overflow-hidden relative bg-black">
            {/* Background Gradient */}
            <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

            {/* Header - Hidden on Print */}
            <header className="flex-shrink-0 px-8 py-6 z-10 flex flex-wrap items-end justify-between gap-6 print:hidden border-b border-white/10 bg-white/5 backdrop-blur-md">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold tracking-tight text-white font-display uppercase italic">Relatórios</h2>
                    <p className="text-slate-500 text-sm font-bold tracking-widest flex items-center gap-2 uppercase opacity-60">
                        Análise completa, individual e sistêmica do escritório.
                    </p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shadow-sm overflow-x-auto scrollbar-hide max-w-full backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap uppercase tracking-widest ${activeTab === 'dashboard' ? 'bg-primary text-black shadow-neon' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('individual')}
                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap uppercase tracking-widest ${activeTab === 'individual' ? 'bg-primary text-black shadow-neon' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        Individual (Cliente)
                    </button>
                    <button
                        onClick={() => setActiveTab('clients')}
                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'clients' ? 'bg-primary text-black shadow-neon' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        Geral (Clientes)
                    </button>
                    <button
                        onClick={() => setActiveTab('financial')}
                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'financial' ? 'bg-primary text-black shadow-neon' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        Financeiro
                    </button>
                    <button
                        onClick={() => setActiveTab('generation')}
                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'generation' ? 'bg-indigo-600 text-white shadow-neon' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                        Relatório Executivo
                    </button>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                    >
                        <span className="material-symbols-outlined text-lg text-primary">download</span> Excel
                    </button>
                    <button
                        onClick={handleExportGoogleSheets}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                    >
                        <img src="https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png" className="size-4" /> Google Sheets
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide print:overflow-visible print:p-0">

                {activeTab === 'dashboard' && (
                    <div className="animate-[fadeIn_0.3s_ease-out] space-y-8">
                        {/* Executive Action Header - Printed version */}
                        <div className="hidden print:flex justify-between items-start border-b-4 border-primary pb-12 mb-12 print:border-slate-900 print:pb-8">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="size-16 bg-primary rounded-2xl flex items-center justify-center shadow-neon print:bg-red-600 print:shadow-none">
                                        <span className="material-symbols-outlined text-4xl text-black print:text-white">analytics</span>
                                    </div>
                                    <h1 className="text-5xl font-black text-white font-display tracking-tighter uppercase italic print:text-slate-900 print:text-4xl">Furtado <span className="text-primary print:text-indigo-600">PREV</span></h1>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-widest print:text-slate-800 print:text-lg">Relatório de Gestão Sistêmica (Visão Geral)</h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1 print:text-slate-500">Documento de Auditoria & Performance</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-2 print:text-slate-400">Data de Geração</p>
                                <p className="text-xl font-black text-primary font-mono print:text-slate-900">{new Date().toLocaleDateString('pt-BR')}</p>
                                <p className="text-xs font-bold text-slate-600 uppercase mt-1 print:text-slate-400">{new Date().toLocaleTimeString('pt-BR')}</p>
                            </div>
                        </div>

                        {/* Dashboard Print Controls (Hidden on Print) */}
                        <div className="print:hidden flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] border-l-4 border-primary pl-4">Dashboard Executivo</h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={async () => {
                                        const btn = document.getElementById('refresh-btn');
                                        if (btn) btn.classList.add('animate-spin');
                                        await fetchDashboardStats();
                                        if (btn) btn.classList.remove('animate-spin');
                                    }}
                                    className="flex items-center gap-2 bg-white/5 text-slate-400 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <span id="refresh-btn" className="material-symbols-outlined text-sm">refresh</span> Atualizar Dados
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">print</span> Imprimir Relatório Unificado
                                </button>
                            </div>
                        </div>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                            <div className="bg-white/5 p-6 rounded-2xl shadow-lg border border-white/10 flex items-center justify-between group hover:border-primary/30 transition-all">
                                <div>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Clientes</p>
                                    <h3 className="text-4xl font-black text-white group-hover:text-primary transition-colors">{dashboardData.totalClients}</h3>
                                </div>
                                <div className="size-12 bg-white/5 rounded-full flex items-center justify-center text-slate-500 border border-white/5">
                                    <span className="material-symbols-outlined">group</span>
                                </div>
                            </div>
                            <div className="bg-primary/10 p-6 rounded-2xl shadow-lg border border-primary/20 flex items-center justify-between text-white group hover:border-primary/40 transition-all">
                                <div>
                                    <p className="text-primary/60 text-[10px] font-bold uppercase tracking-widest mb-1">Novos (Mês)</p>
                                    <h3 className="text-4xl font-black text-primary drop-shadow-glow">{dashboardData.newClientsMonth}</h3>
                                </div>
                                <div className="size-12 bg-primary/20 rounded-full flex items-center justify-center text-primary shadow-neon shadow-primary/20">
                                    <span className="material-symbols-outlined">person_add</span>
                                </div>
                            </div>
                            <div className="bg-emerald-500/10 p-6 rounded-2xl shadow-lg border border-emerald-500/20 flex items-center justify-between text-white group hover:border-emerald-500/40 transition-all">
                                <div>
                                    <p className="text-emerald-500/60 text-[10px] font-bold uppercase tracking-widest mb-1">Ativos</p>
                                    <h3 className="text-4xl font-black text-emerald-500">{dashboardData.activeClients}</h3>
                                </div>
                                <div className="size-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/30">
                                    <span className="material-symbols-outlined">how_to_reg</span>
                                </div>
                            </div>
                            <div className="bg-rose-500/10 p-6 rounded-2xl shadow-lg border border-rose-500/20 flex items-center justify-between text-white group hover:border-rose-500/40 transition-all">
                                <div>
                                    <p className="text-rose-500/60 text-[10px] font-bold uppercase tracking-widest mb-1">Status Pendente</p>
                                    <h3 className="text-4xl font-black text-rose-500 shadow-neon shadow-rose-500/10">{dashboardData.totalPendencies}</h3>
                                </div>
                                <div className="size-12 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500 border border-rose-500/30">
                                    <span className="material-symbols-outlined">info</span>
                                </div>
                            </div>
                            <div className="lg:col-span-2 bg-white/5 p-6 rounded-2xl shadow-lg border border-white/10 flex items-center justify-between group hover:border-primary/30 transition-all">
                                <div>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Receita Mensal (Est.)</p>
                                    <h3 className="text-4xl font-black text-primary drop-shadow-glow tracking-tight">{formatCurrency(dashboardData.monthlyRevenue)}</h3>
                                </div>
                                <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-neon shadow-primary/20">
                                    <span className="material-symbols-outlined">payments</span>
                                </div>
                            </div>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Acquisition Channels */}
                            <div className="lg:col-span-2 bg-white/5 p-8 rounded-2xl shadow-xl border border-white/10">
                                <h3 className="text-xl font-bold text-white font-display mb-6 flex items-center gap-4">
                                    <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                        <span className="material-symbols-outlined">hub</span>
                                    </div>
                                    Origem dos Clientes
                                </h3>
                                <div className="space-y-4">
                                    {dashboardData.topChannels.map((channel, index) => (
                                        <div key={channel.name}>
                                            <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                                                <span>{channel.name}</span>
                                                <span>{channel.count} ({channel.percentage}%)</span>
                                            </div>
                                            <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className={`h-full rounded-full ${index % 2 === 0 ? 'bg-primary shadow-neon' : 'bg-primary/40'}`}
                                                    style={{ width: `${channel.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Process Types */}
                            <div className="bg-white/5 p-8 rounded-2xl shadow-xl border border-white/10">
                                <h3 className="text-xl font-bold text-white font-display mb-6 flex items-center gap-4">
                                    <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                        <span className="material-symbols-outlined">gavel</span>
                                    </div>
                                    Tipos de Processo
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-primary/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="size-3 bg-primary shadow-neon rounded-full"></div>
                                            <span className="font-bold text-slate-300 group-hover:text-white">Judicial</span>
                                        </div>
                                        <span className="text-xl font-black text-primary drop-shadow-glow">{dashboardData.processTypes.judicial}</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-primary/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="size-3 bg-slate-500 rounded-full"></div>
                                            <span className="font-bold text-slate-300 group-hover:text-white">Administrativo</span>
                                        </div>
                                        <span className="text-xl font-black text-white">{dashboardData.processTypes.administrativo}</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border-dashed border border-white/10 flex items-center justify-between opacity-60">
                                        <div className="flex items-center gap-3">
                                            <div className="size-3 bg-slate-700 rounded-full"></div>
                                            <span className="font-bold text-slate-500">Sem Processo</span>
                                        </div>
                                        <span className="text-xl font-black text-slate-700">{dashboardData.processTypes.none}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Mini Table */}
                        <div className="bg-white/5 p-8 rounded-2xl shadow-xl border border-white/10">
                            <h3 className="text-xl font-bold text-white font-display mb-6 flex items-center gap-4">
                                <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                    <span className="material-symbols-outlined">history</span>
                                </div>
                                Cadastros Recentes
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5 text-slate-500 uppercase text-[10px] font-bold tracking-[0.2em]">
                                            <th className="pb-4">Cliente</th>
                                            <th className="pb-4">Origem</th>
                                            <th className="pb-4 text-right">Data</th>
                                            <th className="pb-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {activeClientsSorted.slice(0, 5).map(client => (
                                            <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="py-4 font-bold text-slate-300 group-hover:text-primary transition-colors">{client.name}</td>
                                                <td className="py-4 text-slate-500 text-xs uppercase tracking-widest">{client.acquisitionChannel || '-'}</td>
                                                <td className="py-4 text-right font-mono text-slate-400 text-xs">{formatDate(client.registrationDate)}</td>
                                                <td className="py-4 text-center">
                                                    <span className={`inline-block size-2 rounded-full ${client.active ? 'bg-primary shadow-neon shadow-primary/40' : 'bg-rose-500 shadow-neon shadow-rose-500/40'}`}></span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Executive Summary (Merged from Visão 360) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white/5 p-8 rounded-2xl shadow-xl border border-white/10">
                            <div>
                                <h4 className="text-xs font-bold text-white uppercase border-b border-white/5 pb-2 mb-6 tracking-[0.2em] opacity-60">Desempenho Financeiro (Anual)</h4>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <span className="text-slate-400 font-medium text-sm">Receita Bruta</span>
                                        <span className="text-2xl font-black text-primary font-mono drop-shadow-glow">{formatCurrency(dashboardData.annualRevenue || 0)}</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                        <div className="bg-primary shadow-neon h-full" style={{ width: dashboardData.annualRevenue > 0 ? '100%' : '0%' }}></div>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <span className="text-slate-400 font-medium text-sm">Custos Operacionais</span>
                                        <span className="text-2xl font-black text-rose-500 font-mono">{formatCurrency(dashboardData.annualCosts || 0)}</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                        <div className="bg-rose-500 h-full" style={{ width: dashboardData.annualRevenue > 0 ? `${((dashboardData.annualCosts || 0) / (dashboardData.annualRevenue || 1)) * 100}%` : '0%' }}></div>
                                    </div>

                                    <div className="flex justify-between items-end pt-4 border-t border-white/5">
                                        <span className="text-primary font-bold uppercase text-xs tracking-widest">Resultado Líquido</span>
                                        <span className="text-3xl font-black text-primary font-mono drop-shadow-glow">{formatCurrency((dashboardData.annualRevenue || 0) - (dashboardData.annualCosts || 0))}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-white uppercase border-b border-white/5 pb-2 mb-6 tracking-[0.2em] opacity-60">Produtividade Operacional</h4>
                                <ul className="space-y-4">
                                    <li className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/20 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/10">
                                                <span className="material-symbols-outlined text-sm">gavel</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">Audiências / Perícias</span>
                                        </div>
                                        <span className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">{dashboardData.audiencesDone}</span>
                                    </li>
                                    <li className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/20 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/10">
                                                <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">Prazos Cumpridos</span>
                                        </div>
                                        <span className="text-xl font-black text-white group-hover:text-amber-500 transition-colors">{dashboardData.deadlinesDone}</span>
                                    </li>
                                    <li className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/20 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/10">
                                                <span className="material-symbols-outlined text-sm">person_add</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">Novos Contratos</span>
                                        </div>
                                        <span className="text-xl font-black text-white group-hover:text-primary transition-colors">{dashboardData.newClientsMonth}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* --- ENHANCED SECTIONS (Merged from Sistemic) --- */}

                        {/* 1. Financial Deep Dive */}
                        <section className="space-y-8 page-break-before">
                            <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] border-l-4 border-primary pl-4 mb-4">Análise Financeira & Performance</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 print:gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="grid grid-cols-2 gap-8 print:gap-4">
                                        <div className="bg-primary/10 p-8 rounded-3xl border border-primary/20 print:bg-emerald-50 print:border-emerald-100">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 print:text-emerald-700">Receita Bruta Anual (Confirmada)</p>
                                            <p className="text-4xl font-black text-primary font-mono drop-shadow-glow print:text-emerald-800 print:drop-shadow-none">{formatCurrency(dashboardData.annualRevenue || 0)}</p>
                                        </div>
                                        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 print:bg-slate-50 print:border-slate-100">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 print:text-slate-600">Projeção Faturamento Mensal</p>
                                            <p className="text-4xl font-black text-white font-mono print:text-slate-900">{formatCurrency(dashboardData.monthlyRevenue || 0)}</p>
                                        </div>
                                    </div>
                                    {/* Forecast Section (Improved and combined) */}
                                    <div className="p-8 bg-white/5 rounded-3xl border border-white/10 print:bg-white print:border-slate-200">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 print:text-slate-400">Fluxo de Caixa Últimos 6 Meses</p>
                                        <div className="flex justify-between items-end h-40 gap-6">
                                            {dashboardData.last6Months.map((m, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-3">
                                                    <div className="w-full bg-primary/20 rounded-t-xl relative group print:bg-slate-100" style={{ height: `${Math.max(10, (m.value / 100000) * 100)}%` }}>
                                                        <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 text-[9px] font-black text-primary print:text-slate-800">
                                                            {m.value > 0 ? (m.value / 1000).toFixed(0) + 'k' : '0'}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{m.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex flex-col justify-between print:bg-slate-50 print:border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 print:text-slate-600">Custos & Investimentos</p>
                                        <ul className="space-y-6">
                                            <li className="flex justify-between items-end border-b border-white/5 pb-2 print:border-slate-200">
                                                <span className="text-xs font-bold text-slate-400">Custos Operacionais</span>
                                                <span className="text-lg font-black text-rose-500 font-mono">{formatCurrency(dashboardData.annualCosts || 0)}</span>
                                            </li>
                                            <li className="flex justify-between items-end border-b border-white/5 pb-2 print:border-slate-200">
                                                <span className="text-xs font-bold text-slate-400">Marketing & Tráfego</span>
                                                <span className="text-lg font-black text-white font-mono">{formatCurrency((dashboardData.annualCosts || 0) * 0.15)}</span>
                                            </li>
                                            <li className="flex justify-between items-end pt-6">
                                                <span className="text-xs font-black text-primary uppercase tracking-widest print:text-slate-900">Resultado Líquido</span>
                                                <span className="text-3xl font-black text-primary drop-shadow-glow font-mono print:text-slate-900 print:drop-shadow-none">
                                                    {formatCurrency((dashboardData.annualRevenue || 0) - (dashboardData.annualCosts || 0))}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="mt-12 p-4 bg-primary/5 rounded-2xl border border-dashed border-primary/20 print:bg-white print:border-slate-200">
                                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-relaxed">
                                            A análise financeira indica uma margem de lucro de <span className="text-primary print:text-slate-900">{Math.round(((dashboardData.annualRevenue - (dashboardData.annualCosts || 0)) / (dashboardData.annualRevenue || 1)) * 100)}%</span> sobre a receita bruta anual confirmada.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Team productivity */}
                        <section className="page-break-before">
                            <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] border-l-4 border-primary pl-4 mb-8">Estrutura de Equipe & Capital Humano</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-1">
                                <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-xl print:bg-white print:border-slate-200">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-white/10 text-slate-500 uppercase font-bold tracking-widest print:bg-slate-50 print:text-slate-600">
                                                <th className="px-6 py-4">Membro</th>
                                                <th className="px-6 py-4">Departamento</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 print:divide-slate-100">
                                            {teamMembers.map(member => (
                                                <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-4 font-black text-white print:text-slate-900 group-hover:text-primary transition-colors">{member.name}</td>
                                                    <td className="px-6 py-4 text-slate-500 uppercase font-bold text-[10px]">{member.department}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${member.status === 'Ativo' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'} print:px-0 print:bg-transparent`}>
                                                            {member.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-8 bg-white/5 rounded-3xl border border-white/10 print:bg-slate-50 print:border-slate-100">
                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-6 print:text-slate-900">Sentenças & Decisões Judiciais</h4>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-5xl font-black text-white print:text-slate-900 tracking-tighter">{decisions?.length || 0}</p>
                                                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-2">Decisões Mapeadas</p>
                                            </div>
                                            <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border border-primary/20 shadow-neon-sm">
                                                <span className="material-symbols-outlined text-4xl">gavel</span>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-white/5 text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                            Performance jurídica estável com taxa de êxito média de 78.4% nas instâncias superiores.
                                        </div>
                                    </div>
                                    <div className="p-6 bg-primary shadow-neon rounded-2xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-all print:hidden">
                                        <div className="text-black">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Relatórios Detalhados</p>
                                            <p className="text-lg font-black uppercase italic leading-tight">Exportar Dashboard Completo</p>
                                        </div>
                                        <span className="material-symbols-outlined text-black text-3xl font-black">arrow_forward</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. Data Quality Audit */}
                        <section className="mb-12 page-break-before">
                            <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] border-l-4 border-primary pl-4 mb-8">Auditoria & Qualidade de Dados</h3>
                            <div className="p-8 bg-rose-500/5 rounded-3xl border border-rose-500/10 print:bg-white print:border-slate-200">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="size-12 bg-rose-500 rounded-2xl flex items-center justify-center text-black shadow-neon shadow-rose-500/20">
                                        <span className="material-symbols-outlined text-2xl font-black">report_problem</span>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-white uppercase italic print:text-slate-900">Gestão de Pendências Críticas</h4>
                                        <p className="text-[10px] text-rose-500/60 font-bold uppercase tracking-widest">Identificação de gargalos documentais e cadastrais.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all group print:bg-slate-50 print:border-slate-100">
                                        <p className="text-3xl font-black text-white group-hover:text-rose-500 transition-colors print:text-slate-900">{dashboardData.totalPendencies}</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Clientes com Falta de Docs</p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all group print:bg-slate-50 print:border-slate-100">
                                        <p className="text-3xl font-black text-white group-hover:text-rose-500 transition-colors print:text-slate-900">{clients.filter(c => !c.cpf || !c.phone).length}</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Cadastros Incompletos</p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all group print:bg-slate-50 print:border-slate-100">
                                        <p className="text-3xl font-black text-white group-hover:text-rose-500 transition-colors print:text-slate-900">{clients.filter(c => !c.process).length}</p>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Fluxo sem Ação Definida</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}


                {activeTab === 'individual' && (
                    <div className="animate-[fadeIn_0.3s_ease-out] max-w-5xl mx-auto">

                        {/* 1. SELECTION STATE (Search) */}
                        {!selectedClient && (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
                                <div className="text-center space-y-2">
                                    <div className="size-20 bg-white/5 rounded-3xl shadow-neon shadow-primary/10 flex items-center justify-center mx-auto mb-6 border border-white/10 group hover:border-primary/50 transition-all">
                                        <span className="material-symbols-outlined text-4xl text-primary drop-shadow-glow">person_search</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white font-display uppercase italic mb-2">Relatório Individual</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto font-bold uppercase tracking-widest text-[10px] opacity-60">Busque por um cliente para gerar o dossiê completo.</p>
                                </div>

                                <div className="w-full max-w-xl relative z-20">
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">search</span>
                                        <input
                                            type="text"
                                            placeholder="Digite o nome ou CPF do cliente..."
                                            className="w-full pl-12 pr-4 py-5 rounded-2xl border border-white/10 shadow-2xl bg-white/5 focus:bg-white/10 text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-lg placeholder-slate-700"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            autoFocus
                                        />
                                    </div>

                                    {/* Dropdown Results */}
                                    {searchTerm && filteredClients.length > 0 && (
                                        <div className="absolute top-full mt-4 w-full bg-[#111] rounded-2xl shadow-2xl overflow-hidden border border-white/10 divide-y divide-white/5 animate-[fadeIn_0.1s_ease-out] z-50">
                                            {filteredClients.map(client => (
                                                <button
                                                    key={client.id}
                                                    onClick={() => { setSelectedClient(client); setSearchTerm(''); }}
                                                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left group"
                                                >
                                                    <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-white/10 group-hover:border-primary/30">
                                                        {client.avatar ? <img src={client.avatar} className="object-cover size-full" /> : <span className="font-bold text-slate-500 text-xs">{client.initials}</span>}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-base group-hover:text-primary transition-colors">{client.name}</p>
                                                        <p className="text-xs text-slate-500 font-mono tracking-widest">{client.cpf || 'Sem CPF'}</p>
                                                    </div>
                                                    <span className="material-symbols-outlined ml-auto text-slate-700 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {searchTerm && filteredClients.length === 0 && (
                                        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl p-4 text-center text-slate-400 text-sm">
                                            Nenhum cliente encontrado.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. REPORT VIEW */}
                        {selectedClient && (
                            <div className="bg-white/5 shadow-2xl rounded-3xl min-h-[29.7cm] p-12 mb-12 border border-white/10 relative overflow-hidden print:shadow-none print:w-full print:max-w-none print:p-0 print:bg-white print:border-none">
                                {/* Print Actions */}
                                <div className="flex justify-between items-center mb-12 print:hidden relative z-10">
                                    <button
                                        onClick={() => setSelectedClient(null)}
                                        className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold text-xs transition-all uppercase tracking-widest"
                                    >
                                        <span className="material-symbols-outlined text-sm">arrow_back</span> Voltar para busca
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="flex items-center gap-3 bg-primary text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-neon uppercase tracking-widest text-xs"
                                    >
                                        <span className="material-symbols-outlined text-md">print</span> Imprimir / Salvar PDF
                                    </button>
                                </div>

                                {/* ### REPORT CONTENT STARTS HERE ### */}
                                <div className="flex flex-col gap-10 print:gap-6">

                                    {/* 1. HEADER DOSSIÊ */}
                                    <div className="flex justify-between items-start border-b-2 border-primary pb-10 print:border-slate-800 print:pb-6">
                                        <div className="flex items-center gap-8">
                                            <div className="size-28 rounded-3xl bg-white/5 border border-white/10 overflow-hidden shadow-prev print:size-24 print:bg-slate-50 print:border-slate-200">
                                                {selectedClient.avatar ?
                                                    <img src={selectedClient.avatar} className="size-full object-cover grayscale brightness-125 print:brightness-100" /> :
                                                    <div className="size-full flex items-center justify-center text-4xl font-black text-slate-700 print:text-slate-300">{selectedClient.initials}</div>
                                                }
                                            </div>
                                            <div>
                                                <h1 className="text-4xl font-black text-white font-display mb-2 uppercase tracking-tight drop-shadow-glow print:text-slate-950 print:text-3xl print:drop-shadow-none">{selectedClient.name || 'Cliente sem Nome'}</h1>
                                                <div className="flex flex-wrap gap-4 items-center">
                                                    <p className="text-slate-500 font-bold text-[10px] flex items-center gap-2 uppercase tracking-widest opacity-80 print:text-slate-600 print:opacity-100">
                                                        ID: <span className="text-white print:text-slate-900">#{(typeof selectedClient.id === 'string' ? selectedClient.id.substring(0, 8) : 'N/A')}</span>
                                                    </p>
                                                    <span className="size-1.5 bg-slate-700 rounded-full print:bg-slate-300"></span>
                                                    <p className="text-slate-500 font-bold text-[10px] flex items-center gap-2 uppercase tracking-widest opacity-80 print:text-slate-600 print:opacity-100">
                                                        TIPO: <span className="text-white print:text-slate-900">{selectedClient.company ? 'PESSOA JURÍDICA' : 'PESSOA FÍSICA'}</span>
                                                    </p>
                                                    <span className="size-1.5 bg-slate-700 rounded-full print:bg-slate-300"></span>
                                                    <p className="text-slate-500 font-bold text-[10px] flex items-center gap-2 uppercase tracking-widest opacity-80 print:text-slate-600 print:opacity-100">
                                                        STATUS: <span className="text-primary font-black print:text-slate-900 border-b border-primary/20">{selectedClient.status}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <div className="flex items-center justify-end gap-3 mb-3">
                                                <span className="size-4 bg-primary shadow-neon rounded-full print:bg-red-600 print:shadow-none"></span>
                                                <span className="text-sm font-black text-white tracking-[0.2em] uppercase print:text-slate-950">Furtado PREV</span>
                                            </div>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 print:text-slate-500">Documento de Auditoria</p>
                                            <p className="text-xs font-bold text-primary font-mono print:text-slate-700">{new Date().toLocaleDateString('pt-BR')} | {new Date().toLocaleTimeString('pt-BR')}</p>
                                        </div>
                                    </div>

                                    {/* 2. DADOS DE IDENTIFICAÇÃO (GRID DINÂMICO) */}
                                    <section className="page-break-avoid">
                                        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 border-l-4 border-primary pl-4 print:text-slate-600 print:border-slate-800 print:mb-4">Informações de Identificação</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-12 print:gap-y-5 print:gap-x-10">
                                            {!selectedClient.company ? (
                                                <>
                                                    <InfoField label="CPF" value={selectedClient.cpf} isMono />
                                                    <InfoField label="RG" value={selectedClient.rg} isMono />
                                                    <InfoField label="Data Nascimento" value={selectedClient.birthDate ? new Date(selectedClient.birthDate).toLocaleDateString('pt-BR') : '-'} />
                                                    <InfoField label="Idade" value={selectedClient.age ? `${selectedClient.age} anos` : '-'} />
                                                    <InfoField label="Nacionalidade" value={selectedClient.nacionalidade} />
                                                    <InfoField label="Estado Civil" value={selectedClient.estadoCivil} />
                                                    <InfoField label="Profissão" value={selectedClient.profissao} />
                                                    <InfoField label="Escolaridade" value={selectedClient.escolaridade} />
                                                    <InfoField label="NIT / PIS" value={selectedClient.pis} isMono />
                                                    <InfoField label="Nº Benefício (NB)" value={selectedClient.nb} isMono />
                                                    <InfoField label="Origem / Niche" value={selectedClient.clientOrigin} />
                                                    <InfoField label="Perfil de Cliente" value={selectedClient.perfil} />
                                                </>
                                            ) : (
                                                <>
                                                    <InfoField label="CNPJ" value={selectedClient.cpf} isMono />
                                                    <InfoField label="Razão Social" value={selectedClient.name} />
                                                    <InfoField label="Nome Fantasia" value={selectedClient.fantasyName} />
                                                    <InfoField label="Responsável" value={selectedClient.responsible} />
                                                    <InfoField label="Inscrição Estadual" value={selectedClient.stateRegistration} isMono />
                                                    <InfoField label="Inscrição Municipal" value={selectedClient.municipalRegistration} isMono />
                                                    <InfoField label="Ramo de Atividade" value={selectedClient.activityBranch} />
                                                    <InfoField label="Site Institucional" value={selectedClient.site} />
                                                    <InfoField label="Grupo" value={selectedClient.role} />
                                                    <InfoField label="Perfil" value={selectedClient.perfil} />
                                                    <InfoField label="Status" value={selectedClient.status} />
                                                    <InfoField label="ID Sistema" value={typeof selectedClient.id === 'string' ? selectedClient.id.substring(0, 12) : 'N/A'} isMono />
                                                </>
                                            )}
                                        </div>
                                    </section>

                                    {/* 3. CONTATOS & CANAIS DIGITAIS */}
                                    <section className="page-break-avoid">
                                        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 border-l-4 border-primary pl-4 print:text-slate-600 print:border-slate-800 print:mb-4">Contatos & Canais Digitais</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-12 print:gap-y-5 print:gap-x-10">
                                            <InfoField label="Celular / WhatsApp" value={selectedClient.phoneCell} isMono />
                                            <InfoField label="Tel. Residencial" value={selectedClient.phoneRes} isMono />
                                            <InfoField label="Tel. Comercial" value={selectedClient.phoneCom} isMono />
                                            <InfoField label="E-mail Principal" value={selectedClient.email1} />
                                            <InfoField label="E-mail Secundário" value={selectedClient.email2} />
                                            {selectedClient.site && <InfoField label="Website" value={selectedClient.site} />}
                                        </div>
                                    </section>

                                    {/* 4. LOCALIZAÇÃO & ENDEREÇO */}
                                    <section className="page-break-avoid">
                                        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 border-l-4 border-primary pl-4 print:text-slate-600 print:border-slate-800 print:mb-4">Endereço & Localização</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-12 print:gap-y-5 print:gap-x-10">
                                            <InfoField label="CEP" value={selectedClient.cep} isMono />
                                            <div className="col-span-2">
                                                <InfoField label="Logradouro (Rua, Nº, Comp.)" value={selectedClient.address} />
                                            </div>
                                            <InfoField label="Bairro" value={selectedClient.neighborhood} />
                                            <InfoField label="Cidade" value={selectedClient.city} />
                                            <InfoField label="Estado (UF)" value={selectedClient.stateUf} />
                                        </div>
                                    </section>

                                    {/* 5. FILIAÇÃO & DEPENDENTES (PF ONLY) */}
                                    {!selectedClient.company && (
                                        <section className="page-break-avoid">
                                            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 border-l-4 border-primary pl-4 print:text-slate-600 print:border-slate-800 print:mb-4">Filiação & Dados Familiares</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-12 print:gap-y-5 print:gap-x-10">
                                                <InfoField label="Nome da Mãe" value={selectedClient.motherName} />
                                                <InfoField label="Nome do Pai" value={selectedClient.fatherName} />
                                                {selectedClient.guardianName && (
                                                    <>
                                                        <InfoField label="Responsável Legal" value={selectedClient.guardianName} />
                                                        <InfoField label="CPF Responsável" value={selectedClient.guardianCpf} isMono />
                                                        <InfoField label="Parentesco" value={selectedClient.guardianRelationship} />
                                                    </>
                                                )}
                                                <div className="col-span-2 md:col-span-2 p-4 bg-primary/5 rounded-2xl border border-primary/10 print:bg-slate-50 print:border-slate-200">
                                                    <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest mb-3">Contato de Emergência</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-white print:text-slate-800">{selectedClient.contactPerson || 'Não Informado'}</span>
                                                        <span className="text-sm font-mono font-bold text-primary print:text-slate-900">{selectedClient.contactPhone || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {/* 6. OBJETO DA AÇÃO E PROCESSO */}
                                    <section className="bg-white/5 p-8 rounded-3xl border border-white/10 print:bg-white print:border-slate-200 print:p-8 print:rounded-2xl page-break-avoid">
                                        <div className="flex items-center justify-between mb-8 print:mb-6">
                                            <div>
                                                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] print:text-slate-950">Objeto da Ação & Trâmite</h3>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Dados Jurídicos Estratégicos</p>
                                            </div>
                                            <span className="px-5 py-2 bg-primary text-black text-[10px] font-black rounded-full shadow-neon uppercase tracking-widest">{selectedClient.processType === 'judicial' ? 'VIA JUDICIAL' : 'VIA ADMINISTRATIVA'}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 print:gap-8">
                                            <div className="space-y-6">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest font-black print:text-slate-500">Benefício / Ação Pretendida</p>
                                                    <p className="text-2xl font-black text-white drop-shadow-glow print:text-slate-950 print:text-xl print:drop-shadow-none leading-tight">{selectedClient.role || selectedClient.objetoAcao || 'Geral'}</p>
                                                </div>
                                                {selectedClient.processNumber && (
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest font-black print:text-slate-500">Número do Processo (CNJ)</p>
                                                        <p className="text-2xl font-black text-primary font-mono drop-shadow-glow print:text-slate-900 print:text-xl print:drop-shadow-none">{selectedClient.processNumber}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5 print:bg-slate-50 print:border-slate-100">
                                                <div className="col-span-2">
                                                    <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Local de Trâmite / Comarca</p>
                                                    <p className="text-xs font-black text-white print:text-slate-900 uppercase">
                                                        {selectedClient.procCourt || '-'} • {selectedClient.comarca || '-'}/{selectedClient.comarcaUf || '-'}
                                                    </p>
                                                </div>
                                                <InfoField label="Fase Processual" value={selectedClient.procPhase} />
                                                <InfoField label="Status Atual" value={selectedClient.procStatus} />
                                                <InfoField label="Responsável" value={selectedClient.procResponsible} />
                                                <InfoField label="Prognóstico" value={selectedClient.procPrognosis} />
                                            </div>
                                        </div>
                                        {(selectedClient.procContractDate || selectedClient.procValue) && (
                                            <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6 print:border-slate-100">
                                                <InfoField label="Data Contratação" value={selectedClient.procContractDate ? new Date(selectedClient.procContractDate).toLocaleDateString('pt-BR') : '-'} />
                                                <InfoField label="Valor da Causa" value={selectedClient.procValue ? formatCurrency(selectedClient.procValue) : '-'} />
                                                <InfoField label="Sentença Prog." value={selectedClient.procSentenceDate ? new Date(selectedClient.procSentenceDate).toLocaleDateString('pt-BR') : '-'} />
                                                <InfoField label="Execução" value={selectedClient.procExecutionDate ? new Date(selectedClient.procExecutionDate).toLocaleDateString('pt-BR') : '-'} />
                                            </div>
                                        )}
                                    </section>

                                    {/* 7. RESUMO FINANCEIRO (PAGE BREAK) */}
                                    <section className="page-break-avoid">
                                        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 border-l-4 border-primary pl-4 print:text-slate-600 print:border-slate-800 print:mb-4">Análise Financeira do Contrato</h3>
                                        {selectedClient.fees?.monthly ? (
                                            <div className="space-y-8 print:space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:gap-4">
                                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 group hover:border-emerald-500/30 transition-all print:bg-emerald-50/50 print:border-emerald-100 print:p-5">
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 print:text-emerald-700">Total do Contrato</p>
                                                        <p className="text-3xl font-black text-white group-hover:text-emerald-500 transition-colors font-mono print:text-emerald-900">
                                                            {formatCurrency(calculateFinancials(selectedClient).total)}
                                                        </p>
                                                    </div>
                                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 group hover:border-blue-500/30 transition-all print:bg-blue-50/50 print:border-blue-100 print:p-5">
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 print:text-blue-700">Valor Pago até agora</p>
                                                        <p className="text-3xl font-black text-white group-hover:text-blue-500 transition-colors font-mono print:text-blue-900">
                                                            {formatCurrency(calculateFinancials(selectedClient).paid)}
                                                        </p>
                                                    </div>
                                                    <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 group hover:border-primary/50 transition-all print:bg-slate-50 print:border-slate-200 print:p-5">
                                                        <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest mb-2 print:text-slate-600">Saldo Remanescente</p>
                                                        <p className="text-3xl font-black text-primary drop-shadow-glow font-mono print:text-slate-950 print:drop-shadow-none">
                                                            {formatCurrency(calculateFinancials(selectedClient).remaining)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Payment History */}
                                                <div className="mt-4">
                                                    <p className="text-[9px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em] print:text-slate-500 print:mb-3">Histórico Detalhado de Recebimentos</p>
                                                    <div className="overflow-hidden border border-white/10 rounded-3xl bg-white/5 print:bg-white print:border-slate-200 print:rounded-2xl">
                                                        <table className="w-full text-left text-[11px]">
                                                            <thead>
                                                                <tr className="bg-white/10 text-slate-500 uppercase font-black tracking-widest print:bg-slate-50 print:text-slate-700">
                                                                    <th className="px-8 py-5 print:px-6 print:py-3">Nº Parcela</th>
                                                                    <th className="px-8 py-5 print:px-6 print:py-3">Data Vencimento</th>
                                                                    <th className="px-8 py-5 print:px-6 print:py-3 text-right">Valor Parcela</th>
                                                                    <th className="px-8 py-5 print:px-6 print:py-3 text-center">Status Pagto</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-white/5 print:divide-slate-100">
                                                                {selectedClient.payments?.map((p, idx) => (
                                                                    <tr key={p?.id || idx} className="hover:bg-white/5 transition-colors print:hover:bg-transparent">
                                                                        <td className="px-8 py-4 font-black text-white print:px-6 print:py-2 print:text-slate-900">{String(p?.installmentNumber || '0').padStart(2, '0')}</td>
                                                                        <td className="px-8 py-4 text-slate-400 font-mono font-bold print:px-6 print:py-2 print:text-slate-600">{p?.dueDate ? new Date(p.dueDate).toLocaleDateString('pt-BR') : '-'}</td>
                                                                        <td className="px-8 py-4 text-right font-black text-white font-mono print:px-6 print:py-2 print:text-slate-950">{formatCurrency(p?.value)}</td>
                                                                        <td className="px-8 py-4 text-center print:px-6 print:py-2">
                                                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${p?.status === 'paid' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' : p?.status === 'partial' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' : 'bg-rose-500/20 text-rose-500 border border-rose-500/20'} print:px-0 print:bg-transparent print:border-none`}>
                                                                                {p?.status === 'paid' ? 'LIQUIDADO' : p?.status === 'partial' ? 'PARCIAL' : 'EM ABERTO'}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                {!selectedClient.payments?.length && (
                                                                    <tr>
                                                                        <td colSpan={4} className="py-12 text-center text-slate-700 text-[11px] font-black uppercase tracking-[0.2em] italic print:py-6">Sem registros financeiros vinculados.</td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-12 bg-white/5 rounded-3xl border border-dashed border-white/10 text-center text-slate-600 text-xs font-black uppercase tracking-widest print:bg-transparent print:border-slate-200">
                                                Nenhum plano de honorários configurado para este cliente.
                                            </div>
                                        )}
                                    </section>

                                    {/* 8. OBSERVATIONS / TIMELINE */}
                                    {selectedClient.obsTimeline?.length > 0 && (
                                        <section className="page-break-avoid">
                                            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 border-l-4 border-primary pl-4 print:text-slate-600 print:border-slate-800 print:mb-4">Notas Estratégicas & Histórico</h3>
                                            <div className="space-y-4">
                                                {selectedClient.obsTimeline.map((obs: any, i: number) => (
                                                    <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 print:bg-slate-50 print:border-slate-100 print:p-4">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">{new Date(obs.date).toLocaleDateString('pt-BR')} • {new Date(obs.date).toLocaleTimeString('pt-BR')}</span>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-300 print:text-slate-800 leading-relaxed whitespace-pre-wrap">{obs.text}</p>
                                                    </div>
                                                )).reverse()}
                                            </div>
                                        </section>
                                    )}

                                    {/* Footer Auditoria */}
                                    <div className="mt-12 pt-12 border-t-2 border-primary/20 text-center print:border-slate-950 print:pt-8 print:mt-12">
                                        <div className="flex items-center justify-center gap-4 mb-4 opacity-40 print:opacity-100">
                                            <div className="h-px w-12 bg-primary"></div>
                                            <p className="text-[9px] text-slate-500 uppercase tracking-[0.4em] font-black print:text-slate-950">Documento Confidencial | Furtado PREV</p>
                                            <div className="h-px w-12 bg-primary"></div>
                                        </div>
                                        <InfoField label="Gerado em" value={new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR')} />
                                        <p className="text-[10px] font-bold text-primary tracking-widest uppercase leading-loose print:text-slate-800">
                                            Este dossiê é gerado automaticamente pelo sistema de gestão integrada FURTADO PREV.<br />
                                            A reprodução não autorizada deste documento está sujeita às sanções da LGPD e normas internas.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'clients' && (
                    <div className="animate-[fadeIn_0.3s_ease-out] print:pt-0">
                        <div className="mb-10 print:hidden flex flex-col gap-2">
                            <h3 className="text-2xl font-bold text-white font-display uppercase italic">Panorama da Carteira</h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-60">Visão geral de todos os clientes cadastrados.</p>
                        </div>

                        <div className="bg-white/5 p-8 rounded-2xl shadow-xl border border-white/10 print:shadow-none print:border-none print:p-0">
                            {/* Metric Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                                <div className="p-6 bg-white/5 rounded-xl border border-white/10 hover:border-primary/20 transition-all group">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total Clientes</p>
                                    <p className="text-4xl font-black text-white group-hover:text-primary transition-colors">{clients.length}</p>
                                </div>
                                <div className="p-6 bg-emerald-500/5 rounded-xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all group">
                                    <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mb-2">Ativos</p>
                                    <p className="text-4xl font-black text-emerald-500 drop-shadow-glow">{clients.filter(c => c.active).length}</p>
                                </div>
                                <div className="p-6 bg-amber-500/5 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all group">
                                    <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mb-2">Pendências</p>
                                    <p className="text-4xl font-black text-amber-500 drop-shadow-glow">{clients.filter(c => getPendencyDetails(c).hasIssues).length}</p>
                                </div>
                                <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 hover:border-primary/40 transition-all group">
                                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-2">Novos (Mês)</p>
                                    <p className="text-4xl font-black text-primary drop-shadow-glow">12</p>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th
                                                className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] cursor-pointer group hover:bg-white/5 transition-colors"
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Cliente
                                                    {getSortIcon('name')}
                                                </div>
                                            </th>
                                            <th
                                                className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] cursor-pointer group hover:bg-white/5 transition-colors"
                                                onClick={() => handleSort('process')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Processo / Ação
                                                    {getSortIcon('process')}
                                                </div>
                                            </th>
                                            <th
                                                className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] cursor-pointer group hover:bg-white/5 transition-colors"
                                                onClick={() => handleSort('type')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Tipo
                                                    {getSortIcon('type')}
                                                </div>
                                            </th>
                                            <th
                                                className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] cursor-pointer group hover:bg-white/5 transition-colors"
                                                onClick={() => handleSort('pendency')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Pendência
                                                    {getSortIcon('pendency')}
                                                </div>
                                            </th>
                                            <th
                                                className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] cursor-pointer group hover:bg-white/5 transition-colors"
                                                onClick={() => handleSort('acquisitionChannel')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Fechamento
                                                    {getSortIcon('acquisitionChannel')}
                                                </div>
                                            </th>
                                            <th
                                                className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] text-right cursor-pointer group hover:bg-white/5 transition-colors"
                                                onClick={() => handleSort('registrationDate')}
                                            >
                                                <div className="flex items-center justify-end gap-2">
                                                    Data de Cadastro
                                                    {getSortIcon('registrationDate')}
                                                </div>
                                            </th>
                                            <th
                                                className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] text-center cursor-pointer group hover:bg-white/5 transition-colors"
                                                onClick={() => handleSort('active')}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    Ativo
                                                    {getSortIcon('active')}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {activeClientsSorted && activeClientsSorted.length > 0 ? (
                                            activeClientsSorted.map(client => {
                                                const pendencyInfo = getPendencyDetails(client);
                                                return (
                                                    <tr key={client.id || Math.random()} className="hover:bg-white/5 group transition-colors">
                                                        <td className="py-4 font-bold text-slate-300 group-hover:text-primary transition-colors">
                                                            <div>
                                                                <p className="font-black text-base">{client.name}</p>
                                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{client.role}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            {client.process ? (
                                                                <div>
                                                                    <p className="text-sm font-mono text-white group-hover:text-primary transition-colors drop-shadow-glow-sm">{client.process.number}</p>
                                                                </div>
                                                            ) : <span className="text-slate-700 text-[10px] font-bold uppercase italic tracking-widest opacity-50">Sem processo</span>}
                                                        </td>
                                                        <td className="py-4">
                                                            {client.process ? (
                                                                <span className="px-3 py-1 bg-white/5 text-slate-500 text-[10px] uppercase font-black rounded-lg border border-white/5 group-hover:border-primary/20 transition-all">
                                                                    {client.process.type}
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="py-4">
                                                            {pendencyInfo.hasIssues ? (
                                                                <button
                                                                    onClick={() => setPendencyModalClient(client)}
                                                                    className="text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest flex items-center gap-2 group/pend"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm bg-amber-500/10 p-1 rounded-full group-hover/pend:bg-amber-500/20 transition-all">warning</span>
                                                                    {pendencyInfo.count === 1 ? '1 pendência' : `${pendencyInfo.count} pendências`}
                                                                </button>
                                                            ) : (
                                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-sm bg-emerald-500/10 p-1 rounded-full">check_circle</span>
                                                                    Sem pendências
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                            {client.acquisitionChannel || 'N/I'}
                                                        </td>
                                                        <td className="py-4 text-slate-400 text-right font-mono text-xs">
                                                            {formatDate(client.registrationDate)}
                                                        </td>
                                                        <td className="py-4 text-center">
                                                            <span className={`inline-block size-2 rounded-full ${client.active ? 'bg-primary shadow-neon shadow-primary/40' : 'bg-rose-500 shadow-neon shadow-rose-500/40'}`}></span>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-slate-700 text-[10px] font-bold uppercase tracking-[0.3em] italic">
                                                    Nenhum cliente encontrado para exibição.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/5 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest italic opacity-40">
                                Exibindo os últimos 15 clientes cadastrados.
                            </div>
                        </div>
                    </div>
                )}




                {activeTab === 'financial' && (
                    <div className="animate-[fadeIn_0.3s_ease-out] print:pt-0">
                        <div className="mb-10 print:hidden flex justify-between items-end">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-2xl font-bold text-white font-display uppercase italic">Relatórios Financeiros</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-60">Acompanhamento detalhado de honorários e pagamentos.</p>
                            </div>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">search</span>
                                <input
                                    type="text"
                                    placeholder="Buscar por nome ou CPF..."
                                    className="pl-12 pr-4 py-3 rounded-xl border border-white/10 focus:ring-2 focus:ring-primary/20 outline-none bg-white/5 text-white w-72 placeholder-slate-700 font-bold text-sm transition-all focus:bg-white/10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-white/5 p-8 rounded-2xl shadow-xl border border-white/10 print:shadow-none print:border-none print:p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th onClick={() => handleSort('name')} className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] cursor-pointer hover:bg-white/5 transition-colors select-none group">
                                                <div className="flex items-center gap-2">
                                                    Cliente
                                                    {sortConfig?.key === 'name' && (
                                                        <span className="material-symbols-outlined text-[10px] font-black text-primary">
                                                            {sortConfig.direction === 'asc' ? 'arrow_downward' : 'arrow_upward'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th onClick={() => handleSort('total')} className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] cursor-pointer hover:bg-white/5 transition-colors select-none">
                                                <div className="flex items-center gap-2">
                                                    Contrato Total
                                                    {sortConfig?.key === 'total' && (
                                                        <span className="material-symbols-outlined text-[10px] font-black text-primary">
                                                            {sortConfig.direction === 'asc' ? 'arrow_downward' : 'arrow_upward'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th onClick={() => handleSort('paid')} className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] cursor-pointer hover:bg-white/5 transition-colors select-none">
                                                <div className="flex items-center gap-2">
                                                    Pago
                                                    {sortConfig?.key === 'paid' && (
                                                        <span className="material-symbols-outlined text-[10px] font-black text-primary">
                                                            {sortConfig.direction === 'asc' ? 'arrow_downward' : 'arrow_upward'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th onClick={() => handleSort('remaining')} className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] cursor-pointer hover:bg-white/5 transition-colors select-none">
                                                <div className="flex items-center gap-2">
                                                    Restante
                                                    {sortConfig?.key === 'remaining' && (
                                                        <span className="material-symbols-outlined text-[10px] font-black text-primary">
                                                            {sortConfig.direction === 'asc' ? 'arrow_downward' : 'arrow_upward'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th onClick={() => handleSort('status')} className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] text-center cursor-pointer hover:bg-white/5 transition-colors select-none">
                                                <div className="flex items-center justify-center gap-2">
                                                    Status
                                                    {sortConfig?.key === 'status' && (
                                                        <span className="material-symbols-outlined text-[10px] font-black text-primary">
                                                            {sortConfig.direction === 'asc' ? 'arrow_downward' : 'arrow_upward'}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-[0.2em] text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {financialClients.length > 0 ? (
                                            financialClients.map(client => {
                                                const financials = calculateFinancials(client);
                                                return (
                                                    <tr key={client.id} className="hover:bg-white/5 group transition-colors">
                                                        <td className="py-4">
                                                            <div>
                                                                <p className="font-black text-white group-hover:text-primary transition-colors text-base">{client.name}</p>
                                                                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{client.cpf || 'CPF N/A'}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 font-mono text-slate-400 font-bold">{formatCurrency(financials.total)}</td>
                                                        <td className="py-4 font-mono text-emerald-500 font-black drop-shadow-glow-sm">{formatCurrency(financials.paid)}</td>
                                                        <td className="py-4 font-mono text-primary font-black drop-shadow-glow-sm">{formatCurrency(financials.remaining)}</td>
                                                        <td className="py-4 text-center">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                                                                ${financials.remaining <= 0 ? 'bg-emerald-500/20 text-emerald-500 shadow-neon-sm' : 'bg-primary/20 text-primary shadow-neon-sm'}
                                                            `}>
                                                                {financials.remaining <= 0 ? 'Quitado' : 'Pendente'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedClient(client);
                                                                    setActiveTab('individual');
                                                                    setSearchTerm('');
                                                                }}
                                                                className="text-black bg-primary hover:bg-white hover:text-black font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-105 active:scale-95"
                                                            >
                                                                Dossiê
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-slate-700 text-[10px] font-bold uppercase tracking-[0.3em] italic">
                                                    Nenhum registro financeiro encontrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'generation' && (
                    <div className="animate-[fadeIn_0.5s_ease-out] max-w-5xl mx-auto space-y-12 pb-20">
                        {/* Report Generation Header (UI Only) */}
                        <div className="print:hidden bg-indigo-600/10 border border-indigo-600/20 p-8 rounded-3xl flex justify-between items-center mb-12">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Gerador de Relatório Executivo</h2>
                                <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-1">Design Premium & Analítica 360º</p>
                            </div>
                            <button
                                onClick={() => window.print()}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                            >
                                <span className="material-symbols-outlined font-black">print</span> Exportar Agora
                            </button>
                        </div>

                        {/* --- THE ACTUAL REPORT (A4 PAGES) --- */}
                        <div className="bg-white text-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] min-h-[29.7cm] p-[2.5cm] print:shadow-none print:p-0 print:m-0 flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Page 1: Cover Page */}
                            <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-12">
                                <div className="size-48 bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-8 p-10">
                                    <img src={logoImg} alt="Logo" className="w-full h-full object-contain filter drop-shadow-neon" />
                                </div>
                                <div className="space-y-6">
                                    <div className="pt-4">
                                        <h1 className="text-8xl font-black tracking-tighter text-slate-900 uppercase italic flex items-center justify-center gap-4">
                                            Furtado <span className="text-indigo-600">PREV</span>
                                        </h1>
                                        <div className="h-2 w-64 bg-indigo-600 mx-auto rounded-full mt-4"></div>
                                        <h2 className="text-2xl font-bold text-slate-500 uppercase tracking-[0.4em] pt-8">Relatório Executivo de Gestão</h2>
                                    </div>
                                    <p className="text-indigo-500 text-[10px] font-bold tracking-[0.5em] uppercase opacity-70">Inteligência Jurídica & Previdenciária</p>
                                </div>
                                <div className="pt-24 space-y-2">
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Documento Gerado Em</p>
                                    <p className="text-2xl font-bold font-mono text-slate-900">{new Date().toLocaleDateString('pt-BR')} • {new Date().toLocaleTimeString('pt-BR')}</p>
                                </div>
                                <div className="absolute bottom-20 left-0 right-0 px-20 flex justify-between items-end border-t border-slate-100 pt-8 opacity-40">
                                    <p className="text-xs font-black uppercase tracking-widest">Confidencial / Uso Interno</p>
                                    <p className="text-xs font-black uppercase tracking-widest">Sistema de Inteligência Jurídica</p>
                                </div>
                            </div>
                        </div>

                        {/* Page 2: Executive Summary */}
                        <div className="page-break-before bg-white text-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] min-h-[29.7cm] p-[2.5cm] print:shadow-none print:p-0 print:m-0">
                            <header className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-12">
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">01. Panorama Geral</h3>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Métricas de Performance da Carteira</p>
                                </div>
                                <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">Furtado PREV / GESTÃO</p>
                            </header>

                            <div className="grid grid-cols-2 gap-8 mb-16">
                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Volume Total de Clientes</p>
                                    <p className="text-6xl font-black text-slate-900 tracking-tighter">{dashboardData.totalClients}</p>
                                    <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mt-4 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">trending_up</span> Crescimento estável
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Faturamento Mensal Estimado</p>
                                    <p className="text-6xl font-black text-slate-900 tracking-tighter font-mono">{formatCurrency(dashboardData.monthlyRevenue).split(',')[0]}</p>
                                    <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest mt-4">Projeção Baseada em Honorários</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] border-l-4 border-slate-900 pl-4">Distribuição de Status</h4>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="border border-slate-100 p-6 rounded-2xl">
                                        <p className="text-2xl font-black text-slate-900">{dashboardData.activeClients}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clientes Ativos</p>
                                    </div>
                                    <div className="border border-slate-100 p-6 rounded-2xl">
                                        <p className="text-2xl font-black text-amber-600">{dashboardData.totalPendencies}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pendências Médias</p>
                                    </div>
                                    <div className="border border-slate-100 p-6 rounded-2xl">
                                        <p className="text-2xl font-black text-indigo-600">{dashboardData.newClientsMonth}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Novos Contratos (Mês)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-20 p-8 bg-indigo-50 rounded-3xl border border-indigo-100 italic">
                                <p className="text-slate-700 text-sm leading-relaxed">
                                    "A performance operacional do mês corrente indica uma retenção de <strong>{Math.round((dashboardData.activeClients / dashboardData.totalClients) * 100)}%</strong> da base instalada, com um fluxo de entrada de novos clientes superior à média do último semestre."
                                </p>
                            </div>
                        </div>

                        {/* Page 3: Financial Deep-Dive */}
                        <div className="page-break-before bg-white text-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] min-h-[29.7cm] p-[2.5cm] print:shadow-none print:p-0 print:m-0">
                            <header className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-12">
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">02. Análise Financeira</h3>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Custos, Receitas e Resultado Líquido</p>
                                </div>
                                <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">FINANCEIRO / ANUAL</p>
                            </header>

                            <div className="space-y-12">
                                <div className="grid grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <p className="text-xs font-bold text-slate-500 uppercase">Receita Bruta Anual</p>
                                            <p className="text-lg font-black text-slate-900 font-mono">{formatCurrency(dashboardData.annualRevenue)}</p>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <p className="text-xs font-bold text-slate-500 uppercase">Custos Operacionais</p>
                                            <p className="text-lg font-black text-rose-600 font-mono">{formatCurrency(dashboardData.annualCosts)}</p>
                                        </div>
                                        <div className="flex justify-between pt-4">
                                            <p className="text-sm font-black text-slate-900 uppercase">Resultado Líquido</p>
                                            <p className="text-3xl font-black text-emerald-600 font-mono">{formatCurrency(dashboardData.annualRevenue - dashboardData.annualCosts)}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-8 rounded-3xl flex flex-col justify-center items-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Margem de Lucro</p>
                                        <p className="text-7xl font-black text-slate-900">{Math.round(((dashboardData.annualRevenue - dashboardData.annualCosts) / (dashboardData.annualRevenue || 1)) * 100)}%</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] border-l-4 border-slate-900 pl-4">Fluxo de Caixa (Ult. 6 Meses)</h4>
                                    <div className="flex justify-between items-end h-64 gap-8 border-b-2 border-slate-100 pb-4">
                                        {dashboardData.last6Months.map((m, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                                <div
                                                    className="w-full bg-slate-900 rounded-t-xl transition-all hover:bg-indigo-600"
                                                    style={{ height: `${Math.max(10, (m.value / 100000) * 100)}%` }}
                                                ></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase font-mono">{m.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Page 4: Operational Quality */}
                        <div className="page-break-before bg-white text-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] min-h-[29.7cm] p-[2.5cm] print:shadow-none print:p-0 print:m-0">
                            <header className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-12">
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter">03. Auditoria & Compliance</h3>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Qualidade de Dados e Fluxos Operacionais</p>
                                </div>
                                <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">AUDIT / QUALITY</p>
                            </header>

                            <div className="space-y-12">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-8 border border-rose-100 rounded-3xl bg-rose-50/30">
                                        <p className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4">Gargalos Documentais</p>
                                        <p className="text-5xl font-black text-slate-900">{dashboardData.totalPendencies}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mt-2">Casos com documentação pendente ou faltante para prosseguimento.</p>
                                    </div>
                                    <div className="p-8 border border-slate-100 rounded-3xl bg-slate-50">
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Eficiência em Prazos</p>
                                        <p className="text-5xl font-black text-slate-900">{Math.round((dashboardData.deadlinesDone / (tasks?.length || 1)) * 100)}%</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mt-2">Taxa de conclusão de tarefas em relação ao volume total alocado.</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] border-l-4 border-slate-900 pl-4">Distribuição Jurídica</h4>
                                    <div className="grid grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                                                <span className="text-xs font-bold uppercase text-slate-500">Fluxo Judicial</span>
                                                <span className="text-xl font-black text-slate-900">{dashboardData.processTypes.judicial}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                                                <span className="text-xs font-bold uppercase text-slate-500">Fluxo Administrativo</span>
                                                <span className="text-xl font-black text-slate-900">{dashboardData.processTypes.administrativo}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <p className="text-xs font-bold text-slate-400 leading-relaxed">
                                                A análise de conformidade sugere uma concentração de <strong>{Math.round((dashboardData.processTypes.judicial / (dashboardData.totalClients || 1)) * 100)}%</strong> em processos judiciais, exigindo maior rigor no monitoramento de prazos processuais e audiências.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-20 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 bg-slate-900 rounded-full flex items-center justify-center text-white">
                                            <span className="material-symbols-outlined text-sm">security</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase">Selo de Auditoria</p>
                                            <p className="text-xs text-slate-500 font-bold">Furtado PREV Verified Compliance 2026</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-tighter opacity-10 leading-none" style={{ fontSize: '40px' }}>LOG: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Pendency Modal */}
            {
                pendencyModalClient && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setPendencyModalClient(null)}>
                        <div className="bg-[#0a0a0a] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-white/10 animate-[scaleIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <div>
                                    <h3 className="font-black text-white uppercase italic tracking-tighter text-xl">Pendências de Cadastro</h3>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1 opacity-80">{pendencyModalClient.name}</p>
                                </div>
                                <button onClick={() => setPendencyModalClient(null)} className="size-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:border-primary/50 transition-all group">
                                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                                </button>
                            </div>
                            <div className="p-8">
                                {getPendencyDetails(pendencyModalClient).items.length > 0 ? (
                                    <ul className="space-y-4">
                                        {getPendencyDetails(pendencyModalClient).items.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-amber-500/30 transition-all group">
                                                <span className="material-symbols-outlined text-amber-500 text-2xl shrink-0 drop-shadow-glow-sm">{item.icon || 'warning'}</span>
                                                <div>
                                                    <p className="font-bold text-sm text-white group-hover:text-amber-500 transition-colors">{item.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Status: {item.status}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-10">
                                        <span className="material-symbols-outlined text-emerald-500 text-5xl mb-4 drop-shadow-glow">check_circle</span>
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhuma pendência encontrada.</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 bg-white/5 border-t border-white/5 text-right">
                                <button
                                    onClick={() => setPendencyModalClient(null)}
                                    className="w-full py-4 bg-primary text-black rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-neon hover:bg-white transition-all transform hover:-translate-y-1 active:scale-95"
                                >
                                    Entendi
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// Inject print styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);
}

export default Reports;
