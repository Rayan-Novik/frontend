import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import { useStoreConfig } from '../../../contexts/StoreConfigContext';
import api from '../../../services/api';

// 🚀 Helper para cor de contraste
const getContrastColor = (hexColor: string) => {
  if (!hexColor) return '#1f2937';
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#1f2937'; 
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1f2937' : '#ffffff';
};

const getCategoryIcon = (catName: string) => {
  const name = catName.toLowerCase();
  if (name === 'todos') return 'bi-grid';
  if (name.includes('entrada') || name.includes('porç')) return 'bi-egg-fried';
  if (name.includes('massa')) return 'bi-bezier2';
  if (name.includes('bebida') || name.includes('suco')) return 'bi-cup-straw';
  if (name.includes('sobremesa') || name.includes('doce')) return 'bi-cake2';
  return 'bi-shop'; 
};

// 🟢 HELPER: Verifica dia e horário em Manaus
const verificarLojaAberta = (horaAbertura?: string, horaFechamento?: string, diasStr = "0,1,2,3,4,5,6") => {
  if (!horaAbertura || !horaFechamento) return true; 

  const dateManaus = new Date(new Date().toLocaleString("en-US", { timeZone: 'America/Manaus' }));
  const diaAtual = dateManaus.getDay(); 
  const diasAbertos = diasStr.split(',').map(Number);
  
  if (!diasAbertos.includes(diaAtual)) return false; 

  const horaAtual = dateManaus.getHours();
  const minutoAtual = dateManaus.getMinutes();
  const minutosAgora = horaAtual * 60 + minutoAtual;

  const [abreH, abreM] = horaAbertura.split(':').map(Number);
  const minutosAbre = abreH * 60 + abreM;

  const [fechaH, fechaM] = horaFechamento.split(':').map(Number);
  const minutosFecha = fechaH * 60 + fechaM;

  if (minutosFecha < minutosAbre) {
      return minutosAgora >= minutosAbre || minutosAgora <= minutosFecha;
  } 
  return minutosAgora >= minutosAbre && minutosAgora <= minutosFecha;
};

// 🟢 Helper para traduzir os dias
const formatarDiasAbertos = (diasStr: string) => {
  const diasNome = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  if (!diasStr || diasStr === "0,1,2,3,4,5,6") return "Todos os dias";
  
  const diasNum = diasStr.split(',').map(Number).sort();
  if (diasNum.length === 5 && diasNum[0] === 1 && diasNum[4] === 5) return "Seg a Sex";
  if (diasNum.length === 6 && diasNum[0] === 1 && diasNum[5] === 6) return "Seg a Sáb";
  
  return diasNum.map(d => diasNome[d]).join(', ');
};

interface HeaderCardapioProps {
  categorias?: string[];
  activeCategory?: string;
  onCategorySelect?: (categoria: string) => void;
}

