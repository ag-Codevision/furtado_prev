import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { NavItem } from '../types';
import logoImg from '../assets/logo-gold-lion.png';
import { supabase } from '../lib/supabase';

const navItems: NavItem[] = [
  { icon: 'dashboard', label: 'Visão Geral', path: '/dashboard' },
  { icon: 'support_agent', label: 'CRM / Atendimento', path: '/crm' },
  { icon: 'diversity_3', label: 'Clientes', path: '/clients' },
  { icon: 'assignment', label: 'Tarefas', path: '/tasks' },
  { icon: 'groups', label: 'Equipe', path: '/team' },
  { icon: 'calculate', label: 'Cálculos RMI', path: '/calculations' },
  { icon: 'event_upcoming', label: 'Agenda', path: '/agenda' },
  { icon: 'account_balance_wallet', label: 'Financeiro', path: '/finance' },
  { icon: 'gavel', label: 'Sentenças', path: '/decisions' },
  { icon: 'description', label: 'Relatórios', path: '/reports' },
  { icon: 'psychology', label: 'Prev.IA', path: '/ai' },
  { icon: 'folder_open', label: 'Docs & CNIS', path: '/documents' },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<{ full_name: string; role: string; avatar_url?: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let profileSub: any;

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role, avatar_url')
        .eq('id', userId)
        .single();
      if (data) setUserProfile(data);

      // Realtime subscription for profile updates
      profileSub = supabase
        .channel(`profile-changes-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`
          },
          (payload) => {
            setUserProfile(payload.new as any);
          }
        )
        .subscribe();
    };

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUserProfile(null);
        if (profileSub) {
          supabase.removeChannel(profileSub);
          profileSub = null;
        }
      }
    });

    return () => {
      authSub.unsubscribe();
      if (profileSub) {
        supabase.removeChannel(profileSub);
      }
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'comum':
        return { label: 'Colaborador', color: 'text-yellow-500' };
      case 'intermediario':
        return { label: 'Doutor(a)', color: 'text-blue-500' };
      case 'admin':
        return { label: 'Admin', color: 'text-purple-500' };
      default:
        return { label: role || 'Usuário', color: 'text-slate-400' };
    }
  };

  const roleInfo = getRoleBadge(userProfile?.role);

  return (
    <aside className={`fixed top-0 left-0 h-full glass-panel z-50 flex flex-col justify-between transition-all duration-300 border-none ${isCollapsed ? 'w-20' : 'w-20 lg:w-72'}`}>
      <div className="flex flex-col h-full p-4 lg:p-6 gap-8 overflow-x-hidden">
        {/* Brand & Toggle */}
        <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'flex-col gap-4 px-0' : 'justify-between px-2'}`}>
          <div className="flex items-center gap-4">
            <div className="relative size-12 flex items-center justify-center shrink-0 group cursor-pointer">
              <img src={logoImg} alt="Furtado Prev Logo" className="w-full h-full object-contain filter drop-shadow-neon" />
            </div>
            {!isCollapsed && (
              <div className="hidden lg:flex flex-col animate-[fadeIn_0.3s_ease-out]">
                <h1 className="text-white text-xl font-bold tracking-tight font-display">Furtado <span className="text-primary text-xs align-top">PREV</span></h1>
                <p className="text-primary text-[10px] font-bold tracking-widest uppercase opacity-80">Direito Previdenciário</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex size-8 items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-primary transition-all ${isCollapsed ? '' : 'hidden lg:flex ml-auto'}`}
            title={isCollapsed ? "Expandir" : "Recolher"}
          >
            <span className={`material-symbols-outlined transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
              menu_open
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-hide py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const isAI = item.path === '/ai';

            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : ""}
                className={`flex items-center rounded-xl transition-all group relative overflow-hidden ${isCollapsed ? 'justify-center p-3' : 'gap-4 px-4 py-3'} ${isActive
                  ? 'bg-primary/10 border border-primary/20 text-primary shadow-sm'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white hover:shadow-soft'
                  }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></div>}

                <span className={`material-symbols-outlined shrink-0 ${isActive ? 'filled' : ''} ${isAI ? 'text-amber-400' : ''}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <span className="hidden lg:block text-sm font-medium whitespace-nowrap animate-[fadeIn_0.2s_ease-out]">{item.label}</span>
                )}

                {isAI && !isCollapsed && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 hidden lg:block animate-[fadeIn_0.2s_ease-out]">BETA</span>
                )}
              </Link>
            );
          })}

          {/* Conditional Admin Link */}
          {userProfile?.role === 'admin' && (
            <Link
              to="/admin"
              title={isCollapsed ? "Painel Admin" : ""}
              className={`flex items-center rounded-xl transition-all group relative overflow-hidden mt-4 border border-dashed hover:border-solid ${isCollapsed ? 'justify-center p-3' : 'gap-4 px-4 py-3'} ${location.pathname === '/admin'
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-sm'
                : 'border-white/10 text-slate-500 hover:text-purple-400 hover:bg-purple-500/5 hover:border-purple-500/20 hover:shadow-soft'
                }`}
            >
              {location.pathname === '/admin' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-400 rounded-r-full"></div>}

              <span className={`material-symbols-outlined shrink-0 ${location.pathname === '/admin' ? 'filled text-purple-400' : 'text-slate-400 group-hover:text-purple-400'}`} style={location.pathname === '/admin' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                admin_panel_settings
              </span>
              {!isCollapsed && (
                <span className="hidden lg:block text-sm font-black uppercase tracking-widest whitespace-nowrap animate-[fadeIn_0.2s_ease-out]">Painel Admin</span>
              )}
            </Link>
          )}
        </nav>

        {/* Footer Actions */}
        <div className="flex flex-col gap-4 mt-auto relative">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          {/* Logout Dropdown Menu */}
          {isMenuOpen && !isCollapsed && (
            <div className="absolute bottom-full left-0 w-full mb-2 animate-[slideInUp_0.2s_ease-out]">
              <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-2 bg-black/80 backdrop-blur-xl flex flex-col gap-1">
                <button
                  onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-primary transition-colors text-sm font-bold group"
                >
                  <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">account_circle</span>
                  Meu Perfil
                </button>
                <div className="h-[1px] w-full bg-white/5 mx-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-bold group"
                >
                  <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">logout</span>
                  Sair do Sistema
                </button>
              </div>
            </div>
          )}

          {/* User Profile Mini */}
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center rounded-2xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10 group ${isCollapsed ? 'px-1 py-1 justify-center' : 'px-3 py-2 gap-3'} ${isMenuOpen ? 'bg-white/10 border-white/20' : ''}`}
          >
            <div className="relative shrink-0">
              <div
                className="size-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/20 shadow-md overflow-hidden"
              >
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <span className="material-symbols-outlined text-primary text-2xl">person</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-black rounded-full"></div>
            </div>

            {!isCollapsed && (
              <div className="hidden lg:flex flex-col animate-[fadeIn_0.2s_ease-out] flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-none truncate">{userProfile?.full_name || 'Carregando...'}</p>
                <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest truncate ${roleInfo.color}`}>{roleInfo.label}</p>
              </div>
            )}

            {!isCollapsed && (
              <span className={`material-symbols-outlined text-slate-400 ml-auto text-lg transition-transform duration-300 ${isMenuOpen ? 'rotate-180 text-primary' : ''} hidden lg:block`}>
                expand_more
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;