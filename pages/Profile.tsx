import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const [profile, setProfile] = useState({
        full_name: '',
        role: '',
        bio: '',
        phone: '',
        office_name: '',
        avatar_url: '',
        cover_url: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) throw error;
            if (data) {
                setProfile({
                    full_name: data.full_name || '',
                    role: data.role || '',
                    bio: data.bio || '',
                    phone: data.phone || '',
                    office_name: data.office_name || '',
                    avatar_url: data.avatar_url || '',
                    cover_url: data.cover_url || ''
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setErrorMsg('Erro ao carregar perfil.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setSuccessMsg('');
            setErrorMsg('');

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    bio: profile.bio,
                    phone: profile.phone,
                    office_name: profile.office_name,
                    updated_at: new Date().toISOString()
                })
                .eq('id', session.user.id);

            if (error) throw error;

            setSuccessMsg('Perfil atualizado com sucesso!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setErrorMsg('Erro ao salvar alterações.');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setSaving(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${session.user.id}-${type}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to storage (Bucket 'profiles' must exist and be public)
            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profiles')
                .getPublicUrl(filePath);

            // Update Profile table
            const updateData = type === 'avatar' ? { avatar_url: publicUrl } : { cover_url: publicUrl };
            const { error: updateError } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', session.user.id);

            if (updateError) throw updateError;

            setProfile(prev => ({ ...prev, [type === 'avatar' ? 'avatar_url' : 'cover_url']: publicUrl }));
            setSuccessMsg(`${type === 'avatar' ? 'Avatar' : 'Capa'} atualizada!`);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err: any) {
            console.error('Upload error:', err);
            setErrorMsg(`Erro ao subir imagem: ${err.message || 'Verifique se o bucket "profiles" existe no Supabase Storage.'}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#0A0A0A]">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#0A0A0A] relative pb-20">
            {/* Cover Section */}
            <div className="h-64 lg:h-80 w-full relative overflow-hidden group">
                {profile.cover_url ? (
                    <img src={profile.cover_url} className="w-full h-full object-cover" alt="Cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-black via-zinc-900 to-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/5 text-9xl">landscape</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/20 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">add_a_photo</span>
                        Alterar Capa
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
                    </label>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 lg:px-10">
                {/* Avatar Section */}
                <div className="relative -mt-20 flex flex-col md:flex-row items-end gap-6 mb-12">
                    <div className="relative group shrink-0">
                        <div className="size-40 rounded-full border-4 border-[#0A0A0A] bg-zinc-800 shadow-2xl overflow-hidden relative">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary/40">
                                    <span className="material-symbols-outlined text-7xl">person</span>
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] uppercase font-bold tracking-widest gap-1">
                                <span className="material-symbols-outlined text-2xl">camera_alt</span>
                                Trocar Foto
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
                            </label>
                        </div>
                        <div className="absolute bottom-4 right-4 size-5 bg-emerald-500 border-[3px] border-[#0A0A0A] rounded-full"></div>
                    </div>

                    <div className="flex-1 pb-4">
                        <h1 className="text-3xl lg:text-4xl font-bold text-white font-display mb-1">{profile.full_name || 'Seu Nome'}</h1>
                        <p className="text-primary font-mono text-sm uppercase tracking-[0.2em] font-bold">
                            {profile.role === 'admin' ? 'Administrador' : profile.role === 'intermediario' ? 'Doutor(a)' : 'Colaborador'}
                        </p>
                    </div>

                    <div className="flex gap-4 pb-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-all text-sm font-bold flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Voltar
                        </button>
                        <button
                            disabled={saving}
                            onClick={handleSave}
                            className="px-8 py-2.5 rounded-xl bg-primary text-black hover:bg-yellow-600 transition-all text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                            ) : (
                                <span className="material-symbols-outlined text-lg">save</span>
                            )}
                            Salvar Alterações
                        </button>
                    </div>
                </div>

                {/* Success/Error Alerts */}
                {successMsg && (
                    <div className="mb-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 py-3 px-6 rounded-2xl flex items-center gap-3 animate-[slideInUp_0.3s_ease-out]">
                        <span className="material-symbols-outlined">check_circle</span>
                        {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className="mb-8 bg-red-500/10 border border-red-500/20 text-red-500 py-3 px-6 rounded-2xl flex items-center gap-3 animate-[slideInUp_0.3s_ease-out]">
                        <span className="material-symbols-outlined">warning</span>
                        {errorMsg}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/5 space-y-6">
                            <h2 className="text-xl font-bold text-white font-display">Informações Básicas</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={profile.full_name}
                                        onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="Ex: Dr. Marcio Silva"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Telefone / WhatsApp</label>
                                    <input
                                        type="text"
                                        value={profile.phone}
                                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Escritório / Empresa</label>
                                <input
                                    type="text"
                                    value={profile.office_name}
                                    onChange={(e) => setProfile(prev => ({ ...prev, office_name: e.target.value }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Ex: Furtado Advocacia"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Biografia / Resumo Profissional</label>
                                <textarea
                                    rows={4}
                                    value={profile.bio}
                                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none"
                                    placeholder="Conte um pouco sobre sua trajetória..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/5">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 font-display">
                                <span className="material-symbols-outlined text-primary text-lg">shield_person</span>
                                Nível de Acesso
                            </h3>
                            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Usuário desde:</span>
                                    <span className="text-xs font-bold text-white">Jan, 2026</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Status:</span>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-tighter">Ativo</span>
                                </div>
                                <div className="pt-2">
                                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: profile.role === 'admin' ? '100%' : '60%' }}></div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2">Sua conta possui permissões de {profile.role}.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20">
                            <span className="material-symbols-outlined text-primary text-3xl mb-3">lightbulb</span>
                            <h4 className="text-sm font-bold text-white mb-1">Dica Prev.IA</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Manter seu perfil atualizado com foto e biografia aumenta a confiança na colaboração entre a equipe.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
