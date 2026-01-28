import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useUI } from '../contexts/UIContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isLandingPage = location.pathname === '/';
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useUI();

  if (isLoginPage || isLandingPage) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen bg-background-light text-text-main flex selection:bg-primary selection:text-white relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] -z-10 animate-float"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-yellow-600/5 rounded-full blur-[120px] -z-10 animate-float" style={{ animationDelay: '-5s' }}></div>
      <div className="fixed top-[40%] left-[40%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>

      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />

      <main className={`flex-1 flex flex-col h-full relative z-10 transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'ml-20' : 'ml-20 lg:ml-72'}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;