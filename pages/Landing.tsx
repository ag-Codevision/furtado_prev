import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo-gold-lion.png';
import { supabase } from '../lib/supabase';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('login');

  // Auth Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check if session exists
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) navigate('/dashboard');
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (modalMode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          setSuccessMsg('Cadastro realizado com sucesso! Verifique seu e-mail ou faça login.');
          setModalMode('login');
          // Clear sensitive fields
          setPassword('');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error.message);
      if (error.message === 'Invalid login credentials') {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (error.message === 'User already registered') {
        setErrorMsg('Este e-mail já está cadastrado.');
      } else {
        setErrorMsg(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: 'psychology',
      title: 'Prev.IA',
      description: 'Inteligência Artificial para análise de jurisprudência e auxílio em petições.'
    },
    {
      icon: 'support_agent',
      title: 'CRM Inteligente',
      description: 'Gestão completa do fluxo de atendimento e relacionamento com o cliente.'
    },
    {
      icon: 'calculate',
      title: 'Cálculos RMI',
      description: 'Sistema avançado de cálculos previdenciários com precisão e agilidade.'
    },
    {
      icon: 'gavel',
      title: 'Sentenças',
      description: 'Monitoramento e extração inteligente de decisões judiciais.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-primary selection:text-black overflow-x-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-yellow-600/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-5s' }}></div>
        <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Furtado Prev Logo" className="w-12 h-12 object-contain filter drop-shadow-neon" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight font-display">Furtado <span className="text-primary text-xs align-top">PREV</span></h1>
            <p className="text-primary text-[10px] font-bold tracking-widest uppercase opacity-80">Direito Previdenciário</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => { setModalMode('login'); setIsModalOpen(true); }}
            className="bg-primary/10 border border-primary/20 text-primary px-6 py-2.5 rounded-full text-sm font-bold hover:bg-primary hover:text-black transition-all duration-300 shadow-soft"
          >
            Entrar
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 md:pt-32 md:pb-48 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 text-primary text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-10 animate-[fadeInDown_0.8s_ease-out] backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          A Revolução Digital no Direito
        </div>
        <h2 className="text-5xl md:text-8xl font-black font-display leading-[1.1] max-w-5xl tracking-tight mb-10 animate-[fadeIn_1s_ease-out] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
          Excelência e Inteligência em <span className="text-primary italic">Direito Previdenciário</span>
        </h2>
        <p className="text-slate-400 text-lg md:text-2xl max-w-3xl font-body leading-relaxed mb-14 animate-[fadeIn_1.2s_ease-out]">
          A plataforma definitiva para escritórios de elite que buscam alta performance,
          automação de precisão e gestão baseada em dados.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 animate-[slideInUp_1.2s_ease-out]">
          <button
            onClick={() => { setModalMode('register'); setIsModalOpen(true); }}
            className="group relative bg-primary hover:bg-primary-dark text-black px-12 py-6 rounded-full text-xl font-black transition-all duration-500 transform hover:scale-105 shadow-[0_0_30px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3"
          >
            <span>INICIAR TRANSFORMAÇÃO</span>
            <span className="material-symbols-outlined font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-12 py-6 rounded-full text-xl font-bold transition-all duration-500 backdrop-blur-sm">
            Explorar Soluções
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <span className="material-symbols-outlined text-3xl">expand_more</span>
        </div>
      </header>

      {/* Stats Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {[
            { label: 'Processos Geridos', value: '15k+' },
            { label: 'Eficiência Elevada', value: '45%' },
            { label: 'Acertos em Cálculos', value: '100%' },
            { label: 'Usuários Ativos', value: '2.5k' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center group">
              <span className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:text-primary transition-colors">{stat.value}</span>
              <span className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="text-center mb-20">
          <h3 className="text-3xl md:text-5xl font-bold font-display mb-6">Módulos Estratégicos</h3>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">Tecnologia proprietária desenvolvida especificamente para as complexidades do ecossistema previdenciário.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-panel p-10 rounded-[2.5rem] border border-white/5 hover:border-primary/40 transition-all duration-700 group relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 size-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-700"></div>

              <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-inner">
                <span className="material-symbols-outlined text-4xl font-light">{feature.icon}</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 font-display group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-slate-400 text-base leading-relaxed font-body">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-32">
        <div className="glass-panel p-12 md:p-20 rounded-[3rem] border border-primary/20 flex flex-col items-center text-center gap-8 bg-gradient-to-br from-primary/10 to-transparent">
          <h3 className="text-4xl md:text-6xl font-black font-display tracking-tight">Pronto para elevar o patamar do seu escritório?</h3>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl">Junte-se a centenas de advogados que já automatizaram seus fluxos com a Furtado PREV.</p>
          <button
            onClick={() => { setModalMode('register'); setIsModalOpen(true); }}
            className="bg-primary hover:bg-white text-black px-12 py-5 rounded-full text-xl font-black transition-all duration-500 shadow-neon"
          >
            SOLICITAR ACESSO AGORA
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Logo" className="w-8 h-8 opacity-50" />
              <span className="text-slate-400 font-bold tracking-widest text-sm">FURTADO PREV</span>
            </div>
            <div>
              <p className="text-slate-500 text-sm">© 2026 Furtado PREV. Todos os direitos reservados.</p>
              <p className="text-slate-600 text-[10px] mt-1 uppercase tracking-widest">Sistemas de Alta Performance Jurídica</p>
            </div>
          </div>
          <div className="flex gap-12 text-slate-500 text-sm font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">Termos</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
            <a href="#" className="hover:text-primary transition-colors">Suporte</a>
          </div>
        </div>
      </footer>

      {/* Modal - Login / Register */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setErrorMsg(''); setSuccessMsg(''); setShowPassword(false); }}></div>

          <div className="glass-panel w-full max-w-[440px] rounded-[2rem] p-8 sm:p-10 flex flex-col gap-6 relative z-10 shadow-2xl border border-white/10 bg-black/60 overflow-hidden">
            {/* Modal Glow */}
            <div className="absolute -top-24 -right-24 size-48 bg-primary/20 rounded-full blur-3xl"></div>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 mb-6 group">
                <img src={logoImg} alt="Logo" className="w-full h-full object-contain filter drop-shadow-neon group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="text-3xl font-bold font-display mb-2">
                {modalMode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
              </h3>
              <p className="text-slate-400 text-sm font-body">
                {modalMode === 'login' ? 'Entre na sua plataforma de gestão inteligente.' : 'Junte-se aos melhores advogados do país.'}
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl flex items-center gap-2 animate-[shake_0.5s_ease-in-out]">
                <span className="material-symbols-outlined text-sm">error</span>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs py-3 px-4 rounded-xl flex items-center gap-2 animate-[fadeIn_0.5s_ease-out]">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {successMsg}
              </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={handleAuth}>
              {modalMode === 'register' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Nome Completo</label>
                  <input
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-white placeholder-slate-600"
                    placeholder="Seu nome"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">E-mail Corporativo</label>
                <input
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-white placeholder-slate-600"
                  placeholder="advogado@firma.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Senha</label>
                  {modalMode === 'login' && (
                    <a href="#" className="text-[10px] font-bold text-primary hover:underline">Esqueceu?</a>
                  )}
                </div>
                <div className="relative group/pass">
                  <input
                    className="w-full h-12 px-4 pr-12 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-white placeholder-slate-600"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors flex items-center justify-center p-1 rounded-md"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                className="mt-2 w-full h-14 bg-primary hover:bg-primary-dark text-black font-bold text-lg rounded-full transition-all duration-300 transform hover:scale-[1.01] shadow-neon flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                {loading ? (
                  <div className="size-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{modalMode === 'login' ? 'Entrar no Sistema' : 'Criar Conta'}</span>
                    <span className="material-symbols-outlined font-bold">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 text-center border-t border-white/5">
              <p className="text-sm text-slate-500 font-body">
                {modalMode === 'login' ? 'Ainda não tem acesso?' : 'Já possui uma conta?'}
                <button
                  onClick={() => { setModalMode(modalMode === 'login' ? 'register' : 'login'); setErrorMsg(''); setSuccessMsg(''); setShowPassword(false); }}
                  className="text-white hover:text-primary font-bold transition-colors ml-2"
                >
                  {modalMode === 'login' ? 'Solicitar agora' : 'Entre aqui'}
                </button>
              </p>
            </div>

            <button
              onClick={() => { setIsModalOpen(false); setErrorMsg(''); setSuccessMsg(''); setShowPassword(false); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
