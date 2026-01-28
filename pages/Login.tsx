import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo-gold-lion.png';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { preloadAllData } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.session) {
        // Navega imediatamente; o DataContext cuidará do pré-carregamento em segundo plano
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#0A0A0A]">
      <div className="fixed inset-0 z-0 w-full h-full pointer-events-none bg-black">
        <div className="absolute top-[-5%] left-[10%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[80px] animate-float"></div>
        <div className="absolute bottom-[5%] right-[5%] w-[600px] h-[600px] bg-yellow-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-5s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-8s' }}></div>
      </div>

      <div className="glass-panel w-full max-w-[440px] rounded-[2rem] p-8 sm:p-10 flex flex-col gap-6 animate-[fadeIn_0.6s_ease-out] relative z-20 shadow-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 mb-4 filter drop-shadow-neon hover:scale-105 transition-transform duration-300">
            <img src={logoImg} alt="Furtado Prev Logo" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-white font-display">
              Acesso ao Sistema
            </h2>
            <p className="text-slate-400 text-sm font-body leading-relaxed max-w-xs mx-auto">
              Entre na sua plataforma de gestão jurídica inteligente e conectada.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 animate-shake">
            <span className="material-symbols-outlined text-rose-500 text-[20px]">error</span>
            <p className="text-rose-500 text-sm font-medium">{error}</p>
          </div>
        )}

        <form className="flex flex-col gap-5 mt-2" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">E-mail Corporativo</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500 group-focus-within:text-primary transition-colors duration-300">mail</span>
              </div>
              <input
                className="w-full h-14 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base font-normal text-white placeholder-slate-600"
                placeholder="advogado@firma.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">Senha de Acesso</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500 group-focus-within:text-primary transition-colors duration-300">lock</span>
              </div>
              <input
                className="w-full h-14 pl-12 pr-12 rounded-xl bg-white/5 border border-white/10 focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-base font-normal text-white placeholder-slate-600"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-primary transition-colors cursor-pointer"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input className="peer h-5 w-5 rounded border-white/10 bg-white/5 text-primary checked:bg-primary checked:border-primary focus:ring-offset-0 focus:ring-primary/50 cursor-pointer transition-all" type="checkbox" />
              </div>
              <span className="text-sm text-slate-500 group-hover:text-white transition-colors font-body">Lembrar de mim</span>
            </label>
            <a className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors font-display" href="#">
              Esqueceu a senha?
            </a>
          </div>
          <button
            className={`mt-4 w-full h-14 bg-primary hover:bg-primary-dark text-black font-bold text-lg rounded-full transition-all duration-300 transform hover:scale-[1.01] shadow-neon flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Carregando Dados...</span>
              </div>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <span className="material-symbols-outlined text-[20px] font-bold">arrow_forward</span>
              </>
            )}
          </button>
        </form>
        <div className="pt-4 text-center border-t border-white/5">
          <p className="text-sm text-slate-500 font-body">
            Ainda não tem acesso?
            <a className="text-white hover:text-primary font-semibold transition-colors ml-1" href="#">Contate o admin</a>
          </p>
        </div>
      </div>
      <div className="mt-8 text-xs text-slate-500 font-mono tracking-widest uppercase opacity-60 relative z-20">
        v2.4.0 • Criptografia Segura
      </div>
    </div>
  );
};

export default Login;