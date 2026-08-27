import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ProductCard, type Produto } from '../../components/ProductCard';
import { useStoreConfig } from '../../contexts/StoreConfigContext'; 
import { Carousel } from '../../components/module/Carousel';
import { Highlights } from '../../components/module/Highlights';
import { MarketingBanners } from '../../components/module/MarketingBanners';
import { PopupComunicado } from '../../components/module/PopupComunicado';
import { HeroBanner } from '../../components/module/HeroBanner';

interface BannerLateral {
  id_banner?: number;
  id_campanha?: number;
  titulo: string;
  imagem_url: string;
  posicao: 'esquerda' | 'direita';
  tipo_filtro: string;
  valor_filtro: string;
}

export const Home = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [banners, setBanners] = useState<BannerLateral[]>([]);
  const [layoutOrder, setLayoutOrder] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState('');

  const { appearance } = useStoreConfig();
  const primaryBg = appearance?.BTN_PRIMARY_BG || '#2563EB';

  useEffect(() => {
    const fetchData = async () => {
      const tenantAtual = localStorage.getItem('tenantId') || '1';
      if (!localStorage.getItem('tenantId')) localStorage.setItem('tenantId', '1');

      try {
        const [resProdutos, resBanners, resLayout] = await Promise.all([
          api.get('/produtos'),
          api.get(`/banners/active/${tenantAtual}`).catch(() => ({ data: [] })),
          api.get('/configuracoes/homepage-layout').catch(() => ({ data: null }))
        ]);

        setProdutos(resProdutos.data);
        
        const fetchedBanners = Array.isArray(resBanners.data) ? resBanners.data : [];
        setBanners(fetchedBanners);

        const savedLayout = resLayout.data || [];
        let finalLayout: any[] = [];

        if (savedLayout.length > 0) {
            finalLayout = savedLayout.filter((item: any) => item.id !== 'side_banners');

            // 🟢 TRAVA DE SEGURANÇA: Se o layout é antigo e não tem o hero_banner, injeta ele no topo!
            if (!finalLayout.some(item => item.id === 'hero_banner')) {
                finalLayout.unshift({ id: 'hero_banner' });
            }

            fetchedBanners.forEach(banner => {
                const bannerId = `side_banner_${banner.id_banner || banner.id_campanha}`;
                const alreadyInLayout = finalLayout.some(item => item.id === bannerId);
                
                if (!alreadyInLayout) {
                    const productIndex = finalLayout.findIndex(item => item.id === 'products');
                    if (productIndex !== -1) {
                        finalLayout.splice(productIndex, 0, { id: bannerId });
                    } else {
                        finalLayout.push({ id: bannerId });
                    }
                }
            });
        } else {
            finalLayout = [
                { id: 'hero_banner' },
                { id: 'carousel' },
                { id: 'features' },
                { id: 'marketing' }
            ];
            
            fetchedBanners.forEach(banner => {
                finalLayout.push({ id: `side_banner_${banner.id_banner || banner.id_campanha}` });
            });

            finalLayout.push({ id: 'products' });
        }

        setLayoutOrder(finalLayout);

      } catch (error: any) {
        console.error(error);
        setErro('Não foi possível carregar a vitrine no momento.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderSection = (section: any) => {
      
      if (String(section.id).startsWith('side_banner_')) {
          const idString = section.id.replace('side_banner_', '');
          const banner = banners.find(b => String(b.id_banner) === idString || String(b.id_campanha) === idString);

          if (!banner) return null; 

          let relacionados = produtos;
          if (banner.tipo_filtro === 'categoria') {
             relacionados = produtos.filter(p => JSON.stringify(p).toLowerCase().includes(banner.valor_filtro.toLowerCase()));
          } else if (banner.tipo_filtro === 'busca') {
             relacionados = produtos.filter(p => p.nome.toLowerCase().includes(banner.valor_filtro.toLowerCase()));
          }
          const produtosExibicao = relacionados.length > 0 ? relacionados.slice(0, 8) : produtos.slice(0, 8);

          return (
            <div key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 border-l-4 pl-3" style={{ borderColor: primaryBg }}>
                  {banner.titulo || 'Ofertas Especiais'}
                </h2>
                {banner.tipo_filtro !== 'url' && (
                  <Link to={banner.tipo_filtro === 'categoria' ? `/categoria/${banner.valor_filtro}` : `/busca?q=${banner.valor_filtro}`} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                    Ver mais
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                )}
              </div>

              <div className={`flex flex-col xl:flex-row gap-4 sm:gap-6 ${banner.posicao === 'direita' ? 'xl:flex-row-reverse' : ''}`}>
                <div className="w-full xl:w-[320px] flex-shrink-0 h-[200px] sm:h-[300px] xl:h-auto">
                  <a href={banner.tipo_filtro === 'url' ? banner.valor_filtro : '#'} target={banner.tipo_filtro === 'url' ? "_blank" : "_self"} className="block w-full h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group border border-gray-100 bg-white">
                    <img src={banner.imagem_url} alt={banner.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                  </a>
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x hide-scrollbar">
                    {produtosExibicao.map(p => ( 
                        <div key={p.id_produto} className="w-[160px] sm:w-[220px] md:w-[240px] flex-shrink-0 snap-start">
                            <ProductCard produto={p} />
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
      }

      switch (section.id) {
          case 'carousel':
              return <div key="carousel" className="animate-in fade-in duration-700"><Carousel /></div>;
              
          case 'features':
              return <div key="features" className="animate-in fade-in duration-700"><Highlights /></div>;
              
          case 'marketing':
              return (
                  <div key="marketing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 animate-in fade-in duration-700">
                      <MarketingBanners />
                  </div>
              );
              
          case 'hero_banner':
              return <HeroBanner key="hero_banner" />; 
              
          case 'products':
              return (
                  <div key="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      {!isLoading && !erro && produtos.length > 0 && (
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 border-l-4 pl-3" style={{ borderColor: primaryBg }}>
                          Todos os Produtos
                        </h2>
                      )}

                      {isLoading && (
                        <div className="flex flex-col justify-center items-center h-64 gap-4">
                          <div className="animate-spin rounded-full h-14 w-14 border-b-4" style={{ borderColor: primaryBg }}></div>
                        </div>
                      )}

                      {erro && !isLoading && (
                        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-red-100 shadow-sm text-center">
                          <svg className="w-16 h-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Ops, algo deu errado!</h3>
                          <p className="text-gray-500">{erro}</p>
                        </div>
                      )}

                      {!isLoading && !erro && produtos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                          {produtos.map((produto) => (
                            <ProductCard key={produto.id_produto} produto={produto} />
                          ))}
                        </div>
                      )}
                  </div>
              );

          default: 
              return null;
      }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PopupComunicado />

      <main className="pb-24">
         {layoutOrder.map((section) => renderSection(section))}
      </main>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};