import React, { useState } from 'react';

const CalculoRMI: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'import' | 'rules' | 'history'>('import');
    const [isDragging, setIsDragging] = useState(false);

    const tabs = [
        { id: 'import', label: 'Importação CNIS', icon: 'upload_file' },
        { id: 'rules', label: 'Regras de Transição', icon: 'dashboard_customize' },
        { id: 'history', label: 'Histórico & Ajustes', icon: 'history' },
    ];

    const transitionRules = [
        { name: 'Pedágio 50%', value: 'R$ 2.450,00', status: 'Requisito não atingido', color: 'slate' },
        { name: 'Pedágio 100%', value: 'R$ 3.120,00', status: 'Disponível em 2026', color: 'amber' },
        { name: 'Regra de Pontos', value: 'R$ 2.890,00', status: 'Melhor Opção Atual', color: 'emerald', best: true },
        { name: 'Idade Mínima', value: 'R$ 2.670,00', status: 'Atingido em 2025', color: 'blue' },
    ];

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <header className="px-6 py-4 lg:px-10 flex items-center justify-between backdrop-blur-md bg-black/40 border-b border-white/10 shadow-sm shrink-0">
                <div className="flex flex-col">
                    <h2 className="text-white text-xl lg:text-2xl font-bold tracking-tight font-display">Cálculo de RMI</h2>
                    <span className="text-xs text-slate-400 font-mono tracking-wider">Simulador de Benefícios e Revisões</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-xs text-slate-400 font-medium">Cliente Selecionado</span>
                        <span className="text-sm font-bold text-white">Selecione ou Importe um CNIS...</span>
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-sm font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">person_search</span>
                        Buscar Cliente
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col p-6 lg:p-10 gap-6">

                {/* Tabs Navigation */}
                <div className="flex items-center gap-2 p-1.5 bg-white/5 backdrop-blur-sm rounded-2xl w-fit border border-white/10">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-primary text-black shadow-md border border-primary'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">

                    {/* --- IMPORT TAB --- */}
                    {activeTab === 'import' && (
                        <div className="h-full flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Dropzone */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    className={`relative aspect-video lg:aspect-auto lg:h-[400px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 transition-all group ${isDragging
                                        ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                                        : 'border-white/10 bg-white/5 hover:border-primary/50 hover:bg-primary/5 shadow-soft'
                                        }`}
                                >
                                    <div className={`p-6 rounded-full transition-all duration-500 ${isDragging ? 'bg-primary text-black scale-110' : 'bg-white/5 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary group-hover:rotate-12'}`}>
                                        <span className="material-symbols-outlined text-[48px]">upload_file</span>
                                    </div>
                                    <div className="text-center px-6">
                                        <h3 className="text-lg font-bold text-white">Arraste seu PDF do CNIS aqui</h3>
                                        <p className="text-sm text-slate-400 mt-1">Ou clique para selecionar o arquivo em seu computador</p>
                                    </div>
                                    <button className="px-8 py-3 rounded-full bg-primary text-black font-bold text-sm shadow-xl hover:bg-primary-dark transition-all hover:scale-105 active:scale-95">
                                        Selecionar Arquivo
                                    </button>
                                    <div className="absolute bottom-6 flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <span>PDF</span>
                                        <span className="size-1 rounded-full bg-white/20"></span>
                                        <span>TXT (Extrato)</span>
                                        <span className="size-1 rounded-full bg-white/20"></span>
                                        <span>JSON</span>
                                    </div>
                                </div>

                                {/* Import Info/Stats */}
                                <div className="flex flex-col gap-4">
                                    <div className="glass-panel rounded-3xl p-6 border border-white/10 h-full flex flex-col justify-center">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                                                <span className="material-symbols-outlined">psychology</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white">Processamento Inteligente</h4>
                                                <p className="text-xs text-slate-400">Análise baseada na EC 103/2019</p>
                                            </div>
                                        </div>

                                        <ul className="flex flex-col gap-4">
                                            {[
                                                { icon: 'check_circle', text: 'Extração automática de vínculos', color: 'emerald' },
                                                { icon: 'check_circle', text: 'Conversão de salários históricos', color: 'emerald' },
                                                { icon: 'check_circle', text: 'Destaque de indicadores (PEXT, IREC, etc)', color: 'emerald' },
                                                { icon: 'help_outline', text: 'Projeção de tempo de contribuição', color: 'blue' },
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                                                    <span className={`material-symbols-outlined text-[20px] text-${item.color}-500`}>{item.icon}</span>
                                                    {item.text}
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-xs leading-relaxed">
                                            <span className="font-bold block mb-1">Dica do Especialista:</span>
                                            Certifique-se de baixar o PDF "Completo" no Meu INSS para garantir que todos os salários de contribuição sejam importados corretamente.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- RULES TAB (DASHBOARD) --- */}
                    {activeTab === 'rules' && (
                        <div className="flex flex-col gap-8 animate-[fadeIn_0.3s_ease-out]">
                            {/* Summary Card */}
                            <div className="glass-panel rounded-3xl p-8 border border-white/10 bg-gradient-to-br from-primary/10 to-transparent flex flex-col lg:flex-row justify-between items-center gap-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white font-display mb-2">Resumo de Análise</h3>
                                    <p className="text-slate-400">Cenário projetado para DER em <span className="font-bold text-white">12/11/2023</span></p>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Tempo de Contribuição</p>
                                        <p className="text-3xl font-bold text-white">32a 8m 15d</p>
                                    </div>
                                    <div className="w-[1px] h-12 bg-white/10"></div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Média Atual (100%)</p>
                                        <p className="text-3xl font-bold text-primary">R$ 4.250,50</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transition Rules Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                {transitionRules.map((rule, i) => (
                                    <div key={i} className={`glass-panel rounded-3xl p-6 border border-white/10 transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden group ${rule.best ? 'ring-2 ring-emerald-500 ring-offset-4 ring-offset-black' : ''}`}>
                                        {rule.best && (
                                            <div className="absolute top-0 right-0 py-1 px-4 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-bl-xl tracking-widest shadow-lg">
                                                Melhor Opção
                                            </div>
                                        )}
                                        <div className={`size-12 rounded-2xl flex items-center justify-center mb-6 bg-${rule.color}-500/10 text-${rule.color}-400`}>
                                            <span className="material-symbols-outlined">analytics</span>
                                        </div>
                                        <h4 className="font-bold text-slate-400 text-sm mb-1 uppercase tracking-wider">{rule.name}</h4>
                                        <p className="text-3xl font-bold text-white font-display mb-4">{rule.value}</p>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-${rule.color}-500/10 text-${rule.color}-400 border border-${rule.color}-500/20`}>
                                            <span className="size-1.5 rounded-full bg-current"></span>
                                            {rule.status}
                                        </div>
                                        <button className="mt-6 w-full py-3 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:bg-primary hover:text-black hover:border-primary transition-all flex items-center justify-center gap-2">
                                            Ver Projeção <span className="material-symbols-outlined text-[16px]">trending_up</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- HISTORY TAB --- */}
                    {activeTab === 'history' && (
                        <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">payments</span>
                                    Salários de Contribuição
                                </h3>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:bg-white/5 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base">file_download</span> Excluir Salários (Descarte)
                                    </button>
                                    <button className="px-4 py-2 rounded-xl bg-primary text-black text-xs font-bold shadow-md hover:bg-primary-dark transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base">add</span> Lançamento Manual
                                    </button>
                                </div>
                            </div>

                            <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-soft bg-white/5">
                                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <div className="col-span-2">Competência</div>
                                    <div className="col-span-3">Vínculo / Empresa</div>
                                    <div className="col-span-2 text-right">Valor Original</div>
                                    <div className="col-span-2 text-right">Valor Atualizado</div>
                                    <div className="col-span-2 text-center">Indicadores</div>
                                    <div className="col-span-1"></div>
                                </div>
                                <div className="max-h-[500px] overflow-y-auto">
                                    {[
                                        { comp: '10/2023', empresa: 'Furtado Advocacia LTDA', valor: '5.400,00', valorAtt: '5.400,00', ind: [] },
                                        { comp: '09/2023', empresa: 'Furtado Advocacia LTDA', valor: '5.400,00', valorAtt: '5.421,45', ind: [] },
                                        { comp: '08/2023', empresa: 'Furtado Advocacia LTDA', valor: '4.800,00', valorAtt: '4.832,10', ind: ['PREC'] },
                                        { comp: '07/2023', empresa: 'Serviços Gerais S/A', valor: '1.302,00', valorAtt: '1.314,20', ind: ['SCEM'] },
                                        { comp: '06/2023', empresa: 'Serviços Gerais S/A', valor: '1.302,00', valorAtt: '1.320,15', ind: [] },
                                        { comp: '05/2023', empresa: 'Serviços Gerais S/A', valor: '1.212,00', valorAtt: '1.240,00', ind: ['IREC-VAL'] },
                                    ].map((row, i) => (
                                        <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 items-center hover:bg-white/5 transition-colors group">
                                            <div className="col-span-2 text-sm font-bold text-white">{row.comp}</div>
                                            <div className="col-span-3">
                                                <p className="text-sm font-medium text-white truncate">{row.empresa}</p>
                                            </div>
                                            <div className="col-span-2 text-right text-sm font-mono text-slate-400">R$ {row.valor}</div>
                                            <div className="col-span-2 text-right text-sm font-bold text-emerald-400 font-mono">R$ {row.valorAtt}</div>
                                            <div className="col-span-2 flex justify-center gap-1">
                                                {row.ind.map((tag, j) => (
                                                    <span key={j} className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold" title="Indicador INSS">{tag}</span>
                                                ))}
                                                {row.ind.length === 0 && <span className="text-slate-600">—</span>}
                                            </div>
                                            <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="size-8 rounded-lg hover:bg-white/10 text-slate-400 hover:text-primary transition-all">
                                                    <span className="material-symbols-outlined text-base">edit</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalculoRMI;
