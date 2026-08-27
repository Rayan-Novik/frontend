import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import api from '../services/api';

// Tipagens para os dados que vêm do banco
interface FooterLink {
  id_link: number;
  titulo: string;
  url: string;
}

interface FooterData {
  sobreTexto: string;
  linksRapidos: FooterLink[];
  ajuda: FooterLink[];
}

interface SocialMediaData {
  FACEBOOK_ATIVO: boolean;
  LINK_FACEBOOK: string;
  INSTAGRAM_ATIVO: boolean;
  LINK_INSTAGRAM: string;
  TIKTOK_ATIVO: boolean;
  LINK_TIKTOK: string;
  WHATSAPP_ATIVO: boolean;
  WHATSAPP_NUMERO: string;
  WHATSAPP_MENSAGEM: string;
}

// Função utilitária ajustada para retornar PRETO PURO ou BRANCO PURO
const getContrastColor = (hexColor: string) => {
  if (!hexColor) return '#000000'; 
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff'; 
};

export const Footer = () => {
  const storeConfig = useStoreConfig();
  const appearance = storeConfig?.appearance || {} as any;

  const siteTitle = appearance.SITE_TITLE || 'Minha Loja';
  const logoUrl = appearance.LOGO_URL || '';
  
  // CORES DINÂMICAS DO RODAPÉ
  const footerBgColor = appearance.FOOTER_COLOR || '#ffffff';
  const footerTextColor = getContrastColor(footerBgColor);
  const isFooterDark = footerTextColor === '#ffffff'; 

  const [footerData, setFooterData] = useState<FooterData>({ sobreTexto: '', linksRapidos: [], ajuda: [] });
  const [socialMedia, setSocialMedia] = useState<SocialMediaData | null>(null);

  useEffect(() => {
    const fetchFooterConfig = async () => {
      try {
        const [resFooter, resSocial] = await Promise.all([
          api.get('/footer').catch(() => ({ data: { sobreTexto: '', linksRapidos: [], ajuda: [] } })),
          api.get('/social-media').catch(() => ({ data: null }))
        ]);

        if (resFooter.data) setFooterData(resFooter.data);
        
        if (resSocial.data) {
          const social = resSocial.data;
          setSocialMedia({
            ...social,
            FACEBOOK_ATIVO: social.FACEBOOK_ATIVO === true || social.FACEBOOK_ATIVO === 'true',
            INSTAGRAM_ATIVO: social.INSTAGRAM_ATIVO === true || social.INSTAGRAM_ATIVO === 'true',
            TIKTOK_ATIVO: social.TIKTOK_ATIVO === true || social.TIKTOK_ATIVO === 'true',
            WHATSAPP_ATIVO: social.WHATSAPP_ATIVO === true || social.WHATSAPP_ATIVO === 'true',
          });
        }
      } catch (error) {
        console.error("Erro ao buscar configurações do rodapé:", error);
      }
    };

    fetchFooterConfig();
  }, []);

  const renderLink = (link: FooterLink) => {
    const isExternal = link.url.startsWith('http://') || link.url.startsWith('https://');
    
    if (isExternal) {
      return (
        <a 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="opacity-90 hover:opacity-100 hover:translate-x-1 transition-all inline-block"
        >
          {link.titulo}
        </a>
      );
    }
    
    return (
      <Link 
        to={link.url} 
        className="opacity-90 hover:opacity-100 hover:translate-x-1 transition-all inline-block"
      >
        {link.titulo}
      </Link>
    );
  };

  return (
    <>
      <footer 
        className="border-t pt-16 pb-8 mt-auto relative z-10 transition-colors duration-300"
        style={{ 
          backgroundColor: footerBgColor, 
          borderColor: isFooterDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          color: footerTextColor 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            <div className="space-y-6">
              <Link to="/" className="inline-block">
                {logoUrl ? (
                  <img src={logoUrl} alt={siteTitle} className={`h-10 object-contain transition-all ${isFooterDark ? 'brightness-0 invert opacity-90' : 'grayscale opacity-90 hover:grayscale-0 hover:opacity-100'}`} />
                ) : (
                  <span className="text-2xl font-black tracking-tight uppercase" style={{ color: footerTextColor }}>
                    {siteTitle}
                  </span>
                )}
              </Link>
              <p className="text-sm leading-relaxed opacity-90">
                {footerData.sobreTexto || 'Oferecemos os melhores produtos com a melhor qualidade. A sua satisfação e segurança são a nossa prioridade número um.'}
              </p>
              
              {socialMedia && (
                <div className="flex items-center gap-4 pt-2">
                  {socialMedia.FACEBOOK_ATIVO && socialMedia.LINK_FACEBOOK && (
                    <a href={socialMedia.LINK_FACEBOOK} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isFooterDark ? 'bg-white/10 hover:bg-[#1877F2] hover:text-white text-white' : 'bg-black/5 text-black hover:bg-[#1877F2] hover:text-white'}`} title="Facebook">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                    </a>
                  )}
                  {socialMedia.INSTAGRAM_ATIVO && socialMedia.LINK_INSTAGRAM && (
                    <a href={socialMedia.LINK_INSTAGRAM} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isFooterDark ? 'bg-white/10 hover:bg-[#E4405F] hover:text-white text-white' : 'bg-black/5 text-black hover:bg-[#E4405F] hover:text-white'}`} title="Instagram">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                  )}
                  {socialMedia.TIKTOK_ATIVO && socialMedia.LINK_TIKTOK && (
                    <a href={socialMedia.LINK_TIKTOK} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isFooterDark ? 'bg-white/10 hover:bg-white hover:text-black text-white' : 'bg-black/5 text-black hover:bg-black hover:text-white'}`} title="TikTok">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.8-5.46-.4-2.51.34-5.08 1.98-7.05 1.4-1.65 3.44-2.65 5.6-2.89l.06 4.3c-1.15.14-2.22.69-2.93 1.61-.69.87-1.01 1.98-.89 3.09.11 1.05.7 1.99 1.54 2.56.88.58 1.98.74 3 .47 1.12-.26 2.06-1.01 2.45-2.07.28-.73.34-1.53.33-2.31-.03-5.32-.01-10.64-.02-15.96z"/></svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-bold mb-6 uppercase tracking-wider text-xs">Navegação</h4>
              <ul className="space-y-4 text-sm">
                {footerData.linksRapidos.length > 0 ? (
                  footerData.linksRapidos.map(link => <li key={link.id_link}>{renderLink(link)}</li>)
                ) : (
                  <>
                    <li><Link to="/busca" className="opacity-90 hover:opacity-100 hover:translate-x-1 transition-all inline-block">Todos os Produtos</Link></li>
                    <li><Link to="/categoria/ofertas" className="opacity-90 hover:opacity-100 hover:translate-x-1 transition-all inline-block">Ofertas da Semana</Link></li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 uppercase tracking-wider text-xs">Ajuda & Suporte</h4>
              <ul className="space-y-4 text-sm mb-8">
                {footerData.ajuda.length > 0 ? (
                  footerData.ajuda.map(link => <li key={link.id_link}>{renderLink(link)}</li>)
                ) : (
                  <>
                    <li><Link to="/pedidos" className="opacity-90 hover:opacity-100 hover:translate-x-1 transition-all inline-block">Rastrear Pedido</Link></li>
                    <li><Link to="/perfil" className="opacity-90 hover:opacity-100 hover:translate-x-1 transition-all inline-block">Minha Conta</Link></li>
                  </>
                )}
              </ul>
              <h4 className="font-bold mb-3 uppercase tracking-wider text-xs">Atendimento</h4>
              <p className="text-sm opacity-90">Seg a Sex das 08h às 18h</p>
            </div>

            <div>
              <h4 className="font-bold mb-4 uppercase tracking-wider text-xs">Formas de Pagamento</h4>
              <div className="flex gap-2 flex-wrap mb-8">
                {['PIX', 'VISA', 'MASTER', 'BOLETO'].map(metodo => (
                  <div key={metodo} className={`h-8 w-12 border rounded shadow-sm flex items-center justify-center text-[10px] font-bold transition-colors cursor-default ${isFooterDark ? 'bg-white/10 border-white/20 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
                    {metodo}
                  </div>
                ))}
              </div>
              
              <h4 className="font-bold mb-4 uppercase tracking-wider text-xs">Segurança</h4>
              <div className="flex flex-col gap-3">
                <div className={`flex items-center gap-3 border px-3 py-2.5 rounded-lg shadow-sm transition-shadow cursor-default ${isFooterDark ? 'bg-white/5 border-white/20' : 'bg-black/5 border-black/10'}`}>
                  <div className={`p-1.5 rounded-full ${isFooterDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <div className="flex flex-col leading-none gap-0.5">
                    <span className={`text-[10px] uppercase tracking-widest font-semibold ${isFooterDark ? 'text-white/70' : 'text-black/70'}`}>Certificado SSL</span>
                    <span className={`text-xs font-extrabold ${isFooterDark ? 'text-white' : 'text-black'}`}>Ambiente 100% Seguro</span>
                  </div>
                </div>

                <div className={`flex items-center gap-3 border px-3 py-2.5 rounded-lg shadow-sm transition-shadow cursor-default ${isFooterDark ? 'bg-white/5 border-white/20' : 'bg-black/5 border-black/10'}`}>
                  <div className={`p-1.5 rounded-full ${isFooterDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <div className="flex flex-col leading-none gap-0.5">
                    <span className={`text-[10px] uppercase tracking-widest font-semibold ${isFooterDark ? 'text-white/70' : 'text-black/70'}`}>Compra Garantida</span>
                    <span className={`text-xs font-extrabold ${isFooterDark ? 'text-white' : 'text-black'}`}>Seus Dados Protegidos</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className={`pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4 ${isFooterDark ? 'border-white/20' : 'border-black/10'}`}>
            
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 w-full md:w-auto">
              <p className="text-sm text-center md:text-left opacity-90">
                &copy; {new Date().getFullYear()} {siteTitle}. Todos os direitos reservados.
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-x-3 gap-y-2 text-[11px] md:text-xs opacity-90">
                <Link to="/termos" className="hover:underline hover:opacity-100 transition-opacity">Termos de Uso</Link>
                <span className="opacity-40">|</span>
                <Link to="/privacidade" className="hover:underline hover:opacity-100 transition-opacity">Privacidade</Link>
                <span className="opacity-40">|</span>
                <Link to="/entrega" className="hover:underline hover:opacity-100 transition-opacity">Entregas</Link>
                <span className="opacity-40">|</span>
                <Link to="/trocas" className="hover:underline hover:opacity-100 transition-opacity">Trocas</Link>
              </div>
            </div>
            
            <div className={`text-sm flex items-center gap-1.5 transition-opacity cursor-default ${isFooterDark ? 'text-white/70' : 'text-black/70'}`}>
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span>Tecnologia por <span className="font-bold" style={{ color: footerTextColor }}>Ararinha Cloud</span></span>
            </div>
          </div>
          
        </div>
      </footer>

      {socialMedia?.WHATSAPP_ATIVO && socialMedia.WHATSAPP_NUMERO && (
        <a 
          href={`https://wa.me/${socialMedia.WHATSAPP_NUMERO.replace(/\D/g, '')}?text=${encodeURIComponent(socialMedia.WHATSAPP_MENSAGEM || '')}`}
          target="_blank" 
          rel="noopener noreferrer"
          // 🟢 MÁGICA AQUI: bottom-24 no mobile, bottom-6 no desktop
          className="fixed bottom-[90px] md:bottom-6 right-4 md:right-6 bg-[#25D366] text-white w-14 h-14 rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all z-50 flex items-center justify-center"
          title="Fale conosco pelo WhatsApp"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </>
  );
};