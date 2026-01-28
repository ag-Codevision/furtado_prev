
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Decision } from '../types';

const Decisions: React.FC = () => {
    const {
        decisions, addDecision, updateDecision, deleteDecision,
        courtLocations, addCourtLocation, updateCourtLocation, deleteCourtLocation
    } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManageLocationsOpen, setIsManageLocationsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [isSavingLocation, setIsSavingLocation] = useState(false);
    const [newLocationName, setNewLocationName] = useState('');

    // States for managing locations CRUD
    const [locationBeingEdited, setLocationBeingEdited] = useState<string | null>(null);
    const [tempLocationName, setTempLocationName] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        return (localStorage.getItem('decisions_view_mode') as 'grid' | 'list') || 'grid';
    });

    const toggleViewMode = (mode: 'grid' | 'list') => {
        setViewMode(mode);
        localStorage.setItem('decisions_view_mode', mode);
    };

    // Form State
    const [formData, setFormData] = useState<Partial<Decision>>({
        location: '',
        opponent: '',
        decisionType: 'procedente',
        fundamentals: ''
    });

    const filteredDecisions = useMemo(() => {
        return decisions.filter(d =>
            (searchTerm === '' || d.processNumber.includes(searchTerm) || d.fundamentals.toLowerCase().includes(searchTerm.toLowerCase()) || (d.opponent && d.opponent.toLowerCase().includes(searchTerm.toLowerCase()))) &&
            (selectedLocation === '' || d.location.toLowerCase().includes(selectedLocation.toLowerCase())) &&
            (selectedType === '' || d.decisionType === selectedType)
        );
    }, [decisions, searchTerm, selectedLocation, selectedType]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.processNumber || !formData.decisionType || !formData.location) return;

        const newDecision = {
            id: editingId || Date.now().toString(),
            processNumber: formData.processNumber,
            judgmentDate: formData.judgmentDate || new Date().toISOString().split('T')[0],
            location: formData.location,
            opponent: formData.opponent,
            decisionType: formData.decisionType as any,
            fundamentals: formData.fundamentals || ''
        };

        if (editingId) {
            updateDecision(newDecision);
        } else {
            addDecision(newDecision);
        }

        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ location: '', opponent: '', decisionType: 'procedente', fundamentals: '' });
        setNewLocationName('');
    };

    const handleSaveNewLocation = async () => {
        if (!newLocationName.trim()) return;
        setIsSavingLocation(true);
        try {
            await addCourtLocation(newLocationName.trim());
            setFormData({ ...formData, location: newLocationName.trim() });
            setNewLocationName('');
        } catch (err) {
            alert('Erro ao salvar local. Certifique-se de que a tabela foi criada no banco de dados.');
        } finally {
            setIsSavingLocation(false);
        }
    };

    const handleEdit = (decision: Decision) => {
        setFormData({
            processNumber: decision.processNumber,
            judgmentDate: decision.judgmentDate,
            location: decision.location,
            opponent: decision.opponent,
            decisionType: decision.decisionType,
            fundamentals: decision.fundamentals
        });
        setEditingId(decision.id);
        setIsModalOpen(true);
    };

    const uniqueLocations = Array.from(new Set([
        ...decisions.map(d => d.location),
        ...courtLocations.map(l => l.name)
    ])).sort((a, b) => a.localeCompare(b));

    return (
        <div className="flex flex-col h-full overflow-hidden relative">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

            {/* Header */}
            <header className="flex-shrink-0 px-8 py-6 z-10 flex flex-wrap items-end justify-between gap-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold tracking-tight text-white font-display">Banco de Sentenças</h2>
                    <p className="text-slate-400 text-sm font-light tracking-wide flex items-center gap-2">
                        Acompanhe o entendimento dos magistrados e tribunais.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ location: '', opponent: '', decisionType: 'procedente', fundamentals: '' });
                        setIsModalOpen(true);
                    }}
                    className="bg-primary text-black px-6 py-2.5 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add_gavel</span> Nova Sentença
                </button>
            </header>

            {/* Filters */}
            <div className="px-8 pb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                    <input
                        type="text"
                        placeholder="Buscar por nº processo ou fundamentos..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-primary/20 bg-white/5 text-white"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={selectedLocation}
                    onChange={e => setSelectedLocation(e.target.value)}
                >
                    <option value="" className="bg-black">Todas as Câmaras/Locais</option>
                    {uniqueLocations.map(loc => <option key={loc} value={loc} className="bg-black">{loc}</option>)}
                </select>
                <select
                    className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                >
                    <option value="" className="bg-black">Todos os Tipos</option>
                    <option value="procedente" className="bg-black">Procedente</option>
                    <option value="improcedente" className="bg-black">Improcedente</option>
                    <option value="provido" className="bg-black">Provido</option>
                    <option value="desprovido" className="bg-black">Desprovido</option>
                    <option value="parcialmente provido" className="bg-black">Parcialmente Provido</option>
                    <option value="parcialmente procedente" className="bg-black">Parcialmente Procedente</option>
                    <option value="nao reconhecido" className="bg-black">Não Reconhecido</option>
                    <option value="outro" className="bg-black">Outro</option>
                </select>

                <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                    <button
                        onClick={() => toggleViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-black shadow-neon-sm' : 'text-slate-500 hover:text-white'}`}
                        title="Visualização em Grade"
                    >
                        <span className="material-symbols-outlined text-[20px] font-bold">grid_view</span>
                    </button>
                    <button
                        onClick={() => toggleViewMode('list')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-black shadow-neon-sm' : 'text-slate-500 hover:text-white'}`}
                        title="Visualização em Lista"
                    >
                        <span className="material-symbols-outlined text-[20px] font-bold">view_list</span>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide">
                {filteredDecisions.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDecisions.map(decision => (
                                <div key={decision.id} className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg hover:border-primary/30 transition-all group flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                                                    <span className="material-symbols-outlined text-primary text-lg font-bold">gavel</span>
                                                </div>
                                                <h3 className="font-bold text-white text-base font-mono truncate">{decision.processNumber}</h3>
                                            </div>
                                            <p className="text-slate-400 text-xs flex items-center gap-1.5 px-0.5">
                                                <span className="material-symbols-outlined text-sm text-slate-500">location_on</span>
                                                <span className="truncate">{decision.location}</span>
                                            </p>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter whitespace-nowrap
                                            ${decision.decisionType.includes('improcedente') || decision.decisionType.includes('desprovido') ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                decision.decisionType.includes('parcialmente') ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                            }
                                        `}>
                                            {decision.decisionType}
                                        </div>
                                    </div>

                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 mb-4 flex-1">
                                        <p className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-[8] leading-relaxed">
                                            {decision.fundamentals}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Julgado em</span>
                                            <span className="text-xs text-white font-bold">{new Date(decision.judgmentDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEdit(decision)}
                                                className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all"
                                                title="Editar"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                            <button
                                                onClick={() => deleteDecision(decision.id)}
                                                className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                title="Excluir"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Processo</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Local / Câmara</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredDecisions.map(decision => (
                                        <tr key={decision.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-primary text-sm font-bold">gavel</span>
                                                    <span className="font-mono text-sm text-white font-bold">{decision.processNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-300">{decision.location}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter
                                                    ${decision.decisionType.includes('improcedente') || decision.decisionType.includes('desprovido') ? 'text-red-400 bg-red-400/5' :
                                                        decision.decisionType.includes('parcialmente') ? 'text-amber-400 bg-amber-400/5' : 'text-emerald-400 bg-emerald-400/5'
                                                    }
                                                `}>
                                                    {decision.decisionType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-400">{new Date(decision.judgmentDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(decision)}
                                                        className="size-8 rounded-lg text-primary hover:bg-primary/10 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-sm font-bold">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteDecision(decision.id)}
                                                        className="size-8 rounded-lg text-red-500 hover:bg-red-500/10 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined text-sm font-bold">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <span className="material-symbols-outlined text-4xl mb-2">find_in_page</span>
                        <p>Nenhuma decisão encontrada com os filtros atuais.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-black/90 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 animate-[fadeIn_0.2s_ease-out]">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display">
                                <span className="material-symbols-outlined text-primary">{editingId ? 'edit' : 'add_circle'}</span> {editingId ? 'Editar Sentença' : 'Nova Sentença'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Número do Processo</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={formData.processNumber || ''}
                                        onChange={e => setFormData({ ...formData, processNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Data do Julgamento</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-primary/20 outline-none [color-scheme:dark]"
                                        value={formData.judgmentDate || ''}
                                        onChange={e => setFormData({ ...formData, judgmentDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Local de Trâmite</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsManageLocationsOpen(true)}
                                            className="text-[10px] font-bold text-primary hover:text-primary-dark uppercase tracking-widest flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-xs">settings</span> Gerenciar
                                        </button>
                                    </div>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={formData.location === 'outro' ? 'outro' : (uniqueLocations.includes(formData.location || '') ? formData.location : (formData.location ? 'outro' : ''))}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === 'outro') {
                                                setNewLocationName('');
                                            }
                                            setFormData({ ...formData, location: val });
                                        }}
                                    >
                                        <option value="" className="bg-black">Selecione...</option>
                                        {uniqueLocations.map(loc => (
                                            <option key={loc} value={loc} className="bg-black">{loc}</option>
                                        ))}
                                        <option value="outro" className="bg-black font-bold text-primary">+ Adicionar Novo Local...</option>
                                    </select>
                                    {formData.location === 'outro' && (
                                        <div className="mt-3 p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3 animate-[fadeIn_0.2s_ease-out]">
                                            <div>
                                                <label className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5 block">Nome do Novo Local</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Ex: 4ª Vara Cível de Porto Alegre"
                                                    className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-primary transition-all"
                                                    value={newLocationName}
                                                    onChange={e => setNewLocationName(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleSaveNewLocation}
                                                disabled={isSavingLocation || !newLocationName.trim()}
                                                className="w-full py-2.5 rounded-xl bg-primary text-black font-bold text-xs uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-neon-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSavingLocation ? (
                                                    <div className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <span className="material-symbols-outlined text-base">save</span>
                                                )}
                                                Salvar e Usar Local
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Tipo de Decisão</label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={formData.decisionType}
                                        onChange={e => setFormData({ ...formData, decisionType: e.target.value as any })}
                                    >
                                        <option value="procedente" className="bg-black">Procedente</option>
                                        <option value="improcedente" className="bg-black">Improcedente</option>
                                        <option value="provido" className="bg-black">Provido</option>
                                        <option value="desprovido" className="bg-black">Desprovido</option>
                                        <option value="parcialmente provido" className="bg-black">Parcialmente Provido</option>
                                        <option value="parcialmente procedente" className="bg-black">Parcialmente Procedente</option>
                                        <option value="nao reconhecido" className="bg-black">Não Reconhecido</option>
                                        <option value="outro" className="bg-black">Outro</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Parte Contrária</label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={formData.opponent || ''}
                                        onChange={e => setFormData({ ...formData, opponent: e.target.value })}
                                    >
                                        <option value="" className="bg-black">Selecione...</option>
                                        <option value="SUS" className="bg-black">SUS</option>
                                        <option value="Plano de saúde" className="bg-black">Plano de saúde</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Fundamentos da Decisão</label>
                                <textarea
                                    required
                                    rows={5}
                                    placeholder="Descreva os principais pontos da decisão, teses aceitas ou rejeitadas..."
                                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                    value={formData.fundamentals || ''}
                                    onChange={e => setFormData({ ...formData, fundamentals: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingId(null);
                                        setFormData({ location: '', opponent: '', decisionType: 'procedente', fundamentals: '' });
                                    }}
                                    className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 rounded-xl font-bold bg-primary text-black hover:bg-primary-dark transition-all shadow-lg hover:scale-105 active:scale-95"
                                >
                                    Salvar Sentença
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal de Gerenciamento de Locais (CRUD) */}
            {isManageLocationsOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">location_on</span> Gerenciar Locais
                            </h3>
                            <button onClick={() => setIsManageLocationsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                            {courtLocations.length === 0 && (
                                <p className="text-center text-slate-500 py-8 text-sm italic">Nenhum local cadastrado.</p>
                            )}

                            {courtLocations.map(loc => (
                                <div key={loc.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group hover:border-primary/30 transition-all">
                                    {locationBeingEdited === loc.id ? (
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                autoFocus
                                                className="flex-1 bg-black/40 border border-primary/50 rounded-xl px-3 py-1.5 text-sm text-white outline-none"
                                                value={tempLocationName}
                                                onChange={e => setTempLocationName(e.target.value)}
                                            />
                                            <button
                                                onClick={async () => {
                                                    await updateCourtLocation(loc.id, tempLocationName);
                                                    setLocationBeingEdited(null);
                                                }}
                                                className="p-1.5 bg-primary text-black rounded-lg hover:bg-primary-dark transition-all"
                                            >
                                                <span className="material-symbols-outlined text-sm font-bold">check</span>
                                            </button>
                                            <button
                                                onClick={() => setLocationBeingEdited(null)}
                                                className="p-1.5 bg-white/10 text-slate-400 rounded-lg hover:bg-white/20 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="flex-1 text-sm text-slate-300 font-medium">{loc.name}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setLocationBeingEdited(loc.id);
                                                        setTempLocationName(loc.name);
                                                    }}
                                                    className="size-8 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-all flex items-center justify-center"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(`Excluir local "${loc.name}"?`)) {
                                                            await deleteCourtLocation(loc.id);
                                                        }
                                                    }}
                                                    className="size-8 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-white/5 border-t border-white/10">
                            <button
                                onClick={() => setIsManageLocationsOpen(false)}
                                className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all"
                            >
                                Fechar Gerenciamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Decisions;
