import React, { useState, useMemo } from 'react';
import NewTransactionModal from '../components/NewTransactionModal';
import FullStatementModal from '../components/FullStatementModal';
import { useData } from '../contexts/DataContext';
import { Client, Payment } from '../types';

const Finance: React.FC = () => {
   const { clients, updateClient, transactions, addTransaction, deleteTransaction } = useData();
   const [activeTab, setActiveTab] = useState<'dashboard' | 'contracts'>('dashboard');
   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
   const [selectedClient, setSelectedClient] = useState<Client | null>(null);
   const [searchTerm, setSearchTerm] = useState('');

   // Payment Modal State
   const [paymentModal, setPaymentModal] = useState<{
      isOpen: boolean;
      client: Client | null;
      installment: { number: number; totalValue: number; remainingValue: number; dueDate: string } | null;
      amountToPay: string;
   }>({ isOpen: false, client: null, installment: null, amountToPay: '' });

   // Dashboard Logics
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isStatementOpen, setIsStatementOpen] = useState(false);

   // --- HELPER FUNCTIONS ---
   const parseCurrency = (val: string) => {
      if (typeof val === 'number') return val;
      return parseFloat(val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');
   };

   const formatCurrency = (val: number) => {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
   };

   const calculateInstallmentsData = (client: Client) => {
      if (!client.fees?.monthly) return { installments: [], totalValue: 0, paidValue: 0, remainingValue: 0 };

      const { value, installments, dueDate, startDate } = client.fees.monthly;
      const numInstallments = parseInt(installments.replace(/\D/g, '')) || 12;
      const day = parseInt(dueDate) || 10;
      const start = startDate ? new Date(startDate || new Date()) : new Date();
      const monthlyVal = parseCurrency(value);

      // Adjust start month if start day > due day
      let currentMonth = start.getMonth();
      let currentYear = start.getFullYear();

      if (start.getDate() > day) {
         currentMonth++;
      }

      const generated = [];
      let paidVal = 0;

      for (let i = 1; i <= numInstallments; i++) {
         const date = new Date(currentYear, currentMonth, day);
         const dateStr = date.toISOString().split('T')[0];

         // Check if paid
         const payment = client.payments?.find(p => p.installmentNumber === i);

         let status: 'pending' | 'paid' | 'overdue' | 'partial' = 'pending';
         let paidAmount = 0;
         let remainingAmount = monthlyVal;

         if (payment) {
            status = payment.status;
            paidAmount = payment.value;
            remainingAmount = monthlyVal - paidAmount;

            if (status === 'paid' || status === 'partial') {
               paidVal += paidAmount;
            }
         } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date < today) status = 'overdue';
         }

         generated.push({
            number: i,
            dueDate: dateStr,
            formattedDate: date.toLocaleDateString('pt-BR'),
            totalValue: monthlyVal,
            paidValue: paidAmount,
            remainingValue: remainingAmount,
            formattedTotalValue: value,
            formattedRemaining: formatCurrency(remainingAmount),
            status,
            payment
         });

         // Next month
         currentMonth++;
         if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
         }
      }

      const totalVal = monthlyVal * numInstallments;

      return {
         installments: generated,
         totalValue: totalVal,
         paidValue: paidVal,
         remainingValue: totalVal - paidVal
      };
   };
   // -------------------------


   // --- REAL DASHBOARD METRICS ---
   const dashboardMetrics = useMemo(() => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      let totalContractValue = 0; // Total em carteira
      let totalReceivable = 0; // Total a receber
      let totalOverdue = 0; // Inadimplência acumulada
      let overdueCount = 0;
      let monthForecast = 0; // Previsão de recebimento para o mês atual
      let monthCollected = 0; // Arrecadado no mês atual

      let recentPayments: any[] = [];

      // Add general transactions to metrics
      transactions.forEach(t => {
         const val = Number(t.value);
         const tDate = new Date(t.date);

         if (t.type === 'in') {
            if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
               monthCollected += val;
            }
            // We only add to recent if it's an 'in' transaction
            recentPayments.push({
               id: t.id,
               clientName: t.title, // Title acts as name for general or client name
               clientAvatar: null,
               initials: t.title.substring(0, 2).toUpperCase(),
               value: val,
               date: t.date,
               installment: t.installmentNumber || 0,
               method: 'Lançamento'
            });
         } else {
            // Expenses reduce monthCollected? Or just keep it as "Collected" (Incomes)
            // Usually "Collected" is Revenue. Let's keep it as Revenue.
         }
      });

      clients.forEach(client => {
         if (client.fees?.monthly) {
            const stats = calculateInstallmentsData(client);

            totalContractValue += stats.totalValue;
            totalReceivable += stats.remainingValue;

            stats.installments.forEach(inst => {
               // Overdue logic
               if (inst.status === 'overdue') {
                  totalOverdue += inst.remainingValue;
                  overdueCount++;
               }

               // Monthly Logic
               const instDate = new Date(inst.dueDate);
               if (instDate.getMonth() === currentMonth && instDate.getFullYear() === currentYear) {
                  monthForecast += inst.remainingValue + inst.paidValue; // Original forecast value for this month
               }

               // Collected Logic (check payment dates)
               if (inst.payment && inst.payment.paidDate) {
                  const paidDate = new Date(inst.payment.paidDate);
                  // Skip adding to recentPayments here because they should be in the transactions table now
               }
            });
         }
      });

      // Sort payments by date desc
      recentPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
         totalContractValue: formatCurrency(totalContractValue),
         totalReceivable: formatCurrency(totalReceivable),
         totalOverdue: formatCurrency(totalOverdue),
         overdueCount,
         monthForecast: formatCurrency(monthForecast),
         monthCollected: formatCurrency(monthCollected),
         recentPayments: recentPayments.slice(0, 10) // Show top 10
      };
   }, [clients, transactions]);

   // Contract & Fees Logic Filter
   const clientsWithFees = useMemo(() => {
      return clients.filter(c => {
         const hasFees = c.fees?.monthly && c.fees.monthly.value;
         const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.cpf && c.cpf.includes(searchTerm));
         return hasFees && matchesSearch;
      });
   }, [clients, searchTerm]);


   const openPaymentModal = (client: Client, installment: any) => {
      setPaymentModal({
         isOpen: true,
         client,
         installment: {
            number: installment.number,
            totalValue: installment.totalValue,
            remainingValue: installment.remainingValue,
            dueDate: installment.dueDate
         },
         amountToPay: installment.remainingValue.toFixed(2).replace('.', ',') // Suggest remaining amount
      });
   };

   const handleConfirmPayment = () => {
      const { client, installment, amountToPay } = paymentModal;
      if (!client || !installment) return;

      const payValue = parseFloat(amountToPay.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

      if (payValue <= 0) return;

      // Find existing payment to accumulate
      const existingPayment = client.payments?.find(p => p.installmentNumber === installment.number);
      const previouslyPaid = existingPayment ? existingPayment.value : 0;
      const newTotalPaid = previouslyPaid + payValue;

      // Determine status
      let status: 'paid' | 'partial' = 'paid';
      if (newTotalPaid < installment.totalValue - 0.05) {
         status = 'partial';
      }

      const newPayment: Payment = {
         id: existingPayment?.id || Date.now().toString(),
         clientId: client.id,
         installmentNumber: installment.number,
         dueDate: installment.dueDate,
         paidDate: new Date().toISOString(),
         value: newTotalPaid,
         status,
         method: client.fees?.monthly?.paymentMethod || 'Dinheiro'
      };

      const updatedPayments = [...(client.payments || [])];
      const existingIdx = updatedPayments.findIndex(p => p.installmentNumber === installment.number);

      if (existingIdx >= 0) {
         updatedPayments[existingIdx] = newPayment;
      } else {
         updatedPayments.push(newPayment);
      }

      updateClient(client.id, { payments: updatedPayments });

      // Create a financial transaction for this payment
      addTransaction({
         type: 'in',
         title: `Honorários: ${client.name}`,
         value: payValue,
         category: 'Honorários Contratuais',
         date: new Date().toISOString().split('T')[0],
         status: 'confirmado',
         clientId: client.id,
         installmentNumber: installment.number
      });

      if (selectedClient && selectedClient.id === client.id) {
         setSelectedClient({ ...client, payments: updatedPayments });
      }

      setPaymentModal({ isOpen: false, client: null, installment: null, amountToPay: '' });
   };

   const handleUndoPayment = (client: Client, installmentNumber: number) => {
      const updatedPayments = (client.payments || []).filter(p => p.installmentNumber !== installmentNumber);
      updateClient(client.id, { payments: updatedPayments });

      if (selectedClient && selectedClient.id === client.id) {
         setSelectedClient({ ...client, payments: updatedPayments });
      }
   };

   const selectedClientDetails = useMemo(() => {
      if (!selectedClient) return null;
      return calculateInstallmentsData(selectedClient);
   }, [selectedClient]);

   return (
      <div className="flex flex-col h-full overflow-hidden relative bg-black">
         <NewTransactionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={(t) => {
               addTransaction({
                  type: t.type,
                  title: t.title,
                  value: parseFloat(t.value.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim()),
                  category: t.category,
                  date: t.date || new Date().toISOString().split('T')[0],
                  status: t.status
               });
            }}
         />

         <FullStatementModal
            isOpen={isStatementOpen}
            onClose={() => setIsStatementOpen(false)}
            transactions={transactions}
         />

         {/* Payment Confirmation Modal */}
         {paymentModal.isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
               <div className="bg-black border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl scale-[1.02]">
                  <h3 className="text-xl font-bold text-white mb-2">Confirmar Pagamento</h3>
                  <p className="text-sm text-slate-500 mb-6">
                     Parcela {paymentModal.installment?.number} • Saldo Restante: <strong className="text-primary font-mono">{paymentModal.installment ? formatCurrency(paymentModal.installment.remainingValue) : ''}</strong>
                  </p>

                  <div className="flex flex-col gap-2 mb-6">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Valor a pagar</label>
                     <input
                        type="text"
                        autoFocus
                        value={paymentModal.amountToPay}
                        onChange={(e) => setPaymentModal(prev => ({ ...prev, amountToPay: e.target.value }))}
                        className="text-3xl font-black text-primary border-b-2 border-white/10 focus:border-primary outline-none w-full py-2 bg-transparent font-mono placeholder-primary/20 transition-all"
                        placeholder="0,00"
                     />
                  </div>

                  <div className="flex gap-3">
                     <button
                        onClick={() => setPaymentModal({ isOpen: false, client: null, installment: null, amountToPay: '' })}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-white/5 transition-all"
                     >
                        Cancelar
                     </button>
                     <button
                        onClick={handleConfirmPayment}
                        className="flex-1 py-3 rounded-xl font-bold text-black bg-primary shadow-neon hover:scale-105 transition-all uppercase tracking-widest text-xs"
                     >
                        Confirmar
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Background Elements */}
         <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

         {/* Header */}
         <header className="flex-shrink-0 px-6 py-6 lg:px-8 z-10 flex flex-wrap items-end justify-between gap-6 border-b border-white/10 bg-white/5 backdrop-blur-md">
            <div className="flex flex-col gap-1">
               <h2 className="text-3xl font-bold tracking-tight text-white font-display">Financeiro</h2>
               <p className="text-slate-500 text-sm font-light tracking-wide flex items-center gap-2">
                  Gestão de honorários, contratos e fluxo de caixa.
               </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shadow-sm backdrop-blur-md">
               <button
                  onClick={() => { setActiveTab('dashboard'); setSelectedClient(null); setSearchTerm(''); }}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-primary text-black shadow-neon' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
               >
                  Dashboard
               </button>
               <button
                  onClick={() => setActiveTab('contracts')}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'contracts' ? 'bg-primary text-black shadow-neon' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
               >
                  Contratos & Honorários
               </button>
            </div>

            {/* Hidden Add Button for now, focused on Contracts */}
            {activeTab === 'dashboard' && (
               <div />
            )}
         </header>

         {/* Main Content */}
         <div className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-hide">

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
               <div className="flex flex-col gap-6 max-w-[1600px] mx-auto animate-[fadeIn_0.3s_ease-out]">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                     {/* Card Previsão Mês */}
                     <div className="bg-white/5 p-6 rounded-3xl relative overflow-hidden group border border-white/10 hover:border-primary/30 transition-all shadow-sm hover:shadow-neon-sm shadow-primary/5">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                           <span className="material-symbols-outlined text-6xl text-primary">calendar_month</span>
                        </div>
                        <div className="flex flex-col h-full justify-between relative z-10">
                           <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-glow shadow-primary/10">
                                 <span className="material-symbols-outlined font-bold">event</span>
                              </div>
                              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Previsão (Mês Atual)</span>
                           </div>
                           <div>
                              <h3 className="text-3xl font-bold text-white font-display tracking-tight drop-shadow-glow">{dashboardMetrics.monthForecast}</h3>
                              <p className="text-xs text-primary font-bold mt-1 flex items-center gap-1 opacity-80 uppercase tracking-tighter">
                                 De pagamentos a vencer este mês
                              </p>
                           </div>
                        </div>
                     </div>

                     {/* Card Arrecadado Mês */}
                     <div className="bg-white/5 p-6 rounded-3xl relative overflow-hidden group border border-white/10 hover:border-primary/30 transition-all shadow-sm hover:shadow-neon-sm shadow-primary/5">
                        <div className="flex flex-col h-full justify-between relative z-10">
                           <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-white/5 rounded-xl text-white border border-white/10">
                                 <span className="material-symbols-outlined font-bold">account_balance</span>
                              </div>
                              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Arrecadado (Mês Atual)</span>
                           </div>
                           <div>
                              <h3 className="text-3xl font-bold text-white font-display tracking-tight">{dashboardMetrics.monthCollected}</h3>
                              <p className="text-xs text-slate-500 mt-1 uppercase tracking-tighter font-bold opacity-60">Efetivamente recebido</p>
                           </div>
                        </div>
                     </div>

                     {/* Card Inadimplência */}
                     <div className="bg-rose-500/5 p-6 rounded-3xl relative overflow-hidden group border border-rose-500/20 hover:border-rose-500/40 transition-all">
                        <div className="flex flex-col h-full justify-between relative z-10">
                           <div className="flex items-center gap-2 mb-4">
                              <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/20">
                                 <span className="material-symbols-outlined font-bold">warning</span>
                              </div>
                              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Em Atraso (Total)</span>
                           </div>
                           <div>
                              <h3 className="text-3xl font-bold text-white font-display tracking-tight">{dashboardMetrics.totalOverdue}</h3>
                              <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1 uppercase tracking-tighter">
                                 {dashboardMetrics.overdueCount} parcelas vencidas
                              </p>
                           </div>
                        </div>
                     </div>

                     {/* Card Total Carteira */}
                     <div className="bg-white/5 p-6 rounded-3xl relative overflow-hidden group border border-white/10 hover:border-primary/30 transition-all shadow-sm hover:shadow-neon-sm shadow-primary/5">
                        <div className="flex flex-col h-full justify-between relative z-10">
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                 <div className="p-2 bg-white/5 rounded-xl text-primary border border-white/10">
                                    <span className="material-symbols-outlined font-bold">savings</span>
                                 </div>
                                 <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total em Contratos</span>
                              </div>
                           </div>
                           <div>
                              <h3 className="text-3xl font-bold text-white font-display tracking-tight">{dashboardMetrics.totalContractValue}</h3>
                              <p className="text-xs text-slate-500 mt-1 uppercase tracking-tighter font-bold opacity-60">Valor global dos contratos ativos</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Transactions / Payments List */}
                  <div className="bg-black/40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                     <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <h3 className="text-lg font-bold text-white font-display">Últimos Lançamentos</h3>
                        <button
                           onClick={() => setIsStatementOpen(true)}
                           className="text-[10px] font-bold text-primary hover:text-primary-dark uppercase tracking-widest flex items-center gap-1"
                        >
                           <span className="material-symbols-outlined text-xs">receipt_long</span> Ver Extrato Completo
                        </button>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] bg-white/5">
                                 <th className="px-6 py-4">Cliente</th>
                                 <th className="px-6 py-4">Parcela</th>
                                 <th className="px-6 py-4">Método</th>
                                 <th className="px-6 py-4">Data Lançamento</th>
                                 <th className="px-6 py-4 text-right">Valor</th>
                                 <th className="px-6 py-4 text-right">Ação</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                              {dashboardMetrics.recentPayments.length > 0 ? (
                                 dashboardMetrics.recentPayments.map((p) => (
                                    <tr key={p.id} className="group hover:bg-white/5 transition-colors border-b border-white/[0.02]">
                                       <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                             <div className="size-8 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-sm">
                                                {p.clientAvatar ? <img src={p.clientAvatar} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-slate-500">{p.initials}</span>}
                                             </div>
                                             <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{p.clientName}</span>
                                          </div>
                                       </td>
                                       <td className="px-6 py-4">
                                          <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/10 uppercase tracking-widest">Parcela {p.installment}</span>
                                       </td>
                                       <td className="px-6 py-4 text-sm text-slate-500 font-bold">{p.method}</td>
                                       <td className="px-6 py-4 text-sm text-slate-500 font-mono italic">{new Date(p.date).toLocaleDateString('pt-BR')}</td>
                                       <td className="px-6 py-4 text-right text-sm font-bold font-mono text-primary drop-shadow-glow">
                                          {p.type === 'out' && '- '}{formatCurrency(p.value)}
                                       </td>
                                       <td className="px-6 py-4 text-right">
                                          <button
                                             onClick={() => { if (confirm('Excluir este lançamento?')) deleteTransaction(p.id); }}
                                             className="text-slate-600 hover:text-rose-500 transition-colors"
                                          >
                                             <span className="material-symbols-outlined text-lg">delete</span>
                                          </button>
                                       </td>
                                    </tr>
                                 ))
                              ) : (
                                 <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                       Nenhum pagamento registrado recentemente.
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            )}


            {/* CONTRACTS TAB */}
            {activeTab === 'contracts' && (
               <div className="flex flex-col gap-6 max-w-[1600px] mx-auto animate-[fadeIn_0.3s_ease-out]">

                  {!selectedClient ? (
                     // LIST VIEW WRAPPER
                     <>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                           {/* SEARCH BAR */}
                           <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-sm max-w-md flex-1 focus-within:border-primary/50 transition-all">
                              <span className="material-symbols-outlined text-slate-500 ml-2">search</span>
                              <input
                                 type="text"
                                 placeholder="Buscar cliente por nome ou CPF..."
                                 className="bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-slate-700 w-full"
                                 value={searchTerm}
                                 onChange={(e) => setSearchTerm(e.target.value)}
                              />
                           </div>

                           {/* VIEW TOGGLE */}
                           <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shadow-sm">
                              <button
                                 onClick={() => setViewMode('grid')}
                                 className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-black shadow-neon' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                                 title="Visualização em Grade"
                              >
                                 <span className="material-symbols-outlined text-[20px] font-bold">grid_view</span>
                              </button>
                              <button
                                 onClick={() => setViewMode('list')}
                                 className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-black shadow-neon' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                                 title="Visualização em Lista"
                              >
                                 <span className="material-symbols-outlined text-[20px] font-bold">view_list</span>
                              </button>
                           </div>
                        </div>

                        {clientsWithFees.length === 0 && (
                           <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                              <span className="material-symbols-outlined text-5xl mb-4 text-slate-300">
                                 {searchTerm ? 'search_off' : 'sentiment_dissatisfied'}
                              </span>
                              <p>{searchTerm ? 'Nenhum cliente encontrado com estes termos.' : 'Nenhum contrato com honorários mensais encontrado.'}</p>
                              {!searchTerm && <p className="text-xs mt-2">Adicione honorários mensais ao cadastro do cliente para ver aqui.</p>}
                           </div>
                        )}

                        {/* GRID VIEW - REFINED CLASSIC CARDS */}
                        {viewMode === 'grid' && (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {clientsWithFees.map(client => {
                                 const stats = calculateInstallmentsData(client);
                                 const overdueCount = stats.installments.filter(i => i.status === 'overdue').length;
                                 const paidCount = stats.installments.filter(i => i.status === 'paid' || (i.remainingValue <= 0.05)).length;
                                 const currentInstallment = stats.installments.find(i => i.status !== 'paid' && i.remainingValue > 0.05) || stats.installments[stats.installments.length - 1];

                                 return (
                                    <div
                                       key={client.id}
                                       onClick={() => setSelectedClient(client)}
                                       className={`bg-white/5 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden flex flex-col items-center p-8 text-center ${overdueCount > 0 ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50' : 'border-white/10 hover:border-primary/30 hover:shadow-neon-sm shadow-primary/5'}`}
                                    >
                                       <div className="absolute top-0 left-0 w-full h-[80px] bg-gradient-to-b from-white/5 to-transparent -z-10"></div>

                                       <div className="relative mb-4 mt-2">
                                          <div className="size-24 rounded-full bg-white/5 p-1 border-4 border-white/5 shadow-lg overflow-hidden flex-shrink-0">
                                             {client.avatar ? (
                                                <img src={client.avatar} className="w-full h-full object-cover rounded-full transition-transform group-hover:scale-110" />
                                             ) : (
                                                <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center">
                                                   <span className="text-2xl font-bold text-slate-500">{client.initials}</span>
                                                </div>
                                             )}
                                          </div>
                                          {overdueCount > 0 && (
                                             <div className="absolute -top-1 -right-1 size-7 bg-rose-500 rounded-full border-4 border-black flex items-center justify-center shadow-lg z-10 animate-pulse">
                                                <span className="text-xs font-bold text-white">{overdueCount}</span>
                                             </div>
                                          )}
                                       </div>

                                       <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors mb-1">{client.name}</h3>
                                       <p className="text-[10px] text-slate-500 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10 mb-6 uppercase tracking-widest">
                                          {client.process?.type === 'judicial' ? 'Processo Judicial' : 'Administrativo'}
                                       </p>

                                       <div className="w-full grid grid-cols-2 gap-2 mt-auto">
                                          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-primary/20 transition-all">
                                             <span className="text-[10px] text-slate-500 uppercase font-bold text-center tracking-tighter">Valor Mensal</span>
                                             <span className="text-sm font-black text-primary font-mono tracking-tight drop-shadow-glow">{client.fees?.monthly?.value}</span>
                                          </div>
                                          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-primary/20 transition-all">
                                             <span className="text-[10px] text-slate-500 uppercase font-bold text-center tracking-tighter">Parcelas</span>
                                             <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px] text-primary font-bold">pie_chart</span>
                                                <span className="text-sm font-black text-slate-400 font-mono">
                                                   {paidCount === stats.installments.length ? 'Ok' : `${currentInstallment?.number}/${stats.installments.length}`}
                                                </span>
                                             </div>
                                          </div>
                                       </div>

                                       <div className="mt-4 pt-4 border-t border-white/5 w-full flex justify-between items-center px-2">
                                          <span className={`text-[10px] uppercase tracking-tighter font-bold flex items-center gap-1 ${overdueCount > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                                             <span className="material-symbols-outlined text-[14px] font-bold">{overdueCount > 0 ? 'warning' : 'event'}</span>
                                             {overdueCount > 0 ? `${overdueCount} em atraso` : `Vence dia ${client.fees?.monthly?.dueDate}`}
                                          </span>
                                          <span className="text-[10px] uppercase font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                             Detalhes <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                          </span>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        )}

                        {/* LIST VIEW */}
                        {viewMode === 'list' && (
                           <div className="bg-black/40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                              <table className="w-full text-left">
                                 <thead>
                                    <tr className="bg-white/5 border-b border-white/10">
                                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Cliente</th>
                                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Tipo Processo</th>
                                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-right">Valor Mensal</th>
                                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">Dia Venc.</th>
                                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center">Parcelas</th>
                                       <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-right">Ação</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-white/5">
                                    {clientsWithFees.map(client => (
                                       <tr
                                          key={client.id}
                                          onClick={() => setSelectedClient(client)}
                                          className="hover:bg-white/5 transition-colors cursor-pointer group border-b border-white/[0.02]"
                                       >
                                          <td className="px-6 py-3">
                                             <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-sm">
                                                   {client.avatar ? (
                                                      <img src={client.avatar} className="w-full h-full object-cover" />
                                                   ) : (
                                                      <span className="text-xs font-bold text-slate-400">{client.initials}</span>
                                                   )}
                                                </div>
                                                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{client.name}</span>
                                             </div>
                                          </td>
                                          <td className="px-6 py-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                             {client.process?.type === 'judicial' ? 'Judicial' : 'Administrativo'}
                                          </td>
                                          <td className="px-6 py-3 text-sm font-black text-primary font-mono text-right drop-shadow-glow">
                                             {client.fees?.monthly?.value}
                                          </td>
                                          <td className="px-6 py-3 text-sm text-slate-600 font-medium text-center">
                                             {client.fees?.monthly?.dueDate}
                                          </td>
                                          <td className="px-6 py-3 text-center">
                                             <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-400 font-bold border border-white/10 uppercase tracking-widest">
                                                {client.fees?.monthly?.installments}
                                             </span>
                                          </td>
                                          <td className="px-6 py-3 text-right">
                                             <span className="material-symbols-outlined text-slate-700 group-hover:text-primary transition-all group-hover:translate-x-1">chevron_right</span>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </>
                  ) : (
                     // DETAIL VIEW
                     <div className="flex flex-col gap-6 animate-[slideIn_0.3s_ease-out]">
                        <button
                           onClick={() => setSelectedClient(null)}
                           className="self-start flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-all mb-2 uppercase tracking-widest"
                        >
                           <span className="material-symbols-outlined">arrow_back</span> Voltar para lista
                        </button>

                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 relative overflow-hidden shadow-2xl">
                           {/* Client Header Details */}
                           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-white/5">
                              <div className="flex items-center gap-6">
                                 <div className="size-24 rounded-3xl bg-white/5 flex items-center justify-center overflow-hidden shadow-prev border-4 border-white/5">
                                    {selectedClient.avatar ? (
                                       <img src={selectedClient.avatar} className="w-full h-full object-cover" />
                                    ) : (
                                       <span className="text-3xl font-bold text-slate-400">{selectedClient.initials}</span>
                                    )}
                                 </div>
                                 <div>
                                    <div className="flex items-center gap-2">
                                       <h2 className="text-3xl font-bold text-white font-display uppercase tracking-tight">{selectedClient.name}</h2>
                                       <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/10">
                                          {selectedClient.fees?.monthly?.paymentMethod || 'Não informado'}
                                       </span>
                                    </div>
                                    <p className="text-slate-500 text-sm mt-1">{selectedClient.fees?.monthly?.description || 'Honorários contratuais'}</p>
                                 </div>
                              </div>

                              {/* Totals Display */}
                              <div className="flex gap-4">
                                 <div className="flex flex-col items-end pr-6 border-r border-white/5">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Valor Total</span>
                                    <span className="text-slate-300 font-bold font-mono">{selectedClientDetails ? formatCurrency(selectedClientDetails.totalValue) : '...'}</span>
                                 </div>
                                 <div className="flex flex-col items-end pr-6 border-r border-white/5">
                                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Pago</span>
                                    <span className="text-lg font-bold text-primary font-bold font-mono drop-shadow-glow">{selectedClientDetails ? formatCurrency(selectedClientDetails.paidValue) : '...'}</span>
                                 </div>
                                 <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Saldo Devedor</span>
                                    <span className="text-xl font-black text-rose-500 font-black font-mono">{selectedClientDetails ? formatCurrency(selectedClientDetails.remainingValue) : '...'}</span>
                                 </div>
                              </div>
                           </div>

                           {/* Installments List */}
                           <div className="mt-8">
                              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Parcelas do Contrato</h3>
                              <div className="grid grid-cols-1 gap-4">
                                 {selectedClientDetails?.installments.map((inst) => (
                                    <div key={inst.number} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${inst.status === 'paid'
                                       ? 'bg-primary/5 border-primary/20'
                                       : inst.status === 'partial'
                                          ? 'bg-amber-500/5 border-amber-500/20' // Visual distinct for partial
                                          : inst.status === 'overdue'
                                             ? 'bg-rose-500/5 border-rose-500/20'
                                             : 'bg-white/5 border-white/10'
                                       }`}>
                                       <div className="flex items-center gap-4">
                                          <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm ${inst.status === 'paid' ? 'bg-primary text-black shadow-neon' :
                                             inst.status === 'partial' ? 'bg-amber-500 text-black' :
                                                inst.status === 'overdue' ? 'bg-rose-500 text-white shadow-neon shadow-rose-500/40' : 'bg-white/10 text-slate-400'
                                             }`}>
                                             {inst.number}
                                          </div>
                                          <div>
                                             <p className={`text-sm font-bold ${inst.status === 'paid' ? 'text-primary drop-shadow-glow' : inst.status === 'partial' ? 'text-amber-500' : 'text-white'}`}>Parcela {inst.number}</p>
                                             <p className="text-xs text-slate-500 font-mono italic">Vence: {inst.formattedDate}</p>
                                          </div>
                                       </div>

                                       <div className="flex items-center gap-6">
                                          <div className="flex flex-col items-end">
                                             <span className="font-mono font-bold text-white tracking-tighter text-sm">{inst.formattedTotalValue}</span>
                                             {inst.status === 'partial' && (
                                                <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded uppercase tracking-widest mt-1">Falta: {inst.formattedRemaining}</span>
                                             )}
                                          </div>

                                          {inst.status === 'paid' ? (
                                             <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1 text-black text-[10px] font-bold uppercase bg-primary px-3 py-1 rounded-full shadow-neon">
                                                   <span className="material-symbols-outlined text-sm">check</span> Pago
                                                </span>
                                                <button
                                                   onClick={() => handleUndoPayment(selectedClient, inst.number)}
                                                   className="text-slate-700 hover:text-rose-500 transition-colors"
                                                   title="Desfazer pagamento"
                                                >
                                                   <span className="material-symbols-outlined">undo</span>
                                                </button>
                                             </div>
                                          ) : (
                                             <div className="flex gap-2">
                                                {inst.status === 'partial' && (
                                                   <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full flex items-center uppercase tracking-widest border border-amber-500/20">
                                                      Pago: {formatCurrency(inst.paidValue)}
                                                   </span>
                                                )}
                                                <button
                                                   onClick={() => openPaymentModal(selectedClient, inst)}
                                                   className={`px-4 py-2 rounded-lg text-[10px] font-black shadow-lg transition-transform active:scale-95 flex items-center gap-2 uppercase tracking-widest border ${inst.status === 'overdue' ? 'bg-rose-500 text-white border-rose-400 shadow-neon shadow-rose-500/20' : 'bg-white/5 text-white border-white/10 hover:bg-white/10 shadow-slate-800/20'}`}
                                                >
                                                   <span className="material-symbols-outlined text-sm">payments</span>
                                                   {inst.status === 'overdue' ? 'Pagar (Atrasado)' : inst.status === 'partial' ? 'Completar' : 'Dar Baixa'}
                                                </button>
                                             </div>
                                          )}
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>

                        </div>
                     </div>
                  )}

               </div>
            )}
         </div>
      </div>
   );
};

export default Finance;