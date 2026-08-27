import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ProductCard, type Produto } from '../components/ProductCard';

export const CampaignPage = () => {
  const { slug } = useParams();
  const [campanha, setCampanha] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCampaignData = async () => {
      const tenantId = localStorage.getItem('tenantId') || '1';
      try {
        const res = await api.get(`/marketing/campaign/${slug}/${tenantId}`);
        setCampanha(res.data);
      } catch (error) {
        console.error("Erro ao carregar campanha:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaignData();
  }, [slug]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div></div>;
  }

  if (!campanha) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Campanha Encerrada</h2>
        <p className="text-gray-500 mb-6">Esta campanha não está mais disponível.</p>
        <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Voltar para a Loja</Link>
      </div>
    );
  }

  // Extrai os produtos que vieram na relação do Prisma
  const produtosDaCampanha: Produto[] = campanha.campanha_marketing_produtos?.map((item: any) => item.produtos) || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      
      {/* HEADER DA CAMPANHA (Usa as cores cadastradas no painel!) */}
      <div 
        className="py-16 sm:py-24 relative overflow-hidden mb-12 shadow-sm"
        style={{ backgroundColor: campanha.cor_tema || '#2563EB' }}
      >
        {campanha.imagem_url && (
          <img src={campanha.imagem_url} alt="Fundo" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 drop-shadow-md">
            {campanha.nome}
          </h1>
          {campanha.descricao && (
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto drop-shadow">{campanha.descricao}</p>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Produtos Selecionados</h2>
          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{produtosDaCampanha.length} itens</span>
        </div>

        {produtosDaCampanha.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500">Nenhum produto foi adicionado a esta campanha ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {produtosDaCampanha.map((produto) => (
              <ProductCard key={produto.id_produto} produto={produto} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};