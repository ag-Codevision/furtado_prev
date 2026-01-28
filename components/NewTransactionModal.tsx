import React, { useState } from 'react';

interface NewTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: any) => void;
}

const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ isOpen, onClose, onSave }) => {
    const [type, setType] = useState<'in' | 'out'>('in');
    const [title, setTitle] = useState('');
    const [value, setValue] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<'confirmado' | 'pendente'>('confirmado');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            title,
            type,
            category,
            date,
            value: value.replace(',', '.'),
            status
        });

        // Reset form
        setTitle('');
        setValue('');
        setCategory('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity" onClick={onClose}></div>

            <div className="relative w-full max-w-md bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden border border-white/10">
                <div className="p-8 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white font-display">Novo Lançamento</h2>
                    <button onClick={onClose} className="size-10 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6 bg-black/20">

                    {/* Type Toggle */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner">
                        <button
                            type="button"
                            onClick={() => setType('in')}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${type === 'in' ? 'bg-primary text-black shadow-neon' : 'text-slate-500 hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-lg font-bold">keyboard_double_arrow_down</span> Receita
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('out')}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${type === 'out' ? 'bg-rose-500 text-white shadow-neon shadow-rose-500/20' : 'text-slate-500 hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-lg font-bold">keyboard_double_arrow_up</span> Despesa
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Descrição</label>
                        <input
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-primary/50 transition-all outline-none text-sm text-white placeholder:text-slate-700"
                            placeholder="Ex: Aluguel da Sala ou Honorários"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Valor (R$)</label>
                            <input
                                required
                                type="text"
                                value={value}
                                onChange={e => setValue(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-primary/50 transition-all outline-none text-sm text-white font-mono placeholder:text-slate-700"
                                placeholder="0,00"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Data</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-primary/50 transition-all outline-none text-sm text-white appearance-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Categoria</label>
                            <select
                                required
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-primary/50 transition-all outline-none text-sm text-white appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-zinc-900">Selecione...</option>
                                {type === 'in' ? (
                                    <>
                                        <option value="Honorários Contratuais" className="bg-zinc-900">Honorários Contratuais</option>
                                        <option value="Sucumbência" className="bg-zinc-900">Sucumbência</option>
                                        <option value="Consultoria" className="bg-zinc-900">Consultoria</option>
                                        <option value="Outros" className="bg-zinc-900">Outros</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Despesas Fixas" className="bg-zinc-900">Despesas Fixas</option>
                                        <option value="Pessoal" className="bg-zinc-900">Pessoal & Sócios</option>
                                        <option value="Marketing" className="bg-zinc-900">Marketing</option>
                                        <option value="Software & TI" className="bg-zinc-900">Software & TI</option>
                                        <option value="Custas" className="bg-zinc-900">Custas Processuais</option>
                                        <option value="Impostos" className="bg-zinc-900">Impostos</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Status</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value as any)}
                                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-primary/50 transition-all outline-none text-sm text-white appearance-none cursor-pointer"
                            >
                                <option value="confirmado" className="bg-zinc-900">Confirmado (Pago)</option>
                                <option value="pendente" className="bg-zinc-900">Pendente</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="mt-4 w-full h-14 bg-primary hover:bg-primary-dark text-black font-black text-xs rounded-2xl transition-all shadow-neon hover:scale-[1.02] flex items-center justify-center gap-2 uppercase tracking-widest">
                        <span className="material-symbols-outlined font-bold">check</span>
                        Salvar Lançamento
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewTransactionModal;