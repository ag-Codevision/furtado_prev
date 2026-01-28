import React, { useState } from 'react';
import { KanbanColumn, Case } from '../types';

const Cases: React.FC = () => {
  // Configuração das colunas do Kanban (Workflow Previdenciário)
  const columns: KanbanColumn[] = [
    { id: 'calculo', title: 'Cálculos / Planejamento', color: 'slate', count: 0 },
    { id: 'adm', title: 'Administrativo (INSS)', color: 'blue', count: 0 },
    { id: 'exigencia', title: 'Perícia / Exigência', color: 'amber', count: 0 },
    { id: 'judicial', title: 'Judicialização', color: 'purple', count: 0 },
    { id: 'pagamento', title: 'RPV / Precatório', color: 'emerald', count: 0 },
  ];

  const [cases, setCases] = useState<Case[]>([
    // Cálculos
    { id: 'NB-001', client: 'José da Silva', subject: 'Planejamento Previdenciário', status: 'calculo', deadline: 'Hoje', responsible: 'Dr. Silva', responsibleAvatar: 'https://i.pravatar.cc/150?img=11', value: 'RMI Est: R$ 4.500', priority: 'high', tags: ['Aposentadoria'] },

    // Administrativo
    { id: 'NB-882', client: 'Maria Oliveira', subject: 'Pensão por Morte', status: 'adm', deadline: 'DER: 20/10', responsible: 'Dra. Costa', responsibleAvatar: 'https://i.pravatar.cc/150?img=5', value: 'RMI: R$ 2.800', priority: 'medium', tags: ['Urbano'] },
    { id: 'NB-993', client: 'Antônio Santos', subject: 'Aposentadoria Rural', status: 'adm', deadline: 'Análise', responsible: 'Dr. Silva', responsibleAvatar: 'https://i.pravatar.cc/150?img=11', value: 'Sal. Mín.', priority: 'low', tags: ['Rural'] },

    // Exigência/Perícia
    { id: 'NB-156', client: 'Pedro Costa', subject: 'Auxílio por Incapacidade', status: 'exigencia', deadline: 'Perícia: Amanhã', responsible: 'Dr. Silva', responsibleAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyDq4VVHHKveaqgL1fvNvQW1AkXzmJi4cC5pcGcnP4_oF8X4nHVadiXbHRMjbzlPyol9xFsBcr4y1RPyc6r_VbdjuPYRXYUCsPytEgpByZKUUh6KeN7sblB6E6Rf4OIsBjKVq2ZHRsMJsMhTRJhJ7Qb8ZJUKu5ASW13nsMUamTnwDTaZ9qdIFplmqLqWjJDT4ZBiLL83E6xVpp1MJbTCMo1F2C1H_tmOiNoaDU3aDKpc6WQCqevoRHbVIakSUwqbG8PfiR7vh7z8Kd', value: 'Benefício Cessado', priority: 'high', tags: ['Acidentário', 'Laudo'] },

    // Judicial
    { id: 'PROC-089', client: 'Ana Pereira', subject: 'BPC/LOAS Indeferido', status: 'judicial', deadline: 'Laudo Social', responsible: 'Dr. Silva', responsibleAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChaDSY2RQgE01WUhDv5NUlnwJdBt0rGGcUcjc9e4t2M4JdCsJB_TDORdnO9-jnJQMA3d-ZOZ5NWV-kmufie1zJcFO3QctjNbSDGBO9wqQQ5Vz5X8qrlGYYwfJqhiC5SJ0MNGweHPvSmVidUqwPQfYLnI_bfxwK5TjU80Czm1jAzhO965wZasfrmBIN0wNX87m_cTYxsq0Co_T_MNbECEWucOvHIMSY4BZNhrWWeDiUKuXL-HMezRd4gwQ80RjhqcAlsjY2wISJ5kv8', value: 'Atrasados: 25k', priority: 'medium', tags: ['Deficiente', 'LOAS'] },

    // Pagamento
    { id: 'RPV-115', client: 'Carlos Souza', subject: 'Revisão da Vida Toda', status: 'pagamento', deadline: 'Liberado', responsible: 'Dra. Costa', responsibleAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8xKypMH616G8x7aewSD123Y-G1r6mjz_hB0BISF-Rwpt3mUh21CVfvNF-zwUnJ1JkoenzcWUDkhTTtwTdZUXafewjbo5ZGafturHyGWOJEBDes_RxHIEHYDM4-HkXEfoEXGHSjdOJU1-4uKu3l5seOaibkl0M9Vf3Aat7uRiEflVxMDxTilk7rSVwFN7s-akIPq_dW_nIstkFF-dbHMq_Fc8Sg3nXAC-LUmwu9X6V95SG-5MCJ1AJ77YS5PLR41egcDgira-GcdBi', value: 'R$ 120.000', priority: 'high', tags: ['Revisão'] },
  ]);

  const [draggedCaseId, setDraggedCaseId] = useState<string | null>(null);
  const [targetColumn, setTargetColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, caseId: string) => {
    setDraggedCaseId(caseId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setTargetColumn(columnId);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (!draggedCaseId) return;

    setCases((prev) =>
      prev.map((c) =>
        c.id === draggedCaseId ? { ...c, status: columnId } : c
      )
    );
    setDraggedCaseId(null);
    setTargetColumn(null);
  };

  const handleDragLeave = () => {
    setTargetColumn(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-black relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header Poderoso */}
      <header className="px-8 py-8 flex flex-wrap justify-between items-end gap-6 shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-2xl z-20">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black tracking-tighter text-white font-display uppercase italic drop-shadow-glow-sm">Esteira de Benefícios</h2>
            <span className="px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-[10px] font-black uppercase tracking-widest text-primary shadow-neon-sm">Kanban INSS</span>
          </div>
          <p className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-3 opacity-80">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-neon-sm"></span>
            {cases.length} Benefícios Ativos &bull; 3 Perícias Agendadas &bull; 2 RPVs Liberadas
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex -space-x-3 items-center mr-6">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-10 h-10 rounded-xl border-2 border-black bg-slate-900 bg-cover shadow-xl hover:translate-y-[-4px] hover:border-primary/50 transition-all cursor-pointer group relative"
                style={{ backgroundImage: `url('https://i.pravatar.cc/150?img=${i + 20}')` }}
              >
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
              </div>
            ))}
            <div className="w-10 h-10 rounded-xl border-2 border-black bg-white/5 backdrop-blur-sm flex items-center justify-center text-xs font-black text-slate-400 border-white/10 hover:border-primary/30 transition-colors">+4</div>
          </div>
          <button className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:border-primary/30 transition-all flex items-center gap-3 group">
            <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform">filter_list</span> Filtrar
          </button>
          <button className="h-12 px-8 flex items-center gap-3 bg-primary text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-neon hover:bg-white hover:scale-105 active:scale-95">
            <span className="material-symbols-outlined text-[22px]">add_circle</span>
            Novo Benefício
          </button>
        </div>
      </header>

      {/* Kanban Board Area - Scrollbar Visível */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 pb-2">
        <div className="flex gap-6 h-full min-w-max pb-4">

          {columns.map((col) => {
            const columnCases = cases.filter(c => c.status === col.id);
            const isTarget = targetColumn === col.id;

            return (
              <div
                key={col.id}
                className="w-[340px] flex flex-col h-full group select-none"
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                onDragLeave={handleDragLeave}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-neon-sm ${col.color === 'slate' ? 'bg-slate-400' :
                        col.color === 'blue' ? 'bg-blue-400' :
                          col.color === 'amber' ? 'bg-amber-400' :
                            col.color === 'purple' ? 'bg-purple-400' :
                              'bg-emerald-400'
                      }`}></div>
                    <h3 className="text-[11px] font-black text-white font-display tracking-[0.2em] uppercase opacity-90">{col.title}</h3>
                  </div>
                  <span className="text-[10px] font-black font-mono px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 border border-white/10 group-hover:border-primary/30 group-hover:text-primary transition-all">{columnCases.length}</span>
                </div>

                {/* Column Drop Zone */}
                <div className={`flex-1 rounded-3xl border transition-all duration-300 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar shadow-2xl ${isTarget
                    ? 'bg-primary/5 border-primary/40 ring-4 ring-primary/5 scale-[1.01]'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                  }`}
                >

                  {/* Cards */}
                  {columnCases.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      className={`group/card relative p-5 rounded-2xl border bg-[#0d0d0d] backdrop-blur-xl transition-all cursor-grab active:cursor-grabbing ${draggedCaseId === c.id
                          ? 'opacity-20 scale-90 border-primary shadow-neon-sm'
                          : 'border-white/10 hover:border-primary/50 hover:shadow-neon-sm hover:-translate-y-1.5'
                        }`}
                    >

                      {/* Priority Neon Glow */}
                      {c.priority === 'high' && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                          <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter opacity-0 group-hover/card:opacity-100 transition-opacity">Prioritário</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-neon-sm animate-[pulse_1.5s_infinite]"></div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {c.tags?.map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-white/5 text-slate-400 border border-white/5 group-hover/card:border-primary/20 group-hover/card:text-primary/70 transition-colors">{tag}</span>
                        ))}
                      </div>

                      <h4 className="text-sm font-black text-white leading-tight mb-1.5 uppercase tracking-wide group-hover/card:text-primary transition-colors">{c.subject}</h4>
                      <p className="text-[11px] font-bold text-slate-500 mb-4">{c.client}</p>

                      <div className="flex items-center gap-3 mb-4 bg-white/[0.03] p-2.5 rounded-xl border border-white/5 group-hover/card:bg-primary/5 group-hover/card:border-primary/10 transition-colors">
                        <span className="material-symbols-outlined text-primary text-[16px] drop-shadow-glow-sm">payments</span>
                        <span className="text-[11px] font-black font-mono text-white opacity-90">{c.value}</span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-lg bg-cover bg-center ring-2 ring-black group-hover/card:ring-primary/20 transition-all" style={{ backgroundImage: `url('${c.responsibleAvatar}')` }}></div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{c.responsible.split(' ')[1]}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest transition-all ${c.deadline.includes('Hoje') || c.deadline.includes('Amanhã')
                            ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-neon-sm'
                            : 'bg-white/5 text-slate-500 border-white/10 group-hover/card:text-white'
                          }`}>
                          <span className="material-symbols-outlined text-[13px] group-hover/card:rotate-12 transition-transform">schedule</span>
                          {c.deadline}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty State Enhancement */}
                  {columnCases.length === 0 && (
                    <div className="flex-1 min-h-[120px] rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-3 text-slate-700 transition-colors">
                      <span className="material-symbols-outlined text-3xl opacity-20">inventory_2</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 italic">{isTarget ? 'Transferir para aqui' : 'Sem Registros'}</span>
                    </div>
                  )}

                  <button className="w-full py-4 rounded-xl border-2 border-dashed border-white/5 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/[0.03] hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 group/add-btn">
                    <span className="material-symbols-outlined text-[18px] group-hover/add-btn:rotate-90 transition-transform">add_circle</span> Adicionar Proposta
                  </button>

                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
};

export default Cases;