// src/pages/Profile.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- IMPORTANTE: Para redirecionar após logout
import { ProfileDados } from '../components/profile/ProfileDados';
import { ProfileEnderecos } from '../components/profile/ProfileEnderecos';
import { ProfilePedidos } from '../components/profile/ProfilePedidos';
import api from '../services/api';

export const Profile = () => {
  const [activeTab, setActiveTab] = useState('dados');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);
  const [userInfo, setUserInfo] = useState({ nome: 'Carregando...', email: '' });
  
  const navigate = useNavigate(); // <-- Instanciando o hook de navegação

  useEffect(() => {
    api.get('/usuarios/perfil').then(res => {
      setUserInfo({
        nome: res.data.nome_completo?.split(' ')[0] || 'Usuário',
        email: res.data.email || ''
      });
    }).catch(() => {});
  }, []);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // 🔴 NOVA FUNÇÃO DE LOGOUT
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminInfo');
    navigate('/login'); // Redireciona para o login após limpar
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dados': return <ProfileDados />;
      case 'enderecos': return <ProfileEnderecos />;
      case 'pedidos': return <ProfilePedidos />;
      default: return <ProfileDados />;
    }
  };

  // Ícones SVG
  const UserIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  const MapIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  const BagIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
  const LogoutIcon = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>; // Ícone de Sair
  const ChevronRight = <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;

  return (
    <div className="min-h-screen bg-[#F8F9FB] py-8 lg:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          
          <div className={`w-full md:w-80 flex-shrink-0 flex-col gap-6 ${isMobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
            
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-[24px] shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mb-4 shadow-inner">
                {userInfo.nome.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-gray-900">Olá, {userInfo.nome}</h2>
              <p className="text-sm text-gray-500 mt-1">{userInfo.email}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 px-2">Sua Conta</h3>
              <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden p-2 flex flex-col gap-1">
                
                <button onClick={() => handleTabClick('dados')} className={`flex items-center justify-between p-4 rounded-[16px] transition-all ${activeTab === 'dados' ? 'bg-gray-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${activeTab === 'dados' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{UserIcon}</div>
                    <span>Informações Pessoais</span>
                  </div>
                  {ChevronRight}
                </button>

                <button onClick={() => handleTabClick('enderecos')} className={`flex items-center justify-between p-4 rounded-[16px] transition-all ${activeTab === 'enderecos' ? 'bg-gray-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${activeTab === 'enderecos' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{MapIcon}</div>
                    <span>Endereços Salvos</span>
                  </div>
                  {ChevronRight}
                </button>

                <button onClick={() => handleTabClick('pedidos')} className={`flex items-center justify-between p-4 rounded-[16px] transition-all ${activeTab === 'pedidos' ? 'bg-gray-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${activeTab === 'pedidos' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{BagIcon}</div>
                    <span>Histórico de Pedidos</span>
                  </div>
                  {ChevronRight}
                </button>

                {/* 🔴 DIVISOR E BOTÃO DE SAIR */}
                <div className="h-[1px] bg-gray-100 my-2 mx-4"></div>
                
                <button onClick={handleLogout} className="flex items-center justify-between p-4 rounded-[16px] transition-all text-red-600 hover:bg-red-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-red-100 text-red-600">{LogoutIcon}</div>
                    <span className="font-semibold">Sair da Conta</span>
                  </div>
                </button>

              </div>
            </div>
          </div>

          {/* CONTEÚDO PRINCIPAL */}
          <div className={`flex-grow ${!isMobileMenuOpen ? 'block' : 'hidden md:block'}`}>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center gap-2 text-gray-600 mb-4 px-2 font-medium hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Voltar para o Menu
            </button>

            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 md:p-8">
              {renderContent()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};