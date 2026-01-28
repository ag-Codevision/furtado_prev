import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface UserProfile {
    id: string;
    full_name: string;
    role: string;
    status: string;
    avatar_url?: string;
    office_name?: string;
    updated_at?: string;
}

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [currentAdmin, setCurrentAdmin] = useState<UserProfile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                navigate('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (!profile || profile.role !== 'admin') {
                navigate('/dashboard');
                return;
            }

            setCurrentAdmin(profile);
            await fetchAllProfiles();
        } catch (error) {
            console.error('Error checking admin access:', error);
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllProfiles = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });

        if (!error && data) {
            setProfiles(data);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            setUpdatingId(userId);
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole, updated_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) throw error;

            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Erro ao atualizar cargo.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
        try {
            setUpdatingId(userId);
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) throw error;

            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, status: newStatus } : p));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            setUpdatingId(userId);
            // In a real app, we might need to delete from auth.users too, but for now we just delete the profile
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            setProfiles(prev => prev.filter(p => p.id !== userId));
            setShowDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting profile:', error);
            alert('Erro ao excluir usuário. Verifique se existem dependências.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        try {
            setUpdatingId(editingUser.id);
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editingUser.full_name,
                    office_name: editingUser.office_name,
                    role: editingUser.role,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            setProfiles(prev => prev.map(p => p.id === editingUser.id ? editingUser : p));
            setIsEditModalOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Erro ao salvar alterações.');
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#0A0A0A]">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#0A0A0A] p-6 lg:p-10">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white font-display flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-4xl">admin_panel_settings</span>
                            Painel Administrativo
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm uppercase tracking-widest font-bold">Gestão Estratégica de Usuários</p>
                    </div>

                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">search</span>
                        <input
                            type="text"
                            placeholder="Buscar usuários ou cargos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-80 h-12 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:border-primary/50 focus:bg-white/10 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Stats Summary (Optional/Premium) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="glass-panel p-6 border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Total de Usuários</span>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-white">{profiles.length}</span>
                            <span className="text-emerald-500 text-xs font-bold mb-1.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">trending_up</span>
                                Ativos
                            </span>
                        </div>
                    </div>
                    <div className="glass-panel p-6 border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Administradores</span>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-primary">{profiles.filter(p => p.role === 'admin').length}</span>
                            <span className="text-slate-500 text-xs font-bold mb-1.5 uppercase">Controle Total</span>
                        </div>
                    </div>
                    <div className="glass-panel p-6 border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Doutores / Equipe</span>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-white">{profiles.filter(p => p.role !== 'admin').length}</span>
                            <span className="text-slate-500 text-xs font-bold mb-1.5 uppercase">Operacional</span>
                        </div>
                    </div>
                </div>

                {/* User List Table */}
                <div className="glass-panel border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo Atual</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredProfiles.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-slate-500">person</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{user.full_name || 'Usuário sem Nome'}</span>
                                                    <span className="text-xs text-slate-500">{user.office_name || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${user.role === 'admin' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
                                                user.role === 'intermediario' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                                    'bg-slate-500/10 border-slate-500/20 text-slate-400'
                                                }`}>
                                                {user.role === 'admin' ? 'Administrador' : user.role === 'intermediario' ? 'Doutor(a)' : 'Colaborador'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center">
                                                <button
                                                    onClick={() => handleToggleStatus(user.id, user.status || 'Ativo')}
                                                    disabled={updatingId === user.id}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${(user.status || 'Ativo') === 'Ativo'
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                                                        : 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20'
                                                        }`}
                                                >
                                                    <div className={`size-2 rounded-full ${(user.status || 'Ativo') === 'Ativo' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">{user.status || 'Ativo'}</span>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        setEditingUser({ ...user });
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="size-9 rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:bg-primary hover:text-black transition-all flex items-center justify-center hover:scale-110 active:scale-95 group/btn"
                                                    title="Editar Usuário"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(user.id)}
                                                    className="size-9 rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center hover:scale-110 active:scale-95 group/btn"
                                                    title="Excluir Usuário"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredProfiles.length === 0 && (
                        <div className="p-20 text-center">
                            <span className="material-symbols-outlined text-slate-700 text-6xl mb-4">search_off</span>
                            <p className="text-slate-500 font-bold">Nenhum usuário encontrado para "{searchQuery}"</p>
                        </div>
                    )}
                </div>
                {/* Edit Modal */}
                {isEditModalOpen && editingUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
                        <div className="w-full max-w-md bg-[#0F0F0F] rounded-3xl border border-white/10 shadow-2xl p-8 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-white font-display">Editar Usuário</h2>
                                <button onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }} className="text-slate-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={editingUser.full_name}
                                        onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary/50 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Escritório / Cargo Externo</label>
                                    <input
                                        type="text"
                                        value={editingUser.office_name || ''}
                                        onChange={(e) => setEditingUser({ ...editingUser, office_name: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary/50 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Cargo no Sistema</label>
                                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                                        {['admin', 'intermediario', 'comum'].map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => setEditingUser({ ...editingUser, role: r })}
                                                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${editingUser.role === r
                                                    ? 'bg-primary text-black'
                                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {r === 'admin' ? 'Admin' : r === 'intermediario' ? 'Doutor' : 'Colab'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }}
                                        className="flex-1 h-12 rounded-xl border border-white/5 text-slate-400 font-bold hover:bg-white/5 transition-all text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="flex-1 h-12 rounded-xl bg-primary text-black font-bold hover:bg-yellow-600 transition-all shadow-glow shadow-primary/20 text-sm"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
                        <div className="w-full max-w-sm bg-[#0F0F0F] rounded-3xl border border-rose-500/20 shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
                            <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-rose-500 text-3xl">delete_forever</span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2 font-display">Excluir Usuário?</h2>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">Esta ação é irreversível e removerá o perfil do colaborador permanentemente do sistema.</p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 h-12 rounded-xl border border-white/5 text-slate-400 font-bold hover:bg-white/5 transition-all text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(showDeleteConfirm)}
                                    className="flex-1 h-12 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all shadow-glow shadow-rose-500/20 text-sm"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
