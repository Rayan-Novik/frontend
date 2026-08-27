import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface AppearanceConfig {
  BODY_BG_COLOR: string;
  SITE_TEXT_COLOR: string;
  BTN_PRIMARY_BG: string;
  BTN_PRIMARY_TEXT: string;
  HEADER_PRIMARY_COLOR: string;
  HEADER_SECONDARY_COLOR: string;
  FOOTER_COLOR: string;
  LOGO_URL: string;
  FAVICON_URL: string;
  SITE_TITLE: string;
  STORE_LAYOUT_STYLE: string;
  PIX_DESCONTO_ATIVO?: boolean;
  PIX_DESCONTO_PORCENTAGEM?: number;
}

interface StoreConfigContextType {
  appearance: AppearanceConfig;
  layout: any[]; 
  isLoadingConfig: boolean;
}

const defaultAppearance: AppearanceConfig = {
  BODY_BG_COLOR: '#F8FAFC',
  SITE_TEXT_COLOR: '#1F2937',
  BTN_PRIMARY_BG: '#2563EB',
  BTN_PRIMARY_TEXT: '#FFFFFF',
  HEADER_PRIMARY_COLOR: '#FFFFFF',
  HEADER_SECONDARY_COLOR: '#F8F9FA',
  FOOTER_COLOR: '#111827',
  LOGO_URL: '',
  FAVICON_URL: '',
  SITE_TITLE: 'Carregando...',
  STORE_LAYOUT_STYLE: 'ECOMMERCE',
  PIX_DESCONTO_ATIVO: false,
  PIX_DESCONTO_PORCENTAGEM: 0
};

const StoreConfigContext = createContext<StoreConfigContextType>({} as StoreConfigContextType);

const forceUpdateFavicon = (url: string) => {
  if (!url) return;

  const urlSemCache = `${url}?v=${new Date().getTime()}`;

  document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove());

  const link1 = document.createElement('link');
  link1.rel = 'icon';
  link1.type = 'image/png';
  link1.href = urlSemCache;

  const link2 = document.createElement('link');
  link2.rel = 'shortcut icon';
  link2.href = urlSemCache;

  document.head.appendChild(link1);
  document.head.appendChild(link2);
};

export const StoreConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [appearance, setAppearance] = useState<AppearanceConfig>(defaultAppearance);
  const [layout, setLayout] = useState<any[]>(['banner', 'vitrine']); 
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    const fetchStoreConfig = async () => {
      try {
        const hostname = window.location.hostname;
        
        let slug = hostname.replace('.ararinhacloud.shop', '').replace('.localhost', '');
        
        // 🟢 Correção: Removemos o hardcode. 
        // Se acessar direto 'localhost', ele tenta pegar o slug do painel logado.
        if (slug === 'localhost' || slug === '127.0.0.1') {
          slug = localStorage.getItem('tenantSlug') || 'default'; 
        }

        const res = await api.get(`/configuracoes/public/${slug}`); 
        console.log("🚨 RESPOSTA DA API CONFIG:", res.data);
        console.log("🚨 LAYOUT RECEBIDO DO BANCO:", res.data.STORE_LAYOUT_STYLE);
        
        if (res.data) {
          setAppearance({
            BODY_BG_COLOR: res.data.BODY_BG_COLOR || defaultAppearance.BODY_BG_COLOR,
            SITE_TEXT_COLOR: res.data.SITE_TEXT_COLOR || defaultAppearance.SITE_TEXT_COLOR,
            BTN_PRIMARY_BG: res.data.BTN_PRIMARY_BG || defaultAppearance.BTN_PRIMARY_BG,
            BTN_PRIMARY_TEXT: res.data.BTN_PRIMARY_TEXT || defaultAppearance.BTN_PRIMARY_TEXT,
            HEADER_PRIMARY_COLOR: res.data.HEADER_PRIMARY_COLOR || defaultAppearance.HEADER_PRIMARY_COLOR,
            HEADER_SECONDARY_COLOR: res.data.HEADER_SECONDARY_COLOR || defaultAppearance.HEADER_SECONDARY_COLOR,
            FOOTER_COLOR: res.data.FOOTER_COLOR || defaultAppearance.FOOTER_COLOR,
            LOGO_URL: res.data.LOGO_URL || '',
            FAVICON_URL: res.data.FAVICON_URL || '',
            SITE_TITLE: res.data.SITE_TITLE || 'Minha Loja',
            STORE_LAYOUT_STYLE: res.data.STORE_LAYOUT_STYLE || 'ECOMMERCE',
            PIX_DESCONTO_ATIVO: res.data.PIX_DESCONTO_ATIVO || false,
            PIX_DESCONTO_PORCENTAGEM: res.data.PIX_DESCONTO_PORCENTAGEM || 0
          });

          if (res.data.HOMEPAGE_LAYOUT) {
            setLayout(JSON.parse(res.data.HOMEPAGE_LAYOUT));
          }
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchStoreConfig();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--body-bg', appearance.BODY_BG_COLOR);
    root.style.setProperty('--text-color', appearance.SITE_TEXT_COLOR);
    root.style.setProperty('--primary-bg', appearance.BTN_PRIMARY_BG);
    root.style.setProperty('--primary-text', appearance.BTN_PRIMARY_TEXT);
    root.style.setProperty('--header-bg', appearance.HEADER_PRIMARY_COLOR);
    root.style.setProperty('--header-secondary-bg', appearance.HEADER_SECONDARY_COLOR); 
    root.style.setProperty('--footer-bg', appearance.FOOTER_COLOR);                    
    
    if (appearance.FAVICON_URL) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const apiBaseUrl = apiUrl.replace('/api', '');
      const cleanPath = appearance.FAVICON_URL.startsWith('/') ? appearance.FAVICON_URL : `/${appearance.FAVICON_URL}`;
      const fullUrl = appearance.FAVICON_URL.startsWith('http') ? appearance.FAVICON_URL : `${apiBaseUrl}${cleanPath}`;
      
      forceUpdateFavicon(fullUrl);
    }

    if (appearance.SITE_TITLE && appearance.SITE_TITLE !== 'Carregando...') {
      document.title = appearance.SITE_TITLE;
    }
  }, [appearance]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      if (type === 'UPDATE_APPEARANCE') {
        setAppearance(prev => ({ ...prev, ...data }));
      }
      if (type === 'UPDATE_LAYOUT') {
        setLayout(data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <StoreConfigContext.Provider value={{ appearance, layout, isLoadingConfig }}>
      {children}
    </StoreConfigContext.Provider>
  );
};

export const useStoreConfig = () => useContext(StoreConfigContext);