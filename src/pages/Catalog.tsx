import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { ProductCard, type Produto } from '../components/ProductCard';
import { useStoreConfig } from '../contexts/StoreConfigContext';

// FUNÇÃO INTELIGENTE PARA CALCULAR O CONTRASTE
const getContrastColor = (hexColor: string) => {
  if (!hexColor) return '#1f2937';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1f2937' : '#ffffff';
};

export const Catalog = () => {
  // Lemos as variáveis da Rota padrão (/categoria/eletronicos)
  const { categoria, subcategoria } = useParams(); 
  
  // 🟢 CORREÇÃO 2: Lemos os parâmetros vindos do link gerado no Carrossel (/search?brand=gere)
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';       
  const brandParam = searchParams.get('brand') || searchParams.get('marca') || '';
  const categoryParam = searchParams.get('category') || '';
  const subcategoryParam = searchParams.get('subcategoria') || '';

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState('');

  const storeConfig = useStoreConfig();
  const appearance = storeConfig?.appearance || {} as any;

  // Cores dinâmicas
  const bodyBg = appearance.BODY_BG_COLOR || '#F8FAFC';
  const primaryBg = appearance.BTN_PRIMARY_BG || '#2563EB';
  const primaryTextColor = getContrastColor(primaryBg);

  // 🟢 Define o título da página baseado no que o usuário está buscando
  let tituloPagina = 'Todos os Produtos';
  let subtitulo = 'Explore nossas melhores ofertas';

  const catVal = categoria || categoryParam;
  const subVal = subcategoria || subcategoryParam;

  if (query) {
    tituloPagina = `Resultados da busca`;
    subtitulo = `Mostrando resultados para: "${query}"`;
  } else if (brandParam) {
    tituloPagina = brandParam.charAt(0).toUpperCase() + brandParam.slice(1);
    subtitulo = `Produtos da marca ${tituloPagina}`;
  } else if (subVal) {
    tituloPagina = subVal.charAt(0).toUpperCase() + subVal.slice(1);
    subtitulo = `Produtos da categoria ${tituloPagina}`;
  } else if (catVal) {
    tituloPagina = catVal.charAt(0).toUpperCase() + catVal.slice(1);
    subtitulo = `Explorando o departamento de ${tituloPagina}`;
  }

  useEffect(() => {
    const fetchProdutos = async () => {
      setIsLoading(true);
      setErro('');
      try {
        let endpoint = '/produtos'; // Padrão traz tudo
        let params = {};

        // 🟢 Conectando corretamente com o backend dependendo do tipo de link que foi clicado
        if (query) {
          endpoint = '/produtos/busca';
          params = { q: query };
        } else if (brandParam) {
          endpoint = `/produtos/marca/${encodeURIComponent(brandParam)}`;
        } else if (subVal) {
          endpoint = `/produtos/sub/${encodeURIComponent(subVal)}`;
        } else if (catVal) {
          endpoint = `/produtos/categoria/${encodeURIComponent(catVal)}`;
        }

        const response = await api.get(endpoint, { params });
        setProdutos(response.data);
      } catch (error: any) {
        console.error("Erro ao buscar produtos:", error);
        setErro('Não foi possível carregar os produtos no momento.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProdutos();
  }, [query, brandParam, categoryParam, subcategoryParam, categoria, subcategoria]); 

  return (
    <div className="min-h-screen pb-20 transition-colors duration-300" style={{ backgroundColor: bodyBg }}>
      
      {/* Cabeçalho Dinâmico da Vitrine */}
      <div className="py-12 mb-10 transition-colors duration-300" style={{ backgroundColor: primaryBg }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold mb-2" style={{ color: primaryTextColor }}>
            {tituloPagina}
          </h2>
          <p className="text-lg opacity-90" style={{ color: primaryTextColor }}>
            {subtitulo}
          </p>
        </div>
      </div>

      {/* Área de Produtos */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading && (
          <div className="flex justify-center items-center h-40">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-4 border-t-4 border-transparent" 
              style={{ borderBottomColor: primaryBg, borderTopColor: primaryBg, opacity: 0.5 }}
            ></div>
          </div>
        )}

        {erro && !isLoading && (
          <div className="text-center p-8 bg-red-50 rounded-xl border border-red-200 text-red-600 shadow-sm">
            <p className="font-medium flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {erro}
            </p>
          </div>
        )}

        {/* Estado Vazio */}
        {!isLoading && !erro && produtos.length === 0 && (
          <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-black/5">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryBg}15` }}>
                <svg className="w-10 h-10" style={{ color: primaryBg }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {query ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                )}
                </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {query ? 'Nenhum resultado encontrado' : 'Vitrine vazia'}
            </h3>
            <p className="text-gray-500">
              {query 
                ? `Não encontramos produtos para "${query}". Tente buscar por outros termos.` 
                : `Ainda não há produtos cadastrados em ${tituloPagina}.`}
            </p>
          </div>
        )}

        {/* Grid de Produtos */}
        {!isLoading && !erro && produtos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {produtos.map((produto) => (
              <ProductCard key={produto.id_produto} produto={produto} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};