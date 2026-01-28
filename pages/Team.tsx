import React, { useState, useRef } from 'react';
import { TeamMember } from '../types';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';

const Team: React.FC = () => {
    const { teamMembers: members, addMember, updateMember, deleteMember: removeMember } = useData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const departments: TeamMember['department'][] = ['Jurídico', 'RH', 'Financeiro', 'Marketing', 'Administrativo', 'Outro'];

    const openModal = (member?: TeamMember) => {
        if (member) {
            setEditingMember(member);
        } else {
            setEditingMember({
                id: '', // Empty ID for new members
                name: '',
                role: '',
                department: 'Jurídico',
                email: '',
                phone: '',
                avatar: '',
                status: 'Ativo',
                admissionDate: new Date().toISOString().split('T')[0],
                bio: ''
            });
        }
        setIsModalOpen(true);
    };

    const saveMember = () => {
        if (!editingMember) return;
        if (editingMember.id && members.find(m => m.id === editingMember.id)) {
            updateMember(editingMember);
        } else {
            addMember(editingMember);
        }
        setIsModalOpen(false);
        setEditingMember(null);
    };

    const deleteMember = (id: string) => {
        if (window.confirm('Deseja remover este membro da equipe?')) {
            removeMember(id);
        }
    };

    const uploadPhoto = async (file: File) => {
        if (!editingMember) return;

        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `team/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('profiles') // Reusing profiles bucket
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('profiles')
                .getPublicUrl(filePath);

            setEditingMember({ ...editingMember, avatar: publicUrl });
        } catch (err) {
            console.error('Upload error:', err);
            alert('Erro ao subir foto. Verifique o bucket "profiles".');
        } finally {
            setIsUploading(false);
        }
    };

    const handlePhotoDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadPhoto(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadPhoto(file);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-black overflow-hidden relative">
            <header className="sticky top-0 z-40 px-6 py-4 lg:px-10 flex items-center justify-between backdrop-blur-md bg-black/80 border-b border-white/10 shadow-sm">
                <div className="flex flex-col">
                    <h2 className="text-white text-xl lg:text-2xl font-bold tracking-tight font-display">Gestão de Equipe</h2>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium italic">
                        <span className="material-symbols-outlined text-[14px]">info</span> Multidisciplinaridade PREV.IA
                    </p>
                </div>

                <div className="hidden md:flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 ml-4">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-primary text-black shadow-neon' : 'text-slate-500 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">grid_view</span>
                        Grade
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-primary text-black shadow-neon' : 'text-slate-500 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                        Lista
                    </button>
                </div>

                <button
                    onClick={() => openModal()}
                    className="px-6 py-3 rounded-full bg-primary hover:scale-105 text-black shadow-neon transition-all text-sm font-bold flex items-center gap-2 group ml-auto"
                >
                    <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform font-bold">person_add</span>
                    Adicionar Membro
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {members.map(member => (
                            <div key={member.id} className="group bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center text-center relative hover:shadow-neon-sm shadow-primary/5 hover:border-primary/50 hover:translate-y-[-4px] transition-all duration-300">
                                {/* Dept Tag */}
                                <span className={`absolute top-4 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border ${member.department === 'Jurídico' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    member.department === 'Marketing' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                        member.department === 'Financeiro' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-white/5 text-slate-400 border-white/10'
                                    }`}>
                                    {member.department}
                                </span>

                                {/* Avatar */}
                                <div className="relative mb-4">
                                    <div className="size-24 rounded-3xl bg-cover bg-center border-4 border-black shadow-2xl ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-500 overflow-hidden flex items-center justify-center" style={member.avatar ? { backgroundImage: `url(${member.avatar})` } : { backgroundColor: '#cbd5e1' }}>
                                        {!member.avatar && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full p-2">
                                                <path fill="white" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className={`absolute bottom-1 right-1 size-5 rounded-full border-2 border-black shadow-sm ${member.status === 'Ativo' ? 'bg-emerald-500 shadow-glow shadow-emerald-500/50' : 'bg-slate-500'}`}></div>
                                </div>

                                <h3 className="text-lg font-bold text-white leading-tight mb-1">{member.name}</h3>
                                <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">{member.role}</p>

                                <p className="text-[11px] text-slate-500 line-clamp-3 mb-6 leading-relaxed px-2 italic">
                                    "{member.bio || 'Sem descrição cadastrada...'}"
                                </p>

                                <div className="w-full h-px bg-white/10 mb-6"></div>

                                <div className="w-full space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                        <span className="material-symbols-outlined text-[16px] text-primary font-bold">mail</span>
                                        {member.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                        <span className="material-symbols-outlined text-[16px] text-primary font-bold">call</span>
                                        {member.phone}
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-2 w-full pt-4 border-t border-white/5">
                                    <button onClick={() => openModal(member)} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-primary border border-white/10 hover:border-primary/50 transition-all font-bold text-xs flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-[16px]">edit</span> Editar
                                    </button>
                                    <button onClick={() => deleteMember(member.id)} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 transition-all border border-white/10 hover:border-rose-500/20">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add Member Card */}
                        <button
                            onClick={() => openModal()}
                            className="h-full min-h-[400px] border-2 border-dashed border-white/10 rounded-[2rem] bg-white/5 flex flex-col items-center justify-center gap-4 text-slate-500 hover:border-primary/40 hover:bg-primary/5 transition-all group shadow-inner"
                        >
                            <div className="size-14 rounded-2xl bg-black border border-white/10 shadow-glow shadow-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:text-primary">
                                <span className="material-symbols-outlined text-3xl font-bold">add</span>
                            </div>
                            <span className="font-bold text-xs uppercase tracking-widest">Contratar Novo Talento</span>
                        </button>
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Membro</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Departamento</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cargo</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contato</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {members.map(member => (
                                    <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-cover bg-center border border-white/10 shadow-sm overflow-hidden flex items-center justify-center" style={member.avatar ? { backgroundImage: `url(${member.avatar})` } : { backgroundColor: '#cbd5e1' }}>
                                                    {!member.avatar && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full p-1">
                                                            <path fill="white" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">{member.name}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-tight">{member.status}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border ${member.department === 'Jurídico' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                member.department === 'Marketing' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                                    member.department === 'Financeiro' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-white/5 text-slate-400 border-white/10'
                                                }`}>
                                                {member.department}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-300">{member.role}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px] text-primary">mail</span> {member.email}
                                                </div>
                                                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px] text-primary">call</span> {member.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openModal(member)} className="size-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-primary transition-all flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button onClick={() => deleteMember(member.id)} className="size-9 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 transition-all flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- MODAL DE CADASTRO --- */}
            {isModalOpen && editingMember && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-black w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/10">

                        {/* Modal Header */}
                        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-black shadow-neon">
                                    <span className="material-symbols-outlined font-bold">person_add</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white line-clamp-1">{editingMember.name || 'Novo Integrante'}</h3>
                                    <p className="text-xs text-slate-500">Preencha os dados do colaborador multidisciplinar</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="size-10 rounded-full hover:bg-white/10 text-slate-500 transition-all flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* Coluna da Foto (Dropzone) */}
                            <div className="lg:col-span-4 flex flex-col gap-4">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Foto de Perfil</label>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handlePhotoDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer overflow-hidden relative group ${isDragging ? 'border-primary bg-primary/5 shadow-neon' : 'border-white/10 bg-white/5'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="size-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Enviando...</span>
                                        </div>
                                    ) : editingMember.avatar ? (
                                        <>
                                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${editingMember.avatar})` }}></div>
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                                <span className="material-symbols-outlined scale-125 mb-2">upload</span>
                                                <span className="text-[10px] font-bold tracking-widest">TROCAR FOTO</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="size-12 rounded-full bg-white/10 flex items-center justify-center text-slate-500">
                                                <span className="material-symbols-outlined">photo_camera</span>
                                            </div>
                                            <div className="text-center px-4">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Clique ou Arraste</p>
                                                <p className="text-[9px] text-slate-600 mt-1">PNG, JPG até 5MB</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1.5 pt-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Bios / Resumo</label>
                                    <textarea
                                        value={editingMember.bio}
                                        onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                                        placeholder="Pequena descrição profissional..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-white outline-none resize-none placeholder:text-slate-700"
                                    />
                                </div>
                            </div>

                            {/* Coluna de Dados */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5 md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                                        <input
                                            value={editingMember.name}
                                            onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-white outline-none font-bold placeholder:text-slate-700"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Setor / Departamento</label>
                                        <select
                                            value={editingMember.department}
                                            onChange={(e) => setEditingMember({ ...editingMember, department: e.target.value as any })}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-white outline-none font-bold appearance-none cursor-pointer"
                                        >
                                            {departments.map(dept => <option key={dept} value={dept} className="bg-black text-white">{dept}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cargo / Função</label>
                                        <input
                                            value={editingMember.role}
                                            onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                                            placeholder="Ex: Advogado Associado"
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-white outline-none font-bold placeholder:text-slate-700"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail Profissional</label>
                                        <input
                                            value={editingMember.email}
                                            onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                                            type="email"
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-white outline-none placeholder:text-slate-700"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                                        <input
                                            value={editingMember.phone}
                                            onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-white outline-none placeholder:text-slate-700"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">OAB (Se advogado)</label>
                                        <input
                                            value={editingMember.oab || ''}
                                            onChange={(e) => setEditingMember({ ...editingMember, oab: e.target.value })}
                                            placeholder="Ex: PR 000.000"
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-white outline-none font-mono placeholder:text-slate-700"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data de Admissão</label>
                                        <input
                                            type="date"
                                            value={editingMember.admissionDate}
                                            onChange={(e) => setEditingMember({ ...editingMember, admissionDate: e.target.value })}
                                            className="w-full px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm text-white outline-none font-bold appearance-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/10 flex gap-3">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-8 py-4 rounded-2xl bg-white/5 text-slate-500 font-bold text-sm hover:bg-white/10 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={saveMember}
                                        className="flex-1 px-8 py-4 rounded-2xl bg-primary text-black font-bold text-sm shadow-neon hover:scale-[1.02] transition-all active:scale-95 uppercase tracking-widest"
                                    >
                                        Salvar Colaborador
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
