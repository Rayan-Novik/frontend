import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { useStoreConfig } from '../../../contexts/StoreConfigContext';

const getContrastColor = (hexColor: string) => {
  if (!hexColor) return '#1f2937';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1f2937' : '#ffffff';
};

export const HeaderMercadinho = () => {
  const [isLogged, setIsLogged] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const storeConfig = useStoreConfig();
  const appearance = storeConfig?.appearance || {};

  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminInfo = localStorage.getItem('adminInfo');
    setIsLogged(!!token || !!adminInfo);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminInfo');
    setIsLogged(false);
    navigate('/login');
  };

  const headerPrimaryColor = appearance.HEADER_PRIMARY_COLOR || '#ffffff';
  const textColor = getContrastColor(headerPrimaryColor);
  const siteTitle = appearance.SITE_TITLE || 'Mercado';
  const btnPrimaryBg = appearance.BTN_PRIMARY_BG || '#10B981';

  return (
    <>
      <header 
        className="fixed top-0 left-0 w-full z-50 border-b shadow-sm transition-colors duration-300"
        style={{ backgroundColor: headerPrimaryColor, borderColor: 'rgba(0,0,0,0.05)' }}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          
          <Link to="/" className="flex-shrink-0">
            {appearance.LOGO_URL ? (
              <img src={appearance.LOGO_URL} alt="Logo" className="h-25 0 object-contain" />
            ) : (
              <span className="text-xl md:text-2xl font-black tracking-tight" style={{ color: textColor }}>
                {siteTitle}
              </span>
            )}
          </Link>

          {/* Área Direita (Login + Carrinho) */}
          <div className="flex items-center gap-3 md:gap-4">
             
             {isLogged ? (
               <div className="relative group h-full flex items-center">
                 <div className="flex items-center gap-1 md:gap-2 cursor-pointer transition-colors py-2 px-1" style={{ color: textColor }}>
                   {/* 🟢 Ícone de Usuário em SVG (Não falha) */}
                   <svg className="w-7 h-7 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                   </svg>
                   <span className="hidden md:block text-sm font-bold">Perfil</span>
                 </div>

                 {/* Dropdown do Perfil */}
                 <div className="absolute top-[100%] right-0 mt-2 bg-white border border-gray-100 shadow-xl rounded-xl py-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
                   <ul className="flex flex-col m-0 p-0 list-none">
                     <li><Link to="/perfil" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">Meu Perfil</Link></li>
                     <li><Link to="/pedidos" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">Meus Pedidos</Link></li>
                     <li className="border-t border-gray-100 mt-1 pt-1">
                       <button onClick={handleLogout} className="w-full text-left block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">Sair da Conta</button>
                     </li>
                   </ul>
                 </div>
               </div>
             ) : (
               <Link to="/login" className="flex items-center gap-1 md:gap-2 font-bold px-2 py-2 transition-opacity hover:opacity-80" style={{ color: textColor }}>
                   {/* 🟢 Ícone de Usuário em SVG */}
                   <svg className="w-7 h-7 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                   </svg>
                   <span className="hidden md:block text-sm">Entrar</span>
               </Link>
             )}
             
             {/* 🟢 Botão do Carrinho */}
             <button
              onClick={() => navigate('/checkout')}
              className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-full md:rounded-xl text-white font-bold shadow-sm transition-all hover:-translate-y-1 active:scale-95"
              style={{ backgroundColor: btnPrimaryBg }}
            >
              {/* 🟢 Ícone de Carrinho em SVG (Não falha) */}
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              
              <span className="bg-white text-gray-900 px-2 py-0.5 rounded-full text-xs md:text-sm font-bold shadow-sm">
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>
      <div className="h-16 md:h-20"></div>
    </>
  );
};