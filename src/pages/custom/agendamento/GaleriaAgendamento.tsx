import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useStoreConfig } from '../../../contexts/StoreConfigContext';

interface GaleriaImagem {
  id: string;
  url: string;
}

interface GaleriaConfig {
  bgColor: string;
  titleColor: string;
  subtitleColor: string;
  imagens: GaleriaImagem[];
}

export const GaleriaAgendamento: React.FC = () => {
  const [config, setConfig] = useState<GaleriaConfig>({ 
      bgColor: 'transparent', 
      titleColor: '#111827', 
      subtitleColor: '#6B7280', 
      imagens: [] 
  });
  const [loading, setLoading] = useState(true);
  
  // Puxamos a cor base da loja caso o dono não tenha configurado as cores do texto ainda
  const { appearance } = useStoreConfig();
  const fallbackTextColor = appearance?.SITE_TEXT_COLOR || '#111827';

  useEffect(() => {
    const fetchGaleria = async () => {
      try {
        const tenantAtual = localStorage.getItem('tenantId') || '1';
        const res = await api.get(`/configuracoes/GALERIA_AGENDAMENTO?tenant_id=${tenantAtual}`).catch(() => ({ data: null }));
        
        if (res.data && res.data.valor) {
            const parsed = JSON.parse(res.data.valor);
            if (Array.isArray(parsed)) {
                setConfig({ bgColor: 'transparent', titleColor: fallbackTextColor, subtitleColor: fallbackTextColor, imagens: parsed });
            } else {
                setConfig({
                    bgColor: parsed.bgColor || 'transparent',
                    titleColor: parsed.titleColor || fallbackTextColor,
                    subtitleColor: parsed.subtitleColor || fallbackTextColor,
                    imagens: parsed.imagens || []
                });
            }
        }
      } catch (error) {
        console.error("Erro ao carregar Galeria", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGaleria();
  // eslint-disable-next-line
  }, []);

  if (loading || config.imagens.length === 0) {
      return null; 
  }

  return (
    <section 
        className="w-full animate-in fade-in duration-700 py-12 mb-8"
        style={{ backgroundColor: config.bgColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-6 text-center sm:text-left">
            {/* 🟢 COR DO TÍTULO AQUI */}
            <h2 className="text-3xl font-bold" style={{ color: config.titleColor }}>
                Galeria de Trabalhos
            </h2>
            {/* 🟢 COR DO SUBTÍTULO AQUI */}
            <p className="mt-2 font-medium opacity-90" style={{ color: config.subtitleColor }}>
                Confira alguns dos nossos resultados.
            </p>
          </div>
          
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 snap-x hide-scrollbar">
            {config.imagens.map((img) => (
              <div 
                key={img.id} 
                className="min-w-[240px] h-[240px] sm:min-w-[300px] sm:h-[300px] flex-shrink-0 snap-start rounded-2xl overflow-hidden shadow-sm group cursor-pointer border border-gray-200/20"
              >
                <img
                  src={img.url}
                  alt="Trabalho Realizado"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            ))}
          </div>

      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};