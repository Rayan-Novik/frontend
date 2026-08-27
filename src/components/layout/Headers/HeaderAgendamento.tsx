import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, CalendarCheck, LogIn } from 'lucide-react';
import type { AppearanceConfig } from '../../../contexts/StoreConfigContext';

export interface Tenant {
  id?: number;
  SITE_TITLE?: string;
  LOGO_URL?: string;
}

interface HeaderAgendamentoProps {
  appearance: AppearanceConfig;
}

export const HeaderAgendamento: React.FC<HeaderAgendamentoProps> = ({ appearance }) => {
  const headerBgColor = appearance?.HEADER_PRIMARY_COLOR || '#ffffff';
  const headerTextColor = appearance?.BTN_PRIMARY_TEXT || '#1f2937';

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 🟢 Função que checa o token
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    // Checa na primeira vez que monta
    checkAuthStatus();

    // 🟢 Cria ouvintes para quando o storage for alterado
    window.addEventListener('storage', checkAuthStatus); // Funciona se logar/deslogar em outra aba
    window.addEventListener('authChange', checkAuthStatus); // Funciona instantaneamente na mesma aba

    return () => {
      // Limpa os ouvintes quando o componente for desmontado para evitar vazamento de memória
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('authChange', checkAuthStatus);
    };
  }, []);

  return (
    <header 
      className="shadow-sm sticky top-0 z-50 transition-colors duration-300"
      style={{ backgroundColor: headerBgColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <Link to="/" className="flex items-center gap-2" style={{ color: headerTextColor }}>
            {appearance?.LOGO_URL ? (
              <img src={appearance.LOGO_URL} alt="Logo" className="h-10 w-auto" />
            ) : (
              <span className="text-xl font-bold" style={{ color: headerTextColor }}>
                {appearance?.SITE_TITLE || 'Nossa Clínica'}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-6">
            
            {isLoggedIn && (
              <Link 
                to="/pedidos" 
                className="flex items-center gap-1 transition-opacity opacity-90 hover:opacity-100"
                style={{ color: headerTextColor }}
              >
                <CalendarCheck size={20} />
                <span className="hidden sm:inline text-sm font-medium">Meus Horários</span>
              </Link>
            )}
            
            {isLoggedIn ? (
              <Link 
                to="/perfil" 
                className="flex items-center gap-1 transition-opacity opacity-90 hover:opacity-100"
                style={{ color: headerTextColor }}
              >
                <User size={20} />
                <span className="hidden sm:inline text-sm font-medium">Meu Perfil</span>
              </Link>
            ) : (
              <Link 
                to="/login"
                className="flex items-center gap-1 transition-opacity opacity-90 hover:opacity-100"
                style={{ color: headerTextColor }}
              >
                <LogIn size={20} />
                <span className="hidden sm:inline text-sm font-medium">Entrar</span>
              </Link>
            )}

          </div>
          
        </div>
      </div>
    </header>
  );
};