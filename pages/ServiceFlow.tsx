import React, { useState, useMemo, useRef, useEffect } from 'react';
import { KanbanColumn, ServiceCard, Client as Contact } from '../types';
import NewClientModal from '../components/NewClientModal';
import { useData } from '../contexts/DataContext';

// Helper ultra-resiliente para comparar nomes ignorando acentos, espaços, pontuação e prefixos comuns
const normalizeName = (name: string) => {
    if (!name) return '';
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/^(sr\.|dra\.|dr\.|dona\.|sr|dra|dr|dona)\s+/i, '') // Remove prefixos comuns
        .replace(/[^a-z0-9]/g, '') // Remove tudo que não for letra ou número
        .trim();
};

const ServiceFlow: React.FC = () => {
    const {
        clients, addClient, updateClient, deleteClient,
        crmColumns: columns, crmLeads: cards, fetchCRMData,
        addCRMColumn, updateCRMColumn, deleteCRMColumn,
        addCRMLead, updateCRMLead, deleteCRMLead,
        reorderCRMColumns, reorderCRMLeads
    } = useData();

    // Remove local state for cards and columns

    // --- FILTER STATES ---
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [filters, setFilters] = useState({
        searchTerm: '',
        source: '',
        temperature: ''
    });

    // --- CRUD COLUMNS STATES ---
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [editColTitle, setEditColTitle] = useState('');
    const [editColColor, setEditColColor] = useState('blue');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // --- CARD ACTIONS STATES ---
    const [activeCardMenuId, setActiveCardMenuId] = useState<string | null>(null);
    const [editingCardId, setEditingCardId] = useState<string | null>(null);

    const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
    const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
    const [targetColumn, setTargetColumn] = useState<string | null>(null);
    const [isCreatingColumn, setIsCreatingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');


    // --- Lead Modal States ---
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [targetColumnId, setTargetColumnId] = useState<string>('triagem');
    const [leadMode, setLeadMode] = useState<'existing' | 'new'>('existing');

    // --- Temperature Slider State ---
    const [activeTempCardId, setActiveTempCardId] = useState<string | null>(null);
    const [tempSliderValue, setTempSliderValue] = useState<number>(0);

    // Search State for Existing Clients
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Contact | null>(null);

    // New Lead Details
    const [leadDetails, setLeadDetails] = useState({
        serviceType: '',
        valueEst: '',
        source: 'Indicação'
    });

    // State for Full Client Registration Modal
    const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
    const [clientToEditModal, setClientToEditModal] = useState<Contact | null>(null);

    // Filter clients based on search (Modal)
    const filteredClients = useMemo(() => {
        if (!clientSearchTerm) return [];
        const term = clientSearchTerm.toLowerCase();
        return clients.filter(c => c.name.toLowerCase().includes(term) || c.cpf.includes(term));
    }, [clientSearchTerm, clients]);

    // Unified fetch handled by DataContext

    // --- FILTER LOGIC (KANBAN) ---
    const filteredCards = useMemo(() => {
        return cards.filter(card => {
            // Text Search
            const searchLower = filters.searchTerm.toLowerCase();
            const matchesSearch = !filters.searchTerm ||
                card.leadName.toLowerCase().includes(searchLower) ||
                card.serviceType.toLowerCase().includes(searchLower);

            // Source Filter
            const matchesSource = !filters.source || card.source === filters.source;

            // Temperature Filter
            const matchesTemp = !filters.temperature || card.temperature === filters.temperature;

            return matchesSearch && matchesSource && matchesTemp;
        });
    }, [cards, filters]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.searchTerm) count++;
        if (filters.source) count++;
        if (filters.temperature) count++;
        return count;
    }, [filters]);

    // --- CRM METRICS ---
    const totalFees = useMemo(() => {
        return cards.reduce((sum, card) => {
            // Se tem cliente vinculado, tenta pegar o valor do cadastro do cliente
            const linkedClient = card.clientId ? clients.find(c => String(c.id) === String(card.clientId)) : null;
            const feeValue = linkedClient?.fees?.monthly?.value || card.valueEst || '0';

            const val = parseFloat(feeValue.replace(/[^\d,]/g, '').replace(',', '.'));
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
    }, [cards, clients]);

    const conversionRate = useMemo(() => {
        if (cards.length === 0 || columns.length === 0) return 0;
        // Asuma que a última coluna é a de conversão/fechamento
        const lastColId = columns[columns.length - 1].id;
        const convertedLeads = cards.filter(c => c.status === lastColId).length;
        return Math.round((convertedLeads / cards.length) * 100);
    }, [cards, columns]);

    const formatK = (val: number) => {
        if (val >= 1000) return `R$ ${(val / 1000).toFixed(1)}k`;
        return `R$ ${val}`;
    };

    const clearFilters = () => {
        setFilters({ searchTerm: '', source: '', temperature: '' });
        setIsFilterMenuOpen(false);
    };


    // --- Column CRUD Handlers ---

    const handleStartEditColumn = (col: KanbanColumn) => {
        setEditingColumnId(col.id);
        setEditColTitle(col.title);
        setEditColColor(col.color);
        setOpenMenuId(null);
    };

    const handleSaveColumnEdit = () => {
        if (!editingColumnId || !editColTitle.trim()) return;
        const col = columns.find(c => c.id === editingColumnId);
        if (col) {
            updateCRMColumn({ ...col, title: editColTitle, color: editColColor });
        }
        setEditingColumnId(null);
    };

    const handleDeleteColumn = (colId: string) => {
        deleteCRMColumn(colId);
        setOpenMenuId(null);
    };

    const saveNewColumn = () => {
        const randomColor = ['blue', 'purple', 'amber', 'pink', 'emerald'][Math.floor(Math.random() * 5)];
        if (!newColumnTitle.trim()) { setIsCreatingColumn(false); return; }
        addCRMColumn({ id: '', title: newColumnTitle, color: randomColor, count: 0 });
        setNewColumnTitle('');
        setIsCreatingColumn(false);
    };

    // --- CARD ACTIONS (EDIT, DELETE, MOVE) ---

    const handleDeleteCard = (cardId: string) => {
        // Simples confirmação (pode ser substituída por modal depois)
        if (window.confirm("Deseja realmente excluir este atendimento?")) {
            deleteCRMLead(cardId);
        }
        setActiveCardMenuId(null);
    };

    const handleEditCardAction = (card: ServiceCard) => {
        // Busca o cliente vinculado se existir
        const clientIdStr = card.clientId ? String(card.clientId) : '';
        const existingClient = clientIdStr ? clients.find(c => String(c.id) === clientIdStr) : null;

        if (existingClient) {
            // Se o cliente já está na base, abre direto a ficha de cadastro dele, 
            // pois lá já constam os honorários e dados de serviço.
            setClientToEditModal(existingClient);
            setIsNewClientModalOpen(true);
        } else {
            // Se ainda não tem cliente vinculado (lead puro), abre o modal de lead
            setEditingCardId(card.id);
            setTargetColumnId(card.status);
            setLeadMode('existing');

            setLeadDetails({
                serviceType: card.serviceType || '',
                valueEst: card.valueEst?.replace('R$ ', '') || '',
                source: card.source
            });

            // Mock do cliente temporário para exibição no modal de lead
            setSelectedClient({
                id: 'temp',
                name: card.leadName,
                avatar: card.leadAvatar,
                role: card.serviceType,
                company: 'N/A',
                time: 'Agora',
                active: true,
                cpf: '000.000.000-00',
                age: '-',
                status: 'Ativo',
                phones: { cell: card.leadPhone }
            } as any);
            setIsLeadModalOpen(true);
        }

        setActiveCardMenuId(null);
    };

    const handleMoveCard = (cardId: string, direction: 'next' | 'prev') => {
        const card = cards.find(c => c.id === cardId);
        if (!card) return;

        const currentColIndex = columns.findIndex(c => c.id === card.status);
        let newColIndex = direction === 'next' ? currentColIndex + 1 : currentColIndex - 1;

        // Bounds check
        if (newColIndex >= 0 && newColIndex < columns.length) {
            const newStatus = columns[newColIndex].id;
            updateCRMLead({ ...card, status: newStatus });
        }
        setActiveCardMenuId(null);
    };


    // --- General Handlers ---
    const handleOpenLeadModal = (colId: string = 'triagem') => {
        setEditingCardId(null); // Garante que estamos criando um novo
        setTargetColumnId(colId);
        setIsLeadModalOpen(true);
        setLeadMode('existing');
        setSelectedClient(null);
        setClientSearchTerm('');
        setLeadDetails({ serviceType: '', valueEst: '', source: 'Indicação' });
    };
    const handleCreateCard = () => {
        const commonData = {
            leadName: selectedClient ? selectedClient.name : leadDetails.serviceType || 'Novo Lead',
            leadAvatar: selectedClient ? selectedClient.avatar : null,
            leadPhone: selectedClient ? (selectedClient.phones?.cell || '') : '',
            clientId: selectedClient ? String(selectedClient.id) : null,
            serviceType: leadDetails.serviceType,
            valueEst: leadDetails.valueEst ? (leadDetails.valueEst.startsWith('R$') ? leadDetails.valueEst : `R$ ${leadDetails.valueEst}`) : '',
            source: leadDetails.source as any,
            status: targetColumnId
        };

        if (editingCardId) {
            const existingCard = cards.find(c => c.id === editingCardId);
            if (existingCard) {
                updateCRMLead({ ...existingCard, ...commonData });
            }
        } else {
            const newCard: ServiceCard = {
                id: '', // Will be assigned by DB
                ...commonData,
                lastInteraction: 'Agora',
                temperature: 'warm',
            };
            addCRMLead(newCard);
        }

        setIsLeadModalOpen(false);
        setEditingCardId(null);
    };

    const handleSaveNewClient = (newClientData: any) => {
        addClient(newClientData);
        setSelectedClient(newClientData);
        setLeadMode('existing');
        setLeadDetails(prev => ({ ...prev, serviceType: newClientData.role }));
    };

    // --- Temperature Handlers (REFACTORED) ---
    const getInitialSliderValue = (temp: string) => {
        switch (temp) {
            case 'hot': return 100;
            case 'warm': return 50;
            default: return 0;
        }
    };

    const handleTempSliderChange = (e: React.ChangeEvent<HTMLInputElement>, cardId: string) => {
        const newVal = parseInt(e.target.value);
        setTempSliderValue(newVal);

        // Update card state
        const card = cards.find(c => c.id === cardId);
        if (card) {
            updateCRMLead({ ...card, temperature: getTempFromValue(newVal) });
        }
    };

    // Helper to get temp state from slider value for immediate UI feedback
    const getTempFromValue = (val: number) => {
        if (val >= 67) return 'hot';
        if (val >= 34) return 'warm';
        return 'cold';
    };

    const getTempLabel = (temp: string) => {
        switch (temp) {
            case 'hot': return 'Alta Probabilidade';
            case 'warm': return 'Média Probabilidade';
            default: return 'Baixa Probabilidade';
        }
    };

    // --- DnD Handlers ---
    const handleCardDragStart = (e: React.DragEvent, cardId: string) => {
        // Se o score de conversão estiver aberto, bloqueia qualquer arraste do card
        if (activeTempCardId) {
            e.preventDefault();
            return;
        }
        e.stopPropagation();
        setDraggedCardId(cardId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('type', 'card');
    };

    const handleColumnDragStart = (e: React.DragEvent, colId: string) => {
        if (editingColumnId) {
            e.preventDefault();
            return;
        }
        setDraggedColumnId(colId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('type', 'column');
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        setTargetColumn(columnId);
    };

    const handleDrop = (e: React.DragEvent, targetColId: string) => {
        e.preventDefault();
        if (draggedCardId) {
            // Reorder leads in target column
            const targetLeads = cards.filter(c => c.status === targetColId);
            const draggedCard = cards.find(c => c.id === draggedCardId);
            if (draggedCard) {
                // If moving to same column, handle reordering. If different, move and reorder.
                const newLeads = targetLeads.filter(l => l.id !== draggedCardId);
                // For now, let's simplify and just append it at the end of the new column
                // but reorderCRMLeads handles the position updates atomicly.
                reorderCRMLeads(targetColId, [...newLeads, draggedCard]);
            }
            setDraggedCardId(null);
        } else if (draggedColumnId && draggedColumnId !== targetColId) {
            const oldIndex = columns.findIndex(c => c.id === draggedColumnId);
            const newIndex = columns.findIndex(c => c.id === targetColId);
            const newCols = [...columns];
            const [movedCol] = newCols.splice(oldIndex, 1);
            newCols.splice(newIndex, 0, movedCol);
            reorderCRMColumns(newCols);
            setDraggedColumnId(null);
        }
        setTargetColumn(null);
    };

    const handleDragLeave = () => setTargetColumn(null);

    const getSourceColor = (source: string) => {
        switch (source) {
            case 'Instagram': return 'bg-pink-50 text-pink-600 border-pink-200';
            case 'Google': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'Indicação': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'Site': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
            default: return 'bg-slate-50 text-slate-500 border-slate-200';
        }
    };

    const getTempIcon = (temp: string) => {
        switch (temp) {
            case 'hot': return <span className="material-symbols-outlined text-red-500 text-sm animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">local_fire_department</span>;
            case 'warm': return <span className="material-symbols-outlined text-amber-500 text-sm">sunny</span>;
            default: return <span className="material-symbols-outlined text-cyan-400 text-sm">ac_unit</span>;
        }
    };

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = () => {
            setOpenMenuId(null);
            setActiveCardMenuId(null);
            setIsFilterMenuOpen(false); // Close filter menu as well
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh)] md:h-full overflow-hidden bg-black relative">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

            {/* --- MODALS --- */}
            {isLeadModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLeadModalOpen(false)}></div>
                    <div className="relative w-full max-w-lg bg-[#0d0d0d]/95 backdrop-blur-3xl rounded-3xl shadow-3xl animate-[scaleIn_0.3s_ease-out] border border-white/10">
                        <div className="p-8 pb-0">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-white font-display uppercase italic tracking-tighter">{editingCardId ? 'Editar' : 'Novo Lead'}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1.5">
                                        Destino: <span className="text-primary opacity-100">{columns.find(c => c.id === targetColumnId)?.title}</span>
                                    </p>
                                </div>
                                <button onClick={() => setIsLeadModalOpen(false)} className="size-10 rounded-full bg-white/5 border border-white/5 hover:border-primary/50 flex items-center justify-center text-slate-500 hover:text-white transition-all group">
                                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                                </button>
                            </div>

                            {/* Mode Toggle (Disable if editing) */}
                            {!editingCardId && (
                                <div className="flex bg-white/[0.03] p-1.5 rounded-2xl mb-8 border border-white/5">
                                    <button
                                        onClick={() => setLeadMode('existing')}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${leadMode === 'existing' ? 'bg-primary text-black shadow-neon-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    >Base de Clientes</button>
                                    <button
                                        onClick={() => setLeadMode('new')}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${leadMode === 'new' ? 'bg-primary text-black shadow-neon-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    >Novo Candidato</button>
                                </div>
                            )}

                            {/* Existing Client Search (Hide search if editing to lock client) */}
                            {leadMode === 'existing' && (
                                <div className="mb-6 px-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">Vincular Cliente da Base</label>
                                    {!selectedClient ? (
                                        <div className="relative px-2">
                                            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                                            <input
                                                autoFocus
                                                className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-white/5 focus:bg-white/10 focus:border-primary outline-none transition-all text-xs font-bold text-white placeholder:text-slate-700"
                                                placeholder="Nome ou CPF do cliente..."
                                                value={clientSearchTerm}
                                                onChange={e => setClientSearchTerm(e.target.value)}
                                            />
                                            {clientSearchTerm && (
                                                <div className="absolute top-full left-0 right-0 mt-3 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-3xl max-h-72 overflow-y-auto results-scrollbar z-[70] animate-[scaleIn_0.15s_ease-out]">
                                                    {filteredClients.map(client => (
                                                        <div
                                                            key={client.id}
                                                            onClick={() => setSelectedClient(client)}
                                                            className="p-4 hover:bg-white/5 cursor-pointer flex items-center gap-4 border-b border-white/5 last:border-0 transition-colors group/item"
                                                        >
                                                            <div className="size-10 rounded-xl bg-white/5 bg-cover bg-center border border-white/10 group-hover/item:border-primary/50 transition-colors" style={{ backgroundImage: client.avatar ? `url('${client.avatar}')` : undefined }}>
                                                                {!client.avatar && <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">{client.name.substring(0, 2)}</div>}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-white group-hover/item:text-primary transition-colors uppercase tracking-widest">{client.name}</p>
                                                                <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{client.cpf}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {filteredClients.length === 0 && (
                                                        <div className="p-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 italic opacity-60 font-serif">Nenhum registro encontrado.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl relative group/sel animate-[scaleIn_0.2s_ease-out]">
                                            <div className="size-12 rounded-xl bg-white/10 bg-cover bg-center border border-primary/30 shadow-glow shadow-primary/10" style={{ backgroundImage: selectedClient.avatar ? `url('${selectedClient.avatar}')` : undefined }}>
                                                {!selectedClient.avatar && <div className="h-full flex items-center justify-center text-xs font-black text-primary uppercase">{selectedClient.name.substring(0, 2)}</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-white uppercase tracking-widest truncate">{selectedClient.name}</p>
                                                <p className="text-[9px] font-bold text-primary/70 uppercase tracking-widest mt-1 italic">{selectedClient.role}</p>
                                            </div>
                                            {/* Only allow clearing client if NOT editing existing card */}
                                            {!editingCardId && (
                                                <button onClick={() => setSelectedClient(null)} className="size-8 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all mr-1"><span className="material-symbols-outlined text-[18px]">close</span></button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}





                            {/* New Client Prompt */}
                            {leadMode === 'new' && (
                                <div className="mb-6 p-8 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                                    <div className="size-16 rounded-full bg-primary/10 shadow-inner flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                        <span className="material-symbols-outlined text-primary text-3xl drop-shadow-glow-sm">person_add</span>
                                    </div>
                                    <h4 className="text-base font-black text-white mb-2 uppercase italic tracking-widest">Novo Registro</h4>
                                    <p className="text-[10px] font-bold text-slate-500 mb-6 px-4 uppercase tracking-widest leading-relaxed">Inicie um novo cadastro do zero para vincular ao pipeline de atendimento.</p>
                                    <button
                                        onClick={() => {
                                            setIsLeadModalOpen(false); // Hide this modal
                                            setIsNewClientModalOpen(true); // Open the full form
                                        }}
                                        className="w-full py-4 rounded-xl bg-primary text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-neon hover:bg-white transition-all transform hover:-translate-y-1 active:scale-95"
                                    >
                                        Abrir Ficha de Cadastro
                                    </button>
                                </div>
                            )}

                        </div>
                        <div className="p-6 bg-white/[0.03] border-t border-white/5 flex flex-col md:flex-row justify-end gap-3 mt-4 rounded-b-3xl">
                            <button onClick={() => setIsLeadModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Cancelar</button>
                            <button
                                onClick={handleCreateCard}
                                disabled={leadMode === 'existing' && !selectedClient}
                                className="px-8 py-3 rounded-xl bg-primary text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-neon hover:bg-white disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                            >
                                {editingCardId ? 'Editar' : 'Adicionar ao Pipeline'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <NewClientModal
                isOpen={isNewClientModalOpen}
                clientToEdit={clientToEditModal}
                onClose={() => {
                    setIsNewClientModalOpen(false);
                    setClientToEditModal(null);
                    // Só volta pro modal de lead se NÃO estivermos editando um cliente existente
                    if (!clientToEditModal) {
                        setIsLeadModalOpen(true);
                    }
                }}
                onDelete={(id) => {
                    deleteClient(id);
                    setIsNewClientModalOpen(false);
                    setClientToEditModal(null);
                }}
                onSave={(data) => {
                    if (clientToEditModal) {
                        updateClient(data);
                        // Sincroniza dados no CRM com comparação robusta por ID e Nomes normalizados
                        const oldNameNorm = normalizeName(clientToEditModal.name);

                        cards.forEach(c => {
                            const cardIdStr = c.clientId ? String(c.clientId) : '';
                            const cardNameNorm = normalizeName(c.leadName);
                            const isSameClient = (cardIdStr && cardIdStr === String(data.id)) || (cardNameNorm === oldNameNorm);

                            if (isSameClient) {
                                updateCRMLead({
                                    ...c,
                                    clientId: String(data.id),
                                    leadName: data.name,
                                    leadAvatar: data.avatar,
                                    leadPhone: data.phones?.cell || ''
                                });
                            }
                        });
                    } else {
                        handleSaveNewClient(data);
                        setIsLeadModalOpen(true);
                    }
                    setIsNewClientModalOpen(false);
                    setClientToEditModal(null);
                }}
            />

            <style>{`
        .crm-scroll-container::-webkit-scrollbar {
          height: 10px;
          width: 10px;
          display: block;
        }
        .crm-scroll-container::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          margin: 0 32px;
          border-radius: 20px;
        }
        .crm-scroll-container::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #D4AF37 0%, #B8860B 100%);
          border-radius: 20px;
          border: 2px solid #000;
          background-clip: padding-box;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
        }
        .crm-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #D4AF37;
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
        }
        
        .results-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .results-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 10px;
        }
        .results-scrollbar::-webkit-scrollbar-thumb {
          background: #D4AF37;
          border-radius: 10px;
        }
        
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #D4AF37;
          border: 3px solid #000;
          cursor: pointer;
          margin-top: -6px;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
          transition: all 0.2s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.8);
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          border-radius: 10px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.05);
        }
      `}</style>

            {/* HEADER */}
            <header className="px-8 py-8 flex flex-wrap justify-between items-end gap-6 shrink-0 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl z-40 w-full relative">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-black tracking-tighter text-white font-display uppercase italic">Atendimento & CRM</h2>
                        <span className="px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-[10px] font-bold uppercase tracking-widest text-primary shadow-neon-sm">Pipeline Comercial</span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 opacity-70">
                        Gestão de leads, propostas e novos contratos.
                    </p>
                </div>
                <div className="flex gap-6 items-center">
                    <div className="flex gap-8 mr-6 border-r border-white/10 pr-8 hidden md:flex shrink-0">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase text-slate-500 font-black tracking-widest opacity-60">Conversão</span>
                            <span className="text-xl font-black text-emerald-500 drop-shadow-glow-sm">{conversionRate}%</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase text-slate-500 font-black tracking-widest opacity-60">Honorários Est.</span>
                            <span className="text-xl font-black text-white">{formatK(totalFees)}</span>
                        </div>
                    </div>

                    {/* FILTROS BUTTON & DROPDOWN */}
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsFilterMenuOpen(!isFilterMenuOpen); }}
                            className={`px-5 py-2.5 rounded-xl border transition-all duration-300 shadow-sm flex items-center gap-2 shrink-0 font-bold text-xs uppercase tracking-widest ${activeFilterCount > 0 || isFilterMenuOpen ? 'bg-primary text-black border-primary shadow-neon-sm' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/20'}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">tune</span> Filtros
                            {activeFilterCount > 0 && (
                                <span className="size-5 rounded-full bg-black text-primary text-[10px] font-black flex items-center justify-center -mr-1 shadow-glow-sm">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {isFilterMenuOpen && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-3 w-80 bg-[#0a0a0a]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 p-6 z-50 animate-[scaleIn_0.2s_ease-out]"
                            >
                                <div className="flex justify-between items-center mb-5">
                                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Filtros Avançados</h4>
                                    <button onClick={clearFilters} className="text-[10px] text-primary font-black uppercase tracking-widest hover:text-white transition-colors">Limpar Tudo</button>
                                </div>

                                <div className="space-y-6">
                                    {/* Busca por Texto */}
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2 block">Buscar Lead / Assunto</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                                            <input
                                                value={filters.searchTerm}
                                                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                                                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-700"
                                                placeholder="Digite o nome..."
                                            />
                                        </div>
                                    </div>

                                    {/* Origem */}
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2 block">Origem do Lead</label>
                                        <div className="relative">
                                            <select
                                                value={filters.source}
                                                onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                                                className="w-full h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="" className="bg-[#0a0a0a]">Todas as Origens</option>
                                                <option value="Indicação" className="bg-[#0a0a0a]">Indicação</option>
                                                <option value="Instagram" className="bg-[#0a0a0a]">Instagram</option>
                                                <option value="Google" className="bg-[#0a0a0a]">Google</option>
                                                <option value="Site" className="bg-[#0a0a0a]">Site</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">expand_more</span>
                                        </div>
                                    </div>

                                    {/* Temperatura */}
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2 block">Probabilidade (Score)</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setFilters(prev => ({ ...prev, temperature: prev.temperature === 'hot' ? '' : 'hot' }))}
                                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5 ${filters.temperature === 'hot' ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-glow-sm shadow-red-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-white'}`}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">local_fire_department</span> Alta
                                            </button>
                                            <button
                                                onClick={() => setFilters(prev => ({ ...prev, temperature: prev.temperature === 'warm' ? '' : 'warm' }))}
                                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5 ${filters.temperature === 'warm' ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-glow-sm shadow-amber-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-white'}`}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">sunny</span> Média
                                            </button>
                                            <button
                                                onClick={() => setFilters(prev => ({ ...prev, temperature: prev.temperature === 'cold' ? '' : 'cold' }))}
                                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5 ${filters.temperature === 'cold' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-500 shadow-glow-sm shadow-cyan-500/20' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-white'}`}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">ac_unit</span> Baixa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => handleOpenLeadModal('triagem')}
                        className="flex items-center gap-3 bg-primary text-black font-black text-xs uppercase tracking-[0.2em] px-8 py-3 rounded-xl transition-all shadow-neon hover:bg-white hover:-translate-y-1 active:scale-95 shrink-0"
                    >
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        Novo Lead
                    </button>
                </div>
            </header>

            {/* KANBAN */}
            <div className="flex-1 w-full relative min-h-0">
                <div className="absolute inset-0 crm-scroll-container overflow-auto">
                    <div className="inline-flex min-h-full items-start px-8 pt-6 pb-20">
                        {columns.map((col, colIndex) => {
                            // MODIFIED: Use filteredCards instead of cards
                            const columnCards = filteredCards.filter(c => c.status === col.id);
                            const totalCardsInColumn = cards.filter(c => c.status === col.id).length;
                            const isTarget = targetColumn === col.id;
                            const isColumnDropTarget = isTarget && draggedColumnId !== null && draggedColumnId !== col.id;
                            const isCardDropTarget = isTarget && draggedCardId !== null;
                            const isEditing = editingColumnId === col.id;
                            const isMenuOpen = openMenuId === col.id;

                            return (
                                <div
                                    key={col.id}
                                    className={`w-[340px] shrink-0 mr-6 flex flex-col min-h-full group select-none transition-all duration-300 ${isColumnDropTarget ? 'translate-x-2' : ''}`}
                                    draggable={!isEditing} // Disable drag when editing
                                    onDragStart={(e) => handleColumnDragStart(e, col.id)}
                                    onDragOver={(e) => handleDragOver(e, col.id)}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                    onDragLeave={handleDragLeave}
                                >
                                    {/* COLUMN HEADER with CRUD */}
                                    <div className={`relative z-30 flex items-center justify-between mb-5 px-5 py-4 rounded-2xl bg-white/[0.03] border backdrop-blur-md cursor-grab active:cursor-grabbing hover:bg-white/[0.08] transition-all duration-300 ${isColumnDropTarget ? 'border-primary ring-4 ring-primary/20 bg-white/10' : 'border-white/5'}`}>
                                        {isEditing ? (
                                            <div className="flex flex-col w-full gap-3 animate-[scaleIn_0.2s_ease-out]">
                                                <input
                                                    autoFocus
                                                    value={editColTitle}
                                                    onChange={(e) => setEditColTitle(e.target.value)}
                                                    className="w-full text-[10px] font-black uppercase tracking-widest border-none bg-white/5 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary text-white outline-none"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveColumnEdit()}
                                                />
                                                <div className="flex justify-between items-center">
                                                    <div className="flex gap-2">
                                                        {['blue', 'purple', 'amber', 'pink', 'emerald'].map(c => (
                                                            <button
                                                                key={c}
                                                                onClick={() => setEditColColor(c)}
                                                                className={`w-4 h-4 rounded-full transition-all ${editColColor === c ? `bg-${c}-500 ring-4 ring-offset-4 ring-offset-black ring-${c}-500/30 scale-125` : `bg-${c}-900 hover:bg-${c}-700`}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEditingColumnId(null)} className="size-8 flex items-center justify-center bg-white/5 text-slate-500 hover:text-white hover:bg-red-500/20 rounded-full transition-all"><span className="material-symbols-outlined text-[16px]">close</span></button>
                                                        <button onClick={handleSaveColumnEdit} className="size-8 flex items-center justify-center bg-primary text-black rounded-full shadow-neon-sm transition-all"><span className="material-symbols-outlined text-[16px]">check</span></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className={`w-3 h-3 rounded-full bg-${col.color}-500 shadow-glow shadow-${col.color}-500/50 shrink-0`}></div>
                                                    <div className="flex flex-col">
                                                        <h3 className="text-xs font-black text-white font-display tracking-[0.15em] uppercase italic truncate">{col.title}</h3>
                                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{totalCardsInColumn} {totalCardsInColumn === 1 ? 'Card' : 'Cards'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {/* Menu Trigger */}
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : col.id); }}
                                                            className="size-9 rounded-full flex items-center justify-center hover:bg-white/5 text-slate-500 hover:text-primary transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                                                        </button>

                                                        {/* Dropdown Menu */}
                                                        {isMenuOpen && (
                                                            <div className="absolute right-0 top-full mt-2 w-44 bg-[#0a0a0a]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 py-2 z-50 animate-[scaleIn_0.15s_ease-out] flex flex-col overflow-hidden">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleStartEditColumn(col); }}
                                                                    className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 hover:text-primary flex items-center gap-3 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">edit</span> Editar Nome
                                                                </button>
                                                                <div className="h-px bg-white/5 mx-4"></div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteColumn(col.id); }}
                                                                    className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-red-500/70 hover:bg-red-500/10 hover:text-red-500 flex items-center gap-3 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">delete</span> Excluir Etapa
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className={`flex-1 rounded-3xl border transition-all duration-300 p-3 flex flex-col gap-4 min-h-0 ${isCardDropTarget ? 'bg-primary/[0.03] border-primary/30' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}>
                                        {columnCards.map((c) => (
                                            <div
                                                key={c.id}
                                                // Draggable só é verdadeiro se NENHUM slider estiver aberto
                                                draggable={!activeTempCardId}
                                                onDragStart={(e) => handleCardDragStart(e, c.id)}
                                                onMouseDown={(e) => {
                                                    // Se clicar em qualquer coisa que tenha a classe 'no-drag', impede o início do arraste do card
                                                    if ((e.target as HTMLElement).closest('.no-drag')) {
                                                        e.stopPropagation();
                                                    }
                                                }}
                                                className={`glass-panel p-5 rounded-2xl border border-white/5 hover:border-primary/50 transition-all duration-300 group/card relative bg-white/[0.02] backdrop-blur-2xl 
                                                    ${draggedCardId === c.id ? 'opacity-40 rotate-[2deg] scale-95' : 'hover:-translate-y-1 hover:bg-white/[0.05] shadow-xl'} 
                                                    ${activeTempCardId === c.id ? 'z-50 ring-2 ring-primary/30 shadow-neon-sm' : 'z-0 cursor-grab active:cursor-grabbing'}`}
                                            >
                                                <div className="flex justify-between items-start mb-4 relative z-10">
                                                    <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10 bg-white/5 text-slate-400 group-hover/card:border-primary/30 group-hover/card:text-primary transition-colors`}>
                                                        {c.source}
                                                    </span>

                                                    <div className="flex gap-2 relative no-drag">
                                                        {/* --- TEMPERATURE INTERACTIVE ICON --- */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const val = c.temperature === 'hot' ? 100 : c.temperature === 'warm' ? 50 : 0;
                                                                setTempSliderValue(val);
                                                                setActiveTempCardId(c.id);
                                                            }}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            className="size-7 flex items-center justify-center hover:bg-white/10 rounded-full transition-all cursor-pointer no-drag"
                                                        >
                                                            {getTempIcon(c.temperature)}
                                                        </button>
                                                    </div>

                                                    {/* --- CARD OPTIONS MENU (THREE DOTS) --- */}
                                                    <div className="relative no-drag">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveCardMenuId(activeCardMenuId === c.id ? null : c.id); }}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                            className="size-7 flex items-center justify-center text-slate-500 hover:text-primary transition-all rounded-full hover:bg-white/10 no-drag"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                                        </button>

                                                        {activeCardMenuId === c.id && (
                                                            <div
                                                                className="absolute right-0 top-10 w-56 bg-[#0d0d0d]/95 backdrop-blur-3xl rounded-2xl shadow-3xl border border-white/10 z-[100] animate-[scaleIn_0.15s_ease-out] flex flex-col overflow-hidden"
                                                                onClick={(e) => e.stopPropagation()} // Prevent card drag
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                            >
                                                                <div className="p-2 flex flex-col gap-1">
                                                                    <button onClick={() => handleEditCardAction(c)} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 hover:text-primary rounded-xl flex items-center gap-3 transition-colors">
                                                                        <span className="material-symbols-outlined text-[17px]">edit</span> Editar
                                                                    </button>
                                                                    <a href={`https://wa.me/55${c.leadPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-500 rounded-xl flex items-center gap-3 transition-colors">
                                                                        <span className="material-symbols-outlined text-[17px]">chat</span> Iniciar Chat
                                                                    </a>

                                                                    <div className="h-px bg-white/5 my-1 mx-3"></div>

                                                                    {/* Move Actions */}
                                                                    {colIndex < columns.length - 1 && (
                                                                        <button onClick={() => handleMoveCard(c.id, 'next')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-white/10 hover:text-primary rounded-xl flex items-center gap-3 transition-colors">
                                                                            <span className="material-symbols-outlined text-[17px]">arrow_forward</span> Avançar Etapa
                                                                        </button>
                                                                    )}
                                                                    {colIndex > 0 && (
                                                                        <button onClick={() => handleMoveCard(c.id, 'prev')} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-white/10 hover:text-primary rounded-xl flex items-center gap-3 transition-colors">
                                                                            <span className="material-symbols-outlined text-[17px]">arrow_back</span> Retornar Etapa
                                                                        </button>
                                                                    )}

                                                                    <div className="h-px bg-white/5 my-1 mx-3"></div>

                                                                    <button onClick={() => handleDeleteCard(c.id)} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:bg-red-500/10 hover:text-red-500 rounded-xl flex items-center gap-3 transition-colors">
                                                                        <span className="material-symbols-outlined text-[17px]">delete</span> Excluir Lead
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 mb-5">
                                                    {c.leadAvatar ? (
                                                        <div className="size-12 rounded-2xl bg-cover bg-center border border-white/10 shadow-lg pointer-events-none group-hover/card:border-primary/50 transition-colors" style={{ backgroundImage: `url('${c.leadAvatar}')` }}></div>
                                                    ) : (
                                                        <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary font-black text-sm shadow-inner pointer-events-none group-hover/card:border-primary/50 transition-colors uppercase italic">
                                                            {c.leadName.substring(0, 2)}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-[13px] font-black text-white leading-tight truncate group-hover/card:text-primary transition-colors">{c.leadName}</h4>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate mt-1">{c.serviceType}</p>
                                                    </div>
                                                </div>

                                                {(() => {
                                                    const linkedClient = c.clientId ? clients.find(cl => String(cl.id) === String(c.clientId)) : null;
                                                    const displayValue = linkedClient?.fees?.monthly?.value || c.valueEst || 'R$ 0,00';

                                                    return (
                                                        <div className="mb-4 px-3 py-2 bg-white/5 rounded-xl border border-white/5 group-hover/card:border-white/10 flex items-center justify-between transition-colors">
                                                            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Honorários</span>
                                                            <span className="text-[11px] font-black text-emerald-500 drop-shadow-glow-sm">{displayValue}</span>
                                                        </div>
                                                    );
                                                })()}

                                                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-1 group-hover/card:border-white/10 transition-colors">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-600 flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[13px] opacity-50">schedule</span> {c.lastInteraction}
                                                    </span>
                                                    <div className="flex gap-1.5 opacity-40 group-hover/card:opacity-100 transition-all duration-300">
                                                        <a href={`tel:${c.leadPhone}`} className="size-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all" title="Ligar">
                                                            <span className="material-symbols-outlined text-[15px]">call</span>
                                                        </a>
                                                        <a href={`https://wa.me/55${c.leadPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="size-8 flex items-center justify-center rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500/70 hover:text-emerald-500 transition-all" title="WhatsApp">
                                                            <span className="material-symbols-outlined text-[15px]">chat</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {columnCards.length === 0 && (
                                            <div className="h-full min-h-[100px] rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-slate-600 text-xs font-bold uppercase tracking-wider opacity-60">
                                                {isCardDropTarget ? 'Solte aqui' : 'Vazio'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Button */}
                                    <div className="mt-2 text-center shrink-0">
                                        <button
                                            onClick={() => handleOpenLeadModal(col.id)}
                                            className="text-[10px] text-slate-500 hover:text-primary font-black uppercase tracking-widest flex items-center justify-center gap-2 w-full py-3 hover:bg-white/5 rounded-xl transition-all group/add"
                                        >
                                            <span className="material-symbols-outlined text-[18px] group-hover/add:rotate-90 transition-transform">add</span> Adicionar Card
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="flex flex-col h-full min-w-[320px] w-[320px] shrink-0 mr-8">
                            {!isCreatingColumn ? (
                                <button onClick={() => setIsCreatingColumn(true)} className="w-full h-[70px] rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center text-slate-500 gap-3 group/newcol">
                                    <span className="material-symbols-outlined text-2xl group-hover/newcol:scale-125 transition-transform">add_circle</span>
                                    <span className="font-black text-[10px] uppercase tracking-[0.2em]">Cadastrar Nova Etapa</span>
                                </button>
                            ) : (
                                <div className="w-full p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl animate-[scaleIn_0.2s_ease-out]">
                                    <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-3">Identificação da Etapa</h4>
                                    <input autoFocus type="text" value={newColumnTitle} onChange={(e) => setNewColumnTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveNewColumn()} className="w-full h-11 px-4 mb-4 text-xs font-bold border border-white/10 bg-white/5 text-white rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Digite o nome..." />
                                    <div className="flex gap-3 justify-end uppercase font-black tracking-widest text-[10px]">
                                        <button onClick={() => setIsCreatingColumn(false)} className="px-4 py-2 text-slate-500 hover:text-white transition-colors">Cancelar</button>
                                        <button onClick={saveNewColumn} className="px-6 py-2 text-black bg-primary hover:bg-white rounded-xl shadow-neon transition-all transform active:scale-95">Criar Etapa</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="w-8 h-full shrink-0"></div>
                    </div>
                </div>
                {/* --- SCORE DE CONVERSÃO MODAL (FIXED CENTER) --- */}
                {activeTempCardId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setActiveTempCardId(null)}></div>
                        <div className="relative w-full max-w-sm bg-[#0d0d0d]/95 backdrop-blur-3xl p-8 rounded-[40px] shadow-3xl border border-white/10 animate-[scaleIn_0.3s_ease-out]">
                            <div className="flex flex-col items-center gap-6">
                                <div className="size-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-neon-sm">
                                    {getTempIcon(getTempFromValue(tempSliderValue))}
                                </div>

                                <div className="text-center">
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Score de Conversão</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                                        Defina a probabilidade de fechamento <br /> para o lead: <span className="text-primary">{cards.find(c => String(c.id) === String(activeTempCardId))?.leadName}</span>
                                    </p>
                                </div>

                                <div className="w-full space-y-4">
                                    <div className="py-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={tempSliderValue}
                                            onChange={(e) => handleTempSliderChange(e, activeTempCardId!)}
                                            className="w-full h-2 rounded-full cursor-pointer accent-primary"
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
                                        <span>Baixa</span>
                                        <span>Média</span>
                                        <span>Alta</span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 w-full text-center">
                                    <span className={`text-sm font-black uppercase tracking-[0.2em] italic ${tempSliderValue >= 67 ? 'text-red-500' : tempSliderValue >= 34 ? 'text-amber-500' : 'text-cyan-500'}`}>
                                        {getTempLabel(getTempFromValue(tempSliderValue))}
                                    </span>
                                </div>

                                <button
                                    onClick={() => setActiveTempCardId(null)}
                                    className="mt-4 px-10 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceFlow;