import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../../services/api';
import { useCart } from '../../../contexts/CartContext';
import { useStoreConfig } from '../../../contexts/StoreConfigContext';

export interface Subcategoria {
  id_subcategoria: number;
  nome: string;
}

export interface Categoria {
  id_categoria: number;
  nome: string;
  subcategorias?: Subcategoria[];
}

const getContrastColor = (hexColor: string) => {
  if (!hexColor) return '#1f2937';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1f2937' : '#ffffff';
};

export const HeaderEcommerce = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<number | null>(null);

  const [isAllDeptsOpen, setIsAllDeptsOpen] = useState(false);
  const [activeDeptHover, setActiveDeptHover] = useState<number | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [isLogged, setIsLogged] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();

  const storeConfig = useStoreConfig();
  const appearance = storeConfig?.appearance || {} as any;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminInfo = localStorage.getItem('adminInfo');
    setIsLogged(!!token || !!adminInfo);
  }, [location.pathname]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await api.get('/categorias');
        setCategorias(response.data);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      }
    };
    fetchCategorias();
  }, []);

  const handlePesquisa = (e: React.FormEvent) => {
    e.preventDefault();
    if (termoPesquisa.trim()) {
      navigate(`/busca?q=${termoPesquisa}`);
      setIsMobileMenuOpen(false); 
      setIsMobileSearchOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminInfo');
    setIsLogged(false);
    navigate('/login');
  };

  const headerPrimaryColor = appearance.HEADER_PRIMARY_COLOR || '#ffffff';
  const headerPrimaryTextColor = getContrastColor(headerPrimaryColor);
  const headerSecondaryColor = appearance['HEADER_SECONDARY_COLOR'] || '#f8f9fa';
  const headerSecondaryTextColor = getContrastColor(headerSecondaryColor);
  const btnPrimaryBg = appearance.BTN_PRIMARY_BG || '#2563EB';
  const btnPrimaryText = appearance.BTN_PRIMARY_TEXT || '#ffffff';
  const siteTitle = appearance['SITE_TITLE'] || 'Minha Loja';

  const isActive = (path: string) => {
    if (path === '/busca' && isMobileSearchOpen) return true;
    return location.pathname === path;
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 w-full shadow-sm border-b z-50 transition-colors duration-300"
        style={{
          backgroundColor: headerPrimaryColor,
          borderColor: 'rgba(0,0,0,0.05)'
        }}
      >
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-8">

          {/* 🟢 CORREÇÃO 1: Limitado a altura máxima da logo para caber perfeitamente no Header */}
          <Link to="/" className="flex-shrink-0 cursor-pointer mx-auto md:mx-0 flex items-center h-full">
            {appearance.LOGO_URL ? (
              <img src={appearance.LOGO_URL} alt="Logo" className="max-h-14 w-auto object-contain py-1" />
            ) : (
              <span
                className="text-2xl font-black tracking-tight uppercase"
                style={{ color: headerPrimaryTextColor }}
              >
                {siteTitle}
              </span>
            )}
          </Link>

          {/* BARRA DE PESQUISA (Apenas Desktop) */}
          <form onSubmit={handlePesquisa} className="flex-grow max-w-2xl relative hidden md:block">
            <input
              type="text"
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
              placeholder="O que você está procurando?"
              className="w-full rounded-full py-2.5 pl-5 pr-12 focus:outline-none focus:ring-2 transition-all border border-transparent"
              style={{
                backgroundColor: headerPrimaryTextColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: headerPrimaryTextColor,
                '--tw-ring-color': btnPrimaryBg
              } as React.CSSProperties}
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-4 hover:opacity-80 transition-opacity"
              style={{ color: headerPrimaryTextColor }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* AÇÕES DINÂMICAS */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {isLogged ? (
              <div className="relative group h-full flex items-center">
                <div
                  className="flex items-center gap-2 cursor-pointer transition-colors py-2"
                  style={{ color: headerPrimaryTextColor }}
                >
                  <div className="p-2 rounded-full" style={{ backgroundColor: headerPrimaryTextColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="hidden lg:block text-sm font-semibold transition-colors hover:opacity-80">
                    Minha Conta
                  </span>
                  <svg className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform hidden lg:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <div className="absolute top-[100%] right-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-lg py-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
                  <ul className="flex flex-col">
                    <li><Link to="/perfil" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Meu Perfil</Link></li>
                    <li><Link to="/pedidos" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Meus Pedidos</Link></li>
                    <li><Link to="/favoritos" className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Favoritos</Link></li>
                    <li className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={handleLogout} className="w-full text-left block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">Sair da Conta</button>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium px-3 py-2 hover:opacity-80 transition-opacity"
                  style={{ color: headerPrimaryTextColor }}
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-sm hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: btnPrimaryBg, color: btnPrimaryText }}
                >
                  Criar Conta
                </Link>
              </div>
            )}

            <div className="h-8 w-[1px]" style={{ backgroundColor: headerPrimaryTextColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}></div>

            <button
              onClick={() => navigate('/checkout')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity relative cursor-pointer"
              style={{ color: headerPrimaryTextColor }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>

              {totalItems > 0 && (
                <span
                  className="absolute -top-1 -right-2 text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-in zoom-in duration-300 shadow-sm"
                  style={{ backgroundColor: btnPrimaryBg, color: btnPrimaryText }}
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* BARRA DE CATEGORIAS (Apenas Desktop) */}
        <nav
          className="hidden md:block transition-colors duration-300 border-t relative"
          style={{
            backgroundColor: headerSecondaryColor,
            borderColor: 'rgba(0,0,0,0.05)'
          }}
        >
          <div className="container mx-auto px-4">
            <ul className="flex items-center gap-8 h-12">

              <li
                className="h-full flex items-center relative"
                onMouseEnter={() => setIsAllDeptsOpen(true)}
                onMouseLeave={() => {
                  setIsAllDeptsOpen(false);
                  setActiveDeptHover(null);
                }}
              >
                <div
                  className="font-bold text-sm cursor-pointer flex items-center gap-2 hover:opacity-80 transition-opacity px-2 h-full"
                  style={{ color: headerSecondaryTextColor }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <Link
                    to="/busca"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                    onClick={() => setIsAllDeptsOpen(false)}
                  >
                    Todos os Departamentos
                  </Link>
                </div>

                {isAllDeptsOpen && categorias.length > 0 && (
                  <div className="absolute top-full left-0 bg-white border border-gray-100 shadow-2xl rounded-b-xl min-w-[260px] z-[60] flex">
                    <ul className="flex flex-col w-full py-2 m-0 list-none">
                      {categorias.map(cat => (
                        <li
                          key={cat.id_categoria}
                          className="relative"
                          onMouseEnter={() => setActiveDeptHover(cat.id_categoria)}
                        >
                          <Link
                            to={`/categoria/${cat.nome.toLowerCase()}`}
                            className={`flex items-center justify-between px-5 py-3 text-sm transition-colors cursor-pointer
                                ${activeDeptHover === cat.id_categoria ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}
                            `}
                            onClick={() => setIsAllDeptsOpen(false)}
                          >
                            <span>{cat.nome}</span>
                            {cat.subcategorias && cat.subcategorias.length > 0 && (
                              <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </Link>

                          {activeDeptHover === cat.id_categoria && cat.subcategorias && cat.subcategorias.length > 0 && (
                            <div className="absolute top-0 left-full h-auto min-h-[100%] bg-white border-l border-gray-100 shadow-xl rounded-r-xl min-w-[240px] py-2 z-[61]">
                              <ul className="flex flex-col m-0 list-none">
                                {cat.subcategorias.map(sub => (
                                  <li key={sub.id_subcategoria}>
                                    <Link
                                      to={`/categoria/${cat.nome.toLowerCase()}/${sub.nome.toLowerCase()}`}
                                      className="block px-5 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                                      onClick={() => setIsAllDeptsOpen(false)}
                                    >
                                      {sub.nome}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>

              <div className="h-6 w-[1px]" style={{ backgroundColor: headerSecondaryTextColor, opacity: 0.2 }}></div>

              {categorias.slice(0, 6).map((categoria) => (
                <li
                  key={categoria.id_categoria}
                  className="h-full flex items-center relative group"
                  onMouseEnter={() => setCategoriaAtiva(categoria.id_categoria)}
                  onMouseLeave={() => setCategoriaAtiva(null)}
                >
                  <span
                    className="font-medium text-sm flex items-center gap-1 hover:opacity-70 transition-opacity h-full"
                    style={{ color: headerSecondaryTextColor }}
                  >
                    <Link
                      to={`/categoria/${categoria.nome.toLowerCase()}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                      className="cursor-pointer h-full flex items-center"
                      onClick={() => setCategoriaAtiva(null)}
                    >
                      {categoria.nome}
                    </Link>

                    {categoria.subcategorias && categoria.subcategorias.length > 0 && (
                      <svg className="w-4 h-4 opacity-40 group-hover:rotate-180 transition-transform cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </span>

                  {categoriaAtiva === categoria.id_categoria && categoria.subcategorias && categoria.subcategorias.length > 0 && (
                    <div className="absolute top-full left-0 bg-white border border-gray-100 shadow-2xl rounded-b-lg py-2 min-w-[220px] z-[60]">
                      <ul className="flex flex-col">
                        {categoria.subcategorias.map((sub) => (
                          <li key={sub.id_subcategoria}>
                            <Link
                              to={`/categoria/${categoria.nome.toLowerCase()}/${sub.nome.toLowerCase()}`}
                              className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => setCategoriaAtiva(null)}
                            >
                              {sub.nome}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* MODAL MOBILE: BUSCA RÁPIDA */}
      {isMobileSearchOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col transition-opacity">
          <div className="bg-white w-full rounded-b-3xl overflow-hidden shadow-xl animate-in slide-in-from-top duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button onClick={() => setIsMobileSearchOpen(false)} className="text-gray-400 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <form onSubmit={handlePesquisa} className="flex-1 relative">
                <input
                  type="text"
                  autoFocus
                  value={termoPesquisa}
                  onChange={(e) => setTermoPesquisa(e.target.value)}
                  placeholder="O que você procura?"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': btnPrimaryBg } as React.CSSProperties}
                />
                <button type="submit" className="absolute right-3 top-3 text-blue-600">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </form>
            </div>
            
            <div className="p-4 bg-gray-50/50">
              <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Buscas Populares</p>
              <div className="flex flex-wrap gap-2">
                {categorias.slice(0, 5).map(cat => (
                   <button 
                     key={cat.id_categoria}
                     onClick={() => {
                        setTermoPesquisa(cat.nome);
                        navigate(`/busca?q=${cat.nome}`);
                        setIsMobileSearchOpen(false);
                     }}
                     className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                   >
                     {cat.nome}
                   </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileSearchOpen(false)}></div>
        </div>
      )}

      {/* MENU MOBILE CASCATA */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col justify-end transition-opacity">
          <div className="bg-white w-full rounded-t-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
            
            <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-xl font-extrabold text-gray-900">Departamentos</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto pb-24">
              <ul className="space-y-3">
                <li>
                  <Link to="/busca" onClick={() => setIsMobileMenuOpen(false)} className="block p-4 bg-gray-50 rounded-xl font-bold text-blue-600 flex items-center justify-between border border-gray-100">
                    Ver todos os produtos
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </li>
                {categorias.map(cat => (
                  <li key={cat.id_categoria}>
                    <Link to={`/categoria/${cat.nome.toLowerCase()}`} onClick={() => setIsMobileMenuOpen(false)} className="block p-4 bg-white rounded-xl font-bold text-gray-800 flex items-center justify-between border border-gray-100 shadow-sm active:scale-[0.98] transition-transform">
                      {cat.nome}
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION MOBILE */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50">
        <div className="bg-[#111827] text-gray-400 rounded-t-2xl shadow-[0_-10px_20px_rgba(0,0,0,0.15)] relative">
          <div className="flex justify-between items-center px-4 h-[72px]">
            <Link to="/" className={`flex flex-col items-center justify-center w-[20%] transition-colors ${isActive('/') ? 'text-white' : 'hover:text-gray-200'}`}>
              <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.47 3.84a.75.75 0 011.06 0l8.99 9a.75.75 0 11-1.06 1.06h-.46v7.35a2.25 2.25 0 01-2.25 2.25h-3a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v4.5a.75.75 0 01-.75.75h-3a2.25 2.25 0 01-2.25-2.25V13.9H3.5a.75.75 0 11-1.06-1.06l9.03-9z" />
              </svg>
              <span className="text-[10px] font-bold">Início</span>
            </Link>

            <button 
              onClick={() => {
                setIsMobileSearchOpen(true);
                setIsMobileMenuOpen(false);
              }} 
              className={`flex flex-col items-center justify-center w-[20%] transition-colors ${isActive('/busca') ? 'text-white' : 'hover:text-gray-200'}`}
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <span className="text-[10px] font-bold">Busca</span>
            </button>

            <div className="w-[20%] flex justify-center relative">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(true);
                  setIsMobileSearchOpen(false);
                }}
                className="absolute bottom-4 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                style={{ backgroundColor: btnPrimaryBg, boxShadow: `0 8px 20px ${btnPrimaryBg}66` }}
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>

            <Link to="/checkout" className={`flex flex-col items-center justify-center w-[20%] transition-colors relative ${isActive('/checkout') ? 'text-white' : 'hover:text-gray-200'}`}>
              <div className="relative">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {totalItems > 0 && (
                  <span 
                    className="absolute -top-1 -right-2 text-[9px] font-bold h-[15px] w-[15px] rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: btnPrimaryBg }}
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold">Cesta</span>
            </Link>

            <Link to={isLogged ? "/perfil" : "/login"} className={`flex flex-col items-center justify-center w-[20%] transition-colors ${isActive('/perfil') || isActive('/login') ? 'text-white' : 'hover:text-gray-200'}`}>
              <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54-1.636 1.05-3 2.625-3s3.165 1.364 2.625 3A2.625 2.625 0 019.375 8.25zM12 18.75c-2.825 0-5.267-1.57-6.521-3.86.326-.712 1.35-1.14 2.896-1.14h7.25c1.545 0 2.57.428 2.896 1.14A7.472 7.472 0 0112 18.75z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-bold">Conta</span>
            </Link>

          </div>
        </div>
      </div>

      {/* 🟢 CORREÇÃO 2: Exatamente o tamanho do Header (h-20) para o Banner ficar colado nele! */}
      <div className="h-20"></div>
      
    </>
  );
};