export const HeaderCardapio = ({ 
  categorias = [], 
  activeCategory = 'Todos', 
  onCategorySelect 
}: HeaderCardapioProps) => {
  
  const [isLogged, setIsLogged] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // 🟢 ESTADO PARA ARMAZENAR OS DADOS DA LOJA
  const [lojaStatus, setLojaStatus] = useState({
    enderecoCompleto: 'Carregando...',
    horario: '',
    dias: '',
    isAberta: true
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const { appearance } = useStoreConfig();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminInfo = localStorage.getItem('adminInfo');
    setIsLogged(!!token || !!adminInfo);
  }, [location.pathname]);

  // 🟢 BUSCA OS DADOS DA LOJA AO CARREGAR
  useEffect(() => {
    const fetchLojaInfo = async () => {
      try {
        const { data } = await api.get('/lojas'); 
        if (data && data.length > 0) {
          const lojaPrincipal = data[0]; 
          const status = verificarLojaAberta(lojaPrincipal.hora_abertura, lojaPrincipal.hora_fechamento, lojaPrincipal.dias_funcionamento);
          
          setLojaStatus({
            enderecoCompleto: `${lojaPrincipal.logradouro}, ${lojaPrincipal.numero} - ${lojaPrincipal.bairro}`,
            horario: (lojaPrincipal.hora_abertura && lojaPrincipal.hora_fechamento) ? `${lojaPrincipal.hora_abertura} às ${lojaPrincipal.hora_fechamento}` : '24h',
            dias: formatarDiasAbertos(lojaPrincipal.dias_funcionamento),
            isAberta: status
          });
        } else {
            setLojaStatus(prev => ({ ...prev, enderecoCompleto: 'Loja Virtual', isAberta: true }));
        }
      } catch (error) {
        console.error("Erro ao buscar dados da loja:", error);
      }
    };
    fetchLojaInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminInfo');
    setIsLogged(false);
    setIsProfileMenuOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    const activeBtn = scrollRef.current?.querySelector('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeCategory]);

  const headerPrimaryColor = appearance?.HEADER_PRIMARY_COLOR || '#ffffff';
  const headerSecondaryColor = appearance?.HEADER_SECONDARY_COLOR || '#ffffff';
  const siteTitle = appearance?.SITE_TITLE || 'Nosso Restaurante';
  const btnPrimaryBg = appearance?.BTN_PRIMARY_BG || '#EA1D2C'; 
  const btnPrimaryText = appearance?.BTN_PRIMARY_TEXT || '#ffffff'; 

  const topTextColor = getContrastColor(headerPrimaryColor); 
  const bottomTextColor = getContrastColor(headerSecondaryColor); 

  return (
    <>
      <header className="fixed top-0 left-0 w-full shadow-sm z-50 transition-colors duration-300 bg-white">
        
        {/* ======================================================== */}
        {/* LINHA 1: LOGO E INFORMAÇÕES COMPLETAS (Aberto/Fechado)    */}
        {/* ======================================================== */}
        <div style={{ backgroundColor: headerPrimaryColor }} className="transition-colors duration-300 py-1">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 h-[72px] flex items-center justify-between">
            
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Link to="/" className="cursor-pointer flex-shrink-0">
                {appearance?.LOGO_URL ? (
                  <img src={appearance.LOGO_URL} alt="Logo" className="h-12 w-12 sm:h-14 sm:w-14 object-cover rounded-full shadow-sm border border-black border-opacity-10" />
                ) : (
                  <div className="w-12 h-12 bg-black bg-opacity-5 rounded-full flex items-center justify-center">
                    <i className="bi bi-shop" style={{ color: topTextColor }}></i>
                  </div>
                )}
              </Link>

              <div className="flex flex-col justify-center min-w-0">
                <Link to="/">
                  <h1 className="text-sm sm:text-base font-bold leading-tight m-0 p-0 truncate" style={{ color: topTextColor }}>
                    {siteTitle}
                  </h1>
                </Link>
                
                {/* 🟢 ENDEREÇO, HORÁRIO E DIAS DIRETOS NO HEADER */}
                <div className="text-[10px] sm:text-[11px] leading-[1.2] mt-0.5 opacity-90 truncate" style={{ color: topTextColor }}>
                   <span className="truncate block max-w-[200px] sm:max-w-[350px]"><i className="bi bi-geo-alt"></i> {lojaStatus.enderecoCompleto}</span>
                   <span className="block mt-[1px]"><i className="bi bi-clock"></i> {lojaStatus.dias} • {lojaStatus.horario}</span>
                </div>

                {/* 🟢 BOLINHA DE STATUS */}
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold mt-[2px]">
                  {lojaStatus.isAberta ? (
                    <span className="flex items-center gap-1 text-green-500">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm"></span> Aberto agora
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500">
                      <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm"></span> Fechado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ÍCONES DE PERFIL E CARRINHO */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {isLogged ? (
                <div className="relative flex items-center">
                  <div 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="p-1.5 sm:p-2 rounded-full transition-colors hover:bg-black hover:bg-opacity-10 cursor-pointer flex items-center"
                    style={{ color: topTextColor }}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>

                  {isProfileMenuOpen && (
                    <div className="fixed inset-0 z-[50]" onClick={() => setIsProfileMenuOpen(false)}></div>
                  )}

                  <div className={`absolute top-12 right-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-xl py-2 w-48 transition-all duration-200 z-[60] ${isProfileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                    <ul className="flex flex-col">
                      <li><Link to="/perfil" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Meu Perfil</Link></li>
                      <li><Link to="/pedidos" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Meus Pedidos</Link></li>
                      <li><Link to="/favoritos" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Favoritos</Link></li>
                      <li className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleLogout} className="w-full text-left block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">Sair da Conta</button>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-full transition-colors hover:bg-black hover:bg-opacity-10"
                  style={{ color: topTextColor }}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden sm:block font-bold text-sm">Entrar</span>
                </Link>
              )}

              <button
                onClick={() => navigate('/checkout')}
                className="flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold shadow-sm hover:opacity-90 transition-all"
                style={{ backgroundColor: btnPrimaryBg, color: btnPrimaryText }}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="text-xs sm:text-sm">{totalItems}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* LINHA 2: FAIXA DE CATEGORIAS                              */}
        {/* ======================================================== */}
        {categorias.length > 0 && (
          <div 
            className="border-t border-black border-opacity-5 transition-colors duration-300"
            style={{ backgroundColor: headerSecondaryColor }}
          >
            <div
              ref={scrollRef}
              className="w-full flex overflow-x-auto snap-x touch-pan-x no-scrollbar mx-auto sm:justify-start lg:justify-center px-4 py-2 gap-2"
              style={{ scrollBehavior: 'smooth' }}
            >
              {categorias.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    data-active={isActive}
                    onClick={() => onCategorySelect && onCategorySelect(cat)}
                    className="snap-center flex-shrink-0 flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-w-[70px]"
                    style={
                      isActive 
                        ? { color: btnPrimaryBg } 
                        : { color: bottomTextColor, opacity: 0.7 }
                    }
                  >
                    <span 
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-0.5 transition-colors shadow-sm`}
                      style={
                        isActive 
                          ? { backgroundColor: btnPrimaryBg, color: btnPrimaryText } 
                          : { backgroundColor: 'rgba(0,0,0,0.05)', color: bottomTextColor }
                      }
                    >
                      <i className={`bi ${getCategoryIcon(cat)}`}></i>
                    </span>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <div className={categorias.length > 0 ? "h-[148px]" : "h-[80px]"}></div> 
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { 
          -ms-overflow-style: none; 
          scrollbar-width: none; 
          -webkit-overflow-scrolling: touch; 
        }
      `}</style>
    </>
  );
};