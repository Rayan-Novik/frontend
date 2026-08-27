import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Banner {
  id_banner: number;
  titulo: string;
  imagem_url: string;
  posicao: 'esquerda' | 'direita';
  tipo_filtro: 'categoria' | 'busca' | 'url';
  valor_filtro: string;
}

interface SideBannersProps {
  position: 'esquerda' | 'direita';
}

export const SideBanners = ({ position }: SideBannersProps) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const tenantId = localStorage.getItem('tenantId') || '1';
        // Bate na rota corrigida
        const res = await api.get(`/banners/active/${tenantId}`);
        
        if (Array.isArray(res.data)) {
          // Filtra os banners para mostrar apenas os da posição escolhida
          const filteredBanners = res.data.filter(b => b.posicao === position);
          setBanners(filteredBanners);
        }
      } catch (error) {
        console.error("Erro ao buscar banners laterais:", error);
      }
    };

    fetchBanners();
  }, [position]);

  const handleClick = (banner: Banner, e: React.MouseEvent) => {
    if (banner.tipo_filtro === 'url') {
      // Se for URL externa, deixa a tag <a> padrão do navegador cuidar disso
      return;
    }
    
    // Se for navegação interna, previne o recarregamento e usa o React Router
    e.preventDefault();
    if (banner.tipo_filtro === 'categoria') {
      navigate(`/categoria/${banner.valor_filtro.toLowerCase()}`);
    } else if (banner.tipo_filtro === 'busca') {
      navigate(`/busca?q=${banner.valor_filtro}`);
    }
  };

  if (banners.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[250px] mx-auto xl:mx-0 sticky top-24">
      {banners.map((banner) => {
        // Decide se é link externo (a) ou interno (Link) apenas pelo tipo de filtro
        const isExternal = banner.tipo_filtro === 'url';

        return isExternal ? (
          <a 
            key={banner.id_banner}
            href={banner.valor_filtro}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group bg-white border border-gray-100"
          >
            <img 
              src={banner.imagem_url} 
              alt={banner.titulo} 
              className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </a>
        ) : (
          <a 
            key={banner.id_banner}
            href="#"
            onClick={(e) => handleClick(banner, e)}
            className="block w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group bg-white border border-gray-100"
          >
            <img 
              src={banner.imagem_url} 
              alt={banner.titulo} 
              className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </a>
        );
      })}
    </div>
  );
};