import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { ServiceCard } from '../types';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const { tasks, clients, teamMembers, decisions, crmLeads } = useData();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single();

          if (data?.full_name) {
            const firstName = data.full_name.split(' ')[0];
            setUserName(firstName);
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, []);

  // --- AGGREGATED METRICS ---

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. CRM Stats
    const activeLeads = crmLeads.length;
    const crmPotentialValue = crmLeads.reduce((acc, card) => {
      if (!card.valueEst) return acc;
      const val = typeof card.valueEst === 'string'
        ? parseFloat(card.valueEst.replace(/[^0-9,.-]/g, '').replace(',', '.'))
        : (typeof card.valueEst === 'number' ? card.valueEst : 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    // Estimate: 30% conversion rate typically
    const estimatedRevenue = crmPotentialValue * 0.3;

    // 2. Clients Stats
    const activeClients = clients.filter(c => c.status === 'Ativo').length;
    const newClientsMonth = clients.filter(c => {
      if (!c.registrationDate) return false;
      const d = new Date(c.registrationDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    // 3. Tasks Stats
    const pendingTasks = tasks.filter(t => t.status !== 'finalizado').length;
    // Task type check for priority which might be missing in some rows
    const urgentTasks = tasks.filter(t => (t as any).priority === 'high' && t.status !== 'finalizado').length;
    const nextDeadlines = tasks
      .filter(t => t.fatalDeadline && t.status !== 'finalizado')
      .sort((a, b) => new Date(a.fatalDeadline!).getTime() - new Date(b.fatalDeadline!).getTime())
      .slice(0, 3);

    // 4. Financial Status (Installments logic mirrored from Finance.tsx)
    let totalReceivable = 0;
    let totalOverdue = 0;
    let overdueClientsCount = 0;

    clients.forEach(client => {
      let clientHasOverdue = false;
      if (client.fees?.monthly) {
        const { value, installments } = client.fees.monthly;
        const valueStr = String(value || '0');
        const monthlyVal = parseFloat(valueStr.replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0;
        const instStr = String(installments || '1');
        const numInstallments = parseInt(instStr.replace(/\D/g, '')) || 1;

        const clientPayments = client.payments || [];
        const paidTotal = clientPayments.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
        const contractTotal = monthlyVal * numInstallments;
        const remaining = Math.max(0, contractTotal - paidTotal);

        totalReceivable += remaining;

        // Check for specific overdue payments
        const clientOverdueAmount = clientPayments
          .filter(p => p.status === 'overdue')
          .reduce((acc, p) => acc + (Number(p.value) || 0), 0);

        if (clientOverdueAmount > 0) {
          totalOverdue += clientOverdueAmount;
          clientHasOverdue = true;
        }
      }
      if (clientHasOverdue) overdueClientsCount++;
    });

    // 5. Decisions
    const safeDecisions = decisions || [];
    const recentDecisions = safeDecisions.slice(0, 5);
    const decisionsCount = safeDecisions.length;

    // 6. Team
    const activeTeam = teamMembers.filter(m => m.status === 'Ativo').length;

    // 7. Origins (Acquisition Channels)
    const origins = clients.reduce((acc, client) => {
      const source = client.acquisitionChannel || 'Indicação';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to sorted array for chart/list
    const originsList = Object.entries(origins)
      .map(([name, value]): { name: string; value: number } => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    // 8. Process Types (Judicial vs Admin)
    const processTypes = clients.reduce((acc, client) => {
      const type = client.process?.type || 'Administrativo';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 9. Revenue History (Mock for Demo - usually would come from DB)
    const baseValue = totalReceivable > 0 ? totalReceivable : 50000;
    const history = [
      { month: 'Ago', value: baseValue * 0.6 },
      { month: 'Set', value: baseValue * 0.75 },
      { month: 'Out', value: baseValue * 0.7 },
      { month: 'Nov', value: baseValue * 0.85 },
      { month: 'Dez', value: baseValue * 0.9 },
      { month: 'Jan', value: baseValue }
    ];

    return {
      crm: {
        active: activeLeads,
        potential: crmPotentialValue,
        estimated: estimatedRevenue
      },
      clients: {
        total: clients.length,
        active: activeClients,
        newThisMonth: newClientsMonth,
        origins: originsList,
        processTypes
      },
      tasks: {
        pending: pendingTasks,
        urgent: urgentTasks,
        nextDeadlines
      },
      finance: {
        receivable: totalReceivable,
        overdue: totalOverdue,
        overdueCount: overdueClientsCount,
        history
      },
      team: {
        active: activeTeam
      },
      decisions: {
        total: decisionsCount,
        recent: recentDecisions
      }
    };

  }, [clients, tasks, crmLeads, teamMembers, decisions]);



  // Helper for currency
  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <header className="sticky top-0 z-40 px-6 py-4 lg:px-10 flex items-center justify-between backdrop-blur-md bg-black/40 border-b border-white/10 shadow-sm">
        <div className="flex flex-col">
          <h2 className="text-white text-xl lg:text-2xl font-bold tracking-tight font-display">Visão Geral</h2>
          <span className="text-xs text-slate-400 font-mono tracking-wider">
            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} • {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center w-64 lg:w-96 h-12 rounded-full bg-white/5 border border-white/10 px-4 transition-all focus-within:w-[420px] focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-primary/20">
            <span className="material-symbols-outlined text-slate-400 mr-3">search</span>
            <input
              className="bg-transparent border-none text-sm text-white placeholder-slate-500 w-full focus:ring-0 p-0"
              placeholder="Buscar no sistema..."
              type="text"
            />
            <span className="text-[10px] text-slate-500 border border-white/10 rounded px-1.5 py-0.5 font-mono bg-white/5">⌘K</span>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 lg:p-10 flex flex-col gap-8 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent z-10">
        <section className="flex flex-col lg:flex-row justify-between items-end gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white font-display">
              Bom dia, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-600">Dr(a). {userName || 'Doutor(a)'}</span>
            </h1>
            <p className="text-lg text-slate-400 font-light">
              Você tem <strong className="text-white">{stats.tasks.urgent} tarefas urgentes</strong> e <strong className="text-white">{stats.crm.active} atendimentos</strong> em andamento hoje.
            </p>
          </div>
        </section>

        {/* --- WIDGETS GRID --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

          {/* 1. CRM Widget */}
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group border border-white/10 bg-white/5 hover:bg-white/10 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <span className="material-symbols-outlined">support_agent</span>
              </div>
              <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 flex items-center gap-1">
                Pipeline Ativo
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-slate-400 text-sm font-medium">Atendimentos CRM</p>
              <p className="text-3xl font-bold text-white tracking-tight font-display">{stats.crm.active}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
              <span className="text-xs text-slate-500">Est. Honorários</span>
              <span className="text-sm font-bold text-primary">{formatCurrency(stats.crm.potential)}</span>
            </div>
          </div>

          {/* 2. Clients Widget */}
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group border border-white/10 bg-white/5 hover:bg-white/10 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white">
                <span className="material-symbols-outlined">group</span>
              </div>
              {stats.clients.newThisMonth > 0 && (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20 flex items-center gap-1">
                  +{stats.clients.newThisMonth} esse mês
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-slate-400 text-sm font-medium">Total de Clientes</p>
              <p className="text-3xl font-bold text-white tracking-tight font-display">{stats.clients.total}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5">
              <p className="text-xs text-slate-500"><strong className="text-slate-300">{stats.clients.active}</strong> clientes ativos na carteira.</p>
            </div>
          </div>

          {/* 3. Tasks Widget */}
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group border border-white/10 bg-white/5 hover:bg-white/10 hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <span className="material-symbols-outlined">assignment</span>
              </div>
              <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                {stats.tasks.urgent} Urgentes
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-slate-400 text-sm font-medium">Tarefas Pendentes</p>
              <p className="text-3xl font-bold text-white tracking-tight font-display">{stats.tasks.pending}</p>
            </div>
            <div className="mt-auto pt-3">
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>

          {/* 4. Decisions Widget */}
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group border border-white/10 bg-white/5 hover:bg-white/10 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <span className="material-symbols-outlined">gavel</span>
              </div>
              <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                Últimos 30 dias
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-slate-400 text-sm font-medium">Sentenças</p>
              <p className="text-3xl font-bold text-white tracking-tight font-display">{stats.decisions.total}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="size-6 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[10px] font-bold text-slate-400">TRF</div>
                <div className="size-6 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[10px] font-bold text-slate-400">TJ</div>
              </div>
              <span className="text-xs text-slate-500 ml-1">Processos julgados</span>
            </div>
          </div>

          {/* 5. Origin Widget (New) */}
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group border border-white/10 bg-white/5 hover:bg-white/10 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-primary">
                <span className="material-symbols-outlined">hub</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-slate-400 text-sm font-medium">Origem dos Clientes</p>

              <div className="flex flex-col gap-2">
                {stats.clients.origins.map((origin: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(origin.value / stats.clients.total) * 100}%` }}></div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 w-16 text-right truncate">{origin.name}</span>
                  </div>
                ))}
                {stats.clients.origins.length === 0 && <span className="text-xs text-slate-500 italic">Sem dados registrados</span>}
              </div>
            </div>
          </div>

        </section>

        {/* --- FINANCIAL & OPS COMPACT GRID --- */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* 1. Receivables (Compact) */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-4 relative overflow-hidden group">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
              <span className="material-symbols-outlined text-emerald-500">payments</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Receita Contratada</p>
              <p className="text-2xl font-bold text-white font-display tracking-tight">{formatCurrency(stats.finance.receivable)}</p>
            </div>
            <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none"></div>
          </div>

          {/* 2. Overdue (Compact) */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-4 relative overflow-hidden group">
            <div className={`p-3 rounded-xl border transition-colors ${stats.finance.overdue > 0 ? 'bg-red-500/10 border-red-500/20 group-hover:bg-red-500/20' : 'bg-primary/10 border-primary/20 group-hover:bg-primary/20'}`}>
              <span className={`material-symbols-outlined ${stats.finance.overdue > 0 ? 'text-red-500' : 'text-primary'}`}>
                {stats.finance.overdue > 0 ? 'warning' : 'thumb_up'}
              </span>
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${stats.finance.overdue > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                {stats.finance.overdue > 0 ? 'Inadimplência Total' : 'Inadimplência Zero'}
              </p>
              <p className={`text-2xl font-bold font-display tracking-tight ${stats.finance.overdue > 0 ? 'text-red-500' : 'text-white'}`}>
                {stats.finance.overdue > 0 ? formatCurrency(stats.finance.overdue) : 'Tudo em dia'}
              </p>
            </div>
            {stats.finance.overdue > 0 && <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-red-500/5 to-transparent pointer-events-none"></div>}
          </div>

          {/* 3. Operational Quick Stats */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between gap-4 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <span className="material-symbols-outlined text-primary text-lg">calculate</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cálculos</p>
                <p className="text-lg font-bold text-white">4 <span className="text-xs text-slate-500 font-normal">novos</span></p>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="flex items-center gap-3 pr-2">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <span className="material-symbols-outlined text-amber-500 text-lg">volunteer_activism</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Benefícios</p>
                <p className="text-lg font-bold text-white">8 <span className="text-xs text-slate-500 font-normal">ativos</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* --- ANALYTICS CHARTS ROW --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 1. Revenue Evolution (Line Chart) */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 bg-white/5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white font-display">Evolução Financeira</h3>
                <p className="text-xs text-slate-500">Receita estimada últimos 6 meses</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> +12%
              </span>
            </div>

            {/* Chart Area */}
            <div className="h-48 w-full relative">
              {/* Horizontal Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400">
                <div className="border-b border-dashed border-slate-100 w-full h-0"></div>
                <div className="border-b border-dashed border-slate-100 w-full h-0"></div>
                <div className="border-b border-dashed border-slate-100 w-full h-0"></div>
                <div className="border-b border-dashed border-slate-100 w-full h-0"></div>
              </div>

              {/* SVG Line Chart */}
              <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 50">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d={`M0,50 
                                ${stats.finance.history.map((h: any, i: number) => `L${i * 20},${50 - ((Number(h.value) / (stats.finance.receivable || 1)) * 40)}`).join(' ')} 
                                L100,50 Z`}
                  fill="url(#chartGradient)"
                />

                <path
                  d={`M0,${50 - ((stats.finance.history[0].value / (stats.finance.receivable || 1)) * 40)}
                                ${stats.finance.history.map((h: any, i: number) => `L${i * 20},${50 - ((h.value / (stats.finance.receivable || 1)) * 40)}`).join(' ')}`}
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-md"
                />

                {stats.finance.history.map((h: any, i: number) => (
                  <circle
                    key={i}
                    cx={i * 20}
                    cy={50 - ((h.value / (stats.finance.receivable || 1)) * 40)}
                    r="1.5"
                    fill="white"
                    stroke="#D4AF37"
                    strokeWidth="1"
                    className="hover:r-2 transition-all cursor-pointer"
                  >
                    <title>{h.month}: {formatCurrency(h.value)}</title>
                  </circle>
                ))}
              </svg>
            </div>

            <div className="flex justify-between mt-2 px-[1%]">
              {stats.finance.history.map((h: any, i: number) => (
                <span key={i} className="text-[10px] text-slate-400 uppercase font-bold">{h.month}</span>
              ))}
            </div>
          </div>

          {/* 2. Process Types (Donut Chart) */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/5 flex flex-col">
            <h3 className="text-lg font-bold text-white font-display mb-1">Processos</h3>
            <p className="text-xs text-slate-500 mb-6">Distribuição por tipo</p>

            <div className="flex-1 flex items-center justify-center relative">
              <svg width="160" height="160" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="15.91549430918954" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6"></circle>

                <circle
                  cx="20" cy="20" r="15.91549430918954"
                  fill="transparent"
                  stroke="#D4AF37"
                  strokeWidth="6"
                  strokeDasharray={`${((stats.clients.processTypes['Judicial'] || 0) / stats.clients.total) * 100} ${100 - (((stats.clients.processTypes['Judicial'] || 0) / stats.clients.total) * 100)}`}
                  strokeDashoffset="25"
                  className="transition-all duration-1000 ease-out"
                ></circle>

                <g className="fill-white">
                  <text x="50%" y="50%" textAnchor="middle" dy="0.3em" className="text-[8px] font-bold fill-white">
                    {stats.clients.total}
                  </text>
                  <text x="50%" y="65%" textAnchor="middle" className="text-[3px] fill-slate-400 uppercase">
                    Total
                  </text>
                </g>
              </svg>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary"></span>
                  <span className="text-slate-400">Judicial</span>
                </div>
                <span className="font-bold text-white">{stats.clients.processTypes['Judicial'] || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-white/10"></span>
                  <span className="text-slate-400">Administrativo</span>
                </div>
                <span className="font-bold text-white">{stats.clients.processTypes['Administrativo'] || 0}</span>
              </div>
            </div>
          </div>

        </section>

        {/* --- DETAILED SECTIONS ROW --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-[400px]">

          {/* LEFT: Financial & Schedule Overview */}
          <div className="xl:col-span-2 glass-panel rounded-3xl p-8 border border-white/10 bg-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500">calendar_month</span> Agenda & Prazos
              </h3>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              {/* Next Tasks List */}
              {stats.tasks.nextDeadlines.length > 0 ? (
                stats.tasks.nextDeadlines.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:shadow-md transition-all group">
                    <div className="flex flex-col items-center min-w-[50px]">
                      <span className="text-xs font-bold text-red-500 uppercase">Prazo</span>
                      <span className="text-lg font-bold text-white">{new Date(task.fatalDeadline).getDate()}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{new Date(task.fatalDeadline).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                    </div>
                    <div className="w-px h-10 bg-white/10"></div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-sm group-hover:text-primary transition-colors">{task.title}</h4>
                      <p className="text-xs text-slate-500">{task.clientName} • {task.processNumber}</p>
                    </div>
                    <div className="hidden sm:block">
                      {task.responsible?.avatar && <img src={task.responsible.avatar} className="size-8 rounded-full border border-white/20 shadow-sm" alt="Resp" />}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-3xl mb-2">event_available</span>
                  <p className="text-sm">Nenhum prazo fatal próximo.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Team & Activity */}
          <div className="glass-panel rounded-3xl p-8 border border-white/10 bg-white/5 flex flex-col gap-6">
            <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500">groups</span> Equipe
            </h3>

            <div className="flex flex-col gap-4">
              {teamMembers.slice(0, 4).map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
                  <div className="relative">
                    <img src={member.avatar} alt={member.name} className="size-10 rounded-full object-cover border-2 border-white/20 shadow-sm" />
                    <span className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-black ${member.status === 'Ativo' ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.role}</p>
                  </div>
                  <button className="p-2 text-slate-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                    <span className="material-symbols-outlined text-lg">chat</span>
                  </button>
                </div>
              ))}
              {teamMembers.length > 4 && (
                <p className="text-xs text-center text-slate-500 mt-2">e mais {teamMembers.length - 4} colaboradores...</p>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-white/10">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">psychology</span>
                <div>
                  <p className="text-xs font-bold text-primary uppercase mb-1">Prev.IA Insight</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    A produtividade da equipe aumentou <strong>12%</strong> nesta semana.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;