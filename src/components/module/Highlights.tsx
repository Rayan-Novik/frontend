import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Destaque {
  id_destaque: number;
  imagem_url: string;
  link_url?: string;
  titulo?: string;
  ordem?: number;
}

export const Highlights = () => {
  const [destaques, setDestaques] = useState<Destaque[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDestaques = async () => {
      try {
        const tenantId = localStorage.getItem('tenantId') || '1';
        
        // Bate na nossa rota corrigida do backend
        const res = await api.get(`/destaques/active/${tenantId}`);
        
        if (Array.isArray(res.data)) {
            setDestaques(res.data);
        }
      } catch (error) {
        console.error("Erro ao buscar destaques:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDestaques();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6 overflow-x-hidden">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex flex-col items-center gap-3 animate-pulse">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full"></div>
            <div className="w-16 h-3 bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  // Se não houver destaques cadastrados, ele simplesmente não renderiza nada e some da tela (não fica um buraco feio)
  if (destaques.length === 0) return null;

  return (
    <div className="w-full bg-white border-b border-gray-100 shadow-sm mb-8 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Container com scroll horizontal (esconde a barra de scroll nativa) */}
        <div className="flex gap-6 sm:gap-8 overflow-x-auto pb-4 pt-2 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          
          {destaques.map((item) => (
            <Link 
              key={item.id_destaque} 
              to={item.link_url || '#'} 
              className="flex flex-col items-center gap-3 min-w-[80px] sm:min-w-[100px] snap-start group"
            >
              {/* Círculo da Imagem com borda animada */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-gray-200 to-gray-100 group-hover:from-blue-500 group-hover:to-blue-400 transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <img 
                    src={item.imagem_url} 
                    alt={item.titulo || 'Destaque'} 
                    className="w-full h-full rounded-full object-cover object-center"
                  />
                </div>
              </div>

              {/* Título do destaque */}
              {item.titulo && (
                <span className="text-xs sm:text-sm font-semibold text-gray-700 text-center line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {item.titulo}
                </span>
              )}
            </Link>
          ))}
          
        </div>
      </div>

      {/* Estilo embutido para esconder a barra de rolagem no Chrome/Safari caso as classes do Tailwind falhem */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}</style>
    </div>
  );
};