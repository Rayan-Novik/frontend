import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api'; 

export const CustomLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const tenantAtual = localStorage.getItem('tenantId') || '1';
        const res = await api.get(`/configuracoes/LANDING_PAGE_CONFIG?tenant_id=${tenantAtual}`);
        
        if (res.data && res.data.valor) {
            setConfig(JSON.parse(res.data.valor));
        }
      } catch (error) {
        console.error("Erro ao carregar Custom Landing Page", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  if (loading) {
      return (
          <div className="w-full flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
          </div>
      );
  }

  // Se o lojista não configurou nenhum bloco, a div simplesmente não aparece na Home
  if (!config || !config.blocks || config.blocks.length === 0) {
      return null; 
  }

  const { pageSettings, blocks } = config;

  const handleAction = (type: string, value: string) => {
      if (type === 'url') {
          window.open(value, '_blank');
      } else if (type === 'produto') {
          navigate(`/agendar/${value}`); 
      } else if (type === 'categoria') {
          navigate(`/search?category=${value}`);
      } else if (type === 'scroll_services') {
          window.scrollBy({ top: 600, behavior: 'smooth' });
      }
  };

  return (
    // 🟢 REMOVIDAS AS BORDAS ARREDONDADAS! AGORA ELE É FULL-WIDTH (W-FULL)
    <div 
        className="w-full flex flex-col items-center py-16 px-4 overflow-hidden"
        style={{ backgroundColor: pageSettings.backgroundColor }}
    >
        <div className="w-full max-w-4xl flex flex-col items-center text-center">
            
            {blocks.map((block: any) => {
                switch (block.type) {
                    case 'logo':
                    case 'image':
                        return (
                            <img 
                                key={block.id} 
                                src={block.url || '/placeholder.png'} 
                                alt="Banner Editável" 
                                style={{ width: `${block.width}px`, maxWidth: '100%' }}
                                className={`mb-6 object-contain ${block.rounded ? 'rounded-full aspect-square object-cover' : ''}`}
                            />
                        );
                    
                    case 'h1':
                        return (
                            <h1 
                                key={block.id} 
                                className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight px-2"
                                style={{ color: block.color }}
                            >
                                {block.text}
                            </h1>
                        );

                    case 'h2':
                        return (
                            <h2 
                                key={block.id} 
                                className="text-2xl sm:text-3xl font-bold mb-4 px-2"
                                style={{ color: block.color }}
                            >
                                {block.text}
                            </h2>
                        );

                    case 'p':
                        return (
                            <p 
                                key={block.id} 
                                className="text-lg sm:text-xl font-medium mb-6 opacity-90 px-4 max-w-3xl"
                                style={{ color: block.color }}
                            >
                                {block.text}
                            </p>
                        );

                    case 'button':
                        return (
                            <button
                                key={block.id}
                                onClick={() => handleAction(block.actionType, block.actionValue)}
                                className="px-10 py-4 rounded-full font-black text-xl mb-6 hover:scale-105 transition-transform shadow-lg w-full sm:w-auto min-w-[280px]"
                                style={{ backgroundColor: block.bgColor, color: block.textColor }}
                            >
                                {block.text}
                            </button>
                        );

                    case 'spacer':
                        return <div key={block.id} style={{ height: `${block.height}px`, width: '100%' }}></div>;

                    default:
                        return null;
                }
            })}

        </div>
    </div>
  );
};