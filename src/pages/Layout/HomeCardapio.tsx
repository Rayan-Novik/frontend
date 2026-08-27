import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../services/api';
// 🟢 AQUI ESTAVA O ERRO! Trocamos para importar o PAI (ProductCard)
import { ProductCard, type Produto } from '../../components/ProductCard';
import { useStoreConfig } from '../../contexts/StoreConfigContext';

export const HomeCardapio = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  const { appearance } = useStoreConfig();
  const primaryBg = appearance?.BTN_PRIMARY_BG || '#0d6efd'; 
  const headerSecondaryColor = appearance?.HEADER_SECONDARY_COLOR || '#ffffff';
  const siteTitle = appearance?.SITE_TITLE || 'Nosso Restaurante';

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await api.get('/produtos');
        setProdutos(response.data);
      } catch (error) {
        console.error('Erro ao carregar cardápio:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const cardapioAgrupado = useMemo(() => {
    return produtos.reduce((acc, produto: any) => {
      const nomeCategoria = produto.categorias?.nome || 'Menu Principal';
      if (!acc[nomeCategoria]) acc[nomeCategoria] = [];
      acc[nomeCategoria].push(produto);
      return acc;
    }, {} as Record<string, Produto[]>);
  }, [produtos]);

  const categorias = ['Todos', ...Object.keys(cardapioAgrupado)];

  useEffect(() => {
    const activeBtn = scrollRef.current?.querySelector('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeCategory]);

  const scrollToCategory = (categoria: string) => {
    setActiveCategory(categoria);
    if (categoria === 'Todos') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(`categoria-${categoria}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const getCategoryIcon = (catName: string) => {
    const name = catName.toLowerCase();
    if (name === 'todos') return 'bi-grid';
    if (name.includes('entrada') || name.includes('porç')) return 'bi-egg-fried';
    if (name.includes('massa')) return 'bi-bezier2';
    if (name.includes('bebida') || name.includes('suco')) return 'bi-cup-straw';
    if (name.includes('sobremesa') || name.includes('doce')) return 'bi-cake2';
    return 'bi-shop'; 
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: primaryBg }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-800">
      
      {/* 🟢 ABAS DE CATEGORIAS (MANTIDO EXATAMENTE DO MESMO TAMANHO E FORMATO) */}
      <div 
        className="sticky top-[60px] md:top-[65px] z-20 border-b border-gray-100 transition-colors duration-300"
        style={{ backgroundColor: headerSecondaryColor }}
      >
        <div
          ref={scrollRef}
          className="max-w-2xl mx-auto px-4 py-2 flex gap-1 overflow-x-auto no-scrollbar"
        >
          {categorias.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                data-active={isActive}
                onClick={() => scrollToCategory(cat)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-w-[70px] ${
                  isActive ? "text-blue-600" : "text-gray-500 hover:bg-gray-50"
                }`}
                style={isActive ? { color: primaryBg, backgroundColor: `${primaryBg}15` } : {}}
              >
                <span 
                  className={`p-2 rounded-xl flex items-center justify-center text-lg ${isActive ? "text-white" : "bg-gray-100 text-gray-500"}`}
                  style={isActive ? { backgroundColor: primaryBg } : {}}
                >
                  <i className={`bi ${getCategoryIcon(cat)}`}></i>
                </span>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 mt-6">
        {Object.keys(cardapioAgrupado).length === 0 ? (
          <div className="text-center py-20">
            <i className="bi bi-emoji-frown text-4xl text-gray-300 mb-3 block"></i>
            <p className="text-gray-400 text-sm">Nenhum item encontrado.</p>
          </div>
        ) : (
          Object.keys(cardapioAgrupado).map((categoria) => (
            <section key={categoria} id={`categoria-${categoria}`} className="mb-8 scroll-mt-36">
              <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">
                {categoria}
              </h2>
              
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {cardapioAgrupado[categoria].map((produto) => (
                  // 🟢 A MÁGICA ACONTECE AQUI! O React agora vai desenhar o "Gerente do Modal"
                  <ProductCard 
                    key={produto.id_produto} 
                    produto={produto} 
                  />
                ))}
              </div>
            </section>
          ))
        )}

        <footer className="text-center py-6 mt-4">
          <p className="text-[11px] text-gray-400 font-medium">
            © {new Date().getFullYear()} {siteTitle} · Cardápio Digital
          </p>
        </footer>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.2s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};