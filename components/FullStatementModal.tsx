import React, { useState } from 'react';
import { FinancialTransaction } from '../types';

interface FullStatementModalProps {
   isOpen: boolean;
   onClose: () => void;
   transactions: FinancialTransaction[];
}

const FullStatementModal: React.FC<FullStatementModalProps> = ({ isOpen, onClose, transactions }) => {
   const [searchTerm, setSearchTerm] = useState('');
   const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');

   if (!isOpen) return null;

   const formatCurrency = (val: number) => {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
   };

   const filteredTransactions = transactions.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' ? true : t.type === filterType;
      return matchesSearch && matchesType;
   });

   const handlePrint = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const content = `
      <html>
        <head>
          <title>Extrato Financeiro - Furtado Prev</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; }
            .date { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; background: #f8f9fa; padding: 12px; border-bottom: 2px solid #dee2e6; font-size: 11px; text-transform: uppercase; color: #666; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; }
            .value-in { color: #10b981; font-weight: bold; }
            .value-out { color: #ef4444; font-weight: bold; }
            .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Extrato Financeiro</div>
              <div class="date">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
            </div>
            <div style="text-align: right">
              <strong style="color: #bc935d">Furtado Prev</strong><br/>
              <span style="font-size: 12px; color: #666">Assessoria Previdenciária</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(t => `
                <tr>
                  <td>${new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td>${t.title}</td>
                  <td>${t.category}</td>
                  <td>${t.status === 'confirmado' ? 'Pago' : 'Pendente'}</td>
                  <td class="${t.type === 'in' ? 'value-in' : 'value-out'}">
                    ${t.type === 'out' ? '- ' : ''}${formatCurrency(t.value)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">Documento gerado eletronicamente pelo sistema Furtado Prev de Gestão.</div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;

      printWindow.document.write(content);
      printWindow.document.close();
   };

   const handleExportExcel = () => {
      const headers = ['Data', 'Descrição', 'Categoria', 'Status', 'Tipo', 'Valor'];
      const rows = filteredTransactions.map(t => [
         new Date(t.date).toLocaleDateString('pt-BR'),
         t.title,
         t.category,
         t.status === 'confirmado' ? 'Pago' : 'Pendente',
         t.type === 'in' ? 'Entrada' : 'Saída',
         t.value.toString().replace('.', ',')
      ]);

      // Use semicolon as separator for better compatibility with PT-BR Excel
      const csvContent = [
         headers.join(';'),
         ...rows.map(e => e.join(';'))
      ].join('\n');

      // BOM to ensure UTF-8 in Excel
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `extrato_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
         <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity" onClick={onClose}></div>

         <div className="relative w-full max-w-5xl h-[85vh] bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10">

            {/* Header */}
            <div className="px-8 py-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5">
               <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-glow shadow-primary/10">
                     <span className="material-symbols-outlined text-3xl font-bold">receipt_long</span>
                  </div>
                  <div>
                     <h2 className="text-2xl font-bold text-white font-display">Extrato Completo</h2>
                     <p className="text-sm text-slate-500 font-medium">Histórico detalhado de todas as movimentações</p>
                  </div>
               </div>

               <button onClick={onClose} className="absolute top-6 right-6 md:static size-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all">
                  <span className="material-symbols-outlined">close</span>
               </button>
            </div>

            {/* Toolbar */}
            <div className="px-8 py-6 border-b border-white/5 flex flex-col md:flex-row gap-6 justify-between items-center bg-black/20">
               <div className="relative w-full md:w-96 group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">search</span>
                  <input
                     type="text"
                     placeholder="Buscar por descrição ou categoria..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-white/5 focus:bg-white/10 focus:border-primary/50 outline-none text-sm text-white transition-all placeholder:text-slate-600"
                  />
               </div>

               <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner">
                  <button
                     onClick={() => setFilterType('all')}
                     className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-primary text-black shadow-neon' : 'text-slate-500 hover:text-white'}`}
                  >Todos</button>
                  <button
                     onClick={() => setFilterType('in')}
                     className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'in' ? 'bg-emerald-500 text-white shadow-neon shadow-emerald-500/20' : 'text-slate-500 hover:text-white'}`}
                  >Entradas</button>
                  <button
                     onClick={() => setFilterType('out')}
                     className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'out' ? 'bg-rose-500 text-white shadow-neon shadow-rose-500/20' : 'text-slate-500 hover:text-white'}`}
                  >Saídas</button>
               </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-0 scrollbar-hide bg-black/40">
               <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-md shadow-sm border-b border-white/5">
                     <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                        <th className="px-8 py-5">Data</th>
                        <th className="px-8 py-5">Descrição</th>
                        <th className="px-8 py-5">Categoria</th>
                        <th className="px-8 py-5 text-center">Status</th>
                        <th className="px-8 py-5 text-right">Valor</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                     {filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                           <td className="px-8 py-5 text-sm text-slate-500 font-mono whitespace-nowrap italic">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                           <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                 <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${t.type === 'in' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    <span className="material-symbols-outlined text-lg">{t.type === 'in' ? 'keyboard_double_arrow_down' : 'keyboard_double_arrow_up'}</span>
                                 </div>
                                 <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{t.title}</span>
                              </div>
                           </td>
                           <td className="px-8 py-5">
                              <span className="px-3 py-1 rounded-lg bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest border border-white/10 group-hover:border-primary/20 transition-all">{t.category}</span>
                           </td>
                           <td className="px-8 py-5 text-center">
                              {t.status === 'confirmado' ? (
                                 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Pago
                                 </span>
                              ) : (
                                 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
                                    <div className="size-1.5 rounded-full bg-amber-500 animate-bounce"></div> Pendente
                                 </span>
                              )}
                           </td>
                           <td className={`px-8 py-5 text-right font-mono font-bold text-sm whitespace-nowrap ${t.type === 'in' ? 'text-primary drop-shadow-glow' : 'text-slate-300'}`}>
                              {t.type === 'out' && '- '}{formatCurrency(t.value)}
                           </td>
                        </tr>
                     ))}
                     {filteredTransactions.length === 0 && (
                        <tr>
                           <td colSpan={5} className="py-24 text-center">
                              <div className="flex flex-col items-center gap-4 opacity-30">
                                 <span className="material-symbols-outlined text-6xl">search_off</span>
                                 <p className="text-sm font-bold uppercase tracking-widest">Nenhuma transação encontrada</p>
                              </div>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-white/10 bg-white/5 flex justify-between items-center shrink-0">
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Exibindo {filteredTransactions.length} registros</span>
               <div className="flex gap-4">
                  <button
                     onClick={handleExportExcel}
                     className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                  >
                     <span className="material-symbols-outlined text-lg">download</span> Exportar
                  </button>
                  <button
                     onClick={handlePrint}
                     className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                  >
                     <span className="material-symbols-outlined text-lg">print</span> Imprimir
                  </button>
               </div>
            </div>

         </div>
      </div>
   );
};

export default FullStatementModal;