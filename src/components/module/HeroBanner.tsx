import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useStoreConfig } from '../../contexts/StoreConfigContext';

export const HeroBanner = () => {
  const [heroBanner, setHeroBanner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { appearance } = useStoreConfig();
  const primaryBg = appearance?.BTN_PRIMARY_BG || '#2563EB';

  useEffect(() => {
    const fetchHeroBanner = async () => {
      try {
        // 🟢 Pega o ID da loja atual
        const tenantAtual = localStorage.getItem('tenantId') || '1';
        
        // 🟢 Faz a chamada para a ROTA PÚBLICA do backend
        const response = await api.get(`/hero-banner/public/${tenantAtual}`);
        
        setHeroBanner(response.data);
      } catch (error) {
        console.error("Erro ao carregar o Hero Banner:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeroBanner();
  }, []);

  if (isLoading) return null;

  const isBannerActive = heroBanner?.HERO_BANNER_ACTIVE === true || heroBanner?.HERO_BANNER_ACTIVE === 'true';
  
  if (!isBannerActive || !heroBanner?.HERO_BANNER_URL) {
    return null;
  }

  const isExternalLink = heroBanner?.HERO_BANNER_LINK?.startsWith('http');
  const BannerWrapper = isExternalLink ? 'a' : Link;
  const wrapperProps = isExternalLink 
    ? { href: heroBanner.HERO_BANNER_LINK || '#', target: '_blank', rel: 'noopener noreferrer' } 
    : { to: heroBanner.HERO_BANNER_LINK || '#' };

  // Helper para lidar com os checkboxes de Negrito
  const isBold = (val: any) => val === 'true' || val === true;

  return (
    <div className="w-full animate-in fade-in duration-700">
      <BannerWrapper 
        {...(wrapperProps as any)}
        className="relative w-full overflow-hidden group hover:opacity-95 transition-opacity flex items-center justify-center bg-gray-100"
      >
        
        {/* A imagem real dita o tamanho do banner. O 'w-full h-auto' garante que a proporção original seja mantida */}
        <img 
          src={heroBanner.HERO_BANNER_URL} 
          alt={heroBanner.HERO_BANNER_TITLE || "Banner Principal"}
          className="w-full h-auto object-contain block"
        />
        
        {/* TÍTULO INDIVIDUAL */}
        {heroBanner.HERO_BANNER_TITLE && (
          <div 
            className="absolute z-10 w-[95%] md:w-auto flex justify-center"
            style={{
                left: `${heroBanner.HERO_BANNER_TITLE_POS_X || 50}%`,
                top: `${heroBanner.HERO_BANNER_TITLE_POS_Y || 30}%`,
                transform: 'translate(-50%, -50%)',
            }}
          >
            <h2 
              className="m-0 drop-shadow-md text-center"
              style={{ 
                color: heroBanner.HERO_BANNER_TITLE_COLOR || '#ffffff',
                // 🟢 CSS CLAMP: Reduz o tamanho da fonte no celular automaticamente!
                fontSize: `clamp(18px, 4vw, ${heroBanner.HERO_BANNER_TITLE_SIZE || 48}px)`,
                fontWeight: isBold(heroBanner.HERO_BANNER_TITLE_BOLD) ? '800' : '400',
                transform: `rotate(${heroBanner.HERO_BANNER_TITLE_ROTATION || 0}deg)`,
                backgroundColor: heroBanner.HERO_BANNER_TITLE_BG || 'transparent',
                // 🟢 CSS CLAMP no padding para o fundo (bg) também diminuir no mobile
                padding: `clamp(4px, 1vw, ${heroBanner.HERO_BANNER_TITLE_PADDING || 0}px)`,
                borderRadius: `${heroBanner.HERO_BANNER_TITLE_RADIUS || 0}px`,
                display: 'inline-block',
                lineHeight: '1.2',
                wordBreak: 'break-word',
                maxWidth: '100%' // Impede que o texto vaze da tela horizontalmente
              }}
            >
              {heroBanner.HERO_BANNER_TITLE}
            </h2>
          </div>
        )}
        
        {/* SUBTÍTULO INDIVIDUAL */}
        {heroBanner.HERO_BANNER_SUBTITLE && (
          <div 
            className="absolute z-10 w-[95%] md:w-auto flex justify-center"
            style={{
                left: `${heroBanner.HERO_BANNER_SUB_POS_X || 50}%`,
                top: `${heroBanner.HERO_BANNER_SUB_POS_Y || 50}%`,
                transform: 'translate(-50%, -50%)',
            }}
          >
            <p 
              className="m-0 drop-shadow-md text-center"
              style={{ 
                color: heroBanner.HERO_BANNER_SUB_COLOR || '#ffffff',
                // 🟢 CSS CLAMP para o subtítulo
                fontSize: `clamp(14px, 2.5vw, ${heroBanner.HERO_BANNER_SUB_SIZE || 20}px)`,
                fontWeight: isBold(heroBanner.HERO_BANNER_SUB_BOLD) ? '700' : '400',
                transform: `rotate(${heroBanner.HERO_BANNER_SUB_ROTATION || 0}deg)`,
                backgroundColor: heroBanner.HERO_BANNER_SUB_BG || 'transparent',
                padding: `clamp(2px, 0.5vw, ${heroBanner.HERO_BANNER_SUB_PADDING || 0}px)`,
                borderRadius: `${heroBanner.HERO_BANNER_SUB_RADIUS || 0}px`,
                display: 'inline-block',
                lineHeight: '1.4',
                wordBreak: 'break-word',
                maxWidth: '100%'
              }}
            >
              {heroBanner.HERO_BANNER_SUBTITLE}
            </p>
          </div>
        )}
        
        {/* BOTÃO INDIVIDUAL */}
        {heroBanner.HERO_BANNER_BTN_TEXT && (
          <div 
            className="absolute z-10 w-[90%] md:w-auto flex justify-center"
            style={{
                left: `${heroBanner.HERO_BANNER_BTN_POS_X || 50}%`,
                top: `${heroBanner.HERO_BANNER_BTN_POS_Y || 70}%`,
                transform: 'translate(-50%, -50%)',
            }}
          >
            <span 
              // 🟢 Tailwind responsivo: padding e texto ficam menores no celular (text-xs px-5 py-2) e voltam ao normal no desktop (md:text-base md:px-8 md:py-3)
              className="inline-block px-5 py-2 md:px-8 md:py-3 text-xs md:text-base font-bold shadow-lg transition-transform group-hover:scale-105 whitespace-nowrap text-center" 
              style={{ 
                backgroundColor: heroBanner.HERO_BANNER_BTN_BG || primaryBg,
                color: heroBanner.HERO_BANNER_BTN_TEXT_COLOR || '#ffffff',
                borderRadius: `${heroBanner.HERO_BANNER_BTN_RADIUS ?? 50}px`
              }}
            >
              {heroBanner.HERO_BANNER_BTN_TEXT}
            </span>
          </div>
        )}

      </BannerWrapper>
    </div>
  );
};