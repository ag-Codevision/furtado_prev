import React from 'react';

const Documents: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 relative overflow-hidden h-full">
            {/* Background Subtle Document Patterns */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-[120px] -z-10 animate-pulse delay-700"></div>

            <div className="max-w-3xl w-full glass-panel rounded-[40px] p-10 lg:p-16 border border-white/10 shadow-2xl relative z-10 flex flex-col items-center text-center gap-8 backdrop-blur-xl bg-black/40">

                {/* Animated Document Stack */}
                <div className="relative group perspective-1000">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full"></div>

                    <div className="relative flex items-center justify-center">
                        {/* Background Paper 1 */}
                        <div className="absolute size-24 lg:size-32 bg-white/5 rounded-2xl shadow-lg border border-white/10 rotate-[-15deg] translate-x-[-10px] group-hover:rotate-[-25deg] group-hover:translate-x-[-30px] transition-all duration-500"></div>
                        {/* Background Paper 2 */}
                        <div className="absolute size-24 lg:size-32 bg-white/5 rounded-2xl shadow-lg border border-white/10 rotate-[10deg] translate-x-[15px] group-hover:rotate-[20deg] group-hover:translate-x-[40px] transition-all duration-500 delay-75"></div>

                        {/* Main Folder/Paper */}
                        <div className="size-28 lg:size-36 rounded-3xl bg-gradient-to-br from-primary to-yellow-700 flex items-center justify-center shadow-neon relative z-10 group-hover:scale-110 transition-transform duration-500">
                            <span className="material-symbols-outlined text-white text-[56px] lg:text-[72px] filled">folder_open</span>

                            {/* Floating Badge */}
                            <div className="absolute -top-3 -right-3 size-10 rounded-full bg-emerald-500 border-4 border-black flex items-center justify-center shadow-lg animate-bounce">
                                <span className="material-symbols-outlined text-white text-sm">cloud_upload</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="inline-flex items-center gap-2 self-center px-4 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-[0.2em] uppercase border border-primary/20 shadow-sm">
                        Expansão de Módulo
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white font-display leading-tight">
                        Central de <span className="text-primary">Documentos & CNIS</span>
                    </h1>
                    <p className="text-md lg:text-lg text-slate-400 font-light max-w-xl mx-auto leading-relaxed">
                        Estamos construindo uma plataforma integrada para gestão documental com OCR inteligente e análise automática de extratos do CNIS.
                    </p>
                </div>

                {/* Feature List (Compact) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
                    <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-xl transition-all duration-300 group">
                        <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">data_object</span>
                        </div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Leitor de CNIS</h3>
                    </div>

                    <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-xl transition-all duration-300 group">
                        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">description</span>
                        </div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Gestão de Peças</h3>
                    </div>

                    <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-xl transition-all duration-300 group">
                        <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">folder_shared</span>
                        </div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Docs de Clientes</h3>
                    </div>
                </div>

                {/* Status Section */}
                <div className="w-full mt-6 space-y-4">
                    <div className="flex justify-between items-end px-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estágio de Desenvolvimento</span>
                        <span className="text-sm font-bold text-white">Finalizando Mockups</span>
                    </div>

                    <div className="h-3 w-full bg-white/5 rounded-full border border-white/10 p-0.5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 via-primary to-yellow-600 rounded-full animate-[progressDocuments_4s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
                    </div>

                    <button className="w-full py-4 rounded-2xl bg-primary text-black font-bold text-sm shadow-xl hover:bg-primary-dark hover:shadow-2xl transition-all flex items-center justify-center gap-2 group mt-4">
                        Ficar por dentro das novidades
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">notifications</span>
                    </button>
                </div>
            </div>

            {/* Decorative Text */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -rotate-90 text-[100px] font-black text-white/[0.03] pointer-events-none select-none tracking-tighter uppercase">Data Room</div>
            <div className="absolute top-0 right-20 text-[60px] font-black text-white/[0.03] pointer-events-none select-none tracking-tighter uppercase">Cloud Storage</div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes progressDocuments {
          0% { width: 30%; transform: translateX(-5%); }
          50% { width: 60%; transform: translateX(2%); }
          100% { width: 30%; transform: translateX(-5%); }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}} />
        </div>
    );
};

export default Documents;
