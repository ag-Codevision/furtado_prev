import React from 'react';

const PrevIA: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 relative overflow-hidden h-full bg-black">
            {/* Background Animated Blobs specific to IA */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] animate-bounce-slow"></div>

            <div className="max-w-2xl w-full glass-panel rounded-[40px] p-6 lg:p-10 border border-white/5 shadow-2xl relative z-10 flex flex-col items-center text-center gap-5 backdrop-blur-xl bg-white/[0.03]">

                {/* Animated Icon Container */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                    <div className="size-20 lg:size-24 rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 flex items-center justify-center shadow-neon-sm animate-[float_4s_easeInOut_infinite] relative overflow-hidden group-hover:border-primary/50 transition-colors">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(212,175,55,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]"></div>
                        <span className="material-symbols-outlined text-primary text-[40px] lg:text-[48px] filled drop-shadow-glow">psychology</span>
                    </div>

                    {/* Orbits */}
                    <div className="absolute -top-4 -right-4 size-6 rounded-full bg-primary border-4 border-black shadow-neon-sm animate-bounce delay-100"></div>
                    <div className="absolute -bottom-2 -left-6 size-4 rounded-full bg-white/10 border-4 border-black shadow-lg animate-bounce delay-300"></div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="inline-flex items-center gap-2 self-center px-3 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black tracking-widest uppercase border border-primary/20 shadow-neon-sm">
                        Próximo Lançamento
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white font-display leading-tight uppercase italic">
                        Prev.<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] drop-shadow-glow-sm">IA</span>
                    </h1>
                    <p className="text-xs lg:text-sm text-slate-500 font-bold max-w-md mx-auto leading-relaxed uppercase tracking-wider">
                        Estamos treinando nosso modelo de IA para revolucionar a análise de processos previdenciários.
                    </p>
                </div>

                {/* Feature Preview Grid */}
                <div className="grid grid-cols-2 gap-3 w-full mt-2">
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-2 transition-all hover:bg-white/[0.08] hover:border-primary/30 group/f">
                        <span className="material-symbols-outlined text-primary text-xl drop-shadow-glow-sm">description_search</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/f:text-white transition-colors">Jurisprudência</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-2 transition-all hover:bg-white/[0.08] hover:border-primary/30 group/f">
                        <span className="material-symbols-outlined text-primary text-xl drop-shadow-glow-sm">auto_awesome</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/f:text-white transition-colors">Resumo</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-2 transition-all hover:bg-white/[0.08] hover:border-primary/30 group/f">
                        <span className="material-symbols-outlined text-primary text-xl drop-shadow-glow-sm">query_stats</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/f:text-white transition-colors">Projeção</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-2 transition-all hover:bg-white/[0.08] hover:border-primary/30 group/f">
                        <span className="material-symbols-outlined text-primary text-xl drop-shadow-glow-sm">drafts</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/f:text-white transition-colors">Petições</span>
                    </div>
                </div>

                <div className="mt-2 flex flex-col gap-4 w-full">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                        <div className="h-full bg-gradient-to-r from-primary via-white to-primary rounded-full shadow-neon-sm" style={{ width: '75%' }}></div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
                        <span>Desenvolvimento Alpha</span>
                        <span className="text-primary drop-shadow-glow-sm">75%</span>
                    </div>

                    <button className="w-full py-4 rounded-xl bg-primary text-black font-black text-xs shadow-neon hover:bg-white hover:scale-[1.02] transition-all flex items-center justify-center gap-3 active:scale-95 group uppercase tracking-[0.2em]">
                        Quero testar a versão Beta
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-2 transition-transform">bolt</span>
                    </button>
                </div>
            </div>

            {/* Decorative Floating Elements */}
            <div className="absolute bottom-20 left-20 text-[160px] font-black text-white/[0.02] font-display select-none -rotate-12 pointer-events-none uppercase italic tracking-tighter">NEURAL</div>
            <div className="absolute top-40 right-10 text-[100px] font-black text-white/[0.02] font-display select-none rotate-90 pointer-events-none uppercase italic tracking-tighter">FUTURO</div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-bounce-slow {
          animation: bounce 6s infinite;
        }
      `}} />
        </div>
    );
};

export default PrevIA;
