import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Campanha {
  id_campanha: number;
  nome: string;
  slug: string;
  descricao: string;
  cor_tema: string;
  imagem_url: string;
}

export const MarketingBanners = () => {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const tenantId = localStorage.getItem('tenantId') || '1';
        const res = await api.get(`/marketing/active/${tenantId}`);
        if (Array.isArray(res.data)) setCampanhas(res.data);
      } catch (error) {
        console.error("Erro ao buscar campanhas:", error);
      }
    };
    fetchCampaigns();
  }, []);

  const handleTrackClick = (slug: string) => {
    const tenantId = localStorage.getItem('tenantId') || '1';
    api.get(`/marketing/track/${slug}/${tenantId}`).catch(() => {});
  };

  if (campanhas.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campanhas.map((campanha) => (
          <Link 
            key={campanha.id_campanha} 
            to={`/campanha/${campanha.slug}`}
            onClick={() => handleTrackClick(campanha.slug)}
            className="group relative overflow-hidden rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 min-h-[200px] flex items-center p-8"
            style={{ backgroundColor: campanha.cor_tema || '#2563EB' }}
          >
            {/* Imagem de Fundo (se houver) */}
            {campanha.imagem_url && (
              <img 
                src={campanha.imagem_url} 
                alt={campanha.nome} 
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700 mix-blend-overlay"
              />
            )}
            
            <div className="relative z-10 text-white max-w-md">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                Oferta Especial
              </span>
              <h3 className="text-3xl font-black mb-2 drop-shadow-md leading-tight">
                {campanha.nome}
              </h3>
              <p className="text-white/90 text-sm font-medium drop-shadow mb-6 line-clamp-2">
                {campanha.descricao}
              </p>
              <span className="inline-flex items-center gap-2 font-bold text-sm bg-white text-gray-900 px-5 py-2.5 rounded-xl group-hover:bg-gray-50 transition-colors shadow-sm">
                Ver Produtos
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};