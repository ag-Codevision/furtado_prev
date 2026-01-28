import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { useData } from '../contexts/DataContext';

interface ClientSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectClient: (client: Client) => void;
}

type SearchMode = 'name' | 'cpf' | 'cnpj';

const ClientSearchModal: React.FC<ClientSearchModalProps> = ({ isOpen, onClose, onSelectClient }) => {
    const { clients } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMode, setSearchMode] = useState<SearchMode>('name');

    // Resetar estado ao fechar (opcional, ou manter persistente enquanto montado)
    // useEffect(() => { if (!isOpen) setSearchTerm(''); }, [isOpen]);

    const filteredClients = useMemo(() => {
        if (!searchTerm.trim()) return [];

        const term = searchTerm.toLowerCase();

        return clients.filter(client => {
            switch (searchMode) {
                case 'name':
                    return client.name.toLowerCase().includes(term);
                case 'cpf':
                    return client.cpf?.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
                case 'cnpj':
                    return client.cnpj?.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
                default:
                    return false;
            }
        });
    }, [clients, searchTerm, searchMode]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
            <div className="bg-black w-full max-w-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh] animate-[scaleIn_0.3s_ease-out]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                <span className="material-symbols-outlined text-primary text-xl">person_search</span>
                            </div>
                            Buscar Cliente
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Selecione um cliente para vincular à tarefa.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Filtros e Busca */}
                <div className="p-6 space-y-4">
                    {/* Tabs de Modo de Busca */}
                    <div className="flex p-1 bg-white/5 rounded-xl w-fit border border-white/5">
                        <button
                            onClick={() => setSearchMode('name')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${searchMode === 'name' ? 'bg-primary text-black shadow-neon-sm scale-110' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                            Nome
                        </button>
                        <button
                            onClick={() => setSearchMode('cpf')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${searchMode === 'cpf' ? 'bg-primary text-black shadow-neon-sm scale-110' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                            CPF
                        </button>
                        <button
                            onClick={() => setSearchMode('cnpj')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${searchMode === 'cnpj' ? 'bg-primary text-black shadow-neon-sm scale-110' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                            CNPJ
                        </button>
                    </div>

                    {/* Input de Busca */}
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors text-xl font-bold">search</span>
                        <input
                            autoFocus
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={
                                searchMode === 'name' ? "Digite o nome do cliente..." :
                                    searchMode === 'cpf' ? "Digite o CPF (apenas números)..." :
                                        "Digite o CNPJ..."
                            }
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-lg text-white placeholder-slate-700 shadow-inner"
                        />
                    </div>
                </div>

                {/* Resultados */}
                <div className="flex-1 overflow-y-auto p-2 bg-black/40 scrollbar-hide">
                    {searchTerm && filteredClients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">search_off</span>
                            <p className="text-sm font-medium">Nenhum cliente encontrado com estes critérios.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2 p-2">
                            {filteredClients.map(client => (
                                <button
                                    key={client.id}
                                    onClick={() => {
                                        onSelectClient(client);
                                        onClose();
                                    }}
                                    className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/50 hover:bg-white/10 hover:shadow-neon-sm shadow-primary/5 transition-all text-left group"
                                >
                                    <div className="size-12 rounded-full bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 relative group-hover:border-primary/30 transition-colors">
                                        {client.avatar ? (
                                            <img src={client.avatar} alt={client.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold bg-white/5 group-hover:text-primary transition-colors">
                                                {client.initials || client.name.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white group-hover:text-primary transition-colors truncate">{client.name}</h4>
                                        <div className="flex items-center gap-3 text-xs mt-0.5">
                                            {client.cpf && (
                                                <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded text-slate-400 font-mono border border-white/5 group-hover:border-primary/20 transition-colors">
                                                    CPF: {client.cpf}
                                                </span>
                                            )}
                                            {client.cnpj && (
                                                <span className="flex items-center gap-1 bg-orange-500/10 px-1.5 py-0.5 rounded text-orange-400 font-mono border border-orange-500/20 group-hover:border-orange-500/40 transition-colors">
                                                    CNPJ: {client.cnpj}
                                                </span>
                                            )}
                                            {client.role && <span className="truncate text-slate-500">• {client.role}</span>}
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-700 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {!searchTerm && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 opacity-60">
                            <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                                <span className="material-symbols-outlined text-3xl">keyboard</span>
                            </div>
                            <p className="text-sm font-medium">Digite para buscar...</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 bg-black flex justify-between items-center">
                    <span className="text-xs text-slate-600 font-bold ml-2 uppercase tracking-widest">
                        {filteredClients.length > 0 ? `${filteredClients.length} clientes encontrados` : ''}
                    </span>
                    <div className="flex items-center gap-1 opacity-40">
                        <span className="text-[10px] text-slate-600 font-mono">PREV.IA v1.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientSearchModal;
