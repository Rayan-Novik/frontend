import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStoreConfig } from '../contexts/StoreConfigContext';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { appearance } = useStoreConfig();
  
  // Puxa a cor principal da loja para combinar com o design
  const primaryColor = appearance?.BTN_PRIMARY_BG || '#111827'; // Preto/Escuro como fallback

  useEffect(() => {
    // Verifica no localStorage se o usuário já aceitou antes
    const consentimento = localStorage.getItem('ararinha_consentimento_termos');
    
    // Se não tiver registro, mostra a barra
    if (!consentimento) {
      // Um pequeno delay para a barra subir suavemente após a página carregar
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAceitar = () => {
    // Salva a decisão no navegador para não perguntar de novo
    localStorage.setItem('ararinha_consentimento_termos', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-[9999] px-4 py-5 sm:p-6 transition-transform duration-500 translate-y-0">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
        
        <div className="flex-1 text-sm text-gray-600 text-center sm:text-left leading-relaxed">
          <p>
            🍪 Usamos cookies para melhorar sua experiência em nossa loja. 
            Ao continuar navegando ou realizar um pedido, você concorda com nossos{' '}
            <Link to="/termos" className="font-bold underline hover:opacity-80 transition-opacity" style={{ color: primaryColor }}>Termos de Uso</Link>,{' '}
            <Link to="/privacidade" className="font-bold underline hover:opacity-80 transition-opacity" style={{ color: primaryColor }}>Política de Privacidade</Link> e nossas políticas de{' '}
            <Link to="/entrega" className="font-bold underline hover:opacity-80 transition-opacity" style={{ color: primaryColor }}>Entrega</Link> e{' '}
            <Link to="/trocas" className="font-bold underline hover:opacity-80 transition-opacity" style={{ color: primaryColor }}>Trocas</Link>.
          </p>
        </div>

        <div className="w-full sm:w-auto flex-shrink-0">
          <button
            onClick={handleAceitar}
            className="w-full sm:w-auto px-8 py-3 rounded-xl text-white font-bold shadow-md hover:shadow-lg hover:opacity-90 transition-all active:scale-95 whitespace-nowrap"
            style={{ backgroundColor: primaryColor }}
          >
            Entendi e Aceito
          </button>
        </div>

      </div>
    </div>
  );
